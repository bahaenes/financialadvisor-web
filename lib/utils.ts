import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ISTANBUL_TZ } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(value: number | null | undefined, decimals = 2): string {
  if (value == null || isNaN(value)) return "—"
  return value.toLocaleString("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function formatChange(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "—"
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}`
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "—"
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

export function formatVolume(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "—"
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(0)
}

export function formatMarketCap(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "—"
  if (value >= 1_000_000_000_000) return `₺${(value / 1_000_000_000_000).toFixed(2)}T`
  if (value >= 1_000_000_000) return `₺${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `₺${(value / 1_000_000).toFixed(2)}M`
  return `₺${value.toFixed(0)}`
}

export function isMarketOpen(): boolean {
  const now = new Date()
  const istanbulTime = new Date(now.toLocaleString("en-US", { timeZone: ISTANBUL_TZ }))
  const day = istanbulTime.getDay()
  const hour = istanbulTime.getHours()
  const minute = istanbulTime.getMinutes()
  const timeInMinutes = hour * 60 + minute
  return day >= 1 && day <= 5 && timeInMinutes >= 600 && timeInMinutes < 1080
}

export function getIstanbulTime(): string {
  return new Date().toLocaleTimeString("tr-TR", { timeZone: ISTANBUL_TZ, hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

export function getChangeColor(value: number | null | undefined): string {
  if (value == null) return "text-slate-400"
  if (value > 0) return "text-emerald-400"
  if (value < 0) return "text-rose-400"
  return "text-slate-400"
}

export function getRsiLabel(rsi: number): string {
  if (rsi < 30) return "Aşırı Satım"
  if (rsi > 70) return "Aşırı Alım"
  return "Nötr"
}

export function getRsiColor(rsi: number): string {
  if (rsi < 30) return "text-emerald-400"
  if (rsi > 70) return "text-rose-400"
  return "text-amber-400"
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}
