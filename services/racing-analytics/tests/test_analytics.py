"""Unit tests for normalization + analytics. No network: fixtures mirror the
real Racing API /racecards/free shape captured from a live response.
"""

from __future__ import annotations

from app.analytics import analyze_racecard
from app.normalize import normalize_racecard

SAMPLE = {
    "race_id": "rac_123",
    "course": "Ascot",
    "off_time": "2:30",
    "off_dt": "2026-06-17T14:30:00+01:00",
    "race_name": "Queen Mary Stakes (Group 2)",
    "region": "GB",
    "field_size": "3",
    "going": "Good",
    "surface": "Turf",
    "runners": [
        {"horse": "Alta Regina", "horse_id": "h1", "number": "1", "draw": "24",
         "jockey": "James McDonald", "trainer": "Hamad Al Jehani", "ofr": "108",
         "last_run": "18", "form": "1121", "age": "3"},
        {"horse": "Armor Supreme", "horse_id": "h2", "number": "2", "draw": "5",
         "jockey": "Rossa Ryan", "trainer": "Diego Dias", "ofr": "95",
         "last_run": "9", "form": "32", "age": "3"},
        {"horse": "New Debut", "horse_id": "h3", "number": "3", "draw": "11",
         "jockey": "A Rider", "trainer": "Hamad Al Jehani", "ofr": "",
         "last_run": "", "form": "", "age": "3"},
    ],
}


def test_normalize_coerces_strings_to_ints():
    card = normalize_racecard(SAMPLE)
    assert card.course == "Ascot"
    assert card.runners[0].number == 1
    assert card.runners[0].draw == 24
    assert card.runners[0].official_rating == 108
    # empty-string vendor fields become None, not 0 or ""
    assert card.runners[2].official_rating is None
    assert card.runners[2].days_since_last_run is None


def test_debutant_detection():
    card = normalize_racecard(SAMPLE)
    assert card.runners[2].is_debutant is True
    assert card.runners[0].is_debutant is False


def test_analysis_features():
    card = normalize_racecard(SAMPLE)
    analysis = analyze_racecard(card)

    assert analysis.field_size == 3
    assert analysis.runners_with_rating == 2
    assert analysis.top_rated is not None
    assert analysis.top_rated.horse == "Alta Regina"
    assert analysis.rating_spread == 13  # 108 - 95
    assert analysis.draw.low == 5 and analysis.draw.high == 24
    assert analysis.most_experienced is not None
    assert analysis.most_experienced.horse == "Armor Supreme"  # 9 days, the freshest
    assert analysis.debutant_count == 1
    # two runners share trainer "Hamad Al Jehani"
    assert analysis.busiest_trainer is not None
    assert analysis.busiest_trainer.value == 2
