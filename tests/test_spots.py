import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_get_all_spots():
    """Verify listing all spots returns 24 residential spots."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/spots")

    assert response.status_code == 200
    spots = response.json()
    assert len(spots) == 24
    assert any(s["block"] == "A" for s in spots)
    assert any(s["block"] == "B" for s in spots)


@pytest.mark.asyncio
async def test_filter_spots_by_block():
    """Verify filtering by Block A and Block B."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_a = await client.get("/api/spots?block=A")
        res_b = await client.get("/api/spots?block=B")

    assert res_a.status_code == 200
    assert len(res_a.json()) == 12
    assert all(s["block"] == "A" for s in res_a.json())

    assert res_b.status_code == 200
    assert len(res_b.json()) == 12
    assert all(s["block"] == "B" for s in res_b.json())


@pytest.mark.asyncio
async def test_filter_spots_by_ev():
    """Verify filtering spots with EV wallbox chargers."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/spots?has_ev=true")

    assert response.status_code == 200
    ev_spots = response.json()
    assert len(ev_spots) > 0
    assert all(s["has_ev_charger"] is True for s in ev_spots)


@pytest.mark.asyncio
async def test_get_spot_by_id():
    """Verify retrieving specific spot details by ID."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/spots/spot-a-01")

    assert response.status_code == 200
    spot = response.json()
    assert spot["id"] == "spot-a-01"
    assert spot["spot_number"] == "A-01"
    assert spot["block"] == "A"
    assert spot["flat_number"] == 1


@pytest.mark.asyncio
async def test_get_nonexistent_spot_returns_404():
    """Verify 404 response for unknown spot ID."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/spots/non-existent-spot-id")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_summary_stats():
    """Verify summary stats endpoint returns proper counts."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/spots/summary/stats")

    assert response.status_code == 200
    stats = response.json()
    assert stats["total_spots"] == 24
    assert stats["available_now"] > 0
    assert stats["ev_spots_count"] > 0
