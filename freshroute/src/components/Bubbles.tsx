import { CheckCheck } from "lucide-react"
import { clock } from "@/lib/format"
import type { Msg } from "@/types"
import { cn } from "@/lib/utils"
import { useApp } from "@/store/useApp"

export function TimeMeta({ time, className }: { time: number; className?: string }) {
  return <span className={cn("shrink-0 text-[10px] font-medium text-muted-foreground/70", className)}>{clock(time)}</span>
}

export function AgentBubble({
  text,
  time,
  children,
  wide,
}: {
  text?: string
  time?: number
  children?: React.ReactNode
  wide?: boolean
}) {
  const ur = useApp((s) => s.lang === "ur")
  return (
    <div className="flex animate-msg-in">
      <div
        dir={ur ? "rtl" : undefined}
        className={cn(
          "relative max-w-[88%] rounded-bubble rounded-tl-sm bg-card px-3.5 py-2 shadow-card bubble-tail-left",
          wide && "max-w-none",
        )}
      >
        {text && (
          <p className={cn("whitespace-pre-line text-[14px] leading-relaxed text-foreground", ur && "font-urdu text-right")}>
            {text}
          </p>
        )}
        {children}
        {time !== undefined && (
          <div className="mt-0.5 flex justify-end">
            <TimeMeta time={time} />
          </div>
        )}
      </div>
    </div>
  )
}

export function UserBubble({ children, time }: { children: React.ReactNode; time: number }) {
  return (
    <div className="flex animate-msg-in justify-end">
      <div className="relative max-w-[85%] rounded-bubble rounded-tr-sm bg-bubble-user px-3.5 py-2 text-white shadow-card bubble-tail-right">
        {children}
        <div className="mt-0.5 flex items-center justify-end gap-1">
          <span className="text-[10px] font-medium text-white/70">{clock(time)}</span>
          <CheckCheck className="h-3.5 w-3.5 text-emerald-200" />
        </div>
      </div>
    </div>
  )
}

export function TextUser({ text, time }: { text: string; time: number }) {
  return (
    <UserBubble time={time}>
      <p className="whitespace-pre-line text-[14px] leading-relaxed">{text}</p>
    </UserBubble>
  )
}

export function VoiceUser({ durationSec, time }: { durationSec: number; time: number }) {
  return (
    <UserBubble time={time}>
      <div className="flex items-center gap-2.5 py-0.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <div className="flex h-8 items-center gap-[2px]">
          {Array.from({ length: 22 }).map((_, i) => (
            <span
              key={i}
              className="w-[2.5px] rounded-full bg-white/80"
              style={{ height: `${8 + Math.abs(Math.sin(i * 1.7)) * 18}px` }}
            />
          ))}
        </div>
        <span className="text-[11px] font-semibold text-white/85">0:0{durationSec}</span>
      </div>
      <p className="mt-1 text-[11px] text-white/70">🎤 Voice note · Urdu</p>
    </UserBubble>
  )
}

export function PhotosUser({ photos, time }: { photos: string[]; time: number }) {
  return (
    <UserBubble time={time}>
      <div className={cn("mb-1 grid gap-1", photos.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
        {photos.slice(0, 2).map((p) => (
          <img
            key={p}
            src={p}
            alt="Produce photo"
            className="h-28 w-36 rounded-lg object-cover"
            loading="lazy"
          />
        ))}
      </div>
      <p className="text-[12px] text-white/80">
        {photos.length} photo{photos.length > 1 ? "s" : ""} · tomato lot
      </p>
    </UserBubble>
  )
}

export function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-1">
      <span className="rounded-full bg-primary-900/8 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-800/70 backdrop-blur-sm">
        {label}
      </span>
    </div>
  )
}

export function EncryptionNote() {
  return (
    <div className="mx-auto max-w-[85%] rounded-lg bg-primary-900/6 px-3 py-2 text-center text-[10.5px] leading-relaxed text-primary-900/60 backdrop-blur-sm">
      🔒 You approve every message before it's sent. All actions are logged in your Action Log.
    </div>
  )
}

export function msgKey(m: Msg) {
  return m.id
}
