import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ClosingLineCheck, SportEvent } from "@bettin2win/types";

interface StoredLine {
  favoriteRunnerId: string;
  favorite: string;
  favoritePrice: number;
  favoriteBookmaker?: string;
  recordedAt: string;
}

interface StoredEvent {
  key: string;
  sport: SportEvent["sport"];
  eventName: string;
  startTime: string;
  latestPregame?: StoredLine;
  closing?: StoredLine & { closedAt: string };
  winner?: string;
}

interface StoredFile {
  version: 1;
  events: StoredEvent[];
}

const DEFAULT_FILE = join(process.cwd(), ".data", "closing-lines.json");

/**
 * Remembers the last moneyline snapshot before an event starts, freezes it as
 * the closing line, then compares that favorite to the final score.
 */
export class LineHistoryStore {
  private readonly events = new Map<string, StoredEvent>();

  constructor(
    private readonly filePath = process.env.ODDS_HISTORY_FILE ?? DEFAULT_FILE,
    private readonly now = () => new Date(),
  ) {
    this.load();
  }

  decorate(event: SportEvent): SportEvent {
    const check = this.record(event);
    if (check) event.lineCheck = check;
    return event;
  }

  record(event: SportEvent): ClosingLineCheck | undefined {
    const now = this.now();
    const key = eventKey(event);
    const existing = this.events.get(key) ?? {
      key,
      sport: event.sport,
      eventName: event.name,
      startTime: event.startTime,
    };
    this.events.set(key, existing);

    let dirty = false;
    const started = hasStarted(event, now);
    const favorite = favoriteLine(event, now);
    if (!started && favorite && changedLine(existing.latestPregame, favorite)) {
      existing.latestPregame = favorite;
      dirty = true;
    }

    if (started && !existing.closing && existing.latestPregame) {
      existing.closing = {
        ...existing.latestPregame,
        closedAt: now.toISOString(),
      };
      dirty = true;
    }

    const winner = inferWinner(event);
    if (event.status === "finished" && winner && existing.winner !== winner) {
      existing.winner = winner;
      dirty = true;
    }

    if (dirty) this.save();
    return checkFromStored(existing, event);
  }

  private load(): void {
    try {
      const body = JSON.parse(readFileSync(this.filePath, "utf8")) as StoredFile;
      if (body.version !== 1 || !Array.isArray(body.events)) return;
      for (const event of body.events) this.events.set(event.key, event);
    } catch {
      /* no history yet, or unreadable history file */
    }
  }

  private save(): void {
    try {
      mkdirSync(dirname(this.filePath), { recursive: true });
      const body: StoredFile = {
        version: 1,
        events: [...this.events.values()].slice(-500),
      };
      writeFileSync(this.filePath, `${JSON.stringify(body, null, 2)}\n`, "utf8");
    } catch {
      /* history is useful, but it must never break live odds polling */
    }
  }
}

export const lineHistoryStore = new LineHistoryStore();

function checkFromStored(stored: StoredEvent, event: SportEvent): ClosingLineCheck | undefined {
  if (event.status === "upcoming" && stored.latestPregame) {
    return {
      status: "tracking",
      favorite: stored.latestPregame.favorite,
      favoritePrice: stored.latestPregame.favoritePrice,
      favoriteBookmaker: stored.latestPregame.favoriteBookmaker,
      recordedAt: stored.latestPregame.recordedAt,
    };
  }

  if (!stored.closing) return undefined;

  const base = {
    favorite: stored.closing.favorite,
    favoritePrice: stored.closing.favoritePrice,
    favoriteBookmaker: stored.closing.favoriteBookmaker,
    recordedAt: stored.closing.recordedAt,
    closedAt: stored.closing.closedAt,
  };

  if (event.status !== "finished" || !stored.winner) {
    return { status: "pending-result", ...base };
  }

  return {
    status: sameName(stored.winner, stored.closing.favorite) ? "favorite-won" : "favorite-lost",
    winner: stored.winner,
    ...base,
  };
}

function favoriteLine(event: SportEvent, now: Date): StoredLine | undefined {
  let favorite: StoredLine | undefined;
  for (const runner of event.runners) {
    if (!runner.bestPrice || runner.bestPrice <= 1) continue;
    if (favorite && runner.bestPrice >= favorite.favoritePrice) continue;
    favorite = {
      favoriteRunnerId: runner.id,
      favorite: runner.name,
      favoritePrice: runner.bestPrice,
      favoriteBookmaker: runner.bestBookmaker,
      recordedAt: now.toISOString(),
    };
  }
  return favorite;
}

function changedLine(previous: StoredLine | undefined, next: StoredLine): boolean {
  return (
    !previous ||
    previous.favoriteRunnerId !== next.favoriteRunnerId ||
    previous.favoritePrice !== next.favoritePrice ||
    previous.favoriteBookmaker !== next.favoriteBookmaker
  );
}

function inferWinner(event: SportEvent): string | undefined {
  if (event.runners.length < 2 || !event.score) return undefined;
  const match = event.score.match(/^\s*(\d+)\s*-\s*(\d+)\s*$/);
  if (!match) return undefined;
  const awayScore = Number(match[1]);
  const homeScore = Number(match[2]);
  if (!Number.isFinite(awayScore) || !Number.isFinite(homeScore) || awayScore === homeScore) {
    return undefined;
  }
  return awayScore > homeScore ? event.runners[0]?.name : event.runners[1]?.name;
}

function hasStarted(event: SportEvent, now: Date): boolean {
  if (event.status !== "upcoming") return true;
  const startMs = Date.parse(event.startTime);
  return Number.isFinite(startMs) && startMs <= now.getTime();
}

function eventKey(event: SportEvent): string {
  const date = event.startTime.slice(0, 10);
  const name = event.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${event.sport}:${date}:${name}`;
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
