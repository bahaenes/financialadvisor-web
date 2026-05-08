"use client"

import { useState } from "react"
import type { StockData, TechnicalData } from "@/lib/types"
import { CandlestickChart } from "@/components/charts/CandlestickChart"
import { RsiChart, MacdChart, StochChart } from "@/components/charts/IndicatorPanel"
import { SignalBadge } from "@/components/cards/SignalBadge"
import { useT } from "@/lib/i18n"

interface TechnicalPanelProps {
  stock: StockData
  technical?: TechnicalData
  isLoading?: boolean
}

type OverlayType = "sma" | "ema" | "bb"

export function TechnicalPanel({ stock, technical, isLoading }: TechnicalPanelProps) {
  const t = useT()
  const [overlays, setOverlays] = useState<OverlayType[]>(["sma"])
  const [indicator, setIndicator] = useState<"rsi" | "macd" | "stoch">("rsi")

  const toggleOverlay = (o: OverlayType) => {
    setOverlays((prev) => prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o])
  }

  const ind = technical?.indicators
  const signals = technical?.signals

  return (
    <div className="space-y-4">
      {/* Overlay toggles */}
      <div className="glass-card p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{t.indicators}</span>
          {(["sma", "ema", "bb"] as OverlayType[]).map((o) => (
            <button
              key={o}
              onClick={() => toggleOverlay(o)}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-all border ${
                overlays.includes(o)
                  ? "border-cyan-500/50 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 text-cyan-400"
                  : "border-slate-700 text-slate-500 hover:text-slate-300"
              }`}
            >
              {o.toUpperCase()}
            </button>
          ))}
        </div>
        {signals && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{t.signal}</span>
            <SignalBadge signal={signals.overall} score={signals.score} size="sm" />
          </div>
        )}
      </div>

      {/* Main candlestick chart */}
      <div className="glass-card p-4">
        {isLoading ? (
          <div className="h-[420px] flex items-center justify-center">
            <div className="text-slate-500 text-sm animate-pulse">{t.loadingChart}</div>
          </div>
        ) : (
          <CandlestickChart
            ohlcv={stock.ohlcv}
            sma20={overlays.includes("sma") ? ind?.sma_20 : undefined}
            sma50={overlays.includes("sma") ? ind?.sma_50 : undefined}
            ema12={overlays.includes("ema") ? ind?.ema_12 : undefined}
            ema26={overlays.includes("ema") ? ind?.ema_26 : undefined}
            bollinger={overlays.includes("bb") ? ind?.bollinger : undefined}
            height={420}
          />
        )}
      </div>

      {/* Sub-indicator selector */}
      <div className="glass-card p-1 flex gap-1">
        {(["rsi", "macd", "stoch"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setIndicator(tab)}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${
              indicator === tab
                ? "bg-gradient-to-r from-cyan-500/15 to-violet-500/15 text-cyan-400"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab === "rsi" ? "RSI" : tab === "macd" ? "MACD" : "Stochastic"}
          </button>
        ))}
      </div>

      {/* Sub-indicator chart */}
      <div className="glass-card p-4">
        {indicator === "rsi" && ind?.rsi?.length ? <RsiChart data={ind.rsi} height={130} /> : null}
        {indicator === "macd" && ind?.macd?.length ? <MacdChart data={ind.macd} height={140} /> : null}
        {indicator === "stoch" && ind?.stoch?.length ? <StochChart data={ind.stoch} height={120} /> : null}
        {!ind && (
          <div className="h-32 flex items-center justify-center text-slate-500 text-sm animate-pulse">
            {t.calculatingIndicators}
          </div>
        )}
      </div>

      {/* Signal grid */}
      {signals && (
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">{t.technicalSummary}</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: "RSI", value: signals.rsi_signal },
              { label: "MACD", value: signals.macd_signal },
              { label: "Bollinger", value: signals.bb_signal },
              { label: t.movingAvg, value: signals.ma_signal },
              { label: "Stochastic", value: signals.stoch_signal },
            ].map(({ label, value }) => {
              const isBull = value?.includes("BULL") || value === "OVERSOLD" || value?.includes("STRONG_B")
              const isBear = value?.includes("BEAR") || value === "OVERBOUGHT"
              return (
                <div key={label} className={`rounded-xl p-3 text-center border transition-all ${
                  isBull ? "bg-emerald-900/20 border-emerald-700/30" :
                  isBear ? "bg-rose-900/20 border-rose-700/30" :
                  "bg-slate-800/40 border-slate-700/30"
                }`}>
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <p className={`text-xs font-semibold ${isBull ? "text-emerald-400" : isBear ? "text-rose-400" : "text-amber-400"}`}>
                    {value?.replace("_", " ") || "N/A"}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
