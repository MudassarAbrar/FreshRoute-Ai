import { useEffect, useState, type ReactNode } from "react"
import { BatteryFull, Leaf, Signal, Wifi } from "lucide-react"
import { cn } from "@/lib/utils"

const CYCLE_MS = 4200

export type PhoneStep = { id: string; label: string; screen: ReactNode }

function PhoneChrome({ children, compact }: { children: ReactNode; compact?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden bg-gray-900 shadow-2xl",
        compact ? "h-[600px] w-[290px] rounded-[2.4rem] border-[9px]" : "h-[660px] w-[330px] max-w-full rounded-[2.6rem] border-[10px]",
      )}
      role="img"
      aria-label="FreshRoute Agent app preview on a phone"
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-card">
        {/* status bar */}
        <div className="flex items-center justify-between bg-primary-800 px-5 pt-2 text-white">
          <span className="font-mono text-[9.5px] font-semibold">9:41</span>
          <div className="absolute left-1/2 top-0 h-4 w-24 -translate-x-1/2 rounded-b-xl bg-gray-900" />
          <div className="flex items-center gap-1 text-white">
            <Signal className="h-3 w-3" />
            <Wifi className="h-3 w-3" />
            <BatteryFull className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* app header */}
        <div className="flex items-center gap-2 bg-primary-800 px-3 pb-2.5 pt-1 text-white">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
            <Leaf className="h-4 w-4 text-emerald-300" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-primary-800 bg-good" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold leading-tight">FreshRoute Agent</p>
            <p className="font-mono text-[8px] text-emerald-200/90">online · AI on your side</p>
          </div>
          <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[8px] font-bold tracking-wide text-emerald-200">
            اردو | EN
          </span>
        </div>

        {/* screen */}
        <div className="relative flex-1 overflow-hidden">{children}</div>

        {/* home indicator */}
        <div className="flex justify-center bg-card py-1.5">
          <div className="h-1 w-24 rounded-full bg-gray-900/25" />
        </div>
      </div>
    </div>
  )
}

export function PhoneMockup({
  steps,
  index,
  onIndex,
  auto = false,
  compact = false,
  showSteps = false,
  className,
}: {
  steps: PhoneStep[]
  index?: number
  onIndex?: (i: number) => void
  auto?: boolean
  compact?: boolean
  showSteps?: boolean
  className?: string
}) {
  const [internal, setInternal] = useState(0)
  const [paused, setPaused] = useState(false)
  const current = index ?? internal

  useEffect(() => {
    if (!auto || paused) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = setInterval(() => setInternal((i) => (i + 1) % steps.length), CYCLE_MS)
    return () => clearInterval(t)
  }, [auto, paused, steps.length])

  const go = (i: number) => {
    setInternal(i)
    onIndex?.(i)
  }

  const step = steps[Math.min(current, steps.length - 1)]

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <PhoneChrome compact={compact}>
          <div key={step.id} className="h-full animate-screen-in">
            {step.screen}
          </div>
        </PhoneChrome>
      </div>

      {showSteps && (
        <div className="flex w-full max-w-[380px] flex-col gap-1.5" role="tablist" aria-label="App flow steps">
          {steps.map((s, i) => {
            const active = i === current
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={active}
                onClick={() => go(i)}
                className={cn(
                  "group flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-left transition-colors",
                  active ? "bg-white/10" : "hover:bg-white/5",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold transition-colors",
                    active ? "bg-accent text-accent-foreground" : "bg-white/10 text-white/70",
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-[12px] font-bold transition-colors",
                      active ? "text-white" : "text-white/60 group-hover:text-white/80",
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="mt-1 block h-[3px] overflow-hidden rounded-full bg-white/10">
                    {active && (
                      <span
                        key={`fill-${current}`}
                        className={cn(
                          "block h-full origin-left rounded-full bg-accent",
                          paused ? "w-1/3" : "animate-step-fill",
                        )}
                      />
                    )}
                  </span>
                </span>
              </button>
            )
          })}
          <p className="px-3 pt-0.5 text-[9.5px] text-white/40">
            {paused ? "Paused — take your time" : "Auto-playing the real agent flow · click a step to jump"}
          </p>
        </div>
      )}
    </div>
  )
}
