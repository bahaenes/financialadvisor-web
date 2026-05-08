"use client"

import { usePredictionData } from "@/lib/api"
import { useT } from "@/lib/i18n"
import { formatPrice } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, Brain, AlertTriangle } from "lucide-react"
import type { PredictionData } from "@/lib/types"

function ConfidenceGauge({ level }: { level: "high" | "medium" | "low" }) {
  const pct = level === "high" ? 87 : level === "medium" ? 62 : 38
  const angle = -180 + (pct / 100) * 180
  const rad = (angle * Math.PI) / 180
  const cx = 80; const cy = 80; const r = 60
  const nx = cx + r * Math.cos(rad)
  const ny = cy + r * Math.sin(rad)
  const color = level === "high" ? "#00c896" : level === "medium" ? "#fbbf24" : "#ff4d6a"

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 90" className="w-full max-w-[160px]">
        <path d={`M 20 80 A 60 60 0 0 1 140 80`} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="14" strokeLinecap="round" />
        <path d={`M 20 80 A 60 60 0 0 1 ${nx.toFixed(1)} ${ny.toFixed(1)}`} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }} />
        <circle cx={nx.toFixed(1)} cy={ny.toFixed(1)} r="5" fill={color} />
        <text x="80" y="68" textAnchor="middle" fontSize="22" fontWeight="700" fill={color} fontFamily="var(--font-hanken)">{pct}%</text>
        <text x="80" y="80" textAnchor="middle" fontSize="8" fill="rgba(148,163,184,0.8)" letterSpacing="0.1em">CONFIDENCE</text>
      </svg>
    </div>
  )
}

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
      <path d={bandPath} fill={bandFill} />
      <path d={histPath} fill="none" stroke="rgba(148,163,184,0.45)" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1={sepX} y1={0} x2={sepX} y2={H} stroke="rgba(0,212,255,0.25)" strokeWidth="1" strokeDasharray="3 3" />
      <path d={medPath} fill="none" stroke={color} strokeWidth="2" strokeDasharray="5 3" strokeLinejoin="round" />
      <circle cx={sepX} cy={sepY} r={3.5} fill="#00d4ff" />
      <circle cx={endX} cy={endY} r={4} fill={color} />
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
        <span className={`text-lg font-bold font-hanken ${cfg.color}`}>{cfg.label}</span>
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

  const isUp = data.signal === "STRONG_BUY" || data.signal === "BUY"
  const lastHistory = data.history[data.history.length - 1]
  const lastLow = data.predicted_low[data.predicted_low.length - 1]
  const lastHigh = data.predicted_high[data.predicted_high.length - 1]

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ── Bento grid: main gauge + confidence ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main prediction card — AI gradient border */}
        <div className={`md:col-span-2 glass-card p-5 ${isUp ? "ai-border-positive" : "ai-border"} layer-1`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-4 w-4 text-cyan-400" />
                <h3 className="font-hanken text-headline-md text-white">{t.aiPrediction}</h3>
              </div>
              <p className="text-xs text-slate-500">{t.prediction7d}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border font-ibm-plex text-label-sm ${
                data.model_used === "Chronos"
                  ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                  : "bg-slate-700/40 text-slate-400 border-slate-600/30"
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {data.model_used === "Chronos" ? "Chronos" : "Statistical"}
              </span>
            </div>
          </div>

          <SignalCard data={data} />

          {/* Price bounds */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-cyan-900/20">
            <div>
              <span className="block text-xs text-slate-500 mb-1 font-ibm-plex text-label-sm">Lower (95%)</span>
              <span className="block text-data-tabular text-rose-400 font-mono">{formatPrice(lastLow)}</span>
            </div>
            <div className="text-center">
              <span className="block text-xs text-slate-500 mb-1 font-ibm-plex text-label-sm">Current</span>
              <span className="block text-data-tabular text-slate-200 font-mono">{formatPrice(lastHistory)}</span>
            </div>
            <div className="text-right">
              <span className="block text-xs text-slate-500 mb-1 font-ibm-plex text-label-sm">Upper (95%)</span>
              <span className="block text-data-tabular text-emerald-400 font-mono">{formatPrice(lastHigh)}</span>
            </div>
          </div>
        </div>

        {/* Confidence gauge card */}
        <div className="glass-card p-5 flex flex-col items-center justify-center layer-1">
          <p className="text-xs text-slate-500 font-ibm-plex text-label-sm mb-3">Model Confidence</p>
          <ConfidenceGauge level={data.confidence} />
          <div className="mt-3 text-center space-y-1">
            <p className="text-xs text-slate-500">Model</p>
            <p className="text-sm font-medium text-slate-300">
              {data.model_used === "Chronos" ? "Amazon Chronos" : "Statistical"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Forecast chart ───────────────────────────────────────────────────── */}
      <div className="glass-card p-5 layer-1">
        <p className="text-xs text-slate-500 font-ibm-plex text-label-sm uppercase mb-3">{t.forecastChart}</p>
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
