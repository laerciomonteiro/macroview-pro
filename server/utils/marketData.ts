/**
 * Market Data Service
 * Centralized market data fetching logic that can be used across server routes
 * Avoids self-referential HTTP calls by exporting the core logic as functions
 */

import type { 
  MarketOverview, 
  CurrencyData, 
  RiskIndicatorData, 
  CommodityData, 
  BrazilFlowData, 
  TreasuryData,
  ApiResponse
} from '../types/market'
import { withCache } from './cache'

// Cache TTL in milliseconds (60 seconds)
const CACHE_TTL = 60000

/**
 * Fetch all market data in parallel with graceful degradation
 * Uses Promise.allSettled to ensure partial failures don't break the entire response
 * This is the CORE function that both market-overview and correlations APIs use
 */
export async function fetchMarketOverviewData(): Promise<MarketOverview> {
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
    console.warn('[marketDataService] Partial failures in:', failures.join(', '))
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
 * Get cached market overview data
 * Wraps fetchMarketOverviewData with caching
 */
export async function getCachedMarketOverview(): Promise<MarketOverview> {
  return withCache<MarketOverview>(
    'market-overview:consolidated',
    fetchMarketOverviewData,
    CACHE_TTL
  )
}

/**
 * Extract specific values from market data for correlations API
 * Returns a simplified object with the exact values needed by correlations
 */
export function extractCorrelationMarketData(marketData: MarketOverview) {
  // Extract VIX value
  const vix = marketData?.riskIndicators?.vix?.price || 0
  const vixChange = marketData?.riskIndicators?.vix?.changePercent || 0
  
  // Extract DXY value
  const dxy = marketData?.riskIndicators?.dxy?.price || 0
  const dxyChange = marketData?.riskIndicators?.dxy?.changePercent || 0
  
  // Extract Gold price (find in commodities array)
  const goldEntry = marketData?.commodities?.find((c: any) => 
    c.name === 'Gold' || c.name === 'XAU/USD' || c.symbol?.includes('GOLD') || c.symbol === 'GC=F'
  )
  const gold = goldEntry?.price || 0
  const goldChange = goldEntry?.changePercent || 0
  
  // Extract Brent price (find in commodities array)
  const brentEntry = marketData?.commodities?.find((c: any) => 
    c.name === 'Brent Crude' || c.name === 'Brent' || c.symbol?.includes('BRENT') || c.symbol === 'BZ=F'
  )
  const brent = brentEntry?.price || 0
  const brentChange = brentEntry?.changePercent || 0
  
  // Extract Iron Ore price (look for VALE as proxy)
  const ironOreEntry = marketData?.commodities?.find((c: any) => 
    c.name === 'Iron Ore' || c.name?.includes('VALE') || c.symbol === 'VALE'
  )
  const ironOre = ironOreEntry?.price || 0
  
  // Extract MXN (USD/MXN) from currencies
  const mxmEntry = marketData?.currencies?.find((c: any) => 
    (c.code === 'USD' && c.codein === 'MXN') || c.name?.includes('Peso')
  )
  const mxm = mxmEntry?.bid || 0
  const mxmChange = mxmEntry?.pctChange || 0
  
  // Extract EWZ from brazilFlow
  const ewzPrice = marketData?.brazilFlow?.price || 0
  const ewzChange = marketData?.brazilFlow?.changePercent || 0
  
  return {
    vix,
    vixChange,
    dxy,
    dxyChange,
    gold,
    goldChange,
    brent,
    brentChange,
    ironOre,
    mxm,
    mxmChange,
    ewzPrice,
    ewzChange
  }
}
