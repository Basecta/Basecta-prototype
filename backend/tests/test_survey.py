"""Tests for survey + notification endpoints."""

from app.models.survey import SurveyResponse
from app.models.notification import Notification


# ── Survey ─────────────────────────────────────────────────────────────────────

class TestSurveyStatus:
    def test_status_not_submitted(self, client, auth_header):
        resp = client.get("/api/survey/status", headers=auth_header)
        assert resp.status_code == 200
        assert resp.json()["submitted"] is False

    def test_status_after_submit(self, client, db, auth_header, user_and_token):
        user, _ = user_and_token
        sr = SurveyResponse(user_id=user.user_id, responses={"q1": "a1"})
        db.add(sr)
        db.commit()

        resp = client.get("/api/survey/status", headers=auth_header)
        assert resp.status_code == 200
        assert resp.json()["submitted"] is True

    def test_status_no_auth(self, client):
        resp = client.get("/api/survey/status")
        assert resp.status_code == 401


class TestSurveySubmit:
    def test_submit_success(self, client, auth_header):
        resp = client.post("/api/survey/submit", json={
            "responses": {"role": "farmer", "interest": "credits"},
        }, headers=auth_header)
        assert resp.status_code == 201
        data = resp.json()
        assert data["responses"]["role"] == "farmer"

    def test_submit_duplicate(self, client, auth_header):
        client.post("/api/survey/submit", json={"responses": {"q": "a"}}, headers=auth_header)
        resp = client.post("/api/survey/submit", json={"responses": {"q": "b"}}, headers=auth_header)
        assert resp.status_code == 400
        assert "already submitted" in resp.json()["detail"].lower()

    def test_submit_no_auth(self, client):
        resp = client.post("/api/survey/submit", json={"responses": {"q": "a"}})
        assert resp.status_code == 401


# ── Notifications ──────────────────────────────────────────────────────────────

class TestNotifications:
    def test_get_notifications(self, client, db, auth_header, user_and_token):
        """GET should return notifications for the user."""
        user, _ = user_and_token
        n = Notification(
            user_id=user.user_id,
            notification_key="test_notif",
            title="Test",
            message="Hello",
        )
        db.add(n)
        db.commit()

        resp = client.get("/api/notifications", headers=auth_header)
        assert resp.status_code == 200
        notifs = resp.json()
        # May include system-generated ones too, just check ours is there
        keys = [n["notification_key"] for n in notifs]
        assert "test_notif" in keys

    def test_mark_read(self, client, db, auth_header, user_and_token):
        user, _ = user_and_token
        n = Notification(
            user_id=user.user_id,
            notification_key="read_test",
            title="Read Test",
            message="Mark me read",
        )
        db.add(n)
        db.commit()
        db.refresh(n)

        resp = client.patch(f"/api/notifications/{n.id}/read", headers=auth_header)
        assert resp.status_code == 200
        assert resp.json()["read"] is True

    def test_mark_read_not_found(self, client, auth_header):
        import uuid
        resp = client.patch(f"/api/notifications/{uuid.uuid4()}/read", headers=auth_header)
        assert resp.status_code == 404

    def test_dismiss_notification(self, client, db, auth_header, user_and_token):
        user, _ = user_and_token
        n = Notification(
            user_id=user.user_id,
            notification_key="dismiss_test",
            title="Dismiss Test",
            message="Dismiss me",
        )
        db.add(n)
        db.commit()
        db.refresh(n)

        resp = client.delete(f"/api/notifications/{n.id}", headers=auth_header)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

        # Should no longer appear in the list
        resp = client.get("/api/notifications", headers=auth_header)
        keys = [notif["notification_key"] for notif in resp.json()]
        assert "dismiss_test" not in keys

    def test_dismiss_not_found(self, client, auth_header):
        import uuid
        resp = client.delete(f"/api/notifications/{uuid.uuid4()}", headers=auth_header)
        assert resp.status_code == 404

    def test_no_auth(self, client):
        resp = client.get("/api/notifications")
        assert resp.status_code == 401
