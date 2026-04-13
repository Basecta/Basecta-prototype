"""Tests for farm/asset dashboard endpoints (/api/dashboard/farms)."""

from app.models.dashboard import Farm, FarmDashboard
from app.models.evaluation_request import EvaluationRequest


# ── Helper to create a farm directly in the DB (no PG trigger in SQLite) ───────

def _seed_farm(db, user, name="Test Farm", location="Dublin"):
    """Create a farm + its dashboard row (mimics the PG trigger)."""
    farm = Farm(
        user_id=user.user_id,
        farm_name=name,
        location=location,
        nature_credits=0.0,
        income=0.0,
        reliability_score=0.0,
    )
    db.add(farm)
    db.flush()
    db.add(FarmDashboard(farm_id=farm.farm_id, farm_dashboard_name=name))
    db.commit()
    db.refresh(farm)
    return farm


# ── Create farm ────────────────────────────────────────────────────────────────

class TestCreateFarm:
    def test_create_farm_success(self, client, db, auth_header, user_and_token):
        resp = client.post("/api/dashboard/farms", json={
            "farm_name": "Green Acres",
            "location": "Galway, Ireland",
            "asset_type": "Farm",
            "size_hectares": 50.5,
            "region": "West",
            "description": "A beautiful farmland.",
        }, headers=auth_header)
        assert resp.status_code == 201
        data = resp.json()
        assert data["farm_name"] == "Green Acres"
        assert data["location"] == "Galway, Ireland"
        assert data["asset_type"] == "Farm"
        assert data["size_hectares"] == 50.5
        assert data["nature_credits"] == 0.0
        assert data["income"] == 0.0
        assert data["has_evaluation_request"] is False

    def test_create_farm_minimal_fields(self, client, auth_header):
        resp = client.post("/api/dashboard/farms", json={
            "farm_name": "Minimal Farm",
            "location": "Cork",
        }, headers=auth_header)
        assert resp.status_code == 201
        data = resp.json()
        assert data["asset_type"] is None
        assert data["size_hectares"] is None

    def test_create_farm_no_auth(self, client):
        resp = client.post("/api/dashboard/farms", json={
            "farm_name": "No Auth Farm",
            "location": "Nowhere",
        })
        assert resp.status_code == 401


# ── Read farms ─────────────────────────────────────────────────────────────────

class TestGetFarms:
    def test_get_farms_empty(self, client, auth_header):
        resp = client.get("/api/dashboard/farms", headers=auth_header)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_get_farms_returns_owned(self, client, db, auth_header, user_and_token):
        user, _ = user_and_token
        _seed_farm(db, user, "Farm A")
        _seed_farm(db, user, "Farm B", "Cork")

        resp = client.get("/api/dashboard/farms", headers=auth_header)
        assert resp.status_code == 200
        farms = resp.json()
        assert len(farms) == 2
        names = {f["farm_name"] for f in farms}
        assert names == {"Farm A", "Farm B"}

    def test_get_single_farm(self, client, db, auth_header, user_and_token):
        user, _ = user_and_token
        farm = _seed_farm(db, user)

        resp = client.get(f"/api/dashboard/farms/{farm.farm_id}", headers=auth_header)
        assert resp.status_code == 200
        assert resp.json()["farm_id"] == str(farm.farm_id)

    def test_get_farm_not_found(self, client, auth_header):
        import uuid
        resp = client.get(f"/api/dashboard/farms/{uuid.uuid4()}", headers=auth_header)
        assert resp.status_code == 404

    def test_get_farm_wrong_user(self, client, db, user_and_token):
        """A user should not see another user's farm."""
        from app.models.user import User
        from app.utils.security import hash_password, create_access_token

        user, _ = user_and_token
        farm = _seed_farm(db, user)

        # Create a different user
        other = User(username="other", email="other@example.com", hashed_password=hash_password("Other1234!"))
        db.add(other)
        db.commit()
        db.refresh(other)
        other_token = create_access_token(data={"sub": other.email, "user_id": str(other.user_id)})

        resp = client.get(
            f"/api/dashboard/farms/{farm.farm_id}",
            headers={"Authorization": f"Bearer {other_token}"},
        )
        assert resp.status_code == 404


# ── Update farm ────────────────────────────────────────────────────────────────

class TestUpdateFarm:
    def test_update_farm_partial(self, client, db, auth_header, user_and_token):
        user, _ = user_and_token
        farm = _seed_farm(db, user)

        resp = client.patch(f"/api/dashboard/farms/{farm.farm_id}", json={
            "description": "Updated description",
        }, headers=auth_header)
        assert resp.status_code == 200
        assert resp.json()["description"] == "Updated description"
        # Other fields should remain unchanged
        assert resp.json()["farm_name"] == "Test Farm"

    def test_update_farm_multiple_fields(self, client, db, auth_header, user_and_token):
        user, _ = user_and_token
        farm = _seed_farm(db, user)

        resp = client.patch(f"/api/dashboard/farms/{farm.farm_id}", json={
            "asset_type": "Woodland",
            "size_hectares": 100.0,
            "region": "North",
        }, headers=auth_header)
        assert resp.status_code == 200
        data = resp.json()
        assert data["asset_type"] == "Woodland"
        assert data["size_hectares"] == 100.0
        assert data["region"] == "North"

    def test_update_farm_not_found(self, client, auth_header):
        import uuid
        resp = client.patch(f"/api/dashboard/farms/{uuid.uuid4()}", json={
            "description": "anything",
        }, headers=auth_header)
        assert resp.status_code == 404


# ── Dashboard name ─────────────────────────────────────────────────────────────

class TestUpdateDashboardName:
    def test_update_dashboard_name(self, client, db, auth_header, user_and_token):
        user, _ = user_and_token
        farm = _seed_farm(db, user)

        resp = client.patch(f"/api/dashboard/farms/{farm.farm_id}/name", json={
            "dashboard_name": "My Custom Name",
        }, headers=auth_header)
        assert resp.status_code == 200
        assert resp.json()["farm_dashboard_name"] == "My Custom Name"


# ── Evaluation requests ────────────────────────────────────────────────────────

class TestEvaluationRequest:
    def test_create_evaluation_request(self, client, db, auth_header, user_and_token):
        user, _ = user_and_token
        farm = _seed_farm(db, user)

        responses = {
            "landowner_confirmed": True,
            "preferred_month": "June",
            "access_type": "Open gate",
        }
        resp = client.post(f"/api/dashboard/farms/{farm.farm_id}/evaluation-request", json={
            "responses": responses,
        }, headers=auth_header)
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "pending"
        assert data["farm_id"] == str(farm.farm_id)
        assert data["responses"]["landowner_confirmed"] is True

    def test_get_evaluation_request(self, client, db, auth_header, user_and_token):
        user, _ = user_and_token
        farm = _seed_farm(db, user)

        # No request yet
        resp = client.get(f"/api/dashboard/farms/{farm.farm_id}/evaluation-request", headers=auth_header)
        assert resp.status_code == 200
        assert resp.json() is None

        # Create one
        client.post(f"/api/dashboard/farms/{farm.farm_id}/evaluation-request", json={
            "responses": {"q1": "a1"},
        }, headers=auth_header)

        resp = client.get(f"/api/dashboard/farms/{farm.farm_id}/evaluation-request", headers=auth_header)
        assert resp.status_code == 200
        assert resp.json()["status"] == "pending"

    def test_evaluation_request_shows_in_farm_list(self, client, db, auth_header, user_and_token):
        user, _ = user_and_token
        farm = _seed_farm(db, user)

        # Before evaluation request
        resp = client.get("/api/dashboard/farms", headers=auth_header)
        assert resp.json()[0]["has_evaluation_request"] is False

        # Submit evaluation request
        client.post(f"/api/dashboard/farms/{farm.farm_id}/evaluation-request", json={
            "responses": {"q1": "a1"},
        }, headers=auth_header)

        # After evaluation request
        resp = client.get("/api/dashboard/farms", headers=auth_header)
        assert resp.json()[0]["has_evaluation_request"] is True

    def test_evaluation_request_wrong_farm(self, client, auth_header):
        import uuid
        resp = client.post(f"/api/dashboard/farms/{uuid.uuid4()}/evaluation-request", json={
            "responses": {"q1": "a1"},
        }, headers=auth_header)
        assert resp.status_code == 404
