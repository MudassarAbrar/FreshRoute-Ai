// Legacy file — not used in production. Imports from test fixtures.
import { BUYERS, CROP_PRICES } from "../../tests/fixtures/market"
import {
  buildScenarios,
  buildScenariosAsync,
  COLD_STORAGE_PER_KG_DAY,
  gradePriceFactor,
  LOADING_COST,
  LOCAL_CARTAGE,
  MANDI_COMMISSION_RATE,
  PLATFORM_FEE_RATE,
  transportOptions,
} from "@/lib/engine"
import {
  agentChat,
  agentTurn,
  analyzePhoto,
  checkAiStatus,
  consumeAiError,
  extractLot,
  sanitizeForLLM,
  type LotExtraction,
} from "@/lib/gemini"
import { checkAgentInteraction, checkOrderAction } from "@/lib/rateLimiter"
import { isDomainAllowed } from "@/lib/orchestrator/planner"
import { maund, pkr, uid } from "@/lib/format"
import { L } from "@/lib/copy"
import { t } from "@/i18n"
import { agentText, useApp, userText } from "./useApp"
import { saveOrder } from "@/lib/db"
import { transition } from "@/lib/orderStateMachine"
import type { Lot, Msg, OrderStatus, Packaging, QuickReply, Scenario } from "@/types"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Feature flag: when true, route through ADK agent instead of scripted flow (Phase 3) */
const AGENTIC_MODE = import.meta.env.VITE_AGENTIC_MODE === "true"
/** ADK session ID for multi-turn agent conversations */
let adkSessionId = ""
/** Tracks the current state-machine status per order for transition() validation */
const orderCurrentStatus = new Map<string, OrderStatus>()

async function say(text: string, thinkMs = 1300, label = "") {
  const st = useApp.getState()
  st.setTyping(true, label)
  await sleep(thinkMs)
  useApp.getState().addMsg(agentText(text))
  useApp.getState().setTyping(false)
}

function quick(list: QuickReply[]) {
  useApp.getState().setQuick(list)
}

function priceLine(crop: string) {
  const p = CROP_PRICES[crop] ?? CROP_PRICES.Tomato
  return `Multan ${p.Multan} · Faisalabad ${p.Faisalabad} · Islamabad ${p.Islamabad} · Lahore ${p.Lahore} · Karachi ${p.Karachi} PKR/kg`
}

async function urlToDataUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return await new Promise<string>((resolve) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.readAsDataURL(blob)
    })
  } catch {
    return ""
  }
}

let pendingEx: LotExtraction | null = null
let selectedScenario: Scenario | null = null

const stripDot = (s: string) => s.replace(/\.$/, "")

/** After any AI step: if the proxy reported a failure, say so instead of silently using demo data. */
async function surfaceAiError() {
  const err = consumeAiError()
  if (!err) return
  useApp.getState().addMsg({
    id: uid(),
    role: "agent",
    kind: "text",
    text: `⚠️ ${err} — using offline demo mode for this step.`,
    time: Date.now(),
  })
  useApp.getState().addAudit("System", `AI request failed: ${err} — offline fallback used`)
}

/** Price the agent asks for / buyer accepts — keeps scenario quote and booking math aligned */
function dealPrice(lot: Lot, rec: Scenario): number {
  if (rec.id.startsWith("premium-")) return Math.round(rec.gross / rec.acceptedKg)
  const cityPrice = CROP_PRICES[lot.crop]?.[rec.destCity] ?? 80
  if (rec.id === "local") return cityPrice // mandi auction happens at the mandi rate
  return Math.round(cityPrice * gradePriceFactor(lot.vision.grade))
}

/* ────────────────────────── boot ────────────────────────── */

export async function boot() {
  const st = useApp.getState()
  if (st.booted) return
  useApp.setState({ booted: true })
  st.addAudit("System", "Session started · messaging consent recorded")
  await sleep(500)
  const lang = useApp.getState().lang
  await say(
    lang === "ur"
      ? "السلام علیکم! 👋 میں آپ کا FreshRoute ایجنٹ ہوں — میں آپ کو بہترین ریٹ پر فصل بیچنے، خریدار، ٹرانسپورٹ اور سٹوریج کا انتظام کرنے میں مدد کرتا ہوں۔"
      : "Assalam-o-Alaikum! 👋 I'm your FreshRoute Agent — I help you sell produce at the best net price, then arrange buyers, transport and storage for you.",
    1000,
  )
  await say(
    lang === "ur"
      ? "مجھے بتائیں آپ کے پاس کیا ہے — ٹائپ کریں، آواز کا پیغام بھیجیں، یا تصاویر بھیجیں۔\n\nمثال: \"ملتان میں 800 کلو ٹماٹر، کل تیار۔\""
      : "Tell me what you have — type it, send a voice note, or attach photos.\n\nFor example: \"I have 800 kg tomatoes in Multan, ready tomorrow.\"",
    1200,
  )
  quick([
    { id: "tomatoes", label: t(lang, "tomatoes"), emoji: "🍅", primary: true },
    { id: "voice", label: t(lang, "voice"), emoji: "🎤" },
    { id: "prices", label: t(lang, "prices"), emoji: "📊" },
  ])
  useApp.getState().setStage("awaiting-intake")
}

/* ────────────────────────── intake ────────────────────────── */

async function intakeFlow(text: string) {
  const st = useApp.getState()
  const lang = useApp.getState().lang
  st.setQuick([])
  st.setStage("analyzing")
  await say(L(lang, "Reading your message…", "آپ کا پیغام پڑھ رہا ہوں…"), 1200, "extracting")
  const ex = await extractLot(sanitizeForLLM(text), useApp.getState().lang)
  await surfaceAiError()

  if (!CROP_PRICES[ex.crop]) {
    await say(
      L(
        lang,
        `I can currently track 9 crops: tomato, potato, onion, mango, kinnow, banana, green chili, okra and leafy vegetables. I don't have reliable ${ex.crop.toLowerCase()} prices yet.\n\nShall we try the tomato demo lot for now?`,
        `فی الحال میں 9 فصلیں ٹریک کر سکتا ہوں: ٹماٹر، آلو، پیاز، آم، کنو، کیلا، سبز مرچ، بھنڈی اور پتے والی سبزیاں۔ ${ex.crop} کے قابلِ اعتماد ریٹ ابھی میرے پاس نہیں۔\n\nابھی ٹماٹر کا ڈیمو لوٹ آزمائیں؟`,
      ),
      1400,
    )
    quick([
      { id: "tomatoes", label: L(lang, "Yes — 800 kg tomatoes, Multan", "جی — 800 کلو ٹماٹر، ملتان"), emoji: "🍅", primary: true },
    ])
    useApp.getState().setStage("awaiting-intake")
    return
  }

  pendingEx = ex
  useApp.getState().addAudit(
    "Agent",
    `Lot intake received — AI extracted: ${ex.crop}, ${ex.quantityKg} kg, ${ex.location} (source: ${ex.source === "gemini" ? "Gemini" : "on-device parser"})`,
  )
  await say(L(lang, "Checking prices in 5 markets…", "5 منڈیوں کے ریٹ چیک کر رہا ہوں…"), 1100, "searching")
  await say(
    L(
      lang,
      `Got it — ${ex.crop.toLowerCase()}, ${ex.quantityKg.toLocaleString()} kg (~${maund(ex.quantityKg)} maund), ${ex.location}, ready ${ex.readyText}.\n\nToday's ${ex.crop.toLowerCase()} prices: ${priceLine(ex.crop)}.\n\nTo estimate your lot's grade and best option, please share 2–3 photos.`,
      `سمجھ گیا — ${ex.crop.toLowerCase()}، ${ex.quantityKg.toLocaleString()} کلو (~${maund(ex.quantityKg)} من)، ${ex.location}، ${ex.readyText} تیار۔\n\nآج کے ${ex.crop.toLowerCase()} کے ریٹ: ${priceLine(ex.crop)}۔\n\nلوٹ کی گریڈ اور بہترین آپشن کا اندازہ لگانے کے لیے 2–3 تصاویر بھیجیں۔`,
    ),
    1500,
  )
  quick([
    { id: "attach", label: L(lang, "Attach photos", "تصاویر لگائیں"), emoji: "📸", primary: true },
    { id: "skip", label: L(lang, "Skip photos", "تصاویر کے بغیر") },
  ])
  useApp.getState().setStage("awaiting-photos")
}

export async function onUserText(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return
  useApp.getState().addMsg(userText(trimmed))

  // Phase 1.1: Rate limit check (skip for anonymous/demo mode)
  const userId = useApp.getState().session?.user?.id
  if (userId) {
    const rl = checkAgentInteraction(userId)
    if (!rl.allowed) {
      const mins = rl.retryAfterMs ? Math.ceil(rl.retryAfterMs / 60_000) : 60
      useApp.getState().addMsg(agentText(
        `You've reached the hourly limit. Try again in about ${mins} minute${mins === 1 ? "" : "s"}.`
      ))
      return
    }
  }

  // Phase 3: AGENTIC_MODE routes through ADK agent
  if (AGENTIC_MODE && userId) {
    if (!adkSessionId) adkSessionId = `session-${userId}-${Date.now()}`
    const result = await agentTurn(adkSessionId, trimmed)
    if (result.ok) {
      adkSessionId = result.sessionId ?? adkSessionId
      if (result.text) {
        await say(result.text, 600)
      }
      // Show approval cards for write tools
      for (const tool of result.requiresApproval) {
        useApp.getState().addMsg({
          id: uid(),
          role: "agent",
          kind: "approval",
          approval: {
            id: uid(),
            title: `Approve: ${tool.name.replace(/_/g, " ")}`,
            subtitle: JSON.stringify(tool.args).slice(0, 200),
            actions: [{ label: "Approve", detail: "Execute this action" }],
            messageDraft: JSON.stringify(tool.args),
            recipient: { name: tool.name, role: "system" },
            status: "pending",
          },
          time: Date.now(),
        } as any)
      }
    } else {
      await say(`Sorry, something went wrong. Please try again.`, 400)
    }
    return
  }

  const stage = useApp.getState().stage
  const lotLike = /(\d+\s*(kg|kilo|maund))|tomato|potato|onion|mango|kinnow|banana|okra|chili/i.test(trimmed)
  if (stage === "awaiting-intake" || stage === "welcome" || (stage === "completed" && lotLike)) {
    await intakeFlow(trimmed)
  } else {
    await chatFlow(trimmed)
  }
}

export async function onVoiceNote(transcript?: string) {
  const text = transcript?.trim() || "I have 800 kg tomatoes in Multan. They will be ready tomorrow."
  const isReal = !!transcript?.trim()
  useApp.getState().addMsg({
    id: uid(),
    role: "user",
    kind: "voice",
    text,
    durationSec: isReal ? 0 : 6,
    time: Date.now(),
  })
  useApp.getState().setQuick([])
  await say(
    isReal
      ? L(useApp.getState().lang, "Transcribed ✓", "تحریر مکمل ✓")
      : L(
          useApp.getState().lang,
          "Transcribed ✓ (demo voice note → text)",
          "تحریر مکمل ✓ (ڈیمو آوازی پیغام → متن)",
        ),
    1000,
    "transcribing",
  )
  await intakeFlow(text)
}

/* ────────────────────────── photos + vision ────────────────────────── */

export async function onPhotosChosen(urls: string[]) {
  const st = useApp.getState()
  st.setQuick([])
  st.setSheet("none")
  st.addMsg({ id: uid(), role: "user", kind: "photos", photos: urls, time: Date.now() })
  st.setStage("analyzing")
  await say(
    L(useApp.getState().lang, "Analyzing photos…", "تصاویر کا تجزیہ کر رہا ہوں…"),
    2100,
    useApp.getState().lang === "ur" ? "وژن ماڈل · گریڈنگ" : "vision model · grading produce",
  )
  const ex = pendingEx ?? (await extractLot("800 kg tomatoes Multan", useApp.getState().lang))
  let dataUrl = urls[0] ?? ""
  if (dataUrl && !dataUrl.startsWith("data:")) dataUrl = await urlToDataUrl(dataUrl)
  const vision = await analyzePhoto(dataUrl, ex.crop.toLowerCase(), useApp.getState().lang)
  await surfaceAiError()
  const lot: Lot = {
    crop: ex.crop,
    quantityKg: ex.quantityKg,
    location: ex.location,
    readyDate: ex.readyText,
    packaging: "crates",
    storageAvailable: false,
    departEarly: true,
    photos: urls,
    vision,
    confidence: {
      crop: ex.confidence.crop,
      quantity: ex.confidence.quantity,
      location: ex.confidence.location,
      overall: Math.round(((ex.confidence.crop + ex.confidence.quantity + ex.confidence.location) / 3) * 100) / 100,
    },
  }
  useApp.getState().setLot(lot)
  useApp.getState().addMsg({ id: uid(), role: "agent", kind: "lot", lot, time: Date.now() })
  useApp.getState().addAudit(
    "Agent",
    `Vision analysis complete — Grade ${vision.grade} estimate, confidence ${(vision.confidence * 100).toFixed(0)}%${vision.source === "gemini" ? " (Gemini)" : " (demo model)"}`,
  )
  await say(
    L(
      useApp.getState().lang,
      `Lot created ✓ — estimated Grade ${vision.grade}, defect rate ~${Math.round(vision.defectRate * 100)}%. This is a visual estimate from photos; final acceptance happens at buyer inspection.`,
      `لوٹ بن گیا ✓ — تخمینی گریڈ ${vision.grade}، خرابی کی شرح ~${Math.round(vision.defectRate * 100)}%۔ یہ تصاویر سے کی گئی تخمینہ ہے؛ حتمی منظوری خریدار کے معائنے پر ہو گی۔`,
    ),
    1200,
  )
  await say(
    L(
      useApp.getState().lang,
      "A few quick questions to price this accurately:",
      "درست قیمت لگانے کے لیے چند سوالات:",
    ),
    900,
  )
  useApp.getState().addMsg({ id: uid(), role: "agent", kind: "clarify", time: Date.now() })
  useApp.getState().setStage("awaiting-clarify")
}

export async function onSkipPhotos() {
  pendingEx = pendingEx ?? (await extractLot("800 kg tomatoes Multan", useApp.getState().lang))
  const ex = pendingEx
  useApp.getState().addMsg(
    agentText(
      L(
        useApp.getState().lang,
        "No problem — I'll estimate from your description only. Confidence will be lower.",
        "کوئی مسئلہ نہیں — میں صرف آپ کی تفصیل سے تخمینہ لگاؤں گا۔ یقین کی سطح کم ہو گی۔",
      ),
    ),
  )
  const lot: Lot = {
    crop: ex.crop,
    quantityKg: ex.quantityKg,
    location: ex.location,
    readyDate: ex.readyText,
    packaging: "crates",
    storageAvailable: false,
    departEarly: true,
    photos: [],
    vision: {
      grade: "B",
      ripeness: "medium",
      defectRate: 0.08,
      notes: ["No photos provided — estimate based on description only"],
      confidence: 0.5,
      source: "demo",
    },
    confidence: {
      crop: ex.confidence.crop,
      quantity: ex.confidence.quantity,
      location: ex.confidence.location,
      overall: 0.6,
    },
  }
  useApp.getState().setLot(lot)
  useApp.getState().addMsg({ id: uid(), role: "agent", kind: "lot", lot, time: Date.now() })
  await say(
    L(
      useApp.getState().lang,
      "A few quick questions to price this accurately:",
      "درست قیمت لگانے کے لیے چند سوالات:",
    ),
    800,
  )
  useApp.getState().addMsg({ id: uid(), role: "agent", kind: "clarify", time: Date.now() })
  useApp.getState().setStage("awaiting-clarify")
}

/* ────────────────────────── clarify → scenarios ────────────────────────── */

export async function onClarifyConfirm(packaging: Packaging, storageAvailable: boolean, departEarly: boolean) {
  const st = useApp.getState()
  if (st.stage !== "awaiting-clarify" || !st.lot) return
  const lot: Lot = { ...st.lot, packaging, storageAvailable, departEarly }
  st.setLot(lot)
  st.setStage("analyzing")
  st.addAudit("You", `Confirmed lot details — ${packaging}, ${storageAvailable ? "storage available" : "no storage"}, ${departEarly ? "early departure" : "late departure"}`)
  await say(
    L(
      useApp.getState().lang,
      "Confirmed ✓ Comparing markets, buyer demand, transport and spoilage…",
      "تصدیق ہو گئی ✓ منڈیاں، خریداروں کی مانگ، ٹرانسپورٹ اور خرابی کا موازنہ کر رہا ہوں…",
    ),
    2900,
    useApp.getState().lang === "ur" ? "منظرناموں کا انجن چل رہا ہے" : "running scenario engine",
  )
  const scenarios = useApp.getState().session?.user?.id
    ? await buildScenariosAsync(lot)
    : buildScenarios(lot)
  st.setScenarios(scenarios)
  useApp.getState().addMsg({
    id: uid(),
    role: "agent",
    kind: "scenarios",
    scenarios,
    recommendedId: scenarios[0].id,
    time: Date.now(),
  })
  useApp.getState().addAudit("Agent", `Generated ${scenarios.length} sale scenarios (market + spoilage + ranking model)`)
  const rec = scenarios[0]
  const local = scenarios.find((s) => s.id === "local")
  const uplift = local ? rec.net - local.net : 0
  await say(
    L(
      useApp.getState().lang,
      `Here are your options. I recommend: ${rec.title.toLowerCase()} — expected net ${pkr(rec.net)}${uplift > 0 ? `, about ${pkr(uplift)} more than selling locally today` : ""}. Spoilage risk ~${Math.round(rec.spoilagePct * 100)}%.`,
      `یہ آپ کے اختیارات ہیں۔ میری سفارش: ${rec.title.toLowerCase()} — متوقع خالص ${pkr(rec.net)}${uplift > 0 ? `، یعنی آج مقامی فروخت سے تقریباً ${pkr(uplift)} زیادہ` : ""}۔ خرابی کا خطرہ ~${Math.round(rec.spoilagePct * 100)}%۔`,
    ),
    1100,
  )
  quick(optionsQuick())
  useApp.getState().setStage("options")
}

/* ────────────────────────── outreach approval ────────────────────────── */

export async function proceedFromOptions() {
  const st = useApp.getState()
  proceedWith(st.scenarios[0]?.id ?? "")
}

export async function proceedWith(scenarioId: string) {
  const st = useApp.getState()
  const rec = st.scenarios.find((s) => s.id === scenarioId) ?? st.scenarios[0]
  if (!rec || !st.lot) return
  if (st.stage !== "options") return
  selectedScenario = rec
  st.setQuick([])
  st.setStage("outreach-approval")
  st.addAudit("You", `Selected option: ${rec.title}`)
  await say(
    L(
      useApp.getState().lang,
      `I'll prepare outreach to ${stripDot(rec.buyerName ?? "the buyer")}. Nothing is sent until you approve it.`,
      `میں ${stripDot(rec.buyerName ?? "خریدار")} سے رابطے کی تیاری کرتا ہوں۔ آپ کی منظوری کے بغیر کچھ نہیں بھیجا جائے گا۔`,
    ),
    1100,
  )
  const isLocal = rec.id === "local"
  const askingPrice = dealPrice(st.lot, rec)
  const lotLine = `${st.lot.quantityKg.toLocaleString()} kg Grade ${st.lot.vision.grade} ${st.lot.crop.toLowerCase()} in ${st.lot.location}`
  const draft = isLocal
    ? `Assalam-o-Alaikum! ${lotLine}, ready ${st.lot.readyDate}, packed in ${st.lot.packaging}. Arriving at ${rec.market} around 7:30 AM — please arrange auction, targeting PKR ${askingPrice}/kg. — Sent via FreshRoute Agent on behalf of the seller`
    : `Assalam-o-Alaikum! I have ${lotLine}, ready ${st.lot.readyDate}, packed in ${st.lot.packaging}. Asking PKR ${askingPrice}/kg. Can you take the full lot? — Sent via FreshRoute Agent on behalf of the seller`
  useApp.getState().addMsg({
    id: uid(),
    role: "agent",
    kind: "approval",
    approval: {
      id: uid(),
      title: isLocal ? `Notify your commission agent at ${rec.market}?` : `Send offer to ${stripDot(rec.buyerName ?? "Buyer")}?`,
      subtitle: `${st.lot.crop} · ${st.lot.quantityKg.toLocaleString()} kg · Grade ${st.lot.vision.grade} · pickup ${st.lot.readyDate} 7:00 AM`,
      actions: [
        {
          label: isLocal ? "Send arrival notice on WhatsApp" : `Send WhatsApp offer to ${stripDot(rec.buyerName ?? "Buyer")}`,
          detail: rec.market,
        },
        {
          label: isLocal ? "Arrange local loading & cartage" : "Request quotes from 3 transporters",
          detail: isLocal ? st.lot.location : `${st.lot.location} → ${rec.market}`,
        },
      ],
      messageDraft: draft,
      recipient: { name: rec.buyerName ?? "Buyer", role: "Verified · " + rec.market },
      status: "pending",
    },
    time: Date.now(),
  })
  useApp.getState().addAudit("Agent", `Drafted buyer outreach to ${rec.buyerName} — awaiting your approval`)
}

export async function onApproveOutreach(approvalId: string, ok: boolean) {
  const st = useApp.getState()
  const msg = st.msgs.find((m) => m.kind === "approval" && m.approval.id === approvalId)
  if (!msg || msg.kind !== "approval" || msg.approval.status !== "pending") return
  if (!ok) {
    st.updateApproval(approvalId, "rejected")
    st.addAudit("You", "Declined buyer outreach — nothing was sent", false)
    await say(
      L(
        useApp.getState().lang,
        "No problem — nothing was sent. Your options stay open.",
        "کوئی بات نہیں — کچھ نہیں بھیجا گیا۔ آپ کے تمام اختیارات موجود ہیں۔",
      ),
      1000,
    )
    quick(optionsQuick())
    st.setStage("options")
    return
  }
  st.updateApproval(approvalId, "approved")
  st.addAudit("You", `Approved outreach to ${msg.approval.recipient.name}`, true)
  st.setStage("outreach")
  const localNotice = msg.approval.title.startsWith("Notify")
  await say(
    L(
      useApp.getState().lang,
      localNotice
        ? `Arrival notice sent to ${stripDot(msg.approval.recipient.name)} on WhatsApp ✓ Arranging cartage and auction…`
        : `Offer sent to ${stripDot(msg.approval.recipient.name)} on WhatsApp ✓ Requesting transport quotes…`,
      localNotice
        ? `${stripDot(msg.approval.recipient.name)} کو واٹس ایپ پر آمد کی اطلاع بھیج دی گئی ✓ گاڑی اور نیلام کا انتظام کر رہا ہوں…`
        : `${stripDot(msg.approval.recipient.name)} کو واٹس ایپ پر پیشکش بھیج دی گئی ✓ ٹرانسپورٹ کے اقتباسات مانگ رہا ہوں…`,
    ),
    1400,
  )
  useApp.getState().addAudit("Agent", `WhatsApp message delivered to ${msg.approval.recipient.name} · read receipt received`)
  await say(
    L(
      useApp.getState().lang,
      localNotice ? "Your commission agent is replying…" : `${stripDot(msg.approval.recipient.name).split(" ")[0]} is typing…`,
      localNotice ? "آپ کا کمیشن ایجنٹ جواب دے رہا ہے…" : `${stripDot(msg.approval.recipient.name).split(" ")[0]} پیغام لکھ رہا ہے…`,
    ),
    2200,
  )
  await offersFlow()
}

async function offersFlow() {
  const st = useApp.getState()
  const rec = selectedScenario ?? st.scenarios[0]
  const lot = st.lot
  if (!rec || !lot) return
  const isLocal = rec.id === "local"
  const premium = rec.id.startsWith("premium-")
  const pricePerKg = dealPrice(lot, rec)
  const acceptedKg = premium ? Math.round(rec.acceptedKg) : lot.quantityKg
  const transport = transportOptions(lot, rec.destCity)
  const transportCost = isLocal
    ? LOCAL_CARTAGE
    : premium
      ? (transport.find((t) => t.transporter.refrigerated) ?? transport[0]).cost
      : (transport.find((t) => t.recommended) ?? transport[0]).cost
  const gross = pricePerKg * acceptedKg
  const fee = isLocal ? 0 : gross * PLATFORM_FEE_RATE
  const commission = isLocal ? gross * MANDI_COMMISSION_RATE : 0
  const storage = rec.id === "store" ? lot.quantityKg * COLD_STORAGE_PER_KG_DAY : 0
  const loading = isLocal ? 0 : LOADING_COST
  const expectedNet = gross - transportCost - fee - commission - storage - loading
  const buyer = BUYERS.find((b) => b.name === rec.buyerName)
  const buyerLine = isLocal
    ? `Auction arranged — targeting PKR ${pricePerKg}/kg at ${rec.market} · cash ${rec.paymentTerms.toLowerCase()}`
    : premium
      ? `Accepted the inspection-passing portion — ~${acceptedKg.toLocaleString()} of ${lot.quantityKg.toLocaleString()} kg at PKR ${pricePerKg}/kg · payment ${rec.paymentTerms}`
      : `Accepted the full ${lot.quantityKg.toLocaleString()} kg at PKR ${pricePerKg}/kg · payment ${rec.paymentTerms}`
  useApp.getState().addMsg({
    id: uid(),
    role: "agent",
    kind: "offers",
    offers: {
      buyerName: stripDot(rec.buyerName ?? "Buyer"),
      buyerLine,
      acceptedPricePerKg: pricePerKg,
      acceptedKg,
      transport: isLocal
        ? [
            {
              transporter: { id: "localcart", name: "Local loader & cartage", vehicle: "Rehri / mini pickup", refrigerated: false, costPerKm: 0, onTimePct: 90 },
              cost: LOCAL_CARTAGE,
              pickup: "7:00 AM",
              eta: "same day",
              recommended: true,
              note: "Mandi is 15 min away",
            },
          ]
        : transport,
      expectedNet,
      netNote: isLocal
        ? "− 6% mandi commission − cartage"
        : storage > 0
          ? "− transport − cold storage − 1.5% fee"
          : "− transport − 1.5% fee",
      buyerAcceptance: buyer?.acceptanceRate ?? 95,
      buyerResponse: buyer?.responseTime ?? "quick response",
    },
    time: Date.now(),
  })
  useApp.getState().addAudit("Agent", `Buyer accepted: ${acceptedKg} kg @ PKR ${pricePerKg}/kg`)
  useApp.getState().addAudit("Agent", "Received transporter quotes")
  useApp.getState().setStage("offers")
}

export async function onApproveFinal(transporterId: string) {
  const st = useApp.getState()
  const lot = st.lot
  const rec = selectedScenario ?? st.scenarios[0]
  const offersMsg = [...st.msgs].reverse().find((m) => m.kind === "offers")
  if (!lot || !rec || !offersMsg || offersMsg.kind !== "offers") return
  const isLocal = rec.id === "local"
  const chosen = offersMsg.offers.transport.find((t) => t.transporter.id === transporterId) ?? offersMsg.offers.transport[0]
  const pricePerKg = offersMsg.offers.acceptedPricePerKg
  const qty = offersMsg.offers.acceptedKg
  const gross = pricePerKg * qty
  const fee = isLocal ? 0 : gross * PLATFORM_FEE_RATE
  const commission = isLocal ? gross * MANDI_COMMISSION_RATE : 0
  const storage = rec.id === "store" ? lot.quantityKg * COLD_STORAGE_PER_KG_DAY : 0
  const loading = isLocal ? 0 : LOADING_COST
  const net = gross - chosen.cost - fee - commission - storage - loading
  // Phase 1.1: Rate limit check for order creation
  const rlUserId = useApp.getState().session?.user?.id
  if (rlUserId) {
    const orderId = "FR-" + Math.floor(2000 + Math.random() * 900)
    const rl = checkOrderAction(orderId)
    if (!rl.allowed) {
      await say("You've reached the order action limit. Please try again later.", 800)
      return
    }
  }

  st.setQuick([])
  st.setStage("tracking")

  const steps = isLocal
    ? [
        { label: "Order confirmed", time: "now", state: "done" as const },
        { label: "Pickup from farm", time: "7:00 AM", state: "active" as const, detail: `${chosen.transporter.name} · ${chosen.transporter.vehicle}` },
        { label: `At ${rec.market}`, time: "ETA 7:30 AM", state: "pending" as const },
        { label: "Auction & weighment", time: "—", state: "pending" as const },
        { label: "Payment recorded", time: "—", state: "pending" as const },
      ]
    : [
        { label: "Order confirmed", time: "now", state: "done" as const },
        { label: "Pickup from farm", time: "7:00 AM", state: "active" as const, detail: `${chosen.transporter.name} · ${chosen.transporter.vehicle}` },
        { label: `In transit — M-3 to ${rec.destCity}`, time: "ETA 2:30 PM", state: "pending" as const },
        { label: "Delivered · buyer inspection", time: "—", state: "pending" as const },
        { label: "Payment recorded", time: "—", state: "pending" as const },
      ]

  const order = {
    id: "FR-" + Math.floor(2000 + Math.random() * 900),
    buyerName: stripDot(rec.buyerName ?? "Buyer"),
    transporterName: chosen.transporter.name,
    vehicle: chosen.transporter.vehicle,
    destination: rec.market,
    quantityKg: qty,
    pricePerKg,
    gross,
    net,
    steps,
  }
  useApp.getState().addMsg({ id: uid(), role: "agent", kind: "order", order, time: Date.now() })
  st.addAudit("You", `Approved sale ${pkr(gross)} & booked ${chosen.transporter.name} (${pkr(chosen.cost)})`, true)
  useApp.getState().addAudit("System", `Order ${order.id} created · booking reference issued`)

  // Persist order to Supabase with state machine initial status
  const orderStatus: OrderStatus = "TRANSPORT_BOOKED"
  orderCurrentStatus.set(order.id, orderStatus)
  const userId = useApp.getState().session?.user?.id
  if (userId) {
    saveOrder({
      id: order.id,
      userId,
      crop: lot.crop,
      quantityKg: qty,
      packaging: lot.packaging,
      grade: lot.vision.grade,
      buyerName: order.buyerName,
      destination: order.destination,
      pricePerKg: order.pricePerKg,
      gross: order.gross,
      net: order.net,
      steps: order.steps,
      paymentTerms: rec.paymentTerms,
    }).catch(() => {})
  }

  await say(
    L(
      useApp.getState().lang,
      `Order ${order.id} confirmed ✓ ${chosen.transporter.name} will arrive 7:00 AM. I'll monitor ${isLocal ? "the auction and payment" : "pickup, transit and delivery"} — you'll get alerts right here.`,
      `آرڈر ${order.id} تصدیق ہو گئی ✓ ${chosen.transporter.name} صبح 7:00 بجے پہنچے گا۔ میں ${isLocal ? "نیلام اور ادائیگی" : "پک اپ، سفر اور ڈیلیوری"} کی نگرانی کروں گا — الرٹس یہیں ملیں گے۔`,
    ),
    1200,
  )
  quick([
    {
      id: "where",
      label: L(useApp.getState().lang, isLocal ? "Where is my lot?" : "Where is my truck?", isLocal ? "میرا مال کہاں ہے؟" : "میری گاڑی کہاں ہے؟"),
      emoji: "🚚",
    },
  ])
}

/* ────────────────────────── freeform chat ────────────────────────── */

function optionsQuick(): QuickReply[] {
  const lang = useApp.getState().lang
  return [
    { id: "proceed", label: L(lang, "Proceed with recommendation", "سفارش پر آگے بڑھیں"), emoji: "✓", primary: true },
    { id: "numbers", label: L(lang, "Show all numbers", "تمام اعداد و شمار دکھائیں") },
    { id: "why", label: L(lang, "Why this buyer?", "یہ خریدار کیوں؟") },
  ]
}

async function chatFlow(text: string) {
  // Phase 1.4: Domain guardrail — deflect off-topic requests
  if (!isDomainAllowed(text)) {
    await say(
      L(
        useApp.getState().lang,
        "I can help with selling produce, finding buyers, transport, storage, pricing and spoilage. Can you tell me more about your produce?",
        "میں فصل بیچنے، خریدار تلاش کرنے، ٹرانسپورٹ، سٹوریج، قیمت اور خرابی میں مدد کر سکتا ہوں۔ کیا آپ اپنی فصل کے بارے میں مزید بتا سکتے ہیں؟",
      ),
      800,
    )
    return
  }

  const st = useApp.getState()
  // Phase 1.3: Sanitize user text before sending to LLM
  const sanitizedText = sanitizeForLLM(text)
  const history = st.msgs
    .filter((m): m is Extract<Msg, { kind: "text" }> => m.kind === "text")
    .map((m) => ({ role: m.role === "user" ? ("user" as const) : ("agent" as const), text: m.text }))
  history.push({ role: "user", text: sanitizedText })
  await say("", 900, "thinking")
  const lotSummary = st.lot
    ? `${st.lot.crop} ${st.lot.quantityKg}kg Grade ${st.lot.vision.grade} in ${st.lot.location}, ready ${st.lot.readyDate}, ${st.lot.packaging}`
    : "no lot yet"
  const scenariosSummary = st.scenarios.length
    ? st.scenarios.map((s) => `${s.title}: net ${Math.round(s.net)} PKR (${s.risk} risk)`).join(" | ")
    : "no scenarios yet"
  const reply = await agentChat(
    history,
    {
      lotSummary,
      scenariosSummary,
      pricesSummary: priceLine(st.lot?.crop ?? "Tomato"),
    },
    useApp.getState().lang,
  )
  await surfaceAiError()
  useApp.getState().addMsg(agentText(reply))
}

/* ────────────────────────── quick replies ────────────────────────── */

export async function showPrices() {
  useApp.getState().addMsg(userText(L(useApp.getState().lang, "Show me today's mandi prices", "آج کی منڈی کی قیمتیں دکھائیں")))
  await say(
    L(
      useApp.getState().lang,
      `Today's tomato prices: ${priceLine("Tomato")}.\n\nEvery price carries a timestamp, source and confidence score — I never use unverified numbers. Karachi looks highest, but from Multan it's ~900 km: transport + spoilage usually erase the gap.`,
      `آج ٹماٹر کی قیمتیں: ${priceLine("Tomato")}۔\n\nہر قیمت کے ساتھ وقت، ذریعہ اور یقین کا اسکور ہے — میں کبھی بغیر تصدیق کے اعداد و شمار استعمال نہیں کرتا۔ کراچی سب سے زیادہ لگتی ہے، مگر ملتان سے یہ ~900 کلومیٹر ہے: ٹرانسپورٹ + خرابی عموماً یہ فرق مٹا دیتی ہے۔`,
    ),
    1400,
  )
  if (useApp.getState().stage === "awaiting-intake") {
    const lang = useApp.getState().lang
    quick([
      { id: "tomatoes", label: L(lang, "I have 800 kg tomatoes in Multan", "میرے پاس ملتان میں 800 کلو ٹماٹر ہیں"), emoji: "🍅", primary: true },
      { id: "voice", label: L(lang, "Send a voice note", "آوازی پیغام بھیجیں"), emoji: "🎤" },
    ])
  }
}

export async function showNumbers() {
  useApp.getState().addMsg(userText(L(useApp.getState().lang, "Show all numbers", "تمام اعداد و شمار دکھائیں")))
  const st = useApp.getState()
  const rec = st.scenarios[0]
  if (!rec) return
  const lines = rec.deductions.map((d) => `− ${d.label}: ${pkr(d.amount)}`).join("\n")
  await say(
    L(
      useApp.getState().lang,
      `${rec.title} — full breakdown:\n\nGross (after expected loss): ${pkr(rec.gross)}\n${lines}\n═ Net to you: ${pkr(rec.net)}\n\nAccepted quantity estimate: ${Math.round(rec.acceptedKg)} kg of ${st.lot?.quantityKg.toLocaleString()} kg.`,
      `${rec.title} — مکمل تفصیل:\n\nمجموعی (متوقع نقصان کے بعد): ${pkr(rec.gross)}\n${lines}\n═ آپ کو خالص: ${pkr(rec.net)}\n\nمنظور مقدار کا تخمینہ: ${st.lot?.quantityKg.toLocaleString()} kg میں سے ${Math.round(rec.acceptedKg)} kg۔`,
    ),
    1300,
  )
}

export async function whyBuyer() {
  useApp.getState().addMsg(userText(L(useApp.getState().lang, "Why this buyer?", "یہ خریدار کیوں؟")))
  await chatFlow(useApp.getState().lang === "ur" ? "Why do you recommend this buyer? (answer in Urdu)" : "Why do you recommend this buyer?")
}

export async function truckStatus() {
  const lang = useApp.getState().lang
  useApp.getState().addMsg(
    userText(
      L(lang, selectedScenario?.id === "local" ? "Where is my lot?" : "Where is my truck?", selectedScenario?.id === "local" ? "میرا مال کہاں ہے؟" : "میری گاڑی کہاں ہے؟"),
    ),
  )
  const st = useApp.getState()
  if (st.stage === "tracking") {
    if (selectedScenario?.id === "local") {
      await say(
        L(
          lang,
          `Your lot is at ${selectedScenario.market} — it's in the auction queue after a heavy arrival day, expected sale by ~11:35 AM. Cash will be recorded the same day.`,
          `آپ کا مال ${selectedScenario.market} میں ہے — آمد زیادہ ہونے کے بعد نیلام کی قطار میں ہے، متوقع فروخت ~11:35 AM تک۔ نقدی اسی دن ریکارڈ ہو جائے گی۔`,
        ),
        1300,
      )
    } else {
      await say(
        L(
          lang,
          "Your truck is on the M-3 near Sheikhupura — about 63 km from Lahore. Current ETA 3:10 PM. The delay alert was already sent to the buyer, who confirmed the window is fine.",
          "آپ کی گاڑی M-3 پر شیخوپورہ کے قریب ہے — لاہور سے تقریباً 63 کلومیٹر۔ موجودہ ETA 3:10 PM۔ تاخیر کی اطلاع خریدار کو بھیج دی گئی ہے، جس نے تصدیق کی ہے کہ وقت درست ہے۔",
        ),
        1300,
      )
    }
  } else {
    await say(
      L(
        lang,
        "No active delivery right now. Once a booking is confirmed, I track pickup and transit here.",
        "اس وقت کوئی ڈیلیوری جاری نہیں۔ بکنگ کی تصدیق کے بعد میں پک اپ اور سفر کی نگرانی یہیں کرتا ہوں۔",
      ),
      1100,
    )
  }
}

export async function feedbackGreat() {
  useApp.getState().addMsg(userText(L(useApp.getState().lang, "Great 😊", "بہت خوب 😊")))
  useApp.getState().addAudit("You", "Rated experience: positive")
  await say(
    L(
      useApp.getState().lang,
      "Shukriya! 🌱 Your completed sale also feeds the price and reliability data that makes the next farmer's recommendation better. Send me your next lot anytime.",
      "شکریہ! 🌱 آپ کی مکمل فروخت قیمتیں اور قابلِ اعتماد ڈیٹا میں شامل ہوتی ہے جو اگلے کسان کی سفارش کو بہتر بناتی ہے۔ اپنا اگلا مال کسی بھی وقت بھیجیں۔",
    ),
    1200,
  )
}

export async function newLot() {
  useApp.getState().setLot(null)
  useApp.getState().setScenarios([])
  pendingEx = null
  selectedScenario = null
  const lang = useApp.getState().lang
  await say(L(lang, "Ready for your next lot — tell me what you have.", "اگلے مال کے لیے تیار ہوں — بتائیں آپ کے پاس کیا ہے۔"), 900)
  quick([
    { id: "tomatoes", label: L(lang, "I have 800 kg tomatoes in Multan", "میرے پاس ملتان میں 800 کلو ٹماٹر ہیں"), emoji: "🍅", primary: true },
    { id: "prices", label: L(lang, "Show mandi prices", "منڈی کی قیمتیں دکھائیں"), emoji: "📊" },
  ])
  useApp.getState().setStage("awaiting-intake")
}

export async function onQuickReply(id: string) {
  switch (id) {
    case "tomatoes":
      await onUserText("I have 800 kg tomatoes in Multan, ready tomorrow")
      break
    case "voice":
      await onVoiceNote()
      break
    case "prices":
      await showPrices()
      break
    case "attach":
      useApp.getState().setSheet("photos")
      break
    case "skip":
      await onSkipPhotos()
      break
    case "proceed":
      await proceedFromOptions()
      break
    case "numbers":
      await showNumbers()
      break
    case "why":
      await whyBuyer()
      break
    case "where":
      await truckStatus()
      break
    case "great":
      await feedbackGreat()
      break
    case "newlot":
      await newLot()
      break
  }
}

export function geminiLive(): boolean {
  return useApp.getState().aiMode === "live"
}

/** Ask the server whether real AI is active; updates the mode badge everywhere. */
export async function refreshAiMode() {
  useApp.getState().setAiMode("checking")
  const status = await checkAiStatus()
  useApp.getState().setAiMode(status.mode, status.error)
}
