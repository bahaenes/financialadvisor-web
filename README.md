# Financial Advisor Web

A full-stack financial dashboard for BIST, NASDAQ, and NYSE markets, featuring real-time market data, technical analysis, AI-powered price forecasting, and news sentiment analysis. Supports Turkish and English interfaces.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.x-3776ab?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000?style=flat-square)

---

## Overview

Financial Advisor Web is a multi-market investment dashboard that aggregates live stock data from Yahoo Finance, computes a comprehensive set of technical indicators, and generates 7-day price forecasts using Amazon Chronos (a transformer-based time-series model served through HuggingFace Inference API) with a statistical fallback. News articles are analyzed for sentiment using FinBERT. The application covers three exchanges — Borsa Istanbul (BIST), NASDAQ, and NYSE — and automatically switches the interface language between Turkish and English depending on the selected market.

---

## Features

### Market Data
- Real-time price, change, and percentage change for individual stocks
- OHLCV candlestick history with configurable periods (1 hour to 3 years)
- Key fundamentals: market cap, P/E ratio, dividend yield, beta, 52-week high/low
- Live ticker bar with streaming quote updates
- Macro panel: USD/TRY, EUR/TRY, Gold/TRY rates; BIST 100 and BIST 30 index levels; CNN Fear & Greed index; sector performance heatmap

### Technical Analysis
- Indicators: RSI, MACD, Bollinger Bands, SMA (20 / 50 / 200), EMA (12 / 26), Stochastic (%K/%D), ATR
- Composite signal engine producing an overall Buy / Sell / Hold rating with a numeric score
- Support and resistance level detection
- Interactive candlestick and sparkline charts powered by lightweight-charts (TradingView)

### AI and Predictions
- 7-day price forecast with median, lower (10th percentile), and upper (90th percentile) confidence bands
- Primary model: Amazon Chronos T5-Small via HuggingFace Inference API
- Fallback model: Holt's double exponential smoothing with historical volatility-adjusted confidence intervals
- Signal classification: STRONG BUY / BUY / HOLD / SELL / STRONG SELL with confidence level (high / medium / low)

### News and Sentiment
- Financial news aggregation filtered by market
- Per-article sentiment scoring using FinBERT (English markets) and a rule-based classifier (Turkish market)
- Aggregate market sentiment score and label
- Mentioned stock extraction per article

### Portfolio Tools
- Watchlist for tracking selected symbols
- Portfolio panel with position entry (symbol, quantity, buy price, buy date)
- Enriched positions: current value, cost basis, unrealized P&L, and P&L percentage
- Stock comparison panel for side-by-side analysis

---

## Tech Stack

### Frontend
| Dependency | Role |
|---|---|
| Next.js 16 (App Router) | Framework, routing, server-side rendering |
| React 19 | UI layer |
| TypeScript 5 | Static typing |
| Tailwind CSS v4 | Utility-first styling |
| shadcn/ui + Base UI | Accessible component primitives |
| lightweight-charts | Candlestick and line charts |
| Zustand | Global client state (market, language, portfolio) |
| SWR | Data fetching and cache invalidation |
| technicalindicators | Client-side indicator computation |
| lucide-react | Icon set |

### Backend and Infrastructure
| Dependency | Role |
|---|---|
| Next.js API Routes | Stock prediction, ticker proxy |
| Python serverless functions (Vercel) | Stock data, technical analysis, news, macro data |
| yfinance | Yahoo Finance data source |
| pandas / numpy | Data wrangling |
| ta | Python technical indicator library |
| HuggingFace Inference API | Amazon Chronos (forecasting) and FinBERT (sentiment) |
| Vercel | Hosting, serverless function runtime |

---

## Project Structure

```
financialadvisor-web/
├── app/
│   ├── api/                  # Next.js API routes
│   │   ├── predict/          # 7-day AI price forecast
│   │   ├── stock/            # Stock data proxy
│   │   ├── technical/        # Technical indicator computation
│   │   ├── news/             # News and sentiment
│   │   ├── macro/            # Macro economic data
│   │   └── ticker/           # Live ticker quotes
│   ├── screens/              # Screenshot showcase page
│   ├── layout.tsx
│   └── page.tsx              # Application entry point
├── api/                      # Python serverless functions (Vercel)
│   ├── stock.py
│   ├── technical.py
│   ├── news.py
│   ├── macro.py
│   ├── ticker.py
│   └── requirements.txt
├── components/
│   ├── cards/                # MetricCard, StockCard, SignalBadge
│   ├── charts/               # CandlestickChart, SparklineChart, HeatmapChart, IndicatorPanel
│   ├── layout/               # Header, Sidebar, TickerBar, LanguageMarketBar
│   ├── panels/               # OverviewPanel, TechnicalPanel, PredictionPanel,
│   │                         # NewsPanel, MacroPanel, PortfolioPanel,
│   │                         # WatchlistPanel, ComparisonPanel
│   ├── ui/                   # shadcn/ui primitives
│   └── Dashboard.tsx         # Root layout orchestrator
├── lib/
│   ├── api.ts                # Typed fetch helpers for all endpoints
│   ├── constants.ts          # Stock lists, sector maps, market config
│   ├── types.ts              # Shared TypeScript interfaces
│   ├── i18n.ts               # Language context and useT hook
│   └── utils.ts              # Formatting and utility functions
├── messages/
│   ├── en.ts                 # English translations
│   └── tr.ts                 # Turkish translations
└── store/
    └── appStore.ts           # Zustand store (market, language, watchlist, portfolio)
```

---

## Getting Started

### Prerequisites
- Node.js 18 or later
- npm
- A HuggingFace account with a free API token (required for Chronos forecasting and FinBERT sentiment on English markets)

### Environment Variables

Create a `.env.local` file in the project root:

```env
# HuggingFace API token — obtain for free at https://huggingface.co/settings/tokens
HF_TOKEN=your_token_here
```

If `HF_TOKEN` is absent, the prediction endpoint falls back to the statistical model and English-market sentiment analysis is disabled.

### Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## API Routes

### Next.js Routes (`/app/api/`)

| Route | Method | Parameters | Description |
|---|---|---|---|
| `/api/predict` | GET | `symbol` | 7-day price forecast with confidence bands and trade signal |
| `/api/stock` | GET | `symbol`, `period` | OHLCV history and fundamental data |
| `/api/technical` | GET | `symbol`, `period` | All technical indicators and composite signal |
| `/api/news` | GET | `market` | News articles with sentiment scores |
| `/api/macro` | GET | — | Forex rates, index levels, Fear & Greed, sector returns |
| `/api/ticker` | GET | `market` | Live quote snapshots for ticker bar |

### Python Serverless Functions (`/api/`)

The same endpoints are also implemented as Python serverless handlers deployed on Vercel, used as the primary data source for stock, technical, news, macro, and ticker data. They are backed by `yfinance` and the `ta` library.

---

## License

This project is for personal and educational use.
