import { useEffect, useState } from "react";
import { WS_URL } from "./sports";

export interface GameScore {
  away: string;
  home: string;
  matchName: string;
  current: string;
  state: "scheduled" | "live" | "finished";
  detail: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? wsToHttpBase(WS_URL);

/**
 * Polls the odds-engine for live baseball game states (score + inning) and
 * returns them keyed by "Away @ Home" so cards can look themselves up.
 * Only baseball has scores today; returns an empty map for other sports.
 */
export function useBaseballScores(enabled: boolean): Map<string, GameScore> {
  const [scores, setScores] = useState<Map<string, GameScore>>(new Map());

  useEffect(() => {
    if (!enabled) {
      setScores(new Map());
      return;
    }
    let active = true;

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/enrich/baseball/scores`);
        if (!res.ok) return;
        const list = (await res.json()) as GameScore[];
        if (!active) return;
        setScores(new Map(list.map((s) => [s.matchName, s])));
      } catch {
        /* leave the last good map in place */
      }
    };

    void load();
    const timer = setInterval(load, 20_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [enabled]);

  return scores;
}

function wsToHttpBase(wsUrl: string): string {
  try {
    const url = new URL(wsUrl);
    url.protocol = url.protocol === "wss:" ? "https:" : "http:";
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "http://localhost:4000";
  }
}
