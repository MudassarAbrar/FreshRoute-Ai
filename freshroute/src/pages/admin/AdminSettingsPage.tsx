import { useEffect, useState } from "react"
import { fetchAiUsage } from "@/lib/db"
import { refreshAiMode } from "@/store/director"
import { ModeBadge } from "@/components/SettingsSheet"
import { useApp } from "@/store/useApp"
import { backendConfigured } from "@/lib/supabase"
import { Zap, RefreshCcw, Loader2, CheckCircle2, AlertTriangle, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminSettingsPage() {
  const aiMode = useApp((s) => s.aiMode)
  const aiError = useApp((s) => s.aiError)
  const [aiLogs, setAiLogs] = useState<any[]>([])
  const [rechecking, setRechecking] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAiUsage(30)
      .then(setAiLogs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const recheck = async () => {
    setRechecking(true)
    await refreshAiMode()
    setRechecking(false)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">System configuration, AI monitoring, and health checks.</p>
      </div>

      {/* AI Status */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary-600" />
          <h2 className="text-[15px] font-extrabold text-foreground">AI Engine Status</h2>
          <ModeBadge mode={aiMode} className="ml-auto" />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className={cn("rounded-xl p-3 text-center", aiMode === "live" ? "bg-good/10" : "bg-muted/30")}>
            <CheckCircle2 className={cn("mx-auto mb-1 h-5 w-5", aiMode === "live" ? "text-good" : "text-muted-foreground/40")} />
            <p className="text-[12px] font-bold text-foreground">Live</p>
          </div>
          <div className={cn("rounded-xl p-3 text-center", aiMode === "demo" ? "bg-warn/10" : "bg-muted/30")}>
            <Activity className={cn("mx-auto mb-1 h-5 w-5", aiMode === "demo" ? "text-warn" : "text-muted-foreground/40")} />
            <p className="text-[12px] font-bold text-foreground">Demo</p>
          </div>
          <div className={cn("rounded-xl p-3 text-center", aiMode === "error" ? "bg-risk/10" : "bg-muted/30")}>
            <AlertTriangle className={cn("mx-auto mb-1 h-5 w-5", aiMode === "error" ? "text-risk" : "text-muted-foreground/40")} />
            <p className="text-[12px] font-bold text-foreground">Error</p>
          </div>
        </div>
        {aiError && <p className="mb-3 text-[13px] text-risk font-medium">{aiError}</p>}
        <button onClick={recheck} disabled={rechecking}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[12px] font-bold text-muted-foreground hover:bg-muted disabled:opacity-60">
          {rechecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
          {rechecking ? "Checking…" : "Re-check AI status"}
        </button>
      </div>

      {/* Backend Status */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-2 text-[15px] font-extrabold text-foreground">Backend Configuration</h2>
        {backendConfigured ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-good" />
            <p className="text-[13px] font-medium text-good">Supabase backend is configured and connected.</p>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
            <p className="text-[13px] text-amber-900">
              Backend not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.
            </p>
          </div>
        )}
      </div>

      {/* AI Usage Logs */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-[15px] font-extrabold text-foreground">Recent AI Usage</h2>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary-600" /></div>
        ) : aiLogs.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">No AI usage logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">Time</th>
                  <th className="px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">Action</th>
                  <th className="px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">Model</th>
                  <th className="px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">Status</th>
                  <th className="px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">Latency</th>
                </tr>
              </thead>
              <tbody>
                {aiLogs.map((log: any) => (
                  <tr key={log.id} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2 text-[12px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2 text-[12px] font-bold text-foreground">{log.action}</td>
                    <td className="px-3 py-2 text-[12px] text-foreground">{log.model}</td>
                    <td className="px-3 py-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
                        log.status === "ok" ? "bg-good/15 text-good" : "bg-risk/15 text-risk"
                      )}>{log.status.toUpperCase()}</span>
                    </td>
                    <td className="px-3 py-2 text-[12px] text-muted-foreground">{log.latency_ms}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
