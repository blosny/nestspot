from app.models.spot import (
    OccupantType,
    ParkingSpot,
    SpotStatus,
    SpotSummary,
    TimeWindow,
)


class SpotService:
    def __init__(self) -> None:
        self._spots: dict[str, ParkingSpot] = {}
        self._initialize_seed_data()

    def _initialize_seed_data(self) -> None:
        """Seed initial realistic 24 parking spots for Block A and Block B."""
        sample_residents_a = [
            ("A-01", 1, "Ahmet Yılmaz", "+90 532 101 2001", True, "22kW AC Wallbox", SpotStatus.AVAILABLE, OccupantType.NONE, None, [TimeWindow(start_time="08:30", end_time="18:30", days=["Mon", "Tue", "Wed", "Thu", "Fri"], title="Weekday Work Hours")]),
            ("A-02", 2, "Elif Demir", "+90 533 202 3002", False, None, SpotStatus.OCCUPIED_BY_OWNER, OccupantType.OWNER, "34 EL 2020", []),
            ("A-03", 3, "Mehmet Kaya", "+90 535 303 4003", True, "11kW AC Wallbox", SpotStatus.AWAY_VACATION, OccupantType.NONE, None, [TimeWindow(start_time="00:00", end_time="23:59", days=["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], title="Summer Holiday (Away for 5 days)")]),
            ("A-04", 4, "Zeynep Çelik", "+90 542 404 5004", False, None, SpotStatus.AVAILABLE, OccupantType.NONE, None, [TimeWindow(start_time="09:00", end_time="17:30", days=["Mon", "Tue", "Wed", "Thu", "Fri"], title="Office Hours")]),
            ("A-05", 5, "Burak Şahin", "+90 536 505 6005", False, None, SpotStatus.RESERVED_BY_GUEST, OccupantType.GUEST, "34 GST 789", []),
            ("A-06", 6, "Ayşe Arslan", "+90 537 606 7006", True, "22kW AC Wallbox", SpotStatus.AVAILABLE, OccupantType.NONE, None, [TimeWindow(start_time="08:00", end_time="19:00", days=["Mon", "Tue", "Wed", "Thu", "Fri"], title="Work Hours")]),
            ("A-07", 7, "Caner Öztürk", "+90 538 707 8007", False, None, SpotStatus.OCCUPIED_BY_OWNER, OccupantType.OWNER, "34 CNR 707", []),
            ("A-08", 8, "Selin Aydın", "+90 539 808 9008", False, None, SpotStatus.AVAILABLE, OccupantType.NONE, None, [TimeWindow(start_time="09:30", end_time="18:00", days=["Mon", "Tue", "Wed", "Thu", "Fri"], title="Campus Hours")]),
            ("A-09", 9, "Emre Koç", "+90 541 909 0109", True, "7.4kW AC", SpotStatus.AVAILABLE, OccupantType.NONE, None, [TimeWindow(start_time="08:30", end_time="18:30", days=["Mon", "Tue", "Wed", "Thu", "Fri"], title="Office Hours")]),
            ("A-10", 10, "Deniz Polat", "+90 543 010 1210", False, None, SpotStatus.RESERVED_BY_NEIGHBOR, OccupantType.NEIGHBOR_SECOND_CAR, "34 DNZ 102", []),
            ("A-11", 11, "Murat Erdoğan", "+90 544 121 2311", False, None, SpotStatus.OCCUPIED_BY_OWNER, OccupantType.OWNER, "34 MRT 99", []),
            ("A-12", 12, "Gamze Yavuz", "+90 545 232 3412", True, "22kW AC Wallbox", SpotStatus.AVAILABLE, OccupantType.NONE, None, [TimeWindow(start_time="08:00", end_time="18:00", days=["Mon", "Tue", "Wed", "Thu", "Fri"], title="Work Hours")]),
        ]

        sample_residents_b = [
            ("B-01", 1, "Oğuz Karaca", "+90 551 111 2233", False, None, SpotStatus.AVAILABLE, OccupantType.NONE, None, [TimeWindow(start_time="09:00", end_time="19:00", days=["Mon", "Tue", "Wed", "Thu", "Fri"], title="Work Hours")]),
            ("B-02", 2, "Buse Aksoy", "+90 552 222 3344", True, "22kW AC Wallbox", SpotStatus.AVAILABLE, OccupantType.NONE, None, [TimeWindow(start_time="08:30", end_time="18:30", days=["Mon", "Tue", "Wed", "Thu", "Fri"], title="Office Hours")]),
            ("B-03", 3, "Hakan Yıldız", "+90 553 333 4455", False, None, SpotStatus.OCCUPIED_BY_OWNER, OccupantType.OWNER, "34 HKN 33", []),
            ("B-04", 4, "Merve Kurt", "+90 554 444 5566", False, None, SpotStatus.AVAILABLE, OccupantType.NONE, None, [TimeWindow(start_time="08:00", end_time="17:00", days=["Mon", "Tue", "Wed", "Thu", "Fri"], title="Work Hours")]),
            ("B-05", 5, "Tolga Gül", "+90 555 555 6677", True, "11kW AC Wallbox", SpotStatus.AWAY_VACATION, OccupantType.NONE, None, [TimeWindow(start_time="00:00", end_time="23:59", days=["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], title="Abroad Trip (Away for 7 days)")]),
            ("B-06", 6, "Esra Tekin", "+90 556 666 7788", False, None, SpotStatus.AVAILABLE, OccupantType.NONE, None, [TimeWindow(start_time="09:00", end_time="18:00", days=["Mon", "Tue", "Wed", "Thu", "Fri"], title="Clinic Hours")]),
            ("B-07", 7, "Cem Avcı", "+90 557 777 8899", False, None, SpotStatus.OCCUPIED_BY_OWNER, OccupantType.OWNER, "34 CEM 07", []),
            ("B-08", 8, "Derya Doğan", "+90 558 888 9900", True, "22kW AC Wallbox", SpotStatus.AVAILABLE, OccupantType.NONE, None, [TimeWindow(start_time="08:30", end_time="18:30", days=["Mon", "Tue", "Wed", "Thu", "Fri"], title="Work Hours")]),
            ("B-09", 9, "Serkan Güler", "+90 559 999 0011", False, None, SpotStatus.RESERVED_BY_NEIGHBOR, OccupantType.NEIGHBOR_SECOND_CAR, "34 SRK 09", []),
            ("B-10", 10, "Gizem Bulut", "+90 530 000 1122", False, None, SpotStatus.AVAILABLE, OccupantType.NONE, None, [TimeWindow(start_time="09:00", end_time="18:00", days=["Mon", "Tue", "Wed", "Thu", "Fri"], title="Office Hours")]),
            ("B-11", 11, "Kaan Aslan", "+90 531 111 2233", True, "11kW AC", SpotStatus.OCCUPIED_BY_OWNER, OccupantType.OWNER, "34 KAN 11", []),
            ("B-12", 12, "Ece Yalçın", "+90 532 222 3344", False, None, SpotStatus.AVAILABLE, OccupantType.NONE, None, [TimeWindow(start_time="08:30", end_time="18:00", days=["Mon", "Tue", "Wed", "Thu", "Fri"], title="Work Hours")]),
        ]

        # Populate Block A
        for idx, item in enumerate(sample_residents_a):
            spot_id = f"spot-a-{idx+1:02d}"
            self._spots[spot_id] = ParkingSpot(
                id=spot_id,
                spot_number=item[0],
                block="A",
                flat_number=item[1],
                owner_name=item[2],
                owner_phone=item[3],
                has_ev_charger=item[4],
                ev_charger_power=item[5],
                status=item[6],
                current_occupant_type=item[7],
                current_vehicle_plate=item[8],
                available_windows=item[9],
                is_vacation_mode=(item[6] == SpotStatus.AWAY_VACATION),
                location_x=idx % 6,
                location_y=idx // 6,
            )

        # Populate Block B
        for idx, item in enumerate(sample_residents_b):
            spot_id = f"spot-b-{idx+1:02d}"
            self._spots[spot_id] = ParkingSpot(
                id=spot_id,
                spot_number=item[0],
                block="B",
                flat_number=item[1],
                owner_name=item[2],
                owner_phone=item[3],
                has_ev_charger=item[4],
                ev_charger_power=item[5],
                status=item[6],
                current_occupant_type=item[7],
                current_vehicle_plate=item[8],
                available_windows=item[9],
                is_vacation_mode=(item[6] == SpotStatus.AWAY_VACATION),
                location_x=idx % 6,
                location_y=idx // 6,
            )

    def get_all_spots(
        self,
        block: str | None = None,
        status: SpotStatus | None = None,
        has_ev: bool | None = None,
        is_vacation: bool | None = None,
    ) -> list[ParkingSpot]:
        """Return spots filtered by criteria."""
        results = list(self._spots.values())
        if block:
            results = [s for s in results if s.block.upper() == block.upper()]
        if status:
            results = [s for s in results if s.status == status]
        if has_ev is not None:
            results = [s for s in results if s.has_ev_charger == has_ev]
        if is_vacation is not None:
            results = [s for s in results if s.is_vacation_mode == is_vacation]
        return results

    def get_spot_by_id(self, spot_id: str) -> ParkingSpot | None:
        """Fetch spot details by spot ID."""
        return self._spots.get(spot_id)

    def get_summary(self) -> SpotSummary:
        """Compute summary statistics across all parking spots."""
        spots = list(self._spots.values())
        total = len(spots)
        available = sum(1 for s in spots if s.status in (SpotStatus.AVAILABLE, SpotStatus.AWAY_VACATION))
        occupied = total - available
        ev_count = sum(1 for s in spots if s.has_ev_charger)
        vacation_count = sum(1 for s in spots if s.is_vacation_mode)
        return SpotSummary(
            total_spots=total,
            available_now=available,
            occupied_now=occupied,
            ev_spots_count=ev_count,
            vacation_spots_count=vacation_count,
        )

    def update_spot_status(
        self,
        spot_id: str,
        status: SpotStatus,
        occupant_type: OccupantType = OccupantType.NONE,
        vehicle_plate: str | None = None,
    ) -> ParkingSpot | None:
        """Update spot current status and occupant info."""
        spot = self._spots.get(spot_id)
        if not spot:
            return None
        spot.status = status
        spot.current_occupant_type = occupant_type
        spot.current_vehicle_plate = vehicle_plate
        return spot


# Singleton instance
spot_service = SpotService()
