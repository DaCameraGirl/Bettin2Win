import type { Runner, SportEvent, SportKey } from "@bettin2win/types";
import { env } from "../config.js";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
import { generateMockEvents } from "./mock.js";

type HighlightlySport = "football" | "baseball" | "basketball" | "hockey";
type Obj = Record<string, unknown>;

const HOST = "sport-highlights-api.p.rapidapi.com";
const SPORT_PATH: Record<HighlightlySport, string> = {
  football: "american-football",
  baseball: "baseball",
  basketball: "basketball",
  hockey: "hockey",
};

/**
 * Real match fallback from Highlightly. It does not expose betting odds on the
 * current plan, but it keeps cards real: actual teams, logos, dates, scores,
 * inning/clock/status, and league context instead of fake demo matchups.
 */
export class HighlightlyMatchesAdapter implements SportAdapter {
  readonly provider = "highlightly-matches";

  constructor(readonly sport: HighlightlySport) {}

  hasCredentials(): boolean {
    return env.highlightlyKey.length > 0;
  }

  async fetchEvents(): Promise<AdapterResult> {
    if (!this.hasCredentials()) {
      return { mode: "mock", events: generateMockEvents(this.sport), message: "no HIGHLIGHTLY_API_KEY" };
    }

    const date = today();
    const path = SPORT_PATH[this.sport];
    const url = `https://${HOST}/${path}/matches?date=${date}&limit=50`;

    try {
      const res = await fetch(url, {
        headers: { "x-rapidapi-host": HOST, "x-rapidapi-key": env.highlightlyKey },
      });
      if (!res.ok) {
        return {
          mode: "mock",
          events: generateMockEvents(this.sport),
          message: `provider ${res.status}`,
        };
      }

      const events = rows(await res.json())
        .map((row) => normalizeHighlightlyMatch(this.sport, row))
        .filter((event): event is SportEvent => event !== null);

      return {
        mode: "live",
        events,
        message: `${events.length} real ${this.sport} match${events.length === 1 ? "" : "es"} (odds unavailable)`,
      };
    } catch (err) {
      return {
        mode: "mock",
        events: generateMockEvents(this.sport),
        message: err instanceof Error ? err.message : "fetch failed",
      };
    }
  }
}

export function normalizeHighlightlyMatch(sport: HighlightlySport, raw: unknown): SportEvent | null {
  const row = object(raw);
  if (!row) return null;

  const id = str(field(row, "id"));
  const awayTeam = object(field(row, "awayTeam"));
  const homeTeam = object(field(row, "homeTeam"));
  const away = teamName(awayTeam);
  const home = teamName(homeTeam);
  const startTime = str(field(row, "date"));
  if (!id || !away || !home || !startTime) return null;

  const state = object(field(row, "state"));
  const status = mapStatus(str(field(state, "description") ?? field(state, "report")), startTime);
  const score = normalizeScore(object(field(state, "score")));
  const league = leagueName(row);
  const clock = clockText(sport, state);

  const event: SportEvent = {
    id: `${sport}:${id}`,
    sport,
    name: `${away} @ ${home}`,
    startTime,
    venue: league,
    status,
    clock,
    score,
    source: "highlightly-matches",
    runners: [runner(`${sport}:${id}:away`, away), runner(`${sport}:${id}:home`, home)],
    awayLogo: str(field(awayTeam, "logo")) || undefined,
    homeLogo: str(field(homeTeam, "logo")) || undefined,
  };

  return decorateRunners(event);
}

function runner(id: string, name: string): Runner {
  return { id, name, odds: [] };
}

function normalizeScore(score: Obj | undefined): string | undefined {
  const current = str(field(score, "current")).trim();
  if (!current || current === "-") return undefined;
  return current;
}

function mapStatus(description: string, startTime: string): SportEvent["status"] {
  const value = description.toLowerCase();
  if (value.includes("final") || value.includes("finished") || value.includes("complete")) {
    return "finished";
  }
  if (
    value.includes("progress") ||
    value.includes("live") ||
    value.includes("period") ||
    value.includes("quarter") ||
    value.includes("half") ||
    value.includes("inning")
  ) {
    return "live";
  }

  const startMs = Date.parse(startTime);
  return Number.isFinite(startMs) && startMs < Date.now() ? "live" : "upcoming";
}

function clockText(sport: HighlightlySport, state: Obj | undefined): string | undefined {
  const report = str(field(state, "report")).trim();
  if (report) return report;
  const clock = str(field(state, "clock")).trim();
  if (clock) return clock;
  if (sport === "baseball") return str(field(state, "description")).trim() || undefined;
  return undefined;
}

function leagueName(row: Obj): string | undefined {
  const league = field(row, "league");
  if (typeof league === "string") return league;
  const leagueObj = object(league);
  const leagueNameValue = str(field(leagueObj, "name"));
  const country = object(field(row, "country"));
  const countryName = str(field(country, "name"));
  return [countryName, leagueNameValue].filter(Boolean).join(" - ") || undefined;
}

function teamName(team: Obj | undefined): string {
  return str(field(team, "displayName") ?? field(team, "name")).trim();
}

function rows(body: unknown): unknown[] {
  const bodyObj = object(body);
  const data = field(bodyObj, "data");
  return Array.isArray(data) ? data : Array.isArray(body) ? body : [];
}

function object(value: unknown): Obj | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Obj) : undefined;
}

function field(obj: unknown, key: string): unknown {
  if (obj && typeof obj === "object" && key in obj) return (obj as Obj)[key];
  return undefined;
}

function str(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function today(): string {
  return new Date().toLocaleDateString("en-CA");
}
