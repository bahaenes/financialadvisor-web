"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { PortfolioPosition } from "@/lib/types"
import { generateId } from "@/lib/utils"
import type { Market, Language } from "@/lib/constants"
import { MARKET_STOCKS, MARKET_DEFAULT_LANG } from "@/lib/constants"

interface AppState {
  selectedSymbol: string
  selectedPeriod: string
  selectedMarket: Market
  language: Language
  watchlist: string[]
  portfolio: PortfolioPosition[]

  setSelectedSymbol: (symbol: string) => void
  setSelectedPeriod: (period: string) => void
  setSelectedMarket: (market: Market) => void
  setLanguage: (lang: Language) => void
  addToWatchlist: (symbol: string) => void
  removeFromWatchlist: (symbol: string) => void
  isInWatchlist: (symbol: string) => boolean
  addPosition: (position: Omit<PortfolioPosition, "id">) => void
  removePosition: (id: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedSymbol: "THYAO.IS",
      selectedPeriod: "1y",
      selectedMarket: "BIST",
      language: "TR",
      watchlist: [],
      portfolio: [],

      setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
      setSelectedPeriod: (period) => set({ selectedPeriod: period }),

      setSelectedMarket: (market) => {
        const stocks = MARKET_STOCKS[market]
        const firstSymbol = Object.keys(stocks)[0]
        set({
          selectedMarket: market,
          language: MARKET_DEFAULT_LANG[market],
          selectedSymbol: firstSymbol,
        })
      },

      setLanguage: (lang) => set({ language: lang }),

      addToWatchlist: (symbol) =>
        set((state) => ({
          watchlist: state.watchlist.includes(symbol) ? state.watchlist : [...state.watchlist, symbol],
        })),

      removeFromWatchlist: (symbol) =>
        set((state) => ({
          watchlist: state.watchlist.filter((s) => s !== symbol),
        })),

      isInWatchlist: (symbol) => get().watchlist.includes(symbol),

      addPosition: (position) =>
        set((state) => ({
          portfolio: [...state.portfolio, { ...position, id: generateId() }],
        })),

      removePosition: (id) =>
        set((state) => ({
          portfolio: state.portfolio.filter((p) => p.id !== id),
        })),
    }),
    {
      name: "financial-advisor-store",
      partialize: (state) => ({
        selectedSymbol: state.selectedSymbol,
        selectedPeriod: state.selectedPeriod,
        selectedMarket: state.selectedMarket,
        language: state.language,
        watchlist: state.watchlist,
        portfolio: state.portfolio,
      }),
    }
  )
)
