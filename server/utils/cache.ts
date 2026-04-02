/**
 * In-Memory Cache Utility with TTL Support
 * Provides caching functionality for API responses to avoid rate limits
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

/**
 * In-memory cache store (module-level singleton)
 */
const cacheStore = new Map<string, CacheEntry<unknown>>()

/**
 * Get a value from cache if it exists and is not expired
 * @param key Cache key
 * @returns Cached value or null if not found/expired
 */
export function getFromCache<T>(key: string): T | null {
  const entry = cacheStore.get(key) as CacheEntry<T> | undefined
  
  if (!entry) {
    return null
  }
  
  const now = Date.now()
  const age = now - entry.timestamp
  
  if (age > entry.ttl) {
    // Entry expired, remove it
    cacheStore.delete(key)
    return null
  }
  
  return entry.data
}

/**
 * Set a value in cache with TTL
 * @param key Cache key
 * @param data Data to cache
 * @param ttl Time to live in milliseconds (default: 60000 = 60 seconds)
 */
export function setCache<T>(key: string, data: T, ttl: number = 60000): void {
  cacheStore.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  })
}

/**
 * Clear a specific cache entry
 * @param key Cache key to clear
 */
export function clearCache(key: string): void {
  cacheStore.delete(key)
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  cacheStore.clear()
}

/**
 * Check if a cache entry exists and is valid
 * @param key Cache key
 * @returns true if valid cache entry exists
 */
export function isCacheValid(key: string): boolean {
  return getFromCache(key) !== null
}

/**
 * Get cache metadata (age and TTL remaining)
 * @param key Cache key
 * @returns Object with age and remaining TTL, or null if not found
 */
export function getCacheMetadata(key: string): { age: number; remaining: number } | null {
  const entry = cacheStore.get(key)
  
  if (!entry) {
    return null
  }
  
  const now = Date.now()
  const age = now - entry.timestamp
  const remaining = Math.max(0, entry.ttl - age)
  
  return { age, remaining }
}

/**
 * Wrap a data fetcher with caching
 * @param key Cache key
 * @param fetcher Async function to fetch data
 * @param ttl Time to live in milliseconds (default: 60000 = 60 seconds)
 * @returns Cached or freshly fetched data
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 60000
): Promise<T> {
  // Try to get from cache first
  const cached = getFromCache<T>(key)
  
  if (cached !== null) {
    return cached
  }
  
  // Fetch fresh data
  const data = await fetcher()
  
  // Store in cache
  setCache(key, data, ttl)
  
  return data
}

/**
 * Create a cached fetch function with automatic response header设置
 * @param keyPrefix Prefix for cache keys
 * @param ttl Time to live in milliseconds
 * @returns Function that fetches and caches data
 */
export function createCachedFetcher<T>(
  keyPrefix: string,
  ttl: number = 60000
) {
  return async (
    keySuffix: string,
    fetcher: () => Promise<T>
  ): Promise<T> => {
    const cacheKey = `${keyPrefix}:${keySuffix}`
    return withCache(cacheKey, fetcher, ttl)
  }
}

/**
 * Set cache headers on response
 * @param event H3 event handler event
 * @param ttl Time to live in seconds (will be used for max-age)
 */
export function setCacheHeaders(event: any, ttl: number = 60): void {
  if (event) {
    event.node.res.setHeader('Cache-Control', `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=${ttl}`)
    event.node.res.setHeader('X-Cache-TTL', ttl.toString())
  }
}

/**
 * Set no-cache headers on response
 */
export function setNoCacheHeaders(event: any): void {
  if (event) {
    event.node.res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    event.node.res.setHeader('Pragma', 'no-cache')
    event.node.res.setHeader('Expires', '0')
  }
}
