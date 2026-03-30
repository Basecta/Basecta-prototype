from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.survey import SurveyResponse
from app.models.notification import Notification
from app.schemas.survey import SurveyCreate, SurveyResponseOut
from app.utils.security import verify_token

router = APIRouter(prefix="/api/survey", tags=["survey"])


@router.get("/status")
def get_survey_status(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("user_id")
    submitted = db.query(SurveyResponse).filter(SurveyResponse.user_id == user_id).first() is not None
    return {"submitted": submitted}


@router.post("/submit", response_model=SurveyResponseOut, status_code=status.HTTP_201_CREATED)
def submit_survey(
    survey_data: SurveyCreate,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user_id = payload.get("user_id")

    existing = db.query(SurveyResponse).filter(SurveyResponse.user_id == user_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Survey already submitted",
        )

    survey_response = SurveyResponse(
        user_id=user_id,
        responses=survey_data.responses,
    )

    db.add(survey_response)
    db.commit()
    db.refresh(survey_response)

    # Mark the onboarding survey notification as read now that the survey is complete
    notif = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.notification_key == "complete_onboarding_survey",
        Notification.read_at.is_(None),
    ).first()
    if notif:
        notif.read_at = datetime.utcnow()
        db.commit()

    return survey_response
