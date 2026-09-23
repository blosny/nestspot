"""Time-window overlap helpers for reservations and owner away schedules."""

from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime, time

from app.models.spot import TimeWindow

_DAY_ALIASES = {
    "mon": "Mon",
    "tue": "Tue",
    "wed": "Wed",
    "thu": "Thu",
    "fri": "Fri",
    "sat": "Sat",
    "sun": "Sun",
}


def intervals_overlap(start_a: datetime, end_a: datetime, start_b: datetime, end_b: datetime) -> bool:
    """Half-open interval overlap: [start, end). Touching endpoints do not collide."""
    return start_a < end_b and start_b < end_a


def parse_hhmm(value: str) -> time:
    """Parse HH:MM (24h). Raises ValueError on malformed input."""
    parts = value.strip().split(":")
    if len(parts) != 2:
        raise ValueError(f"Invalid time '{value}'; expected HH:MM.")
    hour, minute = int(parts[0]), int(parts[1])
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        raise ValueError(f"Invalid time '{value}'.")
    return time(hour=hour, minute=minute)


def schedule_windows_overlap(left: TimeWindow, right: TimeWindow) -> bool:
    """True when two weekly windows share a day and overlapping clock times."""
    left_days = {_DAY_ALIASES.get(d.lower(), d) for d in left.days}
    right_days = {_DAY_ALIASES.get(d.lower(), d) for d in right.days}
    if not left_days.intersection(right_days):
        return False

    a_start, a_end = parse_hhmm(left.start_time), parse_hhmm(left.end_time)
    b_start, b_end = parse_hhmm(right.start_time), parse_hhmm(right.end_time)

    # Overnight windows (e.g. 22:00–06:00) wrap past midnight.
    def _to_minutes(t: time) -> int:
        return t.hour * 60 + t.minute

    def _ranges(start: time, end: time) -> list[tuple[int, int]]:
        s, e = _to_minutes(start), _to_minutes(end)
        if s == e:
            return [(0, 24 * 60)]
        if s < e:
            return [(s, e)]
        return [(s, 24 * 60), (0, e)]

    for as_, ae in _ranges(a_start, a_end):
        for bs, be in _ranges(b_start, b_end):
            if as_ < be and bs < ae:
                return True
    return False


def any_schedule_conflict(windows: Iterable[TimeWindow]) -> bool:
    """Detect pairwise overlap inside a list of weekly windows."""
    items = list(windows)
    for i, left in enumerate(items):
        for right in items[i + 1 :]:
            if schedule_windows_overlap(left, right):
                return True
    return False
