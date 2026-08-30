import { useState } from "react"
import { BadgeCheck, CheckCircle2, Radio, Truck } from "lucide-react"
import { pkr } from "@/lib/format"
import { onApproveFinal } from "@/store/director"
import { cn } from "@/lib/utils"
import type { OfferSet } from "@/types"

export function OffersCard({ offers }: { offers: OfferSet }) {
  const defaultT = offers.transport.find((t) => t.recommended) ?? offers.transport[0]
  const [selected, setSelected] = useState(defaultT.transporter.id)
  const [booking, setBooking] = useState(false)
  const chosen = offers.transport.find((t) => t.transporter.id === selected) ?? defaultT
  const expectedNet = offers.expectedNet - defaultT.cost + chosen.cost
  const initials = offers.buyerName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")

  return (
    <div className="w-[94%] max-w-[352px] animate-msg-in overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="flex items-center gap-2 bg-gradient-to-r from-primary-700 to-primary-600 px-3.5 py-2.5 text-white">
        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
        <span className="text-[11px] font-extrabold tracking-wide">OFFERS RECEIVED</span>
      </div>

      <div className="p-3.5">
        {/* Buyer offer */}
        <div className="flex items-start gap-2.5 rounded-xl border border-good/25 bg-good/5 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-700 text-[13px] font-extrabold text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate text-[13px] font-extrabold text-foreground">{offers.buyerName}</p>
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary-600" />
            </div>
            <p className="mt-0.5 text-[11.5px] font-medium leading-snug text-foreground/80">{offers.buyerLine}</p>
            <div className="mt-1 flex gap-1.5">
              <span className="rounded-full bg-good/15 px-2 py-0.5 text-[9.5px] font-bold text-good">
                {offers.buyerAcceptance}% acceptance
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[9.5px] font-bold text-muted-foreground">
                responds {offers.buyerResponse}
              </span>
            </div>
          </div>
        </div>

        {/* Transport options */}
        <div className="mt-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Truck className="h-4 w-4 text-primary-600" />
            <span className="text-[11px] font-extrabold tracking-wide text-foreground">
              TRANSPORT QUOTES — PICK ONE
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {offers.transport.map((t) => {
              const active = t.transporter.id === selected
              return (
                <button
                  key={t.transporter.id}
                  onClick={() => setSelected(t.transporter.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-all active:scale-[0.99]",
                    active ? "border-primary-600 bg-secondary/80 shadow-glow" : "border-border bg-card hover:border-primary-300",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2",
                      active ? "border-primary-600 bg-primary-600" : "border-muted-foreground/40",
                    )}
                  >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[12.5px] font-bold text-foreground">{t.transporter.name}</p>
                      {t.recommended && (
                        <span className="shrink-0 rounded-full bg-primary-100 px-1.5 py-0.5 text-[8.5px] font-extrabold text-primary-700">
                          BEST VALUE
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-muted-foreground">
                      {t.transporter.vehicle} · pickup {t.pickup} · {t.eta} · {t.transporter.onTimePct}% on-time
                    </p>
                    <p className="text-[10px] text-muted-foreground/75">{t.note}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-extrabold text-foreground">{pkr(t.cost)}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Net + final approval */}
        <div className="mt-3 rounded-xl bg-primary-800 p-3 text-white">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Expected net to you</p>
              <p className="text-[24px] font-extrabold leading-none">{pkr(expectedNet)}</p>
            </div>
            <p className="max-w-[130px] text-right text-[10px] leading-snug text-white/70">
              {offers.acceptedKg.toLocaleString()} kg × PKR {offers.acceptedPricePerKg}
              <br />{offers.netNote}
            </p>
          </div>
        </div>

        <button
          disabled={booking}
          onClick={() => {
            setBooking(true)
            onApproveFinal(selected)
          }}
          className={cn(
            "mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-extrabold transition-all",
            booking ? "bg-muted text-muted-foreground" : "bg-primary-600 text-white shadow-glow hover:bg-primary-700 active:scale-[0.98]",
          )}
        >
          <CheckCircle2 className="h-4.5 w-4.5" />
          {booking ? "Creating order…" : "Approve & book — final step"}
        </button>
        <p className="mt-1.5 flex items-center justify-center gap-1 text-[9.5px] text-muted-foreground">
          <Radio className="h-3 w-3 text-risk" />
          No booking happens without this approval · logged in Action Log
        </p>
      </div>
    </div>
  )
}
