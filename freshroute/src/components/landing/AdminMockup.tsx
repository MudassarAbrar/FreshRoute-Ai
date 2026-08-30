import {
  Activity,
  CircleDollarSign,
  LayoutDashboard,
  Package,
  Sparkles,
  Truck,
  Users,
} from "lucide-react"
import { Logo } from "@/components/landing/Logo"
import { cn } from "@/lib/utils"

const NAV = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: Package, label: "Lots" },
  { icon: Users, label: "Buyers" },
  { icon: Truck, label: "Transport" },
  { icon: Sparkles, label: "AI usage" },
]

const STATS = [
  { icon: Package, label: "Active lots", value: "12", note: "+3 today" },
  { icon: Truck, label: "In transit", value: "5", note: "2 on N-5" },
  { icon: Activity, label: "Awaiting approval", value: "3", note: "avg wait 14 min" },
  { icon: CircleDollarSign, label: "Net volume · today", value: "1.42M", note: "PKR · 7 lots" },
]

const ROWS = [
  { id: "FR-2418", farmer: "M. Ashraf", crop: "Tomato · 4,000 kg", route: "Multan → Lahore", net: "330,330", status: "Delivered", tone: "good" },
  { id: "FR-2419", farmer: "Z. Bibi", crop: "Okra · 1,500 kg", route: "Lodhran → Faisalabad", net: "137,170", status: "In transit", tone: "info" },
  { id: "FR-2420", farmer: "G. Mustafa", crop: "Kinnow · 6,000 kg", route: "Sargodha → Lahore", net: "585,200", status: "Approval", tone: "warn" },
  { id: "FR-2421", farmer: "H. Ibrahim", crop: "Potato · 2,200 kg", route: "Kasur → Lahore", net: "96,800", status: "Priced", tone: "muted" },
] as const

function StatusPill({ status, tone }: { status: string; tone: (typeof ROWS)[number]["tone"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold",
        tone === "good" && "bg-good/10 text-good",
        tone === "info" && "bg-primary-600/10 text-primary-700",
        tone === "warn" && "bg-warn/15 text-warn",
        tone === "muted" && "bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "good" && "bg-good",
          tone === "info" && "bg-primary-600",
          tone === "warn" && "bg-warn",
          tone === "muted" && "bg-muted-foreground/50",
        )}
        aria-hidden
      />
      {status}
    </span>
  )
}

export function AdminMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card-hover" role="img" aria-label="FreshRoute operations console preview">
      {/* browser chrome */}
      <div className="flex items-center gap-3 border-b border-border/60 bg-muted/60 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-auto flex w-full max-w-[260px] items-center justify-center rounded-md bg-card px-3 py-1 text-[10px] font-semibold text-muted-foreground">
          app.freshroute.pk/admin
        </div>
        <span className="hidden items-center gap-1 rounded-full bg-good/10 px-2 py-0.5 text-[8.5px] font-bold text-good sm:flex">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-good" aria-hidden />
          LIVE
        </span>
      </div>

      <div className="app-surface flex bg-background">
        {/* sidebar */}
        <div className="hidden w-[130px] shrink-0 flex-col border-r border-border/60 bg-card p-3 sm:flex">
          <div className="flex items-center gap-1.5 px-1 pb-3">
            <Logo size={18} />
            <span className="text-[10px] font-extrabold text-foreground">FreshRoute</span>
          </div>
          {NAV.map((n) => (
            <span
              key={n.label}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[9.5px] font-semibold",
                n.active ? "bg-secondary text-primary-800" : "text-muted-foreground",
              )}
            >
              <n.icon className="h-3.5 w-3.5" aria-hidden />
              {n.label}
            </span>
          ))}
          <span className="mt-auto rounded-lg border border-dashed border-border px-2 py-1.5 text-[8px] font-semibold leading-snug text-muted-foreground">
            Role: operations admin
          </span>
        </div>

        {/* main */}
        <div className="min-w-0 flex-1 p-3.5 sm:p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[12px] font-extrabold text-foreground">Operations overview</p>
            <p className="text-[9px] text-muted-foreground">Tue 9:41 AM · PKT</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl border border-border/60 bg-card p-2.5">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <s.icon className="h-3 w-3 text-primary-600" aria-hidden />
                  <span className="truncate text-[8.5px] font-bold uppercase tracking-wide">{s.label}</span>
                </div>
                <p className="mt-1 text-[15px] font-extrabold leading-none text-foreground tabular-nums">{s.value}</p>
                <p className="mt-0.5 text-[8px] text-muted-foreground">{s.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-card">
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/50 px-3 py-1.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">Live lots</span>
              <span className="text-[8.5px] font-semibold text-primary-700">updated 40s ago</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-[8px] uppercase tracking-wider text-muted-foreground/80">
                  <th className="px-3 py-1.5 font-bold">Lot</th>
                  <th className="hidden py-1.5 font-bold md:table-cell">Farmer</th>
                  <th className="py-1.5 pr-2 font-bold">Route</th>
                  <th className="py-1.5 pr-3 text-right font-bold">Net (PKR)</th>
                  <th className="py-1.5 pr-3 text-right font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.id} className="border-t border-border/50">
                    <td className="px-3 py-2">
                      <p className="text-[9.5px] font-bold text-foreground">{r.id}</p>
                      <p className="hidden text-[8px] text-muted-foreground md:block">{r.crop}</p>
                    </td>
                    <td className="hidden py-2 text-[9.5px] font-semibold text-foreground/80 md:table-cell">{r.farmer}</td>
                    <td className="py-2 pr-2 text-[9px] font-medium text-muted-foreground">{r.route}</td>
                    <td className="py-2 pr-3 text-right text-[9.5px] font-bold text-foreground tabular-nums">{r.net}</td>
                    <td className="py-2 pr-3 text-right">
                      <StatusPill status={r.status} tone={r.tone} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-2.5 text-right text-[8px] font-bold tracking-wider text-muted-foreground/70">
            PREVIEW · DEMO DATA
          </p>
        </div>
      </div>
    </div>
  )
}
