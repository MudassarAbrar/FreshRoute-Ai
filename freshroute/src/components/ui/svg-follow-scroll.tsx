import { motion, useScroll, useTransform } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"

interface AnchorPoint {
  x: number
  y: number
}

interface ScrollStrokeProps {
  className?: string
  strokeColor?: string
  strokeWidth?: number
  containerRef?: React.RefObject<HTMLDivElement | null>
}

function buildSmoothPath(points: AnchorPoint[]): string {
  if (points.length < 2) return ""

  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]

    const cp1x = prev.x + (curr.x - prev.x) * 0.5
    const cp1y = prev.y + (curr.y - prev.y) * 0.25
    const cp2x = curr.x - (next ? (next.x - prev.x) * 0.15 : (curr.x - prev.x) * 0.5)
    const cp2y = curr.y - (next ? (next.y - prev.y) * 0.15 : (curr.y - prev.y) * 0.5)

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
  }

  return d
}

function getAnchorPoints(container: HTMLElement): AnchorPoint[] {
  const sections = container.querySelectorAll<HTMLElement>("[data-scroll-anchor]")
  const containerRect = container.getBoundingClientRect()
  const scrollTop = window.scrollY
  const containerTop = containerRect.top + scrollTop

  const points: AnchorPoint[] = []
  const containerWidth = containerRect.width

  sections.forEach((section, index) => {
    const rect = section.getBoundingClientRect()
    const sectionTop = rect.top + scrollTop - containerTop
    const sectionHeight = rect.height
    const sectionMidY = sectionTop + sectionHeight * 0.4

    const alternate = index % 2 === 0
    const xOffset = alternate ? containerWidth * 0.3 : containerWidth * 0.7

    points.push({ x: xOffset, y: sectionMidY })
  })

  return points
}

export function ScrollStroke({
  className,
  strokeColor = "#5AAD45",
  strokeWidth = 16,
  containerRef,
}: ScrollStrokeProps) {
  const [pathD, setPathD] = useState("")
  const [svgHeight, setSvgHeight] = useState(0)
  const [svgWidth, setSvgWidth] = useState(0)
  const internalRef = useRef<HTMLDivElement>(null)
  const resolvedRef = containerRef || internalRef

  const { scrollYProgress } = useScroll({
    target: resolvedRef,
    offset: ["start start", "end end"],
  })

  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1])
  const dashOffset = useTransform(pathLength, (value) => 1 - value)

  const measure = useCallback(() => {
    const container = resolvedRef.current
    if (!container || typeof window === "undefined") return

    const rect = container.getBoundingClientRect()
    const height = container.scrollHeight
    const width = rect.width

    setSvgHeight(height)
    setSvgWidth(width)

    const points = getAnchorPoints(container)
    const d = buildSmoothPath(points)
    setPathD(d)
  }, [resolvedRef])

  useEffect(() => {
    measure()

    let timeoutId: ReturnType<typeof setTimeout>
    const debouncedMeasure = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(measure, 150)
    }

    window.addEventListener("resize", debouncedMeasure)

    const container = resolvedRef.current
    let resizeObserver: ResizeObserver | null = null
    if (container && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(debouncedMeasure)
      resizeObserver.observe(container)
    }

    return () => {
      window.removeEventListener("resize", debouncedMeasure)
      clearTimeout(timeoutId)
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [measure, resolvedRef])

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
      style={{ zIndex: 1 }}
    >
      {pathD && svgHeight > 0 && (
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          fill="none"
          overflow="visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            d={pathD}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={
              prefersReducedMotion
                ? {}
                : {
                    pathLength,
                    strokeDashoffset: dashOffset,
                  }
            }
          />
        </svg>
      )}
    </div>
  )
}
