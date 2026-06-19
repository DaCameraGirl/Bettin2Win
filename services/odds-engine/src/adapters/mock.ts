import type { SportEvent, SportKey } from "@bettin2win/types";
import { decorateRunners } from "./base.js";

const NAME_POOLS: Record<SportKey, { events: string[]; runners: string[][] }> = {
  football: {
    events: ["Chiefs @ Eagles", "Ravens @ Bills", "Cowboys @ 49ers"],
    runners: [["Away", "Home"]],
  },
  baseball: {
    events: ["Sox @ Yankees", "Cubs @ Dodgers", "Mets @ Braves"],
    runners: [["Home", "Away"]],
  },
  basketball: {
    events: ["Mavericks @ Celtics", "Lakers @ Warriors", "Knicks @ Heat"],
    runners: [["Away", "Home"]],
  },
  hockey: {
    events: ["Rangers @ Bruins", "Blackhawks @ Red Wings", "Kings @ Golden Knights"],
    runners: [["Away", "Home"]],
  },
  soccer: {
    events: ["Rangers @ Celtic", "Roma @ Lazio", "Boca @ River Plate"],
    runners: [["Home", "Draw", "Away"]],
  },
  golf: {
    events: ["U.S. Open", "Travelers Championship"],
    runners: [["R. McIlroy (-3)", "S. Stevens (-2)", "B. James (-2)", "B. Harman (-1)"]],
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
      runners: runnerNames.map((name, rIdx) => ({
        id: `mock-${sport}-${index}-r${rIdx}`,
        name,
        number: ["football", "baseball", "basketball", "hockey", "soccer"].includes(sport)
          ? undefined
          : rIdx + 1,
        position: sport === "golf" ? rIdx + 1 : undefined,
        odds: [],
      })),
    };
    return decorateRunners(event);
  });
}
