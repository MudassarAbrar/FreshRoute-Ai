import { useEffect } from "react"
import { PhoneFrame } from "@/components/PhoneFrame"
import { PriceTicker } from "@/components/PriceTicker"
import { ChatHeader } from "@/components/ChatHeader"
import { ChatBody } from "@/components/ChatBody"
import { QuickReplies } from "@/components/QuickReplies"
import { ChatInput } from "@/components/ChatInput"
import { PhotoSheet } from "@/components/PhotoSheet"
import { SettingsSheet } from "@/components/SettingsSheet"
import { AuditDrawer } from "@/components/AuditDrawer"
import { useApp } from "@/store/useApp"
import { boot, refreshAiMode } from "@/store/director"
import { saveChatState, loadChatState } from "@/lib/db"

export default function ChatPage() {
  const sheet = useApp((s) => s.sheet)

  useEffect(() => {
    boot()
    refreshAiMode()
  }, [])

  // Auto-recheck AI status when user returns to this tab
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshAiMode()
      }
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])

  // Restore chat state from DB on mount (if user is logged in)
  useEffect(() => {
    const userId = useApp.getState().session?.user?.id
    if (!userId) return
    loadChatState(userId).then((saved) => {
      if (saved && saved.stage && saved.stage !== "welcome" && saved.stage !== "completed") {
        useApp.getState().setStage(saved.stage as any)
      }
    }).catch(() => {})
  }, [])

  // Debounced save of chat state to DB when stage changes
  useEffect(() => {
    let prevStage = useApp.getState().stage
    let saveTimeout: ReturnType<typeof setTimeout> | null = null

    const unsubscribe = useApp.subscribe((s) => {
      if (s.stage === prevStage || s.stage === "welcome") return
      prevStage = s.stage
      const userId = s.session?.user?.id
      if (!userId) return
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        saveChatState(userId, {
          stage: s.stage,
          lot: s.lot,
          scenarios: s.scenarios,
          quickReplies: s.quickReplies,
        }).catch(() => {})
      }, 2000)
    })
    return () => {
      unsubscribe()
      if (saveTimeout) clearTimeout(saveTimeout)
    }
  }, [])

  return (
    <div className="h-full w-full bg-background p-0 sm:p-6 lg:py-8">
      <div className="mx-auto h-full max-w-[480px]">
        <PhoneFrame>
          <PriceTicker />
          <ChatHeader />
          <ChatBody />
          <QuickReplies />
          <ChatInput />

          {sheet === "photos" && <PhotoSheet />}
          {sheet === "settings" && <SettingsSheet />}
          <AuditDrawer />
        </PhoneFrame>
      </div>
    </div>
  )
}
