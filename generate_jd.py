from __future__ import annotations

import json
import logging
import os
import re
import uuid
from pathlib import Path
from typing import Iterable

from dotenv import load_dotenv
from groq import Groq

# Load environment variables (e.g. GROQ_API_KEY)
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
RAW_TRANSCRIPTS_DIR = BASE_DIR / "raw_transcripts"
CLEAN_TRANSCRIPTS_DIR = BASE_DIR / "clean_transcripts"
JD_OUTPUT_DIR = BASE_DIR / "jd_outputs"
SEARCH_QUERY_DIR = BASE_DIR / "search_queries"

LLAMA_MODEL = "llama-3.3-70b-versatile"

CLEANUP_PROMPT = """
You are a world-class transcript editor for hiring conversations.

Your job is to turn a rough ASR transcript into a clean, faithful, publication-ready transcript.

Rules:
1. Preserve meaning exactly. Never invent facts, skills, dates, company names, tools, or requirements.
2. If the transcript is multilingual or code-mixed (Hindi, Tamil, Malayalam, Marathi, English, or mixed), normalize everything into natural, professional English.
3. Keep all technical terms, product names, programming languages, cloud services, frameworks, and role names intact.
4. Remove filler words, stutters, false starts, repetitions, and obvious ASR noise.
5. Repair grammar and sentence flow without changing the intent.
6. If a phrase is unclear, mark it as [unclear] instead of guessing.
7. If a segment is clearly incomplete, keep the partial meaning and do not hallucinate the missing part.
8. Do not add speaker labels unless they are already explicit and reliable.
9. Keep the output concise, readable, and faithful.
10. Output ONLY the cleaned transcript. No title, no bullets, no explanation, no markdown fences.
""".strip()

SPLIT_PROMPT = """
Analyze the following hiring conversation transcript. It may discuss one single job role, or multiple distinct roles.
Your task is to separate the transcript into focused segments for each distinct role discussed.

Respond STRICTLY with a JSON object containing a single key "roles" which is an array of objects. 
Do not include markdown formatting or explanations. Ensure output is raw parsable JSON.

Format constraint:
{
  "roles": [
    {
      "detected_role": "Primary Title",
      "transcript_segment": "All details, sentences, and context from the original transcript that apply to this specific role."
    }
  ]
}
""".strip()

JD_PROMPT = """
You are an expert HR content strategist and recruitment operations specialist.

Convert the transcript segment into a clean, publish-ready Job Description.

Critical rules:
1. Do not invent facts that are not supported by the transcript.
2. If some details are missing, keep the JD useful and professional, but do not fabricate company-specific claims.
3. Use clear section hierarchy and ATS-friendly wording.
4. Remove repetition and filler.
5. Infer only when highly safe and obvious; otherwise mark as "To be confirmed".
6. Keep the output in polished English.
7. Use concise bullet points where appropriate.
8. Make responsibilities action-oriented.
9. Separate must-have skills from good-to-have skills.
10. If the transcript does not mention a section, still include the section with a short neutral placeholder rather than omitting it.
11. Output ONLY the final Job Description text. No explanation, no JSON, no markdown code fences.

Required structure:
- Job Title
- Role Summary
- Responsibilities
- Required Skills
- Preferred Skills
- Qualifications
- Company Context
- Notes / Open Questions (only if needed)
""".strip()

SEARCH_QUERY_PROMPT = """
You are an expert technical recruiter and boolean search specialist.
Based on the provided Job Description, generate a recruiter-ready Boolean search query.

Functional Requirements:
1. Extract: Primary job title, Title variations, Must-have skills, Equivalent technologies.
2. Construct a Boolean query: Use OR for title synonyms, AND for must-have skills, OR for skill variations.
3. Expand abbreviations (e.g., AWS -> "Amazon Web Services", JS -> JavaScript).
4. Ensure correct Boolean structure with proper parentheses.
5. Avoid soft skills, generic keywords, and hallucinated technologies.
6. Keep the query concise (1-2 lines) and platform-ready (LinkedIn/Naukri compatible).

Output ONLY the Boolean query string. Do not include any explanations, labels, formatting wrappers, quotes, or markdown.

Example Output:
("Java Developer" OR "Backend Developer" OR "Software Engineer") AND ("Spring Boot") AND (AWS OR "Amazon Web Services" OR Cloud)
""".strip()

TITLE_EXTRACTION_PROMPT = """
Extract the primary Job Title from the following Job Description.

Output ONLY the job title string, nothing else. Make it concise (e.g. "Data Analyst" or "Senior Java Developer").
No quotes, no explanation, no formatting wrappers.
""".strip()


def _client() -> Groq:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        logger.error("GROQ_API_KEY is not set.")
        raise EnvironmentError("GROQ_API_KEY is not set.")
    return Groq(api_key=api_key)


def _transcript_files(directory: Path) -> Iterable[Path]:
    return sorted(
        p
        for p in directory.iterdir()
        if p.is_file() and p.suffix.lower() == ".txt" and not p.name.endswith("_raw.txt")
    )


def clean_raw_transcript(raw_text: str) -> str:
    client = _client()
    response = client.chat.completions.create(
        model=LLAMA_MODEL,
        messages=[
            {"role": "system", "content": CLEANUP_PROMPT},
            {"role": "user", "content": raw_text},
        ],
        temperature=0.0,
        max_completion_tokens=4000,
    )
    return response.choices[0].message.content.strip()


def split_transcript_into_roles(transcript_text: str) -> list[dict]:
    client = _client()
    logger.info("Analyzing transcript for multi-role composition...")
    response = client.chat.completions.create(
        model=LLAMA_MODEL,
        messages=[
            {"role": "system", "content": SPLIT_PROMPT},
            {"role": "user", "content": transcript_text},
        ],
        temperature=0.0,
        max_completion_tokens=4000,
        response_format={"type": "json_object"}
    )
    content = response.choices[0].message.content.strip()
    try:
        data = json.loads(content)
        return data.get("roles", [])
    except json.JSONDecodeError:
        logger.error(f"Failed to parse splitting JSON properly. Raw: {content}")
        return []


def generate_jd_from_transcript(transcript_text: str) -> str:
    client = _client()
    response = client.chat.completions.create(
        model=LLAMA_MODEL,
        messages=[
            {"role": "system", "content": JD_PROMPT},
            {"role": "user", "content": transcript_text},
        ],
        temperature=0.2, # Slight variation allowed for human-like flow
        max_completion_tokens=2500,
    )
    return response.choices[0].message.content.strip()


def extract_job_title(jd_text: str) -> str:
    client = _client()
    response = client.chat.completions.create(
        model=LLAMA_MODEL,
        messages=[
            {"role": "system", "content": TITLE_EXTRACTION_PROMPT},
            {"role": "user", "content": jd_text},
        ],
        temperature=0.0, # Deterministic outcome expected
        max_completion_tokens=50,
    )
    title = response.choices[0].message.content.strip()
    
    # Sanitize title to use it safely in file paths
    title = re.sub(r'[^a-zA-Z0-9_\- ]', '', title)
    title = title.strip().replace(' ', '_').lower()
    return title if title else "unknown_role"


def generate_search_query(jd_text: str) -> str:
    client = _client()
    response = client.chat.completions.create(
        model=LLAMA_MODEL,
        messages=[
            {"role": "system", "content": SEARCH_QUERY_PROMPT},
            {"role": "user", "content": jd_text},
        ],
        temperature=0.0, # Keep deterministic constraint
        max_completion_tokens=600,
    )
    return response.choices[0].message.content.strip()


def convert_transcripts_to_jds(
    raw_transcripts_dir: Path = RAW_TRANSCRIPTS_DIR, 
    clean_transcripts_dir: Path = CLEAN_TRANSCRIPTS_DIR,
    output_dir: Path = JD_OUTPUT_DIR,
    search_query_dir: Path = SEARCH_QUERY_DIR,
    selected_files: list[Path] | None = None
) -> list[Path]:
    raw_transcripts_dir.mkdir(parents=True, exist_ok=True)
    clean_transcripts_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    search_query_dir.mkdir(parents=True, exist_ok=True)

    if selected_files is None:
        transcript_files = list(_transcript_files(raw_transcripts_dir))
    else:
        transcript_files = selected_files

    if not transcript_files:
        logger.warning("No raw transcript .txt files found to process.")
        return []

    generated: list[Path] = []
    for transcript_path in transcript_files:
        logger.info(f"== Processing Raw Transcript: {transcript_path.name} ==")
        try:
            raw_chunk = transcript_path.read_text(encoding="utf-8").strip()
            if not raw_chunk:
                logger.warning(f"Skipping empty raw transcript: {transcript_path.name}")
                continue

            # 1. Clean the RAW multlingual/code-mixed transcript into an English baseline
            logger.info("Normalizing and cleaning rough multilingual transcript using ANTIGRAVITY baseline...")
            clean_chunk = clean_raw_transcript(raw_chunk)
            
            # Save it temporarily for auditability if needed
            clean_out_path = clean_transcripts_dir / f"{transcript_path.stem}.txt"
            clean_out_path.write_text(clean_chunk + "\n", encoding="utf-8")
            logger.info(f"Saved normalized baseline to: clean_transcripts/{clean_out_path.name}")

            # 2. Evaluate Clean Transcript for multiple JDs
            roles_data = split_transcript_into_roles(clean_chunk)
            if not roles_data:
                logger.warning("No distinct roles could be isolated from this transcript. Skipping.")
                continue

            logger.info(f"Detected {len(roles_data)} distinct role(s) in this structured text.")

            for role_idx, role_obj in enumerate(roles_data, start=1):
                raw_segment = role_obj.get("transcript_segment", "")
                base_title_guess = role_obj.get("detected_role", f"Role_{role_idx}")
                
                if not raw_segment.strip():
                    logger.warning(f"Skipping Role #{role_idx} ({base_title_guess}) - no context found.")
                    continue

                # 3. Generate JD
                logger.info(f"[{role_idx}/{len(roles_data)}] Drafting Job Description for: {base_title_guess}...")
                jd_text = generate_jd_from_transcript(raw_segment)
                
                # 4. Dynamically resolve final JD title and file names safely
                role_title = extract_job_title(jd_text)
                unique_id = uuid.uuid4().hex[:6]
                base_name = f"{role_title}_{unique_id}"
                
                # 5. Generate optimal Search Query
                logger.info(f"[{role_idx}/{len(roles_data)}] Generating Boolean search query for {role_title}...")
                search_query_text = generate_search_query(jd_text)
                
                # 6. Save dynamically named assets side-by-side
                out_jd_path = output_dir / f"{base_name}.txt"
                out_jd_path.write_text(jd_text + "\n", encoding="utf-8")
                
                out_sq_path = search_query_dir / f"{base_name}.txt"
                out_sq_path.write_text(search_query_text + "\n", encoding="utf-8")
                
                generated.extend([out_jd_path, out_sq_path])
                logger.info(f"SUCCESS Role #{role_idx}: JD & Query safely synced via prefix [{base_name}]")
            
        except Exception as e:
            logger.error(f"Failed to process entire transcript {transcript_path.name}: {e}", exc_info=True)

    return generated


if __name__ == "__main__":
    convert_transcripts_to_jds()