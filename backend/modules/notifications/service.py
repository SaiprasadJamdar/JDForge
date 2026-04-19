from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from backend.modules.notifications.model import Notification
from backend.modules.jd.model import JDCollaborator

def list_notifications(db: Session, user_id: UUID) -> List[Notification]:
    return db.query(Notification).filter(
        Notification.recipient_id == user_id
    ).order_by(Notification.created_at.desc()).all()

def respond_to_invite(db: Session, notification_id: UUID, user_id: UUID, accept: bool) -> Optional[Notification]:
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.recipient_id == user_id
    ).first()
    
    if not notification:
        return None
    
    if accept:
        # If accepted, add to collaborators
        if notification.jd_id:
            # Check if already there
            exists = db.query(JDCollaborator).filter(
                JDCollaborator.jd_id == notification.jd_id,
                JDCollaborator.user_id == user_id
            ).first()
            
            if not exists:
                collaborator = JDCollaborator(
                    jd_id=notification.jd_id,
                    user_id=user_id
                )
                db.add(collaborator)
        
        notification.status = "accepted"
    else:
        notification.status = "declined"
    
    db.commit()
    db.refresh(notification)
    return notification

def clear_all_notifications(db: Session, user_id: UUID) -> bool:
    """Deletes all notifications for the specified user."""
    db.query(Notification).filter(Notification.recipient_id == user_id).delete()
    db.commit()
    return True
