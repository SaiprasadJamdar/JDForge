from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

class NotificationOut(BaseModel):
    id: UUID
    recipient_id: UUID
    sender_id: Optional[UUID]
    jd_id: Optional[UUID]
    type: str
    status: str
    message: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

class NotificationRespond(BaseModel):
    accept: bool
