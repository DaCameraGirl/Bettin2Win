import type { EventStatus, OddsMovement, SportEvent } from "@bettin2win/types";
import { parseMatchup } from "./oddsExplain";

export type BasketballMarketSection = "moneyline" | "spread" | "total" | "movement";

export const BASKETBALL_MARKET_SECTIONS: { id: BasketballMarketSection; label: string }[] = [
  { id: "moneyline", label: "Moneyline" },
  { id: "spread", label: "Spread" },
  { id: "total", label: "Total" },
  { id: "movement", label: "Movement / Opportunities" },
];

export interface BasketballMatchupGroup {
  key: string;
  name: string;
  startTime: string;
  status: EventStatus;
  primary: SportEvent;
  eventIds: Set<string>;
  sections: Record<Exclude<BasketballMarketSection, "movement">, SportEvent[]>;
}

export function basketballMatchupKey(event: SportEvent): string {
  const parsed = parseMatchup(event.name);
  if (parsed) {
    return `matchup:${parsed.away.toLowerCase()} @ ${parsed.home.toLowerCase()}`;
  }

  if (event.id.startsWith("sportsbook-api:")) {
    const eventKey = event.id.slice("sportsbook-api:".length).split(":")[0];
    if (eventKey) return `sportsbook:${eventKey}`;
  }

  return `name:${event.name.trim().toLowerCase()}`;
}

export function basketballMarketSection(event: SportEvent): Exclude<BasketballMarketSection, "movement"> {
  if (event.id.startsWith("sportsbook-api:")) {
    const marketType = event.id.slice("sportsbook-api:".length).split(":")[2]?.toUpperCase() ?? "";
    if (marketType.includes("SPREAD")) return "spread";
    if (marketType.includes("TOTAL") || marketType.includes("OVER")) return "total";
    if (marketType.includes("MONEY") || marketType === "H2H" || marketType === "WIN") return "moneyline";
  }

  const venue = (event.venue ?? "").toLowerCase();
  if (venue.includes("point spread") || venue.includes(" spread")) return "spread";
  if (venue.includes("total") || venue.includes("over/under") || venue.includes("over under")) {
    return "total";
  }

  for (const runner of event.runners) {
    const name = runner.name.toUpperCase();
    if (name.startsWith("OVER ") || name.startsWith("UNDER ")) return "total";
    if (/[+-]\d/.test(runner.name)) return "spread";
  }

  return "moneyline";
}

export function groupBasketballMatchups(events: SportEvent[]): BasketballMatchupGroup[] {
  const buckets = new Map<string, SportEvent[]>();

  for (const event of events) {
    const key = basketballMatchupKey(event);
    const group = buckets.get(key);
    if (group) group.push(event);
    else buckets.set(key, [event]);
  }

  return [...buckets.entries()]
    .map(([key, groupedEvents]) => buildMatchupGroup(key, groupedEvents))
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
}

export function movementsForMatchup(
  movements: OddsMovement[],
  group: BasketballMatchupGroup,
): OddsMovement[] {
  return movements.filter((movement) => group.eventIds.has(movement.eventId));
}

function buildMatchupGroup(key: string, events: SportEvent[]): BasketballMatchupGroup {
  const sections: BasketballMatchupGroup["sections"] = {
    moneyline: [],
    spread: [],
    total: [],
  };

  for (const event of events) {
    sections[basketballMarketSection(event)].push(event);
  }

  const sortByValue = (list: SportEvent[]) =>
    [...list].sort((a, b) => opportunityValue(b) - opportunityValue(a));

  sections.moneyline = sortByValue(sections.moneyline);
  sections.spread = sortByValue(sections.spread);
  sections.total = sortByValue(sections.total);

  const primary = pickPrimaryEvent(events, sections.moneyline);
  const eventIds = new Set(events.map((event) => event.id));

  return {
    key,
    name: primary.name,
    startTime: primary.startTime,
    status: pickGroupStatus(events),
    primary,
    eventIds,
    sections,
  };
}

function pickPrimaryEvent(events: SportEvent[], moneyline: SportEvent[]): SportEvent {
  const ranked = [
    ...moneyline,
    ...events.filter((event) => event.score || event.homeLogo || event.awayLogo),
    ...events,
  ];

  for (const event of ranked) {
    if (event.score || event.homeLogo || event.awayLogo) return event;
  }

  return ranked[0] ?? events[0]!;
}

function pickGroupStatus(events: SportEvent[]): EventStatus {
  if (events.some((event) => event.status === "live")) return "live";
  if (events.some((event) => event.status === "upcoming")) return "upcoming";
  return "finished";
}

function opportunityValue(event: SportEvent): number {
  const match = (event.venue ?? "").match(/(\d+(?:\.\d+)?)%/);
  return match ? Number(match[1]) : 0;
}