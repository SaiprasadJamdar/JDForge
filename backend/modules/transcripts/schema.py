from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel


class TranscriptCreate(BaseModel):
    raw_text: str
    source_type: Literal["audio", "video", "text_paste"] = "text_paste"
    source_filename: Optional[str] = None
    language_hint: Optional[str] = None
    duration_secs: Optional[int] = None


class TranscriptOut(BaseModel):
    id: UUID
    source_filename: Optional[str]
    source_type: str
    raw_text: str
    clean_text: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CleanTranscriptResponse(BaseModel):
    transcript_id: UUID
    clean_text: str
