import uuid
from datetime import UTC, datetime, timedelta

from app.models.eta import (
    AlternativeSpotSuggestion,
    ETABroadcastRequest,
    ETABroadcastStatus,
)
from app.models.spot import SpotStatus
from app.services.booking_service import booking_service
from app.services.spot_service import spot_service


class ETAService:
    def __init__(self) -> None:
        self._active_alerts: dict[str, ETABroadcastStatus] = {}

    def broadcast_departure(self, req: ETABroadcastRequest) -> ETABroadcastStatus:
        """Create an active arrival ETA alert when the resident leaves work."""
        spot = spot_service.get_spot_by_id(req.spot_id)
        if not spot:
            raise ValueError(f"Spot '{req.spot_id}' not found.")

        now = datetime.now(UTC)
        expected_arrival = now + timedelta(minutes=req.minutes_remaining)
        broadcast_id = str(uuid.uuid4())

        # Find target vehicle and driver occupying the spot
        target_plate = spot.current_vehicle_plate
        target_driver = None

        # Check in active bookings
        for b in booking_service.get_all_bookings():
            if b.spot_id == spot.id and b.status.value == "active":
                target_plate = b.vehicle_plate
                target_driver = b.driver_name
                break

        # Suggest other available spots in the complex
        all_spots = spot_service.get_all_spots()
        alternatives = [
            AlternativeSpotSuggestion(
                spot_id=s.id,
                spot_number=s.spot_number,
                block=s.block,
                flat_number=s.flat_number,
                owner_name=s.owner_name,
                has_ev_charger=s.has_ev_charger,
                status=s.status.value,
            )
            for s in all_spots
            if s.id != spot.id and s.status in (SpotStatus.AVAILABLE, SpotStatus.AWAY_VACATION)
        ]

        alert = ETABroadcastStatus(
            id=broadcast_id,
            spot_id=spot.id,
            spot_number=spot.spot_number,
            block=spot.block,
            host_flat_number=spot.flat_number,
            host_name=req.host_name or spot.owner_name,
            minutes_remaining=req.minutes_remaining,
            expected_arrival=expected_arrival,
            target_vehicle_plate=target_plate,
            target_driver_name=target_driver,
            is_active=True,
            alternative_suggestions=alternatives[:3],  # Top 3 nearby suggestions
            created_at=now,
        )

        self._active_alerts[broadcast_id] = alert
        return alert

    def get_active_alerts(self) -> list[ETABroadcastStatus]:
        """Fetch all currently active ETA arrival alerts."""
        return [alert for alert in self._active_alerts.values() if alert.is_active]

    def resolve_alert(self, broadcast_id: str) -> ETABroadcastStatus | None:
        """Mark an alert as resolved / acknowledged."""
        alert = self._active_alerts.get(broadcast_id)
        if not alert:
            return None
        alert.is_active = False
        return alert


eta_service = ETAService()
