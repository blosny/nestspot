"""License plate normalization for TR/EN plates (spaces, case, Turkish letters)."""

from __future__ import annotations

import re

_TURKISH_FOLD = str.maketrans(
    {
        "İ": "I",
        "I": "I",
        "ı": "I",
        "i": "I",
        "Ğ": "G",
        "ğ": "G",
        "Ü": "U",
        "ü": "U",
        "Ş": "S",
        "ş": "S",
        "Ö": "O",
        "ö": "O",
        "Ç": "C",
        "ç": "C",
    }
)

_NON_ALNUM = re.compile(r"[^A-Z0-9]")


def normalize_plate(plate: str | None) -> str:
    """Canonical comparison form: ASCII alphanumerics, Turkish letters folded."""
    if not plate:
        return ""
    folded = plate.translate(_TURKISH_FOLD).upper()
    return _NON_ALNUM.sub("", folded)


def display_plate(plate: str | None) -> str:
    """Human-readable plate: folded Turkish letters, collapsed whitespace, uppercased."""
    if not plate:
        return ""
    folded = plate.translate(_TURKISH_FOLD)
    return " ".join(folded.upper().split())


def plates_match(left: str | None, right: str | None) -> bool:
    """True when two plates refer to the same vehicle after normalization."""
    a, b = normalize_plate(left), normalize_plate(right)
    return bool(a) and a == b
