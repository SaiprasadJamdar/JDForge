from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel


class GenerateJDRequest(BaseModel):
    transcript_id: UUID
    template: Optional[str] = None
    transcript: Optional[str] = None


class RefineJDRequest(BaseModel):
    tags: List[str]
    prompt: str


class JDOut(BaseModel):
    id: UUID
    user_id: UUID
    transcript_id: Optional[UUID]
    title: str
    slug: str
    status: str
    content: str
    template_used: Optional[str]
    quality_score: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class JDUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None


class JDListItem(BaseModel):
    id: UUID
    title: str
    slug: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class GenerateJDResponse(BaseModel):
    jds: List[JDOut]   # one per detected role


class ScoreJDRequest(BaseModel):
    transcript: str
    jd: str


class ScoreJDResponse(BaseModel):
    report: str
    scores: Dict[str, Any]


class InviteUserRequest(BaseModel):
    email: str


class CollaboratorOut(BaseModel):
    user_id: UUID
    name: Optional[str]
    email: str
    is_owner: bool

    model_config = {"from_attributes": True}
