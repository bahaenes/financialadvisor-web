"use client"

import { useStockData } from "@/lib/api"
import { formatPrice, formatPct } from "@/lib/utils"
import { TrendingUp, TrendingDown, X } from "lucide-react"
import { BIST_STOCKS } from "@/lib/constants"
import { useAppStore } from "@/store/appStore"

interface StockCardProps {
  symbol: string
  onRemove?: (symbol: string) => void
  onClick?: (symbol: string) => void
}

export function StockCard({ symbol, onRemove, onClick }: StockCardProps) {
  const { data, isLoading } = useStockData(symbol, "5d")
  const name = BIST_STOCKS[symbol] || symbol

  if (isLoading) {
    return (
      <div className="glass-card p-3 animate-pulse">
        <div className="h-3 bg-slate-800 rounded w-16 mb-2" />
        <div className="h-5 bg-slate-800 rounded w-24 mb-1" />
        <div className="h-3 bg-slate-800 rounded w-12" />
      </div>
    )
  }

  if (!data) return null

  const isPos = data.change_pct >= 0

  return (
    <div
      className="glass-card glass-card-hover p-3 cursor-pointer relative group"
      onClick={() => onClick?.(symbol)}
    >
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(symbol) }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-all"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <p className="text-xs font-bold text-cyan-400">{symbol.replace(".IS", "")}</p>
      <p className="text-[10px] text-slate-500 mb-2 truncate">{name}</p>
      <p className="text-lg font-bold font-mono text-slate-100">{formatPrice(data.price)}</p>
      <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${isPos ? "text-emerald-400" : "text-rose-400"}`}>
        {isPos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {formatPct(data.change_pct)}
      </div>
    </div>
  )
}
