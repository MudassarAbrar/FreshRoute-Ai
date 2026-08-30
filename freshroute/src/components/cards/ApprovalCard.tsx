import { Check, ShieldCheck, X } from "lucide-react"
import { clock } from "@/lib/format"
import { onApproveOutreach } from "@/store/director"
import { cn } from "@/lib/utils"
import type { ApprovalRequest } from "@/types"

export function ApprovalCard({ approval }: { approval: ApprovalRequest }) {
  const decided = approval.status !== "pending"

  return (
    <div className="w-[94%] max-w-[352px] animate-msg-in overflow-hidden rounded-2xl bg-card shadow-card">
      <div
        className={cn(
          "flex items-center gap-2 px-3.5 py-2.5",
          decided
            ? approval.status === "approved"
              ? "bg-good text-white"
              : "bg-muted text-muted-foreground"
            : "bg-warn/95 text-amber-950",
        )}
      >
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span className="text-[11px] font-extrabold tracking-wide">
          {decided
            ? approval.status === "approved"
              ? `APPROVED ${approval.decidedAt ? clock(approval.decidedAt) : ""}`
              : "DECLINED — NOTHING WAS SENT"
            : "APPROVAL NEEDED — NOTHING IS SENT WITHOUT YOU"}
        </span>
      </div>

      <div className="p-3.5">
        <p className="text-[14.5px] font-extrabold leading-snug text-foreground">{approval.title}</p>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">{approval.subtitle}</p>

        <ul className="mt-3 flex flex-col gap-1.5">
          {approval.actions.map((a) => (
            <li key={a.label} className="flex items-start gap-2 rounded-lg bg-secondary/70 px-2.5 py-2">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-600">
                <Check className="h-3 w-3 text-white" />
              </span>
              <div>
                <p className="text-[12px] font-bold text-foreground">{a.label}</p>
                <p className="text-[10.5px] text-muted-foreground">{a.detail}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-3 overflow-hidden rounded-xl border border-primary-200 bg-secondary/50">
          <div className="flex items-center gap-1.5 border-b border-primary-200/70 bg-primary-50 px-3 py-1.5">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-primary-600">
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
            </svg>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary-700">
              Draft message · WhatsApp → {approval.recipient.name}
            </span>
          </div>
          <p className="px-3 py-2.5 text-[12.5px] leading-relaxed text-foreground/90">{approval.messageDraft}</p>
        </div>

        {!decided ? (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onApproveOutreach(approval.id, false)}
              className="flex-1 rounded-xl border-2 border-border py-2.5 text-[13px] font-bold text-muted-foreground transition-colors hover:bg-muted active:scale-[0.98]"
            >
              <X className="mr-1 inline h-4 w-4" />
              Not now
            </button>
            <button
              onClick={() => onApproveOutreach(approval.id, true)}
              className="flex-[1.6] rounded-xl bg-primary-600 py-2.5 text-[13px] font-extrabold text-white shadow-glow transition-all hover:bg-primary-700 active:scale-[0.98]"
            >
              <Check className="mr-1 inline h-4 w-4" />
              Approve & send
            </button>
          </div>
        ) : (
          <p className="mt-2.5 text-[10px] text-muted-foreground">
            This decision is recorded in your Action Log with a timestamp.
          </p>
        )}
      </div>
    </div>
  )
}

export const approvalLabels = (lang: string) => ({
  approve: lang === "en" ? "Approve & send" : "منظور اور بھیجیں",
})
