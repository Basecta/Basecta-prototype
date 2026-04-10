from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert
from datetime import datetime
from uuid import UUID

from app.database import get_db
from app.models.staff_user import StaffUser
from app.models.staff_notification import StaffNotification
from app.api.staff_auth import get_current_staff

router = APIRouter(prefix="/api/staff/notifications", tags=["staff-notifications"])


def _upsert_system_notifications(staff: StaffUser, db: Session) -> None:
    """Insert any system notifications that should exist for this staff member."""
    candidates = []

    # Example: welcome notification on first login (extend here as needed)
    candidates.append({
        "staff_id": staff.staff_id,
        "notification_key": "welcome",
        "title": "Welcome to the Staff Portal",
        "message": f"You are signed in as {staff.role.capitalize()}. Use the sidebar to navigate your tools.",
        "action_url": None,
        "created_at": staff.created_at,
    })

    for c in candidates:
        stmt = pg_insert(StaffNotification).values(**c).on_conflict_do_nothing(
            constraint="uq_staff_notification_key"
        )
        db.execute(stmt)

    db.commit()


def _is_dismissible(n: StaffNotification) -> bool:
    return True


def _to_dict(n: StaffNotification, dismissible: bool) -> dict:
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
def get_staff_notifications(
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(get_current_staff),
):
    _upsert_system_notifications(staff, db)

    rows = (
        db.query(StaffNotification)
        .filter(
            StaffNotification.staff_id == staff.staff_id,
            StaffNotification.dismissed_at.is_(None),
        )
        .order_by(StaffNotification.created_at.desc())
        .all()
    )
    return [_to_dict(n, _is_dismissible(n)) for n in rows]


@router.patch("/{notification_id}/read")
def mark_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(get_current_staff),
):
    n = db.query(StaffNotification).filter(
        StaffNotification.id == notification_id,
        StaffNotification.staff_id == staff.staff_id,
    ).first()
    if not n:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    if not n.read_at:
        n.read_at = datetime.utcnow()
        db.commit()
    return _to_dict(n, _is_dismissible(n))


@router.delete("/{notification_id}")
def dismiss_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(get_current_staff),
):
    n = db.query(StaffNotification).filter(
        StaffNotification.id == notification_id,
        StaffNotification.staff_id == staff.staff_id,
    ).first()
    if not n:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    if not _is_dismissible(n):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This notification cannot be dismissed yet")
    n.dismissed_at = datetime.utcnow()
    db.commit()
    return {"ok": True}
