/**
 * News API Type Definitions
 * TypeScript interfaces for Currents API news integration
 */

export interface NewsArticle {
  id: string
  title: string
  description: string
  content: string
  url: string
  image: string
  publishedAt: string
  source: {
    id: string
    name: string
  }
  category: string[]
  country: string[]
  language: string
  relevanceScore: number
  relevanceTags: string[]
}

export interface NewsCache {
  articles: NewsArticle[]
  lastUpdated: number
  source: string
}

export interface NewsQuery {
  q: string[]
  language?: string[]
  country?: string[]
  category?: string[]
}

/**
 * Currents API Response Types
 */
export interface CurrentsApiNewsItem {
  id: string
  title: string
  description: string
  content: string
  url: string
  image: string
  published: string
  source: {
    id: string
    name: string
  }
  category: string[]
  country: string[]
  language: string
}

export interface CurrentsApiResponse {
  status: string
  total: number
  page: number
  pageSize: number
  news: CurrentsApiNewsItem[]
}

/**
 * API Response wrapper for news endpoints
 */
export interface NewsApiResponse {
  success: boolean
  data: {
    articles: NewsArticle[]
    count: number
    cached: boolean
    lastUpdated: number
  }
  timestamp: number
  error?: string
}
