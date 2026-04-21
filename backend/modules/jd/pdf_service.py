"""
PDF Export Service — Generates LaTeX-based PDFs from JD JSON data.
10 real Wissen-branded templates. Missing sections auto-filled via LLM.
Rich formatting (bold, italic, color) from contentEditable is preserved.
"""
import json
import logging
import re
import shutil
import subprocess
import tempfile
from html.parser import HTMLParser
from pathlib import Path
from typing import Optional

from jinja2 import Environment, FileSystemLoader
from backend.core.groq_client import LLAMA_MODEL, get_groq_client, _llm, _llm_json
from backend.modules.auth.model import TokenLog
from sqlalchemy.orm import Session
from uuid import UUID

logger = logging.getLogger(__name__)

# Global cache to ensure deterministic mapping for a specific JD structure
# This prevents headers from jumping around when switching templates.
_MAPPING_CACHE = {}

TEMPLATES_DIR = Path(__file__).parent.parent.parent / "templates"

# ─── Template Catalog ─────────────────────────────────────────────────────────

TEMPLATE_CATALOG = {
    "t1_classic":  {"file": "t1_classic.tex.j2",  "name": "Classic"},
    "t2_boxed":    {"file": "t2_boxed.tex.j2",    "name": "Boxed"},
    "t3_sidebar":  {"file": "t3_sidebar.tex.j2",  "name": "Sidebar"},
    "t4_logoright": {"file": "t4_logoright.tex.j2", "name": "Logo Right"},
    "t5_twocol":   {"file": "t5_twocol.tex.j2",   "name": "Two Column"},
    "t6_accent":   {"file": "t6_accent.tex.j2",   "name": "Accent"},
    "t7_compact":  {"file": "t7_compact.tex.j2",  "name": "Compact"},
    "t8_split":    {"file": "t8_split.tex.j2",    "name": "Split"},
    "t9_grid":     {"file": "t9_grid.tex.j2",     "name": "Grid"},
    "t10_premium": {"file": "t10_premium.tex.j2", "name": "Premium"},
}

REQUIRED_SECTIONS = [
    "Hiring Title",
    "Job Summary",
    "Key Responsibilities",
    "Qualifications and Required Skills",
    "Good to Have Skills",
    "Soft Skills",
    "About Wissen Technology",
    "Wissen Sites"
]



# ─── Color Extraction ─────────────────────────────────────────────────────────

def _extract_hex_color(style: str) -> Optional[str]:
    """Extract a 6-char RRGGBB hex string from CSS style."""
    m = re.search(r'color\s*:\s*#([0-9a-fA-F]{3,6})', style)
    if m:
        h = m.group(1)
        if len(h) == 3:
            h = ''.join(c * 2 for c in h)
        return h.upper()
    m = re.search(r'color\s*:\s*rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)', style)
    if m:
        return '{:02X}{:02X}{:02X}'.format(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    return None


# ─── LaTeX Escaping (plain text only) ────────────────────────────────────────

def _escape_raw(text: str) -> str:
    """Escape LaTeX special characters in a plain text segment."""
    if not text: return ""
    # Order matters — backslash must be first
    subs = [
        ('\\', r'\textbackslash{}'),
        ('&',  r'\&'),
        ('%',  r'\%'),
        ('$',  r'\$'),
        ('#',  r'\#'),
        ('_',  r'\_'),
        ('{',  r'\{'),
        ('}',  r'\}'),
        ('~',  r'\textasciitilde{}'),
        ('^',  r'\textasciicircum{}'),
        ('\xa0', '~'), # Non-breaking space
        ('<',  r'\textless{}'),
        ('>',  r'\textgreater{}'),
        ('–',  '--'),
        ('—',  '---'),
        ('"',  "''"),
    ]
    for char, repl in subs:
        text = text.replace(char, repl)
    return text


# ─── HTML → LaTeX Converter ───────────────────────────────────────────────────

class _LaTeXBuilder(HTMLParser):
    """Converts contentEditable HTML to LaTeX, preserving rich formatting."""

    VOID_TAGS = {'br', 'hr', 'img'}

    def __init__(self):
        super().__init__()
        self.parts: list[str] = []
        self.stack: list[tuple[str, list[str]]] = []   # (tag, [closers])

    def handle_starttag(self, tag: str, attrs):
        tag = tag.lower()
        props = dict(attrs)
        style = props.get('style', '')

        closers: list[str] = []

        if tag in ('b', 'strong'):
            self.parts.append(r'{\bfseries ')
            closers.append('}')

        elif tag in ('i', 'em'):
            self.parts.append(r'{\itshape ')
            closers.append('}')

        elif tag == 'u':
            self.parts.append(r'\uline{')
            closers.append('}')

        elif tag == 's':
            self.parts.append(r'\sout{')
            closers.append('}')

        elif tag == 'span':
            # Collect transformations from inline style
            color = _extract_hex_color(style)
            # More robust check for bold/italic - browsers often use numeric weights
            is_bold = 'font-weight' in style and any(x in style for x in ['bold', '700', '800', '900'])
            is_italic = 'font-style' in style and any(x in style for x in ['italic', 'oblique'])
            is_underline = 'underline' in style and 'text-decoration' in style

            if is_bold:
                self.parts.append(r'{\bfseries ')
                closers.append('}')
            if is_italic:
                self.parts.append(r'{\itshape ')
                closers.append('}')
            if is_underline:
                self.parts.append(r'\uline{')
                closers.append('}')
            if color:
                self.parts.append(rf'{{\color[HTML]{{{color}}} ')
                closers.append('}')

        elif tag == 'font':
            # <font color='#hex'> emitted by document.execCommand('foreColor')
            color_attr = props.get('color', '')
            if color_attr.startswith('#'):
                color = color_attr[1:].upper()
                if len(color) == 3:
                    color = ''.join(c * 2 for c in color)
            else:
                color = _extract_hex_color(f'color:{color_attr}') or ''
            if color:
                self.parts.append(rf'{{\color[HTML]{{{color}}} ')
                closers.append('}')

        elif tag == 'br':
            self.parts.append('\n')

        elif tag == 'li':
            self.parts.append(r'\item ')

        elif tag in ('ul', 'ol', 'div', 'p'):
            pass  # structural — handle in endtag

        if tag not in self.VOID_TAGS:
            self.stack.append((tag, closers))

    def handle_endtag(self, tag: str):
        tag = tag.lower()
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                _, closers = self.stack.pop(i)
                for c in reversed(closers):
                    self.parts.append(c)
                # Add paragraph break for block elements
                if tag in ('p', 'div'):
                    self.parts.append('\n')
                break

    def handle_data(self, data: str):
        self.parts.append(_escape_raw(data))

    def get_result(self) -> str:
        """Close any unclosed tags remaining on the stack and return result."""
        while self.stack:
            _, closers = self.stack.pop()
            for c in reversed(closers):
                self.parts.append(c)
        return ''.join(self.parts).strip()


def _html_to_latex(html: str) -> str:
    """Convert HTML from contentEditable to LaTeX, preserving bold/italic/color."""
    if not html:
        return ''
    builder = _LaTeXBuilder()
    try:
        builder.feed(html)
        return builder.get_result()
    except Exception as exc:
        logger.warning("HTML→LaTeX parse error: %s — falling back to plain text", exc)
        return _escape_raw(re.sub(r'<[^>]+>', '', html).strip())


# ─── Text Processing ──────────────────────────────────────────────────────────

def _strip_html(text: str) -> str:
    """Strip HTML for plain-text contexts (AI filling, bullet parsing)."""
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'<li[^>]*>', '\n• ', text, flags=re.IGNORECASE)
    text = re.sub(r'<[^>]+>', '', text)
    return text.strip()


def _escape_latex(text: str) -> str:
    """Escape plain text (strips HTML first) for LaTeX."""
    return _escape_raw(_strip_html(text))


def _bullets_to_items(html: str) -> str:
    """Convert HTML/plain bullet content to LaTeX \\item lines.
    
    Preserves bold, italic, color formatting within each bullet item.
    Handles tags spanning multiple lines by processing as a whole.
    """
    if not html:
        return ''

    # 1. If it's already HTML list items, we can still process it as a whole
    # But if there are no LI tags, we'll try to convert plain bullets to LI first
    # to ensure each one gets an \item.
    # 1. If it's already HTML list items, we process as-is
    if re.search(r'<(ul|ol|li)', html, re.IGNORECASE):
        return _html_to_latex(html)

    # 2. Convert • - * markers to <li> elements
    lines = re.split(r'<br\s*/?>|\n|\r', html, flags=re.IGNORECASE)
    new_html = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Replace leading markers with <li>, preserve surrounding tags if possible
        line = re.sub(r'^((?:<[^>]+>)*)\s*[•\-\*]+\s*', r'\1', line)
        new_html.append(f'<li>{line}</li>')
    html = '<ul>' + ''.join(new_html) + '</ul>'

    # Now run the whole HTML through the builder
    return _html_to_latex(html)


def _is_empty(val: str) -> bool:
    if not val:
        return True
    return not _strip_html(val).strip() or _strip_html(val).strip() in ('N/A', '')


# ─── AI Fill ─────────────────────────────────────────────────────────────────

FILL_PROMPT = """You are an expert HR content strategist at Wissen Technology.
Fill in the missing section "{section}" for this Job Description using the context below.

RULES:
1. For list sections (Responsibilities, Skills): use bullet points starting with •
2. Write 4-6 bullets for list sections, 2-3 sentences for paragraph sections.
3. Be specific and professional. No placeholder text.
4. Output ONLY the section content — no labels, no headings.

Section: {section}
JD Context:
{context}
"""


def fill_missing_sections(sections: dict, template_used: Optional[str] = None, 
                           api_key: Optional[str] = None, db: Session | None = None, 
                           user_id: UUID | None = None) -> dict:
    if not api_key:
        return sections
        
    # ALLOW auto-fill even with templates, but ensure it uses the new intelligent prompts.
    # We only skip if the user has ALREADY provided substantial content (2+ sections).
    header_keys = {"Hiring Title", "Experience", "Location", "Mode of Work"}
    existing_body = [k for k in sections.keys() if k not in header_keys and not _is_empty(str(sections.get(k, "")))]
    
    # If they have at least 3 body sections, assume they know what they want and skip auto-fill
    if len(existing_body) >= 3: 
        return sections

    filled = dict(sections)
    context_str = json.dumps(
        {k: _strip_html(v) for k, v in sections.items() if not _is_empty(str(v))},
        indent=2,
    )
    for section in REQUIRED_SECTIONS:
        if _is_empty(str(filled.get(section, ''))):
            logger.info('Auto-filling: %s', section)
            filled[section] = _llm(FILL_PROMPT.format(section=section, context=context_str), "", 
                                   temperature=0.3, api_key=api_key, db=db, user_id=user_id, tag="PDF Auto-Fill")
    return filled



# ─── LaTeX Rendering ─────────────────────────────────────────────────────────

def render_latex(jd_content: dict, template_id: str = 't1_classic', accent_color: str = '', 
                 api_key: Optional[str] = None, db: Session | None = None, 
                 user_id: UUID | None = None) -> str:
    if template_id not in TEMPLATE_CATALOG:
        template_id = 't1_classic'
    template_file = TEMPLATE_CATALOG[template_id]['file']
    sections = jd_content.get('sections', {})

    # 1. Dynamic Mapping via AI (No Hardcoding)
    struct_hash = hash(tuple(sorted(sections.keys())))
    mapping = _MAPPING_CACHE.get(struct_hash)
    
    if not mapping and api_key:
        res = _llm_json(LATEX_MAPPING_PROMPT, 
                        json.dumps({k: "..." for k in sections.keys()}),
                        api_key=api_key, db=db, user_id=user_id, tag="PDF Mapping")
        if res and "hiring_title_key" in res:
            mapping = {
                "hiring_title_key": res.get("hiring_title_key", "Hiring Title"),
                "metadata_keys": res.get("metadata_keys", []),
                "body_keys": res.get("body_keys", [])
            }
            _MAPPING_CACHE[struct_hash] = mapping

    if not mapping:
        mapping = {"hiring_title_key": "Hiring Title", "metadata_keys": [], "body_keys": []}

    # 2. Heuristic Fallback if AI mapping is empty
    if not mapping["metadata_keys"] and not mapping["body_keys"]:
        # Title is the first key or 'Hiring Title'
        mapping["hiring_title_key"] = 'Hiring Title' if 'Hiring Title' in sections else list(sections.keys())[0] if sections else 'Hiring Title'
        
        # Short values go to metadata
        for k, v in sections.items():
            if k == mapping["hiring_title_key"]: continue
            text_val = _strip_html(str(v))
            if len(text_val) < 60 and len(mapping["metadata_keys"]) < 4:
                mapping["metadata_keys"].append(k)
            else:
                mapping["body_keys"].append(k)

    # 3. Pull actual content using the mapped keys
    ctx = {
        'hiring_title': _html_to_latex(str(sections.get(mapping["hiring_title_key"], 'Job Description'))),
        'metadata':     [],
        'body_sections': []
    }

    for k in mapping["metadata_keys"]:
        val = sections.get(k, '')
        if val:
            ctx['metadata'].append({
                'label': _escape_latex(k),
                'value': _escape_latex(str(val))
            })
            # Legacy slug support
            ctx[k.lower().replace(' ', '_')] = _escape_latex(str(val))

    for k in mapping["body_keys"]:
        if k == mapping["hiring_title_key"] or k in mapping["metadata_keys"]:
            continue
        content = sections.get(k)
        if not content or _is_empty(str(content)):
            continue
            
        render_as_list = False
        # Aggressive list detection
        if any(bullet in str(content) for bullet in ["•", "-", "*", "<li>"]):
            render_as_list = True
        
        ctx['body_sections'].append({
            'title': _html_to_latex(str(k)).upper(),
            'content': _bullets_to_items(str(content)) if render_as_list else _html_to_latex(str(content)),
            'is_list': render_as_list
        })



    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        variable_start_string='<<',
        variable_end_string='>>',
        block_start_string='<%',
        block_end_string='%>',
        comment_start_string='<#',
        comment_end_string='#>',
        keep_trailing_newline=True,
    )
    latex_src = env.get_template(template_file).render(**ctx)

    # Ensure required packages are present
    packages = [
        r'\usepackage[T1]{fontenc}',
        r'\usepackage[normalem]{ulem}'
    ]
    for pkg in packages:
        if pkg.split('[')[0] not in latex_src and pkg not in latex_src:
            latex_src = re.sub(
                r'(\\documentclass\[[^\]]*\]\{[^}]+\}|\\documentclass\{[^}]+\})',
                rf'\1\n{pkg}',
                latex_src,
                count=1
            )


    # ── Accent colour injection ──────────────────────────────────────────────
    # Convert hex (#2563EB or 2563EB) → R,G,B values and replace the first
    # \definecolor{primary}{...} so every template respects the chosen tint.
    if accent_color:
        hex_clean = accent_color.lstrip('#').upper()
        if len(hex_clean) == 6:
            r = int(hex_clean[0:2], 16)
            g = int(hex_clean[2:4], 16)
            b = int(hex_clean[4:6], 16)
            
            def _repl(m):
                color_name = m.group(1)
                return rf'\definecolor{{{color_name}}}{{RGB}}{{{r},{g},{b}}}'

            # Use lambda or function so re.sub never treats backslashes in replacement as escape sequences
            latex_src = re.sub(
                r'\\definecolor\s*\{(primary|headingblue)\}\s*\{[^}]+\}\s*\{[^}]+\}',
                _repl,
                latex_src,
                count=0, # Replace all occurrences
            )

    return latex_src


# ─── PDF Compilation ──────────────────────────────────────────────────────────

def compile_pdf(
    jd_content: dict,
    template_id: str = 't1_classic',
    api_key: Optional[str] = None,
    accent_color: str = '',
    db: Session | None = None,
    user_id: UUID | None = None,
) -> bytes:
    # ── Resolve pdflatex path dynamically (works on Render + Local) ──────────
    pdflatex_bin = shutil.which('pdflatex')
    if not pdflatex_bin:
        # Fallback to absolute MiKTeX path for local Windows development
        import os
        if os.name == 'nt':
            pdflatex_bin = r"C:\Program Files\MiKTeX\miktex\bin\x64\pdflatex.exe"
        else:
            raise RuntimeError("pdflatex not found in PATH and OS is not Windows.")


    sections = jd_content.get('sections', {})
    template_used = jd_content.get('template_used') or ''
    enriched = fill_missing_sections(sections, template_used=template_used, api_key=api_key, db=db, user_id=user_id)
    latex_source = render_latex(
        {**jd_content, 'sections': enriched},
        template_id=template_id,
        accent_color=accent_color,
        api_key=api_key,
        db=db,
        user_id=user_id,
    )

    with tempfile.TemporaryDirectory() as tmp:
        tex_path = Path(tmp) / 'jd_output.tex'
        pdf_path = Path(tmp) / 'jd_output.pdf'
        tex_path.write_text(latex_source, encoding='utf-8')

        result = None
        for pass_num in range(1, 3):
            result = subprocess.run(
                [
                    pdflatex_bin,
                    '-interaction=nonstopmode',
                    f'-output-directory={tmp}',
                    str(tex_path),
                ],
                capture_output=True, text=True, timeout=120,
                cwd=str(TEMPLATES_DIR),  # so image.jpg / logo.png are found
            )
            if result.returncode != 0 and not pdf_path.exists():
                break  # fast-fail — no point in second pass

        if not pdf_path.exists():
            # Pull the actual ! error lines from the log
            error_lines = [
                line for line in (result.stdout or '').splitlines()
                if line.startswith('!') or 'Error' in line
            ][:30]
            error_summary = '\n'.join(error_lines) if error_lines else (result.stdout or '')[-3000:]

            logger.error('pdflatex failed (exit %d)', result.returncode)
            logger.error('stdout:\n%s', (result.stdout or '')[-6000:])
            logger.error('stderr:\n%s', result.stderr or '')

            raise RuntimeError(
                f'pdflatex failed (exit {result.returncode}).\n'
                f'LaTeX errors:\n{error_summary}'
            )

        return pdf_path.read_bytes()
