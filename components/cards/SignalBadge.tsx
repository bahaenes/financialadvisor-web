"use client"

import { useT } from "@/lib/i18n"

interface SignalBadgeProps {
  signal: "AL" | "SAT" | "TUT" | string
  score?: number
  size?: "sm" | "md" | "lg"
}

export function SignalBadge({ signal, score, size = "md" }: SignalBadgeProps) {
  const t = useT()

  // Map internal signal codes → localized display labels
  const labelMap: Record<string, string> = {
    AL: t.signalBuy,
    SAT: t.signalSell,
    TUT: t.signalHold,
  }

  const classMap: Record<string, string> = {
    AL: "signal-al",
    SAT: "signal-sat",
    TUT: "signal-tut",
  }

  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : size === "lg" ? "text-base px-4 py-1.5" : "text-sm px-3 py-1"
  const cls = classMap[signal] ?? "signal-tut"
  const label = labelMap[signal] ?? signal

  return (
    <div className="flex items-center gap-2">
      <span className={`font-bold rounded-lg inline-flex items-center tracking-wide ${sizeClass} ${cls}`}>
        {label}
      </span>
      {score != null && (
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${signal === "AL" ? "bg-emerald-400" : signal === "SAT" ? "bg-rose-400" : "bg-amber-400"}`}
              style={{ width: `${Math.round(score * 100)}%` }}
            />
          </div>
          <span className="text-xs text-slate-400">{Math.round(score * 100)}%</span>
        </div>
      )}
    </div>
  )
}
