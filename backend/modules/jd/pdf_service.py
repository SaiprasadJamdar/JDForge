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

from groq import Groq
from jinja2 import Environment, FileSystemLoader

logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).parent.parent.parent / "templates"

# ─── Template Catalog ─────────────────────────────────────────────────────────

TEMPLATE_CATALOG = {
    "t1_classic":  {"file": "t1_classic.tex.j2",  "name": "Classic"},
    "t2_boxed":    {"file": "t2_boxed.tex.j2",    "name": "Boxed"},
    "t3_sidebar":  {"file": "t3_sidebar.tex.j2",  "name": "Sidebar"},
    "t4_logoleft": {"file": "t4_logoleft.tex.j2", "name": "Logo Left"},
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
        ('<',  r'\textless{}'),
        ('>',  r'\textgreater{}'),
        ('–',  '--'),
        ('—',  '---'),
        ('"',  "''"),
        ('"',  '``'),
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
            self.parts.append(r'\textbf{')
            closers.append('}')

        elif tag in ('i', 'em'):
            self.parts.append(r'\textit{')
            closers.append('}')

        elif tag == 'u':
            self.parts.append(r'\underline{')
            closers.append('}')

        elif tag == 's':
            self.parts.append(r'\sout{')
            closers.append('}')

        elif tag == 'span':
            # Collect transformations from inline style
            color = _extract_hex_color(style)
            is_bold = 'bold' in style and 'font-weight' in style
            is_italic = 'italic' in style and 'font-style' in style
            is_underline = 'underline' in style and 'text-decoration' in style

            if is_bold:
                self.parts.append(r'\textbf{')
                closers.append('}')
            if is_italic:
                self.parts.append(r'\textit{')
                closers.append('}')
            if is_underline:
                self.parts.append(r'\underline{')
                closers.append('}')
            if color:
                self.parts.append(rf'\textcolor[HTML]{{{color}}}{{')
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
                self.parts.append(rf'\textcolor[HTML]{{{color}}}{{')
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
    
    Preserves bold, italic, color formatting within each bullet item
    by splitting on structural tags first, then running _html_to_latex
    per item so inline styles survive.
    """
    if not html:
        return ''

    # 1. Split on <li> tags first (handles UL/OL from contentEditable)
    if re.search(r'<li', html, re.IGNORECASE):
        # Extract each <li>...</li> and convert its inner HTML
        items = re.findall(r'<li[^>]*>(.*?)</li>', html, re.IGNORECASE | re.DOTALL)
        lines = []
        for item in items:
            converted = _html_to_latex(item.strip())
            if converted:
                lines.append(rf'\item {converted}')
        if lines:
            return '\n'.join(lines)

    # 2. Plain-text bullet splitting (• - *) — still preserve formatting per chunk
    # Split on structural block breaks first, keep inline HTML
    text_plain = _strip_html(html)  # for bullet detection only
    html_chunks: list[str] = []

    # Try to split on newlines or bullet chars in the PLAIN text,
    # then map positions back to HTML — simpler: split HTML on <br> / \n
    br_split = re.split(r'<br\s*/?>', html, flags=re.IGNORECASE)
    for chunk in br_split:
        # Further split on leading • or - in plain-text representation
        plain = re.sub(r'<[^>]+>', '', chunk)
        sub_chunks = re.split(r'\n|\r', plain)
        for sub in sub_chunks:
            stripped = sub.strip().lstrip('•\-* ').strip()
            if stripped:
                # Re-extract the HTML that corresponds to this sub-chunk
                # For simplicity, process the whole chunk's HTML inline styles
                inner_html = chunk  # may span multiple sub-chunks; acceptable
                converted = _html_to_latex(inner_html)
                # Now strip any leading bullet chars from the converted result
                converted = re.sub(r'^[•\-\*]+\s*', '', converted).strip()
                if converted:
                    html_chunks.append(converted)
                break  # avoid duplicates for multi-sub-chunk

    if html_chunks:
        return '\n'.join(rf'\item {c}' for c in html_chunks)

    # 3. Fallback: treat entire content as single paragraph item
    converted = _html_to_latex(html)
    if converted:
        return rf'\item {converted}'
    return ''


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


def fill_missing_sections(sections: dict, api_key: Optional[str] = None) -> dict:
    if not api_key:
        return sections
    client = Groq(api_key=api_key)
    filled = dict(sections)
    context_str = json.dumps(
        {k: _strip_html(v) for k, v in sections.items() if not _is_empty(v)},
        indent=2,
    )
    for section in REQUIRED_SECTIONS:
        if _is_empty(sections.get(section, '')):
            logger.info('Auto-filling: %s', section)
            try:
                resp = client.chat.completions.create(
                    model='llama-3.3-70b-versatile',
                    messages=[{'role': 'user', 'content': FILL_PROMPT.format(
                        section=section, context=context_str
                    )}],
                    temperature=0.3,
                )
                filled[section] = resp.choices[0].message.content.strip()
            except Exception as e:
                logger.warning("Could not fill '%s': %s", section, e)
    return filled


# ─── LaTeX Rendering ─────────────────────────────────────────────────────────

def render_latex(jd_content: dict, template_id: str = 't1_classic', accent_color: str = '') -> str:
    if template_id not in TEMPLATE_CATALOG:
        template_id = 't1_classic'
    template_file = TEMPLATE_CATALOG[template_id]['file']
    sections = jd_content.get('sections', {})

    about_default = (
        'Wissen Technology is a specialized global technology company that delivers '
        r'high-end consulting for organizations in the Banking \& Finance, Telecom, '
        'and Healthcare domains.'
    )

    location_raw = sections.get('Location', 'Bangalore, India')
    location = _escape_latex(location_raw.split('/')[0].strip())
    mode_raw = sections.get('Mode of Work', 'Full-Time')
    mode = _escape_latex(mode_raw.split('/')[0].strip())

    ctx = {
        'hiring_title':    _html_to_latex(sections.get('Hiring Title', 'Job Description')),
        'location':        location,
        'job_type':        mode or 'Full-Time',
        'experience':      _escape_latex(sections.get('Experience', 'N/A')),
        'mode_of_work':    mode,
        'about_wissen':    _html_to_latex(sections.get('About Wissen Technology', '')) or about_default,
        'job_summary':     _html_to_latex(sections.get('Job Summary', '')),
        'responsibilities': _bullets_to_items(sections.get('Key Responsibilities', '')),
        'qualifications':   _bullets_to_items(sections.get('Qualifications and Required Skills', '')),
        'good_to_have':     _bullets_to_items(sections.get('Good to Have Skills', '')),
        'soft_skills':      _bullets_to_items(sections.get('Soft Skills', '')),
    }

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

    # ── Accent colour injection ──────────────────────────────────────────────
    # Convert hex (#2563EB or 2563EB) → R,G,B values and replace the first
    # \definecolor{primary}{...} so every template respects the chosen tint.
    if accent_color:
        hex_clean = accent_color.lstrip('#').upper()
        if len(hex_clean) == 6:
            r = int(hex_clean[0:2], 16)
            g = int(hex_clean[2:4], 16)
            b = int(hex_clean[4:6], 16)
            new_def = rf'\definecolor{{primary}}{{RGB}}{{{r},{g},{b}}}'
            # Use lambda so re.sub never treats backslashes in replacement as escape sequences
            latex_src = re.sub(
                r'\\definecolor\{primary\}\{[^}]+\}\{[^}]+\}',
                lambda _: new_def,
                latex_src,
                count=1,
            )

    return latex_src


# ─── PDF Compilation ──────────────────────────────────────────────────────────

def compile_pdf(
    jd_content: dict,
    template_id: str = 't1_classic',
    api_key: Optional[str] = None,
    accent_color: str = '',
) -> bytes:
    if not shutil.which('pdflatex'):
        raise RuntimeError(
            'pdflatex not found in PATH. '
            'Install MiKTeX (Windows) or TeX Live (Linux/Mac).'
        )

    sections = jd_content.get('sections', {})
    enriched = fill_missing_sections(sections, api_key=api_key)
    latex_source = render_latex(
        {**jd_content, 'sections': enriched},
        template_id=template_id,
        accent_color=accent_color,
    )

    with tempfile.TemporaryDirectory() as tmp:
        tex_path = Path(tmp) / 'jd_output.tex'
        pdf_path = Path(tmp) / 'jd_output.pdf'
        tex_path.write_text(latex_source, encoding='utf-8')

        for _ in range(2):
            result = subprocess.run(
                ['pdflatex', '-interaction=nonstopmode',
                 f'-output-directory={tmp}', str(tex_path)],
                capture_output=True, text=True, timeout=120,
                cwd=str(TEMPLATES_DIR),   # so image.jpg / logo.png are found
            )

        if not pdf_path.exists():
            logger.error('pdflatex stdout:\n%s', result.stdout[-4000:])
            logger.error('pdflatex stderr:\n%s', result.stderr[-1000:])
            raise RuntimeError(
                f'pdflatex failed (exit {result.returncode}). '
                f'Check backend logs.\n\n{result.stdout[-2000:]}'
            )

        return pdf_path.read_bytes()
