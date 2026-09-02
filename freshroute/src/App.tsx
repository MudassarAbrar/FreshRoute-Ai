import { useEffect } from "react"
import { PriceTicker } from "@/components/PriceTicker"
import { ChatHeader } from "@/components/ChatHeader"
import { ChatBody } from "@/components/ChatBody"
import { QuickReplies } from "@/components/QuickReplies"
import { ChatInput } from "@/components/ChatInput"
import { PhotoSheet } from "@/components/PhotoSheet"
import { SettingsSheet } from "@/components/SettingsSheet"
import { AuditDrawer } from "@/components/AuditDrawer"
import { useApp } from "@/store/useApp"
import { boot } from "@/store/director"

function App() {
  const sheet = useApp((s) => s.sheet)

  useEffect(() => {
    boot()
  }, [])

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden md:rounded-2xl md:border md:border-border md:bg-card md:shadow-xl">
        <PriceTicker />
        <ChatHeader />
        <ChatBody />
        <QuickReplies />
        <ChatInput />

        {sheet === "photos" && <PhotoSheet />}
        {sheet === "settings" && <SettingsSheet />}
        <AuditDrawer />
      </div>
    </div>
  )
}

export default App
