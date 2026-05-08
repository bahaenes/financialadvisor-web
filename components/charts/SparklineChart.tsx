"use client"

import { useEffect, useRef } from "react"
import { createChart, ColorType, type Time } from "lightweight-charts"

interface SparklineProps {
  data: { time: string; value: number }[]
  color?: string
  height?: number
}

export function SparklineChart({ data, height = 48 }: SparklineProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || !data?.length) return

    const chart = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "transparent" },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      crosshair: { vertLine: { visible: false }, horzLine: { visible: false } },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      timeScale: { visible: false, rightOffset: 0 },
      handleScroll: false,
      handleScale: false,
    })

    const isPositive = data.length >= 2 && data[data.length - 1].value >= data[0].value
    const fillColor = isPositive ? "rgba(0, 200, 150, 0.15)" : "rgba(255, 77, 106, 0.15)"
    const lineColor = isPositive ? "#00c896" : "#ff4d6a"

    const series = chart.addAreaSeries({
      lineColor,
      topColor: fillColor,
      bottomColor: "rgba(0,0,0,0)",
      lineWidth: 1 as const,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    series.setData(data.filter((d) => d.value != null).map((d) => ({ time: d.time as Time, value: d.value })))
    chart.timeScale().fitContent()

    const ro = new ResizeObserver(() => { if (ref.current) chart.applyOptions({ width: ref.current.clientWidth }) })
    ro.observe(ref.current)
    return () => { ro.disconnect(); chart.remove() }
  }, [data])

  return <div ref={ref} style={{ height, width: "100%" }} />
}
