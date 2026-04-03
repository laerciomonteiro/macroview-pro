/**
 * News Cache Service
 * Provides TTL-based caching for news articles with relevance-based expiration
 * 
 * NOTE: Server-side caching uses in-memory cache (see redis.ts)
 * For client-side caching, see composables/useNewsCache.ts which uses localStorage
 * 
 * Server cache TTL:
 *   - Hot news (monetary policy): 5 minutes
 *   - Regular news: 15 minutes
 * 
 * Client cache (localStorage):
 *   - TTL: 5 minutes to match server-side cache
 *   - Key: 'macroview_news_cache'
 */

import { redis, getCache, setCache, deleteCache } from './redis'
import type { NewsArticle, NewsCache } from '~/types/news'
import { isHotNews } from './newsFetcher'

/**
 * Cache key for latest news
 */
const NEWS_CACHE_KEY = 'news:latest'

/**
 * Cache TTL in seconds
 * Hot news (monetary policy) expires in 5 minutes
 * Regular news expires in 15 minutes
 */
const HOT_NEWS_TTL = 300  // 5 minutes
const REGULAR_NEWS_TTL = 900  // 15 minutes

/**
 * Get cached news articles if available and not expired
 * @returns Cached articles with metadata or null if cache miss/expired
 */
export async function getCachedNews(): Promise<NewsArticle[] | null> {
  try {
    const cached = await getCache<NewsCache>(NEWS_CACHE_KEY)
    
    if (!cached) {
      return null
    }

    // Check if cache is still valid based on TTL
    const now = Date.now()
    const cacheAge = (now - cached.lastUpdated) / 1000 // Convert to seconds

    // Determine if cache is still valid based on the lowest TTL that might be in the batch
    // Since different articles can have different TTLs, we use the shortest (HOT_NEWS_TTL)
    // as the overall cache validity window
    const isValid = cacheAge < HOT_NEWS_TTL

    if (!isValid) {
      console.log(`[newsCache] Cache expired (age: ${cacheAge}s)`)
      await invalidateCache()
      return null
    }

    console.log(`[newsCache] Cache hit (age: ${cacheAge}s, articles: ${cached.articles.length})`)
    return cached.articles
  } catch (error: any) {
    console.error('[newsCache] Error getting cached news:', error.message || error)
    return null
  }
}

/**
 * Cache news articles with appropriate TTL based on relevance
 * @param articles Array of news articles to cache
 */
export async function setCachedNews(articles: NewsArticle[]): Promise<void> {
  if (articles.length === 0) {
    console.log('[newsCache] No articles to cache')
    return
  }

  try {
    // Determine TTL based on whether any article is hot news
    const hasHotNews = articles.some(article => isHotNews(article))
    const ttl = hasHotNews ? HOT_NEWS_TTL : REGULAR_NEWS_TTL

    const cacheData: NewsCache = {
      articles,
      lastUpdated: Date.now(),
      source: 'currents-api'
    }

    await setCache(NEWS_CACHE_KEY, cacheData, ttl)
    
    console.log(`[newsCache] Cached ${articles.length} articles (TTL: ${ttl}s, hot: ${hasHotNews})`)
  } catch (error: any) {
    console.error('[newsCache] Error setting cached news:', error.message || error)
  }
}

/**
 * Invalidate (clear) the news cache
 */
export async function invalidateCache(): Promise<void> {
  try {
    await deleteCache(NEWS_CACHE_KEY)
    console.log('[newsCache] Cache invalidated')
  } catch (error: any) {
    console.error('[newsCache] Error invalidating cache:', error.message || error)
  }
}

/**
 * Get cache metadata for debugging/monitoring
 * @returns Cache metadata or null if not cached
 */
export async function getCacheMetadata(): Promise<{ age: number; ttl: number; count: number } | null> {
  try {
    const cached = await getCache<NewsCache>(NEWS_CACHE_KEY)
    
    if (!cached) {
      return null
    }

    const now = Date.now()
    const age = Math.floor((now - cached.lastUpdated) / 1000)

    return {
      age,
      ttl: HOT_NEWS_TTL, // Use shortest TTL for metadata
      count: cached.articles.length
    }
  } catch (error: any) {
    console.error('[newsCache] Error getting cache metadata:', error.message || error)
    return null
  }
}

export { NEWS_CACHE_KEY, HOT_NEWS_TTL, REGULAR_NEWS_TTL }
