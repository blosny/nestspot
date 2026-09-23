import pytest

from app.models.spot import TimeWindow
from app.services.time_window import (
    any_schedule_conflict,
    intervals_overlap,
    parse_hhmm,
    schedule_windows_overlap,
)


def test_half_open_intervals_touching_do_not_overlap():
    from datetime import UTC, datetime

    a0 = datetime(2026, 1, 1, 8, 0, tzinfo=UTC)
    a1 = datetime(2026, 1, 1, 12, 0, tzinfo=UTC)
    b0 = datetime(2026, 1, 1, 12, 0, tzinfo=UTC)
    b1 = datetime(2026, 1, 1, 16, 0, tzinfo=UTC)
    assert intervals_overlap(a0, a1, b0, b1) is False
    assert intervals_overlap(a0, a1, datetime(2026, 1, 1, 11, 0, tzinfo=UTC), b1) is True


def test_weekday_windows_overlap_same_day():
    left = TimeWindow(start_time="08:00", end_time="12:00", days=["Mon", "Tue"], title="Morning")
    right = TimeWindow(start_time="11:00", end_time="15:00", days=["Tue", "Wed"], title="Mid")
    assert schedule_windows_overlap(left, right) is True


def test_windows_on_different_days_do_not_overlap():
    left = TimeWindow(start_time="08:00", end_time="18:00", days=["Mon"], title="Mon")
    right = TimeWindow(start_time="08:00", end_time="18:00", days=["Tue"], title="Tue")
    assert schedule_windows_overlap(left, right) is False


def test_overnight_window_wraps_midnight():
    night = TimeWindow(start_time="22:00", end_time="06:00", days=["Fri"], title="Night")
    morning = TimeWindow(start_time="05:00", end_time="09:00", days=["Fri"], title="Dawn")
    assert schedule_windows_overlap(night, morning) is True


def test_full_day_equal_start_end():
    full = TimeWindow(start_time="00:00", end_time="00:00", days=["Sat"], title="All day")
    other = TimeWindow(start_time="12:00", end_time="13:00", days=["Sat"], title="Noon")
    assert schedule_windows_overlap(full, other) is True


def test_any_schedule_conflict():
    windows = [
        TimeWindow(start_time="08:00", end_time="12:00", days=["Mon"], title="A"),
        TimeWindow(start_time="12:00", end_time="18:00", days=["Mon"], title="B"),
    ]
    assert any_schedule_conflict(windows) is False
    windows.append(TimeWindow(start_time="11:30", end_time="12:30", days=["Mon"], title="C"))
    assert any_schedule_conflict(windows) is True


def test_parse_hhmm_rejects_invalid():
    with pytest.raises(ValueError):
        parse_hhmm("25:00")
    with pytest.raises(ValueError):
        parse_hhmm("8")
    with pytest.raises(ValueError):
        parse_hhmm("12:99")
