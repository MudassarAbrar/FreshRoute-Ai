import { ScrollText, ShieldCheck, X } from "lucide-react"
import { clock } from "@/lib/format"
import { useApp } from "@/store/useApp"
import { cn } from "@/lib/utils"

export function AuditDrawer() {
  const drawerAudit = useApp((s) => s.drawerAudit)
  const setDrawer = useApp((s) => s.setDrawer)
  const audit = useApp((s) => s.audit)

  return (
    <>
      <div
        className={cn(
          "absolute inset-0 z-40 bg-primary-900/45 backdrop-blur-[2px] transition-opacity",
          drawerAudit ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setDrawer(false)}
      />
      <aside
        className={cn(
          "absolute inset-y-0 right-0 z-50 flex w-[86%] max-w-[330px] flex-col bg-card shadow-2xl transition-transform duration-300",
          drawerAudit ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 bg-gradient-to-r from-primary-800 to-primary-700 px-4 py-3 text-white">
          <ScrollText className="h-5 w-5 text-emerald-300" />
          <div className="flex-1">
            <h3 className="text-[14px] font-extrabold">Action Log</h3>
            <p className="text-[10px] text-emerald-100/80">Every agent action is recorded & auditable</p>
          </div>
          <button onClick={() => setDrawer(false)} className="rounded-full p-1 hover:bg-white/10" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-3">
          {audit.length === 0 && (
            <p className="mt-8 text-center text-[12px] text-muted-foreground">No actions yet.</p>
          )}
          <ol className="flex flex-col gap-0">
            {audit.map((e, i) => (
              <li key={e.id} className="relative flex gap-2.5 pb-3">
                {i < audit.length - 1 && <span className="absolute left-[9px] top-6 h-[calc(100%-10px)] w-[2px] rounded bg-muted" />}
                <span
                  className={cn(
                    "mt-1 h-[18px] w-[18px] shrink-0 rounded-full border-2",
                    e.actor === "Agent" && "border-primary-500 bg-primary-100",
                    e.actor === "You" && "border-warn bg-warn/20",
                    e.actor === "System" && "border-muted-foreground/40 bg-muted",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-extrabold uppercase tracking-wide",
                        e.actor === "Agent" && "text-primary-700",
                        e.actor === "You" && "text-warn",
                        e.actor === "System" && "text-muted-foreground",
                      )}
                    >
                      {e.actor}
                    </span>
                    <span className="text-[9.5px] font-medium text-muted-foreground/70">{clock(e.time)}</span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] font-medium leading-snug text-foreground/85">{e.action}</p>
                  {e.approved !== undefined && (
                    <span
                      className={cn(
                        "mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold",
                        e.approved ? "bg-good/15 text-good" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <ShieldCheck className="h-3 w-3" />
                      {e.approved ? "USER APPROVED" : "NO CONSENT"}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="border-t border-border bg-secondary/50 px-4 py-3">
          <p className="text-[10px] leading-snug text-muted-foreground">
            🔒 Trust principle: the agent never sends messages, books transport or commits funds without your explicit
            approval. Every decision is timestamped.
          </p>
        </div>
      </aside>
    </>
  )
}
