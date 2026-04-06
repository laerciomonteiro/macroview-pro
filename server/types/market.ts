/**
 * Market Data Type Definitions
 * Consolidated types for all market data API responses
 */

/**
 * Generic API response wrapper with error handling
 */
export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error?: string
  source?: string
  timestamp: number
}

/**
 * Cached data wrapper with TTL tracking
 */
export interface CachedData<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
  isExpired: () => boolean
}

/**
 * Currency data from AwesomeAPI
 */
export interface CurrencyData {
  code: string
  codein: string
  name: string
  bid: number
  ask: number
  high: number
  low: number
  varBid: number
  pctChange: number
  timestamp: number
}

/**
 * Yahoo Finance chart API metadata
 */
export interface YahooChartMetadata {
  symbol: string
  currency: string
  exchangeName: string
  instrumentType: string
  firstTradeDate: number
  regularMarketTime: number
  gmtoffset: number
  timezone: string
  exchangeTimezoneName: string
  regularMarketPrice: number
  previousClose: number
  previousAdjClose: number
  scale?: number
  priceHint?: number
  currentTradingPeriod?: {
    pre: { start: number; end: number; gmtoffset: number }
    regular: { start: number; end: number; gmtoffset: number }
    post: { start: number; end: number; gmtoffset: number }
  }
  tradingPeriods?: Array<Array<{ start: number; end: number; gmtoffset: number }>>
  dataGranularity?: string
  range?: string
  validRanges?: string[]
}

/**
 * Yahoo Finance quote data
 */
export interface YahooQuote {
  price: number
  previousClose: number
  change: number
  changePercent: number
}

/**
 * Risk indicator data (VIX, DXY)
 */
export interface RiskIndicatorData {
  vix: YahooQuote
  dxy: YahooQuote
  interpretation: 'Tomando Risco' | 'Cautela' | 'Medo' | 'Medo Extremo'
}

/**
 * Commodity data
 */
export interface CommodityData {
  name: string
  symbol: string
  price: number
  change: number
  changePercent: number
  unit: string
  source: 'yahoo' | 'twelve-data' | 'commodities-api'
}

/**
 * Brazil flow ETF data (EWZ)
 */
export interface BrazilFlowData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  source: string
}

/**
 * Treasury yield data
 */
export interface TreasuryData {
  symbol: string
  name: string
  yield: number
  previousYield: number
  change: number
  changePercent: number
}

/**
 * Consolidated market overview
 */
export interface MarketOverview {
  currencies: CurrencyData[]
  riskIndicators: RiskIndicatorData
  commodities: CommodityData[]
  brazilFlow: BrazilFlowData
  treasuries: TreasuryData[]
  fetchedAt: number
  cacheExpiry: number
}

/**
 * Yahoo Finance chart API response structure
 */
export interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: YahooChartMetadata
      timestamp: number[]
      indicators?: {
        quote: Array<{
          open: number[]
          high: number[]
          low: number[]
          close: number[]
          volume: number[]
        }>
        adjclose?: Array<{
          adjclose: number[]
        }>
      }
    }>
    error?: {
      code: string
      description: string
    }
  }
}

/**
 * AwesomeAPI currency response structure
 */
export interface AwesomeApiCurrencyResponse {
  [key: string]: {
    code: string
    codein: string
    name: string
    bid: number
    ask: number
    high: number
    low: number
    varBid: number
    pctChange: number
    timestamp: number
  }
}

/**
 * Twelve Data price response
 */
export interface TwelveDataPriceResponse {
  symbol: string
  price: number
  timestamp: number
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  ttl: number // Time to live in milliseconds
  key?: string // Optional cache key for debugging
}

/**
 * Fetch options with caching support
 */
export interface FetchOptions extends RequestInit {
  cacheTtl?: number
}
