from app.services.plate import display_plate, normalize_plate, plates_match


def test_normalize_strips_spaces_and_hyphens():
    assert normalize_plate("34 ABC 123") == "34ABC123"
    assert normalize_plate("  34-abc-123  ") == "34ABC123"


def test_turkish_letters_fold_to_ascii():
    assert normalize_plate("34 ŞAH 11") == "34SAH11"
    assert normalize_plate("34 sah 11") == "34SAH11"
    assert plates_match("34 İST 01", "34 IST 01")
    assert plates_match("34 ÇLK 09", "34 CLK 09")


def test_dotted_and_dotless_i():
    assert plates_match("34 IL 20", "34 ıl 20")
    assert plates_match("34 IL 20", "34 İl 20")


def test_empty_and_none_plates():
    assert normalize_plate("") == ""
    assert normalize_plate(None) == ""
    assert display_plate(None) == ""
    assert plates_match("", "34 ABC") is False


def test_display_plate_collapses_whitespace():
    assert display_plate("  34   abc  123 ") == "34 ABC 123"
