"""Configuration + credential loading.

Loads the repo-root .env so this service shares the same RACING_API_* secrets
as the TypeScript odds-engine. Never commit .env.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# services/racing-analytics/app/config.py -> repo root is three parents up.
_REPO_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(_REPO_ROOT / ".env")


class Settings:
    racing_api_username: str = os.getenv("RACING_API_USERNAME", "")
    racing_api_password: str = os.getenv("RACING_API_PASSWORD", "")
    racing_api_base: str = os.getenv(
        "RACING_API_BASE", "https://api.theracingapi.com/v1"
    )
    port: int = int(os.getenv("RACING_ANALYTICS_PORT", "4100"))

    @property
    def has_racing_credentials(self) -> bool:
        return bool(self.racing_api_username and self.racing_api_password)


settings = Settings()
