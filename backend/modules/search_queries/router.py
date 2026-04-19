from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies import get_current_user
from backend.modules.jd.service import get_jd
from backend.modules.search_queries.schema import SearchQueryOut
from backend.modules.search_queries.service import create_search_query, get_search_query_for_jd

router = APIRouter(prefix="/jds", tags=["Search Queries"])


@router.post("/{jd_id}/search-query", response_model=SearchQueryOut, status_code=status.HTTP_201_CREATED)
def generate(
    jd_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Generate and persist a Boolean search query for a specific JD."""
    jd = get_jd(db, jd_id, current_user.id)
    if not jd:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "JD not found")
    return create_search_query(db, jd_id=jd.id, user_id=current_user.id, jd_text=jd.content)


@router.get("/{jd_id}/search-query", response_model=SearchQueryOut)
def get_one(
    jd_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retrieve the most recent search query for a JD."""
    sq = get_search_query_for_jd(db, jd_id)
    if not sq:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No search query found for this JD")
    return sq
