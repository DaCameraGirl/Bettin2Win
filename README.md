# Bettin2Win

Real-time, multi-sport odds dashboard with AI-style explanations — football,
baseball, NASCAR, horse racing, and greyhounds in one app.

> **Status:** working scaffold. The app boots and renders with **zero API keys**
> using built-in demo data. Each sport flips to a real feed the moment its
> credentials are present. See [Provider status](#provider-status).

## What's here

A pnpm + Turborepo monorepo:

```
apps/
  web/                React + Vite dashboard (sport tabs, live board, movement feed)
services/
  odds-engine/        Polls providers, normalizes odds, detects movement, WebSocket broadcast
  ai-analyst/         Turns price movements into plain-language insights (4 fan personas)
packages/
  types/              Shared domain types every layer speaks (SportEvent, OddsLine, ...)
.github/workflows/    ci.yml, release.yml, odds-health.yml
```

The key design rule: every provider is hidden behind an **adapter** that returns
the same normalized `SportEvent` shape. The frontend never sees a raw provider
payload, so adding or swapping a feed never touches the UI.

## Quick start

```bash
# 1. Enable pnpm (ships with Node 20+)
corepack enable

# 2. Install
pnpm install

# 3. (optional) add real keys — the app runs without this step
cp .env.example .env   # then fill in whatever keys you have

# 4. Run the odds engine and the web app
pnpm dev
```

- Web app: http://localhost:5173
- Odds engine: http://localhost:4000 (health at `/health`, WebSocket at `/ws`)

With no `.env`, every sport shows **DEMO DATA** with prices that drift each poll,
so you can see the full UI working immediately.

## Provider status

| Sport         | Provider       | Auth                              | Status |
|---------------|----------------|-----------------------------------|--------|
| Football      | The Odds API   | `ODDS_API_KEY` (query param)      | Live data normalized |
| Baseball      | The Odds API   | `ODDS_API_KEY` (query param)      | Live data normalized |
| NASCAR        | TheRundown     | `THERUNDOWN_API_KEY` (header)     | Auth wired, normalization TODO |
| Horse racing  | The Racing API | `RACING_API_USERNAME` + `_PASSWORD` (Basic Auth) | Auth wired, normalization TODO |
| Greyhound     | BetsAPI        | `BETSAPI_KEY` (query param)       | Auth wired, normalization TODO |

**"Auth wired, normalization TODO"** means: the adapter authenticates and
verifies connectivity to the real provider on every poll, but the raw payload
isn't mapped to `SportEvent` yet, so it serves demo data tagged with the live
connection status. Finishing each one = implementing the `normalize()` step in
that adapter. The Odds API adapter is the worked example to copy.

> **Note on The Racing API:** auth is HTTP **Basic** (username + password), not a
> single bearer key. This corrected the original scaffold assumption of a single
> `RACING_API_KEY`.

## Where to get keys

- The Odds API — https://dash.the-odds-api.com
- TheRundown — https://therundown.io/pricing/api
- The Racing API — https://theracingapi.com (Basic Auth credentials in your dashboard)
- BetsAPI — https://betsapi.com/docs

Put them in `.env` (git-ignored). For CI/deploy, add them as GitHub Actions
secrets — never commit them.

## AI insight layer

`services/ai-analyst` converts an `OddsMovement` into a short explanation in one
of four fan voices: `casual`, `bettor`, `fantasy`, `analyst`. The default
provider is template-based (free, no external calls). Swap in an LLM by
implementing the `InsightProvider` interface. Try it:

```bash
pnpm --filter @bettin2win/ai-analyst dev
```

## Scripts

| Command           | What it does                          |
|-------------------|---------------------------------------|
| `pnpm dev`        | Run all apps/services in watch mode   |
| `pnpm build`      | Build every package                   |
| `pnpm typecheck`  | Type-check the whole monorepo         |
| `pnpm test`       | Run unit tests                        |

## Roadmap

1. Finish `normalize()` for TheRundown, The Racing API, and BetsAPI.
2. Persist recent odds history for trend mini-charts.
3. Wire the AI insight layer into the live movement stream.
4. Deploy the odds-engine and set `ODDS_ENGINE_HEALTH_URL` so `odds-health.yml` runs.

## Legal

This is an analytics/media app, not a bookmaker. Several providers restrict
sportsbook/operator use and data redistribution — check each provider's terms
before going beyond personal/analytics use.
