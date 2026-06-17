"""FastAPI app exposing normalized racecards and derived analytics.

Endpoints
  GET /health                          liveness + whether creds are present
  GET /racecards                       normalized racecards (today, GB)
  GET /racecards/{race_id}             one normalized racecard
  GET /racecards/{race_id}/analysis    derived analysis for one race
  GET /analysis                        derived analysis for every race today
"""

from __future__ import annotations

import time
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .analytics import analyze_racecard
from .config import settings
from .ingest import RacingApiError, client
from .models import Racecard
from .normalize import normalize_racecards

app = FastAPI(title="Bettin2Win Racing Analytics", version=__version__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Tiny TTL cache so repeated requests don't hammer the rate-limited vendor.
_CACHE: dict[str, Any] = {"at": 0.0, "cards": []}
_TTL_SECONDS = 120


async def _get_cards() -> list[Racecard]:
    now = time.time()
    if now - _CACHE["at"] < _TTL_SECONDS and _CACHE["cards"]:
        return _CACHE["cards"]
    payload = await client.fetch_racecards()
    cards = normalize_racecards(payload)
    _CACHE.update(at=now, cards=cards)
    return cards


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "version": __version__,
        "has_credentials": settings.has_racing_credentials,
    }


@app.get("/racecards")
async def list_racecards() -> list[Racecard]:
    try:
        return await _get_cards()
    except RacingApiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get("/racecards/{race_id}")
async def get_racecard(race_id: str) -> Racecard:
    cards = await _safe_cards()
    for card in cards:
        if card.race_id == race_id:
            return card
    raise HTTPException(status_code=404, detail="race_id not found")


@app.get("/racecards/{race_id}/analysis")
async def get_analysis(race_id: str) -> Any:
    cards = await _safe_cards()
    for card in cards:
        if card.race_id == race_id:
            return analyze_racecard(card)
    raise HTTPException(status_code=404, detail="race_id not found")


@app.get("/analysis")
async def all_analysis() -> list[Any]:
    cards = await _safe_cards()
    return [analyze_racecard(c) for c in cards]


async def _safe_cards() -> list[Racecard]:
    try:
        return await _get_cards()
    except RacingApiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
