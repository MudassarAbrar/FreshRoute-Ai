import { create } from "zustand"
import type { Session } from "@supabase/supabase-js"
import { tickerPrices } from "@/data/market"
import type {
  AuditEntry,
  ApprovalRequest,
  Lot,
  Msg,
  Order,
  PricePoint,
  Profile,
  QuickReply,
  Scenario,
  Stage,
  UserRole,
} from "@/types"
import type { Lang } from "@/i18n"
import { uid } from "@/lib/format"
import type { AiMode } from "@/lib/gemini"

interface AppState {
  stage: Stage
  msgs: Msg[]
  typing: boolean
  typingLabel: string
  quickReplies: QuickReply[]
  lot: Lot | null
  scenarios: Scenario[]
  audit: AuditEntry[]
  lang: Lang
  sheet: "none" | "photos" | "settings"
  drawerAudit: boolean
  ticker: PricePoint[]
  booted: boolean
  aiMode: AiMode
  aiError: string
  session: Session | null
  profile: Profile | null
  /** Active user roles loaded from user_roles table (Task 1) */
  userRoles: UserRole[]

  addMsg: (m: Msg) => void
  setStage: (s: Stage) => void
  setTyping: (on: boolean, label?: string) => void
  setQuick: (q: QuickReply[]) => void
  setLot: (l: AppState["lot"]) => void
  setScenarios: (s: Scenario[]) => void
  addAudit: (actor: AuditEntry["actor"], action: string, approved?: boolean) => void
  setLang: (l: Lang) => void
  setSheet: (s: AppState["sheet"]) => void
  setDrawer: (b: boolean) => void
  updateApproval: (id: string, status: ApprovalRequest["status"]) => void
  updateOrder: (fn: (o: Order) => Order) => void
  boot: () => void
  setAiMode: (mode: AiMode, error?: string) => void
  setAuth: (session: Session | null, profile: Profile | null) => void
  setUserRoles: (roles: UserRole[]) => void
}

export const useApp = create<AppState>((set, get) => ({
  stage: "welcome",
  msgs: [],
  typing: false,
  typingLabel: "",
  quickReplies: [],
  lot: null,
  scenarios: [],
  audit: [],
  lang: "en",
  sheet: "none",
  drawerAudit: false,
  ticker: tickerPrices("Tomato"),
  booted: false,
  aiMode: "checking",
  aiError: "",
  session: null,
  profile: null,
  userRoles: [],

  addMsg: (m) => set((s) => ({ msgs: [...s.msgs, m] })),
  setStage: (stage) => set({ stage }),
  setTyping: (on, label = "") => set({ typing: on, typingLabel: label }),
  setQuick: (quickReplies) => set({ quickReplies }),
  setLot: (lot) => set({ lot }),
  setScenarios: (scenarios) => set({ scenarios }),

  addAudit: (actor, action, approved) =>
    set((s) => ({
      audit: [...s.audit, { id: uid(), time: Date.now(), actor, action, approved }],
    })),

  setLang: (lang) => set({ lang }),
  setSheet: (sheet) => set({ sheet }),
  setDrawer: (drawerAudit) => set({ drawerAudit }),

  updateApproval: (id, status) =>
    set((s) => ({
      msgs: s.msgs.map((m) =>
        m.kind === "approval" && m.approval.id === id
          ? { ...m, approval: { ...m.approval, status, decidedAt: Date.now() } }
          : m,
      ),
    })),

  updateOrder: (fn) =>
    set((s) => {
      const lastOrder = [...s.msgs].reverse().find((m) => m.kind === "order")
      if (!lastOrder) return s
      return {
        msgs: s.msgs.map((m) =>
          m.id === lastOrder.id && m.kind === "order" ? { ...m, order: fn(m.order) } : m,
        ),
      }
    }),

  boot: () => {
    if (get().booted) return
    set({ booted: true })
  },

  setAiMode: (aiMode, error = "") => set({ aiMode, aiError: error }),
  setAuth: (session, profile) => set({ session, profile }),
  setUserRoles: (userRoles) => set({ userRoles }),
}))

export const now = () => Date.now()

export function agentText(text: string): Msg {
  return { id: uid(), role: "agent", kind: "text", text, time: now() }
}

export function userText(text: string): Msg {
  return { id: uid(), role: "user", kind: "text", text, time: now() }
}
