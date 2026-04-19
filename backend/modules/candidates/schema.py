from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel


class CandidateRunOut(BaseModel):
    id: UUID
    jd_id: UUID
    total_fetched: int
    top_n: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CandidateResultOut(BaseModel):
    id: UUID
    run_id: UUID
    rank: int
    zoho_candidate_id: Optional[str]
    full_name: Optional[str]
    current_job_title: Optional[str]
    current_employer: Optional[str]
    experience_years: Optional[int]
    skill_set: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    source: Optional[str]
    qualification: Optional[str]
    zoho_rating: Optional[int]
    candidate_status: Optional[str]
    email: Optional[str]
    match_percentage: int
    matched_skills: Optional[List[str]]
    missing_skills: Optional[List[str]]
    score_breakdown: Optional[Dict[str, Any]]
    explanation: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class RankCandidatesResponse(BaseModel):
    run: CandidateRunOut
    results: List[CandidateResultOut]
