import { useEffect, useState } from "react";
import type { MarketTickerSnapshot } from "@bettin2win/types";
import { API_BASE } from "./api";

const POLL_MS = 60_000;

export function useMarketTicker(): MarketTickerSnapshot & { loading: boolean } {
  const [snapshot, setSnapshot] = useState<MarketTickerSnapshot>({
    quotes: [],
    source: "yahoo-finance",
    updatedAt: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/market-ticker`);
        if (!res.ok) return;
        const body = (await res.json()) as MarketTickerSnapshot;
        if (active) {
          setSnapshot(body);
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    };

    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return { ...snapshot, loading };
}