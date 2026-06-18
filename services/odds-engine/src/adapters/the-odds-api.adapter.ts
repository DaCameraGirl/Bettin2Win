import type { OddsLine, Runner, SportEvent, SportKey } from "@bettin2win/types";
import { env } from "../config.js";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
import { generateMockEvents } from "./mock.js";

/** Maps our sport keys to The Odds API's upstream sport keys. */
const SPORT_KEY_MAP: Partial<Record<SportKey, string>> = {
  football: "americanfootball_nfl",
  baseball: "baseball_mlb",
  basketball: "basketball_nba",
  hockey: "icehockey_nhl",
};

interface RawOutcome {
  name: string;
  price: number;
}
interface RawMarket {
  key: string;
  outcomes: RawOutcome[];
}
interface RawBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: RawMarket[];
}
interface RawEvent {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: RawBookmaker[];
}

export class TheOddsApiAdapter implements SportAdapter {
  readonly provider = "the-odds-api";

  constructor(readonly sport: SportKey) {}

  hasCredentials(): boolean {
    return env.oddsApiKey.length > 0 && SPORT_KEY_MAP[this.sport] !== undefined;
  }

  async fetchEvents(): Promise<AdapterResult> {
    if (!this.hasCredentials()) {
      return { mode: "mock", events: generateMockEvents(this.sport), message: "no ODDS_API_KEY" };
    }

    const sportKey = SPORT_KEY_MAP[this.sport]!;
    const url =
      `https://api.the-odds-api.com/v4/sports/${sportKey}/odds` +
      `?apiKey=${env.oddsApiKey}&regions=us&markets=h2h&oddsFormat=decimal`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        return {
          mode: "mock",
          events: generateMockEvents(this.sport),
          message: `provider ${res.status}`,
        };
      }
      const raw = (await res.json()) as RawEvent[];
      return { mode: "live", events: raw.map((e) => this.normalize(e)) };
    } catch (err) {
      return {
        mode: "mock",
        events: generateMockEvents(this.sport),
        message: err instanceof Error ? err.message : "fetch failed",
      };
    }
  }

  private normalize(raw: RawEvent): SportEvent {
    const runnersByName = new Map<string, Runner>();

    for (const book of raw.bookmakers) {
      const h2h = book.markets.find((m) => m.key === "h2h");
      if (!h2h) continue;
      for (const outcome of h2h.outcomes) {
        const runnerId = `${raw.id}:${slug(outcome.name)}`;
        let runner = runnersByName.get(outcome.name);
        if (!runner) {
          runner = { id: runnerId, name: outcome.name, odds: [] };
          runnersByName.set(outcome.name, runner);
        }
        const line: OddsLine = {
          bookmaker: book.title,
          runnerId,
          price: outcome.price,
          impliedProbability: 0,
          lastUpdate: book.last_update,
        };
        runner.odds.push(line);
      }
    }

    const event: SportEvent = {
      id: raw.id,
      sport: this.sport,
      name: `${raw.away_team} @ ${raw.home_team}`,
      startTime: raw.commence_time,
      status: new Date(raw.commence_time).getTime() < Date.now() ? "live" : "upcoming",
      source: this.provider,
      runners: [...runnersByName.values()],
    };
    return decorateRunners(event);
  }
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
