"use client"

import { useEffect, useRef } from "react"
import { createChart, ColorType, CrosshairMode, type Time } from "lightweight-charts"
import type { SeriesPoint, MACDPoint } from "@/lib/types"
import { getRsiLabel, getRsiColor } from "@/lib/utils"

const DARK_CHART_OPTIONS = {
  layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#94a3b8", fontSize: 10, fontFamily: "Inter" },
  grid: { vertLines: { color: "rgba(255,255,255,0.03)" }, horzLines: { color: "rgba(255,255,255,0.03)" } },
  crosshair: { mode: CrosshairMode.Normal },
  rightPriceScale: { borderColor: "rgba(0,212,255,0.1)" },
  timeScale: { borderColor: "rgba(0,212,255,0.1)" },
}

interface RsiChartProps {
  data: SeriesPoint[]
  height?: number
}

export function RsiChart({ data, height = 120 }: RsiChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const lastRsi = data?.length ? data[data.length - 1].value : null

  useEffect(() => {
    if (!ref.current || !data?.length) return
    const chart = createChart(ref.current, { ...DARK_CHART_OPTIONS, timeScale: { ...DARK_CHART_OPTIONS.timeScale, visible: false }, rightPriceScale: { ...DARK_CHART_OPTIONS.rightPriceScale, scaleMargins: { top: 0.1, bottom: 0.1 } } })

    const series = chart.addLineSeries({ color: "#a78bfa", lineWidth: 1 as const, lastValueVisible: true, priceLineVisible: false })
    series.setData(data.map((d) => ({ time: d.time as Time, value: d.value })))
    series.createPriceLine({ price: 70, color: "rgba(255,77,106,0.5)", lineWidth: 1 as const, lineStyle: 2, axisLabelVisible: true, title: "70" })
    series.createPriceLine({ price: 30, color: "rgba(0,200,150,0.5)", lineWidth: 1 as const, lineStyle: 2, axisLabelVisible: true, title: "30" })
    series.createPriceLine({ price: 50, color: "rgba(148,163,184,0.2)", lineWidth: 1 as const, lineStyle: 3, axisLabelVisible: false, title: "" })
    chart.timeScale().fitContent()

    const ro = new ResizeObserver(() => { if (ref.current) chart.applyOptions({ width: ref.current.clientWidth }) })
    ro.observe(ref.current)
    return () => { ro.disconnect(); chart.remove() }
  }, [data])

  return (
    <div className="relative" style={{ height }}>
      <div className="absolute top-1 left-2 z-10 flex items-center gap-2">
        <span className="text-xs text-slate-500 font-medium">RSI (14)</span>
        {lastRsi != null && (
          <span className={`text-xs font-bold ${getRsiColor(lastRsi)}`}>
            {lastRsi.toFixed(1)} — {getRsiLabel(lastRsi)}
          </span>
        )}
      </div>
      <div ref={ref} className="absolute inset-0 pt-5" />
    </div>
  )
}

interface MacdChartProps {
  data: MACDPoint[]
  height?: number
}

export function MacdChart({ data, height = 130 }: MacdChartProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || !data?.length) return
    const chart = createChart(ref.current, { ...DARK_CHART_OPTIONS, timeScale: { ...DARK_CHART_OPTIONS.timeScale, visible: false } })

    const histSeries = chart.addHistogramSeries({ color: "rgba(0,212,255,0.4)", priceLineVisible: false, lastValueVisible: false })
    histSeries.setData(data.map((d) => ({ time: d.time as Time, value: d.histogram ?? 0, color: (d.histogram ?? 0) >= 0 ? "rgba(0,200,150,0.5)" : "rgba(255,77,106,0.5)" })))

    const macdLine = chart.addLineSeries({ color: "#00d4ff", lineWidth: 1 as const, lastValueVisible: true, priceLineVisible: false })
    macdLine.setData(data.map((d) => ({ time: d.time as Time, value: d.macd ?? 0 })))

    const signalLine = chart.addLineSeries({ color: "#fbbf24", lineWidth: 1 as const, lastValueVisible: true, priceLineVisible: false })
    signalLine.setData(data.map((d) => ({ time: d.time as Time, value: d.signal ?? 0 })))

    chart.timeScale().fitContent()
    const ro = new ResizeObserver(() => { if (ref.current) chart.applyOptions({ width: ref.current.clientWidth }) })
    ro.observe(ref.current)
    return () => { ro.disconnect(); chart.remove() }
  }, [data])

  return (
    <div className="relative" style={{ height }}>
      <div className="absolute top-1 left-2 z-10 flex items-center gap-3">
        <span className="text-xs text-slate-500 font-medium">MACD</span>
        <span className="flex items-center gap-1 text-[10px]"><span className="w-3 h-0.5 bg-cyan-400 inline-block" />MACD</span>
        <span className="flex items-center gap-1 text-[10px]"><span className="w-3 h-0.5 bg-amber-400 inline-block" />Signal</span>
      </div>
      <div ref={ref} className="absolute inset-0 pt-5" />
    </div>
  )
}

interface StochChartProps {
  data: { time: string; k: number | null; d: number | null }[]
  height?: number
}

export function StochChart({ data, height = 110 }: StochChartProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || !data?.length) return
    const chart = createChart(ref.current, { ...DARK_CHART_OPTIONS, rightPriceScale: { ...DARK_CHART_OPTIONS.rightPriceScale, scaleMargins: { top: 0.1, bottom: 0.1 } } })

    const kLine = chart.addLineSeries({ color: "#00c896", lineWidth: 1 as const, lastValueVisible: true, priceLineVisible: false })
    kLine.setData(data.filter((d) => d.k != null).map((d) => ({ time: d.time as Time, value: d.k! })))
    const dLine = chart.addLineSeries({ color: "#ff4d6a", lineWidth: 1 as const, lastValueVisible: true, priceLineVisible: false })
    dLine.setData(data.filter((d) => d.d != null).map((d) => ({ time: d.time as Time, value: d.d! })))
    kLine.createPriceLine({ price: 80, color: "rgba(255,77,106,0.4)", lineWidth: 1 as const, lineStyle: 2, axisLabelVisible: false, title: "" })
    kLine.createPriceLine({ price: 20, color: "rgba(0,200,150,0.4)", lineWidth: 1 as const, lineStyle: 2, axisLabelVisible: false, title: "" })
    chart.timeScale().fitContent()

    const ro = new ResizeObserver(() => { if (ref.current) chart.applyOptions({ width: ref.current.clientWidth }) })
    ro.observe(ref.current)
    return () => { ro.disconnect(); chart.remove() }
  }, [data])

  return (
    <div className="relative" style={{ height }}>
      <div className="absolute top-1 left-2 z-10 flex items-center gap-3">
        <span className="text-xs text-slate-500 font-medium">Stochastic</span>
        <span className="flex items-center gap-1 text-[10px]"><span className="w-3 h-0.5 bg-emerald-400 inline-block" />%K</span>
        <span className="flex items-center gap-1 text-[10px]"><span className="w-3 h-0.5 bg-rose-400 inline-block" />%D</span>
      </div>
      <div ref={ref} className="absolute inset-0 pt-5" />
    </div>
  )
}
