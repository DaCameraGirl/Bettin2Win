<p align="center">
  <img src="docs/assets/readme-hero.svg" alt="Bettin2Win — guía de cuotas para principiantes" width="100%"/>
</p>

# Bettin2Win

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇺🇸_English-131a26?style=for-the-badge" alt="English"/></a>
  <a href="README.es.md"><img src="https://img.shields.io/badge/🇪🇸_Español-4ade80?style=for-the-badge" alt="Español"/></a>
  <a href="README.fr.md"><img src="https://img.shields.io/badge/🇫🇷_Français-131a26?style=for-the-badge" alt="Français"/></a>
  <a href="README.de.md"><img src="https://img.shields.io/badge/🇩🇪_Deutsch-131a26?style=for-the-badge" alt="Deutsch"/></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/🇧🇷_Português-131a26?style=for-the-badge" alt="Português"/></a>
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/🇨🇳_中文-131a26?style=for-the-badge" alt="中文"/></a>
  <a href="README.ja.md"><img src="https://img.shields.io/badge/🇯🇵_日本語-131a26?style=for-the-badge" alt="日本語"/></a>
  <a href="README.ko.md"><img src="https://img.shields.io/badge/🇰🇷_한국어-131a26?style=for-the-badge" alt="한국어"/></a>
  <a href="README.it.md"><img src="https://img.shields.io/badge/🇮🇹_Italiano-131a26?style=for-the-badge" alt="Italiano"/></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/🇸🇦_العربية-131a26?style=for-the-badge" alt="العربية"/></a>
</p>

<p align="center">
  <img src="docs/assets/slot-machine.svg" alt="Tragamonedas animada de Bettin2Win — aprende la línea, no es un casino" width="420"/>
</p>

<p align="center">
  <a href="https://dacameragirl.github.io/Bettin2Win/"><img src="https://img.shields.io/badge/🌐_Demo_en_vivo-4ade80?style=for-the-badge" alt="Demo en vivo"/></a>
  <a href="https://bettin2win.onrender.com/health"><img src="https://img.shields.io/badge/⚙️_Estado_del_motor-131a26?style=for-the-badge" alt="Estado del motor"/></a>
</p>

**La guía de cuotas para principiantes — no es una casa de apuestas.** Compara líneas en vivo,
traduce las cuotas a lenguaje sencillo, calcula posibles pagos y aprende qué significa cada
apuesta antes de apostar en otro sitio. Fútbol americano, béisbol, baloncesto, hockey, fútbol,
golf, NASCAR, carreras de caballos y galgos.

No aceptamos apuestas. Solo uso informativo. Apuesta con responsabilidad.

> **Estado:** los proveedores en vivo están activos. La app intenta feeds reales primero y solo
> recurre a respaldos cuando todos los proveedores de ese deporte no están disponibles, sin
> cuota o sin credenciales. Ver [Estado de proveedores](#estado-de-proveedores).

## Funciones destacadas

| Función | Qué hace |
|---|---|
| **Explicar esta apuesta** | Botón morado en cada tarjeta — pagos, probabilidad implícita y qué debe pasar para ganar |
| **Cómo funciona Bettin2Win** | Recorrido de cinco pasos para visitantes nuevos |
| **Impacto del clima** | Insignias en partidos al aire libre (viento, lluvia, calor, pista) — contexto, no consejos de apuesta |
| **Tarjetas de baloncesto** | Una tarjeta por partido con pestañas Moneyline / Spread / Total / Movimiento |
| **Filtros del tablero** | Solo principiantes · partidos con precios · partidos en vivo · mostrar todo |
| **Ticker de mercado** | Cotizaciones en vivo de índices y mega-cap desde Yahoo Finance |
| **¿Por qué no todos son ricos?** | Explicación de favorito/underdog/margen en la guía y el panel Explicar |
| **Estado de proveedores** | Salud de feeds en lenguaje sencillo — verde cuando los respaldos funcionan |
| **Modo demo** | Tablero de muestra sin conexión para explorar la interfaz |

## Qué hay aquí

Monorepo pnpm + Turborepo:

```text
apps/
  web/                Panel React + Vite
services/
  odds-engine/        Consulta proveedores, normaliza cuotas, detecta movimiento
  ai-analyst/         Convierte movimientos de precio en ideas en lenguaje sencillo
packages/
  types/              Tipos de dominio compartidos
.github/workflows/    CI, release, Pages y comprobaciones de salud
```

Cada proveedor está detrás de un adaptador que devuelve la misma forma `SportEvent`. El frontend
nunca ve payloads crudos.

## Capturas

App en vivo: [dacameragirl.github.io/Bettin2Win](https://dacameragirl.github.io/Bettin2Win/)

![Tablero de cuotas de baloncesto](docs/screenshots/dashboard.png)

![Panel de estado de proveedores](docs/screenshots/provider-status.png)

![Barra lateral de movimiento de mercado](docs/screenshots/market-movement.png)

![Guía para principiantes](docs/screenshots/beginner-guide.png)

Regenerar: `pnpm screenshots` (requiere Chromium vía Playwright).

## Inicio rápido

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

- Web: http://localhost:5173
- Motor de cuotas: http://localhost:4000
- Salud: http://localhost:4000/health

## Estado de proveedores

| Deporte | Cadena de proveedores | Auth | Comportamiento |
|---|---|---|---|
| Fútbol americano | The Odds API → Sportsbook API → **ESPN NFL** | `ODDS_API_KEY`, `RAPIDAPI_KEY` | Moneylines ESPN gratis si falla la cuota de The Odds API |
| Béisbol | The Odds API → Tank01 MLB → **ESPN MLB** → MLB Stats | `ODDS_API_KEY`, `RAPIDAPI_KEY` | ESPN + MLB Stats mantienen el tablero activo |
| Baloncesto | The Odds API → Sportsbook API → **ESPN NBA** | `ODDS_API_KEY`, `RAPIDAPI_KEY` | Marcadores WNBA/NBA/universitario + líneas DraftKings de ESPN |
| Hockey | The Odds API → Sportsbook API → **ESPN NHL** → NHL scoreboard | `ODDS_API_KEY`, `RAPIDAPI_KEY` | Marcador NHL oficial fusionado con precios ESPN |
| Fútbol | BetMiner → football-prediction-api → **ESPN soccer** | `RAPIDAPI_KEY` | Predicciones + moneylines 3 vías gratis de ESPN |
| Golf | **ESPN golf** | ninguna | Clasificación y torneos desde ESPN |
| NASCAR | **ESPN NASCAR** → TheRundown | `THERUNDOWN_API_KEY` (opcional) | Clasificaciones ESPN; TheRundown con clave |
| Caballos | Horse Racing (RapidAPI) → The Racing API | `RAPIDAPI_KEY`, `RACING_API_USERNAME`, `RACING_API_PASSWORD` | Programas + resultados; presupuesto para tier gratis |
| Galgos | Greyhound Racing UK → **GBGB RSS** → BetsAPI | `RAPIDAPI_KEY`, `BETSAPI_KEY` | Respaldo RSS GBGB gratis para UK |

## Claves

Pon las claves solo en `.env` (git-ignored).

- The Odds API: `ODDS_API_KEY`
- RapidAPI: `RAPIDAPI_KEY`
- TheRundown: `THERUNDOWN_API_KEY`
- The Racing API: `RACING_API_USERNAME`, `RACING_API_PASSWORD`
- BetsAPI: `BETSAPI_KEY`

Si una clave se pegó en chat o capturas, rótala.

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Ejecuta apps/servicios en modo watch |
| `pnpm build` | Compila todo el monorepo |
| `pnpm typecheck` | Verificación de tipos |
| `pnpm test` | Tests unitarios |
| `pnpm screenshots` | Captura capturas del README |

## Colaboradores

- Angela — dirección de producto, proveedores, pruebas
- Claude — implementación previa y flujo de GitHub
- Dex (Codex) — respaldos de proveedores, UI del panel
- Grok — Impacto del clima, agrupación de partidos, filtros, README e i18n

## Legal

Esta es una app de análisis/medios, no una casa de apuestas. Los términos de cada proveedor
varían; revisa sus reglas antes de redistribuir datos o usarlos comercialmente.