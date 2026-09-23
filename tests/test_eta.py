import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_broadcast_eta_departure():
    """Verify resident can broadcast departure and start ETA buffer."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "spot_id": "spot-a-01",
            "minutes_remaining": 20,
            "host_name": "Ahmet Yılmaz",
            "note": "Leaving office now.",
        }
        res = await client.post("/api/eta/broadcast", json=payload)

    assert res.status_code == 201
    data = res.json()
    assert data["spot_number"] == "A-01"
    assert data["minutes_remaining"] == 20
    assert data["is_active"] is True
    assert len(data["alternative_suggestions"]) > 0


@pytest.mark.asyncio
async def test_get_active_eta_alerts():
    """Verify active alerts endpoint returns the live alert."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Broadcast alert
        await client.post(
            "/api/eta/broadcast",
            json={"spot_id": "spot-a-08", "minutes_remaining": 15, "host_name": "Selin Aydın"},
        )

        # Fetch active
        res = await client.get("/api/eta/active")

    assert res.status_code == 200
    alerts = res.json()
    assert len(alerts) > 0
    assert any(a["spot_number"] == "A-08" for a in alerts)


@pytest.mark.asyncio
async def test_resolve_eta_alert():
    """Verify dismissing an ETA alert removes it from active alerts."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create
        res_create = await client.post(
            "/api/eta/broadcast",
            json={"spot_id": "spot-b-02", "minutes_remaining": 30, "host_name": "Buse Aksoy"},
        )
        alert_id = res_create.json()["id"]

        # Resolve
        res_res = await client.post(f"/api/eta/{alert_id}/resolve")
        assert res_res.status_code == 200
        assert res_res.json()["is_active"] is False


@pytest.mark.asyncio
async def test_eta_error_cases():
    """Verify error cases for ETA broadcast and resolution."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Broadcast on unknown spot -> 400
        res_unknown = await client.post(
            "/api/eta/broadcast",
            json={"spot_id": "spot-unknown-99", "minutes_remaining": 15, "host_name": "Ghost"},
        )
        assert res_unknown.status_code == 400

        # Resolve unknown alert -> 404
        res_404 = await client.post("/api/eta/unknown-broadcast-id/resolve")
        assert res_404.status_code == 404
