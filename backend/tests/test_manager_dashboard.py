"""Tests for manager dashboard endpoints (/api/dashboard/manager)."""

import uuid
from app.models.dashboard import Farm, FarmDashboard, ManagerDashboard


def _seed_farm(db, user, name="Test Farm", location="Dublin"):
    farm = Farm(
        user_id=user.user_id,
        farm_name=name,
        location=location,
        nature_credits=10.0,
        income=500.0,
        reliability_score=0.85,
    )
    db.add(farm)
    db.flush()
    db.add(FarmDashboard(farm_id=farm.farm_id, farm_dashboard_name=name))
    db.commit()
    db.refresh(farm)
    return farm


class TestCreateManagerDashboard:
    def test_create_empty(self, client, auth_header):
        resp = client.post("/api/dashboard/manager", json={
            "dashboard_name": "My Manager View",
            "farm_ids": [],
        }, headers=auth_header)
        assert resp.status_code == 201
        data = resp.json()
        assert data["manager_dashboard_name"] == "My Manager View"
        assert data["farm_ids"] == []
        assert data["total_nature_credits"] == 0.0

    def test_create_with_farms(self, client, db, auth_header, user_and_token):
        user, _ = user_and_token
        f1 = _seed_farm(db, user, "Farm A")
        f2 = _seed_farm(db, user, "Farm B", "Cork")

        resp = client.post("/api/dashboard/manager", json={
            "dashboard_name": "Portfolio",
            "farm_ids": [str(f1.farm_id), str(f2.farm_id)],
        }, headers=auth_header)
        assert resp.status_code == 201
        data = resp.json()
        assert len(data["farm_ids"]) == 2
        assert data["total_nature_credits"] == 20.0
        assert data["total_income"] == 1000.0
        assert data["avg_reliability"] == 0.85

    def test_create_with_nonexistent_farm(self, client, auth_header):
        resp = client.post("/api/dashboard/manager", json={
            "dashboard_name": "Bad",
            "farm_ids": [str(uuid.uuid4())],
        }, headers=auth_header)
        assert resp.status_code == 404

    def test_no_auth(self, client):
        resp = client.post("/api/dashboard/manager", json={
            "dashboard_name": "X",
        })
        assert resp.status_code == 401


class TestGetManagerDashboards:
    def test_list_empty(self, client, auth_header):
        resp = client.get("/api/dashboard/manager", headers=auth_header)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_returns_owned(self, client, db, auth_header, user_and_token):
        user, _ = user_and_token
        md = ManagerDashboard(user_id=user.user_id, manager_dashboard_name="Test")
        db.add(md)
        db.commit()

        resp = client.get("/api/dashboard/manager", headers=auth_header)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_get_single(self, client, db, auth_header, user_and_token):
        user, _ = user_and_token
        md = ManagerDashboard(user_id=user.user_id, manager_dashboard_name="Test")
        db.add(md)
        db.commit()
        db.refresh(md)

        resp = client.get(f"/api/dashboard/manager/{md.manager_dashboard_id}", headers=auth_header)
        assert resp.status_code == 200
        assert resp.json()["manager_dashboard_name"] == "Test"

    def test_get_not_found(self, client, auth_header):
        resp = client.get(f"/api/dashboard/manager/{uuid.uuid4()}", headers=auth_header)
        assert resp.status_code == 404


class TestUpdateManagerDashboardName:
    def test_rename(self, client, db, auth_header, user_and_token):
        user, _ = user_and_token
        md = ManagerDashboard(user_id=user.user_id, manager_dashboard_name="Old Name")
        db.add(md)
        db.commit()
        db.refresh(md)

        resp = client.patch(f"/api/dashboard/manager/{md.manager_dashboard_id}/name", json={
            "dashboard_name": "New Name",
        }, headers=auth_header)
        assert resp.status_code == 200
        assert resp.json()["manager_dashboard_name"] == "New Name"

    def test_rename_not_found(self, client, auth_header):
        resp = client.patch(f"/api/dashboard/manager/{uuid.uuid4()}/name", json={
            "dashboard_name": "X",
        }, headers=auth_header)
        assert resp.status_code == 404
