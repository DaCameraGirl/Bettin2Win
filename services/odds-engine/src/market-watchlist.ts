export type WatchlistCategory =
  | "indexes"
  | "megaCapTech"
  | "chipAi"
  | "retailFavorites"
  | "finance"
  | "consumer"
  | "healthcare"
  | "energy"
  | "leveragedEtfs"
  | "commodities";

export interface TickerEntry {
  symbol: string;
  label: string;
  category: WatchlistCategory;
}

export const WATCHLIST_CATEGORY_LABELS: Record<WatchlistCategory, string> = {
  indexes: "Indexes",
  megaCapTech: "Mega-cap tech",
  chipAi: "Chips & software",
  retailFavorites: "Retail favorites",
  finance: "Finance",
  consumer: "Consumer",
  healthcare: "Healthcare",
  energy: "Energy",
  leveragedEtfs: "Leveraged ETFs",
  commodities: "Commodities",
};

/** Default Bettin2Win market watchlist — broad but not spreadsheet-sized. */
export const POPULAR_WATCHLISTS: Record<WatchlistCategory, TickerEntry[]> = {
  indexes: [
    { symbol: "SPY", label: "S&P 500", category: "indexes" },
    { symbol: "QQQ", label: "Nasdaq 100", category: "indexes" },
    { symbol: "DIA", label: "Dow", category: "indexes" },
    { symbol: "IWM", label: "Russell 2000", category: "indexes" },
    { symbol: "VOO", label: "Vanguard S&P 500", category: "indexes" },
    { symbol: "VTI", label: "Total US market", category: "indexes" },
  ],
  megaCapTech: [
    { symbol: "AAPL", label: "Apple", category: "megaCapTech" },
    { symbol: "MSFT", label: "Microsoft", category: "megaCapTech" },
    { symbol: "NVDA", label: "NVIDIA", category: "megaCapTech" },
    { symbol: "TSLA", label: "Tesla", category: "megaCapTech" },
    { symbol: "AMZN", label: "Amazon", category: "megaCapTech" },
    { symbol: "META", label: "Meta", category: "megaCapTech" },
    { symbol: "GOOGL", label: "Alphabet", category: "megaCapTech" },
  ],
  chipAi: [
    { symbol: "AMD", label: "AMD", category: "chipAi" },
    { symbol: "INTC", label: "Intel", category: "chipAi" },
    { symbol: "AVGO", label: "Broadcom", category: "chipAi" },
    { symbol: "NFLX", label: "Netflix", category: "chipAi" },
    { symbol: "ORCL", label: "Oracle", category: "chipAi" },
    { symbol: "ADBE", label: "Adobe", category: "chipAi" },
    { symbol: "CRM", label: "Salesforce", category: "chipAi" },
  ],
  retailFavorites: [
    { symbol: "PLTR", label: "Palantir", category: "retailFavorites" },
    { symbol: "COIN", label: "Coinbase", category: "retailFavorites" },
    { symbol: "HOOD", label: "Robinhood", category: "retailFavorites" },
    { symbol: "SOFI", label: "SoFi", category: "retailFavorites" },
    { symbol: "MSTR", label: "MicroStrategy", category: "retailFavorites" },
    { symbol: "MARA", label: "Marathon Digital", category: "retailFavorites" },
    { symbol: "RIOT", label: "Riot Platforms", category: "retailFavorites" },
  ],
  finance: [
    { symbol: "JPM", label: "JPMorgan", category: "finance" },
    { symbol: "BAC", label: "Bank of America", category: "finance" },
    { symbol: "V", label: "Visa", category: "finance" },
    { symbol: "MA", label: "Mastercard", category: "finance" },
  ],
  consumer: [
    { symbol: "COST", label: "Costco", category: "consumer" },
    { symbol: "WMT", label: "Walmart", category: "consumer" },
    { symbol: "DIS", label: "Disney", category: "consumer" },
    { symbol: "UBER", label: "Uber", category: "consumer" },
  ],
  healthcare: [
    { symbol: "LLY", label: "Eli Lilly", category: "healthcare" },
    { symbol: "UNH", label: "UnitedHealth", category: "healthcare" },
    { symbol: "PFE", label: "Pfizer", category: "healthcare" },
    { symbol: "ABBV", label: "AbbVie", category: "healthcare" },
  ],
  energy: [
    { symbol: "XOM", label: "Exxon Mobil", category: "energy" },
    { symbol: "CVX", label: "Chevron", category: "energy" },
  ],
  leveragedEtfs: [
    { symbol: "TQQQ", label: "3x Nasdaq bull", category: "leveragedEtfs" },
    { symbol: "SQQQ", label: "3x Nasdaq bear", category: "leveragedEtfs" },
    { symbol: "ARKK", label: "ARK Innovation", category: "leveragedEtfs" },
  ],
  commodities: [
    { symbol: "GLD", label: "Gold", category: "commodities" },
    { symbol: "SLV", label: "Silver", category: "commodities" },
  ],
};

export const TICKER_WATCHLIST: TickerEntry[] = Object.values(POPULAR_WATCHLISTS).flat();