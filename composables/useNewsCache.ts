/**
 * Client-Side News Cache Composable
 * Provides localStorage-based caching for news in the browser
 * 
 * Cache Configuration:
 *   - Key: 'macroview_news_cache'
 *   - TTL: 5 minutes (300000ms) - matches server-side cache TTL
 *   - Storage: Browser's localStorage (client-only)
 * 
 * Usage:
 *   const { getCached, setCached, clearCache } = useNewsCache()
 */

import type { NewsApiResponse } from '~/types/news'

export const useNewsCache = () => {
  const CACHE_KEY = 'macroview_news_cache'
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

  /**
   * Get cached news from localStorage
   * @returns Cached NewsApiResponse or null if not found/expired
   */
  const getCached = (): NewsApiResponse | null => {
    // Only run in browser environment
    if (!import.meta.client) return null

    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null

      const { data, timestamp } = JSON.parse(cached) as {
        data: NewsApiResponse
        timestamp: number
      }

      const isExpired = Date.now() - timestamp > CACHE_TTL

      if (isExpired) {
        localStorage.removeItem(CACHE_KEY)
        return null
      }

      return data
    } catch {
      // localStorage unavailable or corrupted data
      return null
    }
  }

  /**
   * Set news in localStorage cache
   * @param data - NewsApiResponse to cache
   */
  const setCached = (data: NewsApiResponse): void => {
    // Only run in browser environment
    if (!import.meta.client) return

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch {
      // localStorage full or unavailable - silently fail
    }
  }

  /**
   * Clear the news cache from localStorage
   */
  const clearCache = (): void => {
    // Only run in browser environment
    if (!import.meta.client) return
    localStorage.removeItem(CACHE_KEY)
  }

  return {
    getCached,
    setCached,
    clearCache
  }
}
