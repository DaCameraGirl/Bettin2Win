import type { OddsLine, SportEvent, SportKey } from "@bettin2win/types";

const NAME_POOLS: Record<SportKey, { events: string[]; runners: string[][] }> = {
  football: {
    events: ["Chiefs @ Eagles", "Ravens @ Bills", "Cowboys @ 49ers"],
    runners: [["Chiefs", "Eagles"], ["Ravens", "Bills"], ["Cowboys", "49ers"]],
  },
  baseball: {
    events: ["Red Sox @ Yankees", "Cubs @ Dodgers", "Mets @ Braves"],
    runners: [["Red Sox", "Yankees"], ["Cubs", "Dodgers"], ["Mets", "Braves"]],
  },
  basketball: {
    events: ["Mavericks @ Celtics", "Lakers @ Warriors", "Knicks @ Heat"],
    runners: [["Mavericks", "Celtics"], ["Lakers", "Warriors"], ["Knicks", "Heat"]],
  },
  hockey: {
    events: ["Rangers @ Bruins", "Blackhawks @ Red Wings", "Kings @ Golden Knights"],
    runners: [["Rangers", "Bruins"], ["Blackhawks", "Red Wings"], ["Kings", "Golden Knights"]],
  },
  soccer: {
    events: ["Rangers @ Celtic", "Roma @ Lazio", "Boca @ River Plate"],
    runners: [["Rangers", "Draw", "Celtic"], ["Roma", "Draw", "Lazio"], ["Boca", "Draw", "River Plate"]],
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

const DEMO_BOOKS = ["DraftKings", "FanDuel", "BetMGM"] as const;

/** Client-side demo board with sample odds so the UI stays explorable offline. */
export function generateDemoEvents(sport: SportKey): SportEvent[] {
  const pool = NAME_POOLS[sport];
  const now = Date.now();

  return pool.events.map((eventName, eventIndex) => {
    const runnerNames = pool.runners[eventIndex] ?? pool.runners[0] ?? ["Home", "Away"];
    const teamSport = ["football", "baseball", "basketball", "hockey", "soccer"].includes(sport);

    const runners = runnerNames.map((name, runnerIndex) => {
      const id = `demo-${sport}-${eventIndex}-r${runnerIndex}`;
      const basePrice = 1.75 + runnerIndex * 0.35 + eventIndex * 0.12;
      const odds: OddsLine[] = DEMO_BOOKS.map((bookmaker, bookIndex) => ({
        bookmaker,
        runnerId: id,
        price: Number((basePrice + bookIndex * 0.08).toFixed(2)),
        impliedProbability: 0,
        lastUpdate: new Date().toISOString(),
      }));
      const best = odds.reduce((top, line) => (line.price > top.price ? line : top));

      return {
        id,
        name,
        number: teamSport ? undefined : runnerIndex + 1,
        position: sport === "golf" ? runnerIndex + 1 : undefined,
        odds,
        bestPrice: best.price,
        bestBookmaker: best.bookmaker,
      };
    });

    return {
      id: `demo-${sport}-${eventIndex}`,
      sport,
      name: eventName,
      startTime: new Date(now + (eventIndex + 1) * 30 * 60_000).toISOString(),
      status: eventIndex === 0 ? "live" : "upcoming",
      source: "demo",
      venue: sport === "horse-racing" || sport === "greyhound" ? eventName.split(" - ")[0] : undefined,
      runners,
    } satisfies SportEvent;
  });
}

export function buildDemoEventsBySport(): Record<SportKey, SportEvent[]> {
  return Object.fromEntries(
    (Object.keys(NAME_POOLS) as SportKey[]).map((sport) => [sport, generateDemoEvents(sport)]),
  ) as Record<SportKey, SportEvent[]>;
}