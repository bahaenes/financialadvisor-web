"use client"

import { useTickerData } from "@/lib/api"
import { TICKER_SYMBOLS } from "@/lib/constants"
import { formatPrice, formatPct } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

export function TickerBar() {
  const { data: tickers } = useTickerData(TICKER_SYMBOLS)

  if (!tickers || tickers.length === 0) {
    return (
      <div className="ticker-bar h-9 flex items-center px-4">
        <span className="text-xs text-slate-500">Piyasa verileri yükleniyor...</span>
      </div>
    )
  }

  const items = [...tickers, ...tickers]

  return (
    <div className="ticker-bar h-9 overflow-hidden flex items-center relative">
      <div className="flex animate-ticker whitespace-nowrap">
        {items.map((item, i) => (
          <div key={`${item.symbol}-${i}`} className="flex items-center gap-1.5 px-5 border-r border-cyan-900/30">
            <span className="text-xs font-semibold text-slate-300">{item.symbol.replace(".IS", "")}</span>
            <span className="text-xs text-slate-400 font-mono">{formatPrice(item.price)}</span>
            <span className={`flex items-center gap-0.5 text-xs font-medium ${item.change_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {item.change_pct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatPct(item.change_pct)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
