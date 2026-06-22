import type { Runner, SportKey } from "@bettin2win/types";

const NON_RUNNER = /non[- ]?runner/i;

/** Trap / saddle-cloth / car number, with name parsing as a fallback. */
export function resolveRunnerNumber(runner: Runner, fallbackIndex = 0): number {
  if (runner.number != null && runner.number > 0) return runner.number;
  const trap = /^Trap\s*(\d+)/i.exec(runner.name);
  if (trap?.[1]) return Number.parseInt(trap[1], 10);
  const cloth = /^(\d+)\.\s/.exec(runner.name);
  if (cloth?.[1]) return Number.parseInt(cloth[1], 10);
  return fallbackIndex + 1;
}

function activeRunners(runners: Runner[]): Runner[] {
  return runners.filter((runner) => runner.name && !NON_RUNNER.test(runner.name));
}

/** Program order — trap 1 above trap 2, cloth 3 above cloth 7, etc. */
export function programOrder(runners: Runner[]): Runner[] {
  return activeRunners(runners)
    .slice()
    .sort((a, b) => resolveRunnerNumber(a, 0) - resolveRunnerNumber(b, 0));
}

/**
 * Running order for motorsport: leader first by finishing position, else
 * favourite price, else car number.
 */
export function runningOrder(runners: Runner[]): Runner[] {
  return activeRunners(runners)
    .slice()
    .sort((a, b) => {
      const posA = a.position ?? Number.POSITIVE_INFINITY;
      const posB = b.position ?? Number.POSITIVE_INFINITY;
      if (posA !== posB) return posA - posB;
      const pa = a.bestPrice ?? Number.POSITIVE_INFINITY;
      const pb = b.bestPrice ?? Number.POSITIVE_INFINITY;
      if (pa !== pb) return pa - pb;
      return resolveRunnerNumber(a, 0) - resolveRunnerNumber(b, 0);
    });
}

export function trackRunners(sport: SportKey, runners: Runner[]): Runner[] {
  if (sport === "horse-racing" || sport === "greyhound") {
    return programOrder(runners);
  }
  return runningOrder(runners).slice(0, 6);
}

export function raceLaneTiming(
  sport: SportKey,
  programNumber: number,
  live: boolean,
): { duration: string; delay: string } {
  const isThoroughbred = sport === "horse-racing" || sport === "greyhound";
  const base = isThoroughbred ? (live ? 7.5 : 11) : live ? 2.6 : 4.2;
  const step = isThoroughbred ? 0.7 : 0.35;
  const delayStep = isThoroughbred ? 1.1 : 0.5;
  const index = Math.max(0, programNumber - 1);
  return {
    duration: `${base + index * step}s`,
    delay: `${index * -delayStep}s`,
  };
}

export function raceCaption(
  sport: SportKey,
  shown: Runner[],
  total: number,
  ranked: boolean,
  resulted: boolean,
  emoji: string,
): string {
  const numbers = shown.map((runner, index) => resolveRunnerNumber(runner, index));
  const numberList = numbers.join(", ");
  const isProgramSport = sport === "horse-racing" || sport === "greyhound";

  if (resulted) {
    return `🏁 finishing order — ${emoji} ${numbers[0] ?? "?"} won`;
  }
  if (ranked && !isProgramSport) {
    return `running order — favourite (${emoji} ${numbers[0] ?? "?"}) leads`;
  }
  if (total > shown.length) {
    return `${shown.length} of ${total} on track · #${numberList}`;
  }
  return `${shown.length} on track · #${numberList}`;
}