/**
 * Server-Side Rate Limiter — spec Section 33.
 *
 * Token bucket rate limiter for Supabase Edge Functions.
 * Uses in-memory storage (per Edge Function instance).
 * In production, replace with Redis or Supabase ai_usage table.
 *
 * Limits:
 * - 30 agent interactions per user per hour
 * - 5 write actions per order per hour
 * - 100 total requests per user per hour (all endpoints)
 */

interface TokenBucket {
  tokens: number
  maxTokens: number
  refillRate: number // tokens per second
  lastRefill: number
}

const buckets = new Map<string, TokenBucket>()

// Evict stale buckets every 1000 requests to prevent memory leaks
let requestCount = 0
const MAX_BUCKETS = 10_000

function getBucket(key: string, maxTokens: number, refillPerHour: number): TokenBucket {
  // Periodic cleanup
  requestCount++
  if (requestCount % 1000 === 0 && buckets.size > MAX_BUCKETS) {
    const cutoff = Date.now() - 3_600_000 // 1 hour ago
    for (const [k, v] of buckets) {
      if (v.lastRefill < cutoff) buckets.delete(k)
    }
  }

  let bucket = buckets.get(key)
  if (bucket) {
    const elapsed = (Date.now() - bucket.lastRefill) / 1000
    bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + elapsed * bucket.refillRate)
    bucket.lastRefill = Date.now()
    return bucket
  }

  bucket = {
    tokens: maxTokens,
    maxTokens,
    refillRate: refillPerHour / 3600,
    lastRefill: Date.now(),
  }
  buckets.set(key, bucket)
  return bucket
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs?: number
  limitType: string
}

/**
 * Check if an agent interaction is allowed.
 * Max 30 agent turns per user per hour.
 */
export function checkAgentRateLimit(userId: string): RateLimitResult {
  const bucket = getBucket(`agent_${userId}`, 30, 30)
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return { allowed: true, remaining: Math.floor(bucket.tokens), limitType: "agent" }
  }
  const retryAfterMs = Math.ceil((1 - bucket.tokens) / bucket.refillRate * 1000)
  return { allowed: false, remaining: 0, retryAfterMs, limitType: "agent" }
}

/**
 * Check if a write action is allowed for an order.
 * Max 5 write actions per order per hour.
 */
export function checkOrderRateLimit(orderId: string): RateLimitResult {
  const bucket = getBucket(`order_${orderId}`, 5, 5)
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return { allowed: true, remaining: Math.floor(bucket.tokens), limitType: "order" }
  }
  const retryAfterMs = Math.ceil((1 - bucket.tokens) / bucket.refillRate * 1000)
  return { allowed: false, remaining: 0, retryAfterMs, limitType: "order" }
}

/**
 * Check general request rate limit.
 * Max 100 requests per user per hour (all endpoints combined).
 */
export function checkGlobalRateLimit(userId: string): RateLimitResult {
  const bucket = getBucket(`global_${userId}`, 100, 100)
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return { allowed: true, remaining: Math.floor(bucket.tokens), limitType: "global" }
  }
  const retryAfterMs = Math.ceil((1 - bucket.tokens) / bucket.refillRate * 1000)
  return { allowed: false, remaining: 0, retryAfterMs, limitType: "global" }
}

/**
 * Build a 429 rate-limit response.
 */
export function rateLimitedResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      error: `Rate limit exceeded (${result.limitType}). Try again in ${Math.ceil((result.retryAfterMs ?? 0) / 1000)} seconds.`,
      retryAfterMs: result.retryAfterMs,
      limitType: result.limitType,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Retry-After": String(Math.ceil((result.retryAfterMs ?? 0) / 1000)),
      },
    },
  )
}
