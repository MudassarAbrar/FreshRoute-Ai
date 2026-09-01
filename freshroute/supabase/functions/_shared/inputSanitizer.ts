/**
 * Input Sanitizer — spec Section 34.
 *
 * Enhanced sanitization for LLM input covering:
 * 1. English prompt injection patterns
 * 2. Urdu / Roman Urdu injection patterns
 * 3. HTML/XSS stripping
 * 4. System instruction patterns
 * 5. Multilingual injection corpus
 */

/** Patterns that indicate prompt injection attempts */
const INJECTION_PATTERNS: RegExp[] = [
  // English injection
  /ignore\s+(previous|all|above|all\s+previous)\s+(instructions|prompts|rules|messages)/gi,
  /you\s+are\s+now\s+/gi,
  /forget\s+(everything|all|your)\s+(you|instructions|rules)/gi,
  /new\s+instructions?\s*:/gi,
  /act\s+as\s+(if|a)\s+/gi,
  /pretend\s+(to\s+be|you\s+are)\s+/gi,
  /disregard\s+(previous|all|your)\s+/gi,
  /override\s+(system|previous|all)\s+/gi,
  /jailbreak/gi,
  /DAN\s+mode/gi,

  // Urdu injection patterns (both script and Roman Urdu)
  /پچھلی\s+ہدایات\s+کو\s+نظر\s*انداز\s+کریں/g, // "Ignore previous instructions" in Urdu
  /پچھلے\s+تمام\s+قواعد/g, // "All previous rules"
  /نئے\s+قواعد/g, // "New rules"
  /ab\s+se\s+tum/gi, // "From now on you" (Roman Urdu)
  /purani\s+hidayat/gi, // "Old instructions" (Roman Urdu)
  /sab\s+bhool\s+jao/gi, // "Forget everything" (Roman Urdu)
  /naye\s+rules/gi, // "New rules" (Roman Urdu)

  // System instruction patterns
  /system\s*:\s*/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<\|system\|>/gi,
  /<\|user\|>/gi,
  /<\|assistant\|>/gi,
  /###\s*(system|instruction|prompt)/gi,

  // HTML/XSS
  /<\/?(?:script|style|iframe|object|embed|form|input|button|textarea|select)[^>]*>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=/gi, // event handlers: onclick=, onload=, etc.
  /data\s*:\s*text\/html/gi,
  /<\?\s*php/gi,

  // SQL injection (for tool parameters)
  /;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|EXEC|UNION)\s+/gi,
  /--\s*$/gm, // SQL comment termination
]

/** Maximum allowed input length */
const MAX_INPUT_LENGTH = 10_000

/**
 * Sanitize user input before passing to LLM.
 * Strips injection patterns while preserving legitimate content.
 * Returns sanitized text and metadata about what was removed.
 */
export function sanitizeInput(text: string): {
  sanitized: string
  patternsRemoved: number
  truncated: boolean
} {
  if (!text) return { sanitized: "", patternsRemoved: 0, truncated: false }

  let sanitized = text
  let patternsRemoved = 0

  // Truncate if too long
  const truncated = sanitized.length > MAX_INPUT_LENGTH
  if (truncated) {
    sanitized = sanitized.slice(0, MAX_INPUT_LENGTH)
  }

  // Remove injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    const before = sanitized
    sanitized = sanitized.replace(pattern, "")
    if (sanitized !== before) patternsRemoved++
  }

  // Clean up whitespace artifacts from removals
  sanitized = sanitized
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{3,}/g, "  ")
    .trim()

  return {
    sanitized: sanitized || "[content sanitized]",
    patternsRemoved,
    truncated,
  }
}

/**
 * Lightweight sanitization for inbound webhook messages (WhatsApp).
 * More permissive than LLM input sanitization — preserves conversational content.
 */
export function sanitizeWebhookContent(text: string): string {
  if (!text) return ""

  // Only strip dangerous patterns for webhook content
  return text
    .replace(/<\/?(?:script|style|iframe)[^>]*>/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
    .slice(0, MAX_INPUT_LENGTH)
}

/**
 * Validate and sanitize tool call parameters.
 * More restrictive than general input — no injection patterns allowed at all.
 */
export function sanitizeToolParam(value: unknown): { valid: boolean; sanitized: unknown; reason?: string } {
  if (typeof value === "string") {
    const result = sanitizeInput(value)
    if (result.patternsRemoved > 0) {
      return { valid: false, sanitized: result.sanitized, reason: `Injection patterns detected in tool parameter (${result.patternsRemoved} removed)` }
    }
    return { valid: true, sanitized: result.sanitized }
  }

  if (typeof value === "object" && value !== null) {
    const sanitized: Record<string, unknown> = {}
    let allValid = true
    let reason = ""

    for (const [key, val] of Object.entries(value)) {
      const result = sanitizeToolParam(val)
      sanitized[key] = result.sanitized
      if (!result.valid) {
        allValid = false
        reason = result.reason ?? "Invalid parameter"
      }
    }

    return { valid: allValid, sanitized, reason: allValid ? undefined : reason }
  }

  return { valid: true, sanitized: value }
}

/**
 * Check if text contains instruction-like patterns that might be
 * a social engineering attempt via farmer messaging.
 */
export function detectInstructionInjection(text: string): {
  detected: boolean
  confidence: number
  patterns: string[]
} {
  const matches: string[] = []

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      matches.push(pattern.source)
    }
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0
  }

  return {
    detected: matches.length > 0,
    confidence: Math.min(1, matches.length * 0.3),
    patterns: matches,
  }
}
