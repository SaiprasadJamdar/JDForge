import logging
import re
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from backend.core.groq_client import LLAMA_MODEL, get_groq_client
from backend.core.prompts import SEARCH_QUERY_PROMPT
from backend.modules.search_queries.model import SearchQuery

logger = logging.getLogger(__name__)


def _parse_three_versions(raw: str) -> dict:
    """Extract BROAD / TARGETED / STRICT from the LLM output."""
    result = {"broad": None, "targeted": None, "strict": None}
    for key in ("broad", "targeted", "strict"):
        pattern = rf"{key.upper()}:\s*(.+?)(?=(?:BROAD:|TARGETED:|STRICT:)|$)"
        m = re.search(pattern, raw, re.IGNORECASE | re.DOTALL)
        if m:
            result[key] = m.group(1).strip()
    return result


def generate_search_query(jd_text: str) -> dict:
    """Calls Groq LLM to generate 3 Boolean search query versions from a JD."""
    client = get_groq_client()
    resp = client.chat.completions.create(
        model=LLAMA_MODEL,
        messages=[
            {"role": "system", "content": SEARCH_QUERY_PROMPT},
            {"role": "user", "content": jd_text},
        ],
        temperature=0.0,
    )
    raw = resp.choices[0].message.content.strip()
    return _parse_three_versions(raw)


def create_search_query(
    db: Session,
    jd_id: UUID,
    user_id: UUID,
    jd_text: str,
) -> SearchQuery:
    """Generate and persist a search query for a JD."""
    versions = generate_search_query(jd_text)
    sq = SearchQuery(jd_id=jd_id, user_id=user_id, **versions)
    db.add(sq)
    db.commit()
    db.refresh(sq)
    return sq


def get_search_query_for_jd(db: Session, jd_id: UUID) -> Optional[SearchQuery]:
    return db.query(SearchQuery).filter(SearchQuery.jd_id == jd_id).first()
