/**
 * Spoilage Risk Engine (Task 4)
 *
 * Implements the exponential decay model from the spec:
 *   lossPct = 1 - exp(-base_decay_rate * hours * temp_multiplier * handling_multiplier * transport_multiplier)
 *
 * Uses PERISHABILITY_PROFILES and MODE_FACTORS from market.ts.
 */
import { CROP_VOLATILITY, MODE_FACTORS, PERISHABILITY_PROFILES } from "@/data/market"

export interface SpoilageInput {
  commodity: string
  harvestDate: string
  expectedWaitHours: number
  transportMode: "refrigerated" | "ambient" | "none"
  storageConditions?: { tempC: number; humidityPct: number }
  weatherForecast?: { tempC: number }
  handlingEvents: number // number of transfers / handlings
}

export interface SpoilageResult {
  riskScore: "Low" | "Medium" | "High"
  expectedLossPct: number
  contributingFactors: Record<string, number>
  recommendedActionWindowHours: number
}

/**
 * Compute temperature deviation multiplier.
 * If storage/weather temp is outside ideal range, each degree outside adds 5% decay.
 */
function tempMultiplier(actualTempC: number, idealRange: { min: number; max: number }): number {
  if (actualTempC >= idealRange.min && actualTempC <= idealRange.max) return 1.0
  const deviation = actualTempC < idealRange.min
    ? idealRange.min - actualTempC
    : actualTempC - idealRange.max
  return 1.0 + deviation * 0.05
}

/**
 * Handling multiplier — each transfer/handling event adds ~3% damage risk.
 */
function handlingMultiplier(handlingEvents: number): number {
  return Math.pow(1.03, handlingEvents)
}

/**
 * Core exponential decay spoilage model.
 */
export function calculateSpoilage(input: SpoilageInput): SpoilageResult {
  const profile = PERISHABILITY_PROFILES[input.commodity]
  const baseDecayRate = profile?.decayRatePerHour ?? 0.005
  const idealTempRange = profile?.idealTempRange ?? { min: 5, max: 15 }

  // Transport mode factor
  const transportFactor = MODE_FACTORS[input.transportMode] ?? 1.8

  // Temperature factor (from storage conditions or weather)
  const effectiveTemp = input.storageConditions?.tempC ?? input.weatherForecast?.tempC ?? 35
  const tFactor = input.transportMode === "refrigerated"
    ? 1.0 // refrigerated assumes ideal temp
    : tempMultiplier(effectiveTemp, idealTempRange)

  // Handling factor
  const hFactor = handlingMultiplier(input.handlingEvents)

  // Exponential decay formula: 1 - exp(-rate * time * multipliers)
  const rawLoss = 1 - Math.exp(-baseDecayRate * input.expectedWaitHours * tFactor * hFactor * transportFactor)
  const expectedLossPct = Math.min(0.50, rawLoss) // Cap at 50%

  // Contributing factors breakdown
  const contributingFactors: Record<string, number> = {
    baseDecay: baseDecayRate * input.expectedWaitHours,
    temp: tFactor,
    handling: hFactor,
    transport: transportFactor,
  }

  // Volatility adjustment (using CROP_VOLATILITY as a relative factor)
  const volatility = CROP_VOLATILITY[input.commodity] ?? 0.8
  const adjustedLoss = Math.min(0.50, expectedLossPct * volatility)

  // Risk classification
  const riskScore: SpoilageResult["riskScore"] =
    adjustedLoss < 0.08 ? "Low" :
    adjustedLoss < 0.18 ? "Medium" : "High"

  // Recommended action window: hours until loss crosses 10%
  // 0.10 = 1 - exp(-rate * t * factors) → t = -ln(0.90) / (rate * factors)
  const combinedRate = baseDecayRate * tFactor * hFactor * transportFactor * volatility
  const actionWindow = combinedRate > 0
    ? Math.round(-Math.log(1 - 0.10) / combinedRate)
    : 48

  return {
    riskScore,
    expectedLossPct: Math.round(adjustedLoss * 1000) / 1000,
    contributingFactors,
    recommendedActionWindowHours: Math.min(actionWindow, 72),
  }
}
