from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from pydantic import BaseModel
from app.database import get_db
from app.models.dashboard import Farm, FarmDashboard, ManagerDashboard, ManagerDashboardFarm
from app.schemas.dashboard import FarmOut, ManagerDashboardOut
from app.utils.security import verify_token

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _get_user_id(authorization: str | None) -> UUID:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = verify_token(authorization.replace("Bearer ", ""))
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return UUID(payload["user_id"])


def _to_farm_out(farm: Farm, nickname: str | None) -> dict:
    return {
        "farm_id": farm.farm_id,
        "user_id": farm.user_id,
        "farm_name": farm.farm_name,
        "farm_dashboard_name": nickname if nickname is not None else farm.farm_name,
        "location": farm.location,
        "nature_credits": farm.nature_credits,
        "income": farm.income,
        "reliability_score": farm.reliability_score,
    }


@router.get("/farms", response_model=List[FarmOut])
def get_farms(authorization: str = Header(None), db: Session = Depends(get_db)):
    user_id = _get_user_id(authorization)
    rows = (
        db.query(Farm, FarmDashboard.farm_dashboard_name)
        .outerjoin(FarmDashboard, FarmDashboard.farm_id == Farm.farm_id)
        .filter(Farm.user_id == user_id)
        .all()
    )
    return [_to_farm_out(farm, nickname) for farm, nickname in rows]


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
    return _to_farm_out(farm, nickname)


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
    farm_ids: List[UUID] = []


@router.get("/manager", response_model=List[ManagerDashboardOut])
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
