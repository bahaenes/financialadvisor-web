"use client"

interface HeatmapChartProps {
  data: Record<string, number>
  title?: string
}

function getHeatColor(value: number): string {
  if (value >= 3) return "bg-emerald-500/80 text-white border-emerald-400/40"
  if (value >= 1.5) return "bg-emerald-600/60 text-emerald-200 border-emerald-500/30"
  if (value >= 0.5) return "bg-emerald-700/40 text-emerald-300 border-emerald-600/20"
  if (value >= -0.5) return "bg-slate-700/60 text-slate-300 border-slate-600/30"
  if (value >= -1.5) return "bg-rose-700/40 text-rose-300 border-rose-600/20"
  if (value >= -3) return "bg-rose-600/60 text-rose-200 border-rose-500/30"
  return "bg-rose-500/80 text-white border-rose-400/40"
}

export function HeatmapChart({ data, title }: HeatmapChartProps) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])

  return (
    <div className="w-full">
      {title && <p className="text-xs text-slate-500 font-medium mb-3 uppercase tracking-wider">{title}</p>}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {entries.map(([sector, value]) => (
          <div
            key={sector}
            className={`rounded-lg p-3 border text-center transition-all hover:scale-105 cursor-default ${getHeatColor(value)}`}
          >
            <p className="text-[10px] font-semibold leading-tight mb-1">{sector}</p>
            <p className="text-sm font-bold font-mono">
              {value >= 0 ? "+" : ""}{value.toFixed(2)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
