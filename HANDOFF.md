# Bettin2Win — Handoff / Status

_Last updated: 2026-06-18. Living doc — update as the project moves._

## What this is
Real-time multi-sport odds dashboard. Polyglot monorepo (pnpm + Turborepo).
Runs with **zero API keys** on demo data; each sport flips live when its key is in `.env`.

## Architecture
- `apps/web` — React + Vite dashboard (sport tabs, odds board, movement feed, themed sport-field cards, glossary).
- `services/odds-engine` — TypeScript. Adapters → normalized `SportEvent`, poller, movement detection, WebSocket broadcast, REST enrichment endpoints.
- `services/ai-analyst` — TypeScript. Templated insight layer, 4 personas. Swappable for an LLM.
- `services/racing-analytics` — Python / FastAPI. Horse-racing domain modeling + analytics.
- `packages/types` — shared domain model.

## Provider status (verified live with Angela's keys)
| Sport | Provider | State |
|---|---|---|
| Baseball | The Odds API | ✅ live odds **with prices** + live scores/innings (Highlightly) |
| Football (NFL) | The Odds API | ✅ live odds (NFL offseason in June = few events) |
| Soccer | BetMiner (RapidAPI) | ✅ live **model picks** with logos, win %, form, predicted score, BTTS/total tags, odds + result |
| Horse racing | The Racing API | ✅ 35 real racecards; free tier = **no prices** |
| NASCAR | — | ❌ TheRundown has no motorsport; needs a different vendor |
| Greyhound | BetsAPI | ❌ no key obtained yet |
| Standings enrich | Highlightly (RapidAPI) | ✅ NFL/MLB/NBA/NHL real records at `/api/enrich/:sport/standings` |

### Keys (in `.env`, git-ignored)
ODDS_API_KEY, THERUNDOWN_API_KEY, RACING_API_USERNAME/PASSWORD, HIGHLIGHTLY_API_KEY,
RAPIDAPI_KEY (prediction APIs — **same value** as HIGHLIGHTLY_API_KEY; one RapidAPI account).
Highlightly is via **RapidAPI** (`x-rapidapi-key` + host `sport-highlights-api.p.rapidapi.com`),
Basic plan = **no odds**, enrichment only. RapidAPI key is subscribed ONLY to Highlightly
(sportsbook-api2 / betsapi2 return 403 — would need new subscriptions).
⚠️ The TheRundown + Highlightly keys were pasted in chat — should be rotated.

## Run it locally
```
corepack enable   # or use: npx -y pnpm@9.12.0 <cmd>   (corepack can't write to Program Files here)
npx -y pnpm@9.12.0 install
node services/odds-engine/dist/index.js     # engine on :4000 (loads repo-root .env)
npx -y pnpm@9.12.0 --filter @bettin2win/web dev   # web on :5173
```
Open http://localhost:5173. (Both were running in the background during the build session.)

**One-click launcher:** `powershell -ExecutionPolicy Bypass -File scripts\install-desktop-icon.ps1`
creates a **Bettin2Win** desktop icon (B2W badge). Double-click it to build (first run),
start engine + web, and open the dashboard. See `scripts/start.ps1`.

**🚀 DEPLOYED & LIVE (2026-06-18):**
- **Website:** https://dacameragirl.github.io/Bettin2Win/ (GitHub Pages, HTTPS, auto-rebuilds on push to `main`).
- **Engine:** https://bettin2win.onrender.com (Render **free** plan; `/health` + `wss://…/ws`).
  Free instance **sleeps after ~15 min idle** → first visit after a quiet spell takes ~30–50s to wake.
  Hitting the engine root (`/`) shows "Cannot GET /" — that's expected; it only serves `/health`,
  `/api/*`, and `/ws`.

How it's wired: the engine was created on Render as a **Web Service** (NOT via the Blueprint UI —
that path was hard to find; built manually with `render.yaml`'s build/start commands). Build cmd:
`npm install -g pnpm@9.12.0 && pnpm install --frozen-lockfile && pnpm --filter @bettin2win/types build && pnpm --filter @bettin2win/odds-engine build`;
start: `node services/odds-engine/dist/index.js`; health path `/health`; the 6 API keys live in
Render's Environment (BETSAPI_KEY intentionally absent). The web app reads three **repo Variables**
(set via `gh variable set` — use `MSYS_NO_PATHCONV=1` on Git-Bash for `VITE_BASE` or the leading
slash gets path-mangled): `VITE_WS_URL=wss://bettin2win.onrender.com/ws`,
`VITE_API_URL=https://bettin2win.onrender.com`, `VITE_BASE=/Bettin2Win/`. The Pages workflow
(`.github/workflows/pages.yml`) builds + publishes automatically once those exist.

Render verified live: real **MLB** (tank01 backup) + **basketball** (sportsbook-api backup) + **horse**
racecards. ⚠️ The Odds API key returns **401** on Render (baseball/basketball still live via backups) —
re-paste/verify `ODDS_API_KEY` in Render env. Soccer/football/hockey hit RapidAPI **429** on the
fresh-deploy burst (self-heals; football/hockey are offseason). NASCAR key OK, normalize still TODO.
Original local DEPLOY.md (Render Blueprint + Pages) is still valid as background.

## Workflow rules (Angela's preference — IMPORTANT)
Never commit straight to `main`. Always: issue → feature branch → PR (real description) →
CI green → squash-merge → delete branch → sync local. Claude does ALL git mechanics; Angela
approves direction only. End commits with the Co-Authored-By line; end PR bodies with the
Claude Code line.

## Done so far (all merged)
PRs #2 (scaffold), #4 (racing normalizer), #6 (Python tier), #8 (standings NFL/MLB/NBA),
#10 (NHL), #12 (movement feed filtered by sport), #16 (CORS), #18 (themed sport-field cards),
#21 (Soccer tab + model picks), #22 (desktop launcher), #23 (Render + Pages deploy config),
#27 (Soccer upgraded to BetMiner logos/win %/form/predicted score + Railway Railpack fix),
+ live baseball scores & glossary.

## Angela's requested enhancements
- ✅ **Richer event boxes** (PR #18): each card now has a themed **field**. Baseball/football =
  two-sided scoreboard-on-a-field (AWAY left, HOME "hosting" right, big live score in the middle,
  inning/kickoff + start time below; CSS diamond / yard-lined gridiron). NASCAR/horse/greyhound =
  shared track strip (venue, runner count, start time, status) since a race has no home/away.
  Component: `apps/web/src/SportField.tsx`. Possible follow-ups: pull team **records** from the
  standings endpoint into the field; hits/errors if a provider exposes them.
- **Odds still read as gibberish to a beginner** — PARTLY handled: the D/A/F toggle already
  **defaults to Decimal** (`App.tsx` `useState<OddsFormat>("decimal")`), and Soccer now shows
  BetMiner's plain-English win probability (`NN% likely`) beside the model pick. Still TODO:
  an inline "what does -150 mean?" helper/tooltip right next to generic prices, so she doesn't
  have to scroll to the glossary.
- Note: baseball shows only 2 prices/game because it's a 2-way market (the two teams) — that's
  correct, not a bug. Horse racing shows many runners.

## Prediction APIs (Angela's RapidAPI subscriptions — for "all sports predictions")
Same RapidAPI key (`RAPIDAPI_KEY`) covers all subscribed APIs. Each RapidAPI listing
needs its own Subscribe click. The Soccer tab now uses **BetMiner**; `football-prediction-api`
stays in the repo as an alternate/fallback soccer source. Adding a prediction sport =
one new adapter + a `SportKey` + a tab + a field theme.
- ⚠️ **Betigolo** (`betigolo-predictions`) — subscribed but the **free/BASIC plan DISABLES every
  sport endpoint** ("disabled for your subscription") + tight rate limit. Multi-sport (tennis/
  hockey/basketball/baseball) is the goal but **needs a PAID Betigolo plan** before it's buildable.
- ✅ **BetMiner** (`betminer.p.rapidapi.com`) — free tier works and is **rich**: `GET
  /bm/v3/edge-analysis/{date}` returns ~82 soccer matches/day in one call, with **team logos, win
  probabilities (%), predicted correct score, BTTS/over-under, and form (WDWLL)**. Soccer only.
- **Today Football Prediction** — ✅ subscribed; more soccer data (overlap).
- **basketball-predictions1** — ⚠️ NOT subscribed.
- **All free subscriptions are soccer-only.** football-prediction-api free plan: ~12h ahead,
  sweeps UEFA/CONMEBOL/CONCACAF/AFC; result home-away upstream → flipped to away-home.

### ✅ Latest completed task: DEPLOYED LIVE (engine on Render + web on GitHub Pages)
Issue #30. The app is now public — site https://dacameragirl.github.io/Bettin2Win/ streaming from
engine https://bettin2win.onrender.com (Render free). Railway was tried first (project
`spectacular-charisma`) but abandoned — its trial credit was nearly exhausted and it doesn't sleep
on idle, so the 24/7 poller would bill monthly. Render free sleeps when idle = $0 and conserves the
free-tier API quotas. See the "DEPLOYED & LIVE" block above for full wiring. Delete the leftover
Railway service to stop any charge.

### Previous: Soccer upgraded to BetMiner
PR #27 closed issue #25. Soccer now fetches `GET /bm/v3/edge-analysis/{date}` via
`betminer.adapter.ts`, normalizes logos/probability/correctScore/form/clock/tags, and renders
logos, form, `NN% likely`, predicted score, BTTS/over-under tags, highlighted pick, and live
score/minute in the card UI. Local live check returned 61 BetMiner matches on 2026-06-18.
`railway.json` was also trimmed so Railpack does not reinstall pnpm after its own install step.

## Good next steps
1. **Verify `ODDS_API_KEY` on Render** — it returns 401 there (baseball/basketball stay live via
   backups, but The Odds API itself is down). Re-paste the key in Render → Environment.
2. **Surface standings in the UI** — `/api/enrich/:sport/standings` exists but no UI panel yet.
3. **Custom domain** (optional) — DEPLOY.md Part C; set `VITE_BASE=/` and re-run Pages.
4. **Bump GitHub Actions** off Node 20 (deprecation warnings on checkout/setup-node/pnpm-action/deploy-pages).
5. **Multi-sport predictions** (tennis/hockey/basketball) — blocked on a PAID Betigolo plan.
6. Greyhound (needs BetsAPI key); NASCAR (needs a motorsport vendor).

## Gotchas
- Windows: editing `.env` with `echo >>` broke encoding once (UTF-16) and once mashed a key
  onto another line. Edit `.env` carefully (Notepad or a precise script), keep it ASCII/CRLF.
- pnpm not installed globally → use `npx -y pnpm@9.12.0`.
- Highlightly returns 3+ different JSON shapes for standings (NFL/MLB/NBA-NHL); the normalizer is tolerant.
