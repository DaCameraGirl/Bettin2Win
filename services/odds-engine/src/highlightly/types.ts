/** Sports we currently support standings enrichment for. */
export type EnrichSport = "nfl" | "mlb" | "nba" | "nhl";

export interface TeamStanding {
  teamId: number;
  name: string;
  abbreviation?: string;
  logo?: string;
  /** Conference / league / division grouping name. */
  group: string;
  wins?: number;
  losses?: number;
  /** Every stat the vendor returned, label -> value (and abbreviation -> value). */
  stats: Record<string, string>;
}

/** How each sport's standings endpoint must be addressed on Highlightly.
 * The vendor is inconsistent: NFL/MLB use leagueType+year, NBA uses leagueId+season.
 */
export interface StandingsSpec {
  sportPath: string;
  query: (season: number) => Record<string, string>;
}

export const HIGHLIGHTLY_HOST = "sport-highlights-api.p.rapidapi.com";

export const STANDINGS: Record<EnrichSport, StandingsSpec> = {
  nfl: {
    sportPath: "american-football",
    query: (year) => ({ leagueType: "NFL", year: String(year) }),
  },
  mlb: {
    sportPath: "baseball",
    query: (year) => ({ leagueType: "MLB", year: String(year) }),
  },
  nba: {
    sportPath: "basketball",
    query: (season) => ({ leagueId: "10996", season: String(season) }),
  },
  nhl: {
    sportPath: "hockey",
    query: (season) => ({ leagueId: "49291", season: String(season) }),
  },
};

export function isEnrichSport(value: string): value is EnrichSport {
  return value === "nfl" || value === "mlb" || value === "nba" || value === "nhl";
}
