# Bettin2Win

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇺🇸_English-131a26?style=for-the-badge" alt="English"/></a>
  <a href="README.es.md"><img src="https://img.shields.io/badge/🇪🇸_Español-131a26?style=for-the-badge" alt="Español"/></a>
  <a href="README.fr.md"><img src="https://img.shields.io/badge/🇫🇷_Français-131a26?style=for-the-badge" alt="Français"/></a>
  <a href="README.de.md"><img src="https://img.shields.io/badge/🇩🇪_Deutsch-4ade80?style=for-the-badge" alt="Deutsch"/></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/🇧🇷_Português-131a26?style=for-the-badge" alt="Português"/></a>
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/🇨🇳_中文-131a26?style=for-the-badge" alt="中文"/></a>
  <a href="README.ja.md"><img src="https://img.shields.io/badge/🇯🇵_日本語-131a26?style=for-the-badge" alt="日本語"/></a>
  <a href="README.ko.md"><img src="https://img.shields.io/badge/🇰🇷_한국어-131a26?style=for-the-badge" alt="한국어"/></a>
  <a href="README.it.md"><img src="https://img.shields.io/badge/🇮🇹_Italiano-131a26?style=for-the-badge" alt="Italiano"/></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/🇸🇦_العربية-131a26?style=for-the-badge" alt="العربية"/></a>
</p>

<p align="center">
  <img src="docs/assets/slot-machine.svg" alt="Animierter Bettin2Win-Spielautomat — lerne die Linie, kein Casino" width="420"/>
</p>

<p align="center">
  <a href="https://dacameragirl.github.io/Bettin2Win/"><img src="https://img.shields.io/badge/🌐_Live-Demo-4ade80?style=for-the-badge" alt="Live-Demo"/></a>
  <a href="https://bettin2win.onrender.com/health"><img src="https://img.shields.io/badge/⚙️_Engine-Status-131a26?style=for-the-badge" alt="Engine-Status"/></a>
</p>

**Der Quoten-Guide für Einsteiger — kein Wettanbieter.** Vergleiche Live-Linien, übersetze
Quoten in klare Sprache, berechne mögliche Auszahlungen und verstehe jede Wette, bevor du
woanders setzt. Football, Baseball, Basketball, Hockey, Fußball, Golf, NASCAR, Pferderennen
und Windhundrennen.

Wir nehmen keine Wetten an. Nur zur Information. Spiele verantwortungsvoll.

> **Status:** Live-Provider sind aktiv. Die App versucht zuerst echte Feeds und fällt nur zurück,
> wenn alle konfigurierten Provider für eine Sportart nicht verfügbar, ohne Kontingent oder ohne
> Zugangsdaten sind. Siehe [Provider-Status](#provider-status).

## Highlights

| Feature | Beschreibung |
|---|---|
| **Diese Wette erklären** | Lila Button auf jeder Karte — Auszahlungen, implizite Chance und Siegbedingungen |
| **So funktioniert Bettin2Win** | Fünf-Schritte-Einführung für Erstbesucher |
| **Wetter-Impact** | Badges bei Outdoor-Spielen (Wind, Regen, Hitze, Strecke) — Kontext, keine Wett-Tipps |
| **Basketball-Matchup-Karten** | Eine Karte pro Spiel mit Tabs Moneyline / Spread / Total / Bewegung |
| **Board-Filter** | Nur Einsteiger · Spiele mit Preisen · Live-Spiele · alle anzeigen |
| **Markt-Ticker** | Live-Kurse für Indizes und Mega-Caps von Yahoo Finance |
| **Warum ist nicht jeder reich?** | Favorit/Underdog/Marge-Erklärung im Guide und Explain-Panel |
| **Provider-Status** | Feed-Gesundheit in klarer Sprache — grün wenn Backups greifen |
| **Demo-Modus** | Offline-Beispielboard zum UI-Testen |

## Inhalt

pnpm + Turborepo Monorepo:

```text
apps/
  web/                React + Vite Dashboard
services/
  odds-engine/        Pollt Provider, normalisiert Quoten, erkennt Bewegungen
  ai-analyst/         Macht aus Preisbewegungen verständliche Insights
packages/
  types/              Geteilte Domain-Typen
.github/workflows/    CI, Release, Pages und Health-Checks
```

Jeder Provider steckt hinter einem Adapter mit einheitlicher `SportEvent`-Form.

## Screenshots

Live-App: [dacameragirl.github.io/Bettin2Win](https://dacameragirl.github.io/Bettin2Win/)

![Basketball-Quotenboard](docs/screenshots/dashboard.png)

![Provider-Status-Panel](docs/screenshots/provider-status.png)

![Marktbewegungs-Sidebar](docs/screenshots/market-movement.png)

![Einsteiger-Guide](docs/screenshots/beginner-guide.png)

Neu erzeugen: `pnpm screenshots` (Chromium via Playwright).

## Schnellstart

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

- Web: http://localhost:5173
- Odds Engine: http://localhost:4000
- Health: http://localhost:4000/health

## Provider-Status

| Sport | Provider-Kette | Auth | Verhalten |
|---|---|---|---|
| Football | The Odds API → Sportsbook API → **ESPN NFL** | `ODDS_API_KEY`, `RAPIDAPI_KEY` | Kostenlose ESPN-Moneylines bei The-Odds-API-Kontingent |
| Baseball | The Odds API → Tank01 MLB → **ESPN MLB** → MLB Stats | `ODDS_API_KEY`, `RAPIDAPI_KEY` | ESPN + MLB Stats halten das Board grün |
| Basketball | The Odds API → Sportsbook API → **ESPN NBA** | `ODDS_API_KEY`, `RAPIDAPI_KEY` | WNBA/NBA/College-Scores + DraftKings-Linien von ESPN |
| Hockey | The Odds API → Sportsbook API → **ESPN NHL** → NHL scoreboard | `ODDS_API_KEY`, `RAPIDAPI_KEY` | Offizielles NHL-Scoreboard mit ESPN-Preisen |
| Fußball | BetMiner → football-prediction-api → **ESPN soccer** | `RAPIDAPI_KEY` | Prognosen + kostenlose ESPN-3-Weg-Moneylines |
| Golf | **ESPN golf** | keine | Leaderboard und Turniere von ESPN |
| NASCAR | **ESPN NASCAR** → TheRundown | `THERUNDOWN_API_KEY` (optional) | ESPN-Rennleaderboards; TheRundown mit Key |
| Pferderennen | Horse Racing (RapidAPI) → The Racing API | `RAPIDAPI_KEY`, `RACING_API_USERNAME`, `RACING_API_PASSWORD` | Rennkarten + Ergebnisse; Free-Tier-budgetiert |
| Windhunde | Greyhound Racing UK → **GBGB RSS** → BetsAPI | `RAPIDAPI_KEY`, `BETSAPI_KEY` | Kostenloser GBGB-RSS-Fallback für UK |

## Keys

Keys nur in `.env` (git-ignored).

- The Odds API: `ODDS_API_KEY`
- RapidAPI: `RAPIDAPI_KEY`
- TheRundown: `THERUNDOWN_API_KEY`
- The Racing API: `RACING_API_USERNAME`, `RACING_API_PASSWORD`
- BetsAPI: `BETSAPI_KEY`

Wurde ein Key in Chat oder Screenshots geteilt, rotieren.

## Scripts

| Befehl | Aktion |
|---|---|
| `pnpm dev` | Apps/Services im Watch-Modus |
| `pnpm build` | Gesamtes Monorepo bauen |
| `pnpm typecheck` | Typprüfung |
| `pnpm test` | Unit-Tests |
| `pnpm screenshots` | README-Screenshots erfassen |

## Mitwirkende

- Angela — Produkt, Provider, Tests
- Claude — frühere Implementierung und GitHub-Workflow
- Dex (Codex) — Provider-Fallbacks, Dashboard-UI
- Grok — Wetter-Impact, Matchup-Gruppierung, Filter, README & i18n

## Rechtliches

Analytics/Medien-App, kein Buchmacher. Provider-Bedingungen variieren — Regeln vor
Weiterverbreitung oder kommerziellem Einsatz prüfen.