import type { SportEvent } from "@bettin2win/types";
import type { GameScore } from "./useScores";

/** Don't paint yesterday's final onto tomorrow's rematch with the same teams. */
export function shouldApplyScoreToEvent(event: SportEvent, score: GameScore): boolean {
  if (score.matchName !== event.name) return false;

  const startMs = new Date(event.startTime).getTime();
  if (Number.isNaN(startMs)) return true;

  const hoursUntilStart = (startMs - Date.now()) / 3_600_000;

  if (score.state === "finished" && hoursUntilStart > 3) return false;
  if (score.state === "live" && hoursUntilStart > 6) return false;

  return true;
}

export function eventStartDateKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA");
}

export function scoreLookupKeys(event: SportEvent): string[] {
  const dateKey = eventStartDateKey(event.startTime);
  return dateKey ? [`${event.name}|${dateKey}`, event.name] : [event.name];
}

export function resolveGameScore(
  event: SportEvent,
  scores: Map<string, GameScore>,
): GameScore | undefined {
  for (const key of scoreLookupKeys(event)) {
    const score = scores.get(key);
    if (score && shouldApplyScoreToEvent(event, score)) return score;
  }
  return undefined;
}

/** When multiple games share a matchup name on one day, keep the most relevant row. */
export function pickPreferredScore(current: GameScore, next: GameScore): GameScore {
  const rank = (score: GameScore) => {
    if (score.state === "live") return 3;
    if (score.state === "finished") return 2;
    return 1;
  };
  return rank(next) > rank(current) ? next : current;
}

export function indexScoresByMatchName(scores: GameScore[]): Map<string, GameScore> {
  const map = new Map<string, GameScore>();
  for (const score of scores) {
    const existing = map.get(score.matchName);
    map.set(score.matchName, existing ? pickPreferredScore(existing, score) : score);
  }
  return map;
}

/** Index by both dated and plain matchup keys so rematches don't collide. */
export function indexScoresByDateAndMatchName(scores: GameScore[]): Map<string, GameScore> {
  const map = indexScoresByMatchName(scores);
  for (const score of scores) {
    const dateKey = score.gameDate ?? "";
    if (!dateKey) continue;
    const datedKey = `${score.matchName}|${dateKey}`;
    const existing = map.get(datedKey);
    map.set(datedKey, existing ? pickPreferredScore(existing, score) : score);
  }
  return map;
}