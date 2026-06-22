import { WS_URL } from "./sports";

export const API_BASE = import.meta.env.VITE_API_URL ?? wsToHttpBase(WS_URL);

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