import { useState } from "react"
import { AlertTriangle, CheckCircle2, KeyRound, Loader2, RefreshCcw, ServerCog, X, Zap } from "lucide-react"
import { refreshAiMode } from "@/store/director"
import { useApp } from "@/store/useApp"
import { backendConfigured } from "@/lib/supabase"
import { cn } from "@/lib/utils"

export function SettingsSheet() {
  const setSheet = useApp((s) => s.setSheet)
  const aiMode = useApp((s) => s.aiMode)
  const aiError = useApp((s) => s.aiError)
  const [rechecking, setRechecking] = useState(false)

  const recheck = async () => {
    setRechecking(true)
    await refreshAiMode()
    setRechecking(false)
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <button className="absolute inset-0 bg-primary-900/45 backdrop-blur-[2px]" onClick={() => setSheet("none")} aria-label="Close" />
      <div className="animate-fade-up relative rounded-t-3xl bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-sheet">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary-600" />
            <h3 className="text-[15px] font-extrabold text-foreground">Settings</h3>
          </div>
          <button onClick={() => setSheet("none")} className="rounded-full p-1.5 hover:bg-muted" aria-label="Close">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* AI mode — reported by the server, not guessed */}
        <div className="mb-3 rounded-2xl border border-border p-3.5">
          <div className="mb-1.5 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary-600" />
            <span className="text-[13px] font-extrabold text-foreground">AI engine</span>
            <ModeBadge mode={aiMode} className="ml-auto" />
          </div>
          {aiMode === "checking" && (
            <p className="text-[11px] leading-snug text-muted-foreground">Checking the server AI configuration…</p>
          )}
          {aiMode === "live" && (
            <p className="text-[11px] leading-snug text-muted-foreground">
              Real Gemini responses are active. The API key is stored as a server-side secret on the Supabase edge
              function — it never touches this browser.
            </p>
          )}
          {aiMode === "demo" && (
            <p className="text-[11px] leading-snug text-muted-foreground">
              No GEMINI_API_KEY is configured on the server, so the app runs in clearly-labeled demo mode:
              deterministic offline extraction, grading and scripted replies. Set the server secret
              (<code className="rounded bg-muted px-1">supabase secrets set GEMINI_API_KEY=…</code>) to switch to real
              AI.
            </p>
          )}
          {aiMode === "error" && (
            <p className="text-[11px] leading-snug text-risk">
              <span className="font-bold">AI request failed:</span> {aiError || "unknown error"} — the app continues
              in demo mode. This error is shown instead of silently returning canned answers.
            </p>
          )}
          <button
            onClick={recheck}
            disabled={rechecking}
            className="mt-2 flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            {rechecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
            {rechecking ? "Checking…" : "Re-check status"}
          </button>
        </div>

        {!backendConfigured && (
          <div className="mb-3 flex items-start gap-2.5 rounded-2xl border border-warn/40 bg-amber-50 p-3.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
            <p className="text-[11px] leading-relaxed text-amber-900">
              <span className="font-bold">Backend not configured.</span> Add VITE_SUPABASE_URL and
              VITE_SUPABASE_ANON_KEY to <code className="rounded bg-amber-100 px-1">.env.local</code> to enable
              accounts, orders and AI. See SETUP.md.
            </p>
          </div>
        )}

        <div className="mb-3 flex items-start gap-2.5 rounded-2xl bg-secondary/70 p-3.5">
          <ServerCog className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-bold text-foreground">Simulated demo network:</span> buyer replies, transport
            quotes, delivery tracking and mandi prices are choreographed demo data — clearly labeled wherever they
            appear. Scenario maths (net revenue, spoilage, ranking) is real and runs live in your browser.
          </p>
        </div>

        <button
          onClick={() => location.reload()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border py-2.5 text-[13px] font-bold text-muted-foreground transition-colors hover:bg-muted"
        >
          <RefreshCcw className="h-4 w-4" />
          Reset demo
        </button>
      </div>
    </div>
  )
}

export function ModeBadge({
  mode,
  light,
  className,
}: {
  mode: "checking" | "live" | "demo" | "error"
  light?: boolean
  className?: string
}) {
  if (mode === "checking")
    return (
      <span
        className={cn(
          "flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold",
          light ? "bg-white/15 text-white" : "bg-muted text-muted-foreground",
          className,
        )}
      >
        <Loader2 className={cn("h-3 w-3 animate-spin", light && "text-emerald-200")} />
        CHECKING
      </span>
    )
  if (mode === "live")
    return (
      <span
        className={cn(
          "flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold",
          light ? "bg-emerald-400/25 text-emerald-100" : "bg-good/15 text-good",
          className,
        )}
      >
        <CheckCircle2 className={cn("h-3 w-3", light && "text-emerald-300")} />
        LIVE GEMINI
      </span>
    )
  if (mode === "demo")
    return (
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[9.5px] font-extrabold",
          light ? "bg-amber-400/25 text-amber-100" : "bg-warn/15 text-warn",
          className,
        )}
      >
        DEMO MODE
      </span>
    )
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold",
        light ? "bg-red-400/25 text-red-100" : "bg-risk/15 text-risk",
        className,
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      AI ERROR
    </span>
  )
}
