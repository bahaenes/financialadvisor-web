import { NextRequest, NextResponse } from "next/server"
import { BIST_STOCKS, NASDAQ_STOCKS, NYSE_STOCKS } from "@/lib/constants"

const ALL_STOCKS: Record<string, string> = { ...BIST_STOCKS, ...NASDAQ_STOCKS, ...NYSE_STOCKS }

async function fetchClosePrices(symbol: string): Promise<number[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=3mo&interval=1d`
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`Yahoo Finance ${res.status}`)
  const json = await res.json()
  const closes: number[] = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
  return closes.filter((v) => v != null && isFinite(v))
}

type ForecastResult = {
  median: number[]
  low: number[]
  high: number[]
  model: "Chronos" | "Statistical"
}

async function callChronos(pastValues: number[], predLen = 7): Promise<ForecastResult | null> {
  const token = process.env.HF_TOKEN
  if (!token) return null

  try {
    const res = await fetch("https://api-inference.huggingface.co/models/amazon/chronos-t5-small", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: [pastValues],
        parameters: { prediction_length: predLen, num_samples: 20 },
      }),
      signal: AbortSignal.timeout(18000),
    })
    if (!res.ok) return null
    const raw = await res.json()

    // Format 1: { prediction: { "0.1": [], "0.5": [], "0.9": [] } }
    if (raw?.prediction) {
      const p = raw.prediction
      const median: number[] = p["0.5"] || p.mean || []
      const low: number[] = p["0.1"] || median.map((v: number) => v * 0.98)
      const high: number[] = p["0.9"] || median.map((v: number) => v * 1.02)
      if (median.length >= predLen)
        return { median: median.slice(0, predLen), low: low.slice(0, predLen), high: high.slice(0, predLen), model: "Chronos" }
    }

    // Format 2: nested samples array [batch][sample][t] or [sample][t]
    let samples: number[][] | null = null
    if (Array.isArray(raw) && Array.isArray(raw[0]) && Array.isArray(raw[0][0])) {
      // [batch][sample][t] — take first batch
      samples = raw[0] as number[][]
    } else if (Array.isArray(raw) && Array.isArray(raw[0]) && typeof raw[0][0] === "number") {
      // [sample][t]
      samples = raw as number[][]
    }

    if (samples && samples.length > 0 && samples[0].length >= predLen) {
      const median = Array.from({ length: predLen }, (_, t) => {
        const vals = samples!.map((s) => s[t]).filter((v) => v != null && isFinite(v)).sort((a, b) => a - b)
        return vals[Math.floor(vals.length / 2)] ?? pastValues[pastValues.length - 1]
      })
      const low = Array.from({ length: predLen }, (_, t) => {
        const vals = samples!.map((s) => s[t]).filter((v) => v != null && isFinite(v)).sort((a, b) => a - b)
        return vals[Math.floor(vals.length * 0.1)] ?? median[t]
      })
      const high = Array.from({ length: predLen }, (_, t) => {
        const vals = samples!.map((s) => s[t]).filter((v) => v != null && isFinite(v)).sort((a, b) => a - b)
        return vals[Math.floor(vals.length * 0.9)] ?? median[t]
      })
      return { median, low, high, model: "Chronos" }
    }

    return null
  } catch {
    return null
  }
}

function statisticalForecast(prices: number[], days: number): ForecastResult {
  const n = prices.length
  // Double exponential smoothing (Holt's method)
  const alpha = 0.2
  const beta = 0.1
  let level = prices[0]
  let trend = (prices[Math.min(n - 1, 4)] - prices[0]) / Math.min(n - 1, 4)

  for (let i = 1; i < n; i++) {
    const prevLevel = level
    level = alpha * prices[i] + (1 - alpha) * (level + trend)
    trend = beta * (level - prevLevel) + (1 - beta) * trend
  }

  // Historical volatility from log-returns
  const logReturns = prices.slice(1).map((p, i) => Math.log(p / prices[i]))
  const recent = logReturns.slice(-20)
  const mu = recent.reduce((a, b) => a + b, 0) / recent.length
  const sigma = Math.sqrt(recent.reduce((a, b) => a + (b - mu) ** 2, 0) / recent.length)

  const median = Array.from({ length: days }, (_, i) => level + trend * (i + 1))
  const low = median.map((v, i) => v * Math.exp(-sigma * Math.sqrt(i + 1) * 1.645))
  const high = median.map((v, i) => v * Math.exp(sigma * Math.sqrt(i + 1) * 1.645))

  return { median, low, high, model: "Statistical" }
}

type SignalLabel = "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL"

function getSignal(current: number, predicted7d: number, volatility: number): {
  label: SignalLabel
  returnPct: number
  confidence: "high" | "medium" | "low"
} {
  const returnPct = ((predicted7d - current) / current) * 100
  // Adjust thresholds based on asset volatility
  const thresh = Math.max(1.5, Math.min(volatility * 30, 5))

  let label: SignalLabel
  if (returnPct > thresh * 2) label = "STRONG_BUY"
  else if (returnPct > thresh * 0.7) label = "BUY"
  else if (returnPct > -thresh * 0.7) label = "HOLD"
  else if (returnPct > -thresh * 2) label = "SELL"
  else label = "STRONG_SELL"

  const absReturn = Math.abs(returnPct)
  const confidence = absReturn > thresh * 1.5 ? "high" : absReturn > thresh * 0.5 ? "medium" : "low"

  return { label, returnPct: Math.round(returnPct * 100) / 100, confidence }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") || "THYAO.IS").toUpperCase()

  if (!ALL_STOCKS[symbol]) return NextResponse.json({ error: "Invalid symbol" }, { status: 400 })

  try {
    const prices = await fetchClosePrices(symbol)
    if (prices.length < 10) throw new Error("Not enough price data")

    const logReturns = prices.slice(1).map((p, i) => Math.log(p / prices[i]))
    const recent = logReturns.slice(-20)
    const mu = recent.reduce((a, b) => a + b, 0) / recent.length
    const sigma = Math.sqrt(recent.reduce((a, b) => a + (b - mu) ** 2, 0) / recent.length)

    const chronos = await callChronos(prices.slice(-64), 7)
    const forecast = chronos ?? statisticalForecast(prices, 7)

    const currentPrice = prices[prices.length - 1]
    const predictedPrice7d = forecast.median[forecast.median.length - 1]
    const { label, returnPct, confidence } = getSignal(currentPrice, predictedPrice7d, sigma)

    return NextResponse.json({
      symbol,
      current_price: currentPrice,
      predicted_prices: forecast.median,
      predicted_low: forecast.low,
      predicted_high: forecast.high,
      predicted_return_pct: returnPct,
      predicted_price_7d: predictedPrice7d,
      signal: label,
      confidence,
      horizon_days: 7,
      model_used: forecast.model,
      history: prices.slice(-30),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
