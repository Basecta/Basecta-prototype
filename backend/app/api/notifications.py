from fastapi import APIRouter, Header, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert
from datetime import datetime
from uuid import UUID

from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.models.survey import SurveyResponse
from app.utils.security import verify_token

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def _get_user_id(authorization: str | None) -> UUID:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = verify_token(authorization.replace("Bearer ", ""))
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return UUID(payload["user_id"])


def _upsert_system_notifications(user_id: UUID, user: User, db: Session):
    """Generate system notifications based on current state, inserting any that don't exist yet."""
    candidates = []

    survey = db.query(SurveyResponse).filter(SurveyResponse.user_id == user_id).first()
    if not survey:
        candidates.append({
            "user_id": user_id,
            "notification_key": "complete_onboarding_survey",
            "title": "Complete your onboarding survey",
            "message": "You skipped the onboarding survey during registration. Complete it to help us understand you better.",
            "action_url": "/survey",
            "created_at": user.created_at if user and user.created_at else datetime.utcnow(),
        })

    for c in candidates:
        stmt = pg_insert(Notification).values(**c).on_conflict_do_nothing(
            constraint="uq_user_notification_key"
        )
        db.execute(stmt)

    db.commit()


def _is_dismissible(n: Notification, db: Session) -> bool:
    """A notification is dismissible only once its underlying condition is resolved."""
    if n.notification_key == "complete_onboarding_survey":
        return db.query(SurveyResponse).filter(SurveyResponse.user_id == n.user_id).first() is not None
    return True


def _to_dict(n: Notification, dismissible: bool) -> dict:
    return {
        "id": str(n.id),
        "notification_key": n.notification_key,
        "title": n.title,
        "message": n.message,
        "action_url": n.action_url,
        "created_at": n.created_at.isoformat(),
        "read": n.read_at is not None,
        "dismissible": dismissible,
    }


@router.get("")
def get_notifications(authorization: str = Header(None), db: Session = Depends(get_db)):
    user_id = _get_user_id(authorization)
    user = db.query(User).filter(User.user_id == user_id).first()
    _upsert_system_notifications(user_id, user, db)

    rows = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.dismissed_at.is_(None))
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [_to_dict(n, _is_dismissible(n, db)) for n in rows]


@router.patch("/{notification_id}/read")
def mark_read(notification_id: UUID, authorization: str = Header(None), db: Session = Depends(get_db)):
    user_id = _get_user_id(authorization)
    n = db.query(Notification).filter(
        Notification.id == notification_id, Notification.user_id == user_id
    ).first()
    if not n:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    if not n.read_at:
        n.read_at = datetime.utcnow()
        db.commit()
    return _to_dict(n, _is_dismissible(n, db))


@router.delete("/{notification_id}")
def dismiss_notification(notification_id: UUID, authorization: str = Header(None), db: Session = Depends(get_db)):
    user_id = _get_user_id(authorization)
    n = db.query(Notification).filter(
        Notification.id == notification_id, Notification.user_id == user_id
    ).first()
    if not n:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    if not _is_dismissible(n, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Complete the required action before dismissing this notification")
    n.dismissed_at = datetime.utcnow()
    db.commit()
    return {"ok": True}
