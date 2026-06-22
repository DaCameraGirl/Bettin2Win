import { useState } from "react";
import { BET_TYPES } from "./oddsExplain";

export function BetTypeGuide() {
  const [active, setActive] = useState<(typeof BET_TYPES)[number]["id"]>("moneyline");
  const selected = BET_TYPES.find((type) => type.id === active) ?? BET_TYPES[0];

  return (
    <section className="bet-type-guide" aria-label="Bet type explainer">
      <div className="bet-type-guide-head">
        <h3>Bet types in plain English</h3>
        <p>Tap a market type to see what it means. This board currently shows moneyline-style winner picks.</p>
      </div>
      <div className="bet-type-chips">
        {BET_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            className={`bet-type-chip ${type.id === active ? "active" : ""} ${type.onBoard ? "on-board" : ""}`}
            onClick={() => setActive(type.id)}
          >
            {type.label}
            {type.onBoard && <span className="chip-tag">on this board</span>}
          </button>
        ))}
      </div>
      <div className="bet-type-detail">
        <strong>{selected.label}:</strong> {selected.detail}
        {!selected.onBoard && (
          <span className="bet-type-soon"> Not shown on live cards yet — educational reference.</span>
        )}
      </div>
    </section>
  );
}