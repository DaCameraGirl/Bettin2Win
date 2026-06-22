import type { OddsFormat, Runner, SportEvent, SportKey } from "@bettin2win/types";
import { formatOdds, impliedProbability } from "@bettin2win/types";

const TEAM_SPORTS: SportKey[] = ["football", "baseball", "basketball", "hockey", "soccer"];
const RACING_SPORTS: SportKey[] = ["nascar", "horse-racing", "greyhound"];

export type RiskLabel =
  | "beginner-friendly"
  | "higher-variance"
  | "bad-price-warning"
  | "complex-bet";

export interface RiskBadge {
  label: RiskLabel;
  title: string;
  message: string;
}

export interface RunnerExplanation {
  name: string;
  role: "favorite" | "underdog" | "draw" | "contender";
  oddsText: string;
  plainEnglish: string;
  impliedPercent: number;
  payouts: { stake: number; profit: number; totalReturn: number }[];
  bestPriceNote?: string;
}

export interface EventExplanation {
  marketType: string;
  headline: string;
  favoredSummary?: string;
  runners: RunnerExplanation[];
  winCondition: string;
  riskBadges: RiskBadge[];
  disclaimer: string;
}

export function parseMatchup(name: string): { away: string; home: string } | null {
  const [away, home] = name.split(" @ ");
  if (!away || !home) return null;
  return { away: away.trim(), home: home.trim() };
}

export function profitForStake(decimalOdds: number, stake: number): { profit: number; totalReturn: number } {
  const totalReturn = stake * decimalOdds;
  return { profit: totalReturn - stake, totalReturn };
}

export function plainEnglishPayout(name: string, decimalOdds: number): string {
  if (decimalOdds <= 1) return `${name}: odds unavailable for payout math.`;
  if (decimalOdds >= 2) {
    const profit = Math.round((decimalOdds - 1) * 100);
    return `${name} is the underdog here. A $100 bet would profit $${profit} if they win.`;
  }
  const risk = Math.round(100 / (decimalOdds - 1));
  return `${name} is the favorite here. You would need to bet $${risk} to profit $100 if they win.`;
}

export function impliedPercent(decimalOdds: number): number {
  return Math.round(impliedProbability(decimalOdds) * 100);
}

function runnerRole(
  runner: Runner,
  priced: Runner[],
  sport: SportKey,
): RunnerExplanation["role"] {
  if (runner.name.toLowerCase() === "draw") return "draw";
  if (!runner.bestPrice || priced.length < 2) return "contender";
  const sorted = [...priced].sort((a, b) => (a.bestPrice ?? 99) - (b.bestPrice ?? 99));
  const favorite = sorted[0];
  if (favorite && runner.id === favorite.id) {
    return sport === "soccer" && sorted.length === 3 ? "favorite" : "favorite";
  }
  return "underdog";
}

function bestPriceNote(runner: Runner): string | undefined {
  if (!runner.bestPrice || runner.odds.length < 2) return undefined;
  const sorted = [...runner.odds].sort((a, b) => b.price - a.price);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  if (!best || !worst || best.price <= worst.price) return undefined;

  const bestProfit = profitForStake(best.price, 100).profit;
  const worstProfit = profitForStake(worst.price, 100).profit;
  const delta = Math.round(bestProfit - worstProfit);
  if (delta < 5) return undefined;

  return `Best price found: ${runner.name} ${formatOdds(best.price, "american")} at ${best.bookmaker}. Another book is offering ${formatOdds(worst.price, "american")}. On a $100 bet, the better line would profit about $${delta} more for the same pick.`;
}

function assessRisk(event: SportEvent, priced: Runner[]): RiskBadge[] {
  const badges: RiskBadge[] = [];

  if (TEAM_SPORTS.includes(event.sport) && priced.length === 2) {
    badges.push({
      label: "beginner-friendly",
      title: "Beginner friendly",
      message: "This is a simple moneyline — you are picking who wins the game.",
    });
  }

  if (event.sport === "soccer" && priced.length >= 3) {
    badges.push({
      label: "complex-bet",
      title: "Three-way market",
      message:
        "Soccer often includes a draw. You are not just picking a winner — a tie can cash the draw price instead.",
    });
  }

  if (RACING_SPORTS.includes(event.sport) || event.sport === "golf" || priced.length >= 4) {
    badges.push({
      label: "higher-variance",
      title: "Higher variance",
      message:
        "Many possible winners means lower hit rate. One upset can wipe out several wins — good to understand before betting.",
    });
  }

  if (event.prediction?.extras?.length || event.prediction?.correctScore) {
    badges.push({
      label: "complex-bet",
      title: "Complex market",
      message:
        "This card includes model-style extras (scorelines, BTTS, totals). Read each tag carefully — it is not the same as a simple winner pick.",
    });
  }

  const badPrice = priced.some((runner) => {
    if (!runner.bestPrice || runner.odds.length < 2) return false;
    const prices = runner.odds.map((line) => line.price);
    const spread = Math.max(...prices) - Math.min(...prices);
    return spread >= 0.12;
  });

  if (badPrice) {
    badges.push({
      label: "bad-price-warning",
      title: "Line shopping matters",
      message:
        "At least one outcome has a noticeably better price at one book vs another. Compare before placing a bet elsewhere.",
    });
  }

  return badges;
}

function winCondition(event: SportEvent, priced: Runner[]): string {
  if (TEAM_SPORTS.includes(event.sport)) {
    const matchup = parseMatchup(event.name);
    if (event.sport === "soccer") {
      return "To win: your pick must match the final result — home win, away win, or draw, depending on which price you chose.";
    }
    return matchup
      ? `To win: the team you pick (${priced.map((r) => r.name).join(" or ")}) must win the game outright.`
      : "To win: your selected team must win the game outright.";
  }
  if (event.sport === "golf") {
    return "To win: your golfer must finish the tournament with the best result for the market you chose (often outright winner).";
  }
  if (RACING_SPORTS.includes(event.sport)) {
    return "To win: your runner must finish first for a winner market. More runners means longer odds and more unpredictability.";
  }
  return "To win: the outcome you select must happen as described by the sportsbook market you place elsewhere.";
}

export function explainEvent(event: SportEvent, format: OddsFormat): EventExplanation | null {
  const priced = event.runners.filter((runner) => runner.bestPrice && runner.bestPrice > 1);
  if (priced.length === 0) return null;

  const stakes = [10, 25, 100];
  const runners: RunnerExplanation[] = priced.map((runner) => ({
    name: runner.name,
    role: runnerRole(runner, priced, event.sport),
    oddsText: formatOdds(runner.bestPrice!, format),
    plainEnglish: plainEnglishPayout(runner.name, runner.bestPrice!),
    impliedPercent: impliedPercent(runner.bestPrice!),
    payouts: stakes.map((stake) => ({
      stake,
      ...profitForStake(runner.bestPrice!, stake),
    })),
    bestPriceNote: bestPriceNote(runner),
  }));

  const favorite = runners.find((r) => r.role === "favorite");
  const underdog = runners.find((r) => r.role === "underdog");
  let favoredSummary: string | undefined;
  if (favorite && underdog) {
    favoredSummary = `${favorite.name} is expected to win (${favorite.oddsText}). ${underdog.name} pays more (${underdog.oddsText}) because the books see that result as less likely.`;
  } else if (favorite) {
    favoredSummary = `${favorite.name} has the shortest price (${favorite.oddsText}), so the market sees them as the most likely winner on this board.`;
  }

  const marketType = TEAM_SPORTS.includes(event.sport)
    ? "Moneyline (who wins)"
    : event.sport === "golf"
      ? "Outright / tournament market"
      : "Winner market";

  return {
    marketType,
    headline: event.name,
    favoredSummary,
    runners,
    winCondition: winCondition(event, priced),
    riskBadges: assessRisk(event, priced),
    disclaimer:
      "This explains what the line implies — not whether you should bet. Bettin2Win does not accept wagers.",
  };
}

export const BET_TYPES = [
  {
    id: "moneyline",
    label: "Moneyline",
    short: "Pick who wins.",
    detail:
      "You are picking which team or player wins outright. No point spread — just the final result.",
    onBoard: true,
  },
  {
    id: "spread",
    label: "Spread",
    short: "Win by enough points.",
    detail:
      "The favorite must win by more than the line (e.g. -3.5 means win by 4+). The underdog can lose by fewer than the line and still cash.",
    onBoard: false,
  },
  {
    id: "total",
    label: "Total",
    short: "Combined score.",
    detail:
      "You bet whether both teams' combined score goes over or under a number (e.g. O/U 47.5). It does not matter who wins.",
    onBoard: false,
  },
  {
    id: "prop",
    label: "Player prop",
    short: "One player's stat.",
    detail:
      "A bet on one player's performance — points, yards, rebounds, etc. Depends on minutes, matchups, and game script. Usually not ideal for first-time bettors.",
    onBoard: false,
  },
  {
    id: "futures",
    label: "Futures",
    short: "Long-term outcome.",
    detail:
      "A bet on something far ahead — championship winner, division title, MVP. Your money is tied up longer and outcomes are harder to predict.",
    onBoard: false,
  },
] as const;