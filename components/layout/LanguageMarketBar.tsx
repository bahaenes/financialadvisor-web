"use client"

import { useAppStore } from "@/store/appStore"
import type { Market } from "@/lib/constants"
import { useT } from "@/lib/i18n"

const MARKET_FLAGS: Record<Market, string> = {
  BIST: "🇹🇷",
  NASDAQ: "🇺🇸",
  NYSE: "🗽",
}

export function LanguageMarketBar() {
  const { selectedMarket, language, setSelectedMarket, setLanguage } = useAppStore()
  const t = useT()

  const markets: Market[] = ["BIST", "NASDAQ", "NYSE"]

  return (
    <div className="flex items-center gap-3">
      {/* Market pills */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900/60 border border-cyan-900/20">
        {markets.map((market) => (
          <button
            key={market}
            onClick={() => setSelectedMarket(market)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-200 ${
              selectedMarket === market
                ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,212,255,0.15)]"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            <span className="text-sm leading-none">{MARKET_FLAGS[market]}</span>
            <span>{market}</span>
          </button>
        ))}
      </div>

      {/* Language toggle */}
      <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-900/60 border border-cyan-900/20">
        <button
          onClick={() => setLanguage("TR")}
          title="Türkçe"
          className={`px-2 py-1 rounded-md text-xs font-semibold transition-all duration-200 ${
            language === "TR"
              ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          🇹🇷
        </button>
        <button
          onClick={() => setLanguage("EN")}
          title="English"
          className={`px-2 py-1 rounded-md text-xs font-semibold transition-all duration-200 ${
            language === "EN"
              ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          🇺🇸
        </button>
      </div>
    </div>
  )
}
