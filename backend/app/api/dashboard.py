from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.dashboard import Farm, FarmDashboard, ManagerDashboard, ManagerDashboardFarm
from app.models.evaluation_request import EvaluationRequest
from app.schemas.dashboard import (
    FarmOut,
    FarmCreate,
    FarmUpdate,
    ManagerDashboardOut,
    EvaluationRequestCreate,
    EvaluationRequestOut,
)
from app.utils.security import verify_token

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _get_user_id(authorization: str | None) -> UUID:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = verify_token(authorization.replace("Bearer ", ""))
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return UUID(payload["user_id"])


def _has_evaluation_request(db: Session, farm_id: UUID) -> bool:
    return (
        db.query(EvaluationRequest)
        .filter(EvaluationRequest.farm_id == farm_id)
        .first()
        is not None
    )


def _to_farm_out(farm: Farm, nickname: str | None, has_eval: bool = False) -> dict:
    return {
        "farm_id": farm.farm_id,
        "user_id": farm.user_id,
        "farm_name": farm.farm_name,
        "farm_dashboard_name": nickname if nickname is not None else farm.farm_name,
        "location": farm.location,
        "nature_credits": farm.nature_credits,
        "income": farm.income,
        "reliability_score": farm.reliability_score,
        "asset_type": farm.asset_type,
        "size_hectares": farm.size_hectares,
        "region": farm.region,
        "description": farm.description,
        "has_evaluation_request": has_eval,
    }


@router.get("/farms", response_model=list[FarmOut])
def get_farms(authorization: str = Header(None), db: Session = Depends(get_db)):
    user_id = _get_user_id(authorization)
    rows = (
        db.query(Farm, FarmDashboard.farm_dashboard_name)
        .outerjoin(FarmDashboard, FarmDashboard.farm_id == Farm.farm_id)
        .filter(Farm.user_id == user_id)
        .all()
    )
    return [
        _to_farm_out(farm, nickname, _has_evaluation_request(db, farm.farm_id))
        for farm, nickname in rows
    ]


@router.get("/farms/{farm_id}", response_model=FarmOut)
def get_farm(farm_id: UUID, authorization: str = Header(None), db: Session = Depends(get_db)):
    user_id = _get_user_id(authorization)
    row = (
        db.query(Farm, FarmDashboard.farm_dashboard_name)
        .outerjoin(FarmDashboard, FarmDashboard.farm_id == Farm.farm_id)
        .filter(Farm.farm_id == farm_id, Farm.user_id == user_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    farm, nickname = row
    return _to_farm_out(farm, nickname, _has_evaluation_request(db, farm.farm_id))


@router.post("/farms", response_model=FarmOut, status_code=status.HTTP_201_CREATED)
def create_farm(
    body: FarmCreate,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Create a new asset for the current user.

    Metric fields (nature_credits, income, reliability_score) are initialised
    to zero — they'll be populated later via the ecological evaluation flow.
    The DB trigger `trg_create_farm_dashboard` automatically inserts a matching
    farm_dashboards row using farm_name as the default dashboard name.
    """
    user_id = _get_user_id(authorization)

    farm = Farm(
        user_id=user_id,
        farm_name=body.farm_name.strip(),
        location=body.location.strip(),
        nature_credits=0.0,
        income=0.0,
        reliability_score=0.0,
        asset_type=body.asset_type.strip() if body.asset_type else None,
        size_hectares=body.size_hectares,
        region=body.region.strip() if body.region else None,
        description=body.description.strip() if body.description else None,
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)

    nickname = (
        db.query(FarmDashboard.farm_dashboard_name)
        .filter(FarmDashboard.farm_id == farm.farm_id)
        .scalar()
    )
    return _to_farm_out(farm, nickname, has_eval=False)


class DashboardNameUpdate(BaseModel):
    dashboard_name: str


@router.patch("/farms/{farm_id}/name")
def update_dashboard_name(
    farm_id: UUID,
    body: DashboardNameUpdate,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    user_id = _get_user_id(authorization)

    # Verify the farm belongs to this user
    farm = db.query(Farm).filter(Farm.farm_id == farm_id, Farm.user_id == user_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")

    dashboard = db.query(FarmDashboard).filter(FarmDashboard.farm_id == farm_id).first()
    if not dashboard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm dashboard not found")

    dashboard.farm_dashboard_name = body.dashboard_name.strip()
    db.commit()
    return {"farm_dashboard_name": dashboard.farm_dashboard_name}


@router.patch("/farms/{farm_id}", response_model=FarmOut)
def update_farm(
    farm_id: UUID,
    body: FarmUpdate,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Update the editable description fields of an asset."""
    user_id = _get_user_id(authorization)

    farm = db.query(Farm).filter(Farm.farm_id == farm_id, Farm.user_id == user_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")

    data = body.model_dump(exclude_unset=True)
    for field, value in data.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(farm, field, value)

    db.commit()
    db.refresh(farm)

    nickname = (
        db.query(FarmDashboard.farm_dashboard_name)
        .filter(FarmDashboard.farm_id == farm.farm_id)
        .scalar()
    )
    return _to_farm_out(farm, nickname, _has_evaluation_request(db, farm.farm_id))


# ── Evaluation requests ───────────────────────────────────────────────────────


@router.post(
    "/farms/{farm_id}/evaluation-request",
    response_model=EvaluationRequestOut,
    status_code=status.HTTP_201_CREATED,
)
def create_evaluation_request(
    farm_id: UUID,
    body: EvaluationRequestCreate,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Submit a request for an ecologist to evaluate this asset."""
    user_id = _get_user_id(authorization)

    farm = db.query(Farm).filter(Farm.farm_id == farm_id, Farm.user_id == user_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")

    req = EvaluationRequest(
        farm_id=farm_id,
        user_id=user_id,
        responses=body.responses,
        status="pending",
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get(
    "/farms/{farm_id}/evaluation-request",
    response_model=EvaluationRequestOut | None,
)
def get_latest_evaluation_request(
    farm_id: UUID,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Return the most recent evaluation request for this asset, or null."""
    user_id = _get_user_id(authorization)

    farm = db.query(Farm).filter(Farm.farm_id == farm_id, Farm.user_id == user_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")

    req = (
        db.query(EvaluationRequest)
        .filter(EvaluationRequest.farm_id == farm_id)
        .order_by(EvaluationRequest.created_at.desc())
        .first()
    )
    return req


# ── Manager dashboard helpers ─────────────────────────────────────────────────

def _build_manager_out(md: ManagerDashboard, db: Session) -> dict:
    """Return a ManagerDashboardOut-compatible dict with computed aggregates."""
    rows = (
        db.query(Farm)
        .join(ManagerDashboardFarm, ManagerDashboardFarm.farm_id == Farm.farm_id)
        .filter(ManagerDashboardFarm.manager_dashboard_id == md.manager_dashboard_id)
        .all()
    )
    farm_ids = [f.farm_id for f in rows]
    total_nature_credits = sum(f.nature_credits for f in rows)
    total_income = sum(f.income for f in rows)
    avg_reliability = (
        sum(f.reliability_score for f in rows) / len(rows) if rows else 0.0
    )
    return {
        "manager_dashboard_id": md.manager_dashboard_id,
        "user_id": md.user_id,
        "manager_dashboard_name": md.manager_dashboard_name,
        "farm_ids": farm_ids,
        "total_nature_credits": total_nature_credits,
        "total_income": total_income,
        "avg_reliability": round(avg_reliability, 2),
    }


class ManagerDashboardCreate(BaseModel):
    dashboard_name: str
    farm_ids: list[UUID] = []


@router.get("/manager", response_model=list[ManagerDashboardOut])
def get_manager_dashboards(authorization: str = Header(None), db: Session = Depends(get_db)):
    user_id = _get_user_id(authorization)
    dashboards = db.query(ManagerDashboard).filter(ManagerDashboard.user_id == user_id).all()
    return [_build_manager_out(md, db) for md in dashboards]


@router.get("/manager/{dashboard_id}", response_model=ManagerDashboardOut)
def get_manager_dashboard(dashboard_id: UUID, authorization: str = Header(None), db: Session = Depends(get_db)):
    user_id = _get_user_id(authorization)
    md = db.query(ManagerDashboard).filter(
        ManagerDashboard.manager_dashboard_id == dashboard_id,
        ManagerDashboard.user_id == user_id,
    ).first()
    if not md:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manager dashboard not found")
    return _build_manager_out(md, db)


@router.post("/manager", response_model=ManagerDashboardOut, status_code=status.HTTP_201_CREATED)
def create_manager_dashboard(
    body: ManagerDashboardCreate,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    user_id = _get_user_id(authorization)
    md = ManagerDashboard(user_id=user_id, manager_dashboard_name=body.dashboard_name.strip())
    db.add(md)
    db.flush()  # get md.manager_dashboard_id before adding junction rows

    for farm_id in body.farm_ids:
        farm = db.query(Farm).filter(Farm.farm_id == farm_id, Farm.user_id == user_id).first()
        if not farm:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farm {farm_id} not found or does not belong to you",
            )
        db.add(ManagerDashboardFarm(manager_dashboard_id=md.manager_dashboard_id, farm_id=farm_id))

    db.commit()
    db.refresh(md)
    return _build_manager_out(md, db)


@router.patch("/manager/{dashboard_id}/name")
def update_manager_dashboard_name(
    dashboard_id: UUID,
    body: DashboardNameUpdate,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    user_id = _get_user_id(authorization)
    md = db.query(ManagerDashboard).filter(
        ManagerDashboard.manager_dashboard_id == dashboard_id,
        ManagerDashboard.user_id == user_id,
    ).first()
    if not md:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manager dashboard not found")
    md.manager_dashboard_name = body.dashboard_name.strip()
    db.commit()
    return {"manager_dashboard_name": md.manager_dashboard_name}
