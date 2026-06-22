<p align="center">
  <img src="docs/assets/readme-hero.svg" alt="Bettin2Win — 초보자용 배당 가이드" width="100%"/>
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
  <a href="README.ko.md"><img src="https://img.shields.io/badge/🇰🇷_한국어-4ade80?style=for-the-badge" alt="한국어"/></a>
  <a href="README.it.md"><img src="https://img.shields.io/badge/🇮🇹_Italiano-131a26?style=for-the-badge" alt="Italiano"/></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/🇸🇦_العربية-131a26?style=for-the-badge" alt="العربية"/></a>
</p>

<p align="center">
  <img src="docs/assets/slot-machine.svg" alt="Bettin2Win 애니메이션 슬롯머신 — 라인을 배우세요, 카지노가 아닙니다" width="420"/>
</p>

<p align="center">
  <a href="https://dacameragirl.github.io/Bettin2Win/"><img src="https://img.shields.io/badge/🌐_라이브_데모-4ade80?style=for-the-badge" alt="라이브 데모"/></a>
  <a href="https://bettin2win.onrender.com/health"><img src="https://img.shields.io/badge/⚙️_엔진_상태-131a26?style=for-the-badge" alt="엔진 상태"/></a>
</p>

**초보자용 배당 가이드 — 스포츠북이 아닙니다.** 라이브 라인을 비교하고, 배당을 쉬운 말로
번역하며, 예상 지급액을 계산하고, 다른 곳에 베팅하기 전에 각 베팅의 의미를 배웁니다.
미식축구, 야구, 농구, 하키, 축구, 골프, NASCAR, 경마, 그레이하운드.

베팅을 받지 않습니다. 정보 제공 목적만. 책임감 있게 베팅하세요.

> **상태:** 라이브 프로바이더 연동이 활성화되어 있습니다. 앱은 먼저 실제 피드를 시도하고,
> 해당 스포츠의 모든 구성 프로바이더가 사용 불가·할당량 소진·자격 증명 없음일 때만
> 폴백합니다. [프로바이더 상태](#프로바이더-상태) 참고.

## 주요 기능

| 기능 | 설명 |
|---|---|
| **이 베팅 설명** | 각 카드의 보라색 버튼 — 지급, 내재 확률, 승리 조건 |
| **Bettin2Win 작동 방식** | 첫 방문자용 5단계 안내 |
| **날씨 영향** | 야외 경기 배지(바람, 비, 더위, 트랙) — 맥락 제공, 베팅 조언 아님 |
| **농구 매치업 카드** | 경기당 카드 1장, 머니라인 / 스프레드 / 토탈 / 움직임 탭 |
| **보드 필터** | 초보자 친화만 · 가격 있는 경기 · 라이브 · 전체 표시 |
| **시장 티커** | Yahoo Finance 지수·메가캡 실시간 시세 |
| **왜 모두가 부자가 아닐까?** | 페이버릿/언더독/마진 설명(초보 가이드 + 설명 패널) |
| **프로바이더 상태** | 피드 상태를 쉬운 말로 — 백업 성공 시 녹색 |
| **데모 모드** | UI 탐색용 오프라인 샘플 보드 |

## 구성

pnpm + Turborepo 모노레포:

```text
apps/
  web/                React + Vite 대시보드
services/
  odds-engine/        프로바이더 폴링, 배당 정규화, 변동 감지, 스냅샷 브로드캐스트
  ai-analyst/         가격 변동을 쉬운 인사이트로 변환
packages/
  types/              레이어 간 공유 도메인 타입
.github/workflows/    CI, 릴리스, Pages, 헬스 체크
```

각 프로바이더는 동일한 `SportEvent` 형태를 반환하는 어댑터 뒤에 있습니다.

## 스크린샷

라이브 앱: [dacameragirl.github.io/Bettin2Win](https://dacameragirl.github.io/Bettin2Win/)

![농구 배당 보드](docs/screenshots/dashboard.png)

![프로바이더 상태 패널](docs/screenshots/provider-status.png)

![시장 움직임 사이드바](docs/screenshots/market-movement.png)

![초보자 가이드](docs/screenshots/beginner-guide.png)

재생성: `pnpm screenshots` (Playwright Chromium 필요).

## 빠른 시작

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

- Web: http://localhost:5173
- 배당 엔진: http://localhost:4000
- 헬스: http://localhost:4000/health

## 프로바이더 상태

| 스포츠 | 프로바이더 체인 | 인증 | 동작 |
|---|---|---|---|
| 미식축구 | The Odds API → Sportsbook API → **ESPN NFL** | `ODDS_API_KEY`, `RAPIDAPI_KEY` | The Odds API 할당량 실패 시 무료 ESPN 머니라인 |
| 야구 | The Odds API → Tank01 MLB → **ESPN MLB** → MLB Stats | `ODDS_API_KEY`, `RAPIDAPI_KEY` | ESPN + MLB Stats로 유료 키 없이 보드 유지 |
| 농구 | The Odds API → Sportsbook API → **ESPN NBA** | `ODDS_API_KEY`, `RAPIDAPI_KEY` | WNBA/NBA/대학 스코어 + ESPN DraftKings 라인 |
| 하키 | The Odds API → Sportsbook API → **ESPN NHL** → NHL scoreboard | `ODDS_API_KEY`, `RAPIDAPI_KEY` | 공식 NHL 스코어보드와 ESPN 가격 병합 |
| 축구 | BetMiner → football-prediction-api → **ESPN soccer** | `RAPIDAPI_KEY` | 예측 + 무료 ESPN 3-way 머니라인 |
| 골프 | **ESPN golf** | 없음 | ESPN 리더보드 및 토너먼트 카드 |
| NASCAR | **ESPN NASCAR** → TheRundown | `THERUNDOWN_API_KEY` (선택) | ESPN 레이스 순위; 키 있으면 TheRundown |
| 경마 | Horse Racing (RapidAPI) → The Racing API | `RAPIDAPI_KEY`, `RACING_API_USERNAME`, `RACING_API_PASSWORD` | 출전표 + 결과; 무료 RapidAPI 티어 예산 |
| 그레이하운드 | Greyhound Racing UK → **GBGB RSS** → BetsAPI | `RAPIDAPI_KEY`, `BETSAPI_KEY` | UK용 무료 GBGB RSS 폴백 |

## 키

키는 `.env`에만 저장(git-ignore).

- The Odds API: `ODDS_API_KEY`
- RapidAPI: `RAPIDAPI_KEY`
- TheRundown: `THERUNDOWN_API_KEY`
- The Racing API: `RACING_API_USERNAME`, `RACING_API_PASSWORD`
- BetsAPI: `BETSAPI_KEY`

채팅이나 스크린샷에 키를 붙였다면 교체하세요.

## 스크립트

| 명령 | 설명 |
|---|---|
| `pnpm dev` | watch 모드로 앱/서비스 실행 |
| `pnpm build` | 모노레포 전체 빌드 |
| `pnpm typecheck` | 타입 검사 |
| `pnpm test` | 단위 테스트 |
| `pnpm screenshots` | README 스크린샷 캡처 |

## 기여자

- Angela — 제품 방향, 프로바이더, 테스트
- Claude — 초기 구현 및 GitHub 워크플로
- Dex (Codex) — 프로바이더 폴백, 대시보드 UI
- Grok — 날씨 영향, 매치업 그룹화, 필터, README 및 i18n

## 법적 고지

분석/미디어 앱이며 북메이커가 아닙니다. 프로바이더 약관은 플랜과 용도에 따라 다릅니다.
데이터 재배포나 상업적 베팅 워크플로 전에 각 규칙을 확인하세요.