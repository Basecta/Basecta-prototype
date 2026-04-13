from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import engine, Base
from app.models import survey as _survey_models        # noqa: F401
from app.models import dashboard as _dashboard_models  # noqa: F401
from app.models import evaluation_request as _evaluation_request_models  # noqa: F401
from app.models import notification as _notification_models  # noqa: F401
from app.models import pending_verification as _pending_verification_models  # noqa: F401
from app.models import password_reset_token as _password_reset_token_models  # noqa: F401
from app.models import refresh_token as _refresh_token_models  # noqa: F401
from app.models import staff_user as _staff_user_models  # noqa: F401
from app.models import staff_refresh_token as _staff_refresh_token_models  # noqa: F401
from app.models import staff_notification as _staff_notification_models  # noqa: F401
from app.api import auth, upload, survey, dashboard, notifications, staff_auth, staff_notifications

# Create database tables
Base.metadata.create_all(bind=engine)

# PostgreSQL trigger: whenever a row is inserted into `farms`, automatically
# create a matching row in `farm_dashboards` with dashboard_name = farm name.
# CREATE OR REPLACE makes this idempotent on every restart.
_TRIGGER_SQL = """
CREATE OR REPLACE FUNCTION fn_create_farm_dashboard()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO farm_dashboards (farm_id, farm_dashboard_name)
    VALUES (NEW.farm_id, NEW.farm_name)
    ON CONFLICT (farm_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_farm_dashboard ON farms;

CREATE TRIGGER trg_create_farm_dashboard
AFTER INSERT ON farms
FOR EACH ROW EXECUTE FUNCTION fn_create_farm_dashboard();
"""

_PENDING_UNIQUE_SQL = """
-- Remove any duplicate pending verifications, keeping the most recent per email
DELETE FROM pending_verifications p1
USING pending_verifications p2
WHERE p1.email = p2.email AND p1.created_at < p2.created_at;

-- Add unique constraint on email if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_pending_verifications_email'
    ) THEN
        ALTER TABLE pending_verifications
        ADD CONSTRAINT uq_pending_verifications_email UNIQUE (email);
    END IF;
END $$;
"""

# Idempotent migration: add description fields to the farms table so existing
# databases pick them up without a full Alembic migration flow.
_FARM_DESCRIPTION_COLUMNS_SQL = """
ALTER TABLE farms ADD COLUMN IF NOT EXISTS asset_type VARCHAR;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS size_hectares DOUBLE PRECISION;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS region VARCHAR;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS description TEXT;
"""

with engine.connect() as conn:
    conn.execute(text(_TRIGGER_SQL))
    conn.execute(text(_PENDING_UNIQUE_SQL))
    conn.execute(text(_FARM_DESCRIPTION_COLUMNS_SQL))
    conn.commit()

app = FastAPI(title="Biodiversity Farm API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(survey.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)
app.include_router(staff_auth.router)
app.include_router(staff_notifications.router)

@app.get("/")
def read_root():
    return {"message": "Basecta API"}