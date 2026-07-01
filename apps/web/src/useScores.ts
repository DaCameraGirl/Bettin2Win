import { useEffect, useState } from "react";
import { API_BASE } from "./api";
import { indexScoresByMatchName } from "./scoreMatch";

export interface GameScore {
  away: string;
  home: string;
  matchName: string;
  current: string;
  state: "scheduled" | "live" | "finished";
  detail: string;
}

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
        setScores(indexScoresByMatchName(list));
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

