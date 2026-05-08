import { NextResponse } from "next/server"

const BIST_SECTORS: Record<string, string[]> = {
  "Bankacılık": ["GARAN.IS", "AKBNK.IS", "ISCTR.IS", "YKBNK.IS", "VAKBN.IS", "HALKB.IS"],
  "Havacılık": ["THYAO.IS", "PGSUS.IS", "TAVHL.IS"],
  "Enerji": ["TUPRS.IS", "PETKM.IS"],
  "Holding": ["KCHOL.IS", "SAHOL.IS"],
  "Savunma": ["ASELS.IS"],
  "Perakende": ["BIMAS.IS"],
  "Telekom": ["TCELL.IS", "TTKOM.IS"],
  "Otomotiv": ["FROTO.IS", "TOASO.IS"],
  "Demir-Çelik": ["EREGL.IS"],
  "Cam": ["SISE.IS"],
  "Madencilik": ["KOZAL.IS", "KOZAA.IS"],
  "Kimya": ["SASA.IS", "HEKTS.IS"],
  "GYO": ["EKGYO.IS"],
  "İnşaat": ["ENKAI.IS"],
  "Gübre": ["GUBRF.IS"],
}

async function getForex(base: string, target: string) {
  try {
    const [todayRes, yesterdayRes] = await Promise.all([
      fetch(`https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${target}`, { next: { revalidate: 3600 } }),
      fetch(`https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${target}`, { next: { revalidate: 3600 } }),
    ])
    const today = await todayRes.json()
    const rate: number = today.rates[target]
    const yesterday = await yesterdayRes.json()
    const prevRate: number = yesterday.rates[target]
    const change_pct = prevRate ? Math.round(((rate - prevRate) / prevRate) * 100 * 10000) / 10000 : 0
    return { rate: Math.round(rate * 10000) / 10000, change_pct }
  } catch {
    return { rate: null, change_pct: 0 }
  }
}

async function getYahooQuote(symbol: string) {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const json = await res.json()
    const result = json?.chart?.result?.[0]
    const closes: number[] = result?.indicators?.quote?.[0]?.close || []
    const valid = closes.filter((v) => v != null && isFinite(v))
    if (valid.length < 2) return null
    const current = valid[valid.length - 1]
    const prev = valid[valid.length - 2]
    return { value: Math.round(current * 100) / 100, change_pct: Math.round(((current - prev) / prev) * 100 * 10000) / 10000 }
  } catch {
    return null
  }
}

async function getFearGreed() {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", { next: { revalidate: 3600 } })
    const json = await res.json()
    const item = json.data[0]
    return { value: parseInt(item.value), classification: item.value_classification }
  } catch {
    return { value: 50, classification: "Neutral" }
  }
}

async function getSectorPerformance(usdTry: number | null) {
  const result: Record<string, number> = {}
  const allSymbols = [...new Set(Object.values(BIST_SECTORS).flat())]

  try {
    const quotes = await Promise.all(
      allSymbols.map(async (sym) => {
        const q = await getYahooQuote(sym)
        return [sym, q?.change_pct ?? null] as [string, number | null]
      })
    )
    const quoteMap = Object.fromEntries(quotes.filter(([, v]) => v != null))

    for (const [sector, symbols] of Object.entries(BIST_SECTORS)) {
      const pcts = symbols.map((s) => quoteMap[s]).filter((v): v is number => v != null)
      result[sector] = pcts.length ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 100) / 100 : 0
    }
  } catch {
    for (const sector of Object.keys(BIST_SECTORS)) result[sector] = 0
  }
  return result
}

export async function GET() {
  try {
    const [usdTry, eurTry, bist100, bist30, goldUsd, fearGreed] = await Promise.all([
      getForex("USD", "TRY"),
      getForex("EUR", "TRY"),
      getYahooQuote("XU100.IS"),
      getYahooQuote("XU030.IS"),
      getYahooQuote("GC=F"),
      getFearGreed(),
    ])

    const goldTryPrice = goldUsd?.value && usdTry.rate ? Math.round(goldUsd.value * usdTry.rate * 100) / 100 : null
    const goldTryChangePct = goldUsd?.change_pct ?? 0

    const sectorPerformance = await getSectorPerformance(usdTry.rate)

    return NextResponse.json({
      usd_try: usdTry,
      eur_try: eurTry,
      gold_try: { price: goldTryPrice, change_pct: goldTryChangePct },
      bist100: bist100 || { value: null, change_pct: 0 },
      bist30: bist30 || { value: null, change_pct: 0 },
      fear_greed: fearGreed,
      sector_performance: sectorPerformance,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
