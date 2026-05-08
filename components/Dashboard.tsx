"use client"

import { useAppStore } from "@/store/appStore"
import { useStockData, useTechnicalData } from "@/lib/api"
import { LanguageContext } from "@/lib/i18n"
import { useT } from "@/lib/i18n"
import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"
import { TickerBar } from "@/components/layout/TickerBar"
import { OverviewPanel } from "@/components/panels/OverviewPanel"
import { TechnicalPanel } from "@/components/panels/TechnicalPanel"
import { MacroPanel } from "@/components/panels/MacroPanel"
import { NewsPanel } from "@/components/panels/NewsPanel"
import { ComparisonPanel } from "@/components/panels/ComparisonPanel"
import { PredictionPanel } from "@/components/panels/PredictionPanel"
import { PortfolioPanel } from "@/components/panels/PortfolioPanel"
import { WatchlistPanel } from "@/components/panels/WatchlistPanel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, RefreshCw } from "lucide-react"
import { MARKET_STOCKS } from "@/lib/constants"

function DashboardInner() {
  const { selectedSymbol, selectedPeriod, selectedMarket } = useAppStore()
  const t = useT()
  const stocks = MARKET_STOCKS[selectedMarket]

  const { data: stock, isLoading: stockLoading, error: stockError, mutate: refreshStock } = useStockData(selectedSymbol, selectedPeriod)
  const { data: technical, isLoading: techLoading } = useTechnicalData(selectedSymbol, selectedPeriod)

  const displaySymbol = selectedSymbol.replace(".IS", "")

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: "#0a0e1a" }}>
      <Header />
      <TickerBar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-0">
              {/* Stock header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {displaySymbol}
                    <span className="text-slate-500 font-normal text-sm ml-2">{stock?.name ?? stocks[selectedSymbol]}</span>
                  </h1>
                  {stockLoading && (
                    <p className="text-xs text-slate-500 animate-pulse mt-0.5">{t.loadingData}</p>
                  )}
                </div>
                <button
                  onClick={() => refreshStock()}
                  className="p-1.5 text-slate-500 hover:text-cyan-400 transition-colors rounded-lg hover:bg-cyan-500/10"
                  title={t.refresh}
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {stockError && !stockLoading && (
                <div className="glass-card p-4 flex items-center gap-3 text-rose-400 mb-4">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{t.dataLoadError}</p>
                    <p className="text-xs text-slate-500">{t.dataLoadErrorSub}</p>
                  </div>
                </div>
              )}

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-[#111827] border border-cyan-900/20 mb-6 p-1 h-auto flex-wrap gap-1">
                  {[
                    { value: "overview", label: t.tabOverview },
                    { value: "technical", label: t.tabTechnical },
                    { value: "macro", label: t.tabMacro },
                    { value: "news", label: t.tabNews },
                    { value: "prediction", label: t.tabPrediction },
                    { value: "comparison", label: t.tabComparison },
                    { value: "portfolio", label: t.tabPortfolio },
                    { value: "watchlist", label: t.tabWatchlist },
                  ].map(({ value, label }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/15 data-[state=active]:to-violet-500/15 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-500/60 text-slate-500 hover:text-slate-300 transition-all"
                    >
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="overview" className="mt-0">
                  {stock ? (
                    <OverviewPanel stock={stock} technical={technical} />
                  ) : stockLoading ? (
                    <LoadingSkeleton />
                  ) : null}
                </TabsContent>

                <TabsContent value="technical" className="mt-0">
                  {stock ? (
                    <TechnicalPanel stock={stock} technical={technical} isLoading={techLoading} />
                  ) : stockLoading ? (
                    <LoadingSkeleton />
                  ) : null}
                </TabsContent>

                <TabsContent value="macro" className="mt-0">
                  <MacroPanel />
                </TabsContent>

                <TabsContent value="news" className="mt-0">
                  <NewsPanel />
                </TabsContent>

                <TabsContent value="prediction" className="mt-0">
                  <PredictionPanel symbol={selectedSymbol} />
                </TabsContent>

                <TabsContent value="comparison" className="mt-0">
                  <ComparisonPanel currentSymbol={selectedSymbol} />
                </TabsContent>

                <TabsContent value="portfolio" className="mt-0">
                  <PortfolioPanel />
                </TabsContent>

                <TabsContent value="watchlist" className="mt-0">
                  <WatchlistPanel />
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { language } = useAppStore()
  return (
    <LanguageContext.Provider value={language}>
      <DashboardInner />
    </LanguageContext.Provider>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="glass-card p-6 h-40">
        <div className="h-6 bg-slate-800/80 rounded-lg w-48 mb-4 skeleton" />
        <div className="h-10 bg-slate-800/80 rounded-lg w-32 mb-3 skeleton" />
        <div className="h-4 bg-slate-800/80 rounded-lg w-24 skeleton" />
      </div>
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card p-4 h-20">
            <div className="h-3 bg-slate-800/80 rounded w-16 mb-3 skeleton" />
            <div className="h-6 bg-slate-800/80 rounded w-12 skeleton" />
          </div>
        ))}
      </div>
    </div>
  )
}
