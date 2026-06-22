import type { Runner, SportEvent } from "@bettin2win/types";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";

const RSS_URL = "https://www.gbgb.org.uk/api/races";

/**
 * Free UK greyhound race feed from the Greyhound Board of Great Britain RSS.
 * No API key — when the board publishes race items, we surface real cards.
 */
export class GbgbRssAdapter implements SportAdapter {
  readonly sport = "greyhound";
  readonly provider = "gbgb-rss";

  hasCredentials(): boolean {
    return true;
  }

  async fetchEvents(): Promise<AdapterResult> {
    try {
      const res = await fetch(RSS_URL, { headers: { Accept: "application/rss+xml, application/xml" } });
      if (!res.ok) {
        return { mode: "live", events: [], message: `GBGB RSS ${res.status}` };
      }

      const events = normalizeGbgbRss(await res.text());
      if (events.length === 0) {
        return { mode: "live", events, message: "0 GBGB races in RSS window" };
      }

      return {
        mode: "live",
        events,
        message: `${events.length} UK greyhound race${events.length === 1 ? "" : "s"} from GBGB RSS`,
      };
    } catch (err) {
      return {
        mode: "live",
        events: [],
        message: err instanceof Error ? err.message : "GBGB RSS fetch failed",
      };
    }
  }
}

export function normalizeGbgbRss(xml: string): SportEvent[] {
  return parseRssItems(xml)
    .map(normalizeGbgbRaceItem)
    .filter((event): event is SportEvent => event !== null);
}

interface RssItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
}

export function normalizeGbgbRaceItem(item: RssItem): SportEvent | null {
  const title = decodeXml(item.title).trim();
  if (!title) return null;

  const { raceLabel, course, offTime } = parseRaceTitle(title);
  const runners = parseRunners(decodeXml(item.description));
  const startTime = parsePubDate(item.pubDate) ?? new Date().toISOString();
  const id = slug(`${course}-${raceLabel}-${offTime}-${startTime}`);

  const event: SportEvent = {
    id: `gbgb-rss:${id}`,
    sport: "greyhound",
    name: `${raceLabel} - ${course}${offTime ? ` ${offTime}` : ""}`,
    startTime,
    status: "upcoming",
    venue: course,
    source: "gbgb-rss",
    runners,
  };

  return decorateRunners(event);
}

function parseRaceTitle(title: string): { raceLabel: string; course: string; offTime: string } {
  const dash = title.split(" - ").map((part) => part.trim());
  if (dash.length >= 2) {
    const raceLabel = dash[0] ?? "Race";
    const tail = dash.slice(1).join(" - ");
    const timeMatch = tail.match(/(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s*$/i);
    const offTime = timeMatch?.[1] ?? "";
    const course = offTime ? tail.slice(0, -offTime.length).trim() : tail;
    return { raceLabel, course: course || "UK track", offTime };
  }
  return { raceLabel: title, course: "UK track", offTime: "" };
}

function parseRunners(description: string): Runner[] {
  const plain = description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) {
    return [1, 2, 3, 4, 5, 6].map((trap) => ({
      id: `trap-${trap}`,
      name: `Trap ${trap}`,
      number: trap,
      odds: [],
    }));
  }

  const traps = [...plain.matchAll(/trap\s*(\d+)[:\s-]+([^,;|]+)/gi)];
  if (traps.length > 0) {
    return traps.map((match, index) => {
      const trap = Number(match[1]);
      const name = match[2]?.trim() || `Trap ${trap}`;
      return {
        id: `trap-${trap || index + 1}`,
        name: `Trap ${trap} ${name}`,
        number: trap || index + 1,
        odds: [],
      };
    });
  }

  const names = plain.split(/[,;|]/).map((part) => part.trim()).filter(Boolean).slice(0, 6);
  if (names.length > 0) {
    return names.map((name, index) => ({
      id: `runner-${index + 1}`,
      name,
      number: index + 1,
      odds: [],
    }));
  }

  return [1, 2, 3, 4, 5, 6].map((trap) => ({
    id: `trap-${trap}`,
    name: `Trap ${trap}`,
    number: trap,
    odds: [],
  }));
}

function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  for (const block of xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? []) {
    items.push({
      title: extractTag(block, "title"),
      description: extractTag(block, "description"),
      link: extractTag(block, "link"),
      pubDate: extractTag(block, "pubDate"),
    });
  }
  return items;
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parsePubDate(value: string): string | undefined {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : undefined;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}