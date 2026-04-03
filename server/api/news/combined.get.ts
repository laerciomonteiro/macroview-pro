/**
 * Combined News API Endpoint
 * GET /api/news/combined
 * 
 * Fetches news from both Currents (primary) and Guardian (secondary) sources
 * Combines, deduplicates, and sorts by relevance score
 * 
 * Query params:
 *   - refresh: boolean (optional) - If 'true', bypass cache and fetch fresh
 * 
 * Response:
 *   - success: boolean
 *   - data: {
 *       articles: NewsArticle[],
 *       count: number,
 *       sources: { currents: number, guardian: number },
 *       cached: boolean,
 *       lastUpdated: number
 *     }
 *   - timestamp: number
 */

import { defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { searchLatestNews } from '../../utils/newsFetcher'
import { fetchGuardianNews } from '../../utils/guardianFetcher'
import { getCachedNews, setCachedNews, invalidateCache } from '../../utils/newsCache'
import { setCacheHeaders } from '../../utils/cache'
import type { NewsApiResponse, NewsArticle } from '~/types/news'

/**
 * Calculate title similarity for deduplication
 * Uses simple word overlap approach
 * @param title1 First article title
 * @param title2 Second article title
 * @returns Similarity score 0-1
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  // Normalize titles to lowercase and split into words
  const words1 = new Set(title1.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  const words2 = new Set(title2.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  
  // If either title is too short, return 0
  if (words1.size < 2 || words2.size < 2) {
    return 0
  }
  
  // Count overlapping words
  let overlap = 0
  for (const word of words1) {
    if (words2.has(word)) {
      overlap++
    }
  }
  
  // Calculate Jaccard-like similarity
  const union = new Set([...words1, ...words2]).size
  return overlap / union
}

/**
 * Deduplicate articles by title similarity
 * Articles with similarity > 0.5 are considered duplicates
 * @param articles Array of articles to deduplicate
 * @returns Deduplicated array
 */
function deduplicateByTitle(articles: NewsArticle[]): NewsArticle[] {
  const seen: NewsArticle[] = []
  const SIMILARITY_THRESHOLD = 0.5
  
  for (const article of articles) {
    let isDuplicate = false
    
    for (const existing of seen) {
      const similarity = calculateTitleSimilarity(article.title, existing.title)
      if (similarity > SIMILARITY_THRESHOLD) {
        // Keep the one with higher relevance score
        if (article.relevanceScore > existing.relevanceScore) {
          // Replace the existing with this one
          const index = seen.indexOf(existing)
          seen[index] = article
          isDuplicate = true
          break
        } else {
          isDuplicate = true
          break
        }
      }
    }
    
    if (!isDuplicate) {
      seen.push(article)
    }
  }
  
  return seen
}

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
 * GET /api/news/combined
 * Returns combined news from Currents and Guardian sources
 */
export default defineEventHandler(async (event): Promise<NewsApiResponse> => {
  // Set cache headers (5 minutes)
  setCacheHeaders(event, 300)
  
  const query = getQuery(event)
  const forceRefresh = query.refresh === 'true'

  try {
    // Check if we should bypass cache
    if (forceRefresh) {
      console.log('[/api/news/combined] Force refresh requested')
      await invalidateCache()
    }

    // Try to get cached news first (unless refresh requested)
    let articles = await getCachedNews()
    let cached = true
    let lastUpdated = 0

    if (articles === null) {
      // Cache miss or refresh - fetch fresh news from both sources
      console.log('[/api/news/combined] Cache miss, fetching fresh news from both sources')
      
      // Fetch from both sources in parallel
      const [currentsResult, guardianResult] = await Promise.allSettled([
        searchLatestNews(),
        fetchGuardianNews()
      ])
      
      let currentsCount = 0
      let guardianCount = 0
      
      // Collect all articles
      const allArticles: NewsArticle[] = []
      
      // Handle Currents results
      if (currentsResult.status === 'fulfilled') {
        currentsCount = currentsResult.value.length
        allArticles.push(...currentsResult.value)
        console.log(`[/api/news/combined] Currents: ${currentsCount} articles`)
      } else {
        console.warn('[/api/news/combined] Currents fetch failed:', currentsResult.reason)
      }
      
      // Handle Guardian results
      if (guardianResult.status === 'fulfilled') {
        guardianCount = guardianResult.value.length
        allArticles.push(...guardianResult.value)
        console.log(`[/api/news/combined] Guardian: ${guardianCount} articles`)
      } else {
        console.warn('[/api/news/combined] Guardian fetch failed:', guardianResult.reason)
      }
      
      // Log source counts before deduplication
      console.log(`[/api/news/combined] Total before deduplication: ${allArticles.length}`)
      
      // Deduplicate by title similarity
      const uniqueArticles = deduplicateByTitle(allArticles)
      
      console.log(`[/api/news/combined] Total after deduplication: ${uniqueArticles.length}`)
      
      // Sort by relevance score, then by date
      const sortedArticles = uniqueArticles.sort((a, b) => {
        // First by relevance score (descending)
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore
        }
        // Then by date (descending)
        const dateA = new Date(a.publishedAt).getTime()
        const dateB = new Date(b.publishedAt).getTime()
        return dateB - dateA
      })
      
      articles = sortedArticles
      
      // Cache the combined results
      if (articles.length > 0) {
        await setCachedNews(articles)
      }
      
      cached = false
      lastUpdated = Date.now()
    } else {
      // Use cached data
      lastUpdated = Date.now()
      console.log(`[/api/news/combined] Cache hit, returning ${articles.length} articles`)
    }

    // Return top 50 articles
    const topArticles = articles.slice(0, 50)

    const response: NewsApiResponse = {
      success: true,
      data: {
        articles: topArticles,
        count: topArticles.length,
        cached,
        lastUpdated
      },
      timestamp: Date.now()
    }

    // Add ETag header for browser cache validation
    const etag = generateETag(response)
    setResponseHeader(event, 'ETag', etag)

    return response
  } catch (error: any) {
    console.error('[/api/news/combined] Error:', error)

    throw {
      success: false,
      data: {
        articles: [],
        count: 0,
        cached: false,
        lastUpdated: 0
      },
      timestamp: Date.now(),
      error: error.message || 'Failed to fetch combined news'
    }
  }
})
