/**
 * Firestore helpers for real-time AI usage logging.
 *
 * After every Gemini call (extract, vision, chat, status), we write a log
 * entry to both Supabase `ai_usage` (via the Edge Function) and Firestore.
 *
 * The admin dashboard subscribes to the Firestore `ai_usage` collection
 * via onSnapshot() for live-updating telemetry.
 */
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore"
import { firestoreDb } from "@/lib/firebase"

export interface AiUsageLog {
  id: string
  userId?: string
  action: string
  model: string
  status: "ok" | "error"
  error?: string
  latencyMs: number
  createdAt: string
}

const AI_USAGE_COLLECTION = "ai_usage"

/**
 * Non-blocking write. Supabase ai_usage remains the durable source of truth;
 * Firestore is the real-time channel.
 */
export async function logAiUsageToFirestore(entry: {
  userId?: string
  action: string
  model: string
  status: "ok" | "error"
  error?: string
  latencyMs: number
}) {
  try {
    await addDoc(collection(firestoreDb, AI_USAGE_COLLECTION), {
      ...entry,
      createdAt: Timestamp.now(),
    })
  } catch (e) {
    console.warn("[Firestore] AI usage log failed", e)
  }
}

/**
 * Subscribe to the most recent AI usage entries. Returns an unsubscribe
 * function to call in a useEffect cleanup.
 */
export function subscribeToAiUsage(
  limitCount: number,
  callback: (logs: AiUsageLog[]) => void,
): Unsubscribe {
  const q = query(
    collection(firestoreDb, AI_USAGE_COLLECTION),
    orderBy("createdAt", "desc"),
    limit(limitCount),
  )

  return onSnapshot(q, (snapshot) => {
    const logs: AiUsageLog[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      const createdAt = data.createdAt?.toDate
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString()
      return {
        id: doc.id,
        userId: data.userId,
        action: data.action,
        model: data.model,
        status: data.status,
        error: data.error,
        latencyMs: data.latencyMs,
        createdAt,
      }
    })
    callback(logs)
  })
}
