import type { SportEvent, SportKey } from "@bettin2win/types";
import { decorateRunners } from "./base.js";

const BOOKS = ["DraftKings", "FanDuel", "BetMGM", "Caesars"];

const NAME_POOLS: Record<SportKey, { events: string[]; runners: string[][] }> = {
  football: {
    events: ["Lakers FC @ Celtics SC", "Rovers @ United", "City @ Albion"],
    runners: [["Home", "Draw", "Away"]],
  },
  baseball: {
    events: ["Sox @ Yankees", "Cubs @ Dodgers", "Mets @ Braves"],
    runners: [["Home", "Away"]],
  },
  soccer: {
    events: ["Rangers @ Celtic", "Roma @ Lazio", "Boca @ River Plate"],
    runners: [["Home", "Draw", "Away"]],
  },
  nascar: {
    events: ["Daytona 400", "Talladega Night Race"],
    runners: [["#5 A. Rivera", "#11 J. Cole", "#24 M. Stone", "#48 T. Park"]],
  },
  "horse-racing": {
    events: ["Race 4 - Ascot 19:48", "Race 2 - Newmarket 14:10"],
    runners: [["Silver Comet", "Night Runner", "Brave Echo", "Lucky Sovereign"]],
  },
  greyhound: {
    events: ["Race 6 - Hove 19:48", "Race 3 - Romford 20:07"],
    runners: [["Trap 1 Swift Jet", "Trap 2 Bold Lass", "Trap 3 Grey Bullet", "Trap 4 Fast Eddie"]],
  },
};

/** Deterministic-ish pseudo random so mock odds drift between polls. */
function jitter(base: number): number {
  const delta = (Math.random() - 0.5) * 0.4;
  return Math.max(1.05, Number((base + delta).toFixed(2)));
}

export function generateMockEvents(sport: SportKey): SportEvent[] {
  const pool = NAME_POOLS[sport];
  const runnerNames = pool.runners[0] ?? ["Home", "Away"];
  const now = Date.now();

  return pool.events.map((eventName, index) => {
    const event: SportEvent = {
      id: `mock-${sport}-${index}`,
      sport,
      name: eventName,
      startTime: new Date(now + (index + 1) * 30 * 60_000).toISOString(),
      status: index === 0 ? "live" : "upcoming",
      source: "mock",
      runners: runnerNames.map((name, rIdx) => {
        const basePrice = 2 + rIdx * 1.5;
        return {
          id: `mock-${sport}-${index}-r${rIdx}`,
          name,
          number: sport === "football" || sport === "baseball" ? undefined : rIdx + 1,
          odds: BOOKS.map((book) => ({
            bookmaker: book,
            runnerId: `mock-${sport}-${index}-r${rIdx}`,
            price: jitter(basePrice),
            impliedProbability: 0,
            lastUpdate: new Date().toISOString(),
          })),
        };
      }),
    };
    return decorateRunners(event);
  });
}
