import type { ClosingLineCheck, OddsFormat } from "@bettin2win/types";
import { formatOdds } from "@bettin2win/types";

export function LineCheckBanner({
  check,
  format,
}: {
  check: ClosingLineCheck;
  format: OddsFormat;
}) {
  const price = formatOdds(check.favoritePrice, format);
  const book = check.favoriteBookmaker ? ` at ${check.favoriteBookmaker}` : "";
  const base = `${check.favorite} ${price}${book}`;
  const text =
    check.status === "tracking"
      ? `Tracking pregame favorite: ${base}`
      : check.status === "pending-result"
        ? `Closing favorite: ${base}. Waiting for final.`
        : check.status === "favorite-won"
          ? `Closing favorite won: ${base}. Final winner: ${check.winner}.`
          : `Closing favorite lost: ${base}. Final winner: ${check.winner}.`;

  return (
    <div className={`line-check ${check.status}`}>
      <span>{text}</span>
    </div>
  );
}