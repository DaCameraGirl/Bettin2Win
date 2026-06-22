# Bettin2Win

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇺🇸_English-131a26?style=for-the-badge" alt="English"/></a>
  <a href="README.es.md"><img src="https://img.shields.io/badge/🇪🇸_Español-131a26?style=for-the-badge" alt="Español"/></a>
  <a href="README.fr.md"><img src="https://img.shields.io/badge/🇫🇷_Français-131a26?style=for-the-badge" alt="Français"/></a>
  <a href="README.de.md"><img src="https://img.shields.io/badge/🇩🇪_Deutsch-131a26?style=for-the-badge" alt="Deutsch"/></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/🇧🇷_Português-131a26?style=for-the-badge" alt="Português"/></a>
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/🇨🇳_中文-4ade80?style=for-the-badge" alt="中文"/></a>
  <a href="README.ja.md"><img src="https://img.shields.io/badge/🇯🇵_日本語-131a26?style=for-the-badge" alt="日本語"/></a>
  <a href="README.ko.md"><img src="https://img.shields.io/badge/🇰🇷_한국어-131a26?style=for-the-badge" alt="한국어"/></a>
  <a href="README.it.md"><img src="https://img.shields.io/badge/🇮🇹_Italiano-131a26?style=for-the-badge" alt="Italiano"/></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/🇸🇦_العربية-131a26?style=for-the-badge" alt="العربية"/></a>
</p>

<p align="center">
  <img src="docs/assets/slot-machine.svg" alt="Bettin2Win 动画老虎机 — 学懂盘口，不是赌场" width="420"/>
</p>

<p align="center">
  <a href="https://dacameragirl.github.io/Bettin2Win/"><img src="https://img.shields.io/badge/🌐_在线演示-4ade80?style=for-the-badge" alt="在线演示"/></a>
  <a href="https://bettin2win.onrender.com/health"><img src="https://img.shields.io/badge/⚙️_引擎状态-131a26?style=for-the-badge" alt="引擎状态"/></a>
</p>

**新手赔率指南 — 不是博彩公司。** 对比实时盘口，把赔率翻译成通俗语言，计算可能回报，
并在去别处下注前弄清每种投注的含义。涵盖美式足球、棒球、篮球、冰球、足球、高尔夫、
NASCAR、赛马和赛狗。

我们不接受投注。仅供信息参考。请理性博彩。

> **状态：** 实时数据源已接入。应用优先尝试真实 feed，仅在某项运动的所有配置提供商
> 不可用、配额用尽或缺少密钥时才回退。见[提供商状态](#提供商状态)。

## 功能亮点

| 功能 | 说明 |
|---|---|
| **解释这注** | 每张卡片上的紫色按钮 — 回报、隐含概率及获胜条件 |
| **Bettin2Win 如何运作** | 五步引导条，面向首次访客 |
| **天气影响** | 户外赛事徽章（风、雨、高温、赛道）— 提供背景，非投注建议 |
| **篮球对阵卡片** | 每场比赛一张卡，含独赢 / 让分 / 大小 / 走势 标签 |
| **看板筛选** | 仅新手友好 · 有报价的赛事 · 进行中 · 显示全部 |
| **行情滚动条** | 来自 Yahoo Finance 的指数与大盘股实时报价 |
| **为什么不是人人都发财？** | 热门/冷门/庄家边际说明，见于新手指南与解释面板 |
| **提供商状态** | 用通俗语言显示 feed 健康 — 备用源成功时为绿色 |
| **演示模式** | 离线样例看板，用于探索界面 |

## 项目结构

pnpm + Turborepo 单体仓库：

```text
apps/
  web/                React + Vite 仪表盘
services/
  odds-engine/        轮询提供商、标准化赔率、检测变动并广播快照
  ai-analyst/         将价格变动转为通俗洞察
packages/
  types/              各层共享的领域类型
.github/workflows/    CI、发布、Pages 与健康检查
```

每个提供商都藏在适配器后面，返回统一的 `SportEvent` 结构。前端从不接触原始 payload。

## 截图

在线应用：[dacameragirl.github.io/Bettin2Win](https://dacameragirl.github.io/Bettin2Win/)

![篮球赔率看板](docs/screenshots/dashboard.png)

![提供商状态面板](docs/screenshots/provider-status.png)

![市场走势侧栏](docs/screenshots/market-movement.png)

![新手指南](docs/screenshots/beginner-guide.png)

重新生成：`pnpm screenshots`（需 Playwright 的 Chromium）。

## 快速开始

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

- Web：http://localhost:5173
- 赔率引擎：http://localhost:4000
- 健康检查：http://localhost:4000/health

## 提供商状态

| 运动 | 提供商链 | 认证 | 当前行为 |
|---|---|---|---|
| 美式足球 | The Odds API → Sportsbook API → **ESPN NFL** | `ODDS_API_KEY`, `RAPIDAPI_KEY` | The Odds API 配额失败时用免费 ESPN 独赢线 |
| 棒球 | The Odds API → Tank01 MLB → **ESPN MLB** → MLB Stats | `ODDS_API_KEY`, `RAPIDAPI_KEY` | ESPN + MLB Stats 在无付费密钥时保持看板可用 |
| 篮球 | The Odds API → Sportsbook API → **ESPN NBA** | `ODDS_API_KEY`, `RAPIDAPI_KEY` | WNBA/NBA/大学比分 + ESPN DraftKings 盘口 |
| 冰球 | The Odds API → Sportsbook API → **ESPN NHL** → NHL scoreboard | `ODDS_API_KEY`, `RAPIDAPI_KEY` | 官方 NHL 比分板与 ESPN 价格合并 |
| 足球 | BetMiner → football-prediction-api → **ESPN soccer** | `RAPIDAPI_KEY` | 预测 + 免费 ESPN 三路独赢 |
| 高尔夫 | **ESPN golf** | 无 | ESPN 排行榜与赛事卡片 |
| NASCAR | **ESPN NASCAR** → TheRundown | `THERUNDOWN_API_KEY`（可选） | ESPN 赛况；有密钥时用 TheRundown |
| 赛马 | Horse Racing (RapidAPI) → The Racing API | `RAPIDAPI_KEY`, `RACING_API_USERNAME`, `RACING_API_PASSWORD` | 赛程 + 成绩；为免费 RapidAPI 层级做预算 |
| 赛狗 | Greyhound Racing UK → **GBGB RSS** → BetsAPI | `RAPIDAPI_KEY`, `BETSAPI_KEY` | 英国赛事免费 GBGB RSS 备用 |

## 密钥

密钥仅放在 `.env` 中（已 git-ignore）。

- The Odds API：`ODDS_API_KEY`
- RapidAPI：`RAPIDAPI_KEY`
- TheRundown：`THERUNDOWN_API_KEY`
- The Racing API：`RACING_API_USERNAME`, `RACING_API_PASSWORD`
- BetsAPI：`BETSAPI_KEY`

若密钥曾出现在聊天或截图中，请轮换。

## 脚本

| 命令 | 作用 |
|---|---|
| `pnpm dev` | 以 watch 模式运行所有应用/服务 |
| `pnpm build` | 构建整个单体仓库 |
| `pnpm typecheck` | 类型检查 |
| `pnpm test` | 单元测试 |
| `pnpm screenshots` | 用 Playwright 截取 README 截图 |

## 贡献者

- Angela — 产品方向、提供商配置、测试
- Claude — 早期实现与 GitHub 工作流
- Dex (Codex) — 提供商回退、仪表盘 UI
- Grok — 天气影响、对阵分组、看板筛选、README 与 i18n

## 法律说明

这是分析/媒体应用，不是博彩公司。各提供商条款因计划与用途而异；再分发数据或用于
商业博彩流程前请查阅其规则。