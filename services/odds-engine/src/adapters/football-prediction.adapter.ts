import type { MatchPrediction, OddsLine, Runner, SportEvent } from "@bettin2win/types";
import { env } from "../config.js";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
import { generateMockEvents } from "./mock.js";

/**
 * Soccer predictions from RapidAPI's football-prediction-api. Unlike the odds
 * feeds, this provider returns a *model's pick* (1 = home / X = draw / 2 = away)
 * plus 1X2 odds and the eventual result. The free plan only exposes matches
 * within ~12h, so we sweep a handful of federations for the current day.
 */
const FEDERATIONS = ["UEFA", "CONMEBOL", "CONCACAF", "AFC"];
const HOST = "football-prediction-api.p.rapidapi.com";

/** Human labels for the provider's 1X2 + double-chance prediction codes. */
const PREDICTION_LABELS: Record<string, string> = {
  "1": "Home win",
  X: "Draw",
  "2": "Away win",
  "1X": "Home or Draw",
  "12": "Home or Away",
  X2: "Draw or Away",
};

interface RawMatch {
  id: number | string;
  home_team: string;
  away_team: string;
  start_date: string;
  prediction: string; // "1" | "X" | "2" (or other market codes)
  status?: string; // "won" | "lost" | "pending" | ...
  is_expired?: boolean;
  result?: string; // "0 - 3"
  competition_name?: string;
  competition_cluster?: string;
  last_update_at?: string;
  odds?: Record<string, number | null>;
}

export class FootballPredictionAdapter implements SportAdapter {
  readonly sport = "soccer" as const;
  readonly provider = "football-prediction-api";

  hasCredentials(): boolean {
    return env.rapidApiKey.length > 0;
  }

  async fetchEvents(): Promise<AdapterResult> {
    if (!this.hasCredentials()) {
      return { mode: "mock", events: generateMockEvents("soccer"), message: "no RAPIDAPI_KEY" };
    }

    const date = londonDate();
    const events: SportEvent[] = [];
    let reached = false;

    for (const federation of FEDERATIONS) {
      const url =
        `https://${HOST}/api/v2/predictions` +
        `?market=classic&iso_date=${date}&federation=${federation}`;
      try {
        const res = await fetch(url, {
          headers: { "x-rapidapi-host": HOST, "x-rapidapi-key": env.rapidApiKey },
        });
        if (res.status === 429) continue; // rate-limited; try the next sweep
        if (!res.ok) continue;
        const json = (await res.json()) as { data?: RawMatch[] };
        reached = true;
        for (const match of json.data ?? []) events.push(this.normalize(match));
      } catch {
        /* skip this federation; a partial board still beats none */
      }
      await sleep(250); // be gentle with the free tier
    }

    if (!reached) {
      return { mode: "mock", events: generateMockEvents("soccer"), message: "provider unreachable" };
    }
    return {
      mode: "live",
      events,
      message: `${events.length} matches · ${FEDERATIONS.length} federations`,
    };
  }

  private normalize(raw: RawMatch): SportEvent {
    const odds = raw.odds ?? {};
    const mkRunner = (name: string, code: string): Runner => {
      const price = Number(odds[code]);
      const id = `soccer:${raw.id}:${code}`;
      const lines: OddsLine[] =
        price > 1
          ? [
              {
                bookmaker: "Model",
                runnerId: id,
                price,
                impliedProbability: 0,
                lastUpdate: raw.last_update_at ?? new Date().toISOString(),
              },
            ]
          : [];
      return { id, name, odds: lines };
    };

    const runners = [
      mkRunner(raw.home_team, "1"),
      mkRunner("Draw", "X"),
      mkRunner(raw.away_team, "2"),
    ];

    // "classic" market returns straight 1/X/2 *and* double-chance codes.
    const code = raw.prediction;
    const label = PREDICTION_LABELS[code] ?? code;
    const pick =
      code === "1"
        ? raw.home_team
        : code === "2"
          ? raw.away_team
          : code === "X"
            ? "Draw"
            : label; // double chance spans two outcomes — no single runner
    const pickOdds = Number(odds[code]);
    const predStatus: MatchPrediction["status"] =
      raw.status === "won" ? "won" : raw.status === "lost" ? "lost" : "pending";

    const startMs = Date.parse(raw.start_date);
    const status: SportEvent["status"] = raw.is_expired
      ? "finished"
      : Number.isFinite(startMs) && startMs < Date.now()
        ? "live"
        : "upcoming";

    const competition = [raw.competition_cluster, raw.competition_name]
      .filter(Boolean)
      .join(" ");

    const event: SportEvent = {
      id: `soccer:${raw.id}`,
      sport: "soccer",
      name: `${raw.away_team} @ ${raw.home_team}`,
      startTime: raw.start_date,
      venue: competition || undefined,
      status,
      source: this.provider,
      runners,
      prediction: {
        pick,
        pickCode: code,
        label,
        odds: pickOdds > 1 ? pickOdds : undefined,
        status: predStatus,
        // Provider reports the score home-away; the rest of the app shows
        // away-home (to match the "Away @ Home" name), so flip it here.
        result: flipScore(raw.result),
      },
    };
    return decorateRunners(event);
  }
}

/** Flip a "home - away" score into "away - home"; returns undefined if absent. */
function flipScore(result?: string): string | undefined {
  if (!result) return undefined;
  const [home, away] = result.split("-").map((p) => p.trim());
  if (!home || !away) return result;
  return `${away} - ${home}`;
}

/** Today's date in the provider's timezone (Europe/London), as YYYY-MM-DD. */
function londonDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
