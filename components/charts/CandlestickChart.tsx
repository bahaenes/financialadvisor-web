"use client"

import { useEffect, useRef } from "react"
import { createChart, ColorType, CrosshairMode, type IChartApi, type ISeriesApi, type SeriesMarker, type Time } from "lightweight-charts"
import type { OHLCVBar, SeriesPoint, BollingerPoint } from "@/lib/types"

interface CandlestickChartProps {
  ohlcv: OHLCVBar[]
  sma20?: SeriesPoint[]
  sma50?: SeriesPoint[]
  ema12?: SeriesPoint[]
  ema26?: SeriesPoint[]
  bollinger?: BollingerPoint[]
  signalScore?: number
  height?: number
}

export function CandlestickChart({ ohlcv, sma20, sma50, ema12, ema26, bollinger, height = 420 }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!containerRef.current || !ohlcv?.length) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
        fontSize: 11,
        fontFamily: "Inter, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: "rgba(0, 212, 255, 0.1)",
        textColor: "#94a3b8",
      },
      timeScale: {
        borderColor: "rgba(0, 212, 255, 0.1)",
        timeVisible: true,
      },
      handleScroll: true,
      handleScale: true,
    })
    chartRef.current = chart

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#00c896",
      downColor: "#ff4d6a",
      borderUpColor: "#00c896",
      borderDownColor: "#ff4d6a",
      wickUpColor: "#00c896",
      wickDownColor: "#ff4d6a",
    })

    const candleData = ohlcv
      .filter((b) => b.open != null && b.high != null && b.low != null && b.close != null)
      .map((b) => ({ time: b.time as Time, open: b.open, high: b.high, low: b.low, close: b.close }))
    candleSeries.setData(candleData)

    // Volume series
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      color: "rgba(0, 212, 255, 0.3)",
    })
    chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
    const volumeData = ohlcv.map((b, i) => ({
      time: b.time as Time,
      value: b.volume,
      color: i > 0 && b.close >= ohlcv[i - 1].close ? "rgba(0, 200, 150, 0.35)" : "rgba(255, 77, 106, 0.35)",
    }))
    volumeSeries.setData(volumeData)

    // MA overlays
    const addLine = (data: SeriesPoint[] | undefined, color: string) => {
      if (!data?.length) return
      const s = chart.addLineSeries({ color, lineWidth: 1 as const, lastValueVisible: false, priceLineVisible: false })
      s.setData(data.map((d) => ({ time: d.time as Time, value: d.value })))
    }

    addLine(sma20, "rgba(251, 191, 36, 0.7)")
    addLine(sma50, "rgba(0, 212, 255, 0.7)")
    addLine(ema12, "rgba(167, 139, 250, 0.6)")
    addLine(ema26, "rgba(248, 113, 113, 0.6)")

    // Bollinger Bands
    if (bollinger?.length) {
      const upperS = chart.addLineSeries({ color: "rgba(148, 163, 184, 0.4)", lineWidth: 1, lastValueVisible: false, priceLineVisible: false })
      const lowerS = chart.addLineSeries({ color: "rgba(148, 163, 184, 0.4)", lineWidth: 1, lastValueVisible: false, priceLineVisible: false })
      upperS.setData(bollinger.map((d) => ({ time: d.time as Time, value: d.upper })))
      lowerS.setData(bollinger.map((d) => ({ time: d.time as Time, value: d.lower })))
    }

    chart.timeScale().fitContent()

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [ohlcv, sma20, sma50, ema12, ema26, bollinger])

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={containerRef} className="absolute inset-0" />
      {/* Legend */}
      <div className="absolute top-2 left-2 flex items-center gap-3 z-10 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-amber-400/70 inline-block" />SMA 20</span>
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-cyan-400/70 inline-block" />SMA 50</span>
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-violet-400/60 inline-block" />EMA 12</span>
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-red-400/60 inline-block" />EMA 26</span>
        {bollinger?.length && <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-slate-400/40 inline-block" />BB</span>}
      </div>
    </div>
  )
}
