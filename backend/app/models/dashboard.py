import uuid
from sqlalchemy import Column, Float, String, ForeignKey, UniqueConstraint, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Farm(Base):
    __tablename__ = "farms"

    farm_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    farm_name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    nature_credits = Column(Float, nullable=False, default=0.0)
    income = Column(Float, nullable=False, default=0.0)
    reliability_score = Column(Float, nullable=False, default=0.0)

    # Asset description fields — added for asset-creation flow. All nullable so
    # existing rows (and the DB-level trigger) keep working unchanged.
    asset_type = Column(String, nullable=True)        # e.g. Farm / Woodland / Wetland / Mixed / Other
    size_hectares = Column(Float, nullable=True)
    region = Column(String, nullable=True)            # free-text region / country
    description = Column(Text, nullable=True)


class FarmDashboard(Base):
    __tablename__ = "farm_dashboards"

    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.farm_id", ondelete="CASCADE"), primary_key=True)
    farm_dashboard_name = Column(String, nullable=False)


class ManagerDashboard(Base):
    __tablename__ = "manager_dashboards"

    manager_dashboard_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    manager_dashboard_name = Column(String, nullable=False)


class ManagerDashboardFarm(Base):
    """Junction table linking manager dashboards to farms."""
    __tablename__ = "manager_dashboard_farms"

    manager_dashboard_id = Column(UUID(as_uuid=True), ForeignKey("manager_dashboards.manager_dashboard_id", ondelete="CASCADE"), primary_key=True)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.farm_id", ondelete="CASCADE"), primary_key=True)
