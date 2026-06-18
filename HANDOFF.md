# Bettin2Win — Handoff / Status

_Last updated: 2026-06-18 (end of a big session). Living doc — READ THIS FIRST in a new session._

## What this is
Real-time multi-sport odds **dashboard** (NOT a sportsbook — it shows odds & finds the best
price; you place bets at the real book). Polyglot monorepo (pnpm + Turborepo). Runs with **zero
API keys** on demo data; each sport flips live when its key/feed is present. Deliberately
**beginner-friendly** — that's the whole point of the product (see "Audience" below).

## 🚀 LIVE RIGHT NOW
- **Website (what users open):** https://dacameragirl.github.io/Bettin2Win/ — GitHub Pages, HTTPS,
  auto-rebuilds on every push to `main`.
- **Engine (data server):** https://bettin2win.onrender.com — Render **free** plan. Sleeps after
  ~15 min idle → first visit takes ~30–50s to wake. Engine root shows "Cannot GET /" **by design**
  (it only serves `/health`, `/api/*`, `/ws`).
- **Desktop icon:** `C:\Users\enter\OneDrive\Desktop\Bettin2Win.url` opens the live site in the
  browser (one click). The old local-launcher `.lnk` was removed. (`scripts/start.ps1` still exists
  for running locally if ever needed.)

## Audience / product direction (important for tone & priorities)
Angela is **not a sports person** ("I hate sports lol") and is building this for the **men in her
life — her 5 sons, 2 exes, an old roommate who loves hockey**. So the audience is **beginners**.
Keep everything plain-English and friendly. We've leaned hard into this: in-app beginner guide,
plain-English odds, visible "visiting/hosting", explained drifting/shortening, animated tracks.
**Hockey matters a lot** (her friend watches daily) — see priority #1.

## Architecture
- `apps/web` — React + Vite dashboard. Sport tabs, odds board, market-movement feed, themed
  **SportField** cards (animated, numbered race lanes + moving balls/pucks), beginner guide, glossary.
- `services/odds-engine` — TypeScript. Adapters → normalized `SportEvent`, poller, movement
  detection, WebSocket broadcast, REST enrichment endpoints. Binds Render's `PORT`.
- `services/ai-analyst` — TypeScript. Templated insight layer, 4 personas. Swappable for an LLM.
- `services/racing-analytics` — Python / FastAPI. Horse-racing analytics tier.
- `packages/types` — shared domain model (`SportEvent`, `Runner` (now incl. `position?`), etc.).

## Provider status (current reality — 2026-06-18)
| Sport | State | Notes |
|---|---|---|
| ⚾ Baseball | ✅ LIVE | real MLB odds via **tank01-mlb** backup (The Odds API 401 on Render) + live scores/innings |
| 🏀 Basketball | ✅ LIVE | real lines via **sportsbook-api** backup |
| 🐎 Horse racing | ✅ LIVE | **real finishing positions + real SP odds** via new RapidAPI adapter (see below); The Racing API free racecards = fallback |
| ⚽ Soccer | ✅ LIVE (when not 429) | **BetMiner** model picks (logos, win %, form, predicted score); rate-limited sometimes |
| 🏒 Hockey | ❌ DEMO **(should be LIVE — PRIORITY #1)** | The Odds API **covers NHL**; demo only because `ODDS_API_KEY` 401s on Render + RapidAPI backups 429. **Fix the Render key.** |
| 🏈 Football | ❌ DEMO | NFL offseason in June (few/no real events) + same 401/429; verify in season |
| 🏁 NASCAR | ❌ DEMO | needs a **motorsport** odds source — The Odds API catalog has none, TheRundown has none |
| 🐕 Greyhound | ❌ DEMO | needs a source — BetsAPI (paid) or a RapidAPI greyhound API |

Demo data uses real-ish names (e.g. "Rangers @ Bruins", "Lakers FC @ Celtics SC", drivers
"A. Rivera") so it LOOKS real — the **"DEMO DATA" vs "LIVE FEED" badge** on each sport is the
honest indicator.

## Keys & secrets
In repo-root `.env` (git-ignored): `ODDS_API_KEY`, `THERUNDOWN_API_KEY`,
`RACING_API_USERNAME`/`RACING_API_PASSWORD`, `HIGHLIGHTLY_API_KEY`, `RAPIDAPI_KEY`.
Same 6 set in **Render → Environment** (no `BETSAPI_KEY`).
- ⚠️ **`ODDS_API_KEY` is VALID locally** (tested → HTTP 200) but **401 on Render** → the value
  pasted into Render is wrong/truncated. **Re-paste it in Render → Environment.** This likely
  brings **hockey** (and in-season football) LIVE and strengthens baseball.
- ⚠️ **`RAPIDAPI_KEY` was pasted in chat** (twice) — **rotate it** on RapidAPI (Apps → app →
  Security → regenerate), then update `.env` + Render. One RapidAPI account; key is shared by
  Highlightly, BetMiner, tank01, sportsbook-api, football-prediction, and the new Horse Racing API.
- The Odds API catalog for her key has **no NASCAR / motorsport / greyhound / horse** sports.

## NEW: Horse Racing real results (the win of this session)
RapidAPI **"Horse Racing"** (`horse-racing.p.rapidapi.com`, UK & Ireland), subscribed on her
existing `RAPIDAPI_KEY`. Endpoints: `GET /racecards` (list), `GET /results` (list), `GET
/race/{id_race}` (detail with `horses[]` carrying `number`, `position` = real finishing place,
`sp` = real decimal odds, jockey/trainer/form). **Free tier = only ~50 requests/day** (per
`X-RateLimit-Requests-Limit: 50`). Adapter: `services/odds-engine/src/adapters/horse-racing-rapidapi.adapter.ts`
— frugal by design: 30-min list TTL, ≤4 detail calls/cycle (finished races first), finished/
cancelled races cached **forever**, hard **40/day budget governor**, falls back to The Racing API
when out of budget. Wired as primary for horse-racing; poll interval relaxed to 120s. Front-end
`Runner.position` drives the race lanes to order by **real finishing order** when a race is decided.
**To add NASCAR/greyhound, copy this pattern: find a RapidAPI source, Subscribe, probe with the
key, write an adapter, mind the rate limit.**

## Run it locally
```
npx -y pnpm@9.12.0 install            # pnpm not global; corepack can't write to Program Files
node services/odds-engine/dist/index.js               # engine :4000 (loads repo .env)
npx -y pnpm@9.12.0 --filter @bettin2win/web dev       # web :5173
```
Build all: `npx -y pnpm@9.12.0 --filter @bettin2win/types build && ... --filter @bettin2win/odds-engine build && ... --filter @bettin2win/web build`.

## Deploy / CI
- Web → GitHub Pages via `.github/workflows/pages.yml` (auto on push to `main` touching apps/web).
  Pages already configured: Source = GitHub Actions, HTTPS enforced.
- Engine → Render, **auto-deploys on push to `main`**. Built manually as a Web Service from
  `render.yaml`'s build/start commands (Blueprint UI was hard to find). Health path `/health`.
- 3 repo Variables drive the web build (set via `gh variable set`; use `MSYS_NO_PATHCONV=1` for
  `VITE_BASE` on Git-Bash or the leading slash gets mangled):
  `VITE_WS_URL=wss://bettin2win.onrender.com/ws`, `VITE_API_URL=https://bettin2win.onrender.com`,
  `VITE_BASE=/Bettin2Win/`.

## Workflow rules (Angela's preference — IMPORTANT)
Never commit to `main`. Always: issue → feature branch → PR (real description) → CI green →
squash-merge → delete branch → sync local. **Claude does ALL git mechanics; Angela approves
direction only.** End commits with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`;
end PR bodies with the Claude Code line.

## Shipped this session (2026-06-18)
- Deployed live end-to-end (Render engine + Pages web). Issues #30.
- **PR #31** fix stale deploy docs. **PR #34** beginner readability (visible hosting/visiting,
  plain-English drifting/shortening, #33). **PR #36** animated numbered race lanes + moving
  balls/pucks (full-motion; `prefers-reduced-motion` disables it; #35). **PR #38** horse racing
  real positions + odds (#37). **PR #40** in-app beginner guide (#39).
- Desktop icon swapped to open the live site.

## NEXT STEPS (priority order)
1. **Make hockey LIVE** — re-paste `ODDS_API_KEY` in Render → Environment (key is valid; The Odds
   API covers NHL). Angela's #1 motivation. Verify hockey + football flip to LIVE.
2. **Add NASCAR + greyhound real data** — find RapidAPI sources, Subscribe, probe with the key,
   write adapters following the horse-racing pattern. (Greyhound is genuinely scarce — may need paid.)
3. **"Where + when" on every card (task "B")** — venue/city + date/time; kill the vague basketball
   market label ("WNBA - Middle 2.5 - Point Spread").
4. **Rotate `RAPIDAPI_KEY`** (pasted in chat) + update `.env` and Render.
5. Surface standings in the UI (`/api/enrich/:sport/standings` exists). Bump GitHub Actions off
   deprecated Node 20. One prediction source into ai-analyst.

## Gotchas
- Windows `.env`: edit carefully (ASCII/CRLF); `echo >>` has corrupted encoding before.
- pnpm via `npx -y pnpm@9.12.0` (not global).
- Git-Bash: `gh variable set VITE_BASE` needs `MSYS_NO_PATHCONV=1`; Node reads `/tmp` as `C:\tmp`
  (MSYS curl writes elsewhere) — write temp files in the repo dir when piping curl→node.
- Render free instance sleeps; first request after idle is slow.
- Highlightly/BetMiner/sportsbook-api are RapidAPI free tiers → frequent `429`; the new Horse
  Racing API is only 50 req/day (budget-governed).
- History: the Perplexity "scaffold .tar.gz" never existed; repo was an empty shell until built.
