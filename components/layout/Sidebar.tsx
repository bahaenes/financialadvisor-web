"use client"

import { useState, useMemo } from "react"
import { useAppStore } from "@/store/appStore"
import { useT } from "@/lib/i18n"
import { MARKET_STOCKS, MARKET_SECTORS } from "@/lib/constants"
import { Input } from "@/components/ui/input"
import { Search, Star, StarOff, LayoutGrid } from "lucide-react"

export function Sidebar() {
  const {
    selectedSymbol, selectedPeriod, selectedMarket, watchlist,
    setSelectedSymbol, setSelectedPeriod,
    addToWatchlist, removeFromWatchlist, isInWatchlist,
  } = useAppStore()
  const t = useT()
  const [search, setSearch] = useState("")
  const [sectorFilter, setSectorFilter] = useState<string | null>(null)

  const stocks = MARKET_STOCKS[selectedMarket]
  const sectors = MARKET_SECTORS[selectedMarket]

  const filteredStocks = useMemo(() => {
    let entries = Object.entries(stocks)
    if (sectorFilter) {
      const sectorSymbols = sectors[sectorFilter] || []
      entries = entries.filter(([sym]) => sectorSymbols.includes(sym))
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      entries = entries.filter(([sym, name]) =>
        sym.toLowerCase().includes(q) || name.toLowerCase().includes(q)
      )
    }
    return entries
  }, [search, sectorFilter, stocks, sectors])

  // Reset sector filter when market changes
  const displaySymbol = (sym: string) => sym.replace(".IS", "")

  const PERIOD_VALUES = ["5d", "1mo", "3mo", "6mo", "1y", "3y"]
  const PERIOD_LABELS: Record<string, string> = {
    "5d": t.period1W,
    "1mo": t.period3M,
    "3mo": t.period3M,
    "6mo": t.period6M,
    "1y": t.period1Y,
    "3y": t.period3Y,
  }
  const PERIODS_DISPLAY = [
    { value: "5d", label: t.period1W },
    { value: "1mo", label: "1M" },
    { value: "3mo", label: t.period3M },
    { value: "6mo", label: t.period6M },
    { value: "1y", label: t.period1Y },
    { value: "3y", label: t.period3Y },
  ]

  return (
    <aside className="sidebar-nav w-64 flex flex-col h-full overflow-hidden flex-shrink-0">
      {/* Period selector */}
      <div className="p-4 border-b border-cyan-900/20">
        <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">{t.period}</p>
        <div className="flex flex-wrap gap-1">
          {PERIODS_DISPLAY.map((p) => (
            <button
              key={p.value}
              onClick={() => setSelectedPeriod(p.value)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                selectedPeriod === p.value
                  ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-cyan-900/20">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSectorFilter(null) }}
            placeholder={t.searchPlaceholder}
            className="pl-8 h-8 text-xs bg-[#0a0e1a] border-cyan-900/30 text-slate-300 placeholder:text-slate-600 focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Sector filter */}
      <div className="px-4 py-2 border-b border-cyan-900/20">
        <button
          onClick={() => setSectorFilter(null)}
          className={`flex items-center gap-1.5 w-full px-2 py-1.5 rounded text-xs mb-1 transition-colors ${
            !sectorFilter ? "text-cyan-400 bg-cyan-500/10" : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          {t.allSectors}
        </button>
        <div className="flex flex-col gap-0.5 max-h-32 overflow-y-auto pr-1">
          {Object.keys(sectors).map((sector) => (
            <button
              key={sector}
              onClick={() => setSectorFilter(sectorFilter === sector ? null : sector)}
              className={`text-left px-2 py-1 rounded text-xs transition-colors ${
                sectorFilter === sector ? "text-cyan-400 bg-cyan-500/10" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
              }`}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>

      {/* Stock list */}
      <div className="flex-1 overflow-y-auto py-2">
        {filteredStocks.length === 0 ? (
          <p className="text-xs text-slate-600 text-center mt-4">{t.noStockFound}</p>
        ) : (
          filteredStocks.map(([sym, name]) => (
            <div
              key={sym}
              onClick={() => setSelectedSymbol(sym)}
              className={`group flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all ${
                selectedSymbol === sym
                  ? "bg-gradient-to-r from-cyan-500/10 to-violet-500/5 border-r-2 border-cyan-400"
                  : "hover:bg-slate-800/40 border-r-2 border-transparent"
              }`}
            >
              <div className="min-w-0">
                <p className={`text-xs font-semibold ${selectedSymbol === sym ? "text-cyan-400" : "text-slate-300"}`}>
                  {displaySymbol(sym)}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{name}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  isInWatchlist(sym) ? removeFromWatchlist(sym) : addToWatchlist(sym)
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-slate-500 hover:text-amber-400"
              >
                {isInWatchlist(sym) ? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> : <StarOff className="h-3.5 w-3.5" />}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Watchlist count */}
      {watchlist.length > 0 && (
        <div className="p-3 border-t border-cyan-900/20">
          <p className="text-xs text-slate-500">
            <Star className="h-3 w-3 inline mr-1 fill-amber-400 text-amber-400" />
            {t.watchlistCount(watchlist.length)}
          </p>
        </div>
      )}
    </aside>
  )
}
