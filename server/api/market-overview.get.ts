/**
 * Market Overview API Endpoint
 * Consolidated endpoint that fetches data from all market data sources
 * Uses Promise.allSettled() to handle partial failures gracefully
 * Cached for 60 seconds
 */

import { defineEventHandler, createError } from 'h3'
import type { ApiResponse, MarketOverview } from '../types/market'
import { setCacheHeaders } from '../utils/cache'
import { getCachedMarketOverview } from '../utils/marketData'

/**
 * GET /api/market-overview
 * Returns consolidated market data from all sources
 * 
 * Response includes:
 * - Currencies: USD-BRL, EUR-BRL from AwesomeAPI
 * - Risk Indicators: VIX, DXY from Yahoo Finance
 * - Commodities: Brent Crude, Gold from Yahoo Finance
 * - Brazil Flow: EWZ ETF from Yahoo Finance
 * - Treasuries: 10yr and 5yr yields from Yahoo Finance
 * 
 * Note: Uses Promise.allSettled - partial failures result in empty/default data
 */
export default defineEventHandler(async (event) => {
  // Set cache headers (60 seconds)
  setCacheHeaders(event, 60)
  
  try {
    // Use shared cached function from marketData service
    const marketData = await getCachedMarketOverview()
    
    if (!marketData) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Failed to fetch market overview data'
      })
    }
    
    const response: ApiResponse<MarketOverview> = {
      success: true,
      data: marketData,
      source: 'consolidated',
      timestamp: Date.now()
    }
    
    return response
  } catch (error: any) {
    console.error('[/api/market-overview] Error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Internal server error: ${error.message || 'Unknown error'}`
    })
  }
})
