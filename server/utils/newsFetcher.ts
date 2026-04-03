/**
 * Currents API News Fetcher Utility
 * Fetches real-time news for WDO (USD/BRL) and WIN (Ibovespa) analysis
 */

import { createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import type { NewsArticle, CurrentsApiResponse, CurrentsApiNewsItem } from '~/types/news'

/**
 * Currents API base URL
 */
const CURRENTS_API_BASE_URL = 'https://api.currentsapi.services/v1'

/**
 * News queries for WDO (USD/BRL) related analysis
 * Focus on dollar, monetary policy, and Brazilian macro
 * NOTE: Using broader terms that actually return results from API
 */
export const WDO_QUERIES = [
  'dollar Brazil',
  'USD BRL',
  'Brazil currency',
  'Fed interest rate',
  'Selic rate'
] as const

/**
 * News queries for WIN (Ibovespa mini) related analysis
 * Focus on Brazilian equities and global risk sentiment
 * NOTE: Using broader terms that actually return results from API
 */
export const WIN_QUERIES = [
  'Brazil stocks',
  'Ibovespa',
  'Bovespa',
  'S&P 500',
  'mini indice',
  'VIX'
] as const

/**
 * Hot news keywords that warrant shorter cache TTL
 */
const HOT_NEWS_TAGS = ['FOMC', 'COPOM', 'Selic', 'monetary', 'FED', 'interest rate']

/**
 * Parse Currents API response item to NewsArticle format
 * @param item Raw API response item
 * @param relevanceScore Base relevance score (0.0 - 1.0)
 * @param relevanceTags Tags indicating relevance
 * @returns Normalized NewsArticle
 */
function parseNewsItem(
  item: CurrentsApiNewsItem,
  relevanceScore: number,
  relevanceTags: string[]
): NewsArticle {
  return {
    id: item.id || crypto.randomUUID(),
    title: item.title || '',
    description: item.description || '',
    content: item.content || '',
    url: item.url || '',
    image: item.image || '',
    publishedAt: item.published || new Date().toISOString(),
    source: {
      id: item.source?.id || 'unknown',
      name: item.source?.name || 'Unknown Source'
    },
    category: item.category || [],
    country: item.country || [],
    language: item.language || 'en',
    relevanceScore,
    relevanceTags
  }
}

/**
 * Calculate relevance score and tags based on query match
 * @param query The query that matched
 * @param allQueries All queries that were searched
 * @returns Object with score and tags
 */
function calculateRelevance(
  query: string,
  allQueries: readonly string[]
): { score: number; tags: string[] } {
  const tags: string[] = []
  let score = 0.5 // Base score

  // Determine if WDO or WIN query
  const isWdoQuery = WDO_QUERIES.includes(query as typeof WDO_QUERIES[number])
  const isWinQuery = WIN_QUERIES.includes(query as typeof WIN_QUERIES[number])

  if (isWdoQuery) {
    score = 1.0
    tags.push('WDO', 'USD/BRL')
  } else if (isWinQuery) {
    score = 0.9
    tags.push('WIN', 'Ibovespa')
  }

  // Check for hot news keywords
  const queryLower = query.toLowerCase()
  for (const hotTag of HOT_NEWS_TAGS) {
    if (queryLower.includes(hotTag.toLowerCase())) {
      tags.push('HOT', hotTag)
      score = Math.max(score, 1.0) // Hot news always highest
    }
  }

  return { score, tags }
}

/**
 * Fetch news articles for a specific query
 * @param query Search keywords
 * @param apiKey Currents API key
 * @returns Array of news articles
 */
export async function fetchNews(query: string, apiKey: string): Promise<NewsArticle[]> {
  const url = `${CURRENTS_API_BASE_URL}/search`
  
  try {
    const response = await $fetch<CurrentsApiResponse>(url, {
      method: 'GET',
      headers: {
        'Authorization': apiKey
      },
      query: {
        keywords: query,
        language: 'en',
        size: 20
      }
    })

    if (!response.news || !Array.isArray(response.news)) {
      console.warn(`[newsFetcher] No news results for query: ${query}`)
      return []
    }

    const { score, tags } = calculateRelevance(query, [...WDO_QUERIES, ...WIN_QUERIES])

    return response.news.map(item => parseNewsItem(item, score, tags))
  } catch (error: any) {
    console.error(`[newsFetcher] Error fetching news for "${query}":`, error.message || error)
    
    // Return empty array on error, let caller handle partial failures
    return []
  }
}

/**
 * Search latest news across all WDO and WIN queries
 * Combines, deduplicates, and sorts results
 * @returns Combined and sorted news articles
 */
export async function searchLatestNews(): Promise<NewsArticle[]> {
  // Try runtimeConfig first, fall back to process.env for server-side
  const config = useRuntimeConfig()
  const apiKey = (config.currentsApiKey as string) || process.env.CURRENTS_API_KEY
  
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'CURRENTS_API_KEY environment variable is not configured'
    })
  }

  // Combine all queries
  const allQueries = [...WDO_QUERIES, ...WIN_QUERIES]

  // Fetch news for all queries in parallel
  const results = await Promise.allSettled(
    allQueries.map(query => fetchNews(query, apiKey))
  )

  // Collect all articles and handle failures
  const allArticles: NewsArticle[] = []
  const failures: string[] = []

  results.forEach((result, index) => {
    const query = allQueries[index]
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value)
    } else {
      failures.push(query)
      console.warn(`[newsFetcher] Failed to fetch news for query: ${query}`)
    }
  })

  if (failures.length > 0) {
    console.warn(`[newsFetcher] Partial failures for queries: ${failures.join(', ')}`)
  }

  // Deduplicate articles by ID
  const seenIds = new Set<string>()
  const uniqueArticles = allArticles.filter(article => {
    if (seenIds.has(article.id)) {
      return false
    }
    seenIds.add(article.id)
    return true
  })

  // Sort by publishedAt descending (newest first)
  uniqueArticles.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime()
    const dateB = new Date(b.publishedAt).getTime()
    return dateB - dateA
  })

  return uniqueArticles
}

/**
 * Check if article contains hot news (warrants shorter cache TTL)
 * @param article News article to check
 * @returns true if hot news
 */
export function isHotNews(article: NewsArticle): boolean {
  const hotTags = ['HOT', 'FOMC', 'COPOM', 'Selic', 'monetary', 'FED', 'interest rate']
  return article.relevanceTags.some(tag => hotTags.includes(tag))
}
