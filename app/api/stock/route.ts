import { NextRequest, NextResponse } from "next/server"
import { BIST_STOCKS, NASDAQ_STOCKS, NYSE_STOCKS } from "@/lib/constants"

const ALL_STOCKS: Record<string, string> = {
  ...BIST_STOCKS,
  ...NASDAQ_STOCKS,
  ...NYSE_STOCKS,
}

const PERIOD_TO_RANGE: Record<string, { range: string; interval: string }> = {
  "5d": { range: "5d", interval: "1d" },
  "1mo": { range: "1mo", interval: "1d" },
  "3mo": { range: "3mo", interval: "1d" },
  "6mo": { range: "6mo", interval: "1d" },
  "1y": { range: "1y", interval: "1d" },
  "3y": { range: "3y", interval: "1wk" },
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") || "THYAO.IS").toUpperCase()
  const period = searchParams.get("period") || "1y"

  if (!ALL_STOCKS[symbol]) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 400 })
  }

  const { market, currency } = detectMarket(symbol)

  try {
    const { range, interval } = PERIOD_TO_RANGE[period] || PERIOD_TO_RANGE["1y"]
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

    // Fetch fundamentals
    let fundamentals: Record<string, number | null> = {}
    try {
      const summaryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=summaryDetail,defaultKeyStatistics`
      const summaryRes = await fetch(summaryUrl, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 86400 } })
      if (summaryRes.ok) {
        const summaryJson = await summaryRes.json()
        const sd = summaryJson?.quoteSummary?.result?.[0]?.summaryDetail || {}
        const ks = summaryJson?.quoteSummary?.result?.[0]?.defaultKeyStatistics || {}
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

    return NextResponse.json({
      symbol,
      name: ALL_STOCKS[symbol],
      price: currentPrice,
      change,
      change_pct: changePct,
      volume: volumes[volumes.length - 1] ?? 0,
      currency,
      market,
      ...fundamentals,
      ohlcv,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
