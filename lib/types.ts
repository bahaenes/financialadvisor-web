export interface OHLCVBar {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface SeriesPoint {
  time: string
  value: number
}

export interface MACDPoint {
  time: string
  macd: number
  signal: number
  histogram: number
}

export interface BollingerPoint {
  time: string
  upper: number
  middle: number
  lower: number
}

export interface StochPoint {
  time: string
  k: number | null
  d: number | null
}

export interface TechnicalIndicators {
  rsi: SeriesPoint[]
  macd: MACDPoint[]
  bollinger: BollingerPoint[]
  sma_20: SeriesPoint[]
  sma_50: SeriesPoint[]
  sma_200: SeriesPoint[]
  ema_12: SeriesPoint[]
  ema_26: SeriesPoint[]
  stoch: StochPoint[]
  atr: SeriesPoint[]
}

export interface TechnicalSignals {
  overall: "AL" | "SAT" | "TUT"
  score: number
  rsi_signal: string
  macd_signal: string
  bb_signal: string
  ma_signal: string
  stoch_signal: string
}

export type SentimentLabel = "positive" | "negative" | "neutral"

export interface SupportResistance {
  support: number[]
  resistance: number[]
}

export interface TechnicalData {
  indicators: TechnicalIndicators
  signals: TechnicalSignals
  support_resistance: SupportResistance
}

export interface ForexRate {
  rate: number
  change_pct: number
}

export interface IndexData {
  value: number
  change_pct: number
}

export interface GoldRate {
  price: number | null
  change_pct: number
}

export interface MacroData {
  usd_try: ForexRate
  eur_try: ForexRate
  gold_try: GoldRate
  bist100: IndexData
  bist30: IndexData
  fear_greed: { value: number; classification: string }
  sector_performance: Record<string, number>
}

export interface NewsItem {
  title: string
  summary: string
  url: string
  source: string
  published: string
  sentiment: number
  sentiment_label: SentimentLabel
  mentioned_stocks: string[]
  finbert_used?: boolean
}

export interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  change_pct: number
  volume: number
  market_cap: number | null
  pe_ratio: number | null
  dividend_yield: number | null
  beta: number | null
  week_52_high: number | null
  week_52_low: number | null
  ohlcv: OHLCVBar[]
  currency?: string
  market?: string
}

export interface NewsData {
  items: NewsItem[]
  market_sentiment: number
  market_sentiment_label: string
}

export interface TickerItem {
  symbol: string
  name: string
  price: number
  change_pct: number
}

export interface PortfolioPosition {
  id: string
  symbol: string
  name: string
  quantity: number
  buy_price: number
  buy_date: string
  notes?: string
}

export interface PredictionData {
  symbol: string
  current_price: number
  predicted_prices: number[]
  predicted_low: number[]
  predicted_high: number[]
  predicted_return_pct: number
  predicted_price_7d: number
  signal: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL"
  confidence: "high" | "medium" | "low"
  horizon_days: number
  model_used: "Chronos" | "Statistical"
  history: number[]
}

export interface PortfolioPositionEnriched extends PortfolioPosition {
  current_price: number
  current_value: number
  cost_basis: number
  pnl: number
  pnl_pct: number
}
