import type { SportKey } from "@bettin2win/types";
import { BOARD_FILTERS, type BoardFilter } from "./eventFilters";

interface SportBoardFilterProps {
  sport: SportKey;
  sportLabel: string;
  value: BoardFilter;
  counts: Record<BoardFilter, number>;
  onChange: (sport: SportKey, filter: BoardFilter) => void;
}

export function SportBoardFilter({
  sport,
  sportLabel,
  value,
  counts,
  onChange,
}: SportBoardFilterProps) {
  const active = BOARD_FILTERS.find((option) => option.id === value) ?? BOARD_FILTERS[3];

  return (
    <section className="board-filters" aria-label={`Filter ${sportLabel} games`}>
      <div className="board-filters-head">
        <h3 className="board-filters-title">Filter this board</h3>
        <span className="board-filters-scope">{sportLabel}</span>
      </div>
      <div className="board-filter-options" role="group" aria-label="Game filters">
        {BOARD_FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`board-filter-btn ${value === option.id ? "active" : ""}`}
            aria-pressed={value === option.id}
            onClick={() => onChange(sport, option.id)}
          >
            <span>{option.label}</span>
            <em>{counts[option.id]}</em>
          </button>
        ))}
      </div>
      <p className="board-filter-hint">{active?.hint}</p>
    </section>
  );
}