/**
 * Redis/Upstash Utility with In-Memory Fallback
 * 
 * NOTE: Upstash implementation is commented out for future use.
 * Currently using only in-memory cache for development.
 * 
 * To re-enable Upstash:
 * 1. Uncomment the @upstash/redis import
 * 2. Uncomment the upstashRedisClient implementation
 * 3. Uncomment the Upstash initialization block below
 * 4. Ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set
 */

// import { Redis } from '@upstash/redis'

/**
 * Cache entry structure for in-memory fallback
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttlMs: number
}

/**
 * Redis client interface for consistent API
 */
interface RedisClient {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>
  del(key: string): Promise<void>
}

/**
 * In-memory cache store (module-level singleton)
 */
const memoryCache = new Map<string, CacheEntry<unknown>>()

/**
 * In-memory cache implementation
 */
const memoryRedisClient: RedisClient = {
  async get<T>(key: string): Promise<T | null> {
    const entry = memoryCache.get(key) as CacheEntry<T> | undefined
    
    if (!entry) {
      return null
    }
    
    const now = Date.now()
    const age = now - entry.timestamp
    
    if (age > entry.ttlMs) {
      memoryCache.delete(key)
      return null
    }
    
    return entry.data
  },
  
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    memoryCache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttlMs: ttlSeconds * 1000
    })
  },
  
  async del(key: string): Promise<void> {
    memoryCache.delete(key)
  }
}

/**
 * Upstash Redis client implementation
 * 
 * NOTE: Commented out - see module header for re-enabling instructions
 */
/*
const upstashRedisClient: RedisClient = {
  async get<T>(key: string): Promise<T | null> {
    const result = await redis.get<T>(key)
    return result
  },
  
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await redis.set(key, value, ttlSeconds)
  },
  
  async del(key: string): Promise<void> {
    await redis.del(key)
  }
}
*/

/**
 * Singleton Redis client instance
 * Uses Upstash if credentials available, otherwise falls back to in-memory cache
 * 
 * NOTE: Upstash initialization commented out - see module header for re-enabling
 */
let redis: RedisClient

// Check for Upstash credentials
// const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
// const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

// if (upstashUrl && upstashToken) {
//   // Initialize Upstash Redis client
//   redis = new Redis({
//     url: upstashUrl,
//     token: upstashToken
//   })
//   console.log('[redis] Using Upstash Redis (production mode)')
// } else {
  // Use in-memory fallback
  redis = memoryRedisClient
  console.log('[redis] Using in-memory cache (development mode)')
// }

/**
 * Get a value from cache
 * @param key Cache key
 * @returns Cached value or null if not found/expired
 */
export async function getCache<T>(key: string): Promise<T | null> {
  return redis.get<T>(key)
}

/**
 * Set a value in cache with TTL
 * @param key Cache key
 * @param value Data to cache
 * @param ttlSeconds Time to live in seconds
 */
export async function setCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  return redis.set(key, value, ttlSeconds)
}

/**
 * Delete a cache entry
 * @param key Cache key to delete
 */
export async function deleteCache(key: string): Promise<void> {
  return redis.del(key)
}

/**
 * Clear all in-memory cache entries (useful for testing)
 */
export function clearMemoryCache(): void {
  memoryCache.clear()
}

export { redis }
