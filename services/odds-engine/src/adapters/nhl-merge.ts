import type { Runner, SportEvent } from "@bettin2win/types";
import { decorateRunners } from "./base.js";

/** Map common team name fragments to NHL abbreviations for cross-feed matching. */
const TEAM_ALIASES: Record<string, string> = {
  ana: "ana",
  ducks: "ana",
  ari: "ari",
  coyotes: "ari",
  utah: "uta",
  mammoth: "uta",
  bos: "bos",
  bruins: "bos",
  buf: "buf",
  sabres: "buf",
  car: "car",
  hurricanes: "car",
  cbj: "cbj",
  "blue jackets": "cbj",
  cgy: "cgy",
  flames: "cgy",
  chi: "chi",
  blackhawks: "chi",
  col: "col",
  avalanche: "col",
  dal: "dal",
  stars: "dal",
  det: "det",
  "red wings": "det",
  edm: "edm",
  oilers: "edm",
  fla: "fla",
  panthers: "fla",
  lak: "lak",
  kings: "lak",
  min: "min",
  wild: "min",
  mtl: "mtl",
  canadiens: "mtl",
  nsh: "nsh",
  predators: "nsh",
  njd: "njd",
  devils: "njd",
  nyi: "nyi",
  islanders: "nyi",
  nyr: "nyr",
  rangers: "nyr",
  ott: "ott",
  senators: "ott",
  phi: "phi",
  flyers: "phi",
  pit: "pit",
  penguins: "pit",
  sea: "sea",
  kraken: "sea",
  sjs: "sjs",
  sharks: "sjs",
  stl: "stl",
  blues: "stl",
  tbl: "tbl",
  lightning: "tbl",
  tor: "tor",
  "maple leafs": "tor",
  van: "van",
  canucks: "van",
  vgk: "vgk",
  "golden knights": "vgk",
  vegas: "vgk",
  wpg: "wpg",
  jets: "wpg",
  wsh: "wsh",
  capitals: "wsh",
};

export function matchupKey(name: string): string | null {
  const sides = name.split(" @ ").map((side) => side.trim().toLowerCase());
  if (sides.length !== 2 || !sides[0] || !sides[1]) return null;
  const away = teamAbbrev(sides[0]);
  const home = teamAbbrev(sides[1]);
  if (!away || !home) return null;
  return `${away}@${home}`;
}

export function mergeNhlEvents(espnEvents: SportEvent[], scoreboardEvents: SportEvent[]): SportEvent[] {
  const espnByKey = new Map<string, SportEvent>();
  for (const event of espnEvents) {
    const key = matchupKey(event.name);
    if (key) espnByKey.set(key, event);
  }

  const merged: SportEvent[] = [];
  const usedEspn = new Set<string>();

  for (const scoreboard of scoreboardEvents) {
    const key = matchupKey(scoreboard.name);
    const espn = key ? espnByKey.get(key) : undefined;
    if (espn) usedEspn.add(key!);
    merged.push(espn ? mergePair(scoreboard, espn) : scoreboard);
  }

  for (const [key, espn] of espnByKey) {
    if (!usedEspn.has(key)) merged.push(espn);
  }

  return merged.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
}

function mergePair(scoreboard: SportEvent, espn: SportEvent): SportEvent {
  const runners = scoreboard.runners.map((runner, index) => {
    const espnRunner = espn.runners[index];
    if (!espnRunner || !hasPrices(espnRunner)) return runner;
    return mergeRunner(runner, espnRunner);
  });

  return decorateRunners({
    ...scoreboard,
    runners,
    source: hasPrices(espn) ? "espn-nhl-odds+nhl-scoreboard" : scoreboard.source,
  });
}

function mergeRunner(primary: Runner, priced: Runner): Runner {
  return {
    ...primary,
    odds: priced.odds,
    bestPrice: priced.bestPrice,
    bestBookmaker: priced.bestBookmaker,
  };
}

function hasPrices(event: SportEvent | Runner): boolean {
  if ("runners" in event) {
    return event.runners.some((runner) => runner.odds.length > 0 || runner.bestPrice !== undefined);
  }
  return event.odds.length > 0 || event.bestPrice !== undefined;
}

function teamAbbrev(fragment: string): string | null {
  const lead = fragment.match(/^([a-z]{2,4})\b/);
  if (lead?.[1]) return lead[1].toLowerCase();

  for (const [alias, abbrev] of Object.entries(TEAM_ALIASES)) {
    if (fragment.includes(alias)) return abbrev;
  }

  return null;
}