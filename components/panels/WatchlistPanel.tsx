"use client"

import { useAppStore } from "@/store/appStore"
import { StockCard } from "@/components/cards/StockCard"
import { Star, Plus } from "lucide-react"
import { BIST_STOCKS } from "@/lib/constants"

export function WatchlistPanel() {
  const { watchlist, addToWatchlist, removeFromWatchlist, setSelectedSymbol } = useAppStore()

  const handleClick = (symbol: string) => {
    setSelectedSymbol(symbol)
  }

  if (watchlist.length === 0) {
    return (
      <div className="glass-card p-8 text-center flex flex-col items-center gap-3">
        <Star className="h-10 w-10 text-slate-700" />
        <p className="text-sm text-slate-400 font-medium">İzleme listeniz boş</p>
        <p className="text-xs text-slate-600">Kenar çubuğundaki hisse listesinde <Star className="h-3 w-3 inline fill-amber-400 text-amber-400" /> simgesine tıklayarak hisseleri listeye ekleyin</p>
        <div className="mt-2 flex flex-wrap gap-2 justify-center">
          {["THYAO.IS", "GARAN.IS", "AKBNK.IS", "TUPRS.IS"].map((sym) => (
            <button
              key={sym}
              onClick={() => addToWatchlist(sym)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all"
            >
              <Plus className="h-3 w-3" />
              {sym.replace(".IS", "")} Ekle
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-medium">
          <Star className="h-3.5 w-3.5 inline fill-amber-400 text-amber-400 mr-1" />
          {watchlist.length} hisse izleniyor
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {watchlist.map((symbol) => (
          <StockCard
            key={symbol}
            symbol={symbol}
            onRemove={removeFromWatchlist}
            onClick={handleClick}
          />
        ))}
      </div>
    </div>
  )
}
