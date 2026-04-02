/**
 * Economic Events API Endpoint
 * MacroView Pro - Institutional Trading Terminal
 * 
 * Returns economic events for the next 7 days with optional filtering.
 * Uses predefined event templates - real scraping would require external service.
 */

import { defineEventHandler, getQuery } from 'h3'
import type { RegionCode, ImpactLevel, EventsApiResponse } from '~/types/calendar'
import {
  getEventsForDateRange,
  filterEventsByRegion,
  filterEventsByImpact,
  groupEventsByDate,
  getVixInterpretation,
  getMarketSentiment
} from '../utils/events'

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 300000

// In-memory cache
let cachedEvents: ReturnType<typeof getEventsForDateRange> | null = null
let cacheTimestamp: number = 0

/**
 * Get or create cached events
 */
function getCachedEvents() {
  const now = Date.now()
  
  if (cachedEvents && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedEvents
  }
  
  // Generate events for the next 7 days starting from today
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  
  cachedEvents = getEventsForDateRange(startDate, 7)
  cacheTimestamp = now
  
  return cachedEvents
}

/**
 * GET /api/events
 * Returns economic events with optional filtering
 * 
 * Query Parameters:
 * - regions: comma-separated region codes (US,BR,EU)
 * - minImpact: minimum impact level (high,medium,low)
 * 
 * Response includes:
 * - events: filtered list of economic events
 * - vix: current VIX interpretation
 * - sentiment: market sentiment based on upcoming events
 * - groupedByDate: events organized by date
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  // Parse region filter
  let regions: RegionCode[] = []
  if (query.regions && typeof query.regions === 'string') {
    regions = query.regions.split(',').map(r => r.trim().toUpperCase()).filter(r => 
      ['US', 'BR', 'EU'].includes(r)
    ) as RegionCode[]
  }
  
  // Parse impact filter
  let minImpact: ImpactLevel | 'all' = 'all'
  if (query.minImpact && typeof query.minImpact === 'string') {
    const impact = query.minImpact.toLowerCase()
    if (['high', 'medium', 'low'].includes(impact)) {
      minImpact = impact as ImpactLevel
    }
  }
  
  // Get all events
  const allEvents = getCachedEvents()
  
  // Apply filters
  let filteredEvents = filterEventsByRegion(allEvents, regions)
  filteredEvents = filterEventsByImpact(filteredEvents, minImpact)
  
  // Get VIX interpretation (simulated)
  const vixValue = 18.5 + (Math.random() * 5)
  const vixInfo = getVixInterpretation(vixValue)
  
  // Get market sentiment
  const sentiment = getMarketSentiment(filteredEvents)
  
  // Group by date
  const groupedByDate: Record<string, typeof filteredEvents> = {}
  const grouped = groupEventsByDate(filteredEvents)
  grouped.forEach((events, dateKey) => {
    groupedByDate[dateKey] = events
  })
  
  // Build response
  const response: EventsApiResponse & {
    vix: typeof vixInfo
    sentiment: typeof sentiment
    groupedByDate: Record<string, typeof filteredEvents>
  } = {
    success: true,
    data: filteredEvents,
    timestamp: Date.now(),
    vix: vixInfo,
    sentiment: sentiment,
    groupedByDate: groupedByDate
  }
  
  return response
})
