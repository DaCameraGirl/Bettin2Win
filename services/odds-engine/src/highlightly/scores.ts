/** Live game scores from Highlightly's /baseball/matches endpoint.
 *
 * The Basic plan has no odds, but it DOES expose live match state: current
 * score and a human-readable inning ("Bottom 2nd") via `state.report`. We match
 * these to odds events by the "Away @ Home" name, which is identical across
 * The Odds API and Highlightly.
 */

export type GameState = "scheduled" | "live" | "finished";

export interface GameScore {
  away: string;
  home: string;
  /** "Away @ Home" - the join key with odds events. */
  matchName: string;
  /** YYYY-MM-DD game day when available from the provider. */
  gameDate?: string;
  current: string; // e.g. "0 - 1"
  state: GameState;
  /** Human-readable detail, e.g. "Bottom 2nd" or "Final". */
  detail: string;
}

export function mapState(description: string): GameState {
  const d = description.toLowerCase();
  if (d.includes("progress") || d.includes("in play") || d.includes("live")) return "live";
  if (d.includes("final") || d.includes("finished") || d.includes("complete")) return "finished";
  return "scheduled";
}

export function normalizeBaseballScores(body: unknown): GameScore[] {
  const rows = Array.isArray(body)
    ? body
    : Array.isArray((body as { data?: unknown })?.data)
      ? ((body as { data: unknown[] }).data)
      : [];

  const out: GameScore[] = [];
  for (const raw of rows) {
    const m = raw as Record<string, any>;
    const away = String(m.awayTeam?.displayName ?? m.awayTeam?.name ?? "").trim();
    const home = String(m.homeTeam?.displayName ?? m.homeTeam?.name ?? "").trim();
    if (!away || !home) continue;

    const state = m.state ?? {};
    const description = String(state.description ?? "");
    const startTime = String(m.startTime ?? m.date ?? "").trim();
    const startMs = startTime ? Date.parse(startTime) : Number.NaN;
    const gameDate = Number.isFinite(startMs)
      ? new Date(startMs).toLocaleDateString("en-CA")
      : undefined;

    out.push({
      away,
      home,
      matchName: `${away} @ ${home}`,
      gameDate,
      current: String(state.score?.current ?? "").trim() || "-",
      state: mapState(description),
      detail: String(state.report ?? description ?? "").trim(),
    });
  }
  return out;
}
