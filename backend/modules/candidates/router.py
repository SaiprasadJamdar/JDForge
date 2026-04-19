from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies import get_current_user
from backend.modules.candidates.schema import CandidateResultOut, CandidateRunOut, RankCandidatesResponse
from backend.modules.candidates.service import (
    get_results_for_run,
    get_run,
    list_runs_for_jd,
    run_candidate_ranking,
)
from backend.modules.jd.service import get_jd
from backend.modules.search_queries.service import get_search_query_for_jd

router = APIRouter(prefix="/jds", tags=["Candidates"])

# Fallback for mock/initial JDs to ensure the demo works "properly"
MOCK_JD_MAP = {
    "java_architect_x1": "Wissen Technology is hiring an experienced Java Architect (12+ years) to design, develop, and guide scalable enterprise applications. Skills: Core Java, Spring Boot, Microservices, RESTful APIs, AWS/Azure/GCP.",
    "frontend_engineer_x2": "Wissen Technology is looking for a passionate Frontend Engineer (4-7 years) to build exceptional user interfaces with React, Redux, and Next.js.",
    "data_analyst_x3": "We are seeking a detail-oriented Data Analyst (3-5 years) to interpret models, statistical techniques, and provide reports using SQL and Python."
}

def is_valid_uuid(val: str):
    try:
        UUID(val)
        return True
    except:
        return False


@router.post("/{jd_id}/rank-candidates", response_model=RankCandidatesResponse, status_code=status.HTTP_201_CREATED)
def rank_candidates(
    jd_id: str,
    top_n: int = Query(default=15, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Fetch live candidates from Zoho Recruit, score against the JD, and persist the ranked shortlist.
    Handles both database UUIDs and mock static identifiers for the demo.
    """
    jd_text = ""
    target_jd_id = None

    if is_valid_uuid(jd_id):
        target_uuid = UUID(jd_id)
        jd = get_jd(db, target_uuid, current_user.id)
        if jd:
            jd_text = jd.content
            target_jd_id = target_uuid
    
    # Fallback to mock text if not found in DB
    if not jd_text and jd_id in MOCK_JD_MAP:
        jd_text = MOCK_JD_MAP[jd_id]
        # Use a stable dummy UUID for mock runs to satisfy DB constraints
        target_jd_id = UUID("00000000-0000-0000-0000-000000000001")

    if not jd_text:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Job Description '{jd_id}' not found.")

    # Pull the stored search query for the boost factor (optional, only for real JDs)
    search_query = ""
    if is_valid_uuid(jd_id):
        sq = get_search_query_for_jd(db, UUID(jd_id))
        search_query = sq.targeted or "" if sq else ""

    try:
        run, results = run_candidate_ranking(
            db,
            jd_id=target_jd_id,
            user_id=current_user.id,
            jd_text=jd_text,
            search_query=search_query,
            top_n=top_n,
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Candidate fetch failed: {e}. The Zoho Recruit API may be temporarily unavailable — please retry in a moment.",
        )

    return RankCandidatesResponse(run=run, results=results)


@router.get("/{jd_id}/runs", response_model=list[CandidateRunOut])
def list_runs(
    jd_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List all past ranking runs for a JD (most recent first)."""
    return list_runs_for_jd(db, jd_id, current_user.id)


@router.get("/runs/{run_id}/results", response_model=list[CandidateResultOut])
def get_results(
    run_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retrieve the ranked candidate results for a specific run."""
    run = get_run(db, run_id, current_user.id)
    if not run:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Run not found")
    return get_results_for_run(db, run_id)
