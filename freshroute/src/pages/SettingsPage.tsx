import { useEffect, useState } from "react"
import { useApp } from "@/store/useApp"
import { signOut } from "@/lib/auth"
import { refreshAiMode } from "@/store/director"
import { ModeBadge } from "@/components/SettingsSheet"
import { backendConfigured } from "@/lib/supabase"
import { Globe, Zap, LogOut, RefreshCcw, Loader2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const lang = useApp((s) => s.lang)
  const setLang = useApp((s) => s.setLang)
  const aiMode = useApp((s) => s.aiMode)
  const aiError = useApp((s) => s.aiError)
  const [rechecking, setRechecking] = useState(false)

  useEffect(() => {
    if (useApp.getState().aiMode === "checking") refreshAiMode()
  }, [])

  const recheck = async () => {
    setRechecking(true)
    await refreshAiMode()
    setRechecking(false)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your preferences and application configuration.</p>
      </div>

      {/* Language */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary-600" />
          <h2 className="text-[15px] font-extrabold text-foreground">Language</h2>
        </div>
        <div className="flex gap-2">
          {(["en", "ur"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "rounded-xl px-4 py-2.5 text-[13px] font-bold transition-colors",
                lang === l ? "bg-primary-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {l === "en" ? "English" : "اردو (Urdu)"}
            </button>
          ))}
        </div>
      </div>

      {/* AI Engine */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary-600" />
          <h2 className="text-[15px] font-extrabold text-foreground">AI Engine</h2>
          <ModeBadge mode={aiMode} className="ml-auto" />
        </div>
        {aiMode === "live" && (
          <p className="text-[13px] text-muted-foreground">Real Gemini AI responses are active. The API key is stored securely on the server.</p>
        )}
        {aiMode === "demo" && (
          <p className="text-[13px] text-muted-foreground">Running in demo mode with deterministic offline responses. Configure GEMINI_API_KEY on the server to enable real AI.</p>
        )}
        {aiMode === "error" && (
          <p className="text-[13px] text-risk"><span className="font-bold">Error:</span> {aiError || "Unknown error"}</p>
        )}
        {aiMode === "checking" && (
          <p className="text-[13px] text-muted-foreground">Checking AI configuration…</p>
        )}
        <button
          onClick={recheck}
          disabled={rechecking}
          className="mt-3 flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[12px] font-bold text-muted-foreground hover:bg-muted disabled:opacity-60"
        >
          {rechecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
          {rechecking ? "Checking…" : "Re-check AI status"}
        </button>
      </div>

      {/* Backend */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-2 text-[15px] font-extrabold text-foreground">Backend</h2>
        {backendConfigured ? (
          <p className="text-[13px] text-good font-medium">Supabase backend is configured and connected.</p>
        ) : (
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
            <p className="text-[13px] text-amber-900">
              Backend not configured. Add <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_URL</code> and <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_ANON_KEY</code> to .env.local.
            </p>
          </div>
        )}
      </div>

      {/* Sign Out */}
      <button
        onClick={() => signOut().catch(() => {})}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-risk/30 bg-risk/5 py-3 text-[14px] font-bold text-risk transition-colors hover:bg-risk/10"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  )
}
