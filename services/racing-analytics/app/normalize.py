"""Map The Racing API's raw racecard JSON into our domain models.

The vendor payload is messy: numbers arrive as strings, several fields are
optional or empty-string, and `last_run` is a string count of days. This module
is the single place that knows about those quirks.
"""

from __future__ import annotations

from typing import Any

from .models import Racecard, Runner


def _to_int(value: Any) -> int | None:
    """Vendor sends ints as strings ('1') or empty strings; be forgiving."""
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        return int(text)
    except ValueError:
        return None


def _clean_str(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def normalize_runner(raw: dict[str, Any]) -> Runner:
    return Runner(
        horse=str(raw.get("horse", "")).strip() or "Unknown",
        horse_id=str(raw.get("horse_id", "")),
        number=_to_int(raw.get("number")),
        draw=_to_int(raw.get("draw")),
        jockey=_clean_str(raw.get("jockey")),
        trainer=_clean_str(raw.get("trainer")),
        age=_to_int(raw.get("age")),
        official_rating=_to_int(raw.get("ofr")),
        days_since_last_run=_to_int(raw.get("last_run")),
        form=_clean_str(raw.get("form")),
    )


def normalize_racecard(raw: dict[str, Any]) -> Racecard:
    runners = [normalize_runner(r) for r in raw.get("runners", [])]
    return Racecard(
        race_id=str(raw.get("race_id", "")),
        course=str(raw.get("course", "")).strip(),
        off_time=str(raw.get("off_time", "")).strip(),
        off_dt=raw["off_dt"],
        race_name=str(raw.get("race_name", "")).strip(),
        region=_clean_str(raw.get("region")),
        field_size=_to_int(raw.get("field_size")) or len(runners),
        going=_clean_str(raw.get("going")),
        surface=_clean_str(raw.get("surface")),
        runners=runners,
    )


def normalize_racecards(payload: dict[str, Any]) -> list[Racecard]:
    return [normalize_racecard(c) for c in payload.get("racecards", [])]
