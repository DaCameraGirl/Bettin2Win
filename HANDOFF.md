# Bettin2Win — Handoff / Status

_Last updated: 2026-06-17. Living doc — update as the project moves._

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
| Soccer | football-prediction-api (RapidAPI) | ✅ live **model picks** (1X2 + double-chance) + odds + result |
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

**Deploy for real:** see `DEPLOY.md` — engine on Render (`render.yaml`), web on GitHub
Pages (`.github/workflows/pages.yml`, dormant until the `VITE_WS_URL` repo Variable is set).
Note: GitHub Pages is still on the legacy "deploy from branch" source (renders the README) —
switch Source to **GitHub Actions** to publish the real app.

## Workflow rules (Angela's preference — IMPORTANT)
Never commit straight to `main`. Always: issue → feature branch → PR (real description) →
CI green → squash-merge → delete branch → sync local. Claude does ALL git mechanics; Angela
approves direction only. End commits with the Co-Authored-By line; end PR bodies with the
Claude Code line.

## Done so far (all merged)
PRs #2 (scaffold), #4 (racing normalizer), #6 (Python tier), #8 (standings NFL/MLB/NBA),
#10 (NHL), #12 (movement feed filtered by sport), #16 (CORS), #18 (themed sport-field cards),
#21 (Soccer tab + model picks), #22 (desktop launcher), #23 (Render + Pages deploy config),
+ live baseball scores & glossary.

## Angela's requested enhancements
- ✅ **Richer event boxes** (PR #18): each card now has a themed **field**. Baseball/football =
  two-sided scoreboard-on-a-field (AWAY left, HOME "hosting" right, big live score in the middle,
  inning/kickoff + start time below; CSS diamond / yard-lined gridiron). NASCAR/horse/greyhound =
  shared track strip (venue, runner count, start time, status) since a race has no home/away.
  Component: `apps/web/src/SportField.tsx`. Possible follow-ups: pull team **records** from the
  standings endpoint into the field; hits/errors if a provider exposes them.
- **Odds still read as gibberish to a beginner** — PARTLY handled: the D/A/F toggle already
  **defaults to Decimal** (`App.tsx` `useState<OddsFormat>("decimal")`). Still TODO: an inline
  "what does -150 mean?" helper/tooltip right next to the prices, so she doesn't have to scroll to
  the glossary. (This is the obvious next task.)
- Note: baseball shows only 2 prices/game because it's a 2-way market (the two teams) — that's
  correct, not a bug. Horse racing shows many runners.

## Prediction APIs (Angela's RapidAPI subscriptions — for "all sports predictions")
Same RapidAPI key (`RAPIDAPI_KEY`) covers all subscribed APIs. Each RapidAPI listing
needs its own Subscribe click. The Soccer tab uses **football-prediction-api** as the
template; adding a prediction sport = one new adapter (copy `football-prediction.adapter.ts`)
+ a `SportKey` + a tab + a field theme.
- **Betigolo** (`betigolo-predictions`) — ✅ subscribed; **multi-sport** from one
  `/{sport}/{date}` endpoint (football, tennis, icehockey, basketball, baseball). **Best path
  to "predictions for every sport"** — one adapter shape covers many tabs.
- **BetMiner**, **Today Football Prediction** — ✅ subscribed; more soccer/edge data (overlap).
- **basketball-predictions1** — ⚠️ pasted but **NOT subscribed** (returns "not subscribed").
  Subscribe first, then add a 🏀 tab.
- football-prediction-api free plan: predictions only ~12h ahead; adapter sweeps
  UEFA/CONMEBOL/CONCACAF/AFC for the day. Result is home-away upstream → flipped to away-home.

## Good next steps
1. **Surface standings in the UI** — `/api/enrich/:sport/standings` exists but no UI panel yet.
2. **Deploy** — web on Vercel/Netlify; engine is a stateful WS server → Render/Railway/Fly + secrets.
3. **One prediction source** into `ai-analyst` (e.g. Betigolo) — needs a RapidAPI subscription.
4. Greyhound (needs BetsAPI key); NASCAR (needs a motorsport vendor).

## Gotchas
- Windows: editing `.env` with `echo >>` broke encoding once (UTF-16) and once mashed a key
  onto another line. Edit `.env` carefully (Notepad or a precise script), keep it ASCII/CRLF.
- pnpm not installed globally → use `npx -y pnpm@9.12.0`.
- Highlightly returns 3+ different JSON shapes for standings (NFL/MLB/NBA-NHL); the normalizer is tolerant.
