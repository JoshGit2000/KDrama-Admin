/**
 * lib/cache.ts
 *
 * Lightweight server-side in-memory cache for Firestore collections.
 *
 * Lives in the Next.js Node.js process — shared across all API route
 * invocations on the same server instance (the normal case in dev and
 * on a single Vercel instance / self-hosted server).
 *
 * Strategy:
 *  - GET  → return cached data if still fresh; otherwise fetch & cache.
 *  - POST/PUT/DELETE → write to Firestore, then invalidate the relevant key.
 *
 * TTL (5 min) is a safety net only.  Explicit invalidation on every write
 * is what keeps reads near-zero.
 */

const TTL_MS = 5 * 60 * 1000 // 5 minutes

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

// Module-level map — persists for the lifetime of the Node.js process.
const store = new Map<string, CacheEntry<unknown>>()

/**
 * Read a value from the cache.
 * Returns `null` when the entry is missing or has expired.
 */
export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  console.log(`[CACHE HIT]  key="${key}"`)
  return entry.data
}

/**
 * Write a value into the cache with the default TTL.
 */
export function cacheSet<T>(key: string, data: T): void {
  store.set(key, { data, expiresAt: Date.now() + TTL_MS })
  console.log(`[CACHE SET]  key="${key}"`)
}

/**
 * Remove one or more keys from the cache (e.g. after a mutation).
 * Accepts a single key or an array of keys.
 */
export function cacheInvalidate(keys: string | string[]): void {
  const targets = Array.isArray(keys) ? keys : [keys]
  for (const key of targets) {
    store.delete(key)
    console.log(`[CACHE BUST] key="${key}"`)
  }
}

// ── Stable key constants ────────────────────────────────────────────────────

export const CACHE_KEY_DRAMAS  = 'dramas'
export const CACHE_KEY_MOVIES  = 'movies'
