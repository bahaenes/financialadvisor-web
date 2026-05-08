import { NextRequest, NextResponse } from "next/server"
// @ts-ignore
import { RSI, MACD, BollingerBands, SMA, EMA, Stochastic, ATR } from "technicalindicators"

const PERIOD_TO_RANGE: Record<string, { range: string; interval: string }> = {
  "5d": { range: "5d", interval: "1d" },
  "1mo": { range: "1mo", interval: "1d" },
  "3mo": { range: "3mo", interval: "1d" },
  "6mo": { range: "6mo", interval: "1d" },
  "1y": { range: "1y", interval: "1d" },
  "3y": { range: "3y", interval: "1wk" },
}

function safe(v: number): number | null {
  if (!isFinite(v) || isNaN(v)) return null
  return Math.round(v * 10000) / 10000
}

function padStart<T>(arr: T[], length: number, fill: T): T[] {
  const padding = Array(Math.max(0, length - arr.length)).fill(fill)
  return [...padding, ...arr]
}

function computeSignals(closes: number[], rsiArr: (number | null)[], macdArr: { MACD?: number; signal?: number; histogram?: number }[], bbArr: { upper?: number; lower?: number }[], sma50: (number | null)[], sma200: (number | null)[], stochK: (number | null)[], stochD: (number | null)[]) {
  const scores: [number, number][] = []
  const details: Record<string, string> = {}

  // RSI
  const lastRsi = rsiArr[rsiArr.length - 1]
  if (lastRsi != null) {
    if (lastRsi < 35) { scores.push([1.0, 0.25]); details.rsi_signal = "OVERSOLD" }
    else if (lastRsi > 65) { scores.push([-1.0, 0.25]); details.rsi_signal = "OVERBOUGHT" }
    else { scores.push([(50 - lastRsi) / 50, 0.25]); details.rsi_signal = "NEUTRAL" }
  }

  // MACD
  const lastMacd = macdArr[macdArr.length - 1]
  const prevMacd = macdArr[macdArr.length - 2]
  if (lastMacd?.MACD != null && lastMacd?.signal != null) {
    const diff = lastMacd.MACD - lastMacd.signal
    const prevDiff = (prevMacd?.MACD ?? 0) - (prevMacd?.signal ?? 0)
    if (diff > 0 && prevDiff <= 0) { scores.push([1.0, 0.25]); details.macd_signal = "BULLISH_CROSS" }
    else if (diff < 0 && prevDiff >= 0) { scores.push([-1.0, 0.25]); details.macd_signal = "BEARISH_CROSS" }
    else if (diff > 0) { scores.push([0.5, 0.25]); details.macd_signal = "BULLISH" }
    else { scores.push([-0.5, 0.25]); details.macd_signal = "BEARISH" }
  }

  // Bollinger
  const lastBb = bbArr[bbArr.length - 1]
  const lastClose = closes[closes.length - 1]
  if (lastBb?.upper != null && lastBb?.lower != null) {
    const range = lastBb.upper - lastBb.lower
    if (range > 0) {
      const pos = (lastClose - lastBb.lower) / range
      if (pos < 0.2) { scores.push([1.0, 0.20]); details.bb_signal = "NEAR_LOWER" }
      else if (pos > 0.8) { scores.push([-1.0, 0.20]); details.bb_signal = "NEAR_UPPER" }
      else { scores.push([0.0, 0.20]); details.bb_signal = "NEUTRAL" }
    }
  }

  // MA
  const s50 = sma50[sma50.length - 1]
  const s200 = sma200[sma200.length - 1]
  if (s50 != null && s200 != null) {
    if (lastClose > s50 && s50 > s200) { scores.push([1.0, 0.15]); details.ma_signal = "STRONG_BULLISH" }
    else if (lastClose > s50) { scores.push([0.5, 0.15]); details.ma_signal = "BULLISH" }
    else if (lastClose < s50 && s50 < s200) { scores.push([-1.0, 0.15]); details.ma_signal = "STRONG_BEARISH" }
    else { scores.push([-0.5, 0.15]); details.ma_signal = "BEARISH" }
  }

  // Stochastic
  const lk = stochK[stochK.length - 1]
  const ld = stochD[stochD.length - 1]
  if (lk != null && ld != null) {
    if (lk < 25 && ld < 25) { scores.push([1.0, 0.15]); details.stoch_signal = "OVERSOLD" }
    else if (lk > 75 && ld > 75) { scores.push([-1.0, 0.15]); details.stoch_signal = "OVERBOUGHT" }
    else if (lk > ld) { scores.push([0.4, 0.15]); details.stoch_signal = "BULLISH" }
    else { scores.push([-0.4, 0.15]); details.stoch_signal = "BEARISH" }
  }

  if (!scores.length) return { overall: "TUT", score: 0.5, rsi_signal: "N/A", macd_signal: "N/A", bb_signal: "N/A", ma_signal: "N/A", stoch_signal: "N/A" }

  const totalWeight = scores.reduce((s, [, w]) => s + w, 0)
  const weighted = scores.reduce((s, [v, w]) => s + v * w, 0) / totalWeight
  const overall = weighted > 0.15 ? "AL" : weighted < -0.15 ? "SAT" : "TUT"

  return {
    overall,
    score: Math.round(((weighted + 1) / 2) * 1000) / 1000,
    rsi_signal: details.rsi_signal || "N/A",
    macd_signal: details.macd_signal || "N/A",
    bb_signal: details.bb_signal || "N/A",
    ma_signal: details.ma_signal || "N/A",
    stoch_signal: details.stoch_signal || "N/A",
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") || "THYAO.IS").toUpperCase()
  const period = searchParams.get("period") || "1y"

  try {
    const { range, interval } = PERIOD_TO_RANGE[period] || PERIOD_TO_RANGE["1y"]
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 300 } })
    if (!res.ok) throw new Error(`Yahoo error ${res.status}`)

    const json = await res.json()
    const result = json?.chart?.result?.[0]
    if (!result) throw new Error("No chart data")

    const timestamps: number[] = result.timestamp || []
    const quote = result.indicators?.quote?.[0] || {}
    const opens: number[] = (quote.open || []).map((v: number) => v ?? 0)
    const highs: number[] = (quote.high || []).map((v: number) => v ?? 0)
    const lows: number[] = (quote.low || []).map((v: number) => v ?? 0)
    const closes: number[] = (quote.close || []).map((v: number) => v ?? 0)
    const volumes: number[] = (quote.volume || []).map((v: number) => v ?? 0)
    const dates = timestamps.map((ts) => new Date(ts * 1000).toISOString().split("T")[0])
    const n = dates.length

    // RSI
    const rsiRaw: number[] = RSI.calculate({ values: closes, period: 14 })
    const rsiPadded: (number | null)[] = padStart<number | null>(rsiRaw, n, null)
    const rsiSeries = dates.map((t, i) => rsiPadded[i] != null ? { time: t, value: safe(rsiPadded[i] as number) } : null).filter(Boolean) as { time: string; value: number | null }[]

    // MACD
    const macdRaw = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false })
    const macdPadded = padStart<{ MACD?: number; signal?: number; histogram?: number } | null>(macdRaw, n, null)
    const macdSeries = dates.map((t, i) => {
      const d = macdPadded[i]
      if (!d || d.MACD == null) return null
      return { time: t, macd: safe(d.MACD as number), signal: safe(d.signal as number), histogram: safe(d.histogram as number) }
    }).filter(Boolean) as { time: string; macd: number | null; signal: number | null; histogram: number | null }[]

    // Bollinger Bands
    const bbRaw = BollingerBands.calculate({ values: closes, period: 20, stdDev: 2 })
    const bbPadded = padStart<{ upper?: number; middle?: number; lower?: number } | null>(bbRaw, n, null)
    const bbSeries = dates.map((t, i) => {
      const d = bbPadded[i]
      if (!d || d.upper == null) return null
      return { time: t, upper: safe(d.upper as number), middle: safe(d.middle as number), lower: safe(d.lower as number) }
    }).filter(Boolean) as { time: string; upper: number | null; middle: number | null; lower: number | null }[]

    // SMAs
    const toSeries = (raw: number[], label: string) =>
      padStart<number | null>(raw, n, null).map((v, i) => v != null ? { time: dates[i], value: safe(v) } : null).filter(Boolean) as { time: string; value: number | null }[]

    const sma20 = toSeries(SMA.calculate({ values: closes, period: 20 }), "sma20")
    const sma50Raw: (number | null)[] = padStart<number | null>(SMA.calculate({ values: closes, period: 50 }), n, null)
    const sma50 = sma20.map((_, i) => sma50Raw[i])
    const sma200 = toSeries(SMA.calculate({ values: closes, period: 200 }), "sma200")
    const sma50Series = toSeries(SMA.calculate({ values: closes, period: 50 }), "sma50")
    const ema12 = toSeries(EMA.calculate({ values: closes, period: 12 }), "ema12")
    const ema26 = toSeries(EMA.calculate({ values: closes, period: 26 }), "ema26")

    // Stochastic
    const stochRaw = Stochastic.calculate({ high: highs, low: lows, close: closes, period: 14, signalPeriod: 3 })
    const stochPadded = padStart<{ k?: number; d?: number } | null>(stochRaw, n, null)
    const stochSeries = dates.map((t, i) => {
      const d = stochPadded[i]
      if (!d || d.k == null) return null
      return { time: t, k: safe(d.k as number), d: safe(d.d as number) }
    }).filter(Boolean) as { time: string; k: number | null; d: number | null }[]

    // ATR
    const atrRaw = ATR.calculate({ high: highs, low: lows, close: closes, period: 14 })
    const atrSeries = toSeries(atrRaw, "atr")

    // Signals
    const sma50Padded: (number | null)[] = padStart<number | null>(SMA.calculate({ values: closes, period: 50 }), n, null)
    const sma200Padded: (number | null)[] = padStart<number | null>(SMA.calculate({ values: closes, period: 200 }), n, null)
    const stochKPadded: (number | null)[] = stochPadded.map((d) => d?.k ?? null)
    const stochDPadded: (number | null)[] = stochPadded.map((d) => d?.d ?? null)
    const signals = computeSignals(closes, rsiPadded, macdPadded as any, bbPadded as any, sma50Padded, sma200Padded, stochKPadded, stochDPadded)

    // Support/Resistance
    const window = Math.min(60, n)
    const recentHighs = highs.slice(-window)
    const recentLows = lows.slice(-window)
    const rHigh = Math.max(...recentHighs)
    const rLow = Math.min(...recentLows)
    const pivot = (rHigh + rLow + closes[closes.length - 1]) / 3
    const sr = {
      support: [Math.round((2 * pivot - rHigh) * 100) / 100, Math.round((pivot - (rHigh - rLow)) * 100) / 100],
      resistance: [Math.round((2 * pivot - rLow) * 100) / 100, Math.round((pivot + (rHigh - rLow)) * 100) / 100],
    }

    return NextResponse.json({
      indicators: {
        rsi: rsiSeries,
        macd: macdSeries,
        bollinger: bbSeries,
        sma_20: sma20,
        sma_50: sma50Series,
        sma_200: sma200,
        ema_12: ema12,
        ema_26: ema26,
        stoch: stochSeries,
        atr: atrSeries,
      },
      signals,
      support_resistance: sr,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
