from enum import StrEnum

from pydantic import BaseModel, Field


class SpotStatus(StrEnum):
    AVAILABLE = "available"  # Owner is away, spot is free to use
    OCCUPIED_BY_OWNER = "occupied_by_owner"  # Owner's car is parked
    RESERVED_BY_NEIGHBOR = "reserved_by_neighbor"  # Neighbor (2nd car) is parked
    RESERVED_BY_GUEST = "reserved_by_guest"  # Guest vehicle has an active permit
    AWAY_VACATION = "away_vacation"  # Owner is on vacation / away for multiple days


class OccupantType(StrEnum):
    OWNER = "owner"
    NEIGHBOR_SECOND_CAR = "neighbor_second_car"
    GUEST = "guest"
    NONE = "none"


class TimeWindow(BaseModel):
    """Represents a scheduled time window when the spot owner is away."""
    start_time: str = Field(..., description="Start time in HH:MM format, e.g. 08:30")
    end_time: str = Field(..., description="End time in HH:MM format, e.g. 18:30")
    days: list[str] = Field(
        default=["Mon", "Tue", "Wed", "Thu", "Fri"],
        description="Active days of the week"
    )
    title: str = Field(default="Work Hours", description="Label for availability")


class ParkingSpot(BaseModel):
    """Represents an allocated residential parking spot."""
    id: str
    spot_number: str  # e.g. "A-01", "B-08"
    block: str  # e.g. "A", "B"
    flat_number: int  # Assigned apartment number
    owner_name: str
    owner_phone: str
    has_ev_charger: bool = False
    ev_charger_power: str | None = None  # e.g. "22kW Wallbox"
    status: SpotStatus = SpotStatus.AVAILABLE
    current_occupant_type: OccupantType = OccupantType.NONE
    current_vehicle_plate: str | None = None
    available_windows: list[TimeWindow] = []
    hourly_rate: float = 0.0  # 0.0 means free neighborhood sharing
    is_vacation_mode: bool = False
    vacation_end_date: str | None = None
    location_x: int = 0  # 2D Grid positioning
    location_y: int = 0


class SpotSummary(BaseModel):
    total_spots: int
    available_now: int
    occupied_now: int
    ev_spots_count: int
    vacation_spots_count: int


class UpdateAvailabilityRequest(BaseModel):
    is_vacation_mode: bool = False
    vacation_end_date: str | None = None
    windows: list[TimeWindow] = []
