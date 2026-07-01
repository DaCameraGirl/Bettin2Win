import { useMemo, useState } from "react";
import type { OddsFormat, OddsMovement, WeatherImpact } from "@bettin2win/types";
import type { GameScore } from "./useScores";
import { SportField } from "./SportField";
import { WeatherImpactBadge } from "./WeatherImpactBadge";
import { EventMarketPanel } from "./EventMarketPanel";
import {
  BASKETBALL_MARKET_SECTIONS,
  type BasketballMarketSection,
  type BasketballMatchupGroup,
  movementsForMatchup,
} from "./matchupGroup";
import { DataSourceBadge } from "./DataSourceBadge";

function movementHint(direction: "shortening" | "drifting"): string {
  return direction === "shortening"
    ? "shortening ↓ — odds got smaller, now MORE likely to win"
    : "drifting ↑ — odds got bigger, now LESS likely to win";
}

function defaultSection(group: BasketballMatchupGroup): BasketballMarketSection {
  if (group.sections.moneyline.length > 0) return "moneyline";
  if (group.sections.spread.length > 0) return "spread";
  if (group.sections.total.length > 0) return "total";
  return "movement";
}

function sectionEmptyCopy(section: BasketballMarketSection): string {
  switch (section) {
    case "moneyline":
      return "No moneyline prices for this game right now.";
    case "spread":
      return "No spread prices for this game right now.";
    case "total":
      return "No total (over/under) prices for this game right now.";
    case "movement":
      return "No line movement or opportunities for this game yet.";
  }
}

interface BasketballMatchupCardProps {
  group: BasketballMatchupGroup;
  format: OddsFormat;
  score?: GameScore;
  weatherImpact?: WeatherImpact;
  weatherLoading?: boolean;
  movements: OddsMovement[];
  hasOdds: boolean;
}

export function BasketballMatchupCard({
  group,
  format,
  score,
  weatherImpact,
  weatherLoading,
  movements,
  hasOdds,
}: BasketballMatchupCardProps) {
  const [activeSection, setActiveSection] = useState<BasketballMarketSection>(() => defaultSection(group));
  const matchupMovements = useMemo(() => movementsForMatchup(movements, group), [movements, group]);
  const opportunityEvents = useMemo(
    () => [...group.sections.spread, ...group.sections.total, ...group.sections.moneyline].filter((event) =>
      /arbitrage|middle|opportunity/i.test(event.venue ?? ""),
    ),
    [group.sections],
  );

  return (
    <article className="event matchup-card">
      <div className="event-head">
        <h4>{group.name}</h4>
        <div className="event-head-meta">
          <DataSourceBadge event={group.primary} />
          <span className={`pill ${group.status}`}>{group.status}</span>
        </div>
      </div>

      <SportField event={group.primary} score={score} />
      <WeatherImpactBadge
        event={group.primary}
        impact={weatherImpact}
        loading={weatherLoading}
      />

      <div className="matchup-market-tabs" role="tablist" aria-label={`${group.name} markets`}>
        {BASKETBALL_MARKET_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            role="tab"
            className={`matchup-market-tab ${activeSection === section.id ? "active" : ""}`}
            aria-selected={activeSection === section.id}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="matchup-market-panel" role="tabpanel">
        {activeSection === "movement" ? (
          <div className="matchup-movement-panel">
            {opportunityEvents.length > 0 && (
              <div className="matchup-opportunities">
                <h5>Opportunities on this board</h5>
                <ul>
                  {opportunityEvents.map((event) => (
                    <li key={event.id}>{event.venue ?? "Value opportunity"}</li>
                  ))}
                </ul>
              </div>
            )}
            {matchupMovements.length === 0 ? (
              <p className="empty small">{sectionEmptyCopy("movement")}</p>
            ) : (
              <ul className="matchup-movement-list">
                {matchupMovements.map((movement, index) => (
                  <li key={`${movement.runnerId}-${index}`} className={movement.direction}>
                    <strong>{movement.runnerName}</strong>
                    <span>
                      {movement.from.toFixed(2)} → {movement.to.toFixed(2)}
                    </span>
                    <em className={movement.direction}>{movementHint(movement.direction)}</em>
                  </li>
                ))}
              </ul>
            )}
            {!hasOdds && matchupMovements.length === 0 && opportunityEvents.length === 0 && (
              <p className="empty small">No betting prices in this feed right now.</p>
            )}
          </div>
        ) : group.sections[activeSection].length === 0 ? (
          <p className="empty small">{sectionEmptyCopy(activeSection)}</p>
        ) : (
          group.sections[activeSection].map((event) => (
            <EventMarketPanel
              key={event.id}
              event={event}
              format={format}
              showOpportunityLabel={group.sections[activeSection].length > 1 || /arbitrage|middle/i.test(event.venue ?? "")}
            />
          ))
        )}
      </div>
    </article>
  );
}