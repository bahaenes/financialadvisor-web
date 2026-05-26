import { NextRequest, NextResponse } from "next/server"
import type { SentimentLabel } from "@/lib/types"

// ─── Turkish (BIST) sources ───────────────────────────────────────────────────
const TR_RSS_FEEDS = [
  { name: "Bloomberg HT", url: "https://www.bloomberght.com/rss" },
  { name: "Dünya", url: "https://www.dunya.com/rss" },
]

const BIST_SYMBOLS = ["THYAO", "GARAN", "AKBNK", "EREGL", "SISE", "KCHOL", "SAHOL", "TUPRS", "ASELS", "BIMAS", "TCELL", "PGSUS", "TAVHL", "FROTO", "TOASO", "VESTL", "ARCLK", "PETKM", "KOZAL", "ISCTR", "YKBNK", "VAKBN", "HALKB", "TTKOM"]
const TR_POSITIVE = ["artış", "yükseliş", "kar", "büyüme", "pozitif", "güçlü", "rekor", "başarı", "kazanç", "toparlanma", "iyileşme", "rally", "fırsat", "temettü"]
const TR_NEGATIVE = ["düşüş", "kayıp", "zarar", "negatif", "zayıf", "risk", "endişe", "gerileme", "daralma", "kriz", "baskı", "belirsizlik", "çöküş", "borç", "enflasyon"]

// ─── English (NASDAQ / NYSE) sources ─────────────────────────────────────────
const EN_RSS_FEEDS = [
  { name: "MarketWatch", url: "https://feeds.marketwatch.com/marketwatch/topstories/" },
  { name: "Reuters Business", url: "https://feeds.reuters.com/reuters/businessNews" },
  { name: "CNBC Finance", url: "https://www.cnbc.com/id/10000664/device/rss/rss.html" },
]

const US_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "NFLX", "INTC", "AMD", "QCOM", "AVGO", "ADBE", "CRM", "PYPL", "ORCL", "TXN", "AMAT", "MU", "PANW", "JPM", "BAC", "WFC", "GS", "MS", "JNJ", "UNH", "PFE", "XOM", "CVX", "WMT", "HD", "DIS", "KO", "MCD", "NKE", "BA", "GE", "V", "MA"]
const EN_POSITIVE = ["surge", "rally", "beat", "record", "gain", "upgrade", "growth", "strong", "rise", "soar", "bullish", "outperform", "recovery", "profit"]
const EN_NEGATIVE = ["crash", "plunge", "miss", "loss", "downgrade", "risk", "decline", "drop", "selloff", "bearish", "underperform", "recession", "concern", "weak"]

// ─── Sentiment helpers ────────────────────────────────────────────────────────
function trSentiment(text: string): number {
  const words = text.toLowerCase().match(/\w+/g) || []
  let score = 0
  for (let i = 0; i < words.length; i++) {
    const negated = i > 0 && ["değil", "yok", "olmayan"].includes(words[i - 1])
    if (TR_POSITIVE.includes(words[i])) score += negated ? -1 : 1
    if (TR_NEGATIVE.includes(words[i])) score += negated ? 1 : -1
  }
  return Math.max(-1, Math.min(1, score / Math.max(words.length / 10, 1)))
}

function enKeywordSentiment(text: string): number {
  const lower = text.toLowerCase()
  let score = 0
  let matches = 0
  for (const w of EN_POSITIVE) {
    if (lower.includes(w)) { score += 0.6; matches++ }
  }
  for (const w of EN_NEGATIVE) {
    if (lower.includes(w)) { score -= 0.6; matches++ }
  }
  return matches > 0 ? Math.max(-1, Math.min(1, score / matches)) : 0
}

function toLabel(s: number): SentimentLabel {
  return s > 0.05 ? "positive" : s < -0.05 ? "negative" : "neutral"
}

// ─── FinBERT via HuggingFace Inference API ────────────────────────────────────
type HFScore = { label: string; score: number }

async function callFinBERT(texts: string[]): Promise<{ label: SentimentLabel; score: number }[]> {
  const token = process.env.HF_TOKEN
  if (!token || !texts.length) {
    return texts.map(() => ({ label: "neutral" as SentimentLabel, score: 0 }))
  }
  try {
    const res = await fetch("https://api-inference.huggingface.co/models/ProsusAI/finbert", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: texts }),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return texts.map(() => ({ label: "neutral" as SentimentLabel, score: 0 }))
    const raw: HFScore[][] = await res.json()
    return raw.map((scores) => {
      const pos = scores.find((s) => s.label.toLowerCase() === "positive")?.score ?? 0
      const neg = scores.find((s) => s.label.toLowerCase() === "negative")?.score ?? 0
      const top = scores.sort((a, b) => b.score - a.score)[0]
      return {
        label: top.label.toLowerCase() as SentimentLabel,
        score: +(pos - neg).toFixed(4),
      }
    })
  } catch {
    return texts.map(() => ({ label: "neutral" as SentimentLabel, score: 0 }))
  }
}

// ─── Stock symbol extraction ──────────────────────────────────────────────────
function extractStocks(text: string, symbols: string[]): string[] {
  const upper = text.toUpperCase()
  return symbols.filter((sym) => {
    const clean = sym.replace(".IS", "")
    return upper.includes(clean)
  })
}

// ─── HTML stripping ───────────────────────────────────────────────────────────
function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").trim()
}

// ─── RSS parser ───────────────────────────────────────────────────────────────
async function parseRSS(name: string, url: string) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 600 } })
    if (!res.ok) return []
    const text = await res.text()
    const items: { title: string; link: string; description: string; pubDate: string; name: string }[] = []
    const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g)
    for (const match of itemMatches) {
      const content = match[1]
      const title = stripTags(content.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || "")
      const link = (content.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1] || "").trim()
      const description = stripTags(content.match(/<description[^>]*>([\s\S]*?)<\/description>/)?.[1] || "")
      const pubDate = (content.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1] || "").trim()
      if (title) items.push({ title, link, description, pubDate, name })
      if (items.length >= 8) break
    }
    return items
  } catch {
    return []
  }
}

// ─── Finnhub market news ──────────────────────────────────────────────────────
type FinnhubNewsItem = {
  headline: string
  summary: string
  url: string
  source: string
  datetime: number
  image?: string
  related?: string
}

async function fetchFinnhubNews(apiKey: string): Promise<{ title: string; link: string; description: string; pubDate: string; name: string }[]> {
  const res = await fetch(
    `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`,
    { next: { revalidate: 600 } }
  )
  if (!res.ok) throw new Error(`Finnhub news error ${res.status}`)
  const items: FinnhubNewsItem[] = await res.json()
  return items.slice(0, 30).map((item) => ({
    title: item.headline || "",
    link: item.url || "",
    description: item.summary || "",
    pubDate: new Date(item.datetime * 1000).toISOString(),
    name: item.source || "Finnhub",
  })).filter((i) => i.title)
}

// ─── Shared sentiment pipeline ────────────────────────────────────────────────
async function applySentiment(
  items: { title: string; link: string; description: string; pubDate: string; name: string }[],
  symbols: string[],
  useFinBERT: boolean,
) {
  let finbertUsed = false
  let sentimentResults: { label: SentimentLabel; score: number }[] = []

  const texts = items.map((i) => `${i.title}. ${i.description}`.slice(0, 300))

  if (useFinBERT) {
    const batchSize = 10
    const allResults: { label: SentimentLabel; score: number }[] = []
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      const batchResults = await callFinBERT(batch)
      allResults.push(...batchResults)
      if (!finbertUsed && batchResults.some((r) => r.score !== 0)) finbertUsed = true
    }
    sentimentResults = allResults
  } else {
    sentimentResults = items.map((item) => {
      const combined = `${item.title} ${item.description}`
      const score = trSentiment(combined)
      return { label: toLabel(score), score: Math.round(score * 1000) / 1000 }
    })
  }

  const newsItems = items.map((item, idx) => {
    const combined = `${item.title} ${item.description}`
    const { label, score } = sentimentResults[idx] ?? { label: "neutral" as SentimentLabel, score: 0 }
    return {
      title: item.title,
      summary: item.description.slice(0, 300) || item.title,
      url: item.link,
      source: item.name,
      published: item.pubDate,
      sentiment: score,
      sentiment_label: label,
      mentioned_stocks: extractStocks(combined, symbols).slice(0, 5),
      finbert_used: useFinBERT && finbertUsed,
    }
  })

  return { newsItems, finbertUsed }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const market = (searchParams.get("market") || "BIST").toUpperCase()
  const isEnglish = market === "NASDAQ" || market === "NYSE"

  try {
    if (isEnglish) {
      const apiKey = process.env.FINNHUB_API_KEY
      const symbols = US_SYMBOLS

      // Try Finnhub first for English markets
      if (apiKey && apiKey !== "your_finnhub_api_key_here") {
        try {
          const rawItems = await fetchFinnhubNews(apiKey)
          // Deduplicate
          const seen = new Set<string>()
          const unique = rawItems.filter((item) => {
            const key = item.title.slice(0, 50).toLowerCase()
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })

          const { newsItems, finbertUsed } = await applySentiment(unique, symbols, true)
          const avgSentiment = newsItems.length
            ? newsItems.reduce((s, i) => s + i.sentiment, 0) / newsItems.length
            : 0

          return NextResponse.json({
            items: newsItems,
            market_sentiment: Math.round(avgSentiment * 1000) / 1000,
            market_sentiment_label: toLabel(avgSentiment),
            finbert_used: finbertUsed,
          })
        } catch {
          // Fall through to RSS feeds
        }
      }

      // RSS fallback for English
      const results = await Promise.all(EN_RSS_FEEDS.map(({ name, url }) => parseRSS(name, url)))
      const rawItems = results.flat()
      const seen = new Set<string>()
      const unique = rawItems.filter((item) => {
        const key = item.title.slice(0, 50).toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      }).slice(0, 30)

      const { newsItems, finbertUsed } = await applySentiment(unique, symbols, true)
      const avgSentiment = newsItems.length
        ? newsItems.reduce((s, i) => s + i.sentiment, 0) / newsItems.length
        : 0

      return NextResponse.json({
        items: newsItems,
        market_sentiment: Math.round(avgSentiment * 1000) / 1000,
        market_sentiment_label: toLabel(avgSentiment),
        finbert_used: finbertUsed,
      })
    }

    // BIST — Turkish RSS feeds + keyword sentiment
    const results = await Promise.all(TR_RSS_FEEDS.map(({ name, url }) => parseRSS(name, url)))
    const rawItems = results.flat()
    const seen = new Set<string>()
    const unique = rawItems.filter((item) => {
      const key = item.title.slice(0, 50).toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 30)

    const sentimentResults = unique.map((item) => {
      const combined = `${item.title} ${item.description}`
      const score = trSentiment(combined)
      return { label: toLabel(score), score: Math.round(score * 1000) / 1000 }
    })

    const newsItems = unique.map((item, idx) => {
      const combined = `${item.title} ${item.description}`
      const { label, score } = sentimentResults[idx] ?? { label: "neutral" as SentimentLabel, score: 0 }
      return {
        title: item.title,
        summary: item.description.slice(0, 300) || item.title,
        url: item.link,
        source: item.name,
        published: item.pubDate,
        sentiment: score,
        sentiment_label: label,
        mentioned_stocks: extractStocks(combined, BIST_SYMBOLS).slice(0, 5),
        finbert_used: false,
      }
    })

    const avgSentiment = newsItems.length
      ? newsItems.reduce((s, i) => s + i.sentiment, 0) / newsItems.length
      : 0

    return NextResponse.json({
      items: newsItems,
      market_sentiment: Math.round(avgSentiment * 1000) / 1000,
      market_sentiment_label: toLabel(avgSentiment),
      finbert_used: false,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
