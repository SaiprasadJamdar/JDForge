"""
Zoho Recruit API client.
Handles OAuth token fetch (with in-memory caching) and paginated candidate retrieval.
Compatible with both the live Zoho Recruit API and the mock server.
"""

import json
import logging
import time
import urllib.error
import urllib.request
from typing import Dict, List, Optional

from backend.config import get_settings

logger = logging.getLogger(__name__)

_token_cache: Dict[str, object] = {}

# How long to wait between retries (seconds) and max attempts per request
_RETRY_DELAYS = [2, 5, 10]   # 3 attempts total
_REQUEST_TIMEOUT = 20         # seconds per attempt


def _http_post(url: str, data: dict) -> dict:
    body = "&".join(f"{k}={v}" for k, v in data.items()).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=_REQUEST_TIMEOUT) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _http_get(url: str, token: str, params: dict = None) -> Optional[dict]:
    """
    Performs a GET request with automatic retry on timeout / connection errors.
    Returns None if all retries are exhausted.
    """
    if params:
        query = "&".join(f"{k}={v}" for k, v in params.items())
        url = f"{url}?{query}"

    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})

    last_error = None
    for attempt, delay in enumerate([0] + _RETRY_DELAYS, start=1):
        if delay:
            logger.warning(f"  Retrying in {delay}s (attempt {attempt}/{len(_RETRY_DELAYS) + 1})...")
            time.sleep(delay)
        try:
            with urllib.request.urlopen(req, timeout=_REQUEST_TIMEOUT) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except (TimeoutError, OSError, urllib.error.URLError) as e:
            last_error = e
            logger.warning(f"  HTTP GET attempt {attempt} failed: {e}")

    logger.error(f"All retry attempts exhausted for {url}. Last error: {last_error}")
    return None


def get_access_token() -> str:
    """
    Returns a cached Bearer token. Fetches a new one if expired or missing.
    Falls back to 'mock_token_fallback' if the OAuth endpoint is unreachable.
    """
    settings = get_settings()
    now = time.time()

    if _token_cache.get("token") and now < _token_cache.get("expires_at", 0):
        return _token_cache["token"]

    logger.info("Fetching OAuth token from Zoho API...")
    try:
        token_url = f"{settings.zoho_base_url}/oauth/v2/token"
        resp = _http_post(token_url, {
            "grant_type":    "client_credentials",
            "client_id":     "mock_client",
            "client_secret": "mock_secret",
        })
        token = resp.get("access_token", "mock_token")
        expires_in = resp.get("expires_in", 3600)
        _token_cache["token"] = token
        _token_cache["expires_at"] = now + expires_in - 60
        logger.info(f"Token acquired (expires in {expires_in}s).")
        return token
    except Exception as e:
        logger.warning(f"Token fetch failed ({e}), using fallback.")
        return "mock_token_fallback"


def fetch_all_candidates() -> List[Dict]:
    """
    Fetches all active candidates from Zoho Recruit using pagination.
    Automatically skips Is_Unqualified=True candidates.
    Returns raw Zoho API response objects (not yet normalized).

    Raises RuntimeError if the API is completely unreachable so the router
    can return a clean 503 instead of a bare 500.
    """
    settings = get_settings()
    token = get_access_token()
    candidates_url = f"{settings.zoho_base_url}/recruit/v2/Candidates"
    all_candidates: List[Dict] = []
    page = 1

    logger.info("Fetching candidates from Zoho Recruit API...")
    while True:
        resp = _http_get(candidates_url, token, params={"page": page, "per_page": 200})

        if resp is None:
            if page == 1:
                # First page failed entirely — surface this as a proper error
                raise RuntimeError(
                    "Zoho Recruit API is unreachable (timeout/network error). "
                    "Check the Zoho base URL and your network connection."
                )
            else:
                # Partial failure on later pages — return what we have
                logger.warning(f"Stopping pagination at page {page} due to network error.")
                break

        data = resp.get("data", [])
        info = resp.get("info", {})

        for c in data:
            if not c.get("Is_Unqualified", False):
                all_candidates.append(c)

        logger.info(f"  Page {page}: {len(data)} fetched (running total: {len(all_candidates)})")

        if not info.get("more_records", False):
            break
        page += 1

    logger.info(f"Total candidates from Zoho API: {len(all_candidates)}")
    return all_candidates


def normalize_candidate(raw: Dict) -> Dict:
    """
    Maps raw Zoho API candidate schema → internal scoring-ready dict.
    Only the fields relevant for ATS scoring and report display are kept.
    """
    return {
        "zoho_id":          raw.get("id", ""),
        "candidate_id":     raw.get("Candidate_ID", ""),
        "full_name":        raw.get("Full_Name", "Unknown"),
        "job_title":        raw.get("Current_Job_Title", ""),
        "employer":         raw.get("Current_Employer", ""),
        "experience_years": raw.get("Experience_in_Years", 0) or 0,
        "skill_set":        raw.get("Skill_Set", ""),
        "qualification":    raw.get("Highest_Qualification_Held", ""),
        "city":             raw.get("City", ""),
        "state":            raw.get("State", ""),
        "country":          raw.get("Country", ""),
        "status":           raw.get("Candidate_Status", ""),
        "source":           raw.get("Source", ""),
        "rating":           raw.get("Rating"),
        "email":            raw.get("Email", ""),
    }
