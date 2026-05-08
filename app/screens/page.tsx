import Image from "next/image"
import Link from "next/link"

const SCREENS = [
  { slug: "market-overview",      label: "Market Overview Dashboard",         dark: false },
  { slug: "market-overview-dark", label: "Market Overview Dashboard (Dark)",  dark: true  },
  { slug: "historical-chart",     label: "Historical Chart & Analysis",       dark: false },
  { slug: "historical-chart-dark",label: "Historical Chart & Analysis (Dark)",dark: true  },
  { slug: "news-sentiment",       label: "News Sentiment Feed",               dark: false },
  { slug: "news-sentiment-dark",  label: "News Sentiment Feed (Dark)",        dark: true  },
  { slug: "ai-prediction",        label: "AI Prediction Insights",            dark: false },
  { slug: "ai-prediction-dark",   label: "AI Prediction Insights (Dark)",     dark: true  },
]

export default function ScreensGallery() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0e1a" }}>
      <header className="border-b border-cyan-900/20 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="font-hanken text-headline-lg text-white">Global Market UI Kit</h1>
          <p className="text-sm text-slate-500 mt-0.5">Stitch design screens — 8 exports</p>
        </div>
        <Link href="/" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors border border-slate-700 hover:border-cyan-900/50 px-3 py-1.5 rounded-lg">
          ← Back to App
        </Link>
      </header>

      <main className="px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {SCREENS.map((screen) => (
            <div key={screen.slug} className="glass-card overflow-hidden group layer-1">
              {/* Screenshot */}
              <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                <Image
                  src={`/screens/${screen.slug}.png`}
                  alt={screen.label}
                  fill
                  className="object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                />
                {screen.dark && (
                  <span className="absolute top-3 right-3 font-ibm-plex text-label-sm px-2 py-0.5 rounded bg-slate-900/80 text-cyan-400 border border-cyan-900/40 backdrop-blur-sm">
                    Dark
                  </span>
                )}
              </div>

              {/* Card footer */}
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">{screen.label}</p>
                  <p className="font-ibm-plex text-label-sm text-slate-500 mt-0.5">{screen.slug}.png</p>
                </div>
                <a
                  href={`/screens/${screen.slug}.png`}
                  download
                  className="flex-shrink-0 ml-3 text-xs px-3 py-1.5 rounded-lg border border-cyan-900/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors font-ibm-plex text-label-sm"
                >
                  PNG
                </a>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-600 mt-10">
          Stitch project: <span className="text-slate-500">Global Market UI Kit</span> ·
          HTML code exports in <span className="text-slate-500">stitch-exports/</span>
        </p>
      </main>
    </div>
  )
}
