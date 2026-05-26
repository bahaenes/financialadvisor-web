import { NextRequest, NextResponse } from "next/server"
import { BIST_STOCKS, NASDAQ_STOCKS, NYSE_STOCKS } from "@/lib/constants"

const ALL_STOCKS: Record<string, string> = {
  ...BIST_STOCKS,
  ...NASDAQ_STOCKS,
  ...NYSE_STOCKS,
}

const PERIOD_TO_YAHOO: Record<string, { range: string; interval: string }> = {
  "5d": { range: "5d", interval: "1d" },
  "1mo": { range: "1mo", interval: "1d" },
  "3mo": { range: "3mo", interval: "1d" },
  "6mo": { range: "6mo", interval: "1d" },
  "1y": { range: "1y", interval: "1d" },
  "3y": { range: "3y", interval: "1wk" },
}

// Days back and Finnhub resolution per period
const PERIOD_TO_FINNHUB: Record<string, { days: number; resolution: string }> = {
  "5d": { days: 7, resolution: "D" },
  "1mo": { days: 30, resolution: "D" },
  "3mo": { days: 90, resolution: "D" },
  "6mo": { days: 180, resolution: "D" },
  "1y": { days: 365, resolution: "D" },
  "3y": { days: 1095, resolution: "W" },
}

function safe(v: number | null | undefined): number | null {
  if (v == null || !isFinite(v) || isNaN(v)) return null
  return Math.round(v * 10000) / 10000
}

function detectMarket(symbol: string): { market: string; currency: string } {
  if (symbol.endsWith(".IS")) return { market: "BIST", currency: "TRY" }
  if (NASDAQ_STOCKS[symbol]) return { market: "NASDAQ", currency: "USD" }
  if (NYSE_STOCKS[symbol]) return { market: "NYSE", currency: "USD" }
  return { market: "UNKNOWN", currency: "USD" }
}

async function fetchFinnhub(symbol: string, period: string, apiKey: string) {
  const { days, resolution } = PERIOD_TO_FINNHUB[period] || PERIOD_TO_FINNHUB["1y"]
  const now = Math.floor(Date.now() / 1000)
  const from = now - days * 86400

  const BASE = "https://finnhub.io/api/v1"

  const [quoteRes, candleRes, metricRes, profileRes] = await Promise.all([
    fetch(`${BASE}/quote?symbol=${symbol}&token=${apiKey}`, { next: { revalidate: 60 } }),
    fetch(`${BASE}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${now}&token=${apiKey}`, { next: { revalidate: 300 } }),
    fetch(`${BASE}/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`, { next: { revalidate: 86400 } }),
    fetch(`${BASE}/stock/profile2?symbol=${symbol}&token=${apiKey}`, { next: { revalidate: 86400 } }),
  ])

  if (!quoteRes.ok || !candleRes.ok) throw new Error("Finnhub request failed")

  const quote = await quoteRes.json()
  const candles = await candleRes.json()

  // "no_data" means Finnhub doesn't have this symbol — signal fallback
  if (candles.s === "no_data" || !candles.t?.length) {
    throw new Error("no_data")
  }

  const metric = metricRes.ok ? (await metricRes.json()).metric ?? {} : {}
  const profile = profileRes.ok ? await profileRes.json() : {}

  const ohlcv = (candles.t as number[]).map((ts: number, i: number) => ({
    time: new Date(ts * 1000).toISOString().split("T")[0],
    open: safe(candles.o[i]),
    high: safe(candles.h[i]),
    low: safe(candles.l[i]),
    close: safe(candles.c[i]),
    volume: candles.v?.[i] ?? 0,
  })).filter((b) => b.close != null)

  return {
    price: safe(quote.c),
    change: safe(quote.d),
    change_pct: safe(quote.dp),
    volume: candles.v?.[candles.v.length - 1] ?? 0,
    market_cap: profile.marketCapitalization ? safe(profile.marketCapitalization * 1_000_000) : null,
    pe_ratio: safe(metric["peAnnual"] ?? metric["peTTM"]),
    dividend_yield: safe(metric["dividendYieldAnnual"] != null ? metric["dividendYieldAnnual"] / 100 : null),
    beta: safe(metric["beta"]),
    week_52_high: safe(metric["52WeekHigh"]),
    week_52_low: safe(metric["52WeekLow"]),
    ohlcv,
  }
}

async function fetchYahoo(symbol: string, period: string) {
  const { range, interval } = PERIOD_TO_YAHOO[period] || PERIOD_TO_YAHOO["1y"]
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`Yahoo Finance error ${res.status}`)
  const json = await res.json()
  const result = json?.chart?.result?.[0]
  if (!result) throw new Error("No data returned")

  const timestamps: number[] = result.timestamp || []
  const quote = result.indicators?.quote?.[0] || {}
  const opens: number[] = quote.open || []
  const highs: number[] = quote.high || []
  const lows: number[] = quote.low || []
  const closes: number[] = quote.close || []
  const volumes: number[] = quote.volume || []

  const ohlcv = timestamps.map((ts, i) => ({
    time: new Date(ts * 1000).toISOString().split("T")[0],
    open: safe(opens[i]),
    high: safe(highs[i]),
    low: safe(lows[i]),
    close: safe(closes[i]),
    volume: volumes[i] ?? 0,
  })).filter((b) => b.close != null)

  const meta = result.meta || {}
  const currentPrice = safe(meta.regularMarketPrice) ?? safe(closes[closes.length - 1])
  const prevClose = safe(meta.previousClose) ?? safe(closes[closes.length - 2])
  const change = currentPrice != null && prevClose != null ? Math.round((currentPrice - prevClose) * 10000) / 10000 : 0
  const changePct = prevClose ? Math.round(((change / prevClose) * 100) * 10000) / 10000 : 0

  let fundamentals: Record<string, number | null> = {}
  try {
    const summaryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=summaryDetail,defaultKeyStatistics`
    const summaryRes = await fetch(summaryUrl, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 86400 } })
    if (summaryRes.ok) {
      const summaryJson = await summaryRes.json()
      const sd = summaryJson?.quoteSummary?.result?.[0]?.summaryDetail || {}
      fundamentals = {
        market_cap: safe(sd.marketCap?.raw),
        pe_ratio: safe(sd.trailingPE?.raw),
        dividend_yield: safe(sd.dividendYield?.raw),
        beta: safe(sd.beta?.raw),
        week_52_high: safe(sd.fiftyTwoWeekHigh?.raw),
        week_52_low: safe(sd.fiftyTwoWeekLow?.raw),
      }
    }
  } catch { /* fundamentals optional */ }

  return {
    price: currentPrice,
    change,
    change_pct: changePct,
    volume: volumes[volumes.length - 1] ?? 0,
    ...fundamentals,
    ohlcv,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") || "THYAO.IS").toUpperCase()
  const period = searchParams.get("period") || "1y"

  if (!ALL_STOCKS[symbol]) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 400 })
  }

  const { market, currency } = detectMarket(symbol)
  const apiKey = process.env.FINNHUB_API_KEY
  const isBist = symbol.endsWith(".IS")

  try {
    // Try Finnhub first for all symbols when key is available
    if (apiKey && apiKey !== "your_finnhub_api_key_here") {
      try {
        const data = await fetchFinnhub(symbol, period, apiKey)
        return NextResponse.json({
          symbol,
          name: ALL_STOCKS[symbol],
          currency,
          market,
          ...data,
        })
      } catch (err) {
        // Fall through to Yahoo Finance if no_data or network error
        const msg = err instanceof Error ? err.message : ""
        if (!msg.includes("no_data") && !isBist) {
          // Only re-throw non-coverage errors for non-BIST if Finnhub explicitly failed
        }
        // Fall through to Yahoo Finance
      }
    }

    // Yahoo Finance fallback
    const data = await fetchYahoo(symbol, period)
    return NextResponse.json({
      symbol,
      name: ALL_STOCKS[symbol],
      currency,
      market,
      ...data,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
