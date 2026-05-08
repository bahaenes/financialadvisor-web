"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/appStore"
import { BIST_STOCKS } from "@/lib/constants"
import { fetchStockPrice } from "@/lib/api"
import { formatPrice, formatPct, formatDate, generateId } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { TrendingUp, TrendingDown, Plus, Trash2, Briefcase, BarChart2 } from "lucide-react"
import type { PortfolioPositionEnriched } from "@/lib/types"

export function PortfolioPanel() {
  const { portfolio, addPosition, removePosition } = useAppStore()
  const [enriched, setEnriched] = useState<PortfolioPositionEnriched[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [symbol, setSymbol] = useState("THYAO.IS")
  const [quantity, setQuantity] = useState("")
  const [buyPrice, setBuyPrice] = useState("")
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    if (!portfolio.length) { setEnriched([]); return }
    setIsLoading(true)
    Promise.all(
      portfolio.map(async (pos) => {
        const currentPrice = (await fetchStockPrice(pos.symbol)) ?? pos.buy_price
        const currentValue = currentPrice * pos.quantity
        const costBasis = pos.buy_price * pos.quantity
        const pnl = currentValue - costBasis
        const pnlPct = (pnl / costBasis) * 100
        return { ...pos, current_price: currentPrice, current_value: currentValue, cost_basis: costBasis, pnl, pnl_pct: pnlPct }
      })
    ).then((data) => { setEnriched(data); setIsLoading(false) })
  }, [portfolio])

  const totalValue = enriched.reduce((s, p) => s + p.current_value, 0)
  const totalCost = enriched.reduce((s, p) => s + p.cost_basis, 0)
  const totalPnl = totalValue - totalCost
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  const handleAdd = () => {
    const qty = parseFloat(quantity)
    const price = parseFloat(buyPrice)
    if (!symbol || isNaN(qty) || isNaN(price) || qty <= 0 || price <= 0) return
    addPosition({ symbol, name: BIST_STOCKS[symbol] || symbol, quantity: qty, buy_price: price, buy_date: buyDate })
    setQuantity("")
    setBuyPrice("")
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {portfolio.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-4 w-4 text-cyan-400" />
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Portföy Özeti</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500">Toplam Değer</p>
              <p className="text-xl font-bold font-mono text-slate-100">₺{formatPrice(totalValue, 0)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Maliyet</p>
              <p className="text-lg font-mono text-slate-300">₺{formatPrice(totalCost, 0)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Kar / Zarar</p>
              <p className={`text-lg font-bold font-mono ${totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {totalPnl >= 0 ? "+" : ""}₺{formatPrice(Math.abs(totalPnl), 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Getiri</p>
              <span className={`flex items-center gap-1 text-lg font-bold ${totalPnlPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {totalPnlPct >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {formatPct(totalPnlPct)}
              </span>
            </div>
          </div>

          {/* Allocation bar */}
          {enriched.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2">Ağırlık Dağılımı</p>
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                {enriched.map((pos, i) => {
                  const colors = ["bg-cyan-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-blue-500"]
                  return (
                    <div
                      key={pos.id}
                      className={`${colors[i % colors.length]} transition-all`}
                      style={{ width: `${(pos.current_value / totalValue) * 100}%` }}
                      title={`${pos.symbol.replace(".IS", "")}: ${((pos.current_value / totalValue) * 100).toFixed(1)}%`}
                    />
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {enriched.map((pos, i) => {
                  const colors = ["text-cyan-400", "text-violet-400", "text-emerald-400", "text-amber-400", "text-rose-400", "text-blue-400"]
                  return (
                    <span key={pos.id} className={`text-[10px] ${colors[i % colors.length]}`}>
                      ● {pos.symbol.replace(".IS", "")} {((pos.current_value / totalValue) * 100).toFixed(1)}%
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add position form */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Pozisyon Ekle
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="text-[10px] text-slate-500 mb-1 block">Hisse</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full h-8 text-xs bg-[#0a0e1a] border border-cyan-900/30 text-slate-300 rounded-md px-2 focus:border-cyan-500/50 focus:outline-none"
            >
              {Object.entries(BIST_STOCKS).map(([sym, name]) => (
                <option key={sym} value={sym}>{sym.replace(".IS", "")} - {name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 mb-1 block">Adet</label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="100"
              className="h-8 text-xs bg-[#0a0e1a] border-cyan-900/30 text-slate-300"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 mb-1 block">Alış Fiyatı (₺)</label>
            <Input
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="245.60"
              className="h-8 text-xs bg-[#0a0e1a] border-cyan-900/30 text-slate-300"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 mb-1 block">Alış Tarihi</label>
            <Input
              type="date"
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
              className="h-8 text-xs bg-[#0a0e1a] border-cyan-900/30 text-slate-300"
            />
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-1.5 text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-all"
        >
          Pozisyon Ekle
        </button>
      </div>

      {/* Positions table */}
      {portfolio.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <BarChart2 className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Henüz pozisyon eklenmedi</p>
          <p className="text-xs text-slate-600 mt-1">Yukarıdaki formu kullanarak portföyünüzü oluşturun</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  {["Hisse", "Adet", "Alış", "Güncel", "Maliyet", "Değer", "K/Z", "%", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enriched.map((pos) => (
                  <tr key={pos.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-cyan-400">{pos.symbol.replace(".IS", "")}</div>
                      <div className="text-[10px] text-slate-500">{formatDate(pos.buy_date)}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">{pos.quantity}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">₺{formatPrice(pos.buy_price)}</td>
                    <td className="px-4 py-3 font-mono text-slate-200">₺{formatPrice(pos.current_price)}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">₺{formatPrice(pos.cost_basis, 0)}</td>
                    <td className="px-4 py-3 font-mono text-slate-200">₺{formatPrice(pos.current_value, 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono font-medium ${pos.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {pos.pnl >= 0 ? "+" : ""}₺{formatPrice(Math.abs(pos.pnl), 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono font-medium ${pos.pnl_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {formatPct(pos.pnl_pct)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => removePosition(pos.id)} className="text-slate-600 hover:text-rose-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
