import { onQuickReply } from "@/store/director"
import { useApp } from "@/store/useApp"
import { cn } from "@/lib/utils"

export function QuickReplies() {
  const quickReplies = useApp((s) => s.quickReplies)
  const typing = useApp((s) => s.typing)
  if (quickReplies.length === 0 || typing) return null

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-1.5 pt-2">
      {quickReplies.map((q) => (
        <button
          key={q.id}
          onClick={() => onQuickReply(q.id)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-bold shadow-card transition-all active:scale-95",
            q.primary
              ? "border-primary-600 bg-primary-600 text-white"
              : "border-border bg-card text-primary-800 hover:bg-secondary",
          )}
        >
          {q.emoji && <span className="text-[13px]">{q.emoji}</span>}
          {q.label}
        </button>
      ))}
    </div>
  )
}
