export type Role = "agent" | "user" | "system"

export type UserRoleType = "farmer" | "buyer" | "transporter" | "storage_provider" | "admin"

export interface UserRole {
  id: string
  userId: string
  role: UserRoleType
  status: "active" | "pending" | "disabled"
  createdAt: string
}

/** Per-role extended profile data (stored as JSONB in role_profiles) */
export interface FarmerProfile {
  farmLocation?: string
  primaryCrops?: string[]
}
export interface BuyerProfile {
  orgName?: string
  typicalCommodities?: string[]
  deliveryRegions?: string[]
  priceCeiling?: number
}
export interface TransporterProfile {
  vehicleType?: string
  capacityKg?: number
  refrigerated?: boolean
  serviceArea?: string
}
export interface StorageProviderProfile {
  facilityType?: string
  capacityUnits?: number
  tempRange?: { min: number; max: number }
  certifications?: string[]
}
export type RoleProfileData = FarmerProfile | BuyerProfile | TransporterProfile | StorageProviderProfile

export interface RoleProfile {
  id: string
  userRoleId: string
  profileJson: RoleProfileData
  updatedAt: string
}

export interface Profile {
  id: string
  fullName: string
  email: string
  phone: string
  city: string
  address: string
  role: UserRoleType
  customerCode: string
  createdAt: string
  /** Active roles loaded from user_roles table */
  roles?: UserRole[]
}

export type Packaging = "crates" | "sacks" | "loose"
export type Grade = "A" | "B" | "C"

export interface LotConfidence {
  crop: number
  quantity: number
  location: number
  overall: number
}

export interface VisionResult {
  grade: Grade
  ripeness: string
  defectRate: number
  notes: string[]
  confidence: number
  source: "gemini" | "demo"
}

export interface Lot {
  crop: string
  quantityKg: number
  location: string
  readyDate: string
  packaging: Packaging
  storageAvailable: boolean
  departEarly: boolean
  photos: string[]
  vision: VisionResult
  confidence: LotConfidence
  /** Supabase listing ID once persisted (Task 2) */
  listingId?: string
}

export interface Buyer {
  id: string
  name: string
  city: string
  category: string
  grade: Grade | "any"
  premiumPct: number
  acceptanceRate: number
  rejectionPct: number
  paymentTerms: string
  minKg: number
  maxKg: number
  verified: boolean
  responseTime: string
}

export interface Transporter {
  id: string
  name: string
  vehicle: string
  refrigerated: boolean
  costPerKm: number
  onTimePct: number
}

export interface StorageFacility {
  id: string
  name: string
  city: string
  tempC: number
  perKgPerDay: number
  verified: boolean
}

/* ──── Provider profile data from role_profiles JSONB (Phase 2) ──── */

export interface BuyerProfileData {
  userId: string
  userRoleId: string
  name: string
  city: string
  orgName?: string
  typicalCommodities?: string[]
  deliveryRegions?: string[]
  priceCeiling?: number
  acceptanceRate?: number
  rejectionPct?: number
  paymentTerms?: string
  minKg?: number
  maxKg?: number
  verified?: boolean
}

export interface TransporterProfileData {
  userId: string
  userRoleId: string
  name: string
  city: string
  vehicleType?: string
  capacityKg?: number
  refrigerated?: boolean
  serviceArea?: string[]
  ratePerKm?: number
  onTimePct?: number
}

export interface StorageProviderProfileData {
  userId: string
  userRoleId: string
  name: string
  facilityType?: string
  capacityUnits?: number
  tempRange?: { min: number; max: number }
  city?: string
  perKgPerDay?: number
  verified?: boolean
}

export interface PricePoint {
  city: string
  pricePerKg: number
  trend: number
  freshnessMin: number
  confidence: number
}

export interface Deduction {
  label: string
  amount: number
}

export interface Scenario {
  id: string
  title: string
  /** Display label, e.g. "Multan Cold Hub → Lahore" — not a city key */
  market: string
  /** Canonical city for price + distance lookups */
  destCity: string
  buyerName?: string
  gross: number
  acceptedKg: number
  deductions: Deduction[]
  net: number
  spoilagePct: number
  /** Breakdown of contributing factors from the spoilage engine (Task 4) */
  contributingFactors?: Record<string, number>
  risk: "Low" | "Medium" | "Medium-High"
  paymentTerms: string
  why: string[]
  recommended: boolean
  score: number
}

export interface ApprovalAction {
  label: string
  detail: string
}

export interface ApprovalRequest {
  id: string
  title: string
  subtitle: string
  actions: ApprovalAction[]
  messageDraft: string
  recipient: { name: string; role: string }
  status: "pending" | "approved" | "rejected"
  decidedAt?: number
}

export interface TransportOption {
  transporter: Transporter
  cost: number
  pickup: string
  eta: string
  recommended: boolean
  note: string
}

export interface OfferSet {
  buyerName: string
  buyerLine: string
  acceptedPricePerKg: number
  acceptedKg: number
  transport: TransportOption[]
  expectedNet: number
  netNote: string
  buyerAcceptance: number
  buyerResponse: string
}

export interface TrackStep {
  label: string
  time: string
  state: "done" | "active" | "pending" | "alert"
  detail?: string
}

export interface Order {
  id: string
  buyerName: string
  transporterName: string
  vehicle: string
  destination: string
  quantityKg: number
  pricePerKg: number
  gross: number
  net: number
  steps: TrackStep[]
}

export interface AlertInfo {
  kind: "delay" | "price" | "info"
  title: string
  body: string
}

export interface SummaryInfo {
  title: string
  gross: number
  net: number
  upliftVsLocal: number
  upliftNote?: string
  acceptedPct: number
  lines: string[]
}

export type Msg =
  | { id: string; role: "user"; kind: "text"; text: string; time: number }
  | { id: string; role: "user"; kind: "voice"; text: string; durationSec: number; time: number }
  | { id: string; role: "user"; kind: "photos"; photos: string[]; time: number }
  | { id: string; role: "agent"; kind: "text"; text: string; time: number }
  | { id: string; role: "agent"; kind: "lot"; lot: Lot; time: number }
  | { id: string; role: "agent"; kind: "clarify"; time: number }
  | { id: string; role: "agent"; kind: "scenarios"; scenarios: Scenario[]; recommendedId: string; time: number }
  | { id: string; role: "agent"; kind: "approval"; approval: ApprovalRequest; time: number }
  | { id: string; role: "agent"; kind: "offers"; offers: OfferSet; time: number }
  | { id: string; role: "agent"; kind: "order"; order: Order; time: number }
  | { id: string; role: "agent"; kind: "alert"; alert: AlertInfo; time: number }
  | { id: string; role: "agent"; kind: "summary"; summary: SummaryInfo; time: number }

export interface AuditEntry {
  id: string
  time: number
  actor: "Agent" | "You" | "System"
  action: string
  approved?: boolean
}

export type Stage =
  | "welcome"
  | "awaiting-intake"
  | "awaiting-photos"
  | "awaiting-clarify"
  | "analyzing"
  | "options"
  | "outreach-approval"
  | "outreach"
  | "offers"
  | "final-approval"
  | "tracking"
  | "completed"

export interface QuickReply {
  id: string
  label: string
  emoji?: string
  primary?: boolean
}

// ──────────────────────────── Task 2: Unified Listing ────────────────────────────

export type ListingType = "lot" | "storage_slot" | "transport_slot" | "buyer_request"

export interface Listing {
  id: string
  ownerUserId: string
  listingType: ListingType
  commodity: string
  quantity: number
  unit: string
  locationGeo: string
  price: number | null
  availableFrom: string | null
  availableTo: string | null
  attributes: Record<string, unknown>
  status: "active" | "sold" | "expired" | "cancelled"
  createdAt: string
}

// ──────────────────────────── Task 9: Order State Machine ────────────────────────────

export type OrderStatus =
  | "LISTED" | "OFFER_RECEIVED" | "OFFER_ACCEPTED"
  | "TRANSPORT_PENDING" | "TRANSPORT_BOOKED"
  | "STORAGE_PENDING" | "STORAGE_BOOKED"
  | "IN_TRANSIT" | "DELIVERED"
  | "PAYMENT_PENDING" | "PAID" | "CLOSED"
  | "CANCELLED" | "DISPUTED"

export interface OrderEvent {
  id: string
  orderId: string
  eventType: string
  payload: Record<string, unknown>
  createdAt: string
}
