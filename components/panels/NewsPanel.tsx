"use client"

import { useAppStore } from "@/store/appStore"
import { useNewsData } from "@/lib/api"
import { useT } from "@/lib/i18n"
import { ExternalLink, TrendingUp, TrendingDown, Minus, Newspaper, AlertTriangle, Cpu } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { SentimentLabel } from "@/lib/types"

export function NewsPanel() {
  const { selectedMarket } = useAppStore()
  const { data: news, isLoading, error } = useNewsData(selectedMarket)
  const t = useT()

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

  const sentimentColor = news.market_sentiment > 0.05
    ? "text-emerald-400"
    : news.market_sentiment < -0.05
    ? "text-rose-400"
    : "text-amber-400"

  const overallLabel = getSentimentLabel(news.market_sentiment_label as SentimentLabel)

  return (
    <div className="space-y-4">
      {/* Market sentiment summary */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Newspaper className="h-5 w-5 text-slate-500" />
          <div>
            <p className="text-xs text-slate-500">{t.marketSentimentIndex}</p>
            <p className={`text-lg font-bold ${sentimentColor}`}>{overallLabel}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end mb-1">
            <p className="text-xs text-slate-500">{t.newsAnalyzed(news.items.length)}</p>
            {(news as { finbert_used?: boolean }).finbert_used && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                <Cpu className="h-2.5 w-2.5" />
                {t.finbertBadge}
              </span>
            )}
          </div>
          <p className={`text-sm font-mono font-medium ${sentimentColor}`}>
            {news.market_sentiment > 0 ? "+" : ""}{(news.market_sentiment * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Sentiment distribution */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">{t.sentimentDistribution}</p>
        {(() => {
          const pos = news.items.filter((n) => n.sentiment_label === "positive").length
          const neg = news.items.filter((n) => n.sentiment_label === "negative").length
          const neu = news.items.filter((n) => n.sentiment_label === "neutral").length
          const total = news.items.length || 1
          return (
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
          )
        })()}
      </div>

      {/* News list */}
      <div className="space-y-2">
        {news.items.map((item, i) => {
          const isPos = item.sentiment_label === "positive"
          const isNeg = item.sentiment_label === "negative"
          return (
            <div key={i} className="glass-card glass-card-hover p-4 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {isPos ? <TrendingUp className="h-4 w-4 text-emerald-400" /> :
                    isNeg ? <TrendingDown className="h-4 w-4 text-rose-400" /> :
                    <Minus className="h-4 w-4 text-slate-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-slate-200 leading-snug">{item.title}</h4>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-slate-600 hover:text-cyan-400 transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  {item.summary && item.summary !== item.title && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.summary}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-[10px] text-slate-600 font-medium">{item.source}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      isPos ? "bg-emerald-500/10 text-emerald-400" :
                      isNeg ? "bg-rose-500/10 text-rose-400" :
                      "bg-slate-700/50 text-slate-400"
                    }`}>
                      {getSentimentLabel(item.sentiment_label)}
                    </span>
                    {item.finbert_used && (
                      <span className="text-[10px] px-1 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center gap-0.5">
                        <Cpu className="h-2 w-2" /> {t.finbertBadge}
                      </span>
                    )}
                    {item.mentioned_stocks.length > 0 && (
                      <div className="flex gap-1">
                        {item.mentioned_stocks.slice(0, 3).map((s) => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{s.replace(".IS", "")}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
