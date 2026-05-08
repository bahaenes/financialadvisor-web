export const tr = {
  // App
  appTitle: "Financial Advisor",
  appSubtitle: "Advisor",

  // Header
  marketOpen: "Piyasa Açık",
  marketClosed: "Piyasa Kapalı",
  marketStatusBist: "Borsa İstanbul",
  marketStatusNasdaq: "NASDAQ",
  marketStatusNyse: "NYSE",

  // Market selector
  marketLabel: "Piyasa",
  marketBist: "BIST",
  marketNasdaq: "NASDAQ",
  marketNyse: "NYSE",

  // Sidebar
  period: "Periyot",
  searchPlaceholder: "Hisse ara...",
  allSectors: "Tüm Sektörler",
  watchlistCount: (n: number) => `${n} hisse izleme listesinde`,
  noStockFound: "Hisse bulunamadı",

  // Periods
  period1H: "1S",
  period1D: "1G",
  period1W: "1H",
  period3M: "3A",
  period6M: "6A",
  period1Y: "1Y",
  period3Y: "3Y",

  // Tabs
  tabOverview: "Genel Bakış",
  tabTechnical: "Teknik Analiz",
  tabMacro: "Makro",
  tabNews: "Haberler",
  tabComparison: "Karşılaştırma",
  tabPortfolio: "Portföy",
  tabWatchlist: "İzleme",

  // Dashboard
  loadingData: "Veri yükleniyor...",
  refresh: "Yenile",
  dataLoadError: "Veri yüklenemedi",
  dataLoadErrorSub: "Lütfen internet bağlantınızı kontrol edin veya yenileyin",

  // Overview panel
  signalDetail: "Sinyal Detayı",
  movingAvg: "Hareketli Ort.",
  volume: "Hacim",
  marketCap: "Piyasa Değeri",
  peRatio: "F/K Oranı",
  rsi14: "RSI (14)",
  beta: "Beta",
  oversold: "Aşırı Satım",
  overbought: "Aşırı Alım",
  neutral: "Nötr",
  highVolatility: "Yüksek Oynaklık",
  lowVolatility: "Düşük Oynaklık",
  week52Range: "52 Haftalık Aralık",
  current: "Mevcut:",
  supportResistance: "Destek & Direnç",
  support: "Destek",
  resistance: "Direnç",
  dividend: "Temettü",

  // Signal labels
  signalBuy: "AL",
  signalSell: "SAT",
  signalHold: "TUT",
  signalStrongBuy: "GÜÇLÜ AL",
  signalStrongSell: "GÜÇLÜ SAT",

  // Technical panel
  indicators: "Göstergeler:",
  signal: "Sinyal:",
  loadingChart: "Grafik yükleniyor...",
  calculatingIndicators: "Göstergeler hesaplanıyor...",
  technicalSummary: "Teknik Analiz Özeti",

  // News panel
  marketSentimentIndex: "Piyasa Duygu Endeksi",
  newsAnalyzed: (n: number) => `${n} haber analiz edildi`,
  sentimentDistribution: "Duygu Dağılımı",
  sentimentPositive: "Pozitif",
  sentimentNegative: "Negatif",
  sentimentNeutral: "Nötr",
  loadingNews: "Haberler yükleniyor...",
  newsLoadError: "Haberler yüklenemedi",
  finbertBadge: "FinBERT",

  // Macro panel
  bistIndices: "BIST Endeksleri",
  usIndices: "ABD Endeksleri",
  forexCommodities: "Döviz & Emtia",
  forexRates: "Döviz Kurları",
  fearGreed: "Korku & Açgözlülük Endeksi",
  extremeGreed: "Aşırı Açgözlülük",
  greed: "Açgözlülük",
  fearNeutral: "Nötr",
  fear: "Korku",
  extremeFear: "Aşırı Korku",
  cryptoSentiment: "Kripto piyasası geneli duygu endeksi",
  macroLoadError: "Makro veriler yüklenemedi",
  sectorPerf: "Sektör Performansı (Günlük %)",

  // AI Prediction panel
  tabPrediction: "AI Tahmin",
  aiPrediction: "AI Fiyat Tahmini",
  prediction7d: "7 günlük tahmin",
  currentPrice: "Mevcut Fiyat",
  predictedPrice: "Tahmini Fiyat",
  confidenceLabel: "Güven",
  confidenceHigh: "Yüksek",
  confidenceMedium: "Orta",
  confidenceLow: "Düşük",
  forecastChart: "Fiyat Tahmini Grafiği",
  historical: "Geçmiş",
  predicted: "Tahmin",
  confidenceBand: "Güven Bandı",
  predictionLoadError: "Tahmin yüklenemedi",
  predictionDisclaimer: "Bu tahminler yatırım tavsiyesi değildir. Geçmiş fiyat verileri kullanılır; gelecek performansı garanti edilmez.",

  // Comparison panel
  compareStocks: "Karşılaştırılacak Hisseler",
  yearPerf: "1 Yıllık Performans Karşılaştırması",

  // Portfolio
  portfolio: "Portföy",

  // Watchlist
  watchlist: "İzleme Listesi",
}

export type Messages = {
  [K in keyof typeof tr]: (typeof tr)[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : string
}
