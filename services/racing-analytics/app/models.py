"""Pydantic domain models for horse racing.

These are the normalized shapes the rest of the service speaks. They are
deliberately decoupled from The Racing API's raw payload - see `normalize.py`
for the mapping. Fields that the free racecards endpoint does not provide
(notably live prices) are simply absent here rather than faked.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class Runner(BaseModel):
    horse: str
    horse_id: str
    number: int | None = None
    draw: int | None = None
    jockey: str | None = None
    trainer: str | None = None
    age: int | None = None
    official_rating: int | None = Field(default=None, description="OFR")
    days_since_last_run: int | None = Field(
        default=None, description="last_run, in days; None == no recorded prior run"
    )
    form: str | None = None

    @property
    def is_debutant(self) -> bool:
        """No recorded form and no prior run -> first-time runner."""
        return not self.form and self.days_since_last_run is None


class Racecard(BaseModel):
    race_id: str
    course: str
    off_time: str
    off_dt: datetime
    race_name: str
    region: str | None = None
    field_size: int | None = None
    going: str | None = None
    surface: str | None = None
    runners: list[Runner] = Field(default_factory=list)


class DrawStats(BaseModel):
    low: int | None = None
    high: int | None = None
    average: float | None = None


class RunnerRef(BaseModel):
    horse: str
    horse_id: str
    value: float | int | None = None


class RaceAnalysis(BaseModel):
    """Derived features computed from a normalized racecard.

    All of these come from the FREE racecard data (no prices required), which is
    the honest extent of what we can analyze on the current plan.
    """

    race_id: str
    course: str
    race_name: str
    off_dt: datetime
    field_size: int
    runners_with_rating: int
    top_rated: RunnerRef | None = None
    rating_spread: int | None = Field(
        default=None, description="OFR max - min; a proxy for how open the race is"
    )
    draw: DrawStats = Field(default_factory=DrawStats)
    most_experienced: RunnerRef | None = Field(
        default=None, description="most recent prior run (smallest days_since_last_run)"
    )
    debutant_count: int = 0
    busiest_trainer: RunnerRef | None = Field(
        default=None, description="trainer with the most runners in this race"
    )
    competitiveness: str = Field(
        default="unknown", description="qualitative read from rating spread + field size"
    )
