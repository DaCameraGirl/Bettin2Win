import type { SportKey } from "@bettin2win/types";

export interface SportTab {
  key: SportKey;
  label: string;
  icon: string;
}

export const SPORT_TABS: SportTab[] = [
  { key: "football", label: "Football", icon: "🏈" },
  { key: "baseball", label: "Baseball", icon: "⚾" },
  { key: "basketball", label: "Basketball", icon: "🏀" },
  { key: "hockey", label: "Hockey", icon: "🏒" },
  { key: "soccer", label: "Soccer", icon: "⚽" },
  { key: "golf", label: "Golf", icon: "⛳" },
  { key: "nascar", label: "NASCAR", icon: "🏁" },
  { key: "horse-racing", label: "Horse Racing", icon: "🐎" },
  { key: "greyhound", label: "Greyhound", icon: "🐕" },
];

export const WS_URL =
  import.meta.env.VITE_WS_URL ?? "ws://localhost:4000/ws";
