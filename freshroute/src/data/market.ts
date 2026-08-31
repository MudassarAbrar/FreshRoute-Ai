import type { Buyer, PricePoint, StorageFacility, Transporter } from "@/types"

export const MAUND_KG = 37.32

export const CITY_DISTANCES_KM: Record<string, Record<string, number>> = {
  Multan: { Multan: 15, Lahore: 350, Faisalabad: 250, Islamabad: 340, Karachi: 900 },
  Lahore: { Lahore: 15, Multan: 350, Faisalabad: 180, Islamabad: 375, Karachi: 1_210 },
  Faisalabad: { Faisalabad: 15, Multan: 250, Lahore: 180, Islamabad: 300, Karachi: 1_100 },
  Islamabad: { Islamabad: 15, Multan: 340, Lahore: 375, Faisalabad: 300, Karachi: 1_400 },
  Karachi: { Karachi: 15, Multan: 900, Lahore: 1_210, Faisalabad: 1_100, Islamabad: 1_400 },
}

/** Wholesale PKR/kg by crop × city — simulated live mandi feed (Aug 2026) */
export const CROP_PRICES: Record<string, Record<string, number>> = {
  Tomato: { Multan: 62, Lahore: 96, Faisalabad: 70, Islamabad: 84, Karachi: 105 },
  Potato: { Multan: 55, Lahore: 65, Faisalabad: 58, Islamabad: 63, Karachi: 75 },
  Onion: { Multan: 48, Lahore: 58, Faisalabad: 52, Islamabad: 56, Karachi: 68 },
  Mango: { Multan: 120, Lahore: 145, Faisalabad: 128, Islamabad: 138, Karachi: 168 },
  Kinnow: { Multan: 85, Lahore: 105, Faisalabad: 90, Islamabad: 98, Karachi: 120 },
  Banana: { Multan: 110, Lahore: 130, Faisalabad: 118, Islamabad: 125, Karachi: 145 },
  "Green Chili": { Multan: 140, Lahore: 175, Faisalabad: 155, Islamabad: 168, Karachi: 210 },
  Okra: { Multan: 95, Lahore: 118, Faisalabad: 104, Islamabad: 112, Karachi: 138 },
  "Leafy Vegetables": { Multan: 60, Lahore: 78, Faisalabad: 66, Islamabad: 74, Karachi: 92 },
}

export const CROP_ALIASES: Record<string, string> = {
  tomato: "Tomato",
  tomatoes: "Tomato",
  tamatar: "Tomato",
  ٹماٹر: "Tomato",
  potato: "Potato",
  potatoes: "Potato",
  aloo: "Potato",
  آلو: "Potato",
  onion: "Onion",
  onions: "Onion",
  pyaaz: "Onion",
  پیاز: "Onion",
  mango: "Mango",
  mangoes: "Mango",
  aam: "Mango",
  آم: "Mango",
  kinnow: "Kinnow",
  banana: "Banana",
  bananas: "Banana",
  chili: "Green Chili",
  chilli: "Green Chili",
  "green chili": "Green Chili",
  "green chilli": "Green Chili",
  mirch: "Green Chili",
  okra: "Okra",
  bhindi: "Okra",
  بھنڈی: "Okra",
  leafy: "Leafy Vegetables",
  spinach: "Leafy Vegetables",
  palak: "Leafy Vegetables",
}

/** Relative perishability vs tomato (=1.0) — drives spoilage estimates */
export const CROP_VOLATILITY: Record<string, number> = {
  Tomato: 1.0,
  Potato: 0.25,
  Onion: 0.3,
  Mango: 0.85,
  Kinnow: 0.4,
  Banana: 1.1,
  "Green Chili": 0.9,
  Okra: 0.95,
  "Leafy Vegetables": 1.6,
}

export const BUYERS: Buyer[] = [
  {
    id: "alkaram",
    name: "Al-Karam Wholesale Co.",
    city: "Lahore",
    category: "Wholesale · Sabzi Mandi",
    grade: "B",
    premiumPct: 0,
    acceptanceRate: 82,
    rejectionPct: 0.04,
    paymentTerms: "2–3 days",
    minKg: 200,
    maxKg: 5000,
    verified: true,
    responseTime: "usually < 1 hr",
  },
  {
    id: "metrofresh",
    name: "Metro Fresh Retail",
    city: "Lahore",
    category: "Retail chain · Grade A only",
    grade: "A",
    premiumPct: 20,
    acceptanceRate: 65,
    rejectionPct: 0.18,
    paymentTerms: "7 days",
    minKg: 300,
    maxKg: 3000,
    verified: true,
    responseTime: "same day",
  },
  {
    id: "chenab",
    name: "Chenab Traders",
    city: "Faisalabad",
    category: "Wholesale",
    grade: "B",
    premiumPct: 0,
    acceptanceRate: 78,
    rejectionPct: 0.05,
    paymentTerms: "3–4 days",
    minKg: 150,
    maxKg: 4000,
    verified: true,
    responseTime: "usually < 2 hr",
  },
  {
    id: "karachi-dealer",
    name: "Empress Market Dealer",
    city: "Karachi",
    category: "Wholesale · any grade",
    grade: "any",
    premiumPct: 0,
    acceptanceRate: 80,
    rejectionPct: 0.04,
    paymentTerms: "on delivery",
    minKg: 500,
    maxKg: 10000,
    verified: true,
    responseTime: "1–2 hr",
  },
]

export const TRANSPORTERS: Transporter[] = [
  {
    id: "malik",
    name: "Malik Transport",
    vehicle: "Open Mazda · 1.5 t",
    refrigerated: false,
    costPerKm: 26,
    onTimePct: 78,
  },
  {
    id: "rana",
    name: "Rana Goods Carrier",
    vehicle: "Covered Mazda · 2 t",
    refrigerated: false,
    costPerKm: 31,
    onTimePct: 85,
  },
  {
    id: "rapidcold",
    name: "RapidCold Logistics",
    vehicle: "Refrigerated Shehzore · 1 t",
    refrigerated: true,
    costPerKm: 47,
    onTimePct: 92,
  },
]

export const STORAGES: StorageFacility[] = [
  {
    id: "multancoldhub",
    name: "Multan Cold Hub",
    city: "Multan",
    tempC: 4,
    perKgPerDay: 3.5,
    verified: true,
  },
]

export function tickerPrices(crop: string): PricePoint[] {
  const table = CROP_PRICES[crop] ?? CROP_PRICES.Tomato
  return Object.entries(table).map(([city, pricePerKg]) => ({
    city,
    pricePerKg,
    trend: city === "Karachi" ? -2 : city === "Lahore" ? 4 : 1,
    freshnessMin: 45 + Math.round(Math.random() * 60),
    confidence: 0.78 + Math.random() * 0.15,
  }))
}

export const WEATHER = {
  Multan: { tempC: 38, condition: "Clear · hot afternoon" },
  Lahore: { tempC: 34, condition: "Partly cloudy" },
}

/* ──────────────────── Task 4: Perishability Profiles ──────────────────── */

export interface PerishabilityProfile {
  /** Base decay rate per hour (used in exponential decay formula) */
  decayRatePerHour: number
  /** Ideal temperature range in Celsius */
  idealTempRange: { min: number; max: number }
  /** Ideal humidity range in percent */
  idealHumidityRange: { min: number; max: number }
}

/** Perishability profiles per crop — base for spoilage engine (Task 4) */
export const PERISHABILITY_PROFILES: Record<string, PerishabilityProfile> = {
  Tomato:            { decayRatePerHour: 0.008, idealTempRange: { min: 10, max: 15 }, idealHumidityRange: { min: 85, max: 95 } },
  Potato:            { decayRatePerHour: 0.002, idealTempRange: { min: 7, max: 10 },  idealHumidityRange: { min: 90, max: 95 } },
  Onion:             { decayRatePerHour: 0.003, idealTempRange: { min: 0, max: 5 },   idealHumidityRange: { min: 65, max: 75 } },
  Mango:             { decayRatePerHour: 0.006, idealTempRange: { min: 10, max: 13 }, idealHumidityRange: { min: 85, max: 90 } },
  Kinnow:            { decayRatePerHour: 0.003, idealTempRange: { min: 5, max: 8 },   idealHumidityRange: { min: 85, max: 90 } },
  Banana:            { decayRatePerHour: 0.009, idealTempRange: { min: 13, max: 15 }, idealHumidityRange: { min: 85, max: 95 } },
  "Green Chili":     { decayRatePerHour: 0.007, idealTempRange: { min: 7, max: 10 },  idealHumidityRange: { min: 85, max: 90 } },
  Okra:              { decayRatePerHour: 0.008, idealTempRange: { min: 7, max: 10 },  idealHumidityRange: { min: 85, max: 90 } },
  "Leafy Vegetables":{ decayRatePerHour: 0.012, idealTempRange: { min: 0, max: 4 },   idealHumidityRange: { min: 95, max: 100 } },
}

/** Transport mode multipliers for spoilage engine (Task 4) */
export const MODE_FACTORS: Record<string, number> = {
  refrigerated: 1.0,
  ambient: 1.4,
  none: 1.8,
}

/* ──────────────────── Task 6: Matching Weights ──────────────────── */

/** Buyer matching weights (section 6 of spec) */
export const MATCH_WEIGHTS = {
  priceFit: 0.3,
  quantityFit: 0.2,
  proximity: 0.2,
  reliability: 0.15,
  urgency: 0.15,
}

/* ──────────────────── Task 7: Provider Matching Weights ──────────────────── */

/** Provider (transporter/storage) scoring weights */
export const PROVIDER_MATCH_WEIGHTS = {
  cost: 0.25,
  proximity: 0.2,
  rating: 0.2,
  capabilityMatch: 0.2,
  spoilageRisk: 0.15,
}
