import type { MatchPrediction, OddsLine, Runner, SportEvent } from "@bettin2win/types";
import { env } from "../config.js";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
import { generateMockEvents } from "./mock.js";

const HOST = "betminer.p.rapidapi.com";

type BetMinerOutcome = "home_win" | "draw" | "away_win";
type Obj = Record<string, unknown>;

const OUTCOMES: Record<
  BetMinerOutcome,
  { code: string; label: string; runner: "home" | "draw" | "away"; fields: string[] }
> = {
  home_win: { code: "1", label: "Home win", runner: "home", fields: ["home_win", "homeWin"] },
  draw: { code: "X", label: "Draw", runner: "draw", fields: ["draw"] },
  away_win: { code: "2", label: "Away win", runner: "away", fields: ["away_win", "awayWin"] },
};

/**
 * Soccer predictions from BetMiner. Its free RapidAPI tier returns a full day
 * of matches in one edge-analysis request with logos, probabilities, form, and
 * projected score.
 */
export class BetMinerAdapter implements SportAdapter {
  readonly sport = "soccer" as const;
  readonly provider = "betminer";

  hasCredentials(): boolean {
    return env.rapidApiKey.length > 0;
  }

  async fetchEvents(): Promise<AdapterResult> {
    if (!this.hasCredentials()) {
      return { mode: "mock", events: generateMockEvents("soccer"), message: "no RAPIDAPI_KEY" };
    }

    const date = providerDate();
    const url = `https://${HOST}/bm/v3/edge-analysis/${date}`;

    try {
      const res = await fetch(url, {
        headers: { "x-rapidapi-host": HOST, "x-rapidapi-key": env.rapidApiKey },
      });
      if (!res.ok) {
        return {
          mode: "mock",
          events: generateMockEvents("soccer"),
          message: `provider ${res.status}`,
        };
      }

      const json = (await res.json()) as unknown;
      const events = extractMatches(json)
        .map((match) => normalizeBetMinerMatch(match))
        .filter((event): event is SportEvent => event !== null);

      return { mode: "live", events, message: `${events.length} BetMiner matches` };
    } catch (err) {
      return {
        mode: "mock",
        events: generateMockEvents("soccer"),
        message: err instanceof Error ? err.message : "fetch failed",
      };
    }
  }
}

export function normalizeBetMinerMatch(
  raw: unknown,
  lineTimestamp = new Date().toISOString(),
): SportEvent | null {
  const row = asObject(raw);
  if (!row) return null;

  const id = str(field(row, "match_id") ?? field(row, "id"));
  const kickoff = str(field(row, "kickoff") ?? field(row, "start_time") ?? field(row, "date"));
  if (!id || !kickoff) return null;

  const homeTeam = asObject(field(row, "home_team") ?? field(row, "homeTeam"));
  const awayTeam = asObject(field(row, "away_team") ?? field(row, "awayTeam"));
  const homeName =
    str(field(homeTeam, "name") ?? field(row, "home_name") ?? field(row, "homeTeamName")) ||
    "Home";
  const awayName =
    str(field(awayTeam, "name") ?? field(row, "away_name") ?? field(row, "awayTeamName")) ||
    "Away";
  const homeLogo = str(field(homeTeam, "logo"));
  const awayLogo = str(field(awayTeam, "logo"));

  const score = asObject(field(row, "score"));
  const homeScore = toNumber(field(score, "home"));
  const awayScore = toNumber(field(score, "away"));
  const result = formatScore(awayScore, homeScore);

  const rawStatus = str(field(row, "status"));
  const minute = field(row, "minute");
  const status = mapStatus(rawStatus, minute, kickoff);
  const clock = status === "live" ? formatClock(rawStatus, minute) : undefined;

  const odds = asObject(field(row, "odds"));
  const probabilities = asObject(field(row, "probabilities"));
  const predictions = asObject(field(row, "predictions"));
  const predictedOutcome =
    normalizeOutcome(field(predictions, "result")) ?? strongestOutcome(probabilities);

  const runners = [
    makeRunner(id, homeName, OUTCOMES.home_win.code, outcomeValue(odds, "home_win"), lineTimestamp),
    makeRunner(id, "Draw", OUTCOMES.draw.code, outcomeValue(odds, "draw"), lineTimestamp),
    makeRunner(id, awayName, OUTCOMES.away_win.code, outcomeValue(odds, "away_win"), lineTimestamp),
  ];

  const competition = asObject(field(row, "competition"));
  const venue = [str(field(competition, "country")), str(field(competition, "name"))]
    .filter(Boolean)
    .join(" - ");
  const form = asObject(field(row, "form"));
  const homeForm = cleanForm(field(form, "home") ?? field(form, "home_form"));
  const awayForm = cleanForm(field(form, "away") ?? field(form, "away_form"));

  const event: SportEvent = {
    id: `soccer:${id}`,
    sport: "soccer",
    name: `${awayName} @ ${homeName}`,
    startTime: kickoff,
    venue: venue || undefined,
    status,
    clock,
    source: "betminer",
    runners,
    homeLogo: homeLogo || undefined,
    awayLogo: awayLogo || undefined,
    form: homeForm || awayForm ? { home: homeForm, away: awayForm } : undefined,
  };

  if (predictedOutcome) {
    const outcome = OUTCOMES[predictedOutcome];
    const pick =
      outcome.runner === "home" ? homeName : outcome.runner === "away" ? awayName : "Draw";
    const actualOutcome = outcomeFromScore(homeScore, awayScore);
    const pickStatus: MatchPrediction["status"] =
      status === "finished" && actualOutcome
        ? actualOutcome === predictedOutcome
          ? "won"
          : "lost"
        : "pending";
    const price = decimalOdds(outcomeValue(odds, predictedOutcome));

    event.prediction = {
      pick,
      pickCode: outcome.code,
      label: outcome.label,
      probability: normalizeProbability(outcomeValue(probabilities, predictedOutcome)),
      odds: price,
      status: pickStatus,
      result,
      correctScore: flipScore(
        str(field(predictions, "correct_score") ?? field(predictions, "correctScore")),
      ),
      extras: buildExtras(predictions),
    };
  }

  return decorateRunners(event);
}

function makeRunner(
  matchId: string,
  name: string,
  code: string,
  rawPrice: unknown,
  lineTimestamp: string,
): Runner {
  const runnerId = `soccer:${matchId}:${code}`;
  const price = decimalOdds(rawPrice);
  const odds: OddsLine[] = price
    ? [
        {
          bookmaker: "BetMiner",
          runnerId,
          price,
          impliedProbability: 0,
          lastUpdate: lineTimestamp,
        },
      ]
    : [];
  return { id: runnerId, name, odds };
}

function extractMatches(body: unknown): unknown[] {
  return asArray(
    field(body, "data") ??
      field(body, "matches") ??
      field(body, "edge_analysis") ??
      field(body, "edgeAnalysis") ??
      body,
  );
}

function outcomeValue(container: Obj | undefined, outcome: BetMinerOutcome): unknown {
  if (!container) return undefined;
  for (const key of OUTCOMES[outcome].fields) {
    const value = field(container, key);
    if (value !== undefined && value !== null && str(value) !== "") return value;
  }
  return undefined;
}

function strongestOutcome(probabilities: Obj | undefined): BetMinerOutcome | undefined {
  let best: { outcome: BetMinerOutcome; probability: number } | undefined;
  for (const outcome of Object.keys(OUTCOMES) as BetMinerOutcome[]) {
    const probability = normalizeProbability(outcomeValue(probabilities, outcome));
    if (probability === undefined) continue;
    if (!best || probability > best.probability) best = { outcome, probability };
  }
  return best?.outcome;
}

function normalizeOutcome(value: unknown): BetMinerOutcome | undefined {
  const normalized = str(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (normalized === "1" || normalized === "home" || normalized === "home_win") return "home_win";
  if (normalized === "x" || normalized === "draw") return "draw";
  if (normalized === "2" || normalized === "away" || normalized === "away_win") return "away_win";
  return undefined;
}

function outcomeFromScore(home?: number, away?: number): BetMinerOutcome | undefined {
  if (home === undefined || away === undefined) return undefined;
  if (home > away) return "home_win";
  if (away > home) return "away_win";
  return "draw";
}

function mapStatus(rawStatus: string, minute: unknown, kickoff: string): SportEvent["status"] {
  const status = rawStatus.trim().toUpperCase();
  if (["FT", "AET", "PEN", "FINISHED", "FULL_TIME"].includes(status)) return "finished";
  if (["NS", "TBD", "PST", "POSTP", "POSTPONED", "CANC", "CANCELLED"].includes(status)) {
    return "upcoming";
  }
  if (toNumber(minute) !== undefined || ["1H", "2H", "HT", "LIVE"].includes(status)) return "live";

  const startMs = Date.parse(kickoff);
  return Number.isFinite(startMs) && startMs < Date.now() ? "live" : "upcoming";
}

function formatClock(rawStatus: string, minute: unknown): string | undefined {
  const minuteNumber = toNumber(minute);
  if (minuteNumber !== undefined) return `${Math.round(minuteNumber)}'`;
  const status = rawStatus.trim().toUpperCase();
  if (status === "HT") return "HT";
  if (/^\d/.test(status)) return `${Number.parseInt(status, 10)}'`;
  return undefined;
}

function buildExtras(predictions: Obj | undefined): string[] | undefined {
  if (!predictions) return undefined;
  const extras: string[] = [];

  const btts = yesNo(field(predictions, "btts"));
  if (btts) extras.push(`BTTS ${btts}`);

  const total = overUnder(field(predictions, "over_25") ?? field(predictions, "over25"), "2.5");
  if (total) extras.push(total);

  const htft = str(field(predictions, "htft") ?? field(predictions, "ht_ft")).trim();
  if (htft) extras.push(`HT/FT ${htft.toUpperCase()}`);

  return extras.length > 0 ? extras : undefined;
}

function yesNo(value: unknown): string | undefined {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const normalized = str(value).trim().toLowerCase();
  if (!normalized) return undefined;
  if (["yes", "y", "true", "1"].includes(normalized)) return "Yes";
  if (["no", "n", "false", "0"].includes(normalized)) return "No";
  return title(normalized);
}

function overUnder(value: unknown, total: string): string | undefined {
  if (typeof value === "boolean") return value ? `Over ${total}` : `Under ${total}`;
  const normalized = str(value).trim().toLowerCase();
  if (!normalized) return undefined;
  if (["yes", "y", "true", "1", "over", `over_${total.replace(".", "")}`].includes(normalized)) {
    return `Over ${total}`;
  }
  if (["no", "n", "false", "0", "under"].includes(normalized)) return `Under ${total}`;
  if (normalized.includes("over")) return `Over ${total}`;
  if (normalized.includes("under")) return `Under ${total}`;
  return title(normalized);
}

function normalizeProbability(value: unknown): number | undefined {
  const n = toNumber(value);
  if (n === undefined) return undefined;
  if (n > 0 && n <= 1) return Math.round(n * 100);
  return Math.round(n);
}

function decimalOdds(value: unknown): number | undefined {
  const n = toNumber(value);
  return n !== undefined && n > 1 ? n : undefined;
}

function formatScore(away?: number, home?: number): string | undefined {
  if (away === undefined || home === undefined) return undefined;
  return `${away} - ${home}`;
}

function flipScore(value: string): string | undefined {
  if (!value) return undefined;
  const [home, away] = value.split(/\s*[-:]\s*/).map((part) => part.trim());
  if (!home || !away) return value;
  return `${away} - ${home}`;
}

function cleanForm(value: unknown): string | undefined {
  const cleaned = str(value).toUpperCase().replace(/[^WDL]/g, "").slice(0, 5);
  return cleaned || undefined;
}

function providerDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

function asObject(value: unknown): Obj | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Obj)
    : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function field(obj: unknown, key: string): unknown {
  if (obj && typeof obj === "object" && key in obj) {
    return (obj as Obj)[key];
  }
  return undefined;
}

function str(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim().replace("%", "");
  if (!cleaned || cleaned === "-") return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function title(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
