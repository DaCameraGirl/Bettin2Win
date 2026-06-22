import type { SportEvent, SportKey } from "@bettin2win/types";
import { groupBasketballMatchups, type BasketballMatchupGroup } from "./matchupGroup";
import { eventHasOdds } from "./providerStatus";

const TEAM_SPORTS: SportKey[] = ["football", "baseball", "basketball", "hockey", "soccer"];

export type BoardFilter = "all" | "beginner-friendly" | "with-prices" | "live";

export const BOARD_FILTERS: { id: BoardFilter; label: string; hint: string }[] = [
  {
    id: "beginner-friendly",
    label: "Beginner-friendly only",
    hint: "Simple winner picks — mostly two-team moneylines.",
  },
  {
    id: "with-prices",
    label: "Show games with prices",
    hint: "Only games that already have odds on the board.",
  },
  {
    id: "live",
    label: "Show live games",
    hint: "Games in progress right now.",
  },
  {
    id: "all",
    label: "Show all",
    hint: "Everything in this sport feed.",
  },
];

export function isSpreadOrTotalMarket(event: SportEvent): boolean {
  if (event.id.startsWith("sportsbook-api:")) {
    const marketType = event.id.slice("sportsbook-api:".length).split(":")[2]?.toUpperCase() ?? "";
    if (marketType.includes("SPREAD") || marketType.includes("TOTAL") || marketType.includes("OVER")) {
      return true;
    }
  }

  const venue = (event.venue ?? "").toLowerCase();
  if (
    venue.includes("point spread") ||
    venue.includes(" spread") ||
    venue.includes("total") ||
    venue.includes("over/under") ||
    venue.includes("over under")
  ) {
    return true;
  }

  return event.runners.some((runner) => {
    const name = runner.name.toUpperCase();
    return name.startsWith("OVER ") || name.startsWith("UNDER ") || /[+-]\d/.test(runner.name);
  });
}

export function isBeginnerFriendlyEvent(event: SportEvent): boolean {
  if (!TEAM_SPORTS.includes(event.sport)) return false;
  if (event.sport === "soccer" && event.runners.length >= 3) return false;
  if (event.prediction?.extras?.length || event.prediction?.correctScore) return false;
  if (isSpreadOrTotalMarket(event)) return false;

  const teamRunners = event.runners.filter((runner) => !/^(over|under)\s/i.test(runner.name));
  return teamRunners.length === 2;
}

export function eventPassesBoardFilter(event: SportEvent, filter: BoardFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "beginner-friendly":
      return isBeginnerFriendlyEvent(event);
    case "with-prices":
      return eventHasOdds(event);
    case "live":
      return event.status === "live";
  }
}

export function filterBoardEvents(events: SportEvent[], filter: BoardFilter): SportEvent[] {
  if (filter === "all") return events;
  return events.filter((event) => eventPassesBoardFilter(event, filter));
}

export function matchupPassesBoardFilter(group: BasketballMatchupGroup, filter: BoardFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "live":
      return group.status === "live";
    case "with-prices":
      return [...group.sections.moneyline, ...group.sections.spread, ...group.sections.total].some(eventHasOdds);
    case "beginner-friendly":
      return group.sections.moneyline.some(isBeginnerFriendlyEvent);
  }
}

export function filterBasketballMatchups(
  groups: BasketballMatchupGroup[],
  filter: BoardFilter,
): BasketballMatchupGroup[] {
  if (filter === "all") return groups;
  return groups.filter((group) => matchupPassesBoardFilter(group, filter));
}

export function boardFilterEmptyMessage(filter: BoardFilter, sportLabel: string): string {
  switch (filter) {
    case "beginner-friendly":
      return `No beginner-friendly ${sportLabel.toLowerCase()} games match this filter right now. Try Show all or another sport.`;
    case "with-prices":
      return `No ${sportLabel.toLowerCase()} games with posted prices right now.`;
    case "live":
      return `No live ${sportLabel.toLowerCase()} games right now. Everything on this board is upcoming or final. Try Show all to browse tipoff times.`;
    default:
      return `No ${sportLabel.toLowerCase()} games to show.`;
  }
}

export function boardFilterCounts(
  sport: SportKey,
  sourceEvents: SportEvent[],
): Record<BoardFilter, number> {
  if (sport === "basketball") {
    const groups = groupBasketballMatchups(sourceEvents);
    return {
      all: groups.length,
      "beginner-friendly": filterBasketballMatchups(groups, "beginner-friendly").length,
      "with-prices": filterBasketballMatchups(groups, "with-prices").length,
      live: filterBasketballMatchups(groups, "live").length,
    };
  }

  return {
    all: sourceEvents.length,
    "beginner-friendly": filterBoardEvents(sourceEvents, "beginner-friendly").length,
    "with-prices": filterBoardEvents(sourceEvents, "with-prices").length,
    live: filterBoardEvents(sourceEvents, "live").length,
  };
}