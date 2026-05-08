import type { Messages } from "./tr"

export const en: Messages = {
  // App
  appTitle: "Financial Advisor",
  appSubtitle: "Advisor",

  // Header
  marketOpen: "Market Open",
  marketClosed: "Market Closed",
  marketStatusBist: "Borsa Istanbul",
  marketStatusNasdaq: "NASDAQ",
  marketStatusNyse: "NYSE",

  // Market selector
  marketLabel: "Market",
  marketBist: "BIST",
  marketNasdaq: "NASDAQ",
  marketNyse: "NYSE",

  // Sidebar
  period: "Period",
  searchPlaceholder: "Search stocks...",
  allSectors: "All Sectors",
  watchlistCount: (n: number) => `${n} stock${n !== 1 ? "s" : ""} in watchlist`,
  noStockFound: "No stocks found",

  // Periods
  period1H: "1H",
  period1D: "1D",
  period1W: "1W",
  period3M: "3M",
  period6M: "6M",
  period1Y: "1Y",
  period3Y: "3Y",

  // Tabs
  tabOverview: "Overview",
  tabTechnical: "Technical",
  tabMacro: "Macro",
  tabNews: "News",
  tabComparison: "Comparison",
  tabPortfolio: "Portfolio",
  tabWatchlist: "Watchlist",

  // Dashboard
  loadingData: "Loading data...",
  refresh: "Refresh",
  dataLoadError: "Failed to load data",
  dataLoadErrorSub: "Please check your internet connection or refresh",

  // Overview panel
  signalDetail: "Signal Detail",
  movingAvg: "Moving Avg.",
  volume: "Volume",
  marketCap: "Market Cap",
  peRatio: "P/E Ratio",
  rsi14: "RSI (14)",
  beta: "Beta",
  oversold: "Oversold",
  overbought: "Overbought",
  neutral: "Neutral",
  highVolatility: "High Volatility",
  lowVolatility: "Low Volatility",
  week52Range: "52-Week Range",
  current: "Current:",
  supportResistance: "Support & Resistance",
  support: "Support",
  resistance: "Resistance",
  dividend: "Dividend",

  // Signal labels
  signalBuy: "BUY",
  signalSell: "SELL",
  signalHold: "HOLD",
  signalStrongBuy: "STRONG BUY",
  signalStrongSell: "STRONG SELL",

  // Technical panel
  indicators: "Indicators:",
  signal: "Signal:",
  loadingChart: "Loading chart...",
  calculatingIndicators: "Calculating indicators...",
  technicalSummary: "Technical Analysis Summary",

  // News panel
  marketSentimentIndex: "Market Sentiment Index",
  newsAnalyzed: (n: number) => `${n} article${n !== 1 ? "s" : ""} analyzed`,
  sentimentDistribution: "Sentiment Distribution",
  sentimentPositive: "Positive",
  sentimentNegative: "Negative",
  sentimentNeutral: "Neutral",
  loadingNews: "Loading news...",
  newsLoadError: "Failed to load news",
  finbertBadge: "FinBERT",

  // Macro panel
  bistIndices: "BIST Indices",
  usIndices: "US Indices",
  forexCommodities: "Forex & Commodities",
  forexRates: "Forex Rates",
  fearGreed: "Fear & Greed Index",
  extremeGreed: "Extreme Greed",
  greed: "Greed",
  fearNeutral: "Neutral",
  fear: "Fear",
  extremeFear: "Extreme Fear",
  cryptoSentiment: "Overall crypto market sentiment index",
  macroLoadError: "Failed to load macro data",
  sectorPerf: "Sector Performance (Daily %)",

  // AI Prediction panel
  tabPrediction: "AI Forecast",
  aiPrediction: "AI Price Forecast",
  prediction7d: "7-day forecast",
  currentPrice: "Current Price",
  predictedPrice: "Predicted Price",
  confidenceLabel: "Confidence",
  confidenceHigh: "High",
  confidenceMedium: "Medium",
  confidenceLow: "Low",
  forecastChart: "Price Forecast Chart",
  historical: "Historical",
  predicted: "Predicted",
  confidenceBand: "Confidence Band",
  predictionLoadError: "Could not load prediction",
  predictionDisclaimer: "These predictions are not investment advice. Based on historical price data; future performance is not guaranteed.",

  // Comparison panel
  compareStocks: "Stocks to Compare",
  yearPerf: "1-Year Performance Comparison",

  // Portfolio
  portfolio: "Portfolio",

  // Watchlist
  watchlist: "Watchlist",
} as const
