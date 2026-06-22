import type { SportKey } from "@bettin2win/types";
import { BOARD_FILTERS, type BoardFilter } from "./eventFilters";

interface SportBoardFilterProps {
  sport: SportKey;
  value: BoardFilter;
  onChange: (sport: SportKey, filter: BoardFilter) => void;
}

export function SportBoardFilter({ sport, value, onChange }: SportBoardFilterProps) {
  const active = BOARD_FILTERS.find((option) => option.id === value) ?? BOARD_FILTERS[3];

  return (
    <div className="board-filters" aria-label="Filter games on this board">
      <div className="board-filter-options" role="group" aria-label="Game filters">
        {BOARD_FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`board-filter-btn ${value === option.id ? "active" : ""}`}
            aria-pressed={value === option.id}
            onClick={() => onChange(sport, option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="board-filter-hint">{active?.hint}</p>
    </div>
  );
}