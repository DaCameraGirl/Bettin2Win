import type { TeamStanding } from "./types.js";

/**
 * Tolerant normalizer for Highlightly standings.
 *
 * The vendor returns THREE different shapes depending on sport:
 *   NFL:  data[].team{...} + statistics[]{displayName, value}
 *   MLB:  data[].{id,logo,name} + stats[]{description, abbreviation, displayValue}
 *   NBA:  groups[].standings[].{team{...}, wins, loses}  (direct integer fields)
 *
 * This handles all three by probing alternative container keys, field names,
 * and both stats-array and direct-integer record styles.
 */
export function normalizeStandings(body: unknown): TeamStanding[] {
  // container: NFL/MLB use `data`, NBA uses `groups`
  const groups = asArray(getField(body, "data") ?? getField(body, "groups"));
  const out: TeamStanding[] = [];

  for (const group of groups) {
    const groupName =
      str(getField(group, "leagueName")) || str(getField(group, "name")) || "";
    // rows: NFL/MLB use `data`, NBA uses `standings`
    const rows = asArray(getField(group, "data") ?? getField(group, "standings"));

    for (const row of rows) {
      const teamObj = (getField(row, "team") as unknown) ?? row;
      const statsArr = asArray(getField(row, "statistics") ?? getField(row, "stats"));

      const stats: Record<string, string> = {};
      for (const s of statsArr) {
        const label = str(getField(s, "displayName")) || str(getField(s, "description"));
        const abbr = str(getField(s, "abbreviation"));
        const value = str(getField(s, "value") ?? getField(s, "displayValue"));
        if (label) stats[label] = value;
        if (abbr) stats[abbr] = value;
      }

      const id = Number(getField(teamObj, "id"));
      if (!Number.isFinite(id)) continue;

      // wins/losses: prefer direct integer fields (NBA), else stats labels
      const directWins = toInt(getField(row, "wins"));
      const directLosses = toInt(getField(row, "loses") ?? getField(row, "losses"));

      out.push({
        teamId: id,
        name:
          str(getField(teamObj, "displayName")) ||
          str(getField(teamObj, "name")) ||
          "Unknown",
        abbreviation: str(getField(teamObj, "abbreviation")) || undefined,
        logo: str(getField(teamObj, "logo")) || undefined,
        group: groupName,
        wins: directWins ?? pickInt(stats, ["Wins", "W"]),
        losses: directLosses ?? pickInt(stats, ["Losses", "L"]),
        stats,
      });
    }
  }
  return out;
}

function toInt(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function pickInt(stats: Record<string, string>, keys: string[]): number | undefined {
  for (const key of keys) {
    const raw = stats[key];
    if (raw === undefined) continue;
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function getField(obj: unknown, key: string): unknown {
  if (obj && typeof obj === "object" && key in obj) {
    return (obj as Record<string, unknown>)[key];
  }
  return undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}
