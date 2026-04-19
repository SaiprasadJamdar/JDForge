import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID

from backend.database import Base


class CandidateRun(Base):
    """Represents one execution of the ATS ranking pipeline against a JD."""
    __tablename__ = "candidate_runs"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    jd_id           = Column(UUID(as_uuid=True), ForeignKey("jds.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id         = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    total_fetched   = Column(Integer, default=0)
    top_n           = Column(Integer, default=15)
    zoho_source_url = Column(String(500))
    created_at      = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class CandidateResult(Base):
    """One ranked candidate result within a CandidateRun."""
    __tablename__ = "candidate_results"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id              = Column(UUID(as_uuid=True), ForeignKey("candidate_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    zoho_candidate_id   = Column(String(100))               # e.g. ZR_001_CAND
    full_name           = Column(String(255))
    current_job_title   = Column(String(300))
    current_employer    = Column(String(300))
    experience_years    = Column(Integer)
    skill_set           = Column(Text)                       # raw CSV from Zoho
    city                = Column(String(100))
    state               = Column(String(100))
    country             = Column(String(100))
    source              = Column(String(100))
    qualification       = Column(String(200))
    zoho_rating         = Column(Integer)
    candidate_status    = Column(String(100))
    email               = Column(String(255))
    # ATS scoring
    match_percentage    = Column(Integer, nullable=False)
    matched_skills      = Column(ARRAY(Text))               # native PG array
    missing_skills      = Column(ARRAY(Text))
    score_breakdown     = Column(JSONB)                     # {req, pref, title, exp, boost}
    explanation         = Column(Text)
    rank                = Column(Integer, nullable=False)
    created_at          = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
