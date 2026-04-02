/**
 * Brazil Flow API Endpoint
 * Fetches EWZ (iShares MSCI Brazil ETF) data from Yahoo Finance
 * Cached for 60 seconds
 */

import { defineEventHandler, createError } from 'h3'
import type { ApiResponse, BrazilFlowData } from '../types/market'
import { fetchYahooQuote, YAHOO_SYMBOLS } from '../utils/yahooFetcher'
import { withCache, setCacheHeaders } from '../utils/cache'

// Cache TTL in milliseconds (60 seconds)
const CACHE_TTL = 60000

// EWZ symbol (Brazil ETF)
const EWZ_SYMBOL = YAHOO_SYMBOLS.EWZ

/**
 * Fetch Brazil flow data from Yahoo Finance
 */
async function fetchBrazilFlowFromApi(): Promise<BrazilFlowData> {
  const quote = await fetchYahooQuote(EWZ_SYMBOL)
  
  if (!quote) {
    throw new Error('Failed to fetch EWZ quote from Yahoo Finance')
  }
  
  return {
    symbol: EWZ_SYMBOL,
    name: 'iShares MSCI Brazil ETF',
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    source: 'yahoo-finance'
  }
}

/**
 * GET /api/brazil-flow
 * Returns EWZ ETF data including price and variation
 */
export default defineEventHandler(async (event) => {
  // Set cache headers (60 seconds)
  setCacheHeaders(event, 60)
  
  try {
    const brazilFlow = await withCache<BrazilFlowData>(
      'brazil-flow:ewz',
      fetchBrazilFlowFromApi,
      CACHE_TTL
    )
    
    if (!brazilFlow) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Failed to fetch Brazil flow data'
      })
    }
    
    const response: ApiResponse<BrazilFlowData> = {
      success: true,
      data: brazilFlow,
      source: 'yahoo-finance',
      timestamp: Date.now()
    }
    
    return response
  } catch (error: any) {
    console.error('[/api/brazil-flow] Error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Internal server error: ${error.message || 'Unknown error'}`
    })
  }
})
