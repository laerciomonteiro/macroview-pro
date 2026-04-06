/**
 * Yahoo Finance API Fetcher Utility
 * Reusable fetcher for Yahoo Finance chart API with response parsing
 */

import type { YahooChartResponse, YahooQuote, YahooChartMetadata } from '../types/market'

/**
 * Yahoo Finance chart API endpoint base URL
 */
const YAHOO_CHART_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'

/**
 * Symbols that need URL encoding (with ^ prefix)
 */
const ENCODED_SYMBOLS = ['^VIX', '^TNX', '^FVX', '^GSPC', '^DJI', '^IXIC']

/**
 * Encode symbol for Yahoo Finance API URL
 * @param symbol Stock/ETF symbol
 * @returns URL-encoded symbol
 */
function encodeSymbol(symbol: string): string {
  if (ENCODED_SYMBOLS.includes(symbol)) {
    return encodeURIComponent(symbol)
  }
  return symbol
}

/**
 * Parse Yahoo Finance chart API response to extract quote data
 * @param response Yahoo chart API response
 * @param symbol Symbol for error reporting
 * @returns Parsed quote data or null if parsing fails
 */
export function parseYahooChartResponse(
  response: YahooChartResponse,
  symbol: string
): YahooQuote | null {
  // Check for API errors
  if (response.chart.error) {
    console.error(`[yahooFetcher] Yahoo API error for ${symbol}:`, response.chart.error)
    return null
  }
  
  // Validate response structure
  if (!response.chart.result || response.chart.result.length === 0) {
    console.error(`[yahooFetcher] No result data for ${symbol}`)
    return null
  }
  
  const result = response.chart.result[0]
  const meta = result.meta
  
  // Extract current price from metadata (most reliable source)
  const currentPrice = meta.regularMarketPrice ?? meta.previousClose
  
  if (currentPrice === undefined || currentPrice === null) {
    console.error(`[yahooFetcher] No price data for ${symbol}`)
    return null
  }
  
  // Calculate change and percentage
  const previousClose = meta.previousClose ?? meta.previousAdjClose ?? currentPrice
  const change = currentPrice - previousClose
  const changePercent = previousClose !== 0 
    ? (change / previousClose) * 100 
    : 0
  
  return {
    price: currentPrice,
    previousClose,
    change,
    changePercent
  }
}

/**
 * Fetch quote data from Yahoo Finance API
 * @param symbol Stock/ETF symbol (e.g., 'DX-Y.NYB', '^VIX', 'BZ=F')
 * @param timeoutMs Request timeout in milliseconds
 * @returns Quote data or null if fetch fails
 */
export async function fetchYahooQuote(
  symbol: string,
  timeoutMs: number = 10000
): Promise<YahooQuote | null> {
  const encodedSymbol = encodeSymbol(symbol)
  const url = `${YAHOO_CHART_BASE_URL}/${encodedSymbol}`
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    
    const response = await $fetch<YahooChartResponse>(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    return parseYahooChartResponse(response, symbol)
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`[yahooFetcher] Timeout fetching ${symbol}`)
    } else {
      console.error(`[yahooFetcher] Error fetching ${symbol}:`, error.message || error)
    }
    return null
  }
}

/**
 * Fetch multiple quotes in parallel using Promise.allSettled
 * @param symbols Array of stock/ETF symbols
 * @param timeoutMs Request timeout per symbol
 * @returns Map of symbol to quote data (null if failed)
 */
export async function fetchMultipleYahooQuotes(
  symbols: string[],
  timeoutMs: number = 10000
): Promise<Map<string, YahooQuote | null>> {
  const results = await Promise.allSettled(
    symbols.map(symbol => fetchYahooQuote(symbol, timeoutMs))
  )
  
  const quoteMap = new Map<string, YahooQuote | null>()
  
  results.forEach((result, index) => {
    const symbol = symbols[index]
    if (result.status === 'fulfilled') {
      quoteMap.set(symbol, result.value)
    } else {
      console.error(`[yahooFetcher] Promise rejected for ${symbol}:`, result.reason)
      quoteMap.set(symbol, null)
    }
  })
  
  return quoteMap
}

/**
 * Get metadata from Yahoo Finance chart API
 * @param symbol Stock/ETF symbol
 * @returns Metadata or null if fetch fails
 */
export async function fetchYahooMetadata(
  symbol: string
): Promise<YahooChartMetadata | null> {
  const encodedSymbol = encodeSymbol(symbol)
  const url = `${YAHOO_CHART_BASE_URL}/${encodedSymbol}`
  
  try {
    const response = await $fetch<YahooChartResponse>(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (response.chart.error || !response.chart.result?.[0]) {
      return null
    }
    
    return response.chart.result[0].meta
  } catch (error: any) {
    console.error(`[yahooFetcher] Error fetching metadata for ${symbol}:`, error.message || error)
    return null
  }
}

/**
 * Extract price from Yahoo chart response
 * @param response Yahoo chart API response
 * @returns Current price or null
 */
export function extractPrice(response: YahooChartResponse): number | null {
  if (response.chart.error || !response.chart.result?.[0]) {
    return null
  }
  
  const meta = response.chart.result[0].meta
  return meta.regularMarketPrice ?? meta.previousClose ?? null
}

/**
 * Symbol mappings for common financial instruments
 * VALE3.SA = B3 São Paulo (mais adequado para dados brasileiros)
 * VALE = NYSE (alternativa)
 */
export const YAHOO_SYMBOLS = {
  DXY: 'DX-Y.NYB',
  VIX: '^VIX',
  BRENT: 'BZ=F',
  GOLD: 'GC=F',
  EWZ: 'EWZ',
  TNX_10YR: '^TNX',
  FVX_5YR: '^FVX',
  SP500: '^GSPC',
  NASDAQ: '^IXIC',
  DJI: '^DJI',
  VALE: 'VALE3.SA'  // VALE on B3 São Paulo - proxy for iron ore
} as const

/**
 * Reverse lookup for symbol names
 */
export const SYMBOL_NAMES: Record<string, string> = {
  'DX-Y.NYB': 'US Dollar Index',
  '^VIX': 'CBOE Volatility Index',
  'BZ=F': 'Brent Crude Oil',
  'GC=F': 'Gold Futures',
  'EWZ': 'iShares MSCI Brazil ETF',
  '^TNX': '10-Year Treasury Yield',
  '^FVX': '5-Year Treasury Yield',
  '^GSPC': 'S&P 500',
  '^IXIC': 'NASDAQ Composite',
  '^DJI': 'Dow Jones Industrial Average',
  'VALE3.SA': 'VALE S.A. (Iron Ore Proxy)'
}
