"""Ingestion client for The Racing API (horse racing).

Auth is HTTP Basic (username + password). The free racecards endpoint returns
today's GB cards with full field detail but no prices.
"""

from __future__ import annotations

from typing import Any

import httpx

from .config import settings


class RacingApiError(RuntimeError):
    pass


class RacingApiClient:
    def __init__(self, timeout: float = 15.0) -> None:
        self._timeout = timeout

    def _auth(self) -> tuple[str, str]:
        if not settings.has_racing_credentials:
            raise RacingApiError("missing RACING_API_USERNAME / RACING_API_PASSWORD")
        return (settings.racing_api_username, settings.racing_api_password)

    async def fetch_racecards(self) -> dict[str, Any]:
        url = f"{settings.racing_api_base}/racecards/free"
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.get(url, auth=self._auth())
        if resp.status_code != 200:
            raise RacingApiError(f"provider returned {resp.status_code}")
        return resp.json()


client = RacingApiClient()
