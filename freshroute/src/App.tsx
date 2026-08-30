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
import { boot } from "@/store/director"

function App() {
  const sheet = useApp((s) => s.sheet)

  useEffect(() => {
    boot()
  }, [])

  return (
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
  )
}

export default App
