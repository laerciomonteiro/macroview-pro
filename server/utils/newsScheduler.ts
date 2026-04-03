/**
 * News Background Job Scheduler
 * Simplified to only run during market hours (7:00-12:00 BRT)
 * 
 * BRT (Brasília Time) = UTC-3
 * Market Hours: 7:00-12:00 BRT (10:00-15:00 UTC)
 * Days: Monday to Friday
 */

import { searchLatestNews } from './newsFetcher'
import { fetchGuardianNews } from './guardianFetcher'
import { setCachedNews, invalidateCache } from './newsCache'

/**
 * Scheduler interval during market hours (5 minutes)
 */
const SCHEDULER_INTERVAL = 5 * 60 * 1000 // 5 minutes

/**
 * Check if scheduler should run (only during 7:00-12:00 BRT, Monday-Friday)
 * @returns true if current time is within market hours
 */
export function shouldRunScheduler(): boolean {
  const now = new Date()
  const day = now.getUTCDay() // 0 = Sunday, 1 = Monday, etc.
  const hour = now.getUTCHours()
  const minute = now.getUTCMinutes()
  // BRT = UTC-3, but we work in UTC and convert
  const brtHour = hour - 3
  
  // Weekend: don't run
  if (day === 0 || day === 6) return false
  
  // Only 7:00-12:00 BRT (10:00-15:00 UTC)
  // 7:00 BRT = 10:00 UTC
  // 12:00 BRT = 15:00 UTC
  const currentMinutes = brtHour * 60 + minute
  const startMinutes = 7 * 60  // 7:00 BRT
  const endMinutes = 12 * 60   // 12:00 BRT
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

/**
 * Background fetch function - fetches news from all sources and updates cache
 * Called automatically by the scheduler
 */
export async function backgroundFetch(): Promise<{
  currents: number
  guardian: number
  total: number
  scheduled: boolean
}> {
  const scheduled = shouldRunScheduler()
  
  console.log(`[newsScheduler] Background fetch starting... Scheduled: ${scheduled}`)
  
  // Don't fetch outside market hours - just return
  if (!scheduled) {
    return { currents: 0, guardian: 0, total: 0, scheduled: false }
  }
  
  try {
    // Fetch from both sources in parallel
    const [currentsNews, guardianNews] = await Promise.allSettled([
      searchLatestNews(),
      fetchGuardianNews()
    ])
    
    let currentsCount = 0
    let guardianCount = 0
    let allArticles: import('~/types/news').NewsArticle[] = []
    
    // Handle Currents results
    if (currentsNews.status === 'fulfilled') {
      currentsCount = currentsNews.value.length
      allArticles.push(...currentsNews.value)
      console.log(`[newsScheduler] Currents: ${currentsCount} articles`)
    } else {
      console.warn(`[newsScheduler] Currents fetch failed:`, currentsNews.reason)
    }
    
    // Handle Guardian results
    if (guardianNews.status === 'fulfilled') {
      guardianCount = guardianNews.value.length
      allArticles.push(...guardianNews.value)
      console.log(`[newsScheduler] Guardian: ${guardianCount} articles`)
    } else {
      console.warn(`[newsScheduler] Guardian fetch failed:`, guardianNews.reason)
    }
    
    // Deduplicate by URL
    const seenUrls = new Set<string>()
    const uniqueArticles = allArticles.filter(article => {
      if (seenUrls.has(article.url)) {
        return false
      }
      seenUrls.add(article.url)
      return true
    })
    
    // Sort by relevance score, then by date
    uniqueArticles.sort((a, b) => {
      // First by relevance score (descending)
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore
      }
      // Then by date (descending)
      const dateA = new Date(a.publishedAt).getTime()
      const dateB = new Date(b.publishedAt).getTime()
      return dateB - dateA
    })
    
    // Update cache with deduplicated, sorted articles
    if (uniqueArticles.length > 0) {
      await setCachedNews(uniqueArticles)
      console.log(`[newsScheduler] Cache updated with ${uniqueArticles.length} unique articles`)
    }
    
    return {
      currents: currentsCount,
      guardian: guardianCount,
      total: uniqueArticles.length,
      scheduled: true
    }
  } catch (error: any) {
    console.error('[newsScheduler] Background fetch error:', error.message || error)
    
    // Invalidate cache on error to prevent stale data
    await invalidateCache()
    
    throw error
  }
}

// In-memory scheduler state (survives within server process)
let schedulerIntervalId: ReturnType<typeof setInterval> | null = null
let lastFetchTime: number = 0
let isSchedulerRunning: boolean = false

/**
 * Start the background news scheduler
 * Should be called once when the server starts
 */
export function startNewsScheduler(): void {
  if (isSchedulerRunning) {
    console.log('[newsScheduler] Already running')
    return
  }
  
  console.log(`[newsScheduler] Starting scheduler with ${SCHEDULER_INTERVAL / 1000}s interval`)
  console.log(`[newsScheduler] Market hours: 7:00-12:00 BRT (Monday-Friday)`)
  
  isSchedulerRunning = true
  lastFetchTime = Date.now()
  
  // Initial fetch
  backgroundFetch().catch(err => {
    console.error('[newsScheduler] Initial fetch failed:', err)
  })
  
  // Set up recurring fetch
  schedulerIntervalId = setInterval(async () => {
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetchTime
    
    // Skip if we fetched recently (within 1 minute)
    if (timeSinceLastFetch < 60 * 1000) {
      console.log('[newsScheduler] Skipping fetch - fetched recently')
      return
    }
    
    // Check if we're still within market hours
    const shouldRun = shouldRunScheduler()
    if (!shouldRun) {
      console.log('[newsScheduler] Outside market hours - skipping')
      return
    }
    
    lastFetchTime = now
    
    try {
      await backgroundFetch()
    } catch (error: any) {
      console.error('[newsScheduler] Scheduled fetch failed:', error.message || error)
    }
  }, SCHEDULER_INTERVAL)
}

/**
 * Stop the background news scheduler
 */
export function stopNewsScheduler(): void {
  if (schedulerIntervalId) {
    clearInterval(schedulerIntervalId)
    schedulerIntervalId = null
  }
  isSchedulerRunning = false
  console.log('[newsScheduler] Stopped')
}

/**
 * Check if the scheduler is currently running
 */
export function isNewsSchedulerRunning(): boolean {
  return isSchedulerRunning
}

/**
 * Get scheduler status information
 */
export function getSchedulerStatus(): {
  running: boolean
  inMarketHours: boolean
  interval: number
  lastFetch: number | null
} {
  return {
    running: isSchedulerRunning,
    inMarketHours: shouldRunScheduler(),
    interval: SCHEDULER_INTERVAL,
    lastFetch: lastFetchTime || null
  }
}
