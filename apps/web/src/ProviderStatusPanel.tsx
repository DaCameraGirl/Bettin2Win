import type { ProviderHealth, SportEvent, SportKey } from "@bettin2win/types";
import { SPORT_TABS } from "./sports";
import {
  classifyFeedStatus,
  feedSummaryFromHealth,
  FEED_STATUS_LABELS,
  type FeedStatus,
} from "./providerStatus";

interface ProviderStatusPanelProps {
  health: ProviderHealth[];
  /** Live socket events — never client demo boards. */
  liveEventsBySport: Record<string, SportEvent[]>;
  activeSport: SportKey;
  demoMode: boolean;
  onSelectSport: (sport: SportKey) => void;
}

export function ProviderStatusPanel({
  health,
  liveEventsBySport,
  activeSport,
  demoMode,
  onSelectSport,
}: ProviderStatusPanelProps) {
  return (
    <section className="status-panel" aria-label="Provider status control room">
      <div className="status-panel-head">
        <h3>Provider status</h3>
        <p>Control-room view of every sport feed. Click a row to jump there.</p>
      </div>
      <div className="status-grid">
        {SPORT_TABS.map((tab) => {
          const sportHealth = health.find((row) => row.sport === tab.key);
          const events = liveEventsBySport[tab.key] ?? [];
          const status = classifyFeedStatus(
            sportHealth,
            events,
            demoMode && tab.key === activeSport,
          );
          const isActive = tab.key === activeSport;

          return (
            <button
              key={tab.key}
              type="button"
              className={`status-card ${status} ${isActive ? "active" : ""}`}
              onClick={() => onSelectSport(tab.key)}
            >
              <span className="status-card-icon">{tab.icon}</span>
              <span className="status-card-label">{tab.label}</span>
              <span className={`status-pill ${status}`}>{FEED_STATUS_LABELS[status]}</span>
              <span className="status-card-detail">{statusDetail(status, sportHealth, events.length)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function statusDetail(
  status: FeedStatus,
  health: ProviderHealth | undefined,
  eventCount: number,
): string {
  if (status === "demo") return "Sample games with demo prices";
  if (status === "waiting") return health?.message?.slice(0, 72) ?? "Waiting for first snapshot";
  if (status === "no-key") return shortMessage(health, "API key missing on server");
  if (status === "quota-hit") return shortMessage(health, "Provider quota exhausted");
  if (status === "provider-down") return shortMessage(health, "Provider unreachable");
  return feedSummaryFromHealth(health, eventCount);
}

function shortMessage(health: ProviderHealth | undefined, fallback: string): string {
  const text = health?.message?.trim();
  if (!text) return fallback;
  return text.length > 84 ? `${text.slice(0, 81)}…` : text;
}