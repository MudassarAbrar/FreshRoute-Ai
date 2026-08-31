import { Link } from "react-router-dom"
import { useRef } from "react"
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Landmark,
  Languages,
  Layers,
  MessageSquareText,
  ShieldCheck,
  TrendingUp,
  Truck,
} from "lucide-react"
import { HERO_STEPS } from "@/components/landing/PhoneScreens"
import { PhoneMockup } from "@/components/landing/PhoneMockup"
import { MarqueeStrip } from "@/components/landing/MarqueeStrip"
import { AdminMockup } from "@/components/landing/AdminMockup"
import { Stories } from "@/components/landing/Stories"
import { Testimonials } from "@/components/landing/Testimonials"
import { Pricing } from "@/components/ui/pricing"
import { ScrollStroke } from "@/components/ui/svg-follow-scroll"
import { Logo, Wordmark } from "@/components/landing/Logo"
import { Reveal } from "@/components/landing/Reveal"

const MANDI_CITIES = [
  "Lahore",
  "Karachi",
  "Multan",
  "Faisalabad",
  "Islamabad",
  "Sialkot",
  "Peshawar",
  "Hyderabad",
  "Quetta",
  "Gujranwala",
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] font-bold text-primary-700">// {children}</p>
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
        <Link
          to="/"
          className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Wordmark />
        </Link>

        <nav className="ml-auto hidden items-center gap-7 md:flex" aria-label="Sections">
          {[
            ["The system", "#system"],
            ["How it works", "#how"],
            ["Stories", "#stories"],
            ["Pricing", "#pricing"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-[13.5px] font-semibold text-foreground/70 transition-colors hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            to="/login"
            className="rounded-full px-3.5 py-2 text-[13.5px] font-bold text-foreground/75 transition-colors hover:bg-white/70 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-primary-800 px-5 py-2 text-[13.5px] font-bold text-white shadow-card transition-colors hover:bg-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}

function FloatingCard({
  className,
  delay,
  icon: Icon,
  tone,
  title,
  body,
}: {
  className?: string
  delay: string
  icon: React.ElementType
  tone: "good" | "warn" | "primary"
  title: string
  body: string
}) {
  return (
    <div
      className={`animate-float-slow absolute z-10 hidden w-[210px] rounded-2xl border border-border/50 bg-card p-3.5 shadow-card-hover lg:block ${className ?? ""}`}
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            tone === "good" ? "bg-good/10 text-good" : tone === "warn" ? "bg-warn/15 text-warn" : "bg-primary-600/10 text-primary-700"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-[12px] font-extrabold leading-tight text-foreground">{title}</p>
      </div>
      <p className="mt-1.5 text-[11px] font-medium leading-snug text-muted-foreground">{body}</p>
    </div>
  )
}

function Hero() {
  return (
    <section data-scroll-anchor className="relative overflow-hidden pt-28 sm:pt-36">
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Reveal>
          <h1 className="mt-2 font-hero text-[3.5rem] leading-[1.1] tracking-normal text-primary-800 sm:text-[5rem]">
            Sell your harvest where it's worth most.
          </h1>
        </Reveal>

        <Reveal delay={180}>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground">
            FreshRoute is an AI selling agent for fresh-produce farmers. Send one message — it grades your lot, compares
            five mandis <span className="font-semibold text-foreground">after transport and spoilage</span>, then
            contacts the buyer, books the truck and tracks delivery to the last kilometre.
          </p>
          <p className="mt-3 font-urdu text-[18px] leading-loose text-primary-800/85">
            ایک پیغام — مکمل فروخت، آپ کی منظوری سے۔
          </p>
        </Reveal>

        <Reveal delay={260}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup"
              className="group flex items-center gap-2 rounded-full bg-primary-800 px-7 py-3.5 text-[14.5px] font-bold text-white shadow-glow transition-all hover:bg-primary-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Join the pilot — free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how"
              className="rounded-full border border-border bg-card px-7 py-3.5 text-[14.5px] font-bold text-primary-900 shadow-card transition-colors hover:border-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              See how it works
            </a>
          </div>
        </Reveal>

        <Reveal delay={340}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary-700" />
              Nothing sent without your approval
            </span>
            <span className="flex items-center gap-1.5">
              <Languages className="h-4 w-4 text-primary-700" />
              English + اردو
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-primary-700" />
              No downloads — runs in the browser
            </span>
          </div>
        </Reveal>
      </div>

      <Reveal delay={220} className="relative mt-14 flex justify-center">
        <div className="relative">
          <FloatingCard
            className="-left-[248px] top-8"
            delay="0s"
            icon={TrendingUp}
            tone="good"
            title="Lahore · PKR 96/kg"
            body="Best of 5 mandis today — 34 more than Multan's auction."
          />
          <FloatingCard
            className="-right-[248px] top-24"
            delay="1.6s"
            icon={ShieldCheck}
            tone="warn"
            title="Draft ready — needs you"
            body="Offer to Al-Karam Wholesale. Nothing sends until you approve."
          />
          <FloatingCard
            className="-left-[238px] bottom-24"
            delay="3.1s"
            icon={Truck}
            tone="primary"
            title="Truck booked · 6:00 AM"
            body="Covered Mazda, Multan → Lahore, all costs in your net."
          />
          <FloatingCard
            className="-right-[238px] bottom-8"
            delay="4.4s"
            icon={Landmark}
            tone="good"
            title="PKR 330,330 net"
            body="+110,650 vs selling at the local mandi."
          />
          <PhoneMockup steps={HERO_STEPS} auto />
        </div>
      </Reveal>

      <div className="relative mt-12">
        <Reveal>
          <p className="text-center text-[13px] font-bold text-primary-900/70">
            Built for the mandis of Punjab &amp; Sindh — price feeds across {MANDI_CITIES.length} cities
          </p>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-4 bg-card/60 py-4">
            <MarqueeStrip items={MANDI_CITIES} className="max-w-5xl" />
          </div>
          <p className="mt-2 text-center text-[11px] font-medium text-muted-foreground/80">
            Simulated pilot feed — not live market prices. Field feeds replace these as the pilot reports.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

const PROBLEMS = [
  {
    icon: Landmark,
    title: "The price is discovered at the gate",
    body: "The rate becomes real when your truck is already at the mandi and the auction underway. By then, every alternative is gone.",
  },
  {
    icon: Layers,
    title: "The stack takes its share",
    body: "Commission agent, wholesaler, loader, transporter — each takes a cut, and nobody owes you the net number at the end of it.",
  },
  {
    icon: Clock3,
    title: "The produce won't wait",
    body: "Tomatoes lose value by the hour in August heat. The decision runs on hours; the information arrives in days.",
  },
]

function Problem() {
  return (
    <section data-scroll-anchor id="problem" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <SectionLabel>The problem</SectionLabel>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
            A same-day decision, made with last week's information.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
            This is the gap FreshRoute exists to close — not with advice, but with numbers the farmer can act on the
            same morning.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.title} delay={i * 100}>
              <div className="h-full rounded-3xl border border-border/50 bg-card p-7 shadow-card">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary-800">
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[19px] font-extrabold leading-snug text-foreground">{p.title}</h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={150}>
          <div className="mt-6 grid gap-5 rounded-3xl border border-border/50 bg-card px-8 py-7 shadow-card sm:grid-cols-3">
            {[
              { v: "30–40%", label: "of fruits & vegetables lost between farm and consumer in Pakistan*" },
              { v: "4–5", label: "intermediaries between the grower and the plate" },
              { v: "hours", label: "the window to decide — once the crop is picked" },
            ].map((s) => (
              <div key={s.v} className="text-center sm:text-left">
                <p className="font-display text-[30px] font-extrabold leading-none text-primary-800">{s.v}</p>
                <p className="mt-2 text-[12.5px] leading-snug text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function OneSystem() {
  return (
    <section data-scroll-anchor id="system" className="relative overflow-hidden py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-10 select-none font-display text-[11rem] font-extrabold leading-none tracking-tighter text-white/40"
      >
        FRESH
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionLabel>One system, two experiences</SectionLabel>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
            The grower chats. The operator sees everything.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
            One shared backend, two surfaces built for two very different days — a farmer's phone and an operations
            desk.
          </p>
        </Reveal>

        <div className="mt-14 grid items-start gap-14 lg:grid-cols-2">
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-800 text-white">
                <MessageSquareText className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-[21px] font-extrabold text-foreground">For the grower</h3>
                <p className="text-[12.5px] font-semibold text-muted-foreground">A chat that sells — voice or text, EN + اردو</p>
              </div>
            </div>
            <ul className="mt-5 flex flex-col gap-2.5">
              {[
                "Grades the lot from photos, asks only what it still needs",
                "Shows every mandi ranked by net — after every cost",
                "Drafts buyer messages and bookings for explicit approval",
                "Tracks the truck and confirms payment, in the same thread",
              ].map((f) => (
                <li key={f} className="flex gap-2.5 text-[13.5px] leading-snug text-foreground/85">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex justify-center">
              <PhoneMockup steps={HERO_STEPS} auto compact />
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-800 text-white">
                <Landmark className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-[21px] font-extrabold text-foreground">For the operator</h3>
                <p className="text-[12.5px] font-semibold text-muted-foreground">An operations console over every lot</p>
              </div>
            </div>
            <ul className="mt-5 flex flex-col gap-2.5">
              {[
                "Every lot, route and net figure on one screen",
                "Approvals, exceptions and AI usage logged live",
                "Buyer and transporter directories with history",
                "Role-based access — farmers never see the desk",
              ].map((f) => (
                <li key={f} className="flex gap-2.5 text-[13.5px] leading-snug text-foreground/85">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <AdminMockup />
            </div>
          </Reveal>
        </div>
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
    <section data-scroll-anchor id="how" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_auto]">
          <Reveal>
            <SectionLabel>How it works</SectionLabel>
            <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              One message becomes a closed sale.
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
              The same conversation a farmer would have across three phone calls and a visit to the mandi — except it
              finishes before the tomatoes cool down. Play the flow on the right.
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

const PRICING_PLANS = [
  {
    name: "Kisan",
    price: "0",
    yearlyPrice: "0",
    period: "forever",
    features: [
      "Chat agent in English + اردو",
      "3-mandi price comparison",
      "Approval-gated buyer outreach",
      "Timestamped action log",
    ],
    description: "For small lots and first harvests — always free.",
    buttonText: "Start free",
    href: "/signup",
    isPopular: false,
  },
  {
    name: "Grower",
    price: "1800",
    yearlyPrice: "1440",
    period: "per month",
    features: [
      "5-mandi net comparison — after every cost",
      "Verified buyer outreach with approvals",
      "Transport booking & live tracking",
      "Payment confirmation in the chat",
      "Next-harvest insights",
    ],
    description: "The full selling desk for working growers.",
    buttonText: "Join the pilot — free",
    href: "/signup",
    isPopular: true,
  },
  {
    name: "Orchard & Co-op",
    price: "4500",
    yearlyPrice: "3600",
    period: "per month",
    features: [
      "Everything in Grower",
      "Lot splitting across mandis & grades",
      "Buyer directory with deal history",
      "Up to 10 family or staff accounts",
      "Priority support",
    ],
    description: "For orchards, co-ops and multi-lot operations.",
    buttonText: "Join the pilot — free",
    href: "/signup",
    isPopular: false,
  },
]

function PricingSection() {
  return (
    <section data-scroll-anchor id="pricing" className="app-surface">
      <Reveal>
        <Pricing
          eyebrow="Planned pricing"
          title="Free during the pilot. Fair after."
          description={
            "Every plan is free while the pilot runs on the Multan → Lahore corridor — no card, no lock-in.\nAfter the pilot, growers pay monthly or per season — one season is one crop cycle, six months."
          }
          plans={PRICING_PLANS}
        />
      </Reveal>
      <Reveal delay={120}>
        <p className="mx-auto -mt-10 max-w-2xl px-4 text-center text-[11.5px] leading-relaxed text-muted-foreground/80 sm:px-6">
          Planned post-pilot pricing, shown in PKR — nothing is charged today. The app's demo cost model already nets
          out a 1.5% platform fee on completed sales; final pricing follows what growers actually use in the pilot.
        </p>
      </Reveal>
    </section>
  )
}

function FinalCTA() {
  return (
    <section data-scroll-anchor className="relative overflow-hidden bg-primary-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-2rem] select-none text-center font-display text-[19vw] font-extrabold leading-none tracking-tighter text-white/10"
      >
        FRESH
      </div>
      <div className="relative z-20 mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 sm:py-28">
        <Reveal>
          <p className="font-urdu text-[24px] leading-[2.2] text-emerald-100/90">
            اگلی فصل کا حساب، اب آپ کے ہاتھ میں۔
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-[2.75rem] sm:leading-[1.15]">
            Your next harvest deserves a better desk.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-emerald-50/75">
            Join the pilot on the Multan–Lahore corridor. Free while we learn from your harvest — you keep the numbers
            either way.
          </p>
        </Reveal>
        <Reveal delay={140}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup"
              className="group flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[14.5px] font-bold text-primary-900 shadow-card transition-all hover:bg-emerald-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
            >
              Join the pilot — free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/dashboard"
              className="rounded-full border border-white/30 px-7 py-3.5 text-[14.5px] font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Open the app
            </Link>
          </div>
          <p className="mt-5 text-[11.5px] text-white/50">
            No credit card · no downloads · pilot corridor: Multan → Lahore
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer data-scroll-anchor className="border-t border-border bg-background py-12">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[1.2fr_0.8fr_1.4fr]">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-xs text-[12.5px] leading-relaxed text-muted-foreground">
            The AI selling &amp; logistics agent for fresh produce. Built for Pakistan's growers — pilot corridor:
            Multan → Lahore, tomatoes first.
          </p>
        </div>

        <nav className="flex flex-col gap-2.5 text-[13px] font-semibold" aria-label="App">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">App</p>
          <Link to="/signup" className="w-fit text-foreground/75 transition-colors hover:text-primary-800">
            Create account
          </Link>
          <Link to="/login" className="w-fit text-foreground/75 transition-colors hover:text-primary-800">
            Log in
          </Link>
          <Link to="/dashboard" className="w-fit text-foreground/75 transition-colors hover:text-primary-800">
            Open the dashboard
          </Link>
        </nav>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Honest footnotes</p>
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted-foreground/80">
            *Post-harvest loss and intermediary counts are widely-cited ranges (FAO / national agri-research
            estimates). Mandi rates shown on this page come from the app's{" "}
            <span className="text-foreground/70">simulated pilot feed</span> — they are not live market prices. Story
            and testimonial figures are illustrative composites of the app's demo scenarios. Field results will replace
            them as the pilot reports.
          </p>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border px-4 pt-6 sm:px-6">
        <p className="text-[11.5px] text-muted-foreground/70">© 2026 FreshRoute · Built for Pakistan's fresh-produce growers</p>
        <Logo size={24} className="opacity-60" />
      </div>
    </footer>
  )
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className="landing-shell relative min-h-screen font-sans text-foreground">
      <Nav />
      <main className="relative">
        <ScrollStroke
          className="absolute inset-0 z-0 opacity-40"
          strokeColor="#5AAD45"
          strokeWidth={20}
          containerRef={containerRef}
        />
        <div className="relative z-10">
          <Hero />
          <Problem />
          <OneSystem />
          <HowItWorks />
          <Stories />
          <Testimonials />
          <PricingSection />
          <FinalCTA />
        </div>
      </main>
      <Footer />
    </div>
  )
}
