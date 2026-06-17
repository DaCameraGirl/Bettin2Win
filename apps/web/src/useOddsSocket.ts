import { useEffect, useRef, useState } from "react";
import type {
  OddsMovement,
  ProviderHealth,
  SportEvent,
  SportKey,
  WebSocketMessage,
} from "@bettin2win/types";
import { WS_URL } from "./sports";

export interface OddsState {
  connected: boolean;
  eventsBySport: Record<string, SportEvent[]>;
  movements: OddsMovement[];
  health: ProviderHealth[];
}

const EMPTY: OddsState = {
  connected: false,
  eventsBySport: {},
  movements: [],
  health: [],
};

/**
 * Subscribes to the odds-engine WebSocket and keeps a live, normalized view of
 * every sport's events plus the recent movement feed and provider health.
 * Auto-reconnects with a small backoff if the socket drops.
 */
export function useOddsSocket(): OddsState {
  const [state, setState] = useState<OddsState>(EMPTY);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let closedByUs = false;
    let retry: ReturnType<typeof setTimeout>;

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setState((s) => ({ ...s, connected: true }));

      ws.onclose = () => {
        setState((s) => ({ ...s, connected: false }));
        if (!closedByUs) retry = setTimeout(connect, 2000);
      };

      ws.onmessage = (raw) => {
        const msg = JSON.parse(raw.data as string) as WebSocketMessage;
        setState((prev) => reduce(prev, msg));
      };
    };

    connect();
    return () => {
      closedByUs = true;
      clearTimeout(retry);
      wsRef.current?.close();
    };
  }, []);

  return state;
}

function reduce(state: OddsState, msg: WebSocketMessage): OddsState {
  switch (msg.type) {
    case "snapshot":
      return {
        ...state,
        eventsBySport: { ...state.eventsBySport, [msg.sport]: msg.events },
      };
    case "odds_update": {
      const sport = msg.event.sport as SportKey;
      const existing = state.eventsBySport[sport] ?? [];
      const next = existing.some((e) => e.id === msg.event.id)
        ? existing.map((e) => (e.id === msg.event.id ? msg.event : e))
        : [...existing, msg.event];
      return { ...state, eventsBySport: { ...state.eventsBySport, [sport]: next } };
    }
    case "movement":
      return { ...state, movements: [msg.movement, ...state.movements].slice(0, 30) };
    case "health":
      return { ...state, health: msg.providers };
    case "insight":
      return state;
  }
}
