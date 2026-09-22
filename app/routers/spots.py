from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from app.models.spot import (
    ParkingSpot,
    SpotStatus,
    SpotSummary,
)
from app.services.spot_service import spot_service

router = APIRouter(prefix="/api/spots", tags=["Parking Spots"])


@router.get("", response_model=list[ParkingSpot])
async def list_spots(
    block: Annotated[str | None, Query(description="Filter by Block letter (A or B)")] = None,
    status: Annotated[SpotStatus | None, Query(description="Filter by spot status")] = None,
    has_ev: Annotated[bool | None, Query(description="Filter by EV charger availability")] = None,
    is_vacation: Annotated[bool | None, Query(description="Filter by vacation mode")] = None,
) -> list[ParkingSpot]:
    """Retrieve all residential parking spots with optional filtering."""
    return spot_service.get_all_spots(
        block=block,
        status=status,
        has_ev=has_ev,
        is_vacation=is_vacation,
    )


@router.get("/summary/stats", response_model=SpotSummary)
async def get_spots_summary() -> SpotSummary:
    """Retrieve summary statistics for the complex parking allocation."""
    return spot_service.get_summary()


@router.get("/{spot_id}", response_model=ParkingSpot)
async def get_spot(spot_id: str) -> ParkingSpot:
    """Retrieve detailed information for a specific parking spot."""
    spot = spot_service.get_spot_by_id(spot_id)
    if not spot:
        raise HTTPException(status_code=404, detail=f"Parking spot '{spot_id}' not found")
    return spot
