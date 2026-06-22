<p align="center">
  <img src="docs/assets/readme-hero.svg" alt="Bettin2Win — guida quote per principianti" width="100%"/>
</p>

# Bettin2Win

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇺🇸_English-131a26?style=for-the-badge" alt="English"/></a>
  <a href="README.es.md"><img src="https://img.shields.io/badge/🇪🇸_Español-131a26?style=for-the-badge" alt="Español"/></a>
  <a href="README.fr.md"><img src="https://img.shields.io/badge/🇫🇷_Français-131a26?style=for-the-badge" alt="Français"/></a>
  <a href="README.de.md"><img src="https://img.shields.io/badge/🇩🇪_Deutsch-131a26?style=for-the-badge" alt="Deutsch"/></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/🇧🇷_Português-131a26?style=for-the-badge" alt="Português"/></a>
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/🇨🇳_中文-131a26?style=for-the-badge" alt="中文"/></a>
  <a href="README.ja.md"><img src="https://img.shields.io/badge/🇯🇵_日本語-131a26?style=for-the-badge" alt="日本語"/></a>
  <a href="README.ko.md"><img src="https://img.shields.io/badge/🇰🇷_한국어-131a26?style=for-the-badge" alt="한국어"/></a>
  <a href="README.it.md"><img src="https://img.shields.io/badge/🇮🇹_Italiano-4ade80?style=for-the-badge" alt="Italiano"/></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/🇸🇦_العربية-131a26?style=for-the-badge" alt="العربية"/></a>
</p>

<p align="center">
  <img src="docs/assets/slot-machine.svg" alt="Slot machine animata Bettin2Win — impara la linea, non un casinò" width="420"/>
</p>

<p align="center">
  <a href="https://dacameragirl.github.io/Bettin2Win/"><img src="https://img.shields.io/badge/🌐_Demo_live-4ade80?style=for-the-badge" alt="Demo live"/></a>
  <a href="https://bettin2win.onrender.com/health"><img src="https://img.shields.io/badge/⚙️_Stato_motore-131a26?style=for-the-badge" alt="Stato motore"/></a>
</p>

**La guida alle quote per principianti — non è un bookmaker.** Confronta le linee live,
traduci le quote in linguaggio semplice, calcola i possibili pagamenti e capisci ogni scommessa
prima di puntare altrove. Football americano, baseball, basket, hockey, calcio, golf, NASCAR,
ippica e levrieri.

Non accettiamo scommesse. Solo uso informativo. Gioca responsabilmente.

> **Stato:** i provider live sono attivi. L'app prova prima i feed reali e ricorre ai fallback
> solo quando tutti i provider configurati per quello sport sono indisponibili, senza quota o
> senza credenziali. Vedi [Stato provider](#stato-provider).

## Funzionalità principali

| Funzione | Cosa fa |
|---|---|
| **Spiega questa scommessa** | Pulsante viola su ogni card — pagamenti, probabilità implicita e condizioni di vittoria |
| **Come funziona Bettin2Win** | Percorso in cinque passi per i nuovi visitatori |
| **Impatto meteo** | Badge per partite all'aperto (vento, pioggia, caldo, pista) — contesto, non consigli |
| **Card basket** | Una card per partita con tab Moneyline / Spread / Total / Movimento |
| **Filtri board** | Solo principianti · partite con prezzi · live · mostra tutto |
| **Ticker di mercato** | Quotazioni live di indici e mega-cap da Yahoo Finance |
| **Perché non tutti sono ricchi?** | Spiegazione favorito/outsider/margine nella guida e nel pannello Spiega |
| **Stato provider** | Salute feed in linguaggio chiaro — verde quando i backup funzionano |
| **Modalità demo** | Board di esempio offline per esplorare l'interfaccia |

## Contenuto

Monorepo pnpm + Turborepo:

```text
apps/
  web/                Dashboard React + Vite
services/
  odds-engine/        Interroga provider, normalizza quote, rileva movimenti
  ai-analyst/         Trasforma i movimenti di prezzo in insight chiari
packages/
  types/              Tipi di dominio condivisi
.github/workflows/    CI, release, Pages e health check
```

Ogni provider è dietro un adapter che restituisce la stessa forma `SportEvent`.

## Screenshot

App live: [dacameragirl.github.io/Bettin2Win](https://dacameragirl.github.io/Bettin2Win/)

![Board quote basket](docs/screenshots/dashboard.png)

![Pannello stato provider](docs/screenshots/provider-status.png)

![Sidebar movimento di mercato](docs/screenshots/market-movement.png)

![Guida per principianti](docs/screenshots/beginner-guide.png)

Rigenerare: `pnpm screenshots` (richiede Chromium via Playwright).

## Avvio rapido

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

- Web: http://localhost:5173
- Motore quote: http://localhost:4000
- Health: http://localhost:4000/health

## Stato provider

| Sport | Catena provider | Auth | Comportamento |
|---|---|---|---|
| Football US | The Odds API → Sportsbook API → **ESPN NFL** | `ODDS_API_KEY`, `RAPIDAPI_KEY` | Moneyline ESPN gratis se quota The Odds API esaurita |
| Baseball | The Odds API → Tank01 MLB → **ESPN MLB** → MLB Stats | `ODDS_API_KEY`, `RAPIDAPI_KEY` | ESPN + MLB Stats mantengono il board attivo |
| Basket | The Odds API → Sportsbook API → **ESPN NBA** | `ODDS_API_KEY`, `RAPIDAPI_KEY` | Score WNBA/NBA/universitario + linee DraftKings ESPN |
| Hockey | The Odds API → Sportsbook API → **ESPN NHL** → NHL scoreboard | `ODDS_API_KEY`, `RAPIDAPI_KEY` | Scoreboard NHL ufficiale con prezzi ESPN |
| Calcio | BetMiner → football-prediction-api → **ESPN soccer** | `RAPIDAPI_KEY` | Previsioni + moneyline 3 vie gratis ESPN |
| Golf | **ESPN golf** | nessuna | Classifica e tornei ESPN |
| NASCAR | **ESPN NASCAR** → TheRundown | `THERUNDOWN_API_KEY` (opzionale) | Classifiche gara ESPN; TheRundown con chiave |
| Ippica | Horse Racing (RapidAPI) → The Racing API | `RAPIDAPI_KEY`, `RACING_API_USERNAME`, `RACING_API_PASSWORD` | Programmi + risultati; budget tier gratuito |
| Levrieri | Greyhound Racing UK → **GBGB RSS** → BetsAPI | `RAPIDAPI_KEY`, `BETSAPI_KEY` | Fallback RSS GBGB gratis per UK |

## Chiavi

Metti le chiavi solo in `.env` (git-ignored).

- The Odds API: `ODDS_API_KEY`
- RapidAPI: `RAPIDAPI_KEY`
- TheRundown: `THERUNDOWN_API_KEY`
- The Racing API: `RACING_API_USERNAME`, `RACING_API_PASSWORD`
- BetsAPI: `BETSAPI_KEY`

Se una chiave è stata incollata in chat o screenshot, ruotala.

## Script

| Comando | Azione |
|---|---|
| `pnpm dev` | Esegue app/servizi in watch mode |
| `pnpm build` | Compila tutto il monorepo |
| `pnpm typecheck` | Controllo tipi |
| `pnpm test` | Test unitari |
| `pnpm screenshots` | Cattura screenshot README |

## Contributori

- Angela — direzione prodotto, provider, test
- Claude — implementazione precedente e workflow GitHub
- Dex (Codex) — fallback provider, UI dashboard
- Grok — Impatto meteo, raggruppamento match, filtri, README e i18n

## Note legali

App di analisi/media, non un bookmaker. I termini dei provider variano; verifica le regole
prima di ridistribuire dati o uso commerciale.