import json
import logging
import os
import re
from typing import Dict, Any, List

from dotenv import load_dotenv
from groq import Groq

load_dotenv()
logger = logging.getLogger(__name__)

LLAMA_MODEL = "llama-3.3-70b-versatile"

# Known compound role title words that help with title matching
ROLE_RELATED_WORDS = {
    "data analyst": ["data", "analyst", "analytics"],
    "data scientist": ["data", "scientist", "science", "ml", "machine learning"],
    "full stack": ["full", "stack", "fullstack", "developer", "engineer"],
    "backend": ["backend", "back-end", "server", "api"],
    "frontend": ["frontend", "front-end", "ui", "react", "angular"],
    "devops": ["devops", "cloud", "infra", "infrastructure", "sre"],
    "hr": ["hr", "human resources", "recruiter", "talent", "people"],
}

def _client() -> Groq:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise EnvironmentError("GROQ_API_KEY is not set.")
    return Groq(api_key=api_key)


def parse_jd_hybrid(jd_text: str) -> Dict[str, Any]:
    """
    Always use LLM to extract skills — regex is insufficient for compound JD phrasing.
    The prompt is strict: atomic skills only.
    """
    try:
        client = _client()
        prompt = """You are an ATS skill extractor. Read this Job Description and extract structured hiring data.

Return ONLY a JSON object in this exact format with no extra text or markdown:
{
  "role_title": "Short job title, e.g. Data Analyst",
  "required_skills": ["Python", "SQL", "Power BI", "Excel"],
  "preferred_skills": ["Tableau", "R"],
  "optimum_experience": 3
}

STRICT EXTRACTION RULES:
- required_skills: ONLY short, atomic technical tool/skill names. Max 3 words each.
  GOOD: ["Python", "SQL", "Excel", "Power BI", "React", "Node.js", "AWS", "Docker"]
  BAD: ["Proficiency in Python", "Experience with databases", "Strong problem-solving skills", "Ability to collaborate"]
- Never include soft skills: communication, teamwork, leadership, problem-solving, collaboration, adaptability, analytical thinking, presentation, etc.
- Never include generic phrases: "database management systems", "data visualization tools", "debugging skills", "testing skills"
  Instead extract the actual tool: e.g. "Jest", "Selenium", "MySQL", "MongoDB", "Tableau"
- preferred_skills: same rules as required_skills, only if explicitly stated as "preferred" or "nice to have"
- optimum_experience: integer years (minimum required), 0 if not specified
- role_title: short and clean, 2-4 words max"""

        resp = client.chat.completions.create(
            model=LLAMA_MODEL,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": jd_text}
            ],
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        data = json.loads(resp.choices[0].message.content.strip())
        return {
            "required_skills": data.get("required_skills", []),
            "preferred_skills": data.get("preferred_skills", []),
            "role_title": data.get("role_title", ""),
            "optimum_experience": int(data.get("optimum_experience", 0))
        }
    except Exception as e:
        logger.error(f"LLM JD extraction failed: {e}")
        return {"required_skills": [], "preferred_skills": [], "role_title": "", "optimum_experience": 0}


def extract_keywords_from_boolean(query: str) -> List[str]:
    words = re.findall(r'"([^"]+)"|([a-zA-Z0-9_\.]+)', query)
    flattened = [w[0] if w[0] else w[1] for w in words]
    stopwords = {"AND", "OR", "NOT"}
    return [w for w in flattened if w.upper() not in stopwords]


SOFT_SKILL_PATTERNS = {
    "communication", "problem solving", "problem-solving", "leadership",
    "teamwork", "written", "verbal", "critical thinking", "collaboration",
    "fast-paced", "agile", "troubleshooting", "analytical", "interpersonal",
    "multitasking", "time management", "mentoring", "presentation", "presentations",
    "adaptability", "creativity", "self-motivated", "attention to detail"
}


def _normalize(s: str) -> str:
    """Lowercase and strip all non-alphanumeric chars for loose matching."""
    return re.sub(r'[^a-z0-9]', '', s.lower().strip())


def _clean_skills(skills_list: List[str]) -> List[str]:
    """Normalize skills and remove soft/vague entries."""
    result = []
    for s in skills_list:
        s = s.strip()
        if not s or len(s) < 2:
            continue
        s_lower = s.lower()
        # Filter out any soft skill matches
        if any(soft in s_lower for soft in SOFT_SKILL_PATTERNS):
            continue
        # Filter out overly long phrases (likely compound/noisy)
        if len(s.split()) > 4:
            continue
        result.append(s.lower())
    return list(dict.fromkeys(result))  # deduplicate preserving order


# Synonym mapping for loose tech matching
SYNONYMS: Dict[str, List[str]] = {
    "aws": ["amazon web services", "cloud"],
    "javascript": ["js"],
    "node.js": ["node", "nodejs"],
    "react": ["react.js", "reactjs"],
    "vue": ["vue.js", "vuejs"],
    "angular": ["angularjs", "angular.js"],
    "machine learning": ["ml"],
    "artificial intelligence": ["ai"],
    "excel": ["ms excel", "microsoft excel"],
    "power bi": ["powerbi", "power-bi"],
    "gcp": ["google cloud platform", "google cloud"],
    "typescript": ["ts"],
    "postgresql": ["postgres"],
    "mongodb": ["mongo"],
}


def _check_match(target: str, candidate_skills: List[str]) -> bool:
    """Check if target skill exists in candidate's skill list using synonyms + loose normalization."""
    t_norm = _normalize(target)
    t_lower = target.lower()

    # Build synonym set for target
    synonyms_for_target = set()
    for canonical, aliases in SYNONYMS.items():
        if t_lower == canonical or t_lower in aliases:
            synonyms_for_target.add(canonical)
            synonyms_for_target.update(aliases)

    for cs in candidate_skills:
        cs_norm = _normalize(cs)
        cs_lower = cs.lower()

        # Direct normalized match
        if t_norm == cs_norm:
            return True
        # Substring match (both directions, whole word level)
        if re.search(rf'\b{re.escape(t_lower)}\b', cs_lower):
            return True
        if re.search(rf'\b{re.escape(cs_lower)}\b', t_lower):
            return True
        # Synonym match
        if cs_lower in synonyms_for_target or t_lower in synonyms_for_target:
            if cs_norm == t_norm or cs_lower in synonyms_for_target:
                return True

    return False


def _title_relevance(c_title: str, jd_title: str) -> float:
    """
    Returns a relevance multiplier (0.0 – 1.0) based on role title alignment.
    - 1.0 = exact match
    - 0.6 = meaningful keyword overlap (e.g. "analyst" in both)
    - 0.0 = unrelated or only generic words shared (e.g. "data", "senior")
    """
    if c_title == jd_title:
        return 1.0

    # Generic title words that should NOT drive a partial match on their own
    title_stop_words = {
        "the", "a", "an", "and", "or", "in", "of", "with", "for",
        "senior", "junior", "lead", "principal", "associate", "staff",
        "data", "software", "it", "tech", "technical", "digital"
    }

    jd_words = {w for w in jd_title.lower().split() if w not in title_stop_words}
    c_words  = {w for w in c_title.lower().split()  if w not in title_stop_words}
    common = jd_words & c_words

    if common:
        # Score based on how much of the JD title's meaningful words match
        overlap = len(common) / max(len(jd_words), 1)
        return min(overlap * 0.8, 0.8)  # Cap partial at 0.8 (12/15), reserve 1.0 for exact
    return 0.0


def score_candidate(candidate: Dict[str, Any], jd_params: Dict[str, Any], search_query: str = "") -> Dict[str, Any]:
    """
    Scoring weights (total max 100):
      - Required Skills:  65 pts  (dominant factor)
      - Title Relevance:  15 pts  (meaningful but not dominant)
      - Experience:       10 pts  (adaptive, lower weight when JD exp=0)
      - Preferred Skills: 10 pts  (bonus, scaled by core match ratio)

    Query boost: up to +10 pts additive (capped at 100 total)
    """
    c_skills = _clean_skills(candidate.get("Skill_Set", "").split(","))
    c_title = candidate.get("Current_Job_Title", "").lower().strip()
    c_exp = candidate.get("Experience_in_Years", 0) or 0

    req_skills = _clean_skills(jd_params["required_skills"])
    pref_skills = _clean_skills(jd_params["preferred_skills"])
    jd_title = jd_params["role_title"].strip().lower()
    jd_exp = jd_params["optimum_experience"] or 0

    query_keywords = [k.strip().lower() for k in extract_keywords_from_boolean(search_query)]

    # ─── 1. Required Skills Score (max 65 pts) ─────────────────────────────────
    matched_req = []
    missing_req = []
    for rs in req_skills:
        if _check_match(rs, c_skills):
            matched_req.append(rs)
        else:
            missing_req.append(rs)

    matched_ratio = len(matched_req) / len(req_skills) if req_skills else 1.0
    req_score = int(matched_ratio * 65)

    # ─── 2. Title Score (max 15 pts) ────────────────────────────────────────────
    title_rel = _title_relevance(c_title, jd_title)
    title_score = int(title_rel * 15)

    # ─── 3. Experience Score (adaptive max) ─────────────────────────────────────
    # If JD requires 0 years → experience is irrelevant, give max 5 pts flat
    # If JD requires N years → up to 10 pts based on closeness
    if jd_exp == 0:
        exp_score = 3  # Small flat bonus, does NOT vary between candidates
        exp_max = 5
    else:
        exp_max = 10
        gap = c_exp - jd_exp
        if gap == 0:
            exp_score = 10      # Exact match
        elif 0 < gap <= 2:
            exp_score = 8       # Slightly overqualified: mild penalty
        elif gap > 2:
            exp_score = 5       # Very overqualified
        elif -2 <= gap < 0:
            exp_score = 6       # Slightly underqualified
        else:
            exp_score = 2       # Significantly underqualified

    # ─── 4. Preferred Skills Score (max 10 pts, scaled by core ratio) ──────────
    matched_pref = []
    for ps in pref_skills:
        if _check_match(ps, c_skills):
            matched_pref.append(ps)

    pref_score = 0
    if pref_skills:
        raw_pref = (len(matched_pref) / len(pref_skills)) * 10
        # Scale by core match ratio so pref skills can't save a low-core candidate
        pref_score = int(raw_pref * matched_ratio)

    # ─── 5. Boolean Query Boost (max +10 pts) ───────────────────────────────────
    boost = 0
    if query_keywords:
        hits = sum(1 for q in query_keywords if _check_match(q, c_skills) or q in c_title)
        raw_boost = (hits / len(query_keywords)) * 10
        boost = int(raw_boost * matched_ratio)  # Scale by core ratio

    base_score = req_score + title_score + exp_score + pref_score
    total_score = min(base_score + boost, 100)

    # ─── Build output ────────────────────────────────────────────────────────────
    return {
        "candidate": candidate,
        "match_percentage": int(total_score),
        "matched_skills": [s.title() for s in matched_req + matched_pref],
        "missing_skills": [s.title() for s in missing_req],
        "match_breakdown": {
            "req_skills_score": f"{req_score}/65",
            "pref_skills_score": f"{pref_score}/10",
            "title_score": f"{title_score}/15",
            "experience_score": f"{exp_score}/{exp_max}",
            "query_boost": f"+{boost} (max 10)",
            "penalties": "None"
        }
    }
