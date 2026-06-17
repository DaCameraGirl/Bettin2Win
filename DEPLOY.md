# Deploying Bettin2Win for real

The app is **two pieces** and both must be online:

1. **odds-engine** — the live data server (WebSocket + your API keys). Runs on a
   host that keeps Node running 24/7 (we use **Render**, free tier).
2. **web dashboard** — static files, served by **GitHub Pages**, built to talk to
   the hosted engine over secure `wss://`.

GitHub Pages alone is not enough — it can't run the engine, so the site would have
no data. Do **Part A first**, then **Part B**.

> ⚠️ Your API keys are free-tier. A public site polling 24/7 can exhaust monthly
> request quotas (especially The Odds API). For heavy real use, upgrade those plans.
> Also: Render's free tier **sleeps after ~15 min idle**, so the first visit after a
> quiet spell takes ~30s to wake the engine.

---

## Part A — Host the engine on Render (~10 min)

1. Go to **https://render.com** and sign up (GitHub login is easiest).
2. **New → Blueprint**, and select the **Bettin2Win** repo. Render reads
   [`render.yaml`](./render.yaml) and proposes a `bettin2win-engine` web service.
3. Click **Apply**. The first build takes a few minutes.
4. Open the service → **Environment** → add your keys (these are NOT in git):
   - `ODDS_API_KEY`, `THERUNDOWN_API_KEY`, `RACING_API_USERNAME`,
     `RACING_API_PASSWORD`, `BETSAPI_KEY`, `HIGHLIGHTLY_API_KEY`, `RAPIDAPI_KEY`
   - (use the same values from your local `.env`)
5. After it deploys, note the public URL, e.g. `https://bettin2win-engine.onrender.com`.
   Confirm it works: open `https://bettin2win-engine.onrender.com/health` — you
   should see JSON with the sports list.

Your engine's WebSocket address is that URL with `wss://` and `/ws`:
`wss://bettin2win-engine.onrender.com/ws`

---

## Part B — Publish the web app to GitHub Pages (~5 min)

1. In GitHub: **repo → Settings → Pages → Build and deployment → Source = GitHub Actions**.
2. In GitHub: **repo → Settings → Secrets and variables → Actions → Variables tab →
   New repository variable**, and add these three (they're public URLs, not secrets):

   | Name | Value |
   |---|---|
   | `VITE_WS_URL` | `wss://bettin2win-engine.onrender.com/ws` |
   | `VITE_API_URL` | `https://bettin2win-engine.onrender.com` |
   | `VITE_BASE` | `/Bettin2Win/` |

3. Go to **Actions → "Deploy web to GitHub Pages" → Run workflow** (or just push to
   `main`). Until `VITE_WS_URL` exists the workflow stays dormant; once it's set, it
   builds and deploys.
4. Your site goes live at **https://dacameragirl.github.io/Bettin2Win/**.

---

## Part C — Use your own domain (optional, after you buy one)

1. **Settings → Pages → Custom domain**: enter your domain (e.g. `bettin2win.com`),
   and add the DNS records GitHub shows you at your registrar.
2. Change the `VITE_BASE` repo Variable to `/` (apex domains serve from root), then
   re-run the Pages workflow.
3. Tick **Enforce HTTPS** once the certificate is issued.

That's it — engine on Render, site on your domain, keys safe in host secrets.
