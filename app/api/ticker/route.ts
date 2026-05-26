import { NextRequest, NextResponse } from "next/server"
import { BIST_STOCKS, NASDAQ_STOCKS, NYSE_STOCKS } from "@/lib/constants"

const ALL_STOCKS: Record<string, string> = {
  ...BIST_STOCKS,
  ...NASDAQ_STOCKS,
  ...NYSE_STOCKS,
}

async function fetchFinnhubQuote(symbol: string, apiKey: string) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
    { next: { revalidate: 60 } }
  )
  if (!res.ok) throw new Error(`Finnhub quote failed for ${symbol}`)
  const q = await res.json()
  if (!q.c) throw new Error("no_data")
  return {
    price: Math.round(q.c * 100) / 100,
    change_pct: Math.round(q.dp * 10000) / 10000,
  }
}

async function fetchYahooQuote(symbol: string) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`,
    { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 60 } }
  )
  if (!res.ok) throw new Error(`Yahoo quote failed for ${symbol}`)
  const json = await res.json()
  const result = json?.chart?.result?.[0]
  const closes: number[] = (result?.indicators?.quote?.[0]?.close || []).filter((v: number) => v != null)
  if (closes.length < 2) throw new Error("insufficient data")
  const price = closes[closes.length - 1]
  const prev = closes[closes.length - 2]
  return {
    price: Math.round(price * 100) / 100,
    change_pct: Math.round(((price - prev) / prev) * 100 * 10000) / 10000,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const symbolsStr = searchParams.get("symbols") || "THYAO.IS,GARAN.IS,AKBNK.IS,EREGL.IS,TUPRS.IS,SISE.IS,KCHOL.IS,BIMAS.IS"
  const symbols = symbolsStr.split(",").map((s) => s.trim().toUpperCase()).slice(0, 20)

  const apiKey = process.env.FINNHUB_API_KEY
  const hasFinnhub = !!apiKey && apiKey !== "your_finnhub_api_key_here"

  try {
    const results = await Promise.all(
      symbols.map(async (sym) => {
        try {
          const isBist = sym.endsWith(".IS")
          let quote: { price: number; change_pct: number }

          if (hasFinnhub && !isBist) {
            try {
              quote = await fetchFinnhubQuote(sym, apiKey!)
            } catch {
              quote = await fetchYahooQuote(sym)
            }
          } else {
            quote = await fetchYahooQuote(sym)
          }

          return {
            symbol: sym,
            name: ALL_STOCKS[sym] || sym,
            price: quote.price,
            change_pct: quote.change_pct,
          }
        } catch {
          return null
        }
      })
    )

    return NextResponse.json(results.filter(Boolean), {
      headers: { "Cache-Control": "public, max-age=60" },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
