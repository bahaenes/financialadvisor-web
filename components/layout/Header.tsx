"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useMacroData } from "@/lib/api"
import { useAppStore } from "@/store/appStore"
import { useT } from "@/lib/i18n"
import { getIstanbulTime, isMarketOpen, formatPct } from "@/lib/utils"
import { BarChart3, Clock, TrendingUp, TrendingDown, LayoutGrid } from "lucide-react"
import { LanguageMarketBar } from "@/components/layout/LanguageMarketBar"

function getMarketTime(market: string): string {
  const tz = market === "BIST" ? "Europe/Istanbul" : "America/New_York"
  return new Date().toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
}

function isUSMarketOpen(): boolean {
  const now = new Date()
  const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }))
  const day = nyTime.getDay()
  const h = nyTime.getHours()
  const m = nyTime.getMinutes()
  if (day === 0 || day === 6) return false
  const minutes = h * 60 + m
  return minutes >= 570 && minutes < 960 // 9:30 AM – 4:00 PM ET
}

export function Header() {
  const { data: macro } = useMacroData()
  const { selectedMarket } = useAppStore()
  const t = useT()
  const [time, setTime] = useState("")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const tick = () => {
      setTime(getMarketTime(selectedMarket))
      setOpen(selectedMarket === "BIST" ? isMarketOpen() : isUSMarketOpen())
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [selectedMarket])

  const bist100 = macro?.bist100
  const bist30 = macro?.bist30

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-cyan-900/20 bg-[#0f1724]/95 backdrop-blur-sm sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
          <BarChart3 className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <span className="font-bold text-sm text-white tracking-wide">Financial</span>
          <span className="font-bold text-sm bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent tracking-wide"> Advisor</span>
        </div>
      </div>

      {/* Center — market/language selector */}
      <div className="flex-1 flex justify-center">
        <LanguageMarketBar />
      </div>

      {/* Right — index data + market status + clock */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* BIST indices (only for BIST market) */}
        {selectedMarket === "BIST" && (
          <div className="hidden lg:flex items-center gap-4">
            {bist100 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">BIST 100</span>
                <span className="text-sm font-mono font-semibold text-slate-200">
                  {bist100.value?.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
                </span>
                <span className={`flex items-center gap-0.5 text-xs font-medium ${bist100.change_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {bist100.change_pct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {formatPct(bist100.change_pct)}
                </span>
              </div>
            )}
            {bist30 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">BIST 30</span>
                <span className="text-sm font-mono font-semibold text-slate-200">
                  {bist30.value?.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
                </span>
                <span className={`flex items-center gap-0.5 text-xs font-medium ${bist30.change_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {bist30.change_pct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {formatPct(bist30.change_pct)}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="h-4 w-px bg-cyan-900/30 hidden lg:block" />

        {/* Market status */}
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full animate-pulse-dot ${open ? "market-open" : "market-closed"}`} />
          <span className={`text-xs font-medium ${open ? "text-emerald-400" : "text-rose-400"}`}>
            {open ? t.marketOpen : t.marketClosed}
          </span>
        </div>

        {/* Clock */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-xs font-mono">{time}</span>
        </div>

        {/* Design screens link */}
        <Link href="/screens" className="hidden sm:flex items-center gap-1.5 text-slate-500 hover:text-cyan-400 transition-colors" title="UI Screens">
          <LayoutGrid className="h-4 w-4" />
        </Link>
      </div>
    </header>
  )
}
