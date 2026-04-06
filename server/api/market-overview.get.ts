/**
 * Market Overview API Endpoint
 * Consolidated endpoint that fetches data from all market data sources
 * Uses Promise.allSettled() to handle partial failures gracefully
 * Cached for 60 seconds
 */

import { defineEventHandler, createError } from 'h3'
import type { 
  ApiResponse, 
  MarketOverview, 
  CurrencyData, 
  RiskIndicatorData, 
  CommodityData, 
  BrazilFlowData, 
  TreasuryData 
} from '../types/market'
import { withCache, setCacheHeaders } from '../utils/cache'

// Cache TTL in milliseconds (60 seconds)
const CACHE_TTL = 60000

/**
 * Fetch all market data in parallel with graceful degradation
 * Uses Promise.allSettled to ensure partial failures don't break the entire response
 */
async function fetchAllMarketData(): Promise<MarketOverview> {
  // Define all fetcher functions
  const fetchers = {
    currencies: () => $fetch<ApiResponse<CurrencyData[]>>('/api/currencies'),
    riskIndicators: () => $fetch<ApiResponse<RiskIndicatorData>>('/api/risk-indicators'),
    commodities: () => $fetch<ApiResponse<CommodityData[]>>('/api/commodities'),
    brazilFlow: () => $fetch<ApiResponse<BrazilFlowData>>('/api/brazil-flow'),
    treasuries: () => $fetch<ApiResponse<TreasuryData[]>>('/api/treasuries')
  }
  
  // Execute all fetchers in parallel using Promise.allSettled
  const results = await Promise.allSettled([
    fetchers.currencies(),
    fetchers.riskIndicators(),
    fetchers.commodities(),
    fetchers.brazilFlow(),
    fetchers.treasuries()
  ])
  
  // Parse results with graceful degradation
  const [
    currenciesResult,
    riskIndicatorsResult,
    commoditiesResult,
    brazilFlowResult,
    treasuriesResult
  ] = results
  
  // Extract data or use defaults
  const currencies = currenciesResult.status === 'fulfilled' 
    ? (currenciesResult.value.data || [])
    : []
  
   const riskIndicators: RiskIndicatorData = riskIndicatorsResult.status === 'fulfilled'
    ? (riskIndicatorsResult.value.data || {
        vix: { price: 0, previousClose: 0, change: 0, changePercent: 0 },
        dxy: { price: 0, previousClose: 0, change: 0, changePercent: 0 },
        interpretation: 'Cautela' as const
      })
    : {
        vix: { price: 0, previousClose: 0, change: 0, changePercent: 0 },
        dxy: { price: 0, previousClose: 0, change: 0, changePercent: 0 },
        interpretation: 'Cautela' as const
      }
  
  const commodities = commoditiesResult.status === 'fulfilled'
    ? (commoditiesResult.value.data || [])
    : []
  
  const brazilFlow: BrazilFlowData = brazilFlowResult.status === 'fulfilled'
    ? (brazilFlowResult.value.data || {
        symbol: 'EWZ',
        name: 'iShares MSCI Brazil ETF',
        price: 0,
        change: 0,
        changePercent: 0,
        source: 'unavailable'
      })
    : {
        symbol: 'EWZ',
        name: 'iShares MSCI Brazil ETF',
        price: 0,
        change: 0,
        changePercent: 0,
        source: 'unavailable'
      }
  
  const treasuries = treasuriesResult.status === 'fulfilled'
    ? (treasuriesResult.value.data || [])
    : []
  
  // Log any failures for debugging
  const failures = results
    .filter(r => r.status === 'rejected')
    .map((_, i) => Object.keys(fetchers)[i])
  
  if (failures.length > 0) {
    console.warn('[/api/market-overview] Partial failures in:', failures.join(', '))
  }
  
  const now = Date.now()
  
  return {
    currencies,
    riskIndicators,
    commodities,
    brazilFlow,
    treasuries,
    fetchedAt: now,
    cacheExpiry: now + CACHE_TTL
  }
}

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
    const marketData = await withCache<MarketOverview>(
      'market-overview:consolidated',
      fetchAllMarketData,
      CACHE_TTL
    )
    
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
