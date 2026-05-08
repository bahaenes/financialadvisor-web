"use client"

import { useState } from "react"
import { useStockData } from "@/lib/api"
import { useAppStore } from "@/store/appStore"
import { useT } from "@/lib/i18n"
import { MARKET_STOCKS } from "@/lib/constants"
import { formatPrice, formatPct } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

function CompareRow({ symbol, stocks }: { symbol: string; stocks: Record<string, string> }) {
  const { data } = useStockData(symbol, "1y")
  if (!data || !data.ohlcv.length) return null

  const firstClose = data.ohlcv[0]?.close ?? data.price
  const returnPct = ((data.price - firstClose) / firstClose) * 100
  const isPos = returnPct >= 0
  const displaySym = symbol.replace(".IS", "")

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
      <div className="w-20">
        <p className="text-xs font-bold text-cyan-400">{displaySym}</p>
        <p className="text-[10px] text-slate-500 truncate">{stocks[symbol] ?? data.name}</p>
      </div>
      <div className="flex-1">
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${isPos ? "bg-emerald-500" : "bg-rose-500"}`}
            style={{ width: `${Math.min(Math.abs(returnPct), 100)}%`, marginLeft: isPos ? "50%" : `${50 - Math.min(Math.abs(returnPct), 50)}%` }}
          />
        </div>
      </div>
      <div className="text-right w-20">
        <p className="text-xs font-mono text-slate-200">{formatPrice(data.price)}</p>
        <span className={`flex items-center justify-end gap-0.5 text-xs font-medium ${isPos ? "text-emerald-400" : "text-rose-400"}`}>
          {isPos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {formatPct(returnPct)}
        </span>
      </div>
    </div>
  )
}

export function ComparisonPanel({ currentSymbol }: { currentSymbol: string }) {
  const { selectedMarket } = useAppStore()
  const t = useT()
  const stocks = MARKET_STOCKS[selectedMarket]
  const compareOptions = Object.keys(stocks).slice(0, 8)

  const [selected, setSelected] = useState<string[]>(compareOptions.slice(0, 4))
  const { data: current } = useStockData(currentSymbol, "1y")

  return (
    <div className="space-y-4">
      {/* Selector */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">{t.compareStocks}</p>
        <div className="flex flex-wrap gap-1.5">
          {compareOptions.map((sym) => (
            <button
              key={sym}
              disabled={sym === currentSymbol}
              onClick={() => setSelected((prev) => prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym])}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all border ${
                sym === currentSymbol ? "border-cyan-500/50 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 text-cyan-400 cursor-default" :
                selected.includes(sym) ? "border-violet-500/40 bg-violet-500/15 text-violet-300" :
                "border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600"
              }`}
            >
              {sym.replace(".IS", "")}
            </button>
          ))}
        </div>
      </div>

      {/* Current stock */}
      {current && (
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">{t.yearPerf}</p>
          <div className="space-y-2">
            {/* Current stock (highlighted) */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-violet-500/5 border border-cyan-500/20">
              <div className="w-20">
                <p className="text-xs font-bold text-cyan-400">{currentSymbol.replace(".IS", "")} ★</p>
                <p className="text-[10px] text-slate-500 truncate">{current.name}</p>
              </div>
              <div className="flex-1">
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  {(() => {
                    const ret = ((current.price - (current.ohlcv[0]?.close ?? current.price)) / (current.ohlcv[0]?.close ?? current.price)) * 100
                    const isPos = ret >= 0
                    return (
                      <div
                        className={`h-full rounded-full ${isPos ? "bg-cyan-400" : "bg-rose-500"}`}
                        style={{ width: `${Math.min(Math.abs(ret), 100)}%`, marginLeft: isPos ? "50%" : `${50 - Math.min(Math.abs(ret), 50)}%` }}
                      />
                    )
                  })()}
                </div>
              </div>
              <div className="text-right w-20">
                <p className="text-xs font-mono text-slate-200">{formatPrice(current.price)}</p>
                <span className={`flex items-center justify-end gap-0.5 text-xs font-medium ${current.change_pct >= 0 ? "text-cyan-400" : "text-rose-400"}`}>
                  {current.change_pct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {formatPct(current.change_pct)}
                </span>
              </div>
            </div>
            {selected.filter((s) => s !== currentSymbol).map((sym) => (
              <CompareRow key={sym} symbol={sym} stocks={stocks} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
