/**
 * Treasuries API Endpoint
 * Fetches 10-year (^TNX) and 5-year (^FVX) Treasury yield data from Yahoo Finance
 * Cached for 60 seconds
 */

import { defineEventHandler, createError } from 'h3'
import type { ApiResponse, TreasuryData } from '../types/market'
import { fetchYahooQuote, YAHOO_SYMBOLS } from '../utils/yahooFetcher'
import { withCache, setCacheHeaders } from '../utils/cache'

// Cache TTL in milliseconds (60 seconds)
const CACHE_TTL = 60000

// Treasury symbols
const TREASURY_SYMBOLS = [
  { symbol: YAHOO_SYMBOLS.TNX_10YR, name: '10-Year Treasury Yield' },
  { symbol: YAHOO_SYMBOLS.FVX_5YR, name: '5-Year Treasury Yield' }
]

/**
 * Fetch treasury yields from Yahoo Finance
 */
async function fetchTreasuriesFromApi(): Promise<TreasuryData[]> {
  const treasuries: TreasuryData[] = []
  
  // Fetch all treasury yields in parallel
  const results = await Promise.allSettled(
    TREASURY_SYMBOLS.map(t => fetchYahooQuote(t.symbol))
  )
  
  // Process results
  results.forEach((result, index) => {
    const treasury = TREASURY_SYMBOLS[index]
    
    if (result.status === 'fulfilled' && result.value) {
      const quote = result.value
      treasuries.push({
        symbol: treasury.symbol,
        name: treasury.name,
        yield: quote.price,
        previousYield: quote.previousClose,
        change: quote.change,
        changePercent: quote.changePercent
      })
    } else {
      console.warn(`[/api/treasuries] Failed to fetch ${treasury.name}:`, result.status)
    }
  })
  
  return treasuries
}

/**
 * GET /api/treasuries
 * Returns 10-year and 5-year Treasury yield values
 */
export default defineEventHandler(async (event) => {
  // Set cache headers (60 seconds)
  setCacheHeaders(event, 60)
  
  try {
    const treasuries = await withCache<TreasuryData[]>(
      'treasuries:yield-curve',
      fetchTreasuriesFromApi,
      CACHE_TTL
    )
    
    if (!treasuries || treasuries.length === 0) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Failed to fetch treasury data'
      })
    }
    
    const response: ApiResponse<TreasuryData[]> = {
      success: true,
      data: treasuries,
      source: 'yahoo-finance',
      timestamp: Date.now()
    }
    
    return response
  } catch (error: any) {
    console.error('[/api/treasuries] Error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Internal server error: ${error.message || 'Unknown error'}`
    })
  }
})
