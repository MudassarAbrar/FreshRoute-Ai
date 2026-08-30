import { BadgeCheck, ScrollText, Settings } from "lucide-react"
import { ModeBadge } from "@/components/SettingsSheet"
import { useApp } from "@/store/useApp"
import { t } from "@/i18n"

export function ChatHeader() {
  const lang = useApp((s) => s.lang)
  const setLang = useApp((s) => s.setLang)
  const aiMode = useApp((s) => s.aiMode)
  const setDrawer = useApp((s) => s.setDrawer)
  const setSheet = useApp((s) => s.setSheet)

  return (
    <header className="relative z-10 flex items-center gap-3 bg-gradient-to-r from-primary-800 to-primary-700 px-4 py-2.5 text-white">
      <div className="relative">
        <img
          src="/favicon.svg"
          alt="FreshRoute"
          className="h-10 w-10 rounded-xl border border-white/20 bg-primary-600 object-cover p-0.5"
        />
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-primary-800 bg-emerald-400" />
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-center gap-1.5">
          <h2 className="truncate text-[15px] font-bold">FreshRoute Agent</h2>
          <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-300" />
        </div>
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[11px] text-emerald-100/90">
            {t(lang, "aiAgent")} · {t(lang, "online")}
          </p>
          <ModeBadge mode={aiMode} light />
        </div>
      </div>
      <button
        onClick={() => setLang(lang === "en" ? "ur" : "en")}
        className="rounded-full px-2.5 py-1 text-[11px] font-bold text-emerald-100 transition-colors hover:bg-white/10"
        aria-label="Toggle language"
      >
        {lang === "en" ? "اردو" : "EN"}
      </button>
      <button
        onClick={() => setDrawer(true)}
        className="rounded-full p-1.5 text-emerald-100 transition-colors hover:bg-white/10"
        aria-label={t(lang, "auditLog")}
      >
        <ScrollText className="h-[18px] w-[18px]" />
      </button>
      <button
        onClick={() => setSheet("settings")}
        className="rounded-full p-1.5 text-emerald-100 transition-colors hover:bg-white/10"
        aria-label={t(lang, "settings")}
      >
        <Settings className="h-[18px] w-[18px]" />
      </button>
    </header>
  )
}
