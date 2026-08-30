import { supabase } from "@/lib/supabase"
import type { Order, TrackStep } from "@/types"

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
