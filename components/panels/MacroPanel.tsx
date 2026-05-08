"use client"

import { useMacroData } from "@/lib/api"
import { useAppStore } from "@/store/appStore"
import { useT } from "@/lib/i18n"
import { MetricCard } from "@/components/cards/MetricCard"
import { HeatmapChart } from "@/components/charts/HeatmapChart"
import { TrendingUp, TrendingDown, DollarSign, Euro, Coins, AlertTriangle } from "lucide-react"
import { formatPrice, formatPct } from "@/lib/utils"

export function MacroPanel() {
  const { data: macro, isLoading, error } = useMacroData()
  const { selectedMarket } = useAppStore()
  const t = useT()
  const isUS = selectedMarket === "NASDAQ" || selectedMarket === "NYSE"

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-4 h-24">
            <div className="h-3 bg-slate-800/80 rounded-lg w-24 mb-3 skeleton" />
            <div className="h-6 bg-slate-800/80 rounded-lg w-32 skeleton" />
          </div>
        ))}
      </div>
    )
  }

  if (error || !macro) {
    return (
      <div className="glass-card p-6 flex flex-col items-center gap-2 text-slate-500">
        <AlertTriangle className="h-8 w-8 text-amber-500/50" />
        <p className="text-sm">{t.macroLoadError}</p>
      </div>
    )
  }

  const fearValue = macro.fear_greed.value
  const fearColor = fearValue >= 60 ? "text-emerald-400" : fearValue <= 40 ? "text-rose-400" : "text-amber-400"
  const fearLabel = fearValue >= 75 ? t.extremeGreed : fearValue >= 55 ? t.greed : fearValue >= 45 ? t.fearNeutral : fearValue >= 25 ? t.fear : t.extremeFear

  return (
    <div className="space-y-6">
      {/* Market Indices */}
      <div>
        <h3 className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">
          {isUS ? t.usIndices : t.bistIndices}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4">
            <p className="text-xs text-slate-500 mb-1">{isUS ? "S&P 500" : "BIST 100"}</p>
            <p className="text-2xl font-bold font-mono text-slate-100">
              {macro.bist100.value?.toLocaleString("en-US", { maximumFractionDigits: 0 }) ?? "—"}
            </p>
            <span className={`flex items-center gap-1 text-sm font-medium mt-1 ${macro.bist100.change_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {macro.bist100.change_pct >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {formatPct(macro.bist100.change_pct)}
            </span>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-slate-500 mb-1">{isUS ? "NASDAQ" : "BIST 30"}</p>
            <p className="text-2xl font-bold font-mono text-slate-100">
              {macro.bist30.value?.toLocaleString("en-US", { maximumFractionDigits: 0 }) ?? "—"}
            </p>
            <span className={`flex items-center gap-1 text-sm font-medium mt-1 ${macro.bist30.change_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {macro.bist30.change_pct >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {formatPct(macro.bist30.change_pct)}
            </span>
          </div>
        </div>
      </div>

      {/* Forex & Commodities */}
      <div>
        <h3 className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">
          {isUS ? t.forexRates : t.forexCommodities}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricCard
            title="USD / TRY"
            value={macro.usd_try.rate ? formatPrice(macro.usd_try.rate, 4) : "—"}
            changePct={macro.usd_try.change_pct}
            icon={<DollarSign className="h-4 w-4" />}
            accent={macro.usd_try.change_pct >= 0 ? "negative" : "positive"}
          />
          <MetricCard
            title="EUR / TRY"
            value={macro.eur_try.rate ? formatPrice(macro.eur_try.rate, 4) : "—"}
            changePct={macro.eur_try.change_pct}
            icon={<Euro className="h-4 w-4" />}
            accent={macro.eur_try.change_pct >= 0 ? "negative" : "positive"}
          />
          <MetricCard
            title={isUS ? "Gold ($/oz)" : "Altın (₺/oz)"}
            value={macro.gold_try.price ? formatPrice(macro.gold_try.price, 0) : "—"}
            changePct={macro.gold_try.change_pct}
            icon={<Coins className="h-4 w-4" />}
            accent={macro.gold_try.change_pct >= 0 ? "positive" : "negative"}
          />
        </div>
      </div>

      {/* Fear & Greed */}
      <div className="glass-card p-5">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-4">{t.fearGreed}</p>
        <div className="flex items-center gap-6">
          <div className="relative h-28 w-28 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="38" fill="none"
                stroke={fearValue >= 60 ? "#00c896" : fearValue <= 40 ? "#ff4d6a" : "#fbbf24"}
                strokeWidth="10"
                strokeDasharray={`${(fearValue / 100) * 239} 239`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.8s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold font-mono ${fearColor}`}>{fearValue}</span>
              <span className="text-[9px] text-slate-500">/ 100</span>
            </div>
          </div>
          <div>
            <p className={`text-xl font-bold ${fearColor}`}>{fearLabel}</p>
            <p className="text-xs text-slate-500 mt-1">{macro.fear_greed.classification}</p>
            <p className="text-xs text-slate-600 mt-3">{t.cryptoSentiment}</p>
          </div>
        </div>
      </div>

      {/* Sector heatmap */}
      {macro.sector_performance && Object.keys(macro.sector_performance).length > 0 && (
        <div className="glass-card p-5">
          <HeatmapChart data={macro.sector_performance} title={t.sectorPerf} />
        </div>
      )}
    </div>
  )
}
