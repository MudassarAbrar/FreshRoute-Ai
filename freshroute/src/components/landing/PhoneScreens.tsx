import {
  Award,
  Check,
  ChevronDown,
  Clock3,
  Droplets,
  Landmark,
  MapPin,
  TrendingDown,
  Truck,
  X,
} from "lucide-react"
import { pkr } from "@/lib/format"
import { cn } from "@/lib/utils"

/*
  One consistent illustrative pilot scenario across all screens:
  Ashraf · 4,000 kg tomatoes · picked near Multan, graded ~65% A / 35% B.
  Net figures derive from the app's demo feed & cost model:
    Lahore 96/kg −9% loss − transport 10,850 − fee 5,760 − loading 2,500  = 330,330
    Karachi 105/kg −12% loss − reefer 42,300 − fee 6,300 − loading 2,500 = 318,500
    Faisalabad 70/kg −5% loss − transport 7,750 − fee 4,200 − loading 2,500 = 251,550
    Local Multan 62/kg −3% loss − 6% mandi commission − cartage          = 219,680
*/
export const SCENARIO = {
  net: 330_330,
  localNet: 219_680,
  uplift: 110_650,
  gross: 384_000,
  loss: 34_560,
  transport: 10_850,
  fee: 5_760,
  loading: 2_500,
}

function Ticks() {
  return <span className="ml-1 text-[9px] tracking-tighter text-emerald-300/90">✓✓</span>
}

function MiniChip({ icon: Icon, label, tone }: { icon: React.ElementType; label: string; tone: "good" | "warn" | "risk" | "neutral" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold",
        tone === "good" && "bg-good/10 text-good",
        tone === "warn" && "bg-warn/15 text-warn",
        tone === "risk" && "bg-risk/10 text-risk",
        tone === "neutral" && "bg-muted text-muted-foreground",
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  )
}

export function ScreenChat() {
  return (
    <div className="flex h-full flex-col">
      <div className="chat-pattern flex flex-1 flex-col gap-2 overflow-hidden p-2.5">
        <div className="animate-msg-in flex justify-end" style={{ animationDelay: "0.05s" }}>
          <div className="max-w-[86%] rounded-bubble rounded-tr-sm bg-primary-700 px-3 py-2 text-white shadow-card">
            <p className="font-urdu text-right text-[12.5px] leading-loose">
              سلام! میرے پاس 4000 کلو ٹماٹر ہیں، اچھے ہیں۔ کہاں بیچوں؟
            </p>
            <p className="mt-1 text-right text-[8.5px] text-emerald-100/70">
              I have 4,000 kg of tomatoes. Where should I sell?
            </p>
            <p className="text-right">
              <Ticks />
              <span className="ml-1 text-[8px] text-emerald-100/50">9:41 AM</span>
            </p>
          </div>
        </div>

        <div className="animate-msg-in flex justify-start" style={{ animationDelay: "0.55s" }}>
          <div className="max-w-[88%] rounded-bubble rounded-tl-sm bg-card px-3 py-2 shadow-card">
            <p className="text-[11.5px] leading-relaxed text-foreground">
              Assalam-o-Alaikum Ashraf! Grading your lot from your photos and today's mandi feed…
            </p>
            <div className="mt-2 rounded-lg bg-secondary/70 px-2.5 py-1.5">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-primary-700">Lot · FR-2418</p>
              <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9.5px] text-muted-foreground">
                <span>Tomato · 4,000 kg</span>
                <span>~65% Grade A</span>
                <span>Picked today</span>
                <span>Near Multan</span>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-msg-in flex justify-start" style={{ animationDelay: "1.15s" }}>
          <div className="rounded-bubble rounded-tl-sm bg-card px-3.5 py-2.5 shadow-card">
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-typing rounded-full bg-primary-500"
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
              <span className="ml-1 text-[8.5px] font-semibold text-muted-foreground">comparing 5 mandis…</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/70 bg-card px-2.5 py-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-primary-600 px-2.5 py-1 text-[9.5px] font-bold text-white">
            ✓ Proceed with recommendation
          </span>
          <span className="rounded-full border border-border px-2.5 py-1 text-[9.5px] font-semibold text-muted-foreground">
            Show all numbers
          </span>
          <span className="rounded-full border border-border px-2.5 py-1 text-[9.5px] font-semibold text-muted-foreground">
            اردو میں جواب دیں
          </span>
        </div>
      </div>
    </div>
  )
}

function NetBar({ net, maxNet, recommended }: { net: number; maxNet: number; recommended?: boolean }) {
  const w = `${(net / maxNet) * 100}%`
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full animate-bar-grow rounded-full", recommended ? "bg-gradient-to-r from-primary-500 to-primary-700" : "bg-primary-300/60")}
        style={{ ["--bar-w" as string]: w, width: w }}
      />
    </div>
  )
}

const ROWS = [
  { id: "lahore", city: "Karachi · Empress Mkt", net: 318_500, note: "highest rate, 900 km erases it" },
  { id: "fsd", city: "Faisalabad · Chenab", net: 251_550, note: "180 km · 3–4 day terms" },
  { id: "local", city: "Local · Multan mandi", net: 219_680, note: "auction today · 6% commission" },
]

export function ScreenCompare() {
  const maxNet = SCENARIO.net
  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden bg-background p-2.5">
      <div className="animate-msg-in flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <Landmark className="h-3.5 w-3.5 text-primary-600" />
          <span className="text-[10px] font-bold tracking-wide text-foreground">MARKET COMPARISON</span>
        </div>
        <span className="text-[8px] text-muted-foreground">5 feeds · 47 min old</span>
      </div>

      <div className="animate-msg-in overflow-hidden rounded-xl border-2 border-primary-600 bg-gradient-to-b from-secondary/80 to-card" style={{ animationDelay: "0.15s" }}>
        <div className="flex items-center justify-between bg-primary-700 px-2.5 py-1 text-white">
          <span className="flex items-center gap-1 text-[8.5px] font-extrabold tracking-wider">
            <Award className="h-3 w-3 text-amber-300" />
            RECOMMENDED
          </span>
          <span className="rounded-full bg-amber-400/90 px-1.5 py-0.5 text-[8.5px] font-extrabold text-amber-950">
            +110,650
          </span>
        </div>
        <div className="p-2.5">
          <p className="text-[12px] font-extrabold leading-tight text-foreground">Lahore · Al-Karam Wholesale</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-wide text-muted-foreground">Expected net</p>
              <p className="text-[19px] font-bold leading-none text-primary-800 tabular-nums">
                330,330
              </p>
              <p className="text-[8px] text-muted-foreground">gross 384,000 − costs</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <MiniChip icon={Droplets} label="~9% loss" tone="warn" />
              <MiniChip icon={TrendingDown} label="Low risk" tone="good" />
            </div>
          </div>
          <div className="mt-2">
            <NetBar net={SCENARIO.net} maxNet={maxNet} recommended />
          </div>
          <div className="mt-2 flex flex-col gap-1">
            {[
              "96/kg at Lahore — 34 more than Multan's auction",
              "Covered Mazda booked · 6:00 AM pickup",
              "Payment 2–3 days · buyer replies < 1 hr",
            ].map((w) => (
              <p key={w} className="flex gap-1 text-[9px] leading-snug text-foreground/80">
                <span className="text-primary-500">✓</span>
                {w}
              </p>
            ))}
          </div>
        </div>
      </div>

      {ROWS.map((r, i) => (
        <div
          key={r.id}
          className="animate-msg-in flex items-center gap-2 rounded-xl border border-border/80 bg-card px-2.5 py-1.5"
          style={{ animationDelay: `${0.3 + i * 0.12}s` }}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-bold text-foreground">{r.city}</p>
            <p className="truncate text-[8.5px] text-muted-foreground">{r.note}</p>
            <div className="mt-1">
              <NetBar net={r.net} maxNet={maxNet} />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-foreground/80 tabular-nums">
            {r.net.toLocaleString()}
          </p>
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </div>
      ))}
    </div>
  )
}

export function ScreenApproval() {
  return (
    <div className="flex h-full flex-col justify-start gap-2 overflow-hidden bg-background p-2.5">
      <div className="animate-msg-in overflow-hidden rounded-2xl bg-card shadow-card">
        <div className="flex items-center gap-1.5 bg-warn/95 px-3 py-2 text-amber-950">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-amber-950">
            <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3zm-1 13l6-6-1.4-1.4L11 12.2 8.4 9.6 7 11l4 4z" />
          </svg>
          <span className="text-[9px] font-extrabold tracking-wide">APPROVAL NEEDED — NOTHING IS SENT WITHOUT YOU</span>
        </div>
        <div className="p-3">
          <p className="text-[12.5px] font-extrabold leading-snug text-foreground">
            Send offer to Al-Karam Wholesale Co.?
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Verified buyer · Lahore Sabzi Mandi · since 1998</p>

          <div className="mt-2.5 overflow-hidden rounded-xl border border-primary-200 bg-secondary/50">
            <div className="flex items-center gap-1.5 border-b border-primary-200/70 bg-primary-50 px-2.5 py-1">
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-primary-600">
                <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
              </svg>
              <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-primary-700">
                Draft · WhatsApp → Al-Karam
              </span>
            </div>
            <p className="px-2.5 py-2 text-[10.5px] leading-relaxed text-foreground/90">
              Assalam-o-Alaikum, I have 4,000 kg tomatoes (est. 65% Grade A), picked today near Multan. Asking PKR
              96/kg, can arrange inspection tomorrow morning. — Ashraf, via FreshRoute
            </p>
          </div>

          <div className="mt-2.5 flex gap-2">
            <span className="flex flex-1 items-center justify-center rounded-xl border-2 border-border py-2 text-[10.5px] font-bold text-muted-foreground">
              <X className="mr-1 h-3.5 w-3.5" />
              Not now
            </span>
            <span className="flex flex-[1.6] items-center justify-center rounded-xl bg-primary-600 py-2 text-[10.5px] font-extrabold text-white shadow-glow">
              <Check className="mr-1 h-3.5 w-3.5" />
              Approve &amp; send
            </span>
          </div>
          <p className="mt-2 text-center text-[8px] text-muted-foreground">
            Your choice is timestamped in the Action Log.
          </p>
        </div>
      </div>

      <div className="animate-msg-in rounded-xl bg-card p-2.5 shadow-card" style={{ animationDelay: "0.25s" }}>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Truck className="h-3.5 w-3.5 text-primary-600" />
          <span className="text-[9.5px] font-bold text-foreground">Next, if approved</span>
        </div>
        <div className="mt-1.5 flex flex-col gap-1 text-[9px] text-muted-foreground">
          <p>· Rana Goods Carrier · covered Mazda · 2 t · on-time 85%</p>
          <p>· Pickup 6:00 AM · 350 km · ETA Lahore 1:30 PM</p>
          <p>· {pkr(SCENARIO.transport)} transport — included in your net estimate</p>
        </div>
      </div>
    </div>
  )
}

export function ScreenTracking() {
  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden bg-background p-2.5">
      <div className="animate-msg-in rounded-2xl bg-card p-2.5 shadow-card">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary-600" />
            Order FR-2418 · live
          </span>
          <span className="flex items-center gap-1 text-[8px] font-semibold text-good">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-good" />
            ON N-5 · 61 KM/H
          </span>
        </div>

        <svg viewBox="0 0 300 96" className="mt-1 w-full">
          <path d="M24 74 C 92 22, 168 16, 276 44" fill="none" stroke="hsl(152 20% 85%)" strokeWidth="3" strokeLinecap="round" />
          <path
            d="M24 74 C 92 22, 168 16, 276 44"
            fill="none"
            stroke="hsl(152 60% 32%)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="14"
            className="animate-route-flow"
          />
          <circle cx="24" cy="74" r="5" fill="hsl(152 65% 25%)" />
          <circle cx="24" cy="74" r="2" fill="white" />
          <circle cx="276" cy="44" r="5" fill="hsl(44 22% 86%)" stroke="hsl(152 65% 25%)" strokeWidth="2" />
          <g>
            <circle r="6" fill="hsl(36 95% 50%)" stroke="white" strokeWidth="2">
              <animateMotion dur="7s" repeatCount="indefinite" path="M24 74 C 92 22, 168 16, 276 44" />
            </circle>
          </g>
          <text x="24" y="90" textAnchor="middle" fontSize="9" fontWeight="700" fill="hsl(158 10% 40%)">Multan</text>
          <text x="276" y="62" textAnchor="middle" fontSize="9" fontWeight="700" fill="hsl(158 10% 40%)">Lahore</text>
        </svg>

        <div className="mt-1 flex flex-col gap-1.5">
          {[
            { t: "Picked up · 6:12 AM", done: true },
            { t: "On N-5 near Okara · 11:40 AM", done: true },
            { t: "ETA Al-Karam ramp · 1:30 PM", done: false },
          ].map((s) => (
            <div key={s.t} className="flex items-center gap-2">
              <span className={cn("flex h-4 w-4 items-center justify-center rounded-full", s.done ? "bg-good" : "border-2 border-border")}>
                {s.done && <Check className="h-2.5 w-2.5 text-white" />}
              </span>
              <span className={cn("text-[10px]", s.done ? "text-foreground" : "font-bold text-primary-700")}>{s.t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="animate-msg-in rounded-xl border border-warn/40 bg-warn/10 p-2.5" style={{ animationDelay: "0.3s" }}>
        <p className="text-[9.5px] font-extrabold text-warn">HEAT ADVISORY · 38°C ON ROUTE</p>
        <p className="mt-0.5 text-[9px] leading-snug text-foreground/75">
          Load temp holding at 26°C under cover. No action needed — next check-in at Sahiwal.
        </p>
      </div>

      <div className="animate-msg-in flex items-center gap-2 rounded-xl bg-card p-2.5 shadow-card" style={{ animationDelay: "0.45s" }}>
        <Clock3 className="h-4 w-4 shrink-0 text-primary-600" />
        <p className="text-[9.5px] leading-snug text-muted-foreground">
          Payment <span className="font-bold text-foreground">2–3 days</span> after delivery. I'll confirm the
          receipt here — you don't need to call anyone.
        </p>
      </div>
    </div>
  )
}

export function ScreenSale() {
  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden bg-background p-2.5">
      <div className="animate-msg-in overflow-hidden rounded-2xl bg-card shadow-card">
        <div className="flex items-center gap-1.5 bg-good px-3 py-2 text-white">
          <Check className="h-3.5 w-3.5" />
          <span className="text-[9.5px] font-extrabold tracking-wide">SOLD · DELIVERED · PAID</span>
        </div>
        <div className="p-3">
          <p className="text-[10.5px] font-bold text-muted-foreground">Lahore · Al-Karam Wholesale · 4,000 kg</p>
          <p className="mt-1 font-display text-[24px] font-semibold leading-none text-primary-800">
            PKR 330,330
          </p>
          <p className="mt-0.5 text-[9px] font-semibold text-good">+110,650 vs local auction estimate</p>

          <div className="mt-2.5 rounded-lg bg-muted/60 px-2.5 py-2">
            {[
              ["Gross after 9% expected loss", 349_440],
              ["Transport · covered 350 km", -SCENARIO.transport],
              ["Platform fee · 1.5%", -SCENARIO.fee],
              ["Loading & handling", -SCENARIO.loading],
            ].map(([label, amount]) => (
              <div key={label as string} className="flex justify-between text-[9px] text-muted-foreground">
                <span>{label}</span>
                <span className="tabular-nums">
                  {amount as number > 0 ? "" : "−"}
                  {Math.abs(amount as number).toLocaleString()}
                </span>
              </div>
            ))}
            <div className="mt-1 flex justify-between border-t border-border/60 pt-1 text-[9.5px] font-bold text-foreground">
              <span>Net to Ashraf</span>
              <span className="tabular-nums">330,330</span>
            </div>
          </div>
        </div>
      </div>

      <div className="animate-msg-in rounded-xl bg-card p-2.5 shadow-card" style={{ animationDelay: "0.25s" }}>
        <p className="text-[9.5px] font-extrabold text-foreground">NEXT HARVEST INSIGHT</p>
        <p className="mt-1 text-[9.5px] leading-relaxed text-muted-foreground">
          Kinnow season opens in 12 days. Sargodha processors are already asking — want me to pre-grade your orchard
          lots when picking starts?
        </p>
        <div className="mt-2 flex gap-1.5">
          <span className="rounded-full bg-primary-600 px-2.5 py-1 text-[9px] font-bold text-white">Yes, remind me</span>
          <span className="rounded-full border border-border px-2.5 py-1 text-[9px] font-semibold text-muted-foreground">Later</span>
        </div>
      </div>
    </div>
  )
}

export const HERO_STEPS: { id: string; label: string; screen: React.ReactNode }[] = [
  { id: "chat", label: "Message & grading", screen: <ScreenChat /> },
  { id: "compare", label: "Compare 5 mandis", screen: <ScreenCompare /> },
  { id: "approve", label: "Approve outreach", screen: <ScreenApproval /> },
  { id: "track", label: "Live tracking", screen: <ScreenTracking /> },
  { id: "sale", label: "Sold & paid", screen: <ScreenSale /> },
]
