import { useState } from "react";
import type { ProviderHealth, SportEvent, SportKey } from "@bettin2win/types";
import { SPORT_TABS } from "./sports";
import {
  classifyFeedStatus,
  developerStatusDetail,
  FEED_STATUS_LABELS,
  userStatusDetail,
  USER_FEED_STATUS_LABELS,
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
  const [showDevDetails, setShowDevDetails] = useState(false);

  return (
    <section className="status-panel" aria-label="Provider status control room">
      <div className="status-panel-head">
        <div className="status-panel-head-row">
          <div>
            <h3>Feed health</h3>
            <p>Quick check that each sport has live games or prices. Click a row to jump there.</p>
          </div>
          <label className="status-dev-toggle">
            <input
              type="checkbox"
              checked={showDevDetails}
              onChange={(event) => setShowDevDetails(event.target.checked)}
            />
            Technical details
          </label>
        </div>
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
          const devDetail = developerStatusDetail(sportHealth);

          return (
            <button
              key={tab.key}
              type="button"
              className={`status-card ${status} ${isActive ? "active" : ""}`}
              onClick={() => onSelectSport(tab.key)}
            >
              <span className="status-card-icon">{tab.icon}</span>
              <span className="status-card-label">{tab.label}</span>
              <span className={`status-pill user ${status}`}>{USER_FEED_STATUS_LABELS[status]}</span>
              <span className="status-card-detail">{userStatusDetail(status, sportHealth, events.length)}</span>
              {showDevDetails && (
                <span className="status-card-dev" title={FEED_STATUS_LABELS[status]}>
                  {devDetail ?? "No engine message yet"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}