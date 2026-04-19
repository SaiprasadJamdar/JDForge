from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import get_current_user
from backend.modules.notifications.schema import NotificationOut, NotificationRespond
from backend.modules.notifications.service import list_notifications, respond_to_invite

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=list[NotificationOut])
def get_all(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return list_notifications(db, current_user.id)

@router.post("/{notification_id}/respond", response_model=NotificationOut)
def respond(
    notification_id: UUID,
    payload: NotificationRespond,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    notif = respond_to_invite(db, notification_id, current_user.id, payload.accept)
    if not notif:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    return notif

@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_all(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    from backend.modules.notifications.service import clear_all_notifications
    clear_all_notifications(db, current_user.id)
    return None
