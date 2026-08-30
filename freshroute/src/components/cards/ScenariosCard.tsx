import { useState } from "react"
import { Award, ChevronDown, Clock3, Droplets, Landmark, TrendingDown } from "lucide-react"
import { pkr } from "@/lib/format"
import { proceedWith } from "@/store/director"
import { cn } from "@/lib/utils"
import type { Scenario } from "@/types"

function Chip({ icon: Icon, label, tone }: { icon: React.ElementType; label: string; tone: "good" | "warn" | "risk" | "neutral" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
        tone === "good" && "bg-good/10 text-good",
        tone === "warn" && "bg-warn/15 text-warn",
        tone === "risk" && "bg-risk/10 text-risk",
        tone === "neutral" && "bg-muted text-muted-foreground",
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

function NetBar({ net, maxNet, recommended }: { net: number; maxNet: number; recommended: boolean }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full animate-bar-grow", recommended ? "bg-gradient-to-r from-primary-500 to-primary-700" : "bg-primary-300/60")}
        style={{ ["--bar-w" as string]: `${(net / maxNet) * 100}%`, width: `${(net / maxNet) * 100}%` }}
      />
    </div>
  )
}

function ScenarioRow({ s, maxNet, onChoose }: { s: Scenario; maxNet: number; onChoose: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-bold text-foreground">{s.title}</p>
          <p className="truncate text-[10.5px] text-muted-foreground">{s.market} · {s.paymentTerms}</p>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-extrabold text-foreground">{pkr(s.net)}</p>
          <p className="text-[9.5px] font-semibold text-muted-foreground">net</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="animate-fade-up border-t border-border/60 px-3 py-2.5">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Chip icon={Droplets} label={`Spoilage ~${Math.round(s.spoilagePct * 100)}%`} tone={s.spoilagePct > 0.1 ? "risk" : "warn"} />
            <Chip icon={TrendingDown} label={`${s.risk} risk`} tone={s.risk === "Low" ? "good" : s.risk === "Medium" ? "warn" : "risk"} />
            <Chip icon={Clock3} label={s.paymentTerms} tone="neutral" />
          </div>
          <div className="mb-2">
            <NetBar net={s.net} maxNet={maxNet} recommended={false} />
          </div>
          <ul className="mb-2 flex flex-col gap-1">
            {s.why.map((w) => (
              <li key={w} className="flex gap-1.5 text-[11px] leading-snug text-muted-foreground">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary-400" />
                {w}
              </li>
            ))}
          </ul>
          <div className="mb-2 rounded-lg bg-muted/60 px-2.5 py-2">
            {s.deductions.map((d) => (
              <div key={d.label} className="flex justify-between text-[10.5px] text-muted-foreground">
                <span>{d.label}</span>
                <span>−{pkr(d.amount)}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => onChoose(s.id)}
            className="w-full rounded-lg border border-primary-600 py-2 text-[12px] font-bold text-primary-700 transition-colors hover:bg-secondary"
          >
            Choose this option
          </button>
        </div>
      )}
    </div>
  )
}

export function ScenariosCard({ scenarios, recommendedId }: { scenarios: Scenario[]; recommendedId: string }) {
  const rec = scenarios.find((s) => s.id === recommendedId) ?? scenarios[0]
  const others = scenarios.filter((s) => s.id !== rec.id)
  const maxNet = Math.max(...scenarios.map((s) => s.net))
  const local = scenarios.find((s) => s.id === "local")
  const uplift = local ? rec.net - local.net : 0
  const [recOpen, setRecOpen] = useState(true)

  return (
    <div className="w-[94%] max-w-[352px] animate-msg-in flex flex-col gap-2 rounded-2xl bg-card p-3 shadow-card">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <Landmark className="h-4 w-4 text-primary-600" />
          <span className="text-[12px] font-bold tracking-wide text-foreground">MARKET COMPARISON</span>
        </div>
        <span className="text-[9.5px] font-semibold text-muted-foreground">5 feeds · avg 47 min old</span>
      </div>

      {/* Recommended */}
      <div className="relative overflow-hidden rounded-xl border-2 border-primary-600 bg-gradient-to-b from-secondary/80 to-card">
        <div className="flex items-center justify-between bg-primary-700 px-3 py-1.5 text-white">
          <span className="flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-wider">
            <Award className="h-3.5 w-3.5 text-amber-300" />
            RECOMMENDED
          </span>
          {uplift > 0 && (
            <span className="rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-extrabold text-amber-950">
              +{pkr(uplift).replace("PKR ", "")} vs local
            </span>
          )}
        </div>
        <div className="p-3">
          <p className="text-[14px] font-extrabold leading-tight text-foreground">{rec.title}</p>
          <p className="mb-2 text-[11px] text-muted-foreground">{rec.buyerName} · {rec.market}</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">Expected net</p>
              <p className="text-[24px] font-extrabold leading-none text-primary-800">{pkr(rec.net)}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">gross {pkr(rec.gross)} − costs</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Chip icon={Droplets} label={`Spoilage ~${Math.round(rec.spoilagePct * 100)}%`} tone="warn" />
              <Chip icon={TrendingDown} label={`${rec.risk} risk`} tone="warn" />
              <Chip icon={Clock3} label={`Pay ${rec.paymentTerms}`} tone="neutral" />
            </div>
          </div>
          <div className="mt-2.5">
            <NetBar net={rec.net} maxNet={maxNet} recommended />
          </div>

          <button
            onClick={() => setRecOpen(!recOpen)}
            className="mt-2.5 flex w-full items-center justify-between rounded-lg bg-secondary/80 px-2.5 py-1.5 text-[11px] font-bold text-primary-800"
          >
            Why this is best for you
            <ChevronDown className={cn("h-4 w-4 transition-transform", recOpen && "rotate-180")} />
          </button>
          {recOpen && (
            <ul className="animate-fade-up mt-2 flex flex-col gap-1.5">
              {rec.why.map((w) => (
                <li key={w} className="flex gap-1.5 text-[11.5px] font-medium leading-snug text-foreground/85">
                  <span className="mt-0.5 text-primary-500">✓</span>
                  {w}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Others */}
      <div className="flex flex-col gap-1.5">
        {others.map((s) => (
          <ScenarioRow key={s.id} s={s} maxNet={maxNet} onChoose={(id) => proceedWith(id)} />
        ))}
      </div>

      <p className="px-0.5 text-[9.5px] leading-snug text-muted-foreground/80">
        Estimates use timestamped mandi prices, a crop spoilage model and route distance. Figures are not guarantees.
      </p>
    </div>
  )
}
