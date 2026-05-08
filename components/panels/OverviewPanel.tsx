"use client"

import type { StockData, TechnicalData } from "@/lib/types"
import { MetricCard } from "@/components/cards/MetricCard"
import { SignalBadge } from "@/components/cards/SignalBadge"
import { useT } from "@/lib/i18n"
import { useAppStore } from "@/store/appStore"
import { MARKET_CURRENCIES } from "@/lib/constants"
import { formatPrice, formatVolume, formatMarketCap } from "@/lib/utils"
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Activity, Target, AlertCircle } from "lucide-react"

interface OverviewPanelProps {
  stock: StockData
  technical?: TechnicalData
}

export function OverviewPanel({ stock, technical }: OverviewPanelProps) {
  const t = useT()
  const { selectedMarket } = useAppStore()
  const currencySymbol = MARKET_CURRENCIES[selectedMarket]

  const signals = technical?.signals
  const sr = technical?.support_resistance
  const rsiData = technical?.indicators?.rsi ?? []
  const lastRsi = rsiData.length ? rsiData[rsiData.length - 1].value : null

  const isPositive = stock.change_pct >= 0

  return (
    <div className="space-y-6">
      {/* Hero price block */}
      <div className="glass-card p-6 metric-card-gradient">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-white">{stock.symbol.replace(".IS", "")}</h2>
              {signals && <SignalBadge signal={signals.overall} score={signals.score} size="md" />}
            </div>
            <p className="text-sm text-slate-400 mb-4">{stock.name}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-mono text-slate-100">
                {formatPrice(stock.price)}
              </span>
              <span className="text-lg text-slate-400">{currencySymbol}</span>
            </div>
            <div className={`flex items-center gap-2 mt-2 ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-base font-medium">
                {isPositive ? "+" : ""}{formatPrice(stock.change)} ({isPositive ? "+" : ""}{stock.change_pct.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Signal detail */}
          {signals && (
            <div className="glass-card p-4 min-w-[200px]">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">{t.signalDetail}</p>
              <div className="space-y-2">
                {[
                  { label: "RSI", value: signals.rsi_signal },
                  { label: "MACD", value: signals.macd_signal },
                  { label: "Bollinger", value: signals.bb_signal },
                  { label: t.movingAvg, value: signals.ma_signal },
                  { label: "Stochastic", value: signals.stoch_signal },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className={`text-xs font-medium ${value?.includes("BULL") || value === "OVERSOLD" || value?.includes("STRONG_B") ? "text-emerald-400" : value?.includes("BEAR") || value === "OVERBOUGHT" ? "text-rose-400" : "text-slate-400"}`}>
                      {value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard
          title={t.volume}
          value={formatVolume(stock.volume)}
          icon={<BarChart2 className="h-4 w-4" />}
          sparklineData={stock.ohlcv.slice(-30).map((b) => ({ time: b.time, value: b.volume }))}
          accent="cyan"
        />
        <MetricCard
          title={t.marketCap}
          value={formatMarketCap(stock.market_cap)}
          icon={<DollarSign className="h-4 w-4" />}
          accent="neutral"
        />
        <MetricCard
          title={t.peRatio}
          value={stock.pe_ratio ? stock.pe_ratio.toFixed(1) : "—"}
          icon={<Activity className="h-4 w-4" />}
          accent="cyan"
        />
        <MetricCard
          title={t.rsi14}
          value={lastRsi ? lastRsi.toFixed(1) : "—"}
          subtitle={lastRsi ? (lastRsi < 30 ? t.oversold : lastRsi > 70 ? t.overbought : t.neutral) : undefined}
          accent={lastRsi ? (lastRsi < 30 ? "positive" : lastRsi > 70 ? "negative" : "neutral") : "cyan"}
        />
        <MetricCard
          title={t.beta}
          value={stock.beta ? stock.beta.toFixed(2) : "—"}
          subtitle={stock.beta ? (stock.beta > 1 ? t.highVolatility : t.lowVolatility) : undefined}
          accent="neutral"
        />
      </div>

      {/* 52-week range + S/R */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 52-week range */}
        {stock.week_52_high && stock.week_52_low && (
          <div className="glass-card p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-4">{t.week52Range}</p>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-mono text-rose-400">{currencySymbol}{formatPrice(stock.week_52_low)}</span>
              <span className="font-mono text-emerald-400">{currencySymbol}{formatPrice(stock.week_52_high)}</span>
            </div>
            <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
              {(() => {
                const pct = ((stock.price - stock.week_52_low) / (stock.week_52_high - stock.week_52_low)) * 100
                return (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-500 opacity-30 rounded-full" />
                    <div className="absolute top-0 h-full w-0.5 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(0,212,255,0.8)]" style={{ left: `${Math.max(0, Math.min(100, pct))}%` }} />
                  </>
                )
              })()}
            </div>
            <p className="text-xs text-center text-slate-500 mt-2">
              {t.current} <span className="text-cyan-400 font-mono">{currencySymbol}{formatPrice(stock.price)}</span>
            </p>
          </div>
        )}

        {/* Support & Resistance */}
        {sr && (
          <div className="glass-card p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-4">{t.supportResistance}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-emerald-400 font-medium mb-2 flex items-center gap-1">
                  <Target className="h-3 w-3" /> {t.support}
                </p>
                {sr.support.map((level, i) => (
                  <p key={i} className="text-sm font-mono text-slate-300">{currencySymbol}{formatPrice(level)}</p>
                ))}
              </div>
              <div>
                <p className="text-xs text-rose-400 font-medium mb-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {t.resistance}
                </p>
                {sr.resistance.map((level, i) => (
                  <p key={i} className="text-sm font-mono text-slate-300">{currencySymbol}{formatPrice(level)}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
