"""
ATS Candidate Scoring Service.
Ported from root-level scoring_engine.py + fetch_candidates.py into this module.
"""
import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from backend.config import get_settings
from backend.core.groq_client import LLAMA_MODEL, get_groq_client
from backend.core.prompts import JD_PARSING_PROMPT
from backend.core.zoho_client import fetch_all_candidates, normalize_candidate
from backend.modules.candidates.model import CandidateResult, CandidateRun

logger = logging.getLogger(__name__)

# ─── Synonym map for loose skill matching ────────────────────────────────────
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

SOFT_SKILLS = {
    "communication", "problem solving", "problem-solving", "leadership",
    "teamwork", "written", "verbal", "critical thinking", "collaboration",
    "fast-paced", "agile", "troubleshooting", "analytical", "interpersonal",
    "multitasking", "time management", "mentoring", "presentation", "presentations",
    "adaptability", "creativity", "self-motivated", "attention to detail",
}

TITLE_STOP_WORDS = {
    "the", "a", "an", "and", "or", "in", "of", "with", "for",
    "senior", "junior", "lead", "principal", "associate", "staff",
    "data", "software", "it", "tech", "technical", "digital",
}


# ─── JD Parsing ───────────────────────────────────────────────────────────────

def parse_jd(jd_text: str) -> Dict[str, Any]:
    """Extract structured hiring data from JD text using LLM."""
    client = get_groq_client()
    try:
        resp = client.chat.completions.create(
            model=LLAMA_MODEL,
            messages=[
                {"role": "system", "content": JD_PARSING_PROMPT},
                {"role": "user", "content": jd_text},
            ],
            temperature=0.0,
            response_format={"type": "json_object"},
        )
        data = json.loads(resp.choices[0].message.content.strip())
        return {
            "required_skills": data.get("required_skills", []),
            "preferred_skills": data.get("preferred_skills", []),
            "role_title": data.get("role_title", ""),
            "optimum_experience": int(data.get("optimum_experience", 0)),
        }
    except Exception as e:
        logger.error(f"JD parsing failed: {e}")
        return {"required_skills": [], "preferred_skills": [], "role_title": "", "optimum_experience": 0}


# ─── Skill helpers ────────────────────────────────────────────────────────────

def _normalize(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower().strip())


def _clean_skills(skills_list: List[str]) -> List[str]:
    result = []
    for s in skills_list:
        s = s.strip()
        if not s or len(s) < 2 or len(s.split()) > 4:
            continue
        s_lower = s.lower()
        if any(soft in s_lower for soft in SOFT_SKILLS):
            continue
        result.append(s.lower())
    return list(dict.fromkeys(result))


def _check_match(target: str, candidate_skills: List[str]) -> bool:
    t_norm = _normalize(target)
    t_lower = target.lower()
    synonyms_for_target = set()
    for canonical, aliases in SYNONYMS.items():
        if t_lower == canonical or t_lower in aliases:
            synonyms_for_target.add(canonical)
            synonyms_for_target.update(aliases)

    for cs in candidate_skills:
        cs_norm = _normalize(cs)
        cs_lower = cs.lower()
        if t_norm == cs_norm:
            return True
        if re.search(rf"\b{re.escape(t_lower)}\b", cs_lower):
            return True
        if re.search(rf"\b{re.escape(cs_lower)}\b", t_lower):
            return True
        if cs_lower in synonyms_for_target or t_lower in synonyms_for_target:
            if cs_norm == t_norm or cs_lower in synonyms_for_target:
                return True
    return False


def _title_relevance(c_title: str, jd_title: str) -> float:
    if c_title == jd_title:
        return 1.0
    jd_words = {w for w in jd_title.lower().split() if w not in TITLE_STOP_WORDS}
    c_words  = {w for w in c_title.lower().split()  if w not in TITLE_STOP_WORDS}
    common = jd_words & c_words
    if common:
        return min((len(common) / max(len(jd_words), 1)) * 0.8, 0.8)
    return 0.0


# ─── Scoring ─────────────────────────────────────────────────────────────────

def score_candidate(candidate: Dict, jd_params: Dict, search_query: str = "") -> Dict:
    """
    Returns a scored dict with match_percentage, matched/missing skills, breakdown.
    Weights: Required Skills 65 | Title 15 | Exp 5-10 | Preferred 10 | Boost +10
    """
    c_skills = _clean_skills(candidate.get("skill_set", "").split(","))
    c_title  = candidate.get("job_title", "").lower().strip()
    c_exp    = candidate.get("experience_years", 0) or 0

    req_skills = _clean_skills(jd_params["required_skills"])
    pref_skills = _clean_skills(jd_params["preferred_skills"])
    jd_title = jd_params["role_title"].strip().lower()
    jd_exp   = jd_params["optimum_experience"] or 0

    # Boolean query keywords
    query_keywords = []
    if search_query:
        words = re.findall(r'"([^"]+)"|([a-zA-Z0-9_\\.]+)', search_query)
        flattened = [w[0] if w[0] else w[1] for w in words]
        query_keywords = [w.lower() for w in flattened if w.upper() not in {"AND", "OR", "NOT"}]

    # 1. Required Skills (max 65)
    matched_req, missing_req = [], []
    for rs in req_skills:
        (matched_req if _check_match(rs, c_skills) else missing_req).append(rs)
    matched_ratio = len(matched_req) / len(req_skills) if req_skills else 1.0
    req_score = int(matched_ratio * 65)

    # 2. Title relevance (max 15, scaled by core ratio)
    title_rel = _title_relevance(c_title, jd_title)
    title_score = int(title_rel * 15 * matched_ratio)

    # 3. Experience (adaptive: max 5 when jd_exp=0, max 10 otherwise)
    exp_max = 5 if jd_exp == 0 else 10
    if jd_exp == 0:
        exp_score = 3
    else:
        gap = c_exp - jd_exp
        if gap == 0:    exp_score = 10
        elif 0 < gap <= 2: exp_score = 8
        elif gap > 2:   exp_score = 5
        elif -2 <= gap < 0: exp_score = 6
        else:           exp_score = 2

    # 4. Preferred Skills (max 10, scaled by core ratio)
    matched_pref = [ps for ps in pref_skills if _check_match(ps, c_skills)]
    pref_score = 0
    if pref_skills:
        pref_score = int((len(matched_pref) / len(pref_skills)) * 10 * matched_ratio)

    # 5. Boolean query boost (max +10, scaled by core ratio)
    boost = 0
    if query_keywords:
        hits = sum(1 for q in query_keywords if _check_match(q, c_skills) or q in c_title)
        boost = int((hits / len(query_keywords)) * 10 * matched_ratio)

    # Generate concise Fit Explanation
    total = min(req_score + title_score + exp_score + pref_score + boost, 100)

    explanation = f"Matches {len(matched_req)} core skills"
    if title_rel > 0.6: 
        explanation += " with strong title alignment"
    elif exp_score >= 8:
        explanation += " and meets experience targets"
    
    if len(missing_req) == 0 and total > 85:
        explanation = "Excellent candidate: Fully matched on core skills and experience."
    elif total < 50:
        explanation = "Significant skill gaps detected for this specialized role."

    return {
        "candidate": candidate,
        "match_percentage": int(total),
        "matched_skills": [s.title() for s in matched_req + matched_pref],
        "missing_skills":  [s.title() for s in missing_req],
        "explanation": explanation,
        "score_breakdown": {
            "req_skills_score":  f"{req_score}/65",
            "pref_skills_score": f"{pref_score}/10",
            "title_score":       f"{title_score}/15",
            "experience_score":  f"{exp_score}/{exp_max}",
            "query_boost":       f"+{boost} (max 10)",
        },
    }


# ─── DB operations ────────────────────────────────────────────────────────────

def run_candidate_ranking(
    db: Session,
    jd_id: UUID,
    user_id: UUID,
    jd_text: str,
    search_query: str = "",
    top_n: int = 15,
) -> Tuple[CandidateRun, List[CandidateResult]]:
    """
    Full ATS pipeline:
    1. Parse JD → extract skills/title/exp
    2. Fetch candidates from Zoho API
    3. Score + rank all candidates
    4. Persist CandidateRun + top_n CandidateResults
    5. Return (run, results)
    """
    settings = get_settings()

    logger.info(f"Parsing JD {jd_id}...")
    jd_params = parse_jd(jd_text)
    logger.info(f"  Required skills: {jd_params['required_skills']}")

    raw_candidates = fetch_all_candidates()
    candidates = [normalize_candidate(c) for c in raw_candidates]
    logger.info(f"Fetched {len(candidates)} candidates from Zoho.")

    scored = [score_candidate(c, jd_params, search_query) for c in candidates]
    scored.sort(key=lambda x: x["match_percentage"], reverse=True)
    top = scored[:top_n]

    # Persist run
    run = CandidateRun(
        jd_id=jd_id,
        user_id=user_id,
        total_fetched=len(candidates),
        top_n=top_n,
        zoho_source_url=f"{settings.zoho_base_url}/recruit/v2/Candidates",
    )
    db.add(run)
    db.flush()

    # Persist results
    result_records = []
    for rank, sc in enumerate(top, start=1):
        c = sc["candidate"]
        rec = CandidateResult(
            run_id=run.id,
            zoho_candidate_id=c.get("candidate_id"),
            full_name=c.get("full_name"),
            current_job_title=c.get("job_title"),
            current_employer=c.get("employer"),
            experience_years=c.get("experience_years"),
            skill_set=c.get("skill_set"),
            city=c.get("city"),
            state=c.get("state"),
            country=c.get("country"),
            source=c.get("source"),
            qualification=c.get("qualification"),
            zoho_rating=c.get("rating"),
            candidate_status=c.get("status"),
            email=c.get("email"),
            match_percentage=sc["match_percentage"],
            matched_skills=sc["matched_skills"],
            missing_skills=sc["missing_skills"],
            score_breakdown=sc["score_breakdown"],
            explanation=sc["explanation"],
            rank=rank,
        )
        db.add(rec)
        result_records.append(rec)

    db.commit()
    db.refresh(run)
    for rec in result_records:
        db.refresh(rec)

    logger.info(f"Run {run.id} complete. Top candidate: {top[0]['candidate']['full_name']} ({top[0]['match_percentage']}%)")
    return run, result_records


def get_run(db: Session, run_id: UUID, user_id: UUID) -> Optional[CandidateRun]:
    return db.query(CandidateRun).filter(
        CandidateRun.id == run_id, CandidateRun.user_id == user_id
    ).first()


def list_runs_for_jd(db: Session, jd_id: UUID, user_id: UUID) -> List[CandidateRun]:
    return (
        db.query(CandidateRun)
        .filter(CandidateRun.jd_id == jd_id, CandidateRun.user_id == user_id)
        .order_by(CandidateRun.created_at.desc())
        .all()
    )


def get_results_for_run(db: Session, run_id: UUID) -> List[CandidateResult]:
    return (
        db.query(CandidateResult)
        .filter(CandidateResult.run_id == run_id)
        .order_by(CandidateResult.rank)
        .all()
    )
