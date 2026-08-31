/**
 * Rate Limiter (Task 10)
 *
 * Client-side token bucket rate limiter.
 * Per-user limits: max 30 agent interactions per hour, max 5 outbound actions per order.
 * Uses localStorage for MVP (Redis for production).
 */

const STORAGE_PREFIX = "freshroute_ratelimit_"

interface TokenBucket {
  tokens: number
  maxTokens: number
  refillRate: number // tokens per second
  lastRefill: number
}

function getBucket(key: string, maxTokens: number, refillPerHour: number): TokenBucket {
  const storageKey = STORAGE_PREFIX + key
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      const bucket = JSON.parse(stored) as TokenBucket
      const elapsed = (Date.now() - bucket.lastRefill) / 1000
      bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + elapsed * bucket.refillRate)
      bucket.lastRefill = Date.now()
      return bucket
    }
  } catch {
    // Ignore parse errors
  }
  return { tokens: maxTokens, maxTokens, refillRate: refillPerHour / 3600, lastRefill: Date.now() }
}

function saveBucket(key: string, bucket: TokenBucket): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(bucket))
  } catch {
    // localStorage may be full or unavailable
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs?: number
}

/** Check if an agent interaction is allowed (max 30/hour per user). */
export function checkAgentInteraction(userId: string): RateLimitResult {
  const bucket = getBucket(`agent_${userId}`, 30, 30)
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    saveBucket(`agent_${userId}`, bucket)
    return { allowed: true, remaining: Math.floor(bucket.tokens) }
  }
  const retryAfterMs = Math.ceil((1 - bucket.tokens) / bucket.refillRate * 1000)
  return { allowed: false, remaining: 0, retryAfterMs }
}

/** Check if an outbound action is allowed for an order (max 5/order). */
export function checkOrderAction(orderId: string): RateLimitResult {
  const bucket = getBucket(`order_${orderId}`, 5, 5)
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    saveBucket(`order_${orderId}`, bucket)
    return { allowed: true, remaining: Math.floor(bucket.tokens) }
  }
  const retryAfterMs = Math.ceil((1 - bucket.tokens) / bucket.refillRate * 1000)
  return { allowed: false, remaining: 0, retryAfterMs }
}
