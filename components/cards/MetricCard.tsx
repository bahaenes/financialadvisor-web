import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { SparklineChart } from "@/components/charts/SparklineChart"
import type { SeriesPoint } from "@/lib/types"

interface MetricCardProps {
  title: string
  value: string
  change?: string
  changePct?: number
  subtitle?: string
  sparklineData?: SeriesPoint[]
  icon?: React.ReactNode
  accent?: "cyan" | "positive" | "negative" | "neutral"
}

export function MetricCard({ title, value, change, changePct, subtitle, sparklineData, icon, accent }: MetricCardProps) {
  const isPositive = changePct != null && changePct > 0
  const isNegative = changePct != null && changePct < 0

  const accentBorder = accent === "positive" ? "border-l-emerald-500/60" :
    accent === "negative" ? "border-l-rose-500/60" :
    accent === "neutral" ? "border-l-amber-500/60" :
    "border-l-cyan-500/60"

  return (
    <div className={`glass-card p-4 border-l-2 ${accentBorder} flex flex-col gap-2`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider truncate">{title}</p>
          <p className="text-xl font-bold text-slate-100 font-mono mt-0.5">{value}</p>
        </div>
        {icon && <div className="text-slate-600 ml-2 flex-shrink-0">{icon}</div>}
      </div>

      {sparklineData && sparklineData.length > 1 && (
        <div className="-mx-1">
          <SparklineChart data={sparklineData} height={40} />
        </div>
      )}

      {(change || changePct != null || subtitle) && (
        <div className="flex items-center gap-1.5">
          {changePct != null && (
            <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-emerald-400" : isNegative ? "text-rose-400" : "text-slate-400"}`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : isNegative ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {changePct != null ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%` : ""}
            </span>
          )}
          {change && <span className="text-xs text-slate-500">{change}</span>}
          {subtitle && !change && <span className="text-xs text-slate-500">{subtitle}</span>}
        </div>
      )}
    </div>
  )
}
