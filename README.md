# Bettin2Win

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-149ECA?style=for-the-badge&logo=react&logoColor=white)
![PowerShell](https://img.shields.io/badge/PowerShell-39FF14?style=for-the-badge&logo=powershell&logoColor=111111)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)

Real-time, multi-sport odds dashboard with plain-English betting context for
football, baseball, basketball, hockey, soccer, NASCAR, horse racing, and
greyhounds.

> **Status:** live provider wiring is active. The app tries real feeds first and
> only falls back when every configured provider for that sport is unavailable,
> out of quota, or missing credentials. See [Provider status](#provider-status).

## What's here

A pnpm + Turborepo monorepo:

```text
apps/
  web/                React + Vite dashboard
services/
  odds-engine/        Polls providers, normalizes odds, detects movement, broadcasts snapshots
  ai-analyst/         Turns price movements into plain-language insights
packages/
  types/              Shared domain types every layer speaks
.github/workflows/    CI, release, Pages, and health checks
```

Every provider is hidden behind an adapter that returns the same normalized
`SportEvent` shape. The frontend never sees raw provider payloads, so adding or
swapping a feed stays inside the engine.

## Quick start

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

- Web app: http://localhost:5173
- Odds engine: http://localhost:4000
- Health check: http://localhost:4000/health

The desktop launcher created by `scripts/install-desktop-icon.ps1` starts the
engine, starts the web app, and opens the dashboard.

## Provider status

| Sport | Provider chain | Auth | Current behavior |
|---|---|---|---|
| Football | The Odds API -> Sportsbook API -> Highlightly matches | `ODDS_API_KEY`, `RAPIDAPI_KEY`, `HIGHLIGHTLY_API_KEY` | Real odds when available; real opportunities or match cards as backups |
| Baseball | The Odds API -> Tank01 MLB -> Highlightly matches | `ODDS_API_KEY`, `RAPIDAPI_KEY`, `HIGHLIGHTLY_API_KEY` | Tank01 supplies real MLB moneyline odds, books, and game times when The Odds API fails |
| Basketball | The Odds API -> Sportsbook API -> Highlightly matches | `ODDS_API_KEY`, `RAPIDAPI_KEY`, `HIGHLIGHTLY_API_KEY` | Real odds when available; Sportsbook API opportunities as backup |
| Hockey | The Odds API -> Sportsbook API -> Highlightly matches | `ODDS_API_KEY`, `RAPIDAPI_KEY`, `HIGHLIGHTLY_API_KEY` | Real odds/opportunities when providers have active hockey data |
| Soccer | BetMiner -> football-prediction-api | `RAPIDAPI_KEY` / `HIGHLIGHTLY_API_KEY` | Predictions, probability, correct score, form, and logos when quota allows |
| NASCAR | TheRundown | `THERUNDOWN_API_KEY` | Auth wired; race normalization still needs finishing |
| Horse racing | The Racing API | `RACING_API_USERNAME` + `RACING_API_PASSWORD` | Racecards live; prices depend on plan/feed availability |
| Greyhound | BetsAPI | `BETSAPI_KEY` | Auth wired when key is present |

## Keys

Put keys in `.env` only. The file is git-ignored and should not be committed.

- The Odds API: `ODDS_API_KEY`
- RapidAPI providers: `RAPIDAPI_KEY` and/or `HIGHLIGHTLY_API_KEY`
- TheRundown: `THERUNDOWN_API_KEY`
- The Racing API: `RACING_API_USERNAME`, `RACING_API_PASSWORD`
- BetsAPI: `BETSAPI_KEY`

If a key has ever been pasted into chat or screenshots, rotate it.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run all apps/services in watch mode |
| `pnpm build` | Build every package |
| `pnpm typecheck` | Type-check the monorepo |
| `pnpm test` | Run unit tests |

## Contributors

- Angela - product direction, provider setup, testing
- Claude - prior implementation work and GitHub workflow
- Codex - provider fallback fixes, dashboard UI, and repo maintenance

## Legal

This is an analytics/media app, not a bookmaker. Provider terms vary by plan and
use case; check each provider's rules before redistributing data or using it in
a commercial betting workflow.
