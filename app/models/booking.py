from datetime import UTC, datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class BookingType(StrEnum):
    SECOND_CAR = "second_car"
    GUEST = "guest"


class BookingStatus(StrEnum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class BookingCreateRequest(BaseModel):
    spot_id: str = Field(..., description="Target parking spot ID")
    booking_type: BookingType = Field(default=BookingType.SECOND_CAR)
    vehicle_plate: str = Field(..., min_length=3, max_length=15, description="Vehicle license plate")
    driver_name: str = Field(..., min_length=2, description="Driver / Guest full name")
    driver_phone: str = Field(default="", description="Contact phone number")
    host_flat_number: int = Field(default=1, description="Resident flat hosting the guest / 2nd car")
    duration_hours: int = Field(default=4, ge=1, le=72, description="Reservation duration in hours")
    notes: str | None = Field(default=None, description="Optional note for security gate or host")


class Booking(BaseModel):
    id: str
    permit_code: str  # e.g. "NST-7492"
    spot_id: str
    spot_number: str
    block: str
    host_flat_number: int
    booking_type: BookingType
    status: BookingStatus = BookingStatus.ACTIVE
    vehicle_plate: str
    driver_name: str
    driver_phone: str
    start_time: datetime = Field(default_factory=lambda: datetime.now(UTC))
    end_time: datetime
    notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class SecurityVerificationResult(BaseModel):
    is_authorized: bool
    permit_code: str | None = None
    spot_number: str | None = None
    block: str | None = None
    host_flat: int | None = None
    driver_name: str | None = None
    vehicle_plate: str
    booking_type: BookingType | None = None
    expires_at: datetime | None = None
    message: str
