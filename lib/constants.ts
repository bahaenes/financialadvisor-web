export const BIST_STOCKS: Record<string, string> = {
  "THYAO.IS": "Türk Hava Yolları",
  "GARAN.IS": "Garanti BBVA",
  "AKBNK.IS": "Akbank",
  "EREGL.IS": "Ereğli Demir Çelik",
  "SISE.IS": "Şişe Cam",
  "KCHOL.IS": "Koç Holding",
  "SAHOL.IS": "Sabancı Holding",
  "TUPRS.IS": "Tüpraş",
  "ASELS.IS": "Aselsan",
  "BIMAS.IS": "BİM Mağazalar",
  "TCELL.IS": "Turkcell",
  "PGSUS.IS": "Pegasus",
  "TAVHL.IS": "TAV Havalimanları",
  "FROTO.IS": "Ford Otosan",
  "TOASO.IS": "Tofaş Oto",
  "VESTL.IS": "Vestel",
  "ARCLK.IS": "Arçelik",
  "PETKM.IS": "Petkim",
  "KOZAL.IS": "Koza Altın",
  "KOZAA.IS": "Koza Anadolu",
  "HEKTS.IS": "Hektaş",
  "SASA.IS": "SASA Polyester",
  "EKGYO.IS": "Emlak Konut GYO",
  "ENKAI.IS": "Enka İnşaat",
  "ISCTR.IS": "İş Bankası",
  "YKBNK.IS": "Yapı Kredi",
  "VAKBN.IS": "Vakıfbank",
  "HALKB.IS": "Halkbank",
  "TTKOM.IS": "Türk Telekom",
  "GUBRF.IS": "Gübre Fabrikaları",
}

export const NASDAQ_STOCKS: Record<string, string> = {
  "AAPL": "Apple Inc.",
  "MSFT": "Microsoft Corp.",
  "GOOGL": "Alphabet Inc.",
  "AMZN": "Amazon.com Inc.",
  "META": "Meta Platforms",
  "NVDA": "NVIDIA Corp.",
  "TSLA": "Tesla Inc.",
  "NFLX": "Netflix Inc.",
  "INTC": "Intel Corp.",
  "AMD": "Advanced Micro Devices",
  "QCOM": "Qualcomm Inc.",
  "AVGO": "Broadcom Inc.",
  "ADBE": "Adobe Inc.",
  "CRM": "Salesforce Inc.",
  "PYPL": "PayPal Holdings",
  "ORCL": "Oracle Corp.",
  "TXN": "Texas Instruments",
  "AMAT": "Applied Materials",
  "MU": "Micron Technology",
  "PANW": "Palo Alto Networks",
}

export const NYSE_STOCKS: Record<string, string> = {
  "JPM": "JPMorgan Chase",
  "BAC": "Bank of America",
  "WFC": "Wells Fargo",
  "GS": "Goldman Sachs",
  "MS": "Morgan Stanley",
  "JNJ": "Johnson & Johnson",
  "UNH": "UnitedHealth Group",
  "PFE": "Pfizer Inc.",
  "XOM": "ExxonMobil Corp.",
  "CVX": "Chevron Corp.",
  "WMT": "Walmart Inc.",
  "HD": "Home Depot Inc.",
  "DIS": "Walt Disney Co.",
  "KO": "Coca-Cola Co.",
  "MCD": "McDonald's Corp.",
  "NKE": "Nike Inc.",
  "BA": "Boeing Co.",
  "GE": "GE Aerospace",
  "V": "Visa Inc.",
  "MA": "Mastercard Inc.",
}

export type Market = "BIST" | "NASDAQ" | "NYSE"
export type Language = "TR" | "EN"

export const MARKET_STOCKS: Record<Market, Record<string, string>> = {
  BIST: BIST_STOCKS,
  NASDAQ: NASDAQ_STOCKS,
  NYSE: NYSE_STOCKS,
}

export const MARKET_INDICES: Record<Market, string> = {
  BIST: "XU100.IS",
  NASDAQ: "^IXIC",
  NYSE: "^GSPC",
}

export const MARKET_CURRENCIES: Record<Market, string> = {
  BIST: "₺",
  NASDAQ: "$",
  NYSE: "$",
}

export const MARKET_DEFAULT_LANG: Record<Market, Language> = {
  BIST: "TR",
  NASDAQ: "EN",
  NYSE: "EN",
}

export const MARKET_TIMEZONES: Record<Market, string> = {
  BIST: "Europe/Istanbul",
  NASDAQ: "America/New_York",
  NYSE: "America/New_York",
}

export const BIST_SECTORS: Record<string, string[]> = {
  "Bankacılık": ["GARAN.IS", "AKBNK.IS", "ISCTR.IS", "YKBNK.IS", "VAKBN.IS", "HALKB.IS"],
  "Havacılık": ["THYAO.IS", "PGSUS.IS", "TAVHL.IS"],
  "Enerji": ["TUPRS.IS", "PETKM.IS"],
  "Holding": ["KCHOL.IS", "SAHOL.IS"],
  "Savunma": ["ASELS.IS"],
  "Perakende": ["BIMAS.IS"],
  "Telekom": ["TCELL.IS", "TTKOM.IS"],
  "Otomotiv": ["FROTO.IS", "TOASO.IS"],
  "Teknoloji": ["VESTL.IS"],
  "Tüketici": ["ARCLK.IS"],
  "Cam & Seramik": ["SISE.IS"],
  "Madencilik": ["KOZAL.IS", "KOZAA.IS"],
  "Kimya": ["SASA.IS", "HEKTS.IS"],
  "GYO": ["EKGYO.IS"],
  "İnşaat": ["ENKAI.IS"],
  "Gübre": ["GUBRF.IS"],
  "Demir-Çelik": ["EREGL.IS"],
}

export const NASDAQ_SECTORS: Record<string, string[]> = {
  "Technology": ["AAPL", "MSFT", "GOOGL", "META", "ADBE", "CRM", "ORCL"],
  "Semiconductors": ["NVDA", "AMD", "INTC", "QCOM", "AVGO", "TXN", "AMAT", "MU"],
  "Consumer": ["AMZN", "TSLA", "NFLX", "PYPL"],
  "Security": ["PANW"],
}

export const NYSE_SECTORS: Record<string, string[]> = {
  "Finance": ["JPM", "BAC", "WFC", "GS", "MS", "V", "MA"],
  "Healthcare": ["JNJ", "UNH", "PFE"],
  "Energy": ["XOM", "CVX"],
  "Consumer": ["WMT", "HD", "DIS", "KO", "MCD", "NKE"],
  "Industrial": ["BA", "GE"],
}

export const MARKET_SECTORS: Record<Market, Record<string, string[]>> = {
  BIST: BIST_SECTORS,
  NASDAQ: NASDAQ_SECTORS,
  NYSE: NYSE_SECTORS,
}

export const TICKER_SYMBOLS = ["THYAO.IS", "GARAN.IS", "AKBNK.IS", "EREGL.IS", "TUPRS.IS", "SISE.IS", "KCHOL.IS", "BIMAS.IS"]

export const TICKER_SYMBOLS_BY_MARKET: Record<Market, string[]> = {
  BIST: ["THYAO.IS", "GARAN.IS", "AKBNK.IS", "EREGL.IS", "TUPRS.IS", "SISE.IS", "KCHOL.IS", "BIMAS.IS"],
  NASDAQ: ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "TSLA", "AMZN", "AMD"],
  NYSE: ["JPM", "BAC", "XOM", "WMT", "V", "JNJ", "GS", "DIS"],
}

export const PERIODS = [
  { label: "1H", value: "1d", interval: "1h" },
  { label: "1G", value: "5d", interval: "1h" },
  { label: "1H", value: "1mo", interval: "1d" },
  { label: "3A", value: "3mo", interval: "1d" },
  { label: "6A", value: "6mo", interval: "1d" },
  { label: "1Y", value: "1y", interval: "1d" },
  { label: "3Y", value: "3y", interval: "1wk" },
]

export const COLORS = {
  bgPrimary: "#0a0e1a",
  bgCard: "#111827",
  bgCardHover: "#1a2035",
  accent: "#00d4ff",
  positive: "#00c896",
  negative: "#ff4d6a",
  neutral: "#fbbf24",
  textPrimary: "#e2e8f0",
  textMuted: "#94a3b8",
  border: "rgba(0, 212, 255, 0.15)",
  grid: "rgba(255, 255, 255, 0.06)",
}

export const ISTANBUL_TZ = "Europe/Istanbul"
