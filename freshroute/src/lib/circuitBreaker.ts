/**
 * Circuit Breaker (Task 10)
 *
 * Generic circuit breaker: wraps any async function.
 * After 3 consecutive failures, opens circuit for 60 seconds.
 * Returns graceful fallback instead of failing silently.
 */

type CircuitState = "closed" | "open" | "half-open"

interface CircuitBreakerState {
  state: CircuitState
  failureCount: number
  lastFailureTime: number
  nextRetryTime: number
}

const circuits: Map<string, CircuitBreakerState> = new Map()

const MAX_FAILURES = 3
const RECOVERY_TIME_MS = 60_000 // 60 seconds

function getState(name: string): CircuitBreakerState {
  if (!circuits.has(name)) {
    circuits.set(name, { state: "closed", failureCount: 0, lastFailureTime: 0, nextRetryTime: 0 })
  }
  return circuits.get(name)!
}

/**
 * Wrap an async function with a circuit breaker.
 *
 * @param name Unique circuit name (e.g. "gemini-proxy")
 * @param fn The async function to protect
 * @param fallback Fallback function to call when circuit is open
 */
export function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  fallback: () => T | Promise<T>,
): () => Promise<T> {
  return async () => {
    const circuit = getState(name)

    // Check if circuit should transition from open to half-open
    if (circuit.state === "open" && Date.now() >= circuit.nextRetryTime) {
      circuit.state = "half-open"
    }

    // Open circuit: return fallback immediately
    if (circuit.state === "open") {
      return fallback()
    }

    try {
      const result = await fn()
      // Success: reset circuit
      circuit.state = "closed"
      circuit.failureCount = 0
      return result
    } catch (err) {
      circuit.failureCount += 1
      circuit.lastFailureTime = Date.now()

      if (circuit.failureCount >= MAX_FAILURES) {
        circuit.state = "open"
        circuit.nextRetryTime = Date.now() + RECOVERY_TIME_MS
      }

      return fallback()
    }
  }
}

/** Reset a circuit breaker (for testing or manual recovery). */
export function resetCircuit(name: string): void {
  circuits.delete(name)
}

/** Get current circuit state (for monitoring/debugging). */
export function getCircuitState(name: string): CircuitState {
  const circuit = getState(name)
  if (circuit.state === "open" && Date.now() >= circuit.nextRetryTime) {
    return "half-open"
  }
  return circuit.state
}
