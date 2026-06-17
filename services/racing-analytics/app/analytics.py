"""Derived racing analytics from normalized racecards.

Every metric here is computed from the FREE racecard data (ratings, draw, form,
trainers) - no prices involved. This is the honest analytical surface available
on the current Racing API plan, and the natural place to later attach
model-based ratings or an LLM narrative layer.
"""

from __future__ import annotations

from collections import Counter

from .models import DrawStats, Racecard, RaceAnalysis, RunnerRef


def _competitiveness(field_size: int, rating_spread: int | None) -> str:
    if rating_spread is None:
        return "unknown"
    if rating_spread <= 8 and field_size >= 8:
        return "wide-open"
    if rating_spread <= 15:
        return "competitive"
    return "top-heavy"


def analyze_racecard(card: Racecard) -> RaceAnalysis:
    runners = card.runners
    field_size = card.field_size or len(runners)

    rated = [r for r in runners if r.official_rating is not None]
    top_rated: RunnerRef | None = None
    rating_spread: int | None = None
    if rated:
        best = max(rated, key=lambda r: r.official_rating or 0)
        top_rated = RunnerRef(horse=best.horse, horse_id=best.horse_id, value=best.official_rating)
        ratings = [r.official_rating or 0 for r in rated]
        rating_spread = max(ratings) - min(ratings)

    draws = [r.draw for r in runners if r.draw is not None]
    draw = DrawStats()
    if draws:
        draw = DrawStats(
            low=min(draws),
            high=max(draws),
            average=round(sum(draws) / len(draws), 1),
        )

    recent = [r for r in runners if r.days_since_last_run is not None]
    most_experienced: RunnerRef | None = None
    if recent:
        freshest = min(recent, key=lambda r: r.days_since_last_run or 10**9)
        most_experienced = RunnerRef(
            horse=freshest.horse,
            horse_id=freshest.horse_id,
            value=freshest.days_since_last_run,
        )

    debutant_count = sum(1 for r in runners if r.is_debutant)

    busiest_trainer: RunnerRef | None = None
    trainers = Counter(r.trainer for r in runners if r.trainer)
    if trainers:
        name, count = trainers.most_common(1)[0]
        if count > 1:
            busiest_trainer = RunnerRef(horse=name, horse_id="", value=count)

    return RaceAnalysis(
        race_id=card.race_id,
        course=card.course,
        race_name=card.race_name,
        off_dt=card.off_dt,
        field_size=field_size,
        runners_with_rating=len(rated),
        top_rated=top_rated,
        rating_spread=rating_spread,
        draw=draw,
        most_experienced=most_experienced,
        debutant_count=debutant_count,
        busiest_trainer=busiest_trainer,
        competitiveness=_competitiveness(field_size, rating_spread),
    )
