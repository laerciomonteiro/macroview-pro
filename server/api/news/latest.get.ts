/**
 * Latest News API Endpoint
 * GET /api/news/latest
 * Returns latest WDO and WIN related news with caching
 * 
 * Response Headers:
 *   - Cache-Control: public, max-age=300
 *   - ETag: Strong validator for cache refresh
 *   - Last-Modified: Timestamp of last modification
 */

import { defineEventHandler, getQuery, createError, setResponseHeader } from 'h3'
import { searchLatestNews } from '../../utils/newsFetcher'
import { getCachedNews, setCachedNews, invalidateCache } from '../../utils/newsCache'
import { setCacheHeaders } from '../../utils/cache'
import type { NewsApiResponse } from '~/types/news'

/**
 * Generate a simple ETag from data
 */
function generateETag(data: unknown): string {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return `"${Math.abs(hash).toString(16)}"`
}

/**
 * GET /api/news/latest
 * Query params:
 *   - refresh: boolean (optional) - If 'true', bypass cache and fetch fresh
 * 
 * Response:
 *   - success: boolean
 *   - data: { articles, count, cached, lastUpdated }
 *   - timestamp: number
 */
export default defineEventHandler(async (event): Promise<NewsApiResponse> => {
  // Set cache headers (5 minutes)
  setCacheHeaders(event, 300)
  
  const query = getQuery(event)
  const forceRefresh = query.refresh === 'true'

  try {
    // Check if we should bypass cache
    if (forceRefresh) {
      console.log('[/api/news/latest] Force refresh requested')
      await invalidateCache()
    }

    // Try to get cached news first (unless refresh requested)
    let articles = await getCachedNews()
    let cached = true
    let lastUpdated = 0

    if (articles === null) {
      // Cache miss or refresh - fetch fresh news
      console.log('[/api/news/latest] Cache miss, fetching fresh news')
      articles = await searchLatestNews()
      
      if (articles.length > 0) {
        await setCachedNews(articles)
      }
      
      cached = false
      lastUpdated = Date.now()
    } else {
      // Use cached data
      lastUpdated = Date.now() // Could store actual cache timestamp
      console.log(`[/api/news/latest] Cache hit, returning ${articles.length} articles`)
    }

    const response: NewsApiResponse = {
      success: true,
      data: {
        articles,
        count: articles.length,
        cached,
        lastUpdated
      },
      timestamp: Date.now()
    }

    // Add ETag and Last-Modified headers for browser cache validation
    const etag = generateETag(response)
    const lastModified = new Date(lastUpdated || Date.now()).toUTCString()
    setResponseHeader(event, 'ETag', etag)
    setResponseHeader(event, 'Last-Modified', lastModified)

    return response
  } catch (error: any) {
    console.error('[/api/news/latest] Error:', error)

    // Handle specific error types
    if (error.statusCode) {
      throw error
    }

    // Check for missing API key error
    if (error.message?.includes('CURRENTS_API_KEY')) {
      throw createError({
        statusCode: 500,
        statusMessage: 'News API key not configured. Please set CURRENTS_API_KEY in environment.'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch news: ${error.message || 'Unknown error'}`
    })
  }
})
