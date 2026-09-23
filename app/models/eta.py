from datetime import UTC, datetime

from pydantic import BaseModel, Field, field_validator


class ETABroadcastRequest(BaseModel):
    spot_id: str = Field(..., min_length=1, description="ID of the spot owner is returning to")
    minutes_remaining: int = Field(
        default=20, ge=5, le=120, description="Estimated minutes to arrival"
    )
    host_name: str = Field(default="Ahmet Yılmaz", description="Owner name")
    note: str | None = Field(
        default=None, description="Optional message (e.g. Left office, traffic on highway)"
    )

    @field_validator("spot_id", "host_name")
    @classmethod
    def strip_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field must not be empty.")
        return cleaned


class AlternativeSpotSuggestion(BaseModel):
    spot_id: str
    spot_number: str
    block: str
    flat_number: int
    owner_name: str
    has_ev_charger: bool
    status: str


class ETABroadcastStatus(BaseModel):
    id: str
    spot_id: str
    spot_number: str
    block: str
    host_flat_number: int
    host_name: str
    minutes_remaining: int
    expected_arrival: datetime
    target_vehicle_plate: str | None = None
    target_driver_name: str | None = None
    is_active: bool = True
    alternative_suggestions: list[AlternativeSpotSuggestion] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
