from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import engine
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

# Tables are managed by Alembic migrations (see alembic/ directory).
# Run `python -m alembic upgrade head` to apply pending migrations.
#
# The farm_dashboards trigger below is kept here because it's a runtime
# database behaviour (not a schema change) — it auto-creates a dashboard
# nickname row whenever a new farm is inserted.
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

with engine.connect() as conn:
    conn.execute(text(_TRIGGER_SQL))
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
