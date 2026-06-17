/**
 * Shared domain types for Bettin2Win.
 *
 * These describe the *normalized* shape that every sport adapter must produce,
 * regardless of the upstream provider's raw format. The frontend only ever
 * speaks this vocabulary.
 */

export type SportKey =
  | "football"
  | "baseball"
  | "soccer"
  | "nascar"
  | "horse-racing"
  | "greyhound";

export type DataMode = "live" | "mock";

export type OddsFormat = "decimal" | "american" | "fractional";

export interface SportConfig {
  key: SportKey;
  label: string;
  /** Provider key responsible for this sport's data. */
  provider: string;
  /** How often the poller refreshes this sport, in milliseconds. */
  pollIntervalMs: number;
}

export interface OddsLine {
  bookmaker: string;
  runnerId: string;
  /** Always stored as decimal odds internally; UI converts for display. */
  price: number;
  /** 1 / price, precomputed for convenience. */
  impliedProbability: number;
  lastUpdate: string; // ISO 8601
}

export interface Runner {
  id: string;
  name: string;
  /** Trap number (greyhound), car number (NASCAR), or saddle cloth (horse). */
  number?: number;
  odds: OddsLine[];
  /** Best (shortest) decimal price across all books, precomputed. */
  bestPrice?: number;
}

export type EventStatus = "upcoming" | "live" | "finished";

/**
 * A model's predicted outcome for a match. Present on prediction-sourced
 * sports (e.g. soccer via football-prediction-api); absent for plain odds feeds.
 */
export interface MatchPrediction {
  /** Runner the model favors — a team name or "Draw". */
  pick: string;
  /** 1X2-style code where applicable: "1" home, "X" draw, "2" away. */
  pickCode?: string;
  /** Human label, e.g. "Home win", "Draw", "Away win". */
  label: string;
  /** Decimal odds for the predicted outcome, when the plan exposes them. */
  odds?: number;
  /** How the pick fared once the match is decided. */
  status: "won" | "lost" | "pending";
  /** Final/current score from the provider, e.g. "0 - 3". */
  result?: string;
}

export interface SportEvent {
  id: string;
  sport: SportKey;
  /** e.g. "Lakers @ Celtics" or "Race 4 - Hove 19:48". */
  name: string;
  startTime: string; // ISO 8601
  venue?: string;
  status: EventStatus;
  runners: Runner[];
  /** Model pick, for prediction-sourced sports. */
  prediction?: MatchPrediction;
  /** Provider key the data came from. */
  source: string;
}

export type MovementDirection = "shortening" | "drifting";

export interface OddsMovement {
  eventId: string;
  sport: SportKey;
  runnerId: string;
  runnerName: string;
  bookmaker: string;
  from: number;
  to: number;
  changedAt: string; // ISO 8601
  direction: MovementDirection;
}

export interface AIInsight {
  eventId: string;
  runnerId?: string;
  persona: string;
  text: string;
  generatedAt: string; // ISO 8601
}

export interface ProviderHealth {
  provider: string;
  sport: SportKey;
  ok: boolean;
  mode: DataMode;
  lastChecked: string; // ISO 8601
  message?: string;
}

/** Messages pushed from the odds-engine to the browser over WebSocket. */
export type WebSocketMessage =
  | { type: "snapshot"; sport: SportKey; events: SportEvent[] }
  | { type: "odds_update"; event: SportEvent }
  | { type: "movement"; movement: OddsMovement }
  | { type: "insight"; insight: AIInsight }
  | { type: "health"; providers: ProviderHealth[] };

/** Convert decimal odds to an implied probability (0..1). */
export function impliedProbability(decimalOdds: number): number {
  if (decimalOdds <= 0) return 0;
  return 1 / decimalOdds;
}

/** Format decimal odds into another notation for display. */
export function formatOdds(decimalOdds: number, format: OddsFormat): string {
  switch (format) {
    case "decimal":
      return decimalOdds.toFixed(2);
    case "american": {
      if (decimalOdds >= 2) return `+${Math.round((decimalOdds - 1) * 100)}`;
      return `${Math.round(-100 / (decimalOdds - 1))}`;
    }
    case "fractional": {
      const numerator = Math.round((decimalOdds - 1) * 100);
      const denominator = 100;
      const divisor = gcd(numerator, denominator);
      return `${numerator / divisor}/${denominator / divisor}`;
    }
  }
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
