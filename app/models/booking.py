from datetime import UTC, datetime
from enum import StrEnum

from pydantic import BaseModel, Field, field_validator

from app.services.plate import display_plate, normalize_plate


class BookingType(StrEnum):
    SECOND_CAR = "second_car"
    GUEST = "guest"


class BookingStatus(StrEnum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class BookingCreateRequest(BaseModel):
    spot_id: str = Field(..., min_length=1, description="Target parking spot ID")
    booking_type: BookingType = Field(default=BookingType.SECOND_CAR)
    vehicle_plate: str = Field(..., min_length=3, max_length=20, description="Vehicle license plate")
    driver_name: str = Field(..., min_length=2, description="Driver / Guest full name")
    driver_phone: str = Field(default="", description="Contact phone number")
    host_flat_number: int = Field(default=1, ge=1, description="Resident flat hosting the guest / 2nd car")
    duration_hours: int = Field(default=4, ge=1, le=72, description="Reservation duration in hours")
    notes: str | None = Field(default=None, description="Optional note for security gate or host")

    @field_validator("spot_id", "driver_name")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field must not be empty.")
        return cleaned

    @field_validator("vehicle_plate")
    @classmethod
    def validate_plate(cls, value: str) -> str:
        rendered = display_plate(value)
        if len(normalize_plate(value)) < 3:
            raise ValueError("Invalid license plate.")
        return rendered


class BookingSwapRequest(BaseModel):
    new_spot_id: str = Field(..., min_length=1, description="Destination parking spot ID")

    @field_validator("new_spot_id")
    @classmethod
    def strip_spot_id(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("new_spot_id must not be empty.")
        return cleaned


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
