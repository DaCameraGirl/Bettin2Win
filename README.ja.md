<p align="center">
  <img src="docs/assets/readme-hero.svg" alt="Bettin2Win — 初心者向けオッズガイド" width="100%"/>
</p>

# Bettin2Win

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇺🇸_English-131a26?style=for-the-badge" alt="English"/></a>
  <a href="README.es.md"><img src="https://img.shields.io/badge/🇪🇸_Español-131a26?style=for-the-badge" alt="Español"/></a>
  <a href="README.fr.md"><img src="https://img.shields.io/badge/🇫🇷_Français-131a26?style=for-the-badge" alt="Français"/></a>
  <a href="README.de.md"><img src="https://img.shields.io/badge/🇩🇪_Deutsch-131a26?style=for-the-badge" alt="Deutsch"/></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/🇧🇷_Português-131a26?style=for-the-badge" alt="Português"/></a>
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/🇨🇳_中文-131a26?style=for-the-badge" alt="中文"/></a>
  <a href="README.ja.md"><img src="https://img.shields.io/badge/🇯🇵_日本語-4ade80?style=for-the-badge" alt="日本語"/></a>
  <a href="README.ko.md"><img src="https://img.shields.io/badge/🇰🇷_한국어-131a26?style=for-the-badge" alt="한국어"/></a>
  <a href="README.it.md"><img src="https://img.shields.io/badge/🇮🇹_Italiano-131a26?style=for-the-badge" alt="Italiano"/></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/🇸🇦_العربية-131a26?style=for-the-badge" alt="العربية"/></a>
</p>

<p align="center">
  <img src="docs/assets/slot-machine.svg" alt="Bettin2Win アニメスロット — ラインを学ぶ、カジノではない" width="420"/>
</p>

<p align="center">
  <a href="https://dacameragirl.github.io/Bettin2Win/"><img src="https://img.shields.io/badge/🌐_ライブデモ-4ade80?style=for-the-badge" alt="ライブデモ"/></a>
  <a href="https://bettin2win.onrender.com/health"><img src="https://img.shields.io/badge/⚙️_エンジン状態-131a26?style=for-the-badge" alt="エンジン状態"/></a>
</p>

**初心者向けオッズガイド — スポーツブックではありません。** ライブラインを比較し、
オッズをわかりやすい言葉に翻訳し、想定払戻を計算し、他で賭ける前に各ベットの意味を
学べます。アメリカンフットボール、野球、バスケ、ホッケー、サッカー、ゴルフ、NASCAR、
競馬、グレイハウンド。

賭けの受付はしません。情報提供のみ。責任あるギャンブルを。

> **ステータス：** ライブプロバイダー接続は有効です。アプリはまず実フィードを試し、
> そのスポーツの設定済みプロバイダーがすべて利用不可・クォータ切れ・認証なしの場合のみ
> フォールバックします。[プロバイダー状態](#プロバイダー状態)を参照。

## 主な機能

| 機能 | 内容 |
|---|---|
| **このベットを説明** | 各カードの紫ボタン — 払戻、暗黙確率、勝利条件 |
| **Bettin2Winの仕組み** | 初訪問者向け5ステップガイド |
| **天候インパクト** | 屋外試合バッジ（風・雨・暑さ・コース）— 文脈のみ、ベット助言ではない |
| **バスケ対戦カード** | 1試合1カード、マネーライン / スプレッド / トータル / 動き タブ |
| **ボードフィルター** | 初心者向けのみ · 価格あり · ライブ · すべて表示 |
| **マーケットティッカー** | Yahoo Finance の指数・メガキャップ相場 |
| **なぜ全員が金持ちにならない？** | 本命/穴/マージン説明（初心者ガイド＋説明パネル） |
| **プロバイダー状態** | フィード健全性を平易に表示 — バックアップ成功時は緑 |
| **デモモード** | UI探索用のオフラインサンプルボード |

## リポジトリ構成

pnpm + Turborepo モノレポ：

```text
apps/
  web/                React + Vite ダッシュボード
services/
  odds-engine/        プロバイダー取得、オッズ正規化、変動検知、スナップショット配信
  ai-analyst/         価格変動を平易なインサイトに変換
packages/
  types/              全レイヤー共通のドメイン型
.github/workflows/    CI、リリース、Pages、ヘルスチェック
```

各プロバイダーはアダプター越しに同じ `SportEvent` 形で返します。フロントは生payloadを見ません。

## スクリーンショット

ライブアプリ：[dacameragirl.github.io/Bettin2Win](https://dacameragirl.github.io/Bettin2Win/)

![バスケオッズボード](docs/screenshots/dashboard.png)

![プロバイダー状態パネル](docs/screenshots/provider-status.png)

![マーケット動きサイドバー](docs/screenshots/market-movement.png)

![初心者ガイド](docs/screenshots/beginner-guide.png)

再生成：`pnpm screenshots`（Playwright の Chromium が必要）。

## クイックスタート

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

- Web：http://localhost:5173
- オッズエンジン：http://localhost:4000
- ヘルス：http://localhost:4000/health

## プロバイダー状態

| スポーツ | プロバイダーチェーン | 認証 | 動作 |
|---|---|---|---|
| アメフト | The Odds API → Sportsbook API → **ESPN NFL** | `ODDS_API_KEY`, `RAPIDAPI_KEY` | The Odds API クォータ失敗時は無料 ESPN マネーライン |
| 野球 | The Odds API → Tank01 MLB → **ESPN MLB** → MLB Stats | `ODDS_API_KEY`, `RAPIDAPI_KEY` | ESPN + MLB Stats で有料キーなしでもボード維持 |
| バスケ | The Odds API → Sportsbook API → **ESPN NBA** | `ODDS_API_KEY`, `RAPIDAPI_KEY` | WNBA/NBA/大学スコア + ESPN DraftKings ライン |
| ホッケー | The Odds API → Sportsbook API → **ESPN NHL** → NHL scoreboard | `ODDS_API_KEY`, `RAPIDAPI_KEY` | 公式 NHL スコアボードと ESPN 価格を統合 |
| サッカー | BetMiner → football-prediction-api → **ESPN soccer** | `RAPIDAPI_KEY` | 予測 + 無料 ESPN 3-way マネーライン |
| ゴルフ | **ESPN golf** | なし | ESPN リーダーボードと大会カード |
| NASCAR | **ESPN NASCAR** → TheRundown | `THERUNDOWN_API_KEY`（任意） | ESPN レース順位；キーがあれば TheRundown |
| 競馬 | Horse Racing (RapidAPI) → The Racing API | `RAPIDAPI_KEY`, `RACING_API_USERNAME`, `RACING_API_PASSWORD` | 出走表 + 結果；無料 RapidAPI 枠向け |
| グレイハウンド | Greyhound Racing UK → **GBGB RSS** → BetsAPI | `RAPIDAPI_KEY`, `BETSAPI_KEY` | 英国向け無料 GBGB RSS フォールバック |

## キー

キーは `.env` のみ（git-ignore）。

- The Odds API：`ODDS_API_KEY`
- RapidAPI：`RAPIDAPI_KEY`
- TheRundown：`THERUNDOWN_API_KEY`
- The Racing API：`RACING_API_USERNAME`, `RACING_API_PASSWORD`
- BetsAPI：`BETSAPI_KEY`

チャットやスクショに貼ったキーはローテーションしてください。

## スクリプト

| コマンド | 内容 |
|---|---|
| `pnpm dev` | watch モードで全アプリ/サービス実行 |
| `pnpm build` | モノレポ全体をビルド |
| `pnpm typecheck` | 型チェック |
| `pnpm test` | ユニットテスト |
| `pnpm screenshots` | README 用スクリーンショット取得 |

## コントリビューター

- Angela — プロダクト、プロバイダー、テスト
- Claude — 初期実装と GitHub ワークフロー
- Dex (Codex) — プロバイダーフォールバック、ダッシュボード UI
- Grok — 天候インパクト、対戦グループ化、フィルター、README と i18n

## 法的注意

分析/メディアアプリであり、ブックメーカーではありません。プロバイダー規約はプランと
用途により異なります。再配布や商用ベッティング前に各規約を確認してください。