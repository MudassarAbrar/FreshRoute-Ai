import { TrendingDown, TrendingUp } from "lucide-react"
import { CROP_PRICES } from "@/data/market"
import { cn } from "@/lib/utils"

type FeedItem = { crop: string; city: string; code: string; price: number; trend: number }

const CODES: Record<string, string> = {
  Multan: "MUL",
  Lahore: "LHE",
  Faisalabad: "FSD",
  Islamabad: "ISB",
  Karachi: "KHI",
}

function feedFor(crop: string, cities: string[]): FeedItem[] {
  const table = CROP_PRICES[crop] ?? {}
  return cities.map((city) => ({
    crop,
    city,
    code: CODES[city] ?? city.slice(0, 3).toUpperCase(),
    price: table[city],
    trend: city === "Karachi" ? -2 : city === "Lahore" ? 4 : 1,
  }))
}

const FEED: FeedItem[] = [
  ...feedFor("Tomato", ["Multan", "Lahore", "Faisalabad", "Islamabad", "Karachi"]),
  ...feedFor("Mango", ["Multan", "Karachi"]),
  ...feedFor("Kinnow", ["Multan", "Lahore"]),
  ...feedFor("Potato", ["Lahore", "Karachi"]),
  ...feedFor("Onion", ["Karachi", "Islamabad"]),
  ...feedFor("Green Chili", ["Karachi", "Lahore"]),
  ...feedFor("Okra", ["Karachi", "Faisalabad"]),
  ...feedFor("Banana", ["Karachi"]),
]

export function MandiTicker({ className }: { className?: string }) {
  const items = [...FEED, ...FEED]
  return (
    <div className={cn("relative flex items-center overflow-hidden bg-primary-950 text-white", className)}>
      <div className="relative z-10 flex shrink-0 items-center gap-2 bg-primary-900 px-4 py-2.5 shadow-ticker">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
        <span className="font-mono text-[10px] font-semibold tracking-widest text-emerald-200">
          MANDI RATES
        </span>
        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-wider text-amber-200">
          SIMULATED PILOT FEED
        </span>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div className="flex w-max animate-marquee items-center gap-7 py-2.5 pl-6 [animation-duration:38s] hover:[animation-play-state:paused]">
          {items.map((p, i) => (
            <span key={i} className="flex items-baseline gap-1.5 font-mono text-[11.5px]">
              <span className="text-white/55">{p.crop.toUpperCase()}</span>
              <span className="font-semibold text-emerald-300/90">{p.code}</span>
              <span className="font-semibold tabular-nums">{p.price}</span>
              <span className="text-[9px] text-white/40">/kg</span>
              {p.trend >= 0 ? (
                <TrendingUp className="h-3 w-3 self-center text-emerald-400" />
              ) : (
                <TrendingDown className="h-3 w-3 self-center text-rose-400" />
              )}
              <span className={cn("text-[9px] tabular-nums", p.trend >= 0 ? "text-emerald-400/80" : "text-rose-400/80")}>
                {p.trend >= 0 ? "+" : ""}
                {p.trend}
              </span>
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-primary-950 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-primary-950 to-transparent" />
      </div>
    </div>
  )
}
