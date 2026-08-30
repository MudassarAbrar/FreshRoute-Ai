import { AlertTriangle, Check, CircleDashed, Loader2, MapPin, Navigation, Package } from "lucide-react"
import { pkr } from "@/lib/format"
import type { Order, TrackStep } from "@/types"
import { cn } from "@/lib/utils"

function StepIcon({ state }: { state: TrackStep["state"] }) {
  if (state === "done")
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-good text-white">
        <Check className="h-3.5 w-3.5" />
      </span>
    )
  if (state === "active")
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </span>
    )
  if (state === "alert")
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warn text-white">
        <AlertTriangle className="h-3.5 w-3.5" />
      </span>
    )
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-muted-foreground/30 bg-card">
      <CircleDashed className="h-3.5 w-3.5 text-muted-foreground/50" />
    </span>
  )
}

export function OrderCard({ order }: { order: Order }) {
  const allDone = order.steps.every((s) => s.state === "done")
  return (
    <div className="w-[94%] max-w-[352px] animate-msg-in overflow-hidden rounded-2xl bg-card shadow-card">
      <div
        className={cn(
          "flex items-center justify-between px-3.5 py-2.5 text-white",
          allDone ? "bg-good" : "bg-gradient-to-r from-primary-800 to-primary-700",
        )}
      >
        <span className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-wide">
          <Package className="h-4 w-4" />
          ORDER {order.id}
        </span>
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold">
          {allDone ? "COMPLETED ✓" : "LIVE"}
        </span>
      </div>

      <div className="p-3.5">
        {/* Route strip */}
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-secondary/70 px-3 py-2.5">
          <MapPin className="h-4 w-4 shrink-0 text-primary-600" />
          <span className="text-[12px] font-extrabold text-foreground">Multan</span>
          <span className="flex flex-1 items-center gap-1">
            <span className="h-[2px] flex-1 rounded bg-primary-300" />
            <Navigation className="h-3.5 w-3.5 text-primary-500" />
          </span>
          <span className="text-[12px] font-extrabold text-foreground">{order.destination}</span>
        </div>

        {/* Timeline */}
        <ol className="relative ml-3 flex flex-col">
          {order.steps.map((s, i) => (
            <li key={s.label} className="relative flex gap-3 pb-3.5 last:pb-0">
              {i < order.steps.length - 1 && (
                <span
                  className={cn(
                    "absolute left-3 top-7 h-[calc(100%-14px)] w-[2px] rounded",
                    s.state === "done" ? "bg-good/50" : "bg-muted",
                  )}
                />
              )}
              <StepIcon state={s.state} />
              <div className="ml-0.5 min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      "text-[12.5px] font-bold leading-tight",
                      s.state === "pending" ? "text-muted-foreground/60" : "text-foreground",
                    )}
                  >
                    {s.label}
                  </p>
                  <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">{s.time}</span>
                </div>
                {s.detail && (
                  <p
                    className={cn(
                      "mt-0.5 text-[10.5px] font-medium leading-snug",
                      s.state === "alert" ? "text-warn" : "text-muted-foreground",
                    )}
                  >
                    {s.detail}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>

        {/* Summary strip */}
        <div className="mt-1 flex items-center justify-between rounded-xl bg-primary-800 px-3 py-2.5 text-white">
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-200">Agreed</p>
            <p className="text-[13px] font-extrabold">
              {order.quantityKg.toLocaleString()} kg × PKR {order.pricePerKg} = {pkr(order.gross)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-200">Net to you</p>
            <p className="text-[15px] font-extrabold text-emerald-300">{pkr(order.net)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
