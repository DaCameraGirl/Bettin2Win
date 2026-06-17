# racing-analytics (Python / FastAPI)

The domain + analytics tier for horse racing. Ingests The Racing API, normalizes
the messy vendor payload into Pydantic models, and computes derived race
features. This is the Python half of Bettin2Win's polyglot architecture; the
TypeScript `odds-engine` handles real-time streaming.

## Why Python here

Horse racing is a modeling-heavy domain (ratings, draw bias, form, pace). Python
is the right home for that analysis and for the AI/model layer that builds on it.

## Run

```bash
cd services/racing-analytics
python -m venv .venv
. .venv/Scripts/activate     # Windows;  use .venv/bin/activate on macOS/Linux
pip install -r requirements-dev.txt

# reads RACING_API_USERNAME / RACING_API_PASSWORD from the repo-root .env
uvicorn app.main:app --reload --port 4100
```

- http://localhost:4100/health
- http://localhost:4100/racecards
- http://localhost:4100/analysis
- http://localhost:4100/docs (auto Swagger UI)

## Endpoints

| Method | Path                              | Returns                          |
|--------|-----------------------------------|----------------------------------|
| GET    | `/health`                         | liveness + creds present         |
| GET    | `/racecards`                      | normalized racecards (today, GB) |
| GET    | `/racecards/{race_id}`            | one normalized racecard          |
| GET    | `/racecards/{race_id}/analysis`   | derived analysis for one race    |
| GET    | `/analysis`                       | analysis for every race today    |

## What the analysis computes

All from the **free** racecard data (no prices required):

- `top_rated` + `rating_spread` — best OFR and how open the race looks
- `draw` — low/high/average stall numbers
- `most_experienced` — freshest runner (smallest days since last run)
- `debutant_count` — first-time runners
- `busiest_trainer` — trainer with multiple entries
- `competitiveness` — qualitative read (wide-open / competitive / top-heavy)

## Tests

```bash
pip install -r requirements-dev.txt
pytest
```

Tests run offline against fixtures mirroring a real `/racecards/free` response.

## Note on prices

The free Racing API plan returns no odds, so this service intentionally analyzes
form/ratings/draw rather than price. A paid odds plan would add price-based
features (market favorite, value vs rating) on top of the same models.
