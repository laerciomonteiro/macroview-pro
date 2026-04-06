/**
 * Commodities API Endpoint
 * Fetches commodity prices (Brent Crude, Gold) from Yahoo Finance
 * Optionally fetches XAU/USD from Twelve Data if API key is configured
 * Cached for 60 seconds
 */

import { defineEventHandler, createError } from 'h3'
import type { ApiResponse, CommodityData, TwelveDataPriceResponse } from '../types/market'
import { fetchYahooQuote, YAHOO_SYMBOLS } from '../utils/yahooFetcher'
import { withCache, setCacheHeaders } from '../utils/cache'

// Cache TTL in milliseconds (60 seconds)
const CACHE_TTL = 60000

// Twelve Data API base URL (used if API key is configured)
const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com/price'

/**
 * Commodity definition with optional VALE flag
 */
interface CommodityDef {
  symbol: string
  name: string
  unit: string
  isVale?: boolean
}

/**
 * Standard commodities to fetch from Yahoo Finance
 * Including VALE as iron ore proxy
 */
const YAHOO_COMMODITIES: CommodityDef[] = [
  { symbol: YAHOO_SYMBOLS.BRENT, name: 'Brent Crude', unit: 'USD/bbl' },
  { symbol: YAHOO_SYMBOLS.GOLD, name: 'Gold', unit: 'USD/oz' },
  { symbol: YAHOO_SYMBOLS.VALE, name: 'VALE (Iron Ore Proxy)', unit: 'BRL', isVale: true }
]

/**
 * Fetch commodity data from Yahoo Finance
 */
async function fetchCommoditiesFromYahoo(): Promise<CommodityData[]> {
  const commodities: CommodityData[] = []
  
  // Fetch all Yahoo commodities in parallel
  const results = await Promise.allSettled(
    YAHOO_COMMODITIES.map(c => fetchYahooQuote(c.symbol))
  )
  
  // Process results
  results.forEach((result, index) => {
    const commodity = YAHOO_COMMODITIES[index]
    
    if (result.status === 'fulfilled' && result.value) {
      const quote = result.value
      commodities.push({
        name: commodity.name,
        symbol: commodity.symbol,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        unit: commodity.unit,
        source: 'yahoo'
      })
    } else {
      console.warn(`[/api/commodities] Failed to fetch ${commodity.name}:`, result.status)
    }
  })
  
  return commodities
}

/**
 * Fetch XAU/USD from Twelve Data (if API key is configured)
 */
async function fetchTwelveDataXAU(): Promise<CommodityData | null> {
  const config = useRuntimeConfig()
  const apiKey = config.twelveDataApiKey as string | undefined
  
  if (!apiKey) {
    console.info('[/api/commodities] Twelve Data API key not configured, skipping XAU/USD')
    return null
  }
  
  try {
    const url = `${TWELVE_DATA_BASE_URL}?symbol=XAU/USD&apikey=${apiKey}`
    
    const response = await $fetch<TwelveDataPriceResponse>(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })
    
    if (response && response.price) {
      // Twelve Data doesn't provide change percent, so we estimate
      return {
        name: 'Gold (XAU/USD)',
        symbol: 'XAU/USD',
        price: parseFloat(response.price),
        change: 0,
        changePercent: 0,
        unit: 'USD/oz',
        source: 'twelve-data'
      }
    }
  } catch (error: any) {
    console.warn('[/api/commodities] Failed to fetch XAU/USD from Twelve Data:', error.message)
  }
  
  return null
}

/**
 * Fetch all commodities data
 */
async function fetchAllCommodities(): Promise<CommodityData[]> {
  // Fetch Yahoo commodities
  const yahooCommodities = await fetchCommoditiesFromYahoo()
  
  // Try to fetch Twelve Data XAU (optional)
  const twelveDataXAU = await fetchTwelveDataXAU()
  
  if (twelveDataXAU) {
    yahooCommodities.push(twelveDataXAU)
  }
  
  return yahooCommodities
}

/**
 * GET /api/commodities
 * Returns commodity prices including Brent Crude and Gold
 */
export default defineEventHandler(async (event) => {
  // Set cache headers (60 seconds)
  setCacheHeaders(event, 60)
  
  try {
    const commodities = await withCache<CommodityData[]>(
      'commodities:all',
      fetchAllCommodities,
      CACHE_TTL
    )
    
    if (!commodities || commodities.length === 0) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Failed to fetch commodity data'
      })
    }
    
    const response: ApiResponse<CommodityData[]> = {
      success: true,
      data: commodities,
      source: 'yahoo-finance' + (useRuntimeConfig().twelveDataApiKey ? '+twelve-data' : ''),
      timestamp: Date.now()
    }
    
    return response
  } catch (error: any) {
    console.error('[/api/commodities] Error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Internal server error: ${error.message || 'Unknown error'}`
    })
  }
})
