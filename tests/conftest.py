import pytest

from app.services.booking_service import booking_service
from app.services.eta_service import eta_service
from app.services.spot_service import spot_service


@pytest.fixture(autouse=True)
def reset_in_memory_state():
    """Keep singleton services isolated across tests."""
    spot_service.reset()
    booking_service.reset()
    eta_service.reset()
    yield
    spot_service.reset()
    booking_service.reset()
    eta_service.reset()
