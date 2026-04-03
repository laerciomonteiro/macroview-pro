/**
 * Client-Side News Scheduler Composable
 * Simplified to only run during market hours (7:00-12:00 BRT)
 * 
 * Market Hours: 7:00-12:00 BRT (Monday-Friday)
 * Polling Interval: 5 minutes during market hours
 * 
 * Usage:
 *   const { isScheduled, startScheduler, stopScheduler } = useNewsScheduler()
 */

import { ref, readonly } from 'vue'

/**
 * Check if currently within market hours (7:00-12:00 BRT, Monday-Friday)
 * BRT = UTC-3
 * @returns true if within market hours
 */
function isWithinMarketHours(): boolean {
  const now = new Date()
  const day = now.getUTCDay() // 0 = Sunday, 1 = Monday, etc.
  const hour = now.getUTCHours() - 3 // BRT (UTC-3)
  
  // Adjust hour for negative values (after midnight)
  const adjustedHour = (hour + 24) % 24
  
  // Check if weekday (Monday-Friday: 1-5)
  const isWeekday = day >= 1 && day <= 5
  
  // Only 7:00-12:00 BRT
  return isWeekday && adjustedHour >= 7 && adjustedHour < 12
}

/**
 * Get polling interval based on current time (BRT)
 * @returns Interval in milliseconds
 */
function getPollingInterval(): number {
  const withinMarketHours = isWithinMarketHours()
  
  // Only poll during market hours
  if (withinMarketHours) {
    return 5 * 60 * 1000 // 5 minutes during market hours
  }
  
  // Outside market hours - don't poll
  return 0
}

export const useNewsScheduler = () => {
  const isScheduled = ref(false)
  let intervalId: ReturnType<typeof setInterval> | null = null
  let lastRefresh = ref<number | null>(null)
  
  /**
   * Trigger a news refresh via API
   */
  const triggerRefresh = async () => {
    // Don't refresh outside market hours
    if (!isWithinMarketHours()) {
      console.log('[useNewsScheduler] Outside market hours - skipping refresh')
      return
    }
    
    const now = Date.now()
    
    // Skip if refreshed recently (within 1 minute)
    if (lastRefresh.value && now - lastRefresh.value < 60 * 1000) {
      console.log('[useNewsScheduler] Skipping refresh - refreshed recently')
      return
    }
    
    lastRefresh.value = now
    
    try {
      // Direct API call to trigger refresh
      await $fetch('/api/news/latest?refresh=true')
      
      console.log(`[useNewsScheduler] Refresh triggered at ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
    } catch (error: any) {
      console.error('[useNewsScheduler] Refresh failed:', error.message || error)
    }
  }
  
  /**
   * Start the scheduler
   */
  const startScheduler = () => {
    // Only run in browser
    if (!import.meta.client) return
    
    // Don't start if already running
    if (intervalId) {
      console.log('[useNewsScheduler] Already running')
      return
    }
    
    const interval = getPollingInterval()
    const inMarketHours = isWithinMarketHours()
    
    console.log(`[useNewsScheduler] Starting scheduler`)
    console.log(`[useNewsScheduler] In market hours: ${inMarketHours}, Interval: ${interval / 1000}s`)
    
    isScheduled.value = true
    
    // Initial fetch if within market hours
    if (inMarketHours) {
      triggerRefresh()
    }
    
    // Set up recurring refresh (only if there's an interval)
    if (interval > 0) {
      intervalId = setInterval(() => {
        const newInterval = getPollingInterval()
        
        // If we should no longer be polling
        if (newInterval === 0) {
          console.log('[useNewsScheduler] Left market hours - stopping scheduler')
          stopScheduler()
          return
        }
        
        // If interval changed, log it
        if (newInterval !== interval) {
          console.log(`[useNewsScheduler] Interval changed: ${newInterval / 1000}s`)
        }
        
        triggerRefresh()
      }, interval)
    }
  }
  
  /**
   * Stop the scheduler
   */
  const stopScheduler = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    isScheduled.value = false
    console.log('[useNewsScheduler] Stopped')
  }
  
  /**
   * Get current scheduler status
   */
  const getStatus = () => {
    return {
      isScheduled: isScheduled.value,
      inMarketHours: isWithinMarketHours(),
      interval: getPollingInterval(),
      lastRefresh: lastRefresh.value
    }
  }
  
  /**
   * Manually trigger a refresh
   */
  const refreshNow = () => {
    return triggerRefresh()
  }
  
  return {
    isScheduled: readonly(isScheduled),
    lastRefresh: readonly(lastRefresh),
    startScheduler,
    stopScheduler,
    getStatus,
    refreshNow,
    isWithinMarketHours
  }
}
