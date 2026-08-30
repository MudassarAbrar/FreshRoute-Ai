import { useEffect, useRef } from "react"
import { useApp } from "@/store/useApp"
import { AgentBubble, DayDivider, EncryptionNote, PhotosUser, TextUser, VoiceUser } from "@/components/Bubbles"
import { LotCard } from "@/components/cards/LotCard"
import { ClarifyCard } from "@/components/cards/ClarifyCard"
import { ScenariosCard } from "@/components/cards/ScenariosCard"
import { ApprovalCard } from "@/components/cards/ApprovalCard"
import { OffersCard } from "@/components/cards/OffersCard"
import { OrderCard } from "@/components/cards/OrderCard"
import { AlertCard, SummaryCard } from "@/components/cards/AlertSummaryCards"

function TypingBubble() {
  const label = useApp((s) => s.typingLabel)
  return (
    <div className="flex animate-msg-in">
      <div className="flex items-center gap-2.5 rounded-bubble rounded-tl-sm bg-card px-4 py-3 shadow-card bubble-tail-left">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-typing rounded-full bg-primary-500"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
        {label && <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>}
      </div>
    </div>
  )
}

export function ChatBody() {
  const msgs = useApp((s) => s.msgs)
  const typing = useApp((s) => s.typing)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [msgs.length, typing])

  return (
    <main className="chat-pattern scrollbar-thin relative flex-1 overflow-y-auto px-3 py-3">
      <DayDivider label="Today" />
      <EncryptionNote />

      <div className="mt-3 flex flex-col gap-2.5">
        {msgs.map((m) => {
          switch (m.kind) {
            case "text":
              return m.role === "user" ? (
                <TextUser key={m.id} text={m.text} time={m.time} />
              ) : (
                <AgentBubble key={m.id} text={m.text} time={m.time} />
              )
            case "voice":
              return <VoiceUser key={m.id} durationSec={m.durationSec} time={m.time} />
            case "photos":
              return <PhotosUser key={m.id} photos={m.photos} time={m.time} />
            case "lot":
              return <LotCard key={m.id} lot={m.lot} />
            case "clarify":
              return <ClarifyCard key={m.id} />
            case "scenarios":
              return <ScenariosCard key={m.id} scenarios={m.scenarios} recommendedId={m.recommendedId} />
            case "approval":
              return <ApprovalCard key={m.id} approval={m.approval} />
            case "offers":
              return <OffersCard key={m.id} offers={m.offers} />
            case "order":
              return <OrderCard key={m.id} order={m.order} />
            case "alert":
              return <AlertCard key={m.id} alert={m.alert} />
            case "summary":
              return <SummaryCard key={m.id} summary={m.summary} />
            default:
              return null
          }
        })}
        {typing && <TypingBubble />}
      </div>
      <div ref={endRef} className="h-1" />
    </main>
  )
}
