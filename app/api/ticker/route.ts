import { NextRequest, NextResponse } from "next/server"

const BIST_STOCKS: Record<string, string> = {
  "THYAO.IS": "Türk Hava Yolları", "GARAN.IS": "Garanti BBVA",
  "AKBNK.IS": "Akbank", "EREGL.IS": "Ereğli Demir Çelik",
  "SISE.IS": "Şişe Cam", "KCHOL.IS": "Koç Holding",
  "SAHOL.IS": "Sabancı Holding", "TUPRS.IS": "Tüpraş",
  "ASELS.IS": "Aselsan", "BIMAS.IS": "BİM Mağazalar",
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const symbolsStr = searchParams.get("symbols") || "THYAO.IS,GARAN.IS,AKBNK.IS,EREGL.IS,TUPRS.IS,SISE.IS,KCHOL.IS,BIMAS.IS"
  const symbols = symbolsStr.split(",").map((s) => s.trim().toUpperCase()).slice(0, 10)

  try {
    const results = await Promise.all(
      symbols.map(async (sym) => {
        try {
          const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=5d&interval=1d`,
            { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 60 } }
          )
          if (!res.ok) return null
          const json = await res.json()
          const result = json?.chart?.result?.[0]
          const closes: number[] = (result?.indicators?.quote?.[0]?.close || []).filter((v: number) => v != null)
          if (closes.length < 2) return null
          const price = closes[closes.length - 1]
          const prev = closes[closes.length - 2]
          const change_pct = Math.round(((price - prev) / prev) * 100 * 10000) / 10000
          return { symbol: sym, name: BIST_STOCKS[sym] || sym, price: Math.round(price * 100) / 100, change_pct }
        } catch {
          return null
        }
      })
    )

    return NextResponse.json(results.filter(Boolean), { headers: { "Cache-Control": "public, max-age=60" } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
