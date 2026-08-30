import { AlertTriangle, PartyPopper, TrendingUp } from "lucide-react"
import { pkr } from "@/lib/format"
import type { AlertInfo, SummaryInfo } from "@/types"
import { cn } from "@/lib/utils"
import { useApp } from "@/store/useApp"

export function AlertCard({ alert }: { alert: AlertInfo }) {
  const ur = useApp((s) => s.lang === "ur")
  return (
    <div
      dir={ur ? "rtl" : undefined}
      className="w-[94%] max-w-[352px] animate-msg-in rounded-2xl border-l-4 border-warn bg-amber-50 p-3.5 shadow-card"
    >
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warn/20">
          <AlertTriangle className="h-4.5 w-4.5 text-warn" />
        </span>
        <div className="min-w-0">
          <p className={cn("text-[13px] font-extrabold text-amber-900", ur && "font-urdu text-right")}>{alert.title}</p>
          <p className={cn("mt-1 text-[12px] leading-relaxed text-amber-900/80", ur && "font-urdu text-right")}>
            {alert.body}
          </p>
        </div>
      </div>
    </div>
  )
}

export function SummaryCard({ summary }: { summary: SummaryInfo }) {
  const ur = useApp((s) => s.lang === "ur")
  return (
    <div className="w-[94%] max-w-[352px] animate-msg-in overflow-hidden rounded-2xl bg-card shadow-card">
      <div className={cn("bg-gradient-to-r from-good to-primary-600 px-3.5 py-3 text-white", ur && "bg-gradient-to-l")}>
        <div className="flex items-center gap-2">
          <PartyPopper className="h-5 w-5 text-amber-200" />
          <span className={cn("text-[13px] font-extrabold tracking-wide", ur && "font-urdu")}>{summary.title}</span>
        </div>
        <div className={cn("mt-2 flex items-end justify-between", ur && "flex-row-reverse")}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Net received</p>
            <p className="text-[26px] font-extrabold leading-none">{pkr(summary.net)}</p>
          </div>
          {summary.upliftVsLocal > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-extrabold text-amber-950">
              <TrendingUp className="h-3.5 w-3.5" />
              +{pkr(summary.upliftVsLocal).replace("PKR ", "")} {summary.upliftNote ?? "vs local"}
            </span>
          )}
        </div>
      </div>
      <div className="p-3.5">
        <ul className="flex flex-col gap-2">
          {summary.lines.map((l) => (
            <li
              key={l}
              dir={ur ? "rtl" : undefined}
              className={cn(
                "flex items-start gap-2 text-[12px] font-medium leading-snug text-foreground/85",
                ur && "flex-row-reverse text-right font-urdu",
              )}
            >
              <span className="mt-0.5 text-good">✓</span>
              {l}
            </li>
          ))}
        </ul>
        <div className="mt-3 rounded-xl bg-secondary/70 px-3 py-2.5">
          <p className={cn("text-[10.5px] leading-snug text-muted-foreground", ur && "font-urdu text-right")}>
            🌱 This completed sale feeds back into price, spoilage and buyer-reliability models — making the next
            recommendation smarter for you and your neighbours.
          </p>
        </div>
      </div>
    </div>
  )
}
