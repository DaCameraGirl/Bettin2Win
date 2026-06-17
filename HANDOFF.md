# Bettin2Win — Handoff / Status

_Last updated: 2026-06-17. Living doc — update as the project moves._

## What this is
Real-time multi-sport odds dashboard. Polyglot monorepo (pnpm + Turborepo).
Runs with **zero API keys** on demo data; each sport flips live when its key is in `.env`.

## Architecture
- `apps/web` — React + Vite dashboard (sport tabs, odds board, movement feed, live-score badges, glossary).
- `services/odds-engine` — TypeScript. Adapters → normalized `SportEvent`, poller, movement detection, WebSocket broadcast, REST enrichment endpoints.
- `services/ai-analyst` — TypeScript. Templated insight layer, 4 personas. Swappable for an LLM.
- `services/racing-analytics` — Python / FastAPI. Horse-racing domain modeling + analytics.
- `packages/types` — shared domain model.

## Provider status (verified live with Angela's keys)
| Sport | Provider | State |
|---|---|---|
| Baseball | The Odds API | ✅ live odds **with prices** + live scores/innings (Highlightly) |
| Football (NFL) | The Odds API | ✅ live odds (NFL offseason in June = few events) |
| Horse racing | The Racing API | ✅ 35 real racecards; free tier = **no prices** |
| NASCAR | — | ❌ TheRundown has no motorsport; needs a different vendor |
| Greyhound | BetsAPI | ❌ no key obtained yet |
| Standings enrich | Highlightly (RapidAPI) | ✅ NFL/MLB/NBA/NHL real records at `/api/enrich/:sport/standings` |

### Keys (in `.env`, git-ignored)
ODDS_API_KEY, THERUNDOWN_API_KEY, RACING_API_USERNAME/PASSWORD, HIGHLIGHTLY_API_KEY.
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

## Workflow rules (Angela's preference — IMPORTANT)
Never commit straight to `main`. Always: issue → feature branch → PR (real description) →
CI green → squash-merge → delete branch → sync local. Claude does ALL git mechanics; Angela
approves direction only. End commits with the Co-Authored-By line; end PR bodies with the
Claude Code line.

## Done so far (all merged)
PRs #2 (scaffold), #4 (racing normalizer), #6 (Python tier), #8 (standings NFL/MLB/NBA),
#10 (NHL), #12 (movement feed filtered by sport), + live baseball scores & glossary.

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
