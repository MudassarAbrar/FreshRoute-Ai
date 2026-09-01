/**
 * Anti-Fabrication Validator (Phase 2)
 *
 * Ensures the agent never claims an action succeeded without verified
 * backend evidence. Per spec Section 11:
 *
 * - Every claim about an action ("sent", "booked", "confirmed") must be
 *   backed by a matching successful tool result or persisted record.
 * - Unverified claims are stripped or replaced with honest status text.
 */

export type ClaimType =
  | "offer_sent"
  | "booking_confirmed"
  | "whatsapp_delivered"
  | "truck_dispatched"
  | "payment_completed"
  | "message_read"

export interface ActionClaim {
  claimType: ClaimType
  phrase: string
  evidence?: {
    toolCallId?: string
    toolResult?: Record<string, unknown>
    persistedRecordId?: string
    dbVerified?: boolean
  }
}

export interface ValidationResult {
  valid: boolean
  originalPhrase: string
  replacement?: string
  reason?: string
}

/**
 * Patterns that indicate an agent is claiming an action succeeded.
 * Each pattern maps to a claim type and a regex to detect it in text.
 */
const CLAIM_PATTERNS: { claimType: ClaimType; pattern: RegExp; honestFallback: string }[] = [
  {
    claimType: "offer_sent",
    pattern: /(?:offer|message|proposal)\s+(?:sent|delivered|dispatched)\s+(?:to\s+)?(.+?)(?:\s+on\s+WhatsApp)?\s*[✓✔️✅]?/gi,
    honestFallback: "Offer prepared — awaiting WhatsApp delivery confirmation",
  },
  {
    claimType: "whatsapp_delivered",
    pattern: /(?:WhatsApp\s+)?message\s+(?:delivered|sent)\s*[✓✔️✅]?/gi,
    honestFallback: "Message queued — delivery not yet confirmed",
  },
  {
    claimType: "message_read",
    pattern: /(?:read\s+receipt|message\s+read|delivered\s+and\s+read)\s*[✓✔️✅]?/gi,
    honestFallback: "Awaiting delivery confirmation",
  },
  {
    claimType: "booking_confirmed",
    pattern: /(?:transport|storage)\s+(?:booked|confirmed|reserved)\s*[✓✔️✅]?/gi,
    honestFallback: "Booking requested — awaiting provider confirmation",
  },
  {
    claimType: "truck_dispatched",
    pattern: /(?:truck|vehicle)\s+(?:dispatched|en\s*route|on\s+its\s+way)\s*[✓✔️✅]?/gi,
    honestFallback: "Transport arranged — awaiting dispatch confirmation",
  },
  {
    claimType: "payment_completed",
    pattern: /payment\s+(?:completed|processed|confirmed)\s*[✓✔️✅]?/gi,
    honestFallback: "Payment initiated — awaiting confirmation",
  },
]

/**
 * Scan agent response text for action claims.
 * Returns a list of detected claims with their positions.
 */
export function detectClaims(text: string): ActionClaim[] {
  const claims: ActionClaim[] = []

  for (const { claimType, pattern } of CLAIM_PATTERNS) {
    // Reset regex state for global patterns
    pattern.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text)) !== null) {
      claims.push({
        claimType,
        phrase: match[0],
      })
    }
  }

  return claims
}

/**
 * Validate a claim against actual tool call results.
 * A claim is valid only if there's a matching successful tool result.
 */
export function validateClaim(
  claim: ActionClaim,
  toolResults: Array<{ name: string; result: Record<string, unknown> }>,
): ValidationResult {
  // Map claim types to expected tool names
  const expectedTools: Record<ClaimType, string[]> = {
    offer_sent: ["send_offer_message"],
    booking_confirmed: ["book_transport", "book_storage"],
    whatsapp_delivered: ["send_offer_message"],
    truck_dispatched: ["book_transport"],
    payment_completed: [],  // No tool exists for payment yet
    message_read: [],  // No tool exists for read receipts yet
  }

  const tools = expectedTools[claim.claimType]
  const hasMatchingResult = tools.some((toolName) =>
    toolResults.some(
      (tr) => tr.name === toolName && (tr.result.ok === true || tr.result.updated === true),
    ),
  )

  if (hasMatchingResult) {
    return { valid: true, originalPhrase: claim.phrase }
  }

  // Find the honest fallback for this claim type
  const patternEntry = CLAIM_PATTERNS.find((p) => p.claimType === claim.claimType)
  return {
    valid: false,
    originalPhrase: claim.phrase,
    replacement: patternEntry?.honestFallback ?? "[action status unverified]",
    reason: `No successful tool result found for claim type "${claim.claimType}". Expected one of: ${tools.join(", ") || "none available"}`,
  }
}

/**
 * Sanitize an agent response by replacing unverified claims with honest text.
 *
 * @param text The agent's response text
 * @param toolResults Array of actual tool call results from the agent run
 * @returns Sanitized text with unverified claims replaced
 */
export function sanitizeResponse(
  text: string,
  toolResults: Array<{ name: string; result: Record<string, unknown> }>,
): { text: string; claimsFound: number; claimsReplaced: number } {
  const claims = detectClaims(text)
  let sanitized = text
  let claimsReplaced = 0

  for (const claim of claims) {
    const validation = validateClaim(claim, toolResults)
    if (!validation.valid && validation.replacement) {
      sanitized = sanitized.replace(claim.phrase, validation.replacement)
      claimsReplaced++
    }
  }

  return { text: sanitized, claimsFound: claims.length, claimsReplaced }
}
