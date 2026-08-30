import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])

  return { ref, inView }
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.12)
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        inView ? "translate-y-0 opacity-100 blur-0" : "translate-y-7 opacity-0 blur-[3px]",
        className,
      )}
      style={{ transitionDelay: inView ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  )
}

export function CountUp({
  to,
  prefix = "",
  suffix = "",
  duration = 1800,
  className,
}: {
  to: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4)
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(to)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(to * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  )
}
