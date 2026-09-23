import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_security_plate_verification_resident():
    """Verify security check confirms resident owner vehicle."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 34 EL 2020 is resident in A-02 (Elif Demir)
        response = await client.get("/api/security/verify?plate=34 EL 2020")

    assert response.status_code == 200
    data = response.json()
    assert data["is_authorized"] is True
    assert data["spot_number"] == "A-02"
    assert data["driver_name"] == "Elif Demir"


@pytest.mark.asyncio
async def test_security_plate_verification_unknown():
    """Verify security check denies unknown unregistered vehicle."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/security/verify?plate=06 UNKNOWN 99")

    assert response.status_code == 200
    data = response.json()
    assert data["is_authorized"] is False
    assert "No active permit" in data["message"]
