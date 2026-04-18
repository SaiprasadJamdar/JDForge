import csv
import json
import logging
import time
from pathlib import Path
from typing import List, Dict, Optional

import urllib.request
import urllib.error

from scoring_engine import parse_jd_hybrid, score_candidate

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
FINDINGS_DIR = BASE_DIR / "findings"

# ── Zoho Recruit Mock API Config ──────────────────────────────────────────────
ZOHO_BASE_URL  = "https://zohorecruit.thankfulrock-f57331b9.centralindia.azurecontainerapps.io"
TOKEN_ENDPOINT = f"{ZOHO_BASE_URL}/oauth/v2/token"
CANDIDATES_ENDPOINT = f"{ZOHO_BASE_URL}/recruit/v2/Candidates"

# Simple in-memory token cache
_token_cache: Dict[str, object] = {}


def _http_post(url: str, data: dict) -> dict:
    """Simple POST using urllib (no extra dependencies)."""
    body = "&".join(f"{k}={v}" for k, v in data.items()).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _http_get(url: str, token: str, params: dict = None) -> dict:
    """Simple GET using urllib (no extra dependencies)."""
    if params:
        query = "&".join(f"{k}={v}" for k, v in params.items())
        url = f"{url}?{query}"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_access_token() -> str:
    """Fetch a Bearer token from the mock OAuth endpoint. Caches result."""
    now = time.time()
    if _token_cache.get("token") and now < _token_cache.get("expires_at", 0):
        return _token_cache["token"]

    logger.info("Fetching OAuth token from Zoho Mock API...")
    try:
        resp = _http_post(TOKEN_ENDPOINT, {
            "grant_type": "client_credentials",
            "client_id":     "mock_client",
            "client_secret": "mock_secret"
        })
        token = resp.get("access_token", "mock_token_abc123")
        expires_in = resp.get("expires_in", 3600)
        _token_cache["token"] = token
        _token_cache["expires_at"] = now + expires_in - 60  # 60s buffer
        logger.info(f"Token acquired (expires in {expires_in}s).")
        return token
    except Exception as e:
        logger.warning(f"Token fetch failed ({e}), using fallback mock token.")
        return "mock_token_abc123"


def fetch_all_candidates() -> List[Dict]:
    """
    Fetches all candidates from the Zoho Recruit Mock API using pagination.
    The API returns up to 200 per page; we loop until no more records.
    Skips candidates where Is_Unqualified=True.
    """
    token = get_access_token()
    all_candidates: List[Dict] = []
    page = 1
    per_page = 200  # max allowed

    logger.info("Fetching candidates from Zoho Recruit Mock API...")
    while True:
        try:
            resp = _http_get(
                CANDIDATES_ENDPOINT,
                token,
                params={"page": page, "per_page": per_page}
            )
        except urllib.error.URLError as e:
            logger.error(f"API call failed on page {page}: {e}")
            break

        data = resp.get("data", [])
        info = resp.get("info", {})

        for c in data:
            if c.get("Is_Unqualified", False):
                continue  # Skip disqualified candidates
            all_candidates.append(c)

        logger.info(f"  Page {page}: fetched {len(data)} candidates (total so far: {len(all_candidates)})")

        if not info.get("more_records", False):
            break
        page += 1

    logger.info(f"Total candidates fetched from API: {len(all_candidates)}")
    return all_candidates


def _normalize_candidate(raw: Dict) -> Dict:
    """
    Maps the Zoho Recruit API schema to our internal scoring schema.
    Pulls only the fields relevant for ATS scoring.
    """
    return {
        # Identity
        "id":              raw.get("id", ""),
        "Candidate_ID":    raw.get("Candidate_ID", ""),
        "Full_Name":       raw.get("Full_Name", "Unknown"),
        # Scoring fields
        "Current_Job_Title":          raw.get("Current_Job_Title", ""),
        "Current_Employer":           raw.get("Current_Employer", ""),
        "Experience_in_Years":        raw.get("Experience_in_Years", 0) or 0,
        "Skill_Set":                  raw.get("Skill_Set", ""),
        "Highest_Qualification_Held": raw.get("Highest_Qualification_Held", ""),
        # Location
        "City":    raw.get("City", ""),
        "State":   raw.get("State", ""),
        "Country": raw.get("Country", ""),
        # Metadata (for report display)
        "Candidate_Status": raw.get("Candidate_Status", ""),
        "Source":           raw.get("Source", ""),
        "Rating":           raw.get("Rating"),   # nullable star rating
        "Email":            raw.get("Email", ""),
    }


def fetch_and_rank(jd_path: Path, sq_path: Path):
    FINDINGS_DIR.mkdir(parents=True, exist_ok=True)

    logger.info(f"Loading JD: {jd_path.name}")
    jd_text = jd_path.read_text(encoding="utf-8")
    sq_text = sq_path.read_text(encoding="utf-8") if sq_path and sq_path.exists() else ""

    # 1. Extract structured JD parameters via LLM
    logger.info("Extracting structured skills from JD via LLM...")
    jd_params = parse_jd_hybrid(jd_text)

    logger.info(f"  Role Title      : {jd_params['role_title']}")
    logger.info(f"  Required Skills : {jd_params['required_skills']}")
    logger.info(f"  Preferred Skills: {jd_params['preferred_skills']}")
    logger.info(f"  Min Experience  : {jd_params['optimum_experience']} yrs")

    # 2. Fetch live candidates from Zoho Mock API
    raw_candidates = fetch_all_candidates()
    if not raw_candidates:
        logger.error("No candidates returned from API. Aborting.")
        return

    # 3. Normalize to internal schema
    candidates = [_normalize_candidate(c) for c in raw_candidates]

    # 4. Score each candidate
    logger.info(f"Scoring {len(candidates)} candidates against JD...")
    scored = [score_candidate(c, jd_params, search_query=sq_text) for c in candidates]
    scored.sort(key=lambda x: x["match_percentage"], reverse=True)

    top = scored[:15]
    base_name = jd_path.stem

    # 5. Build TXT report
    lines = [
        "=== AUTOMATED CANDIDATE RANKING — ZOHO RECRUIT ATS FINDINGS ===",
        f"Position Evaluated : {jd_params['role_title']}",
        f"Required Experience: {jd_params['optimum_experience']} Year(s)",
        f"Core Skills Needed : {', '.join(jd_params['required_skills']) or 'N/A'}",
        f"Preferred Skills   : {', '.join(jd_params['preferred_skills']) or 'N/A'}",
        f"Candidates Sourced : {len(candidates)} (via Zoho Recruit Mock API)",
        "",
        "--- TOP 15 CANDIDATE SUMMARIES (Ranked by ATS Score) ---",
    ]

    csv_rows = []
    for i, sc in enumerate(top, start=1):
        c = sc["candidate"]
        score = sc["match_percentage"]
        matched = ", ".join(sc["matched_skills"]) or "None"
        missing = ", ".join(sc["missing_skills"]) or "None"
        mb = sc["match_breakdown"]
        rating_stars = ("★" * c["Rating"] if c["Rating"] else "Not Rated")

        lines.append(f"\n{'─'*62}")
        lines.append(f"#{i}  {c['Full_Name']}  —  ATS Score: {score}%")
        lines.append(f"    Candidate ID : {c['Candidate_ID']}")
        lines.append(f"    Title        : {c['Current_Job_Title']}")
        lines.append(f"    Employer     : {c['Current_Employer']}")
        lines.append(f"    Experience   : {c['Experience_in_Years']} yrs  |  Status: {c['Candidate_Status']}")
        lines.append(f"    Location     : {c['City']}, {c['State']}, {c['Country']}")
        lines.append(f"    Source       : {c['Source']}  |  Rating: {rating_stars}")
        lines.append(f"    Qualification: {c['Highest_Qualification_Held']}")
        lines.append(f"    ✔ Matched    : {matched}")
        lines.append(f"    ✘ Missing    : {missing}")
        lines.append(
            f"    Breakdown    : Skills {mb['req_skills_score']} | Preferred {mb['pref_skills_score']} "
            f"| Title {mb['title_score']} | Exp {mb['experience_score']} | Boost {mb['query_boost']}"
        )

        csv_rows.append({
            "Rank":              i,
            "Candidate ID":      c["Candidate_ID"],
            "Name":              c["Full_Name"],
            "Email":             c["Email"],
            "Title":             c["Current_Job_Title"],
            "Employer":          c["Current_Employer"],
            "Experience (yrs)":  c["Experience_in_Years"],
            "ATS Score (%)":     score,
            "Status":            c["Candidate_Status"],
            "Source":            c["Source"],
            "Location":          f"{c['City']}, {c['State']}",
            "Qualification":     c["Highest_Qualification_Held"],
            "Matched Skills":    matched,
            "Missing Skills":    missing,
        })

    lines.append(f"\n{'─'*62}")

    txt_path = FINDINGS_DIR / f"{base_name}.txt"
    txt_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    csv_path = FINDINGS_DIR / f"{base_name}.csv"
    fieldnames = [
        "Rank", "Candidate ID", "Name", "Email", "Title", "Employer",
        "Experience (yrs)", "ATS Score (%)", "Status", "Source",
        "Location", "Qualification", "Matched Skills", "Missing Skills"
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(csv_rows)

    logger.info(f"✔ Report saved → findings/{txt_path.name}")
    logger.info(f"✔ CSV saved   → findings/{csv_path.name}")
