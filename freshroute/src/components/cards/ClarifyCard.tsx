import { useState } from "react"
import { Check, MessageCircleQuestion } from "lucide-react"
import { onClarifyConfirm } from "@/store/director"
import { cn } from "@/lib/utils"
import type { Packaging } from "@/types"

interface Q<T extends string> {
  id: string
  label: string
  hint: string
  options: { value: T; label: string; best?: boolean }[]
}

const QUESTIONS: [Q<"crates" | "sacks" | "loose">, Q<"none" | "shade" | "cold">, Q<"early" | "late">] = [
  {
    id: "packaging",
    label: "How is the produce packed?",
    hint: "Affects spoilage — ventilated crates keep produce coolest",
    options: [
      { value: "crates", label: "Crates ✓", best: true },
      { value: "sacks", label: "Sacks" },
      { value: "loose", label: "Loose" },
    ],
  },
  {
    id: "storage",
    label: "Shade or cold storage available tonight?",
    hint: "Overnight heat is the biggest spoilage driver",
    options: [
      { value: "none", label: "No storage" },
      { value: "shade", label: "Shade" },
      { value: "cold", label: "Cold storage", best: true },
    ],
  },
  {
    id: "depart",
    label: "Can the load leave before 9 AM?",
    hint: "Early dispatch avoids afternoon heat on the road",
    options: [
      { value: "early", label: "Yes, 7 AM", best: true },
      { value: "late", label: "After 10 AM" },
    ],
  },
]

export function ClarifyCard() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [confirming, setConfirming] = useState(false)
  const allAnswered = QUESTIONS.every((q) => answers[q.id])

  const packaging = (answers.packaging ?? "crates") as Packaging
  const storageAvailable = answers.storage === "cold"
  const departEarly = answers.depart === "early"

  return (
    <div className="w-[92%] max-w-[340px] animate-msg-in rounded-2xl bg-card p-3.5 shadow-card">
      <div className="mb-2.5 flex items-center gap-2">
        <MessageCircleQuestion className="h-4 w-4 text-primary-600" />
        <span className="text-[12px] font-bold tracking-wide text-foreground">Quick questions</span>
        <span className="text-[10px] font-medium text-muted-foreground">· 3 of 3 affect your price</span>
      </div>

      <div className="flex flex-col gap-3">
        {QUESTIONS.map((q) => (
          <div key={q.id}>
            <p className="text-[13px] font-bold text-foreground">{q.label}</p>
            <p className="mb-1.5 text-[10.5px] leading-snug text-muted-foreground">{q.hint}</p>
            <div className="flex flex-wrap gap-1.5">
              {q.options.map((o) => {
                const selected = answers[q.id] === o.value
                return (
                  <button
                    key={o.value}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.value }))}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[12px] font-bold transition-all",
                      selected
                        ? "border-primary-600 bg-primary-600 text-white shadow-glow"
                        : "border-border bg-card text-foreground hover:border-primary-300 hover:bg-secondary",
                    )}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        disabled={!allAnswered || confirming}
        onClick={() => {
          setConfirming(true)
          onClarifyConfirm(packaging, storageAvailable, departEarly)
        }}
        className={cn(
          "mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold transition-all",
          allAnswered && !confirming
            ? "bg-primary-600 text-white shadow-glow hover:bg-primary-700 active:scale-[0.98]"
            : "bg-muted text-muted-foreground",
        )}
      >
        <Check className="h-4 w-4" />
        {confirming ? "Analyzing…" : "Confirm details"}
      </button>
    </div>
  )
}
