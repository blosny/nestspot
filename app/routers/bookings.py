from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.models.booking import Booking, BookingCreateRequest, BookingStatus
from app.services.booking_service import booking_service

router = APIRouter(prefix="/api/bookings", tags=["Bookings & Permits"])


@router.post("", response_model=Booking, status_code=status.HTTP_201_CREATED)
async def create_booking(req: BookingCreateRequest) -> Booking:
    """Create a new parking reservation for a 2nd car or visitor."""
    try:
        return booking_service.create_booking(req)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e


@router.get("", response_model=list[Booking])
async def list_bookings(
    status: Annotated[BookingStatus | None, Query(description="Filter by status")] = None,
) -> list[Booking]:
    """Retrieve all reservations."""
    return booking_service.get_all_bookings(status=status)


@router.get("/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str) -> Booking:
    """Retrieve details and digital permit for a specific booking."""
    booking = booking_service.get_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("/{booking_id}/complete", response_model=Booking)
async def complete_booking(booking_id: str) -> Booking:
    """End a reservation and release the parking spot."""
    booking = booking_service.complete_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking
