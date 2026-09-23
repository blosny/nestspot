import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


def _client():
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.mark.asyncio
async def test_empty_json_booking_is_rejected():
    async with _client() as client:
        res = await client.post("/api/bookings", json={})
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_malformed_payload_is_rejected():
    async with _client() as client:
        res = await client.post(
            "/api/bookings",
            content=b"{not-json",
            headers={"Content-Type": "application/json"},
        )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_negative_and_zero_duration_rejected():
    async with _client() as client:
        base = {
            "spot_id": "spot-a-04",
            "booking_type": "guest",
            "vehicle_plate": "34 NEG 001",
            "driver_name": "Neg Duration",
        }
        zero = await client.post("/api/bookings", json={**base, "duration_hours": 0})
        negative = await client.post("/api/bookings", json={**base, "duration_hours": -3})
        too_long = await client.post("/api/bookings", json={**base, "duration_hours": 73})
    assert zero.status_code == 422
    assert negative.status_code == 422
    assert too_long.status_code == 422


@pytest.mark.asyncio
async def test_invalid_plates_rejected():
    async with _client() as client:
        too_short = await client.post(
            "/api/bookings",
            json={
                "spot_id": "spot-a-04",
                "vehicle_plate": "ab",
                "driver_name": "Short Plate",
                "duration_hours": 2,
            },
        )
        symbols = await client.post(
            "/api/bookings",
            json={
                "spot_id": "spot-a-04",
                "vehicle_plate": "---",
                "driver_name": "Symbols Only",
                "duration_hours": 2,
            },
        )
        blank = await client.post(
            "/api/bookings",
            json={
                "spot_id": "spot-a-04",
                "vehicle_plate": "   ",
                "driver_name": "Spaces",
                "duration_hours": 2,
            },
        )
    assert too_short.status_code == 422
    assert symbols.status_code == 422
    assert blank.status_code == 422


@pytest.mark.asyncio
async def test_security_gate_fuzz_payloads():
    payloads = [
        "",
        " ",
        "'; DROP TABLE bookings;--",
        "<script>alert(1)</script>",
        "🚗" * 8,
        "A" * 40,
        "%00null",
        "34\nABC\t123",
    ]
    async with _client() as client:
        for plate in payloads:
            res = await client.get("/api/security/verify", params={"plate": plate})
            assert res.status_code in {200, 400, 422}
            if res.status_code == 200:
                body = res.json()
                assert "is_authorized" in body
                assert body["is_authorized"] is False or isinstance(body["message"], str)


@pytest.mark.asyncio
async def test_eta_minutes_out_of_bounds():
    async with _client() as client:
        low = await client.post(
            "/api/eta/broadcast",
            json={"spot_id": "spot-a-01", "minutes_remaining": 4, "host_name": "Ahmet"},
        )
        high = await client.post(
            "/api/eta/broadcast",
            json={"spot_id": "spot-a-01", "minutes_remaining": 121, "host_name": "Ahmet"},
        )
        missing = await client.post("/api/eta/broadcast", json={})
    assert low.status_code == 422
    assert high.status_code == 422
    assert missing.status_code == 422


@pytest.mark.asyncio
async def test_unknown_and_empty_spot_ids():
    async with _client() as client:
        unknown = await client.post(
            "/api/bookings",
            json={
                "spot_id": "spot-z-99",
                "vehicle_plate": "34 UNK 001",
                "driver_name": "Ghost",
                "duration_hours": 2,
            },
        )
        blank_spot = await client.post(
            "/api/bookings",
            json={
                "spot_id": "   ",
                "vehicle_plate": "34 UNK 002",
                "driver_name": "Ghost",
                "duration_hours": 2,
            },
        )
    assert unknown.status_code == 400
    assert blank_spot.status_code == 422
