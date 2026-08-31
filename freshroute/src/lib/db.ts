import { supabase } from "@/lib/supabase"
import type { Order, TrackStep, UserRole, RoleProfileData, Listing, ListingType, BuyerProfileData, TransporterProfileData, StorageProviderProfileData } from "@/types"

/* ──────────────────── orders ──────────────────── */

export interface DbOrder {
  id: string
  user_id: string
  crop: string
  quantity_kg: number
  packaging: string
  grade: string
  buyer_name: string
  destination: string
  price_per_kg: number
  gross: number
  net: number
  final_net: number | null
  status: "active" | "completed" | "cancelled"
  payment_status: "pending" | "paid"
  payment_terms: string
  steps: TrackStep[]
  source: string
  created_at: string
  completed_at: string | null
}

function mapOrder(row: DbOrder): Order & { status: string; crop: string; userId: string; createdAt: string } {
  return {
    id: row.id,
    buyerName: row.buyer_name,
    transporterName: "",
    vehicle: "",
    destination: row.destination,
    quantityKg: row.quantity_kg,
    pricePerKg: row.price_per_kg,
    gross: row.gross,
    net: row.final_net ?? row.net,
    steps: row.steps ?? [],
    status: row.status,
    crop: row.crop,
    userId: row.user_id,
    createdAt: row.created_at,
  }
}

export async function fetchOrders(userId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data as DbOrder[]).map(mapOrder)
}

export async function fetchAllOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*, profiles(full_name, customer_code, city)")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as (DbOrder & { profiles: { full_name: string; customer_code: string; city: string } | null })[]
}

export async function fetchOrderById(orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, profiles(full_name, customer_code, city)")
    .eq("id", orderId)
    .single()
  if (error) throw error
  return data as DbOrder & { profiles: { full_name: string; customer_code: string; city: string } | null }
}

export async function saveOrder(order: {
  id: string
  userId: string
  crop: string
  quantityKg: number
  packaging: string
  grade: string
  buyerName: string
  destination: string
  pricePerKg: number
  gross: number
  net: number
  steps: TrackStep[]
  paymentTerms: string
}) {
  const { error } = await supabase.from("orders").insert({
    id: order.id,
    user_id: order.userId,
    crop: order.crop,
    quantity_kg: order.quantityKg,
    packaging: order.packaging,
    grade: order.grade,
    buyer_name: order.buyerName,
    destination: order.destination,
    price_per_kg: order.pricePerKg,
    gross: order.gross,
    net: order.net,
    steps: order.steps,
    payment_terms: order.paymentTerms,
    status: "active",
    source: "agent",
  })
  if (error) throw error
}

export async function updateOrderStatus(orderId: string, updates: { status?: string; final_net?: number; steps?: TrackStep[]; completed_at?: string }) {
  const { error } = await supabase.from("orders").update(updates).eq("id", orderId)
  if (error) throw error
}

/* ──────────────────── profiles ──────────────────── */

export async function fetchAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function updateProfile(userId: string, updates: { full_name?: string; phone?: string; city?: string; address?: string }) {
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId)
  if (error) throw error
}

/* ──────────────────── customer metrics ──────────────────── */

export async function fetchCustomerMetrics(userId: string) {
  const { data, error } = await supabase
    .from("customer_metrics")
    .select("*")
    .eq("user_id", userId)
    .single()
  if (error) return null
  return data
}

export async function fetchAllCustomerMetrics() {
  const { data, error } = await supabase
    .from("customer_metrics")
    .select("*")
    .order("total_earned", { ascending: false })
  if (error) throw error
  return data
}

/* ──────────────────── reviews ──────────────────── */

export async function fetchReviews(userId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

/* ──────────────────── notifications ──────────────────── */

export async function fetchNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function markNotificationRead(notifId: string) {
  await supabase.from("notifications").update({ read: true }).eq("id", notifId)
}

/* ──────────────────── image analyses ──────────────────── */

export async function saveImageAnalysis(analysis: {
  userId: string
  orderId?: string
  imagePath: string
  cropHint: string
  grade: string
  ripeness: string
  defectRate: number
  notes: string[]
  confidence: number
  model: string
  source: string
}) {
  const { error } = await supabase.from("image_analyses").insert({
    user_id: analysis.userId,
    order_id: analysis.orderId,
    image_path: analysis.imagePath,
    crop_hint: analysis.cropHint,
    grade: analysis.grade,
    ripeness: analysis.ripeness,
    defect_rate: analysis.defectRate,
    notes: analysis.notes,
    confidence: analysis.confidence,
    model: analysis.model,
    source: analysis.source,
  })
  if (error) throw error
}

export async function fetchImageAnalyses(userId: string) {
  const { data, error } = await supabase
    .from("image_analyses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

/* ──────────────────── AI usage (admin) ──────────────────── */

export async function fetchAiUsage(limit = 50) {
  const { data, error } = await supabase
    .from("ai_usage")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

/* ──────────────────── system stats (admin) ──────────────────── */

export async function fetchSystemStats() {
  const [
    { count: totalUsers },
    { count: totalOrders },
    { count: activeOrders },
    { data: revenueData },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("orders").select("gross, final_net, status").eq("status", "completed"),
  ])
  const totalRevenue = (revenueData ?? []).reduce((sum: number, r: { final_net: number | null; gross: number }) => sum + (r.final_net ?? r.gross), 0)
  return { totalUsers: totalUsers ?? 0, totalOrders: totalOrders ?? 0, activeOrders: activeOrders ?? 0, totalRevenue }
}

/* ──────────────────── chat persistence ──────────────────── */

export async function saveChatState(userId: string, state: { stage: string; lot: unknown; scenarios: unknown; quickReplies: unknown }) {
  await supabase.from("chat_state").upsert({
    user_id: userId,
    stage: state.stage,
    lot: state.lot,
    scenarios: state.scenarios,
    quick_replies: state.quickReplies,
    updated_at: new Date().toISOString(),
  })
}

export async function loadChatState(userId: string) {
  const { data } = await supabase
    .from("chat_state")
    .select("*")
    .eq("user_id", userId)
    .single()
  return data
}

export async function saveChatMessage(userId: string, msg: unknown) {
  const m = msg as { id: string }
  await supabase.from("chat_messages").upsert({
    id: m.id,
    user_id: userId,
    msg: msg,
  })
}

/* ──────────────────── user roles (Task 1) ──────────────────── */

export async function fetchUserRoles(userId: string): Promise<UserRole[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at")
  if (error) throw error
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    userId: r.user_id,
    role: r.role,
    status: r.status,
    createdAt: r.created_at,
  }))
}

export async function addUserRole(userId: string, role: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role, status: "active" })
    .select("*")
    .single()
  if (error) throw error
  return {
    id: data.id,
    userId: data.user_id,
    role: data.role,
    status: data.status,
    createdAt: data.created_at,
  }
}

export async function saveRoleProfile(userRoleId: string, profileJson: RoleProfileData) {
  const { error } = await supabase.from("role_profiles").upsert({
    user_role_id: userRoleId,
    profile_json: profileJson,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function fetchRoleProfile(userRoleId: string): Promise<RoleProfileData | null> {
  const { data, error } = await supabase
    .from("role_profiles")
    .select("profile_json")
    .eq("user_role_id", userRoleId)
    .maybeSingle()
  if (error) throw error
  return data?.profile_json ?? null
}

/* ──────────────────── listings (Task 2) ──────────────────── */

export async function createListing(listing: {
  id: string
  ownerUserId: string
  listingType: ListingType
  commodity: string
  quantity: number
  unit?: string
  locationGeo: string
  price?: number | null
  availableFrom?: string | null
  availableTo?: string | null
  attributes?: Record<string, unknown>
}): Promise<Listing> {
  const { data, error } = await supabase
    .from("listings")
    .insert({
      id: listing.id,
      owner_user_id: listing.ownerUserId,
      listing_type: listing.listingType,
      commodity: listing.commodity,
      quantity: listing.quantity,
      unit: listing.unit ?? "kg",
      location_geo: listing.locationGeo,
      price: listing.price ?? null,
      available_from: listing.availableFrom ?? null,
      available_to: listing.availableTo ?? null,
      attributes: listing.attributes ?? {},
      status: "active",
    })
    .select("*")
    .single()
  if (error) throw error
  return mapListing(data)
}

export async function fetchListings(filters?: {
  listingType?: ListingType
  commodity?: string
  status?: string
  limit?: number
}): Promise<Listing[]> {
  let q = supabase.from("listings").select("*").order("created_at", { ascending: false })
  if (filters?.listingType) q = q.eq("listing_type", filters.listingType)
  if (filters?.commodity) q = q.eq("commodity", filters.commodity)
  if (filters?.status) q = q.eq("status", filters.status)
  else q = q.eq("status", "active")
  q = q.limit(filters?.limit ?? 50)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map(mapListing)
}

export async function fetchListingById(listingId: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle()
  if (error) throw error
  return data ? mapListing(data) : null
}

export async function updateListing(listingId: string, updates: Record<string, unknown>) {
  const { error } = await supabase.from("listings").update(updates).eq("id", listingId)
  if (error) throw error
}

function mapListing(row: any): Listing {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    listingType: row.listing_type,
    commodity: row.commodity,
    quantity: row.quantity,
    unit: row.unit,
    locationGeo: row.location_geo,
    price: row.price,
    availableFrom: row.available_from,
    availableTo: row.available_to,
    attributes: row.attributes ?? {},
    status: row.status,
    createdAt: row.created_at,
  }
}

/* ──────────────────── offers (Task 3) ──────────────────── */

export async function createOffer(offer: {
  listingId: string
  offeringUserId: string
  price: number
  quantity: number
  message?: string
}) {
  const { data, error } = await supabase
    .from("offers")
    .insert({
      listing_id: offer.listingId,
      offering_user_id: offer.offeringUserId,
      price: offer.price,
      quantity: offer.quantity,
      message: offer.message ?? "",
      status: "pending",
    })
    .select("*")
    .single()
  if (error) throw error
  return data
}

export async function fetchOffers(listingId: string) {
  const { data, error } = await supabase
    .from("offers")
    .select("*, profiles(full_name, city)")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

/* ──────────────────── spoilage assessments (Task 4) ──────────────────── */

export async function saveSpoilageAssessment(assessment: {
  listingId: string
  riskScore: string
  estLossPct: number
  factors: Record<string, number>
}) {
  const { error } = await supabase.from("spoilage_assessments").insert({
    listing_id: assessment.listingId,
    computed_at: new Date().toISOString(),
    risk_score: assessment.riskScore,
    est_loss_pct: assessment.estLossPct,
    factors: assessment.factors,
  })
  if (error) throw error
}

export async function fetchSpoilageAssessments(listingId: string) {
  const { data, error } = await supabase
    .from("spoilage_assessments")
    .select("*")
    .eq("listing_id", listingId)
    .order("computed_at", { ascending: false })
    .limit(10)
  if (error) throw error
  return data
}

/* ──────────────────── recommendations (Task 5) ──────────────────── */

export async function saveRecommendation(rec: {
  listingId: string
  options: unknown
  chosenOption?: string | null
}) {
  const { error } = await supabase.from("recommendations").insert({
    listing_id: rec.listingId,
    generated_at: new Date().toISOString(),
    options: rec.options,
    chosen_option: rec.chosenOption ?? null,
    status: "generated",
  })
  if (error) throw error
}

export async function fetchRecommendations(listingId: string) {
  const { data, error } = await supabase
    .from("recommendations")
    .select("*")
    .eq("listing_id", listingId)
    .order("generated_at", { ascending: false })
    .limit(5)
  if (error) throw error
  return data
}

/* ──────────────────── order events (Task 9) ──────────────────── */

export async function addOrderEvent(orderId: string, eventType: string, payload: Record<string, unknown>) {
  const { error } = await supabase.from("order_events").insert({
    order_id: orderId,
    event_type: eventType,
    payload,
  })
  if (error) throw error
}

export async function fetchOrderEvents(orderId: string) {
  const { data, error } = await supabase
    .from("order_events")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at")
  if (error) throw error
  return data
}

/* ──────────────────── agent action log (Task 8) ──────────────────── */

export async function saveAgentAction(action: {
  agentRunId: string
  actionType: string
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  requiresApproval?: boolean
  approvedBy?: string | null
  status: string
}) {
  const { error } = await supabase.from("agent_action_log").insert({
    agent_run_id: action.agentRunId,
    action_type: action.actionType,
    input: action.input ?? {},
    output: action.output ?? {},
    requires_approval: action.requiresApproval ?? false,
    approved_by: action.approvedBy ?? null,
    status: action.status,
  })
  if (error) throw error
}

export async function fetchAgentActions(agentRunId: string) {
  const { data, error } = await supabase
    .from("agent_action_log")
    .select("*")
    .eq("agent_run_id", agentRunId)
    .order("created_at")
  if (error) throw error
  return data
}

export async function checkIdempotency(idempotencyKey: string): Promise<boolean> {
  const { data } = await supabase
    .from("agent_action_log")
    .select("id")
    .eq("agent_run_id", idempotencyKey)
    .eq("status", "executed")
    .maybeSingle()
  return !!data
}

/* ──────────────────── transport & storage bookings (Task 3) ──────────────────── */

export async function createTransportBooking(booking: {
  orderId: string
  transporterUserId: string
  pickupWindow: string
  dropoffWindow: string
  rate: number
}) {
  const { data, error } = await supabase
    .from("transport_bookings")
    .insert({
      order_id: booking.orderId,
      transporter_user_id: booking.transporterUserId,
      pickup_window: booking.pickupWindow,
      dropoff_window: booking.dropoffWindow,
      rate: booking.rate,
      status: "pending",
    })
    .select("*")
    .single()
  if (error) throw error
  return data
}

export async function createStorageBooking(booking: {
  orderOrLotId: string
  storageUserId: string
  startDate: string
  endDate: string
  rate: number
}) {
  const { data, error } = await supabase
    .from("storage_bookings")
    .insert({
      order_id_or_lot_id: booking.orderOrLotId,
      storage_user_id: booking.storageUserId,
      start_date: booking.startDate,
      end_date: booking.endDate,
      rate: booking.rate,
      status: "pending",
    })
    .select("*")
    .single()
  if (error) throw error
  return data
}

/* ──────────────────── provider queries (Phase 2) ──────────────────── */

/** Fetch active provider profiles by role from user_roles + role_profiles */
export async function fetchProvidersByRole(role: "buyer" | "transporter" | "storage_provider") {
  const { data, error } = await supabase
    .from("user_roles")
    .select(`
      id,
      user_id,
      role,
      profiles!inner(id, full_name, email, city),
      role_profiles(profile_json)
    `)
    .eq("role", role)
    .eq("status", "active")
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    userRoleId: r.id,
    userId: r.user_id,
    role: r.role,
    name: r.profiles?.full_name ?? "",
    email: r.profiles?.email ?? "",
    city: r.profiles?.city ?? "",
    profileJson: r.role_profiles?.[0]?.profile_json ?? r.role_profiles?.profile_json ?? {},
  }))
}

/** Fetch buyer profiles with optional commodity/region filters */
export async function fetchBuyerProfiles(filters?: { commodity?: string; region?: string }): Promise<BuyerProfileData[]> {
  const rows = await fetchProvidersByRole("buyer")
  return rows
    .filter((r) => {
      const pj = r.profileJson
      if (filters?.commodity && pj.typicalCommodities && !pj.typicalCommodities.includes(filters.commodity)) return false
      if (filters?.region && pj.deliveryRegions && !pj.deliveryRegions.includes(filters.region)) return false
      return true
    })
    .map((r) => ({
      userId: r.userId,
      userRoleId: r.userRoleId,
      name: r.name,
      city: r.city,
      ...r.profileJson,
    }))
}

/** Fetch transporter profiles with optional filters */
export async function fetchTransporterProfiles(filters?: { refrigerated?: boolean; minCapacityKg?: number }): Promise<TransporterProfileData[]> {
  const rows = await fetchProvidersByRole("transporter")
  return rows
    .filter((r) => {
      const pj = r.profileJson
      if (filters?.refrigerated !== undefined && pj.refrigerated !== filters.refrigerated) return false
      if (filters?.minCapacityKg && pj.capacityKg < filters.minCapacityKg) return false
      return true
    })
    .map((r) => ({
      userId: r.userId,
      userRoleId: r.userRoleId,
      name: r.name,
      city: r.city,
      ...r.profileJson,
    }))
}

/** Fetch storage provider profiles with optional filters */
export async function fetchStorageProviderProfiles(filters?: { city?: string }): Promise<StorageProviderProfileData[]> {
  const rows = await fetchProvidersByRole("storage_provider")
  return rows
    .filter((r) => {
      const pj = r.profileJson
      if (filters?.city && pj.city !== filters.city) return false
      return true
    })
    .map((r) => ({
      userId: r.userId,
      userRoleId: r.userRoleId,
      name: r.name,
      ...r.profileJson,
    }))
}

/* ──────────────────── messages (Phase 4) ──────────────────── */

export async function createMessage(msg: {
  senderUserId: string
  recipientUserId: string
  listingId?: string
  content: string
  channel?: string
}) {
  const { data, error } = await supabase.from("messages").insert({
    sender_user_id: msg.senderUserId,
    recipient_user_id: msg.recipientUserId,
    listing_id: msg.listingId ?? null,
    content: msg.content,
    channel: msg.channel ?? "whatsapp",
    status: "sent",
  }).select("*").single()
  if (error) throw error
  return data
}

export async function fetchMessages(userId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_user_id.eq.${userId},recipient_user_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export async function updateMessageStatus(messageId: string, status: "delivered" | "read" | "failed") {
  const { error } = await supabase.from("messages").update({ status }).eq("id", messageId)
  if (error) throw error
}

/**
 * WhatsApp stub — mock function that can be swapped for real API later.
 * Returns a mock delivery confirmation.
 */
export async function sendWhatsApp(_recipient: string, _content: string): Promise<{ delivered: boolean; messageId: string }> {
  return { delivered: true, messageId: "mock-" + Date.now() }
}
