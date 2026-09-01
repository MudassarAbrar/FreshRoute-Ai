/**
 * Global test setup for Vitest.
 *
 * - Mocks localStorage for rate limiter tests
 * - Provides test environment globals
 */

// Mock localStorage for tests that need it (rate limiter)
// In node environment, localStorage doesn't exist natively
if (typeof globalThis.localStorage === "undefined") {
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        store = {}
      },
      get length() {
        return Object.keys(store).length
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
    }
  })()

  Object.defineProperty(globalThis, "localStorage", { value: localStorageMock })
}
