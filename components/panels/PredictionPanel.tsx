"use client"

import { usePredictionData } from "@/lib/api"
import { useT } from "@/lib/i18n"
import { formatPrice } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, Brain, AlertTriangle } from "lucide-react"
import type { PredictionData } from "@/lib/types"

function ForecastChart({ history, median, low, high }: {
  history: number[]
  median: number[]
  low: number[]
  high: number[]
}) {
  const allVals = [...history, ...high, ...low].filter(isFinite)
  const minVal = Math.min(...allVals) * 0.997
  const maxVal = Math.max(...allVals) * 1.003
  const range = maxVal - minVal || 1

  const W = 420
  const H = 160
  const histLen = history.length
  const predLen = median.length
  const total = histLen + predLen - 1

  const toX = (i: number) => (i / total) * W
  const toY = (v: number) => H - ((v - minVal) / range) * H

  const histPath = history.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(" ")

  const sepX = toX(histLen - 1)
  const sepY = toY(history[histLen - 1])

  const medPath = `M ${sepX.toFixed(1)} ${sepY.toFixed(1)} ` +
    median.map((v, i) => `L ${toX(histLen + i).toFixed(1)} ${toY(v).toFixed(1)}`).join(" ")

  const highPoints = median.map((_, i) => `${i === 0 ? "M" : "L"} ${toX(histLen + i).toFixed(1)} ${toY(high[i]).toFixed(1)}`).join(" ")
  const lowRev = [...low].reverse().map((v, i) => `L ${toX(histLen + (predLen - 1 - i)).toFixed(1)} ${toY(v).toFixed(1)}`).join(" ")
  const bandPath = `${highPoints} ${lowRev} Z`

  const isUp = median[predLen - 1] > history[histLen - 1]
  const color = isUp ? "#00c896" : "#ff4d6a"
  const bandFill = isUp ? "rgba(0,200,150,0.10)" : "rgba(255,77,106,0.10)"

  const endX = toX(histLen + predLen - 1)
  const endY = toY(median[predLen - 1])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
      {/* confidence band */}
      <path d={bandPath} fill={bandFill} />
      {/* historical */}
      <path d={histPath} fill="none" stroke="rgba(148,163,184,0.45)" strokeWidth="1.5" strokeLinejoin="round" />
      {/* separator */}
      <line x1={sepX} y1={0} x2={sepX} y2={H} stroke="rgba(0,212,255,0.25)" strokeWidth="1" strokeDasharray="3 3" />
      {/* predicted median */}
      <path d={medPath} fill="none" stroke={color} strokeWidth="2" strokeDasharray="5 3" strokeLinejoin="round" />
      {/* dots */}
      <circle cx={sepX} cy={sepY} r={3.5} fill="#00d4ff" />
      <circle cx={endX} cy={endY} r={4} fill={color} />
      {/* end price label */}
      <rect x={endX - 2} y={endY - 16} width={44} height={14} rx={3} fill="rgba(15,23,36,0.85)" />
      <text x={endX + 20} y={endY - 5} textAnchor="middle" fontSize={9} fill={color} fontFamily="monospace">
        {median[predLen - 1] > 1000
          ? median[predLen - 1].toLocaleString("en", { maximumFractionDigits: 0 })
          : median[predLen - 1].toFixed(2)}
      </text>
    </svg>
  )
}

function SignalCard({ data }: { data: PredictionData }) {
  const t = useT()

  const signalConfig: Record<PredictionData["signal"], { label: string; color: string; bg: string; border: string }> = {
    STRONG_BUY: { label: t.signalStrongBuy, color: "text-emerald-300", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
    BUY:        { label: t.signalBuy,       color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    HOLD:       { label: t.signalHold,      color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
    SELL:       { label: t.signalSell,      color: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20"    },
    STRONG_SELL:{ label: t.signalStrongSell,color: "text-rose-300",    bg: "bg-rose-500/15",    border: "border-rose-500/30"    },
  }

  const cfg = signalConfig[data.signal]
  const isUp = data.signal === "STRONG_BUY" || data.signal === "BUY"
  const isDown = data.signal === "STRONG_SELL" || data.signal === "SELL"
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus

  const confLabel = { high: t.confidenceHigh, medium: t.confidenceMedium, low: t.confidenceLow }[data.confidence]

  return (
    <div className={`rounded-2xl border p-4 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-5 w-5 ${cfg.color}`} />
        <span className={`text-lg font-bold ${cfg.color}`}>{cfg.label}</span>
      </div>

      <p className={`text-3xl font-mono font-bold ${cfg.color} mb-3`}>
        {data.predicted_return_pct > 0 ? "+" : ""}{data.predicted_return_pct.toFixed(2)}%
      </p>

      <p className={`text-xs ${cfg.color} opacity-70`}>{t.prediction7d}</p>

      <div className="mt-4 space-y-2 border-t border-white/5 pt-3">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">{t.currentPrice}</span>
          <span className="font-mono text-slate-200">{formatPrice(data.current_price)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">{t.predictedPrice}</span>
          <span className={`font-mono font-medium ${cfg.color}`}>{formatPrice(data.predicted_price_7d)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">{t.confidenceLabel}</span>
          <span className="text-slate-300">{confLabel}</span>
        </div>
      </div>
    </div>
  )
}

export function PredictionPanel({ symbol }: { symbol: string }) {
  const t = useT()
  const { data, isLoading, error } = usePredictionData(symbol)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="glass-card p-4 h-40 skeleton" />
        <div className="glass-card p-4 h-52 skeleton" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="glass-card p-6 flex flex-col items-center gap-2 text-slate-500">
        <AlertTriangle className="h-8 w-8 text-amber-500/50" />
        <p className="text-sm">{t.predictionLoadError}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{t.aiPrediction}</p>
          <span className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full border font-medium ${
            data.model_used === "Chronos"
              ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
              : "bg-slate-700/40 text-slate-400 border-slate-600/30"
          }`}>
            <Brain className="h-2.5 w-2.5" />
            {data.model_used === "Chronos" ? "Amazon Chronos" : "Statistical Model"}
          </span>
        </div>

        <SignalCard data={data} />
      </div>

      {/* Forecast chart */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">{t.forecastChart}</p>
        <ForecastChart
          history={data.history}
          median={data.predicted_prices}
          low={data.predicted_low}
          high={data.predicted_high}
        />
        <div className="flex items-center gap-5 mt-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-slate-400/45 rounded" />
            {t.historical}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 rounded" style={{ background: data.predicted_prices[6] > data.history[data.history.length - 1] ? "#00c896" : "#ff4d6a", borderTop: "2px dashed" }} />
            {t.predicted}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: data.predicted_prices[6] > data.history[data.history.length - 1] ? "rgba(0,200,150,0.15)" : "rgba(255,77,106,0.15)" }} />
            {t.confidenceBand}
          </span>
        </div>
      </div>

      <p className="text-[10px] text-slate-600 px-1 leading-relaxed">{t.predictionDisclaimer}</p>
    </div>
  )
}
