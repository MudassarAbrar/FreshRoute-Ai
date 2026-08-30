import { useEffect, useRef, useState } from "react"
import { BadgeCheck, Check } from "lucide-react"
import { HERO_STEPS } from "@/components/landing/PhoneScreens"
import { PhoneMockup } from "@/components/landing/PhoneMockup"
import { Reveal } from "@/components/landing/Reveal"
import { cn } from "@/lib/utils"

type Story = {
  id: string
  initials: string
  name: string
  meta: string
  crop: string
  quote: string
  did: string[]
  outcome: string
  outcomeNote: string
  screenIndex: number
  artifact: React.ReactNode
}

const fmt = (n: number) => n.toLocaleString()

function CompareBars() {
  const rows = [
    { city: "Local · Multan mandi", net: 219_680 },
    { city: "Faisalabad · Chenab Traders", net: 251_550 },
    { city: "Karachi · Empress Market", net: 318_500 },
    { city: "Lahore · Al-Karam ✓", net: 330_330, rec: true },
  ]
  const max = 330_330
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <div key={r.city}>
          <div className="mb-0.5 flex items-baseline justify-between text-[10px]">
            <span className={cn("font-semibold", r.rec ? "text-primary-700" : "text-muted-foreground")}>{r.city}</span>
            <span className={cn("font-mono font-semibold tabular-nums", r.rec ? "text-primary-800" : "text-foreground/70")}>
              {fmt(r.net)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full animate-bar-grow rounded-full", r.rec ? "bg-gradient-to-r from-primary-500 to-primary-700" : "bg-primary-300/50")}
              style={{ ["--bar-w" as string]: `${(r.net / max) * 100}%`, width: `${(r.net / max) * 100}%`, animationDelay: `${i * 0.1}s` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function KarachiVsFsd() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[
        {
          title: "Karachi",
          net: 142_535,
          lines: ["900 km · 12 hrs", "refrigerated truck", "80% acceptance"],
          muted: true,
        },
        {
          title: "Faisalabad ✓",
          net: 137_170,
          lines: ["250 km · 4 hrs", "covered Mazda", "pays on delivery"],
        },
      ].map((c) => (
        <div key={c.title} className={cn("rounded-xl border p-2.5", c.muted ? "border-border bg-muted/40" : "border-primary-600 bg-secondary/60")}>
          <p className={cn("text-[10px] font-extrabold", c.muted ? "text-muted-foreground" : "text-primary-700")}>{c.title}</p>
          <p className={cn("font-mono text-[15px] font-semibold tabular-nums", c.muted ? "text-foreground/60" : "text-primary-800")}>
            {fmt(c.net)}
          </p>
          <div className="mt-1 flex flex-col gap-0.5">
            {c.lines.map((l) => (
              <p key={l} className="text-[9px] text-muted-foreground">· {l}</p>
            ))}
          </div>
        </div>
      ))}
      <p className="col-span-2 rounded-lg bg-warn/10 px-2.5 py-1.5 text-[9.5px] font-semibold leading-snug text-amber-800">
        Karachi's edge: only +PKR 5,365 — one hour of August heat or a rejected lot erases it.
      </p>
    </div>
  )
}

function LotSplit() {
  return (
    <div className="flex flex-col items-stretch gap-1.5">
      <div className="rounded-xl border border-primary-300 bg-primary-50 px-3 py-2 text-center">
        <p className="text-[9px] font-bold uppercase tracking-wider text-primary-700">One orchard · 6,000 kg</p>
        <p className="text-[10px] text-muted-foreground">mixed grades — old way: one wholesale price for everything</p>
      </div>
      <div className="flex justify-center text-muted-foreground">
        <svg viewBox="0 0 60 24" className="h-6 w-16">
          <path d="M30 0 L30 8 M30 8 L8 22 M30 8 L52 22" fill="none" stroke="hsl(152 30% 60%)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-primary-600 bg-secondary/60 p-2.5">
          <p className="text-[9px] font-extrabold text-primary-700">GRADE A · 2,100 kg</p>
          <p className="mt-0.5 text-[9.5px] text-muted-foreground">Metro Fresh retail @ 126/kg</p>
          <p className="mt-1 font-mono text-[13px] font-semibold tabular-nums text-primary-800">236,900</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-2.5">
          <p className="text-[9px] font-extrabold text-foreground/70">GRADE B · 3,900 kg</p>
          <p className="mt-0.5 text-[9.5px] text-muted-foreground">Lahore wholesale @ 96/kg</p>
          <p className="mt-1 font-mono text-[13px] font-semibold tabular-nums text-foreground/80">348,300</p>
        </div>
      </div>
      <div className="rounded-xl bg-primary-800 px-3 py-2 text-center text-white">
        <span className="font-mono text-[12px] font-semibold tabular-nums">585,200 net</span>
        <span className="ml-2 rounded-full bg-amber-400/90 px-2 py-0.5 font-mono text-[9px] font-extrabold text-amber-950">
          +42,400
        </span>
        <span className="ml-1 text-[9px] text-emerald-200/80">vs one wholesale lot</span>
      </div>
    </div>
  )
}

const STORIES: Story[] = [
  {
    id: "ashraf",
    initials: "MA",
    name: "Muhammad Ashraf",
    meta: "Tomato grower · Jalalpur Pirwala, near Multan · 4,000 kg lot",
    crop: "TOMATO",
    quote:
      "Every season I took the arthi's first number. This time the agent showed me what Multan was really paying — and what Lahore would pay after the truck.",
    did: [
      "Compared 5 mandis on net — after transport, spoilage and commissions",
      "Found Al-Karam in Lahore paying PKR 96/kg vs Multan's 62",
      "Booked a covered Mazda for 6:00 AM pickup, all costs in the estimate",
    ],
    outcome: "PKR 330,330 net",
    outcomeNote: "+110,650 vs the local auction estimate",
    screenIndex: 1,
    artifact: <CompareBars />,
  },
  {
    id: "zeenat",
    initials: "ZB",
    name: "Zeenat Bibi",
    meta: "Okra grower · Lodhran · 1,500 kg lot",
    crop: "OKRA",
    quote:
      "Karachi was paying 138. Everyone said take it. The agent told me the truth: 900 kilometres of August heat would eat the difference — and my okra.",
    did: [
      "Modelled spoilage over 900 km before quoting a net number",
      "Flagged Karachi's edge as PKR 5,365 — thinner than the village whisper",
      "Sent her offer to Chenab Traders, Faisalabad — reply in 40 minutes",
    ],
    outcome: "PKR 137,170 net",
    outcomeNote: "chose 250 km over 900 km — and slept that night",
    screenIndex: 2,
    artifact: <KarachiVsFsd />,
  },
  {
    id: "mustafa",
    initials: "GM",
    name: "Ghulam Mustafa",
    meta: "Kinnow orchard · Sargodha · 6,000 kg harvest",
    crop: "KINNOW",
    quote:
      "Metro Fresh pays a premium — for Grade A only. My orchard gives both grades. The agent split the lot instead of discounting all of it.",
    did: [
      "Graded the orchard into 2,100 kg A and 3,900 kg B",
      "Sent Grade A to Metro Fresh at PKR 126/kg — the retail premium",
      "Routed Grade B to Lahore wholesale at 96/kg, two trucks, one plan",
    ],
    outcome: "PKR 585,200 net",
    outcomeNote: "+42,400 vs selling the whole orchard wholesale",
    screenIndex: 4,
    artifact: <LotSplit />,
  },
]

export function Stories() {
  const [active, setActive] = useState(0)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    cardRefs.current.forEach((el, i) => {
      if (!el) return
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(i)
        },
        { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
      )
      io.observe(el)
      observers.push(io)
    })
    return () => observers.forEach((io) => io.disconnect())
  }, [])

  return (
    <section id="stories" className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-primary-600">
            USER STORIES · ILLUSTRATIVE PILOT SCENARIOS
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Three harvests, run through the agent.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Names and lots are composites; every figure below comes from the app's demo market feed and cost model —
            the same math the pilot runs on the Multan–Lahore corridor.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="relative hidden lg:block">
            <div className="sticky top-20 flex flex-col items-center gap-3">
              <PhoneMockup steps={HERO_STEPS} index={STORIES[active].screenIndex} compact showSteps={false} />
              <div className="flex items-center gap-2 rounded-full bg-primary-900 px-4 py-2 text-white shadow-card">
                <BadgeCheck className="h-4 w-4 text-emerald-300" />
                <span className="text-[12px] font-bold">{STORIES[active].name}</span>
                <span className="font-mono text-[9px] text-emerald-200/80">{STORIES[active].crop}</span>
              </div>
              <div className="flex gap-1.5">
                {STORIES.map((s, i) => (
                  <button
                    key={s.id}
                    aria-label={`Show ${s.name}'s story`}
                    onClick={() => cardRefs.current[i]?.scrollIntoView({ block: "center" })}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === active ? "w-6 bg-primary-600" : "w-1.5 bg-primary-300/50 hover:bg-primary-400",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            {STORIES.map((s, i) => (
              <div key={s.id} ref={(el) => { cardRefs.current[i] = el }}>
                <Reveal delay={i * 80}>
                  <article
                    className={cn(
                      "overflow-hidden rounded-3xl border bg-card shadow-card transition-shadow duration-500",
                      i === active ? "border-primary-500/60 shadow-card-hover" : "border-border/70",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-5 py-4 sm:px-7">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-700 font-mono text-[13px] font-bold text-white">
                        {s.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14.5px] font-extrabold text-foreground">{s.name}</p>
                        <p className="text-[11.5px] text-muted-foreground">{s.meta}</p>
                      </div>
                      <span className="rounded-full bg-secondary px-2.5 py-1 font-mono text-[9px] font-bold tracking-wider text-primary-700">
                        {s.crop}
                      </span>
                    </div>

                    <div className="px-5 py-5 sm:px-7">
                      <blockquote className="font-display text-[19px] font-bold leading-snug text-foreground sm:text-[21px]">
                        <span className="text-primary-500">"</span>
                        {s.quote}
                        <span className="text-primary-500">"</span>
                      </blockquote>

                      <div className="mt-5 grid gap-5 md:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                            What the agent did
                          </p>
                          <ul className="mt-2.5 flex flex-col gap-2">
                            {s.did.map((d) => (
                              <li key={d} className="flex gap-2 text-[12.5px] leading-snug text-foreground/85">
                                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-600">
                                  <Check className="h-2.5 w-2.5 text-white" />
                                </span>
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-2xl bg-muted/40 p-3.5">
                          <p className="mb-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                            The numbers behind it
                          </p>
                          {s.artifact}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 bg-primary-900 px-5 py-3.5 text-white sm:px-7">
                      <div>
                        <p className="font-mono text-[17px] font-semibold tabular-nums">{s.outcome}</p>
                        <p className="text-[10.5px] text-emerald-200/80">{s.outcomeNote}</p>
                      </div>
                      <span className="rounded-full border border-white/20 px-2.5 py-1 font-mono text-[8.5px] tracking-wide text-white/60">
                        ILLUSTRATIVE · DEMO FEED
                      </span>
                    </div>
                  </article>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
