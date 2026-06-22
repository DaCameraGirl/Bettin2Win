<p align="center">
  <img src="docs/assets/readme-hero.svg" alt="Bettin2Win — guia de odds para iniciantes" width="100%"/>
</p>

# Bettin2Win

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇺🇸_English-131a26?style=for-the-badge" alt="English"/></a>
  <a href="README.es.md"><img src="https://img.shields.io/badge/🇪🇸_Español-131a26?style=for-the-badge" alt="Español"/></a>
  <a href="README.fr.md"><img src="https://img.shields.io/badge/🇫🇷_Français-131a26?style=for-the-badge" alt="Français"/></a>
  <a href="README.de.md"><img src="https://img.shields.io/badge/🇩🇪_Deutsch-131a26?style=for-the-badge" alt="Deutsch"/></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/🇧🇷_Português-4ade80?style=for-the-badge" alt="Português"/></a>
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/🇨🇳_中文-131a26?style=for-the-badge" alt="中文"/></a>
  <a href="README.ja.md"><img src="https://img.shields.io/badge/🇯🇵_日本語-131a26?style=for-the-badge" alt="日本語"/></a>
  <a href="README.ko.md"><img src="https://img.shields.io/badge/🇰🇷_한국어-131a26?style=for-the-badge" alt="한국어"/></a>
  <a href="README.it.md"><img src="https://img.shields.io/badge/🇮🇹_Italiano-131a26?style=for-the-badge" alt="Italiano"/></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/🇸🇦_العربية-131a26?style=for-the-badge" alt="العربية"/></a>
</p>

<p align="center">
  <img src="docs/assets/slot-machine.svg" alt="Caça-níqueis animado Bettin2Win — aprenda a linha, não é cassino" width="420"/>
</p>

<p align="center">
  <a href="https://dacameragirl.github.io/Bettin2Win/"><img src="https://img.shields.io/badge/🌐_Demo_ao_vivo-4ade80?style=for-the-badge" alt="Demo ao vivo"/></a>
  <a href="https://bettin2win.onrender.com/health"><img src="https://img.shields.io/badge/⚙️_Saúde_do_motor-131a26?style=for-the-badge" alt="Saúde do motor"/></a>
</p>

**O guia de odds para iniciantes — não é uma casa de apostas.** Compare linhas ao vivo,
traduza odds para linguagem simples, calcule possíveis pagamentos e entenda cada aposta antes
de apostar em outro lugar. Futebol americano, beisebol, basquete, hóquei, futebol, golfe,
NASCAR, corridas de cavalos e galgos.

Não aceitamos apostas. Uso informativo apenas. Aposte com responsabilidade.

> **Status:** provedores ao vivo ativos. O app tenta feeds reais primeiro e só recorre a
> backups quando todos os provedores daquele esporte estão indisponíveis, sem cota ou sem
> credenciais. Veja [Status dos provedores](#status-dos-provedores).

## Destaques

| Recurso | O que faz |
|---|---|
| **Explicar esta aposta** | Botão roxo em cada card — pagamentos, chance implícita e o que precisa acontecer para ganhar |
| **Como o Bettin2Win funciona** | Trilha de cinco passos para visitantes novos |
| **Impacto do clima** | Badges em jogos ao ar livre (vento, chuva, calor, pista) — contexto, não dica de aposta |
| **Cards de basquete** | Um card por jogo com abas Moneyline / Spread / Total / Movimento |
| **Filtros do painel** | Só iniciantes · jogos com preços · jogos ao vivo · mostrar tudo |
| **Ticker de mercado** | Cotações ao vivo de índices e mega-caps do Yahoo Finance |
| **Por que nem todo mundo é rico?** | Explicação de favorito/azarão/margem no guia e no painel Explicar |
| **Status dos provedores** | Saúde dos feeds em linguagem simples — verde quando backups funcionam |
| **Modo demo** | Painel de amostra offline para explorar a interface |

## O que tem aqui

Monorepo pnpm + Turborepo:

```text
apps/
  web/                Dashboard React + Vite
services/
  odds-engine/        Consulta provedores, normaliza odds, detecta movimento
  ai-analyst/         Transforma movimentos de preço em insights simples
packages/
  types/              Tipos de domínio compartilhados
.github/workflows/    CI, release, Pages e health checks
```

Cada provedor fica atrás de um adaptador que retorna a mesma forma `SportEvent`.

## Capturas

App ao vivo: [dacameragirl.github.io/Bettin2Win](https://dacameragirl.github.io/Bettin2Win/)

![Painel de odds de basquete](docs/screenshots/dashboard.png)

![Painel de status dos provedores](docs/screenshots/provider-status.png)

![Barra lateral de movimento de mercado](docs/screenshots/market-movement.png)

![Guia para iniciantes](docs/screenshots/beginner-guide.png)

Regenerar: `pnpm screenshots` (requer Chromium via Playwright).

## Início rápido

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

- Web: http://localhost:5173
- Motor de odds: http://localhost:4000
- Saúde: http://localhost:4000/health

## Status dos provedores

| Esporte | Cadeia de provedores | Auth | Comportamento |
|---|---|---|---|
| Futebol americano | The Odds API → Sportsbook API → **ESPN NFL** | `ODDS_API_KEY`, `RAPIDAPI_KEY` | Moneylines ESPN grátis se a cota da The Odds API falhar |
| Beisebol | The Odds API → Tank01 MLB → **ESPN MLB** → MLB Stats | `ODDS_API_KEY`, `RAPIDAPI_KEY` | ESPN + MLB Stats mantêm o painel ativo |
| Basquete | The Odds API → Sportsbook API → **ESPN NBA** | `ODDS_API_KEY`, `RAPIDAPI_KEY` | Placares WNBA/NBA/universitário + linhas DraftKings da ESPN |
| Hóquei | The Odds API → Sportsbook API → **ESPN NHL** → NHL scoreboard | `ODDS_API_KEY`, `RAPIDAPI_KEY` | Placar NHL oficial mesclado com preços ESPN |
| Futebol | BetMiner → football-prediction-api → **ESPN soccer** | `RAPIDAPI_KEY` | Previsões + moneylines 3 vias grátis da ESPN |
| Golfe | **ESPN golf** | nenhuma | Leaderboard e torneios da ESPN |
| NASCAR | **ESPN NASCAR** → TheRundown | `THERUNDOWN_API_KEY` (opcional) | Leaderboards ESPN; TheRundown com chave |
| Cavalos | Horse Racing (RapidAPI) → The Racing API | `RAPIDAPI_KEY`, `RACING_API_USERNAME`, `RACING_API_PASSWORD` | Programas + resultados; orçamento para tier grátis |
| Galgos | Greyhound Racing UK → **GBGB RSS** → BetsAPI | `RAPIDAPI_KEY`, `BETSAPI_KEY` | Fallback RSS GBGB grátis para UK |

## Chaves

Coloque chaves apenas em `.env` (git-ignored).

- The Odds API: `ODDS_API_KEY`
- RapidAPI: `RAPIDAPI_KEY`
- TheRundown: `THERUNDOWN_API_KEY`
- The Racing API: `RACING_API_USERNAME`, `RACING_API_PASSWORD`
- BetsAPI: `BETSAPI_KEY`

Se uma chave foi colada em chat ou capturas, rotacione.

## Scripts

| Comando | O que faz |
|---|---|
| `pnpm dev` | Roda apps/serviços em modo watch |
| `pnpm build` | Compila todo o monorepo |
| `pnpm typecheck` | Verificação de tipos |
| `pnpm test` | Testes unitários |
| `pnpm screenshots` | Captura screenshots do README |

## Contribuidores

- Angela — direção de produto, provedores, testes
- Claude — implementação anterior e workflow GitHub
- Dex (Codex) — fallbacks de provedores, UI do dashboard
- Grok — Impacto do clima, agrupamento de jogos, filtros, README e i18n

## Legal

App de análise/mídia, não casa de apostas. Termos dos provedores variam — confira as regras
antes de redistribuir dados ou uso comercial.