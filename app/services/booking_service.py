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
from app.services.spot_service import spot_service


class BookingService:
    def __init__(self) -> None:
        self._bookings: dict[str, Booking] = {}

    def _generate_permit_code(self) -> str:
        """Generate a random human-readable alphanumeric permit code."""
        rand_num = random.randint(1000, 9999)
        return f"NST-{rand_num}"

    def create_booking(self, req: BookingCreateRequest) -> Booking:
        """Reserve a parking spot for a second car or visitor."""
        spot = spot_service.get_spot_by_id(req.spot_id)
        if not spot:
            raise ValueError(f"Spot '{req.spot_id}' does not exist.")

        if spot.status not in (SpotStatus.AVAILABLE, SpotStatus.AWAY_VACATION):
            raise ValueError(f"Spot {spot.spot_number} is currently {spot.status.value} and cannot be reserved.")

        booking_id = str(uuid.uuid4())
        permit_code = self._generate_permit_code()
        now = datetime.now(UTC)
        end_time = now + timedelta(hours=req.duration_hours)

        normalized_plate = req.vehicle_plate.upper().strip()

        booking = Booking(
            id=booking_id,
            permit_code=permit_code,
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

        self._bookings[booking_id] = booking

        # Update spot status in spot service
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
        return self._bookings.get(booking_id)

    def get_all_bookings(self, status: BookingStatus | None = None) -> list[Booking]:
        """Fetch all bookings optionally filtered by status."""
        bookings = list(self._bookings.values())
        if status:
            bookings = [b for b in bookings if b.status == status]
        return sorted(bookings, key=lambda x: x.created_at, reverse=True)

    def complete_booking(self, booking_id: str) -> Booking | None:
        """End parking session and free up the spot."""
        booking = self._bookings.get(booking_id)
        if not booking:
            return None

        booking.status = BookingStatus.COMPLETED

        # Restore spot to available
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

    def verify_license_plate(self, plate: str) -> SecurityVerificationResult:
        """Verification endpoint for apartment security gate guards."""
        normalized_query = plate.replace(" ", "").upper().strip()

        for b in self._bookings.values():
            if b.status == BookingStatus.ACTIVE:
                b_plate_clean = b.vehicle_plate.replace(" ", "").upper().strip()
                if b_plate_clean == normalized_query:
                    return SecurityVerificationResult(
                        is_authorized=True,
                        permit_code=b.permit_code,
                        spot_number=b.spot_number,
                        block=b.block,
                        host_flat=b.host_flat_number,
                        driver_name=b.driver_name,
                        vehicle_plate=b.vehicle_plate,
                        booking_type=b.booking_type,
                        expires_at=b.end_time,
                        message=f"Access Granted. Park at Spot {b.spot_number} (Hosted by Flat {b.host_flat_number}).",
                    )

        # Check if plate belongs to a permanent resident owner
        all_spots = spot_service.get_all_spots()
        for s in all_spots:
            if s.current_vehicle_plate:
                s_plate_clean = s.current_vehicle_plate.replace(" ", "").upper().strip()
                if s_plate_clean == normalized_query:
                    return SecurityVerificationResult(
                        is_authorized=True,
                        permit_code="RESIDENT",
                        spot_number=s.spot_number,
                        block=s.block,
                        host_flat=s.flat_number,
                        driver_name=s.owner_name,
                        vehicle_plate=s.current_vehicle_plate,
                        booking_type=None,
                        expires_at=None,
                        message=f"Resident Owner Confirmed. Spot {s.spot_number} (Flat {s.flat_number}).",
                    )

        return SecurityVerificationResult(
            is_authorized=False,
            vehicle_plate=plate.upper().strip(),
            message="No active permit found for this license plate. Contact resident.",
        )


booking_service = BookingService()
