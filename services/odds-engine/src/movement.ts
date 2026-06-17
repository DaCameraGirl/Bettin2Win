import type { OddsMovement, SportEvent } from "@bettin2win/types";

/**
 * Compares a previous and current snapshot of the same event and returns the
 * meaningful price movements (best price per runner). "shortening" means the
 * price got smaller (more likely); "drifting" means it got longer.
 */
export function detectMovements(
  previous: SportEvent | undefined,
  current: SportEvent,
  threshold = 0.05,
): OddsMovement[] {
  if (!previous) return [];

  const prevBest = new Map<string, number>();
  for (const runner of previous.runners) {
    if (runner.bestPrice !== undefined) prevBest.set(runner.id, runner.bestPrice);
  }

  const movements: OddsMovement[] = [];
  for (const runner of current.runners) {
    const from = prevBest.get(runner.id);
    const to = runner.bestPrice;
    if (from === undefined || to === undefined) continue;
    if (Math.abs(to - from) < threshold) continue;

    movements.push({
      eventId: current.id,
      runnerId: runner.id,
      runnerName: runner.name,
      bookmaker: "best",
      from,
      to,
      changedAt: new Date().toISOString(),
      direction: to < from ? "shortening" : "drifting",
    });
  }
  return movements;
}
