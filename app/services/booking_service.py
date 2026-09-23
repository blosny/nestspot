import random
import uuid
from datetime import UTC, datetime, timedelta

from app.models.booking import (
    Booking,
    BookingCreateRequest,
    BookingStatus,
    BookingType,
    SecurityVerificationResult,
)
from app.models.spot import OccupantType, SpotStatus
from app.services.plate import display_plate, plates_match
from app.services.spot_service import spot_service
from app.services.time_window import intervals_overlap


class BookingService:
    def __init__(self) -> None:
        self._bookings: dict[str, Booking] = {}

    def reset(self) -> None:
        """Clear in-memory bookings (used by tests)."""
        self._bookings.clear()

    def _generate_permit_code(self) -> str:
        """Generate a unique human-readable alphanumeric permit code."""
        existing = {b.permit_code for b in self._bookings.values()}
        for _ in range(50):
            code = f"NST-{random.randint(1000, 9999)}"
            if code not in existing:
                return code
        return f"NST-{uuid.uuid4().hex[:4].upper()}"

    def _expire_stale_bookings(self, now: datetime | None = None) -> None:
        """Complete bookings whose end_time has passed so spots stay consistent."""
        moment = now or datetime.now(UTC)
        stale_ids = [
            booking_id
            for booking_id, booking in self._bookings.items()
            if booking.status == BookingStatus.ACTIVE and booking.end_time <= moment
        ]
        for booking_id in stale_ids:
            self.complete_booking(booking_id)

    def get_active_booking_for_spot(self, spot_id: str) -> Booking | None:
        self._expire_stale_bookings()
        for booking in self._bookings.values():
            if booking.spot_id == spot_id and booking.status == BookingStatus.ACTIVE:
                return booking
        return None

    def _assert_no_time_collision(self, spot_id: str, start: datetime, end: datetime) -> None:
        for booking in self._bookings.values():
            if booking.spot_id != spot_id or booking.status != BookingStatus.ACTIVE:
                continue
            if intervals_overlap(start, end, booking.start_time, booking.end_time):
                raise ValueError(
                    f"Spot already has an overlapping reservation "
                    f"({booking.start_time.isoformat()} – {booking.end_time.isoformat()})."
                )

    def create_booking(self, req: BookingCreateRequest) -> Booking:
        """Reserve a parking spot for a second car or visitor."""
        self._expire_stale_bookings()
        spot = spot_service.get_spot_by_id(req.spot_id)
        if not spot:
            raise ValueError(f"Spot '{req.spot_id}' does not exist.")

        if spot.status not in (SpotStatus.AVAILABLE, SpotStatus.AWAY_VACATION):
            raise ValueError(
                f"Spot {spot.spot_number} is currently {spot.status.value} and cannot be reserved."
            )

        if self.get_active_booking_for_spot(spot.id):
            raise ValueError(f"Spot {spot.spot_number} already has an active reservation.")

        now = datetime.now(UTC)
        end_time = now + timedelta(hours=req.duration_hours)
        self._assert_no_time_collision(spot.id, now, end_time)

        normalized_plate = display_plate(req.vehicle_plate)
        booking = Booking(
            id=str(uuid.uuid4()),
            permit_code=self._generate_permit_code(),
            spot_id=spot.id,
            spot_number=spot.spot_number,
            block=spot.block,
            host_flat_number=req.host_flat_number,
            booking_type=req.booking_type,
            status=BookingStatus.ACTIVE,
            vehicle_plate=normalized_plate,
            driver_name=req.driver_name.strip(),
            driver_phone=req.driver_phone.strip(),
            start_time=now,
            end_time=end_time,
            notes=req.notes,
            created_at=now,
        )

        self._bookings[booking.id] = booking

        if req.booking_type == BookingType.GUEST:
            spot_service.update_spot_status(
                spot_id=spot.id,
                status=SpotStatus.RESERVED_BY_GUEST,
                occupant_type=OccupantType.GUEST,
                vehicle_plate=normalized_plate,
            )
        else:
            spot_service.update_spot_status(
                spot_id=spot.id,
                status=SpotStatus.RESERVED_BY_NEIGHBOR,
                occupant_type=OccupantType.NEIGHBOR_SECOND_CAR,
                vehicle_plate=normalized_plate,
            )

        return booking

    def get_booking(self, booking_id: str) -> Booking | None:
        """Fetch a booking by ID."""
        self._expire_stale_bookings()
        return self._bookings.get(booking_id)

    def get_all_bookings(self, status: BookingStatus | None = None) -> list[Booking]:
        """Fetch all bookings optionally filtered by status."""
        self._expire_stale_bookings()
        bookings = list(self._bookings.values())
        if status:
            bookings = [b for b in bookings if b.status == status]
        return sorted(bookings, key=lambda x: x.created_at, reverse=True)

    def complete_booking(self, booking_id: str) -> Booking | None:
        """End parking session and free up the spot."""
        booking = self._bookings.get(booking_id)
        if not booking:
            return None

        if booking.status != BookingStatus.ACTIVE:
            raise ValueError("Only an active reservation can be released.")

        booking.status = BookingStatus.COMPLETED

        spot = spot_service.get_spot_by_id(booking.spot_id)
        if spot:
            new_status = SpotStatus.AWAY_VACATION if spot.is_vacation_mode else SpotStatus.AVAILABLE
            spot_service.update_spot_status(
                spot_id=spot.id,
                status=new_status,
                occupant_type=OccupantType.NONE,
                vehicle_plate=None,
            )

        return booking

    def swap_booking(self, booking_id: str, new_spot_id: str) -> Booking:
        """Move an active occupant to another free spot, then release the original."""
        self._expire_stale_bookings()
        booking = self._bookings.get(booking_id)
        if not booking:
            raise LookupError("Booking not found")
        if booking.status != BookingStatus.ACTIVE:
            raise ValueError("Only an active reservation can be swapped.")
        if booking.spot_id == new_spot_id:
            raise ValueError("Destination spot must be different from the current spot.")

        remaining = booking.end_time - datetime.now(UTC)
        remaining_hours = max(1, int((remaining.total_seconds() + 3599) // 3600))

        new_booking = self.create_booking(
            BookingCreateRequest(
                spot_id=new_spot_id,
                booking_type=booking.booking_type,
                vehicle_plate=booking.vehicle_plate,
                driver_name=booking.driver_name,
                driver_phone=booking.driver_phone,
                host_flat_number=booking.host_flat_number,
                duration_hours=min(72, remaining_hours),
                notes=booking.notes,
            )
        )
        self.complete_booking(booking.id)

        from app.services.eta_service import eta_service

        eta_service.resolve_alerts_for_spot(booking.spot_id)
        return new_booking

    def verify_license_plate(self, plate: str) -> SecurityVerificationResult:
        """Verification endpoint for apartment security gate guards."""
        self._expire_stale_bookings()
        rendered_query = display_plate(plate)

        for booking in self._bookings.values():
            if booking.status != BookingStatus.ACTIVE:
                continue
            if plates_match(booking.vehicle_plate, plate):
                return SecurityVerificationResult(
                    is_authorized=True,
                    permit_code=booking.permit_code,
                    spot_number=booking.spot_number,
                    block=booking.block,
                    host_flat=booking.host_flat_number,
                    driver_name=booking.driver_name,
                    vehicle_plate=booking.vehicle_plate,
                    booking_type=booking.booking_type,
                    expires_at=booking.end_time,
                    message=(
                        f"Access Granted. Park at Spot {booking.spot_number} "
                        f"(Hosted by Flat {booking.host_flat_number})."
                    ),
                )

        for spot in spot_service.get_all_spots():
            if plates_match(spot.current_vehicle_plate, plate):
                return SecurityVerificationResult(
                    is_authorized=True,
                    permit_code="RESIDENT",
                    spot_number=spot.spot_number,
                    block=spot.block,
                    host_flat=spot.flat_number,
                    driver_name=spot.owner_name,
                    vehicle_plate=spot.current_vehicle_plate or rendered_query,
                    booking_type=None,
                    expires_at=None,
                    message=(
                        f"Resident Owner Confirmed. Spot {spot.spot_number} (Flat {spot.flat_number})."
                    ),
                )

        return SecurityVerificationResult(
            is_authorized=False,
            vehicle_plate=rendered_query or plate.strip().upper(),
            message="No active permit found for this license plate. Contact resident.",
        )


booking_service = BookingService()
