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


@pytest.mark.asyncio
async def test_get_and_list_bookings():
    """Verify getting a booking by ID and listing bookings with status filter."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create booking on available spot
        res = await client.post(
            "/api/bookings",
            json={
                "spot_id": "spot-b-08",
                "booking_type": "guest",
                "vehicle_plate": "34 LST 001",
                "driver_name": "List Driver",
                "duration_hours": 1,
            },
        )
        assert res.status_code == 201
        booking_id = res.json()["id"]

        # Get by ID
        res_get = await client.get(f"/api/bookings/{booking_id}")
        assert res_get.status_code == 200
        assert res_get.json()["id"] == booking_id

        # Get 404 for unknown booking
        res_404 = await client.get("/api/bookings/unknown-booking-id")
        assert res_404.status_code == 404

        # List all
        res_list = await client.get("/api/bookings")
        assert res_list.status_code == 200
        assert len(res_list.json()) > 0

        # List with filter
        res_active = await client.get("/api/bookings?status=active")
        assert res_active.status_code == 200
        assert all(b["status"] == "active" for b in res_active.json())


@pytest.mark.asyncio
async def test_complete_booking_errors():
    """Verify 404 and 409 error handling when completing bookings."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 404 on unknown booking
        res_unknown = await client.post("/api/bookings/unknown-id/complete")
        assert res_unknown.status_code == 404

        # Complete already completed booking -> 409 Conflict
        res = await client.post(
            "/api/bookings",
            json={
                "spot_id": "spot-b-04",
                "booking_type": "guest",
                "vehicle_plate": "34 DBL 002",
                "driver_name": "Double Complete",
                "duration_hours": 1,
            },
        )
        booking_id = res.json()["id"]
        res_first = await client.post(f"/api/bookings/{booking_id}/complete")
        assert res_first.status_code == 200

        res_second = await client.post(f"/api/bookings/{booking_id}/complete")
        assert res_second.status_code == 409


@pytest.mark.asyncio
async def test_swap_booking_errors():
    """Verify 404 and 400 error handling when swapping spots."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 404 on unknown booking ID
        res_404_booking = await client.post(
            "/api/bookings/unknown-b-id/swap",
            json={"new_spot_id": "spot-b-05"},
        )
        assert res_404_booking.status_code == 404

        # Create active booking
        res = await client.post(
            "/api/bookings",
            json={
                "spot_id": "spot-b-06",
                "booking_type": "guest",
                "vehicle_plate": "34 SWP 003",
                "driver_name": "Swap Tester",
                "duration_hours": 2,
            },
        )
        booking_id = res.json()["id"]

        # Swap to unknown destination spot -> 400 (validation failure on new spot)
        res_dest = await client.post(
            f"/api/bookings/{booking_id}/swap",
            json={"new_spot_id": "spot-nonexistent"},
        )
        assert res_dest.status_code in {400, 404}

        # Swap to occupied spot -> 400
        res_busy = await client.post(
            f"/api/bookings/{booking_id}/swap",
            json={"new_spot_id": "spot-b-03"},  # occupied by owner
        )
        assert res_busy.status_code == 400
