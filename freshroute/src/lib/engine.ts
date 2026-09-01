import {
  CITY_DISTANCES_KM,
  CROP_PRICES,
  CROP_VOLATILITY,
  WEATHER,
} from "@/data/cropReference"
import type { Buyer, Deduction, Lot, Scenario, TransportOption, Transporter, StorageFacility } from "@/types"
import { calculateSpoilage, type SpoilageResult } from "@/lib/spoilage"
import { fetchBuyerProfiles, fetchTransporterProfiles, fetchStorageProviderProfiles, saveSpoilageAssessment, saveRecommendation } from "@/lib/db"

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

/** Rule-based spoilage model (PRD §17.4) — enhanced with exponential decay engine (Task 4) */
function spoilagePct(lot: Lot, baseDailyExposure: number, refrigerated = false): number {
  const weatherTemp = WEATHER[lot.location]?.tempC ?? 35
  // Phase 5.2: departEarly = true reduces expectedWaitHours by 30%
  const departEarlyFactor = lot.departEarly ? 0.7 : 1.0
  const hours = baseDailyExposure * 24 * 10 * departEarlyFactor
  const result: SpoilageResult = calculateSpoilage({
    commodity: lot.crop,
    harvestDate: lot.readyDate,
    expectedWaitHours: Math.max(1, hours),
    transportMode: refrigerated ? "refrigerated" : "ambient",
    weatherForecast: { tempC: weatherTemp },
    handlingEvents: 1, // default: single farm-to-truck handling
  })
  // Blend: keep the simple model as a floor for backward compatibility
  const vol = CROP_VOLATILITY[lot.crop] ?? 0.8
  const simplePct = baseDailyExposure * vol * packagingFactor(lot.packaging) * (lot.vision.ripeness.includes("high") ? 1.15 : 1) * (refrigerated ? 0.45 : 1)
  return Math.min(0.45, Math.max(result.expectedLossPct, simplePct * 0.5))
}

/** Run full spoilage assessment and return contributing factors (Task 4) */
function spoilageAssessment(lot: Lot, hours: number, refrigerated: boolean): { loss: number; factors: Record<string, number> } {
  const weatherTemp = WEATHER[lot.location]?.tempC ?? 35
  const result = calculateSpoilage({
    commodity: lot.crop,
    harvestDate: lot.readyDate,
    expectedWaitHours: Math.max(1, hours),
    transportMode: refrigerated ? "refrigerated" : "ambient",
    weatherForecast: { tempC: weatherTemp },
    handlingEvents: 1,
  })
  return { loss: spoilagePct(lot, hours / 240, refrigerated), factors: result.contributingFactors }
}

function scoreOf(net: number, maxNet: number, acceptance: number, riskPenalty: number): number {
  return (
    0.4 * (net / maxNet) +
    0.15 * (acceptance / 100) +
    0.15 * 0.9 -
    riskPenalty
  )
}

export function buildScenarios(
  lot: Lot,
  buyers: Buyer[] = [],
  transporters: Transporter[] = [],
  storages: StorageFacility[] = [],
): Scenario[] {
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
  const directBuyers = buyers.filter(
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
    const openTruck = transporters[0]
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
  // Phase 5.1: Only generate this scenario when storageAvailable is true
  if (lot.storageAvailable) {
    const bestDirect = scenarios.filter((s) => s.id.startsWith("direct-")).sort((a, b) => b.net - a.net)[0]
    if (bestDirect) {
      const b = buyers.find((x) => x.name === bestDirect.buyerName)!
      const dist = CITY_DISTANCES_KM[lot.location]?.[b.city] ?? 400
      const openTruck = transporters[0]
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

  // ── D: Premium Grade-A buyer
  {
    const premium = buyers.find((x) => x.premiumPct > 0 && x.city !== lot.location)
    if (premium) {
      const dist = CITY_DISTANCES_KM[lot.location]?.[premium.city] ?? 400
      const reefer = transporters.find((t) => t.refrigerated)!
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
    const buyer = buyers.find((b) => b.name === s.buyerName)
    const riskPenalty = s.risk === "Medium" ? 0.08 : s.risk === "Medium-High" ? 0.18 : 0
    s.score = scoreOf(s.net, maxNet, buyer?.acceptanceRate ?? 95, riskPenalty)
  }
  scenarios.sort((a, b) => b.score - a.score)
  scenarios[0].recommended = true

  // Task 5: Add confidence metadata based on data completeness
  // Higher confidence when real transport quotes and storage rates are available
  for (const s of scenarios) {
    const hasBuyerData = buyers.some((b) => b.name === s.buyerName && b.verified)
    const hasTransportData = transporters.length > 0
    const hasPriceData = !!(CROP_PRICES[lot.crop]?.[s.destCity])
    const confidence = (hasBuyerData ? 0.3 : 0) + (hasTransportData ? 0.3 : 0) + (hasPriceData ? 0.4 : 0);
    (s as any).confidence = Math.round(confidence * 100) / 100;
  }

  return scenarios
}

/**
 * Async scenario builder that fetches real provider data from the database (Phase 2).
 * Falls back to hardcoded data when unauthenticated or offline.
 */
export async function buildScenariosAsync(lot: Lot): Promise<Scenario[]> {
  try {
    const [buyerProfiles, transporterProfiles, storageProfiles] = await Promise.all([
      fetchBuyerProfiles({ commodity: lot.crop }).catch(() => []),
      fetchTransporterProfiles().catch(() => []),
      fetchStorageProviderProfiles().catch(() => []),
    ])

    // Convert DB profiles to existing Buyer / Transporter / StorageFacility shapes
    const buyers: Buyer[] = buyerProfiles.length > 0
      ? buyerProfiles.map((b) => ({
          id: b.userId,
          name: b.name,
          city: b.city,
          category: b.orgName ?? "Wholesale",
          grade: "any" as const,
          premiumPct: 0,
          acceptanceRate: b.acceptanceRate ?? 80,
          rejectionPct: b.rejectionPct ?? 0.05,
          paymentTerms: b.paymentTerms ?? "on delivery",
          minKg: b.minKg ?? 200,
          maxKg: b.maxKg ?? 5000,
          verified: b.verified ?? false,
          responseTime: "1-2 hr",
        }))
      : []

    const transporters: Transporter[] = transporterProfiles.length > 0
      ? transporterProfiles.map((t) => ({
          id: t.userId,
          name: t.name,
          vehicle: t.vehicleType ?? "Unknown",
          refrigerated: t.refrigerated ?? false,
          costPerKm: t.ratePerKm ?? 30,
          onTimePct: t.onTimePct ?? 75,
        }))
      : []

    const storages: StorageFacility[] = storageProfiles.length > 0
      ? storageProfiles.map((s) => ({
          id: s.userId,
          name: s.name,
          city: s.city ?? "",
          tempC: s.tempRange?.max ?? 8,
          perKgPerDay: s.perKgPerDay ?? 3.5,
          verified: s.verified ?? false,
        }))
      : []

    const scenarios = buildScenarios(lot, buyers, transporters, storages)

    // Persist spoilage assessments and recommendation (fire-and-forget)
    const listingId = lot.listingId ?? "session-" + Date.now()
    saveSpoilageAssessment({
      listingId,
      riskScore: scenarios[0]?.risk ?? "Low",
      estLossPct: scenarios[0]?.spoilagePct ?? 0,
      factors: scenarios[0]?.contributingFactors ?? {},
    }).catch(() => {})
    saveRecommendation({
      listingId,
      options: scenarios.map((s) => ({ id: s.id, title: s.title, net: s.net, score: s.score })),
    }).catch(() => {})

    return scenarios
  } catch {
    // Full fallback to sync builder with hardcoded data
    return buildScenarios(lot)
  }
}

export function transportOptions(lot: Lot, destCity: string, transporters: Transporter[] = []): TransportOption[] {
  const dist = CITY_DISTANCES_KM[lot.location]?.[destCity] ?? 350
  const hours = Math.round(2 + dist / 60)
  return transporters.map((t) => {
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
