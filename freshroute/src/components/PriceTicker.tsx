import { TrendingDown, TrendingUp } from "lucide-react"
import { useApp } from "@/store/useApp"

export function PriceTicker() {
  const ticker = useApp((s) => s.ticker)
  const aiMode = useApp((s) => s.aiMode)
  const items = [...ticker, ...ticker]
  return (
    <div className="relative z-10 flex items-center bg-primary-900 text-white shadow-ticker">
      <div className="flex shrink-0 items-center gap-1.5 px-3 py-1.5">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
          Mandi rates
        </span>
        {aiMode !== "live" && (
          <span className="rounded bg-amber-500/25 px-1 py-0.5 text-[8px] font-bold text-amber-200">
            DEMO
          </span>
        )}
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="flex w-max animate-marquee items-center gap-5 py-1.5 pl-4">
          {items.map((p, i) => (
            <span key={i} className="flex items-center gap-1.5 text-[11px] font-semibold">
              <span className="text-white/80">{p.city}</span>
              <span>{p.pricePerKg}</span>
              {p.trend >= 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-rose-400" />
              )}
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-primary-900 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-primary-900 to-transparent" />
      </div>
    </div>
  )
}
