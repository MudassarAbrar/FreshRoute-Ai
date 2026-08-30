// Pricing section adapted from 21st.dev "Pricing" block:
// next/link → react-router-dom, framer-motion → motion/react,
// confetti colors resolved from design tokens (canvas can't parse CSS vars),
// currency via NumberFlow prefix, seasonal billing copy.
import { buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import { Check, Star } from "lucide-react"
import { Link } from "react-router-dom"
import { useRef, useState } from "react"
import confetti from "canvas-confetti"
import NumberFlow from "@number-flow/react"

interface PricingPlan {
  name: string
  price: string
  yearlyPrice: string
  period: string
  features: string[]
  description: string
  buttonText: string
  href: string
  isPopular: boolean
}

interface PricingProps {
  plans: PricingPlan[]
  eyebrow?: string
  title?: string
  description?: string
}

const tokenColor = (name: string, fallback: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v ? `hsl(${v})` : fallback
}

export function Pricing({
  plans,
  eyebrow,
  title = "Simple, Transparent Pricing",
  description = "Choose the plan that works for you",
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const switchRef = useRef<HTMLButtonElement>(null)

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked)
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect()
      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
        colors: [
          tokenColor("--primary", "#166534"),
          tokenColor("--accent", "#f59e0b"),
          tokenColor("--secondary", "#e5eee2"),
        ],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      })
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
      <div className="mb-12 space-y-4 text-center">
        {eyebrow && <p className="text-sm font-bold text-primary-700">// {eyebrow}</p>}
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        <p className="whitespace-pre-line text-lg text-muted-foreground">{description}</p>
      </div>

      <div className="mb-10 flex justify-center">
        <label className="relative inline-flex cursor-pointer items-center">
          <Label>
            <Switch
              ref={switchRef as never}
              checked={!isMonthly}
              onCheckedChange={handleToggle}
              className="relative"
              aria-label="Toggle seasonal billing"
            />
          </Label>
        </label>
        <span className="ml-2 font-semibold">
          Seasonal billing <span className="text-primary">(Save 20%)</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan, index) => {
          const isFree = Number(plan.price) === 0 && Number(plan.yearlyPrice) === 0
          return (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 1 }}
              whileInView={
                isDesktop
                  ? {
                      y: plan.isPopular ? -20 : 0,
                      opacity: 1,
                      x: index === 2 ? -30 : index === 0 ? 30 : 0,
                      scale: index === 0 || index === 2 ? 0.94 : 1.0,
                    }
                  : {}
              }
              viewport={{ once: true }}
              transition={{
                duration: 1.6,
                type: "spring",
                stiffness: 100,
                damping: 30,
                delay: 0.4,
                opacity: { duration: 0.5 },
              }}
              className={cn(
                "relative flex flex-col rounded-2xl border-[1px] bg-background p-6 text-center lg:flex lg:flex-col lg:justify-center",
                plan.isPopular ? "border-primary border-2" : "border-border",
                !plan.isPopular && "mt-5",
                index === 0 || index === 2
                  ? "z-0 rotate-y-[10deg]"
                  : "z-10",
                index === 0 && "origin-right",
                index === 2 && "origin-left",
              )}
            >
              {plan.isPopular && (
                <div className="absolute right-0 top-0 flex items-center rounded-bl-xl rounded-tr-xl bg-primary py-0.5 px-2">
                  <Star className="h-4 w-4 fill-current text-primary-foreground" />
                  <span className="ml-1 font-sans font-semibold text-primary-foreground">
                    Popular
                  </span>
                </div>
              )}
              <div className="flex flex-1 flex-col">
                <p className="text-base font-semibold text-muted-foreground">{plan.name}</p>
                <div className="mt-6 flex items-center justify-center gap-x-2">
                  <span className="text-5xl font-bold tracking-tight text-foreground">
                    {isFree ? (
                      "Free"
                    ) : (
                      <NumberFlow
                        value={isMonthly ? Number(plan.price) : Number(plan.yearlyPrice)}
                        format={{ minimumFractionDigits: 0, maximumFractionDigits: 0 }}
                        prefix="PKR "
                        transformTiming={{ duration: 500, easing: "ease-out" }}
                        willChange
                        className="tabular-nums"
                      />
                    )}
                  </span>
                  <span className="text-sm font-semibold leading-6 tracking-wide text-muted-foreground">
                    / {plan.period}
                  </span>
                </div>

                <p className="text-xs leading-5 text-muted-foreground">
                  {isFree ? "no card · no lock-in" : isMonthly ? "billed monthly" : "billed per season (6 months)"}
                </p>

                <ul className="mt-5 flex flex-col gap-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                      <span className="text-left">{feature}</span>
                    </li>
                  ))}
                </ul>

                <hr className="my-4 w-full" />

                <Link
                  to={plan.href}
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                    }),
                    "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
                    "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-1 hover:bg-primary hover:text-primary-foreground",
                    plan.isPopular
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground",
                  )}
                >
                  {plan.buttonText}
                </Link>
                <p className="mt-6 text-xs leading-5 text-muted-foreground">{plan.description}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
