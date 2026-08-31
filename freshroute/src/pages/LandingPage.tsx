import { useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "motion/react"
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Clock3,
  Landmark,
  Languages,
  Layers,
  MapPin,
  ShieldCheck,
  Smartphone,
  Sparkles,
  ThermometerSnowflake,
  TrendingUp,
  Truck,
} from "lucide-react"
import { HERO_STEPS } from "@/components/landing/PhoneScreens"
import { PhoneMockup } from "@/components/landing/PhoneMockup"
import { AdminMockup } from "@/components/landing/AdminMockup"
import { Stories } from "@/components/landing/Stories"
import { Testimonials } from "@/components/landing/Testimonials"
import { Pricing } from "@/components/ui/pricing"
import { Logo, Wordmark } from "@/components/landing/Logo"
import { Reveal } from "@/components/landing/Reveal"

const MANDI_FEED = [
  { city: "Lahore (Badami Bagh)", crop: "Tomato", price: "96 PKR/kg", change: "+14.2%", tone: "good" },
  { city: "Karachi (Super Hwy)", crop: "Mango", price: "220 PKR/kg", change: "+8.5%", tone: "good" },
  { city: "Multan (Sabzi Mandi)", crop: "Tomato", price: "62 PKR/kg", change: "-3.1%", tone: "warn" },
  { city: "Islamabad (I-11)", crop: "Kinnow", price: "110 PKR/kg", change: "+19.0%", tone: "good" },
  { city: "Faisalabad (Chenab)", crop: "Onion", price: "84 PKR/kg", change: "+6.4%", tone: "good" },
  { city: "Sialkot Mandi", crop: "Potato", price: "54 PKR/kg", change: "+4.1%", tone: "good" },
  { city: "Peshawar Mandi", crop: "Chili", price: "155 PKR/kg", change: "+11.8%", tone: "good" },
  { city: "Hyderabad Mandi", crop: "Banana", price: "72 PKR/kg", change: "+5.2%", tone: "good" },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[13.5px] font-bold uppercase tracking-wider text-primary-700">// {children}</p>
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link
          to="/"
          className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Wordmark />
        </Link>

        <nav className="ml-auto hidden items-center gap-5 lg:flex" aria-label="Sections">
          {[
            ["The Problem", "#problem"],
            ["How it Works", "#how"],
            ["Operator Desk", "#system"],
            ["Stories", "#stories"],
            ["Pricing", "#pricing"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-[13px] font-semibold text-foreground/75 transition-colors hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5 lg:ml-0">
          <Link
            to="/login"
            className="rounded-full px-3.5 py-1.5 text-[13px] font-bold text-foreground/75 transition-colors hover:bg-muted hover:text-primary-800"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-primary-800 px-4.5 py-2 text-[13px] font-bold text-white shadow-card transition-colors hover:bg-primary-900"
          >
            Join Pilot
          </Link>
        </div>
      </div>
    </header>
  )
}

function FloatingCard({
  className,
  delay = 0,
  icon: Icon,
  tone,
  title,
  body,
}: {
  className?: string
  delay?: number
  icon: React.ElementType
  tone: "good" | "warn" | "primary"
  title: string
  body: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`animate-float-slow absolute z-10 hidden w-[215px] rounded-2xl border border-border/60 bg-card/95 backdrop-blur-sm p-3.5 shadow-card-hover lg:block ${className ?? ""}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            tone === "good"
              ? "bg-good/10 text-good"
              : tone === "warn"
                ? "bg-warn/15 text-warn"
                : "bg-primary-600/10 text-primary-700"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-[12px] font-extrabold leading-tight text-foreground">{title}</p>
      </div>
      <p className="mt-1.5 text-[11px] font-medium leading-snug text-muted-foreground">{body}</p>
    </motion.div>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-26 sm:pt-32 pb-12">
      {/* Background farm image with gradient overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[700px]">
        <img
          src="/images/hero-farm-backdrop.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
      </div>

      {/* Ambient lighting */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 45% 40% at 15% 0%, hsl(152 65% 94% / 0.6), transparent), radial-gradient(ellipse 40% 35% at 85% 10%, hsl(44 90% 95% / 0.5), transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[300px] select-none text-center font-display text-[22vw] font-extrabold leading-none tracking-tighter text-black/[0.03] dark:text-white/[0.03]"
      >
        FRESH
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <Reveal delay={0}>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-700/20 bg-card/80 backdrop-blur-md px-4 py-1.5 text-[12px] font-bold text-primary-800 shadow-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-good" aria-hidden />
            Pilot Live · Multan ⟶ Lahore Corridor · Perishable Arbitrage
          </span>
        </Reveal>

        <Reveal delay={100}>
          <h1 className="mt-5 font-display text-[2.8rem] font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-[4.2rem]">
            Sell your harvest where it is worth the most.
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
            FreshRoute is an autonomous AI selling agent for Pakistan's fresh-produce farmers. Send one voice message
            or photo in Urdu — the agent grades your lot with Gemini Vision, calculates true net profits across 5
            mandis after transport & spoilage, books certified cold-chain carriers, and verifies direct escrow payout.
          </p>
          <p className="mt-3 font-urdu text-[19px] font-semibold leading-loose text-primary-800">
            ایک پیغام — مکمل فروخت، حقیقی منافع، آپ کی منظوری سے۔
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup"
              className="group flex items-center gap-2 rounded-full bg-primary-800 px-7 py-3.5 text-[14.5px] font-bold text-white shadow-glow transition-all hover:bg-primary-900 active:scale-[0.98]"
            >
              Join the Pilot — Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how"
              className="rounded-full border border-border bg-card/80 backdrop-blur-sm px-7 py-3.5 text-[14.5px] font-bold text-primary-900 shadow-card transition-colors hover:border-primary-400"
            >
              See How it Works
            </a>
          </div>
        </Reveal>

        <Reveal delay={400}>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary-700" />
              Sovereign Human Approval
            </span>
            <span className="flex items-center gap-1.5">
              <Languages className="h-4 w-4 text-primary-700" />
              Native Urdu &amp; English
            </span>
            <span className="flex items-center gap-1.5">
              <ThermometerSnowflake className="h-4 w-4 text-primary-700" />
              Cold Chain &amp; Transit Spoilage AI
            </span>
          </div>
        </Reveal>
      </div>

      {/* Live Phone Mockup with Floating Badges */}
      <Reveal delay={250} className="relative mt-12 flex justify-center px-4">
        <div className="relative">
          <FloatingCard
            className="-left-[240px] top-6"
            delay={0.4}
            icon={TrendingUp}
            tone="good"
            title="Lahore · PKR 96/kg"
            body="Top of 5 mandis today — +34 PKR/kg higher than local Multan auction."
          />
          <FloatingCard
            className="-right-[240px] top-20"
            delay={0.6}
            icon={Sparkles}
            tone="primary"
            title="Gemini Vision"
            body="Graded 65% Grade A / 35% Grade B with 91% firmness score."
          />
          <FloatingCard
            className="-left-[230px] bottom-28"
            delay={0.8}
            icon={Truck}
            tone="primary"
            title="Mazda Booked · 6:00 AM"
            body="Covered transport Multan → Lahore. All fuel & tolls included."
          />
          <FloatingCard
            className="-right-[230px] bottom-10"
            delay={1.0}
            icon={Landmark}
            tone="good"
            title="PKR 330,330 Banked"
            body="+110,650 PKR extra profit in farmer's pocket."
          />
          <PhoneMockup steps={HERO_STEPS} auto showSteps />
        </div>
      </Reveal>

      {/* Live Mandi Marquee Feed */}
      <div className="relative mt-12">
        <Reveal delay={0}>
          <div className="flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-good animate-ping" />
            <p className="text-center text-[12.5px] font-bold text-primary-900/80">
              Live Mandi Price Feeds Across Major Agricultural Hubs
            </p>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div className="mt-3 bg-card/60 py-3 border-y border-border/50">
            <div className="flex w-max gap-4 animate-marquee hover:[animation-play-state:paused]">
              {[...MANDI_FEED, ...MANDI_FEED].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3.5 py-1.5 shadow-sm"
                >
                  <MapPin className="h-3.5 w-3.5 text-primary-700" />
                  <span className="text-[12px] font-bold text-foreground">{item.city}</span>
                  <span className="text-[11px] font-semibold text-muted-foreground">{item.crop}</span>
                  <span className="text-[12px] font-mono font-extrabold text-foreground">{item.price}</span>
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                      item.tone === "good" ? "bg-good/10 text-good" : "bg-warn/15 text-warn"
                    }`}
                  >
                    {item.change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

const PROBLEMS = [
  {
    icon: Landmark,
    title: "Price Discovered at the Gate",
    urduTitle: "منڈی گیٹ پر مجبوری میں قیمت طے ہونا",
    body: "The rate is only revealed when your truck is already parked inside the mandi and the morning auction starts. By then, turning back is impossible and you are forced to accept whatever is offered.",
  },
  {
    icon: Layers,
    title: "4–5 Layers of Middlemen",
    urduTitle: "آڑھتی، دلال اور کمیشن ایجنٹس کی کٹوتی",
    body: "Commission agent, local trader, loader, weigh-bridge, and transporter all take their cut. The farmer bears 100% of the production risk while capturing only a fraction of the final consumer value.",
  },
  {
    icon: Clock3,
    title: "Perishability in 45°C Heat",
    urduTitle: "گرمی میں فصل کے ضیاع کا خطرہ",
    body: "Fresh tomatoes, mangoes, and vegetables lose 8–15% of their value for every 6 hours spent in unventilated trucks under August Punjab heat. The decision is urgent, but transparent data arrives too late.",
  },
]

function Problem() {
  return (
    <section id="problem" className="py-20 sm:py-28 bg-card/40 relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-3xl">
          <SectionLabel>The Motive &amp; Core Challenge</SectionLabel>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
            A same-day perishable harvest, trapped in last century's middlemen chain.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
            Pakistan's smallholder growers produce world-class agricultural harvests, but are systemically crippled by
            information asymmetry, exploitative commission cartels, and post-harvest transport spoilage.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.title} delay={i * 150}>
              <div className="h-full rounded-3xl border border-border/70 bg-card p-7 shadow-card hover:shadow-card-hover transition-all">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary-800 shadow-sm">
                  <p.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-[18px] font-extrabold leading-snug text-foreground">{p.title}</h3>
                <p className="mt-1 font-urdu text-[13.5px] text-primary-800/80 font-bold">{p.urduTitle}</p>
                <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="mt-8 grid gap-6 rounded-3xl border border-primary-700/20 bg-gradient-to-r from-secondary/80 to-card px-8 py-8 shadow-card sm:grid-cols-3">
            {[
              {
                v: "30–40%",
                label: "of fresh produce lost post-harvest in Pakistan before reaching consumers (FAO estimates)",
              },
              {
                v: "PKR 110K+",
                label: "average profit trapped in middlemen spreads per 4-ton tomato harvest",
              },
              {
                v: "< 4 Hours",
                label: "the critical window to grade, arbitrate, and dispatch before heat degradation sets in",
              },
            ].map((s) => (
              <div key={s.v} className="text-center sm:text-left">
                <p className="font-display text-[32px] font-extrabold leading-none text-primary-800">{s.v}</p>
                <p className="mt-2 text-[12px] leading-snug text-muted-foreground font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

const DIFFERENTIATORS = [
  {
    title: "Net, not the headline rate",
    body: "Every comparison is after transport, spoilage, commission and fees. The number you approve is the number you bank.",
  },
  {
    title: "Approval is the product",
    body: "Outreach, bookings and payment steps are drafts until you release them. Every choice lands in a timestamped Action Log.",
  },
  {
    title: "Honest when the data is thin",
    body: "Prices carry a source, a timestamp and a confidence score. A faraway mandi's edge gets flagged when it's thinner than it looks.",
  },
]

function HowItWorks() {
  return (
    <section id="how" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_auto]">
          <Reveal>
            <SectionLabel>How it Works</SectionLabel>
            <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              One message becomes a closed sale.
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
              The same conversation a farmer would have across three phone calls and a visit to the mandi — except it
              finishes before the tomatoes cool down.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              {DIFFERENTIATORS.map((d, i) => (
                <Reveal key={d.title} delay={i * 100}>
                  <div className="flex gap-4 rounded-2xl border border-border/50 bg-card p-5 shadow-card">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-800 text-[12px] font-extrabold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-[14.5px] font-extrabold text-foreground">{d.title}</h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{d.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Reveal delay={160} className="flex justify-center">
            <PhoneMockup steps={HERO_STEPS} auto showSteps />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function OneSystem() {
  return (
    <section id="system" className="relative overflow-hidden py-20 sm:py-28">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <SectionLabel>Two Unified Surfaces</SectionLabel>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
            The grower chats on mobile. The operator commands everything.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
            A shared real-time ledger powers both interfaces — a lightweight, zero-latency chat app for the farmer in the
            field, and a multi-mandi operations console for co-ops and logistics operators.
          </p>
        </Reveal>

        <div className="mt-14 grid items-start gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-800 text-white">
                  <Smartphone className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-[20px] font-extrabold text-foreground">For the Grower (Mobile)</h3>
                  <p className="text-[12px] font-semibold text-muted-foreground">Native Android &amp; Responsive Web</p>
                </div>
              </div>
              <ul className="mt-5 space-y-2.5">
                {[
                  "Grades produce directly from phone camera snapshots using Gemini Vision",
                  "Compares 5 mandis ranked by true net take-home (after freight & spoilage)",
                  "Drafts WhatsApp buyer outreach & requires explicit tap to send",
                  "Monitors truck GPS location and confirms instant payment in thread",
                ].map((f) => (
                  <li key={f} className="flex gap-2.5 text-[13px] text-foreground/85">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex justify-center">
                <PhoneMockup steps={HERO_STEPS} auto compact />
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-800 text-white">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-[20px] font-extrabold text-foreground">
                    For the Operator &amp; Broker Desk
                  </h3>
                  <p className="text-[12px] font-semibold text-muted-foreground">Full Desktop Operations Console</p>
                </div>
              </div>
              <ul className="mt-5 space-y-2.5">
                {[
                  "Live oversight across all active lot corridors, trucks, and cold chambers",
                  "Automated mandi price scraping and verification confidence flags",
                  "Verified buyer directory with payment escrow and dispute resolution",
                  "Role-based access control — farmers never see internal operator ledger",
                ].map((f) => (
                  <li key={f} className="flex gap-2.5 text-[13px] text-foreground/85">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <AdminMockup />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

const PRICING_PLANS = [
  {
    name: "Kisan (Free Forever)",
    price: "0",
    yearlyPrice: "0",
    period: "forever",
    features: [
      "Urdu & English Voice/Chat AI agent",
      "Gemini Computer Vision lot grading",
      "3-mandi real-time net price comparison",
      "Sovereign Human-in-the-Loop approval gate",
      "Timestamped digital trade receipts",
    ],
    description: "For smallholder growers and individual farm lots — completely free.",
    buttonText: "Start Free",
    href: "/signup",
    isPopular: false,
  },
  {
    name: "Grower Pro",
    price: "1800",
    yearlyPrice: "1440",
    period: "per month",
    features: [
      "5-mandi arbitrage ranking with thermal spoilage AI",
      "Verified wholesale buyer outreach with escrow",
      "Direct carrier & cold reefer load matching",
      "Live GPS trip telemetry & temperature alerts",
      "Next-season harvest pre-grading insights",
    ],
    description: "The complete automated selling & dispatch desk for commercial growers.",
    buttonText: "Join the Pilot — Free",
    href: "/signup",
    isPopular: true,
  },
  {
    name: "Orchard & Co-op",
    price: "4500",
    yearlyPrice: "3600",
    period: "per month",
    features: [
      "Everything in Grower Pro",
      "Multi-mandi lot splitting across Grade A / B",
      "Cold storage chamber reservation & receipts",
      "Up to 10 operator & farm manager accounts",
      "Dedicated logistics & dispute coordinator",
    ],
    description: "For large citrus orchards, mango farms, and cooperative societies.",
    buttonText: "Join the Pilot — Free",
    href: "/signup",
    isPopular: false,
  },
]

function PricingSection() {
  return (
    <section id="pricing" className="py-20 sm:py-28 bg-card/40">
      <Reveal>
        <Pricing
          eyebrow="Planned Pricing"
          title="100% Free During the Pilot. Fair Always."
          description={
            "Every plan is free while the pilot operates along the Multan → Lahore corridor — zero credit card, zero lock-in.\nAfter the pilot, transparent pricing is charged per month or per crop season."
          }
          plans={PRICING_PLANS}
        />
      </Reveal>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-primary-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-2rem] select-none text-center font-display text-[19vw] font-extrabold leading-none tracking-tighter text-white/10"
      >
        FRESH
      </div>
      <div className="relative z-20 mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 sm:py-28">
        <Reveal>
          <p className="font-urdu text-[26px] leading-[2.2] text-emerald-100/95 font-bold">
            اگلی فصل کا حساب، اب آپ کے اپنے ہاتھ میں۔
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-[3rem] sm:leading-[1.1]">
            Your next harvest deserves the highest return.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-emerald-50/85">
            Join the FreshRoute pilot. Get immediate multi-mandi arbitrage, AI grading, verified truckers, and transparent
            take-home cash.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup"
              className="group flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[14.5px] font-bold text-primary-900 shadow-card transition-all hover:bg-emerald-50 active:scale-[0.98]"
            >
              Join the Pilot — Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/dashboard"
              className="rounded-full border border-white/40 px-7 py-3.5 text-[14.5px] font-bold text-white transition-colors hover:bg-white/10"
            >
              Open the Web App
            </Link>
          </div>
          <p className="mt-5 text-[12px] text-white/60">
            Zero fees during pilot · Native Urdu &amp; English · Multan ⟶ Lahore Corridor
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background py-14">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[1.3fr_0.9fr_1.4fr]">
        <Reveal delay={50}>
          <Wordmark />
          <p className="mt-3.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
            The AI-powered selling, grading, and logistics agent for Pakistan's fresh-produce agriculture. Connecting
            growers, cold storage nodes, truckers, and verified mandi buyers into one transparent ecosystem.
          </p>
        </Reveal>

        <Reveal delay={150}>
          <nav className="flex flex-col gap-2.5 text-[13px] font-semibold" aria-label="Navigation">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Navigation</p>
            <a href="#problem" className="w-fit text-foreground/80 hover:text-primary-800">
              The Problem
            </a>
            <a href="#how" className="w-fit text-foreground/80 hover:text-primary-800">
              How it Works
            </a>
            <a href="#system" className="w-fit text-foreground/80 hover:text-primary-800">
              Operator Desk
            </a>
            <a href="#pricing" className="w-fit text-foreground/80 hover:text-primary-800">
              Pilot Pricing
            </a>
          </nav>
        </Reveal>

        <Reveal delay={250}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Transparent Disclosures</p>
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted-foreground/80">
            *Post-harvest losses and intermediary structures reflect FAO and national agricultural survey data. Mandi
            prices shown reflect pilot baseline corridor feeds. FreshRoute operates
            with strict sovereign human-in-the-loop approval rails.
          </p>
        </Reveal>
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border px-4 pt-6 sm:px-6">
        <p className="text-[12px] text-muted-foreground">
          © 2026 FreshRoute AI · Built for Pakistan's Fresh-Produce Growers
        </p>
        <Logo size={24} className="opacity-70" />
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="landing-shell min-h-screen font-sans text-foreground bg-background">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <OneSystem />
        <Stories />
        <Testimonials />
        <PricingSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
