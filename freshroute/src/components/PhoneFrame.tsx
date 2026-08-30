import { BadgeCheck, Leaf, ShieldCheck, TrendingUp, Truck } from "lucide-react"

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        src="/images/backdrop.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-primary-900/75 backdrop-blur-[3px]" />

      <div className="absolute left-14 top-1/2 hidden max-w-sm -translate-y-1/2 flex-col gap-6 text-white xl:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <Leaf className="h-6 w-6 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">FreshRoute Agent</h1>
            <p className="text-sm font-medium text-emerald-200/90">AI selling & logistics copilot</p>
          </div>
        </div>
        <p className="text-[15px] leading-relaxed text-white/80">
          Not another advisory chatbot — an <span className="font-semibold text-white">execution agent</span> that
          turns one farmer message into a graded lot, market comparison, buyer outreach, transport booking and live
          delivery tracking.
        </p>
        <ul className="flex flex-col gap-3 text-sm">
          {[
            { icon: TrendingUp, text: "Net-revenue comparison across 5 mandis — after transport & spoilage" },
            { icon: ShieldCheck, text: "Nothing is ever sent or booked without your explicit approval" },
            { icon: Truck, text: "Live pickup → transit → delivery tracking with exception alerts" },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-white/85">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Icon className="h-4 w-4 text-emerald-300" />
              </span>
              {text}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 text-xs text-white/60">
          <BadgeCheck className="h-4 w-4 text-emerald-300" />
          Pilot corridor: Multan → Lahore · Tomatoes · Gemini-powered
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-0 sm:p-6 lg:py-8">
        <div className="relative flex h-full w-full flex-col overflow-hidden bg-card shadow-2xl sm:h-[min(860px,100%)] sm:w-[405px] sm:rounded-[2.4rem] sm:border-[9px] sm:border-gray-900 sm:shadow-black/50">
          {children}
        </div>
      </div>
    </div>
  )
}
