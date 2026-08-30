import { Link } from "react-router-dom"
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Hourglass,
  Languages,
  Layers,
  Leaf,
  Landmark,
  MessageSquare,
  ShieldCheck,
  Truck,
} from "lucide-react"
import { HERO_STEPS } from "@/components/landing/PhoneScreens"
import { PhoneMockup } from "@/components/landing/PhoneMockup"
import { MandiTicker } from "@/components/landing/MandiTicker"
import { Stories } from "@/components/landing/Stories"
import { CountUp, Reveal } from "@/components/landing/Reveal"

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-primary-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
            <Leaf className="h-4 w-4 text-emerald-300" />
          </span>
          <span className="text-[15px] font-extrabold tracking-tight text-white">
            FreshRoute <span className="font-medium text-emerald-300/90">Agent</span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 md:flex" aria-label="Sections">
          {[
            ["Problem", "#problem"],
            ["How it works", "#how"],
            ["Stories", "#stories"],
            ["Why it matters", "#why"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="relative text-[13px] font-semibold text-white/70 transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-accent after:transition-all after:duration-300 hover:text-white hover:after:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary-950"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-full px-3.5 py-1.5 text-[12.5px] font-bold text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-accent px-4 py-1.5 text-[12.5px] font-extrabold text-accent-foreground shadow-lg shadow-amber-500/20 transition-transform hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-primary-950 pt-14">
      <img src="/images/backdrop.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary-950/80 via-primary-950/60 to-primary-950" />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(hsl(160 40% 85% / 0.045) 1px, transparent 1px), linear-gradient(90deg, hsl(160 40% 85% / 0.045) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
        }}
      />
      <div className="pointer-events-none absolute -left-32 top-24 h-96 w-96 animate-float-slow rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 animate-float-slow rounded-full bg-amber-500/10 blur-3xl [animation-delay:2.2s]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-20">
        <div>
          <Reveal>
            <p className="flex items-center gap-2 font-mono text-[10.5px] font-semibold tracking-[0.22em] text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
              PILOT LIVE · MULTAN → LAHORE · TOMATOES
            </p>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-5 font-display text-[2.6rem] font-extrabold leading-[1.04] tracking-tight text-white sm:text-6xl">
              The <span className="text-amber-300">mandi desk</span> in your pocket.
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-emerald-50/80">
              FreshRoute is an AI selling agent for fresh-produce farmers. Send one message — it grades your lot,
              compares five mandis <span className="font-semibold text-white">after transport and spoilage</span>,
              contacts the buyer, books the truck and tracks delivery to the last kilometre.
            </p>
            <p className="mt-3 font-urdu text-[17px] text-emerald-200/90">
              ایک پیغام — مکمل فروخت، آپ کی منظوری سے۔
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="group flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-[14px] font-extrabold text-accent-foreground shadow-xl shadow-amber-500/25 transition-transform hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Start the pilot — free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how"
                className="rounded-full border border-white/25 px-6 py-3 text-[14px] font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                See how it works
              </a>
              <Link
                to="/dashboard"
                className="text-[13px] font-bold text-emerald-200/80 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Open the app →
              </Link>
            </div>
          </Reveal>

          <Reveal delay={340}>
            <div className="mt-9 flex flex-col gap-2.5 text-[12px] font-semibold text-white/65 sm:flex-row sm:flex-wrap sm:gap-x-6">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Nothing sent without your approval
              </span>
              <span className="flex items-center gap-1.5">
                <Languages className="h-4 w-4 text-emerald-300" />
                English + اردو
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-emerald-300" />
                No downloads — runs in the browser
              </span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} className="flex justify-center lg:justify-end">
          <PhoneMockup steps={HERO_STEPS} auto showSteps />
        </Reveal>
      </div>

      <MandiTicker />
    </section>
  )
}

const PROBLEMS = [
  {
    icon: Landmark,
    title: "Price discovered at the gate",
    body: "The rate becomes real when your truck is already loaded and the auction underway. By then, every alternative is gone.",
  },
  {
    icon: Layers,
    title: "The stack takes its share",
    body: "Commission agent, wholesaler, loader, transporter — each takes a cut, and nobody owes you the net number at the end.",
  },
  {
    icon: Hourglass,
    title: "The produce won't wait",
    body: "Tomatoes lose value by the hour in August heat. The decision runs on hours; the information arrives in days.",
  },
]

function Problem() {
  return (
    <section id="problem" className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-primary-600">THE PROBLEM</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            A same-day decision, made with last week's information.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.title} delay={i * 100}>
              <div className="group h-full rounded-3xl border border-border/80 bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary-700 transition-colors group-hover:bg-primary-700 group-hover:text-white">
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[17px] font-bold text-foreground">{p.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={150}>
          <div className="mt-6 grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-3">
            {[
              { v: "30–40%", label: "of fruits & vegetables lost between farm and consumer in Pakistan*" },
              { v: "4–5", label: "intermediaries between the grower and the plate" },
              { v: "hours", label: "the window to decide — once the crop is picked" },
            ].map((s) => (
              <div key={s.v} className="bg-primary-900 px-7 py-6 text-white">
                <p className="font-mono text-[26px] font-semibold tabular-nums text-amber-300">{s.v}</p>
                <p className="mt-1 text-[12px] leading-snug text-emerald-50/75">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

const STEPS = [
  {
    icon: MessageSquare,
    n: "01",
    title: "Message your harvest",
    body: "Text or voice, English or اردو. Crop, quantity, grade — the agent asks only what it still needs.",
  },
  {
    icon: BarChart3,
    n: "02",
    title: "See the real comparison",
    body: "Five mandis ranked by net: after transport, spoilage, commissions and fees. Every price carries a timestamp and a source.",
  },
  {
    icon: ShieldCheck,
    n: "03",
    title: "Approve before anything moves",
    body: "Buyer messages and transport bookings are drafted, not sent. You approve or decline — every choice is logged with a timestamp.",
  },
  {
    icon: Truck,
    n: "04",
    title: "Track to the last kilometre",
    body: "Pickup, transit, delivery and payment — with alerts when the road, the weather or the buyer changes the plan.",
  },
]

function HowItWorks() {
  return (
    <section id="how" className="border-y border-border/70 bg-card py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-primary-600">HOW IT WORKS</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            One message becomes a closed sale.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            The same conversation a farmer would have with three phone calls and a visit to the mandi — except it
            finishes before the tomatoes cool down.
          </p>
        </Reveal>

        <div className="relative mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="pointer-events-none absolute left-0 right-0 top-[52px] hidden border-t-2 border-dashed border-primary-200 lg:block" />
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 110}>
              <div className="group relative h-full rounded-3xl bg-background p-6 ring-1 ring-border/60 transition-shadow duration-300 hover:shadow-card">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-700 text-white shadow-glow">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-[13px] font-semibold text-primary-300">{s.n}</span>
                </div>
                <h3 className="mt-4 font-display text-[16.5px] font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Impact() {
  return (
    <section id="why" className="relative overflow-hidden bg-primary-950 py-20 sm:py-28">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 40% at 70% 0%, hsl(150 55% 40% / 0.15), transparent), radial-gradient(ellipse 50% 35% at 15% 100%, hsl(36 95% 50% / 0.08), transparent)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-3xl">
          <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-emerald-300">WHY IT MATTERS</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Small farms don't need advice. They need an execution desk.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-emerald-50/75">
            Pakistan's growers work one of the world's most volatile produce markets with the least information. The
            fix isn't another advisory — it's a trading desk: prices, buyers, trucks and payments, behind a single
            chat window, in the language the farmer already thinks in.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: 5, label: "mandis compared on every lot — net of every cost" },
            { to: 110_650, prefix: "PKR ", label: "gap on one 4-tonne tomato lot, Multan vs Lahore†" },
            { to: 100, suffix: "%", label: "of actions require your explicit approval" },
            { to: 2, label: "languages, one agent — English + اردو" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 90}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition-colors hover:bg-white/[0.07]">
                <p className="font-mono text-[30px] font-semibold leading-none tabular-nums text-white">
                  <CountUp to={s.to} prefix={s.prefix ?? ""} suffix={s.suffix ?? ""} />
                </p>
                <p className="mt-3 text-[12px] leading-snug text-emerald-50/70">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <p className="mt-6 max-w-2xl text-[11px] leading-relaxed text-white/45">
            † Illustrative figure from the app's simulated pilot feed (Multan tomato PKR 62/kg vs Lahore PKR 96/kg,
            August 2026). Field results replace these as the pilot reports.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function DeclinedCard() {
  return (
    <div className="animate-msg-in w-full max-w-[380px] overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="flex items-center gap-2 bg-muted px-4 py-2.5 text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span className="text-[11px] font-extrabold tracking-wide">DECLINED — NOTHING WAS SENT</span>
      </div>
      <div className="p-4">
        <p className="text-[14.5px] font-extrabold text-foreground">Send offer to Metro Fresh Retail?</p>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
          Grade A only · 20% premium · 7-day payment — you said no at 4:12 PM.
        </p>
        <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2.5">
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            The agent stopped here. No message left your phone, no truck was booked, and the decline is recorded in
            your Action Log with its timestamp.
          </p>
        </div>
        <p className="mt-2.5 text-[10px] text-muted-foreground">
          A "not now" is always one tap away — and always free.
        </p>
      </div>
    </div>
  )
}

function Trust() {
  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-primary-600">TRUST BY DESIGN</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            The agent works for you — never the other way around.
          </h2>
          <ul className="mt-6 flex flex-col gap-4">
            {[
              "Nothing is sent, booked or promised without your explicit approval — every outreach is a draft until you release it.",
              "Every approval and decline is timestamped in your Action Log. You can always show what was decided, and when.",
              "Prices carry a timestamp, a source and a confidence score. The agent never quotes a number it can't stand behind.",
              "When the data is thin, the agent says so — like telling you a faraway mandi's edge is thinner than it looks.",
            ].map((t) => (
              <li key={t.slice(0, 24)} className="flex gap-3 text-[14px] leading-relaxed text-foreground/85">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600">
                  <ShieldCheck className="h-3 w-3 text-white" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={150} className="flex justify-center lg:justify-end">
          <DeclinedCard />
        </Reveal>
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <>
      <MandiTicker />
      <section className="relative overflow-hidden bg-primary-950 py-24 sm:py-32">
        <img src="/images/backdrop.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/70 to-primary-950" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="font-urdu text-[26px] leading-[2.2] text-emerald-200 sm:text-[30px]">
              اگلی فصل کا حساب، اب آپ کے ہاتھ میں۔
            </p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Your next harvest deserves a better desk.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-emerald-50/75">
              Join the pilot on the Multan–Lahore corridor. Free while we learn from your harvest — you keep the
              numbers either way.
            </p>
          </Reveal>
          <Reveal delay={140}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/signup"
                className="group flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-[14.5px] font-extrabold text-accent-foreground shadow-xl shadow-amber-500/25 transition-transform hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Start the pilot — free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/dashboard"
                className="rounded-full border border-white/25 px-7 py-3.5 text-[14.5px] font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Open the app
              </Link>
            </div>
            <p className="mt-5 font-mono text-[10px] tracking-[0.18em] text-white/40">
              NO CREDIT CARD · NO DOWNLOADS · PILOT CORRIDOR: MULTAN → LAHORE
            </p>
          </Reveal>
        </div>
      </section>
    </>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-primary-950 py-12">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[1.2fr_0.8fr_1.4fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
              <Leaf className="h-4 w-4 text-emerald-300" />
            </span>
            <span className="text-[15px] font-extrabold tracking-tight text-white">
              FreshRoute <span className="font-medium text-emerald-300/90">Agent</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-[12px] leading-relaxed text-white/50">
            The AI selling & logistics copilot for fresh produce. Built for Pakistan's growers — pilot corridor:
            Multan → Lahore, tomatoes first.
          </p>
        </div>

        <nav className="flex flex-col gap-2.5 text-[13px] font-semibold" aria-label="App">
          <p className="font-mono text-[10px] tracking-[0.18em] text-white/40">APP</p>
          <Link to="/signup" className="w-fit text-white/70 transition-colors hover:text-white">Create account</Link>
          <Link to="/login" className="w-fit text-white/70 transition-colors hover:text-white">Log in</Link>
          <Link to="/dashboard" className="w-fit text-white/70 transition-colors hover:text-white">Open the dashboard</Link>
        </nav>

        <div>
          <p className="font-mono text-[10px] tracking-[0.18em] text-white/40">HONEST FOOTNOTES</p>
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-white/45">
            *Post-harvest loss and intermediary counts are widely-cited ranges (FAO / national agri-research
            estimates). Mandi rates shown on this page come from the app's <span className="text-white/70">simulated
            pilot feed</span> — they are not live market prices. Story figures are illustrative composites of the
            app's demo scenarios. Field results will replace them as the pilot reports.
          </p>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 pt-6 sm:px-6">
        <p className="text-[11px] text-white/40">© 2026 FreshRoute · Built for Pakistan's fresh-produce growers</p>
        <p className="font-mono text-[10px] text-white/30">VITE · REACT · SUPABASE · GEMINI</p>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-primary-950 font-sans">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Stories />
        <Impact />
        <Trust />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
