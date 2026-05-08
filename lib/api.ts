import useSWR from "swr"
import type { StockData, TechnicalData, MacroData, NewsData, TickerItem, PredictionData } from "./types"

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error(`API error ${r.status}`)
  return r.json()
})

export function useStockData(symbol: string, period = "1y") {
  return useSWR<StockData>(
    symbol ? `/api/stock?symbol=${symbol}&period=${period}` : null,
    fetcher,
    { refreshInterval: 300_000, revalidateOnFocus: false }
  )
}

export function useTechnicalData(symbol: string, period = "1y") {
  return useSWR<TechnicalData>(
    symbol ? `/api/technical?symbol=${symbol}&period=${period}` : null,
    fetcher,
    { refreshInterval: 300_000, revalidateOnFocus: false }
  )
}

export function useMacroData() {
  return useSWR<MacroData>("/api/macro", fetcher, {
    refreshInterval: 3_600_000,
    revalidateOnFocus: false,
  })
}

export function useNewsData(market = "BIST") {
  return useSWR<NewsData>(`/api/news?market=${market}`, fetcher, {
    refreshInterval: 600_000,
    revalidateOnFocus: false,
  })
}

export function useTickerData(symbols: string[]) {
  return useSWR<TickerItem[]>(
    symbols.length ? `/api/ticker?symbols=${symbols.join(",")}` : null,
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: false }
  )
}

export function usePredictionData(symbol: string) {
  return useSWR<PredictionData>(
    symbol ? `/api/predict?symbol=${symbol}` : null,
    fetcher,
    { refreshInterval: 3_600_000, revalidateOnFocus: false }
  )
}

export async function fetchStockPrice(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`/api/stock?symbol=${symbol}&period=5d`)
    if (!res.ok) return null
    const data: StockData = await res.json()
    return data.price
  } catch {
    return null
  }
}
