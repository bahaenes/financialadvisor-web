"use client"

import { useState } from "react"
import { useAppStore } from "@/store/appStore"
import { useNewsData } from "@/lib/api"
import { useT } from "@/lib/i18n"
import { ExternalLink, TrendingUp, TrendingDown, Minus, AlertTriangle, Cpu, RefreshCw } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { SentimentLabel } from "@/lib/types"

type FeedTab = "all" | "positive" | "negative" | "neutral"

function SentimentGauge({ score }: { score: number }) {
  // score: -1 to +1 → convert to 0–100 gauge angle (0=bearish, 100=bullish)
  const pct = Math.round((score + 1) * 50)
  const angle = -180 + (pct / 100) * 180 // -180° to 0°
  const rad = (angle * Math.PI) / 180
  const cx = 80; const cy = 80; const r = 60
  const nx = cx + r * Math.cos(rad)
  const ny = cy + r * Math.sin(rad)

  const label = score > 0.1 ? "Bullish" : score < -0.1 ? "Bearish" : "Neutral"
  const labelColor = score > 0.1 ? "#00c896" : score < -0.1 ? "#ff4d6a" : "#fbbf24"

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 90" className="w-full max-w-[180px]">
        {/* Track */}
        <path
          d={`M 20 80 A 60 60 0 0 1 140 80`}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="14" strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M 20 80 A 60 60 0 0 1 ${nx.toFixed(1)} ${ny.toFixed(1)}`}
          fill="none" stroke={labelColor} strokeWidth="14" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${labelColor}66)` }}
        />
        {/* Needle dot */}
        <circle cx={nx.toFixed(1)} cy={ny.toFixed(1)} r="5" fill={labelColor} />
        {/* Score text */}
        <text x="80" y="70" textAnchor="middle" fontSize="22" fontWeight="700" fill={labelColor} fontFamily="var(--font-hanken)">
          {pct}
        </text>
        <text x="80" y="82" textAnchor="middle" fontSize="8" fill="rgba(148,163,184,0.8)" letterSpacing="0.1em">
          {label.toUpperCase()}
        </text>
      </svg>
    </div>
  )
}

export function NewsPanel() {
  const { selectedMarket } = useAppStore()
  const { data: news, isLoading, error, mutate } = useNewsData(selectedMarket)
  const t = useT()
  const [activeTab, setActiveTab] = useState<FeedTab>("all")

  const getSentimentLabel = (label: SentimentLabel): string => {
    if (label === "positive") return t.sentimentPositive
    if (label === "negative") return t.sentimentNegative
    return t.sentimentNeutral
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card p-4">
            <div className="h-3 bg-slate-800/80 rounded-lg w-3/4 mb-2 skeleton" />
            <div className="h-3 bg-slate-800/80 rounded-lg w-1/2 skeleton" />
          </div>
        ))}
      </div>
    )
  }

  if (error || !news) {
    return (
      <div className="glass-card p-6 flex flex-col items-center gap-2 text-slate-500">
        <AlertTriangle className="h-8 w-8 text-amber-500/50" />
        <p className="text-sm">{t.newsLoadError}</p>
      </div>
    )
  }

  const pos = news.items.filter((n) => n.sentiment_label === "positive").length
  const neg = news.items.filter((n) => n.sentiment_label === "negative").length
  const neu = news.items.filter((n) => n.sentiment_label === "neutral").length
  const total = news.items.length || 1

  const trendingStocks = Array.from(
    news.items.flatMap((n) => n.mentioned_stocks).reduce((acc, s) => {
      acc.set(s, (acc.get(s) ?? 0) + 1)
      return acc
    }, new Map<string, number>())
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([s]) => s.replace(".IS", ""))

  const filtered = activeTab === "all"
    ? news.items
    : news.items.filter((n) => n.sentiment_label === activeTab)

  const tabs: { id: FeedTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: total },
    { id: "positive", label: t.sentimentPositive, count: pos },
    { id: "neutral", label: t.sentimentNeutral, count: neu },
    { id: "negative", label: t.sentimentNegative, count: neg },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in">
      {/* ── Left column: gauge + trending ──────────────────────────────────── */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* Sentiment gauge card */}
        <div className="glass-card p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs text-slate-500 font-ibm-plex text-label-sm">{t.marketSentimentIndex}</p>
            {(news as { finbert_used?: boolean }).finbert_used && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                <Cpu className="h-2.5 w-2.5" /> FinBERT
              </span>
            )}
          </div>

          <SentimentGauge score={news.market_sentiment} />

          {/* Market breakdown */}
          <div className="flex justify-between mt-4 pt-4 border-t border-cyan-900/20 text-data-tabular">
            <div className="text-center">
              <span className="block text-xs text-slate-500 mb-1">Bullish</span>
              <span className="text-emerald-400 font-semibold">{pos}</span>
            </div>
            <div className="text-center">
              <span className="block text-xs text-slate-500 mb-1">Neutral</span>
              <span className="text-amber-400 font-semibold">{neu}</span>
            </div>
            <div className="text-center">
              <span className="block text-xs text-slate-500 mb-1">Bearish</span>
              <span className="text-rose-400 font-semibold">{neg}</span>
            </div>
          </div>
        </div>

        {/* Sentiment distribution bars */}
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 font-ibm-plex text-label-sm mb-3">{t.sentimentDistribution}</p>
          <div className="space-y-2">
            {[
              { label: t.sentimentPositive, count: pos, color: "bg-emerald-500" },
              { label: t.sentimentNeutral, count: neu, color: "bg-amber-500" },
              { label: t.sentimentNegative, count: neg, color: "bg-rose-500" },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-16">{label}</span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${(count / total) * 100}%` }} />
                </div>
                <span className="text-xs text-slate-500 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trending stocks */}
        {trendingStocks.length > 0 && (
          <div className="glass-card p-4 flex-grow">
            <p className="text-xs text-slate-500 font-ibm-plex text-label-sm mb-3">Trending Stocks</p>
            <div className="flex flex-wrap gap-2">
              {trendingStocks.map((s) => (
                <span key={s} className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-xs font-ibm-plex text-label-sm text-cyan-400 cursor-pointer hover:border-cyan-400/50 transition-colors">
                  #{s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Right column: news feed ─────────────────────────────────────────── */}
      <div className="lg:col-span-8 glass-card overflow-hidden flex flex-col" style={{ maxHeight: "800px" }}>
        {/* Feed header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-900/20 bg-slate-900/50">
          <h2 className="font-hanken text-headline-md text-white">
            {t.marketSentimentIndex}
          </h2>
          <button onClick={() => mutate()} className="text-slate-500 hover:text-cyan-400 transition-colors p-1 rounded">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 border-b border-cyan-900/20 bg-slate-900/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 font-ibm-plex text-label-sm transition-all relative ${
                activeTab === tab.id
                  ? "text-cyan-400 after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-cyan-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] text-slate-600">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Feed list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-600 text-sm">{t.newsLoadError}</div>
          ) : (
            filtered.map((item, i) => {
              const isPos = item.sentiment_label === "positive"
              const isNeg = item.sentiment_label === "negative"
              return (
                <div key={i} className="p-4 border-b border-cyan-900/10 hover:bg-slate-800/30 transition-colors group cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-ibm-plex text-label-sm px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {item.source}
                      </span>
                      {item.mentioned_stocks.length > 0 && (
                        <span className="font-ibm-plex text-label-sm text-slate-600">
                          {formatDate(item.published || "")}
                        </span>
                      )}
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium ${
                      isPos
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : isNeg
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                        : "bg-slate-700/50 border-slate-600/30 text-slate-400"
                    }`}>
                      {isPos ? <TrendingUp className="h-3 w-3" /> : isNeg ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {getSentimentLabel(item.sentiment_label)}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-hanken text-[15px] font-semibold text-slate-200 leading-snug mb-1 group-hover:text-cyan-300 transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                      {item.summary && item.summary !== item.title && (
                        <p className="text-xs text-slate-500 line-clamp-2">{item.summary}</p>
                      )}
                      {item.mentioned_stocks.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {item.mentioned_stocks.slice(0, 4).map((s) => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              {s.replace(".IS", "")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-slate-600 hover:text-cyan-400 transition-colors mt-0.5">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
