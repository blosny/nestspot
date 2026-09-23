import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_create_second_car_booking():
    """Verify creating a second car booking reserves the spot."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "spot_id": "spot-a-04",
            "booking_type": "second_car",
            "vehicle_plate": "34 ABC 789",
            "driver_name": "Deniz Polat",
            "host_flat_number": 4,
            "duration_hours": 3,
        }
        res = await client.post("/api/bookings", json=payload)

    assert res.status_code == 201
    data = res.json()
    assert data["spot_number"] == "A-04"
    assert data["permit_code"].startswith("NST-")
    assert data["vehicle_plate"] == "34 ABC 789"
    assert data["status"] == "active"


@pytest.mark.asyncio
async def test_cannot_book_occupied_spot():
    """Verify booking fails if spot is already occupied."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "spot_id": "spot-a-02",  # Occupied by owner
            "booking_type": "guest",
            "vehicle_plate": "34 GST 111",
            "driver_name": "Test Visitor",
            "host_flat_number": 2,
            "duration_hours": 2,
        }
        res = await client.post("/api/bookings", json=payload)

    assert res.status_code == 400
    assert "cannot be reserved" in res.json()["detail"]


@pytest.mark.asyncio
async def test_complete_booking_flow():
    """Verify booking can be completed and releases the spot."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create booking on A-06
        res = await client.post(
            "/api/bookings",
            json={
                "spot_id": "spot-a-06",
                "booking_type": "guest",
                "vehicle_plate": "34 REL 999",
                "driver_name": "Release Test",
                "duration_hours": 2,
            },
        )
        assert res.status_code == 201
        booking_id = res.json()["id"]

        # Complete booking
        res_comp = await client.post(f"/api/bookings/{booking_id}/complete")
        assert res_comp.status_code == 200
        assert res_comp.json()["status"] == "completed"

        # Check spot is free again
        res_spot = await client.get("/api/spots/spot-a-06")
        assert res_spot.json()["status"] == "available"
