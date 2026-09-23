from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.models.booking import Booking, BookingCreateRequest, BookingStatus, BookingSwapRequest
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
    booking_status: Annotated[
        BookingStatus | None,
        Query(alias="status", description="Filter by status"),
    ] = None,
) -> list[Booking]:
    """Retrieve all reservations, optionally filtered by status."""
    return booking_service.get_all_bookings(status=booking_status)


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
    try:
        booking = booking_service.complete_booking(booking_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e)) from e
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("/{booking_id}/swap", response_model=Booking, status_code=status.HTTP_201_CREATED)
async def swap_booking(booking_id: str, req: BookingSwapRequest) -> Booking:
    """Move an active occupant to an alternative free spot and release the original."""
    try:
        return booking_service.swap_booking(booking_id, req.new_spot_id)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
