import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


def _client():
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.mark.asyncio
async def test_full_user_journey_reserve_gate_eta_swap_release():
    """Reserve → gate check → owner departure → buffer → swap → release."""
    async with _client() as client:
        reserve = await client.post(
            "/api/bookings",
            json={
                "spot_id": "spot-a-01",
                "booking_type": "guest",
                "vehicle_plate": "34  şah  42",
                "driver_name": "Caner Misafir",
                "host_flat_number": 1,
                "duration_hours": 4,
                "notes": "Weekend guest",
            },
        )
        assert reserve.status_code == 201
        booking = reserve.json()
        assert booking["vehicle_plate"] == "34 SAH 42"
        booking_id = booking["id"]

        gate = await client.get("/api/security/verify", params={"plate": "34SAH42"})
        assert gate.status_code == 200
        assert gate.json()["is_authorized"] is True
        assert gate.json()["permit_code"] == booking["permit_code"]

        eta = await client.post(
            "/api/eta/broadcast",
            json={"spot_id": "spot-a-01", "minutes_remaining": 20, "host_name": "Ahmet Yılmaz"},
        )
        assert eta.status_code == 201
        alert = eta.json()
        assert alert["target_vehicle_plate"] == "34 SAH 42"
        assert alert["is_active"] is True
        assert len(alert["alternative_suggestions"]) >= 1
        alt_id = alert["alternative_suggestions"][0]["spot_id"]

        active = await client.get("/api/eta/active")
        assert any(a["id"] == alert["id"] for a in active.json())

        swapped = await client.post(f"/api/bookings/{booking_id}/swap", json={"new_spot_id": alt_id})
        assert swapped.status_code == 201
        new_booking = swapped.json()
        assert new_booking["spot_id"] == alt_id
        assert new_booking["vehicle_plate"] == "34 SAH 42"

        old_spot = await client.get("/api/spots/spot-a-01")
        assert old_spot.json()["status"] == "available"

        still_active = await client.get("/api/eta/active")
        assert all(a["id"] != alert["id"] for a in still_active.json())

        release = await client.post(f"/api/bookings/{new_booking['id']}/complete")
        assert release.status_code == 200
        assert release.json()["status"] == "completed"

        dest = await client.get(f"/api/spots/{alt_id}")
        assert dest.json()["status"] in {"available", "away_vacation"}
        assert dest.json()["current_vehicle_plate"] is None


@pytest.mark.asyncio
async def test_booking_collision_on_same_spot():
    async with _client() as client:
        first = await client.post(
            "/api/bookings",
            json={
                "spot_id": "spot-b-01",
                "booking_type": "second_car",
                "vehicle_plate": "34 AAA 111",
                "driver_name": "First Driver",
                "duration_hours": 4,
            },
        )
        assert first.status_code == 201
        second = await client.post(
            "/api/bookings",
            json={
                "spot_id": "spot-b-01",
                "booking_type": "guest",
                "vehicle_plate": "34 BBB 222",
                "driver_name": "Second Driver",
                "duration_hours": 2,
            },
        )
        assert second.status_code == 400
        assert "cannot be reserved" in second.json()["detail"] or "overlapping" in second.json()["detail"] or "active" in second.json()["detail"]
