/**
 * Guardian API News Fetcher Utility
 * Secondary news source for business and economics sections
 * 
 * Guardian API Details:
 *   - Base URL: https://content.guardianapis.com
 *   - Free tier: 500 req/day, 1 req/sec
 *   - Requires API key from process.env.GUARDIAN_API_KEY
 *   - Sections: business, economics
 *   - Response format: JSON
 */

import { useRuntimeConfig } from '#imports'
import type { NewsArticle } from '~/types/news'

/**
 * Guardian API base URL
 */
const GUARDIAN_API_BASE_URL = 'https://content.guardianapis.com'

/**
 * Guardian API response types
 */
export interface GuardianApiResponse {
  response: {
    status: string
    total: number
    startIndex: number
    pageSize: number
    currentPage: number
    pages: number
    results: GuardianArticle[]
  }
}

export interface GuardianArticle {
  id: string
  webTitle: string
  webPublicationDate: string
  sectionId: string
  webUrl: string
  apiUrl: string
  fields?: {
    headline?: string
    trailText?: string
    byline?: string
    thumbnail?: string
    wordcount?: string
  }
}

/**
 * News queries for Guardian API
 * Focus on macroeconomics and dollar-related news
 */
export const GUARDIAN_QUERIES = [
  'Brazil dollar',
  'USD BRL',
  'Brazil inflation',
  'Fed interest rate',
  'Brazil central bank'
] as const

/**
 * Sections to search
 */
const GUARDIAN_SECTIONS = ['business', 'economics'] as const

/**
 * Parse Guardian API response article to NewsArticle format
 * @param item Raw Guardian API article
 * @param relevanceScore Base relevance score (0.0 - 1.0)
 * @param relevanceTags Tags indicating relevance
 * @returns Normalized NewsArticle
 */
function parseGuardianArticle(
  item: GuardianArticle,
  relevanceScore: number,
  relevanceTags: string[]
): NewsArticle {
  return {
    id: item.id || crypto.randomUUID(),
    title: item.webTitle || '',
    description: item.fields?.trailText || '',
    content: item.fields?.headline || item.fields?.trailText || '',
    url: item.webUrl || '',
    image: item.fields?.thumbnail || '',
    publishedAt: item.webPublicationDate || new Date().toISOString(),
    source: {
      id: 'guardian',
      name: 'The Guardian'
    },
    category: [item.sectionId].filter(Boolean),
    country: ['brazil', 'us'].filter(Boolean),
    language: 'en',
    relevanceScore,
    relevanceTags
  }
}

/**
 * Calculate relevance score based on query match
 * @param query The query that matched
 * @returns Object with score and tags
 */
function calculateRelevance(query: string): { score: number; tags: string[] } {
  const tags: string[] = ['GUARDIAN']
  let score = 0.7 // Base score for Guardian (secondary source)

  // Boost for Brazil-related queries
  if (query.toLowerCase().includes('brazil')) {
    score = 0.85
    tags.push('BRAZIL', 'USD/BRL')
  }

  // Boost for Fed/monetary policy
  if (query.toLowerCase().includes('fed') || query.toLowerCase().includes('inflation')) {
    score = 0.9
    tags.push('MACRO')
  }

  return { score, tags }
}

/**
 * Fetch news from Guardian API for a specific query
 * @param query Search keywords
 * @param apiKey Guardian API key
 * @returns Array of news articles
 */
export async function fetchGuardianByQuery(
  query: string,
  apiKey: string
): Promise<NewsArticle[]> {
  try {
    // Build query string with section filter
    const sectionQuery = GUARDIAN_SECTIONS.join('|')
    
    const response = await $fetch<GuardianApiResponse>(`${GUARDIAN_API_BASE_URL}/search`, {
      method: 'GET',
      query: {
        'api-key': apiKey,
        'section': sectionQuery,
        'q': query,
        'page-size': 15,
        'order-by': 'relevance',
        'show-fields': 'headline,trailText,byline,thumbnail,wordcount'
      }
    })

    if (!response.response?.results || !Array.isArray(response.response.results)) {
      console.warn(`[guardianFetcher] No results for query: ${query}`)
      return []
    }

    const { score, tags } = calculateRelevance(query)

    return response.response.results.map(item => parseGuardianArticle(item, score, tags))
  } catch (error: any) {
    console.error(`[guardianFetcher] Error fetching news for "${query}":`, error.message || error)
    return []
  }
}

/**
 * Fetch Guardian news for all predefined queries
 * @returns Combined and sorted news articles
 */
export async function fetchGuardianNews(): Promise<NewsArticle[]> {
  // Try runtimeConfig first, fall back to process.env for server-side
  const config = useRuntimeConfig()
  const apiKey = (config.guardianApiKey as string) || process.env.GUARDIAN_API_KEY

  // If no API key, return empty array (graceful degradation)
  if (!apiKey) {
    console.warn('[guardianFetcher] GUARDIAN_API_KEY not configured - Guardian source disabled')
    return []
  }

  // Fetch news for all queries in parallel
  const results = await Promise.allSettled(
    GUARDIAN_QUERIES.map(query => fetchGuardianByQuery(query, apiKey))
  )

  // Collect all articles and handle failures
  const allArticles: NewsArticle[] = []
  const failures: string[] = []

  results.forEach((result, index) => {
    const query = GUARDIAN_QUERIES[index]
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value)
    } else {
      failures.push(query)
      console.warn(`[guardianFetcher] Failed to fetch news for query: ${query}`)
    }
  })

  if (failures.length > 0) {
    console.warn(`[guardianFetcher] Partial failures for queries: ${failures.join(', ')}`)
  }

  // Deduplicate articles by URL
  const seenUrls = new Set<string>()
  const uniqueArticles = allArticles.filter(article => {
    if (seenUrls.has(article.url)) {
      return false
    }
    seenUrls.add(article.url)
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
 * Search Guardian API for a specific keyword
 * @param keyword Search keyword
 * @returns Array of news articles
 */
export async function searchGuardian(keyword: string): Promise<NewsArticle[]> {
  const config = useRuntimeConfig()
  const apiKey = (config.guardianApiKey as string) || process.env.GUARDIAN_API_KEY

  if (!apiKey) {
    console.warn('[guardianFetcher] GUARDIAN_API_KEY not configured')
    return []
  }

  const results = await fetchGuardianByQuery(keyword, apiKey)
  return results
}
