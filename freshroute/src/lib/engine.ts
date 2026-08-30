import {
  BUYERS,
  CITY_DISTANCES_KM,
  CROP_PRICES,
  CROP_VOLATILITY,
  TRANSPORTERS,
} from "@/data/market"
import type { Deduction, Lot, Scenario, TransportOption } from "@/types"

export const MANDI_COMMISSION_RATE = 0.06
export const PLATFORM_FEE_RATE = 0.015
export const LOADING_COST = 800
export const LOCAL_CARTAGE = 1200
export const COLD_STORAGE_PER_KG_DAY = 3.5

/** Direct-buyer deals price below the A-grade mandi rate (Grade B ≈ −12.5%, C ≈ −25%) */
export function gradePriceFactor(grade: string): number {
  if (grade === "A") return 1
  if (grade === "C") return 0.75
  return 0.875
}

function packagingFactor(p: Lot["packaging"]): number {
  if (p === "crates") return 1.0
  if (p === "sacks") return 1.5
  return 2.2
}

/** Rule-based spoilage model (PRD §17.4) — transparent, explainable */
function spoilagePct(lot: Lot, baseDailyExposure: number, refrigerated = false): number {
  const vol = CROP_VOLATILITY[lot.crop] ?? 0.8
  let pct = baseDailyExposure * vol * packagingFactor(lot.packaging)
  if (lot.vision.ripeness.includes("high")) pct *= 1.15
  if (refrigerated) pct *= 0.45
  return Math.min(0.45, pct)
}

function scoreOf(net: number, maxNet: number, acceptance: number, riskPenalty: number): number {
  return (
    0.4 * (net / maxNet) +
    0.15 * (acceptance / 100) +
    0.15 * 0.9 -
    riskPenalty
  )
}

export function buildScenarios(lot: Lot): Scenario[] {
  const prices = CROP_PRICES[lot.crop] ?? CROP_PRICES.Tomato
  const vol = CROP_VOLATILITY[lot.crop] ?? 0.8
  const scenarios: Scenario[] = []

  // ── A: Sell today at local mandi ─────────────────────────────
  {
    const price = prices[lot.location] ?? prices.Multan
    const loss = spoilagePct(lot, 0.03)
    const acceptedKg = lot.quantityKg * (1 - loss)
    const gross = price * acceptedKg
    const deductions: Deduction[] = [
      { label: `Mandi commission (${(MANDI_COMMISSION_RATE * 100).toFixed(0)}%)`, amount: gross * MANDI_COMMISSION_RATE },
      { label: "Loading & local cartage", amount: LOCAL_CARTAGE },
    ]
    const net = gross - deductions.reduce((s, d) => s + d.amount, 0)
    scenarios.push({
      id: "local",
      title: "Sell today — local mandi",
      market: `${lot.location} Sabzi Mandi`,
      destCity: lot.location,
      buyerName: "Commission agent (local)",
      gross,
      acceptedKg,
      deductions,
      net,
      spoilagePct: loss,
      risk: vol > 1.2 ? "Low" : "Low",
      paymentTerms: "Same day",
      why: [
        "Cash in hand today, no transport dependency",
        "Mandi commission applies but no travel risk",
        "Local price is the lowest of the 5 markets today",
      ],
      recommended: false,
      score: 0,
    })
  }

  // ── B: Direct wholesale buyer in best nearby city ───────────
  const directBuyers = BUYERS.filter(
    (b) =>
      b.city !== lot.location &&
      (b.grade === "any" || b.grade <= lot.vision.grade) &&
      lot.quantityKg >= b.minKg &&
      lot.quantityKg <= b.maxKg &&
      b.premiumPct === 0,
  )
  for (const b of directBuyers) {
    const dist = CITY_DISTANCES_KM[lot.location]?.[b.city] ?? 400
    const hours = Math.round(3 + dist / 55)
    const transitDays = dist > 800 ? 2 : 1
    const openTruck = TRANSPORTERS[0]
    const transport = openTruck.costPerKm * dist
    const loss = spoilagePct(lot, transitDays === 2 ? 0.14 : 0.08)
    const rejection = b.rejectionPct
    const acceptedKg = lot.quantityKg * (1 - loss - rejection)
    const price = (prices[b.city] ?? prices.Lahore) * gradePriceFactor(lot.vision.grade)
    const gross = price * acceptedKg
    const deductions: Deduction[] = [
      { label: `Transport (${openTruck.vehicle.split("·")[0].trim()}, ${dist} km)`, amount: transport },
      { label: "Platform fee (1.5%)", amount: gross * PLATFORM_FEE_RATE },
      { label: "Loading", amount: LOADING_COST },
    ]
    const net = gross - deductions.reduce((s, d) => s + d.amount, 0)
    scenarios.push({
      id: `direct-${b.id}`,
      title: `Sell ${transitDays === 2 ? "day after tomorrow" : "tomorrow"} — ${b.city} buyer`,
      market: b.city,
      destCity: b.city,
      buyerName: b.name,
      gross,
      acceptedKg,
      deductions,
      net,
      spoilagePct: loss,
      risk: transitDays === 2 ? "Medium" : "Medium",
      paymentTerms: b.paymentTerms,
      why: [
        `${b.city} price is ${Math.round(((prices[b.city] / prices[lot.location]) - 1) * 100)}% above ${lot.location}`,
        `${b.name} accepts Grade ${b.grade === "any" ? "B" : b.grade} and can take the full lot`,
        `Accepts ${b.acceptanceRate}% of historical offers · responds ${b.responseTime}`,
        `~${hours} hr route — refrigerated truck not essential if dispatched before 9 AM in crates`,
      ],
      recommended: false,
      score: 0,
    })
  }

  // ── C: Cold store 1 day, then sell to best buyer ────────────
  {
    const bestDirect = scenarios.filter((s) => s.id.startsWith("direct-")).sort((a, b) => b.net - a.net)[0]
    if (bestDirect) {
      const b = BUYERS.find((x) => x.name === bestDirect.buyerName)!
      const dist = CITY_DISTANCES_KM[lot.location]?.[b.city] ?? 400
      const openTruck = TRANSPORTERS[0]
      const transport = openTruck.costPerKm * dist
      const loss = spoilagePct(lot, 0.05)
      const rejection = b.rejectionPct
      const acceptedKg = lot.quantityKg * (1 - loss - rejection)
      const price = (prices[b.city] ?? prices.Lahore) * gradePriceFactor(lot.vision.grade) // storage does not guarantee higher price
      const gross = price * acceptedKg
      const storageCost = lot.quantityKg * COLD_STORAGE_PER_KG_DAY
      const deductions: Deduction[] = [
        { label: `Transport (${dist} km)`, amount: transport },
        { label: `Cold storage 1 day (PKR ${COLD_STORAGE_PER_KG_DAY}/kg)`, amount: storageCost },
        { label: "Platform fee (1.5%)", amount: gross * PLATFORM_FEE_RATE },
        { label: "Loading", amount: LOADING_COST },
      ]
      const net = gross - deductions.reduce((s, d) => s + d.amount, 0)
      scenarios.push({
        id: "store",
        title: "Cold store 1 day, then sell",
        market: `${lot.location} Cold Hub → ${b.city}`,
        destCity: b.city,
        buyerName: b.name,
        gross,
        acceptedKg,
        deductions,
        net,
        spoilagePct: loss,
        risk: "Medium",
        paymentTerms: b.paymentTerms,
        why: [
          "Cold storage cuts spoilage to ~" + Math.round(loss * 100) + "% but adds PKR 3.5/kg/day",
          "Tomorrow's price is not guaranteed — no confirmed uptrend today",
          "Worth it only if you expect a sharp price rise",
        ],
        recommended: false,
        score: 0,
      })
    }
  }

  // ── D: Premium Grade-A buyer (if lot is B — shows rejection risk) ──
  {
    const premium = BUYERS.find((x) => x.premiumPct > 0 && x.city !== lot.location)
    if (premium) {
      const dist = CITY_DISTANCES_KM[lot.location]?.[premium.city] ?? 400
      const reefer = TRANSPORTERS.find((t) => t.refrigerated)!
      const transport = reefer.costPerKm * dist
      const loss = spoilagePct(lot, 0.08, true)
      const rejection = premium.rejectionPct
      const acceptedKg = lot.quantityKg * (1 - loss - rejection)
      const price = (prices[premium.city] ?? 88) * (1 + premium.premiumPct / 100)
      const gross = price * acceptedKg
      const deductions: Deduction[] = [
        { label: `Refrigerated transport (${dist} km)`, amount: transport },
        { label: "Platform fee (1.5%)", amount: gross * PLATFORM_FEE_RATE },
        { label: "Loading", amount: LOADING_COST },
      ]
      const net = gross - deductions.reduce((s, d) => s + d.amount, 0)
      const gradeGap = premium.grade !== "any" && premium.grade < lot.vision.grade
      scenarios.push({
        id: `premium-${premium.id}`,
        title: `Premium buyer — ${premium.city} retail`,
        market: premium.city,
        destCity: premium.city,
        buyerName: premium.name,
        gross,
        acceptedKg,
        deductions,
        net,
        spoilagePct: loss,
        risk: "Medium-High",
        paymentTerms: premium.paymentTerms,
        why: [
          `Pays ${premium.premiumPct}% above mandi price — but accepts Grade ${premium.grade} only`,
          gradeGap
            ? `Your lot is estimated Grade ${lot.vision.grade} — risk of ~${Math.round(rejection * 100)}% rejection on inspection`
            : "Strict quality inspection at delivery",
          `Refrigerated transport required: PKR ${Math.round(transport).toLocaleString()}`,
        ],
        recommended: false,
        score: 0,
      })
    }
  }

  // Score & rank (PRD §11.3 weighted function)
  const maxNet = Math.max(...scenarios.map((s) => s.net))
  for (const s of scenarios) {
    const buyer = BUYERS.find((b) => b.name === s.buyerName)
    const riskPenalty = s.risk === "Medium" ? 0.08 : s.risk === "Medium-High" ? 0.18 : 0
    s.score = scoreOf(s.net, maxNet, buyer?.acceptanceRate ?? 95, riskPenalty)
  }
  scenarios.sort((a, b) => b.score - a.score)
  scenarios[0].recommended = true
  return scenarios
}

export function transportOptions(lot: Lot, destCity: string): TransportOption[] {
  const dist = CITY_DISTANCES_KM[lot.location]?.[destCity] ?? 350
  const hours = Math.round(2 + dist / 60)
  return TRANSPORTERS.map((t) => {
    const cost = t.costPerKm * dist
    const recommended = !t.refrigerated && t.id === "rana"
    return {
      transporter: t,
      cost,
      pickup: "7:00 AM",
      eta: `~${hours} hr${t.refrigerated ? " (+1 hr loading)" : ""}`,
      recommended,
      note: t.refrigerated
        ? "Cold chain — safest for soft produce"
        : recommended
          ? "Best value — covered body protects from sun"
          : "Cheapest — open body, shade risk in afternoon heat",
    }
  })
}
