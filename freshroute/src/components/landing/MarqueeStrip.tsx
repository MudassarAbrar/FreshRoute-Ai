// InfiniteSlider adapted from 21st.dev "Logo Marquee" by grootstudio (MIT-style component library)
import { memo, useEffect, useState } from "react"
import { animate, motion, useMotionValue } from "motion/react"
import useMeasure from "react-use-measure"
import { cn } from "@/lib/utils"

type InfiniteSliderProps = {
  children: React.ReactNode
  gap?: number
  duration?: number
  durationOnHover?: number
  reverse?: boolean
  className?: string
}

const InfiniteSlider = memo(function InfiniteSlider({
  children,
  gap = 16,
  duration = 25,
  durationOnHover,
  reverse = false,
  className,
}: InfiniteSliderProps) {
  const [currentDuration, setCurrentDuration] = useState(duration)
  const [ref, { width }] = useMeasure()
  const translation = useMotionValue(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [key, setKey] = useState(0)
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

  useEffect(() => {
    if (reduced) return
    const contentSize = width + gap
    const from = reverse ? -contentSize / 2 : 0
    const to = reverse ? 0 : -contentSize / 2

    let controls

    if (isTransitioning) {
      controls = animate(translation, [translation.get(), to], {
        ease: "linear",
        duration: currentDuration * Math.abs((translation.get() - to) / contentSize),
        onComplete: () => {
          setIsTransitioning(false)
          setKey((prev) => prev + 1)
        },
      })
    } else {
      controls = animate(translation, [from, to], {
        ease: "linear",
        duration: currentDuration,
        repeat: Infinity,
        repeatType: "loop",
        repeatDelay: 0,
        onRepeat: () => translation.set(from),
      })
    }

    return controls?.stop
  }, [key, translation, currentDuration, width, gap, isTransitioning, reverse, reduced])

  const hoverProps = durationOnHover
    ? {
        onHoverStart: () => {
          setIsTransitioning(true)
          setCurrentDuration(durationOnHover)
        },
        onHoverEnd: () => {
          setIsTransitioning(true)
          setCurrentDuration(duration)
        },
      }
    : {}

  return (
    <div className={cn("overflow-hidden", className)}>
      <motion.div
        ref={ref}
        className="flex w-max"
        style={{ x: translation, gap: `${gap}px` }}
        {...hoverProps}
      >
        {children}
        {children}
      </motion.div>
    </div>
  )
})

export function MarqueeStrip({ items, className }: { items: string[]; className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto w-full overflow-hidden py-1 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]",
        className,
      )}
      aria-label={`Mandis covered: ${items.join(", ")}`}
    >
      <InfiniteSlider gap={56} reverse duration={60} durationOnHover={22}>
        {[...items, ...items].map((city, i) => (
          <span
            key={`${city}-${i}`}
            className="flex select-none items-center gap-2.5 whitespace-nowrap text-[15px] font-bold tracking-tight text-primary-800/55"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary-600/40" aria-hidden />
            {city}
          </span>
        ))}
      </InfiniteSlider>
    </div>
  )
}
