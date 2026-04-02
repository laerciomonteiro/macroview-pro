/**
 * Currencies API Endpoint - Simplified Version
 * Fetches USD-BRL and EUR-BRL exchange rates
 * With Yahoo Finance fallback and graceful error handling
 */

import { defineEventHandler } from 'h3'

interface CurrencyData {
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

interface ApiResponse {
  success: boolean
  data: CurrencyData[]
  source?: string
  timestamp: number
  error?: string
}

// AwesomeAPI endpoint
const AWESOME_API_URL = 'https://economia.awesomeapi.com.br/json/last'

// Yahoo Finance endpoint
const YAHOO_FINANCE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'

/**
 * Parse AwesomeAPI response
 */
function parseAwesomeApiResponse(response: Record<string, any>): CurrencyData[] {
  const currencies: CurrencyData[] = []
  const pairs = ['USD-BRL', 'EUR-BRL']
  
  for (const pair of pairs) {
    const data = response[pair]
    if (data) {
      currencies.push({
        code: data.code || '',
        codein: data.codein || '',
        name: data.name || '',
        bid: parseFloat(data.bid) || 0,
        ask: parseFloat(data.ask) || 0,
        high: parseFloat(data.high) || 0,
        low: parseFloat(data.low) || 0,
        varBid: parseFloat(data.varBid) || 0,
        pctChange: parseFloat(data.pctChange) || 0,
        timestamp: parseInt(data.timestamp) || 0
      })
    }
  }
  
  return currencies
}

/**
 * Parse Yahoo Finance response
 */
function parseYahooFinanceResponse(response: any): CurrencyData | null {
  const result = response?.chart?.result?.[0]
  if (!result) return null

  const meta = result.meta
  const quote = result.indicators?.quote?.[0]

  if (!meta || !quote) return null

  const close = meta.regularMarketPrice || 0
  const previousClose = meta.previousClose || close
  
  return {
    code: 'USD',
    codein: 'BRL',
    name: 'Dólar Americano/Real Brasileiro',
    bid: close,
    ask: close * 1.002,
    high: close,
    low: close,
    varBid: close - previousClose,
    pctChange: previousClose > 0 ? ((close - previousClose) / previousClose) * 100 : 0,
    timestamp: meta.regularMarketTime || Math.floor(Date.now() / 1000)
  }
}

/**
 * GET /api/currencies
 * Returns USD-BRL and EUR-BRL exchange rates
 */
export default defineEventHandler(async (event): Promise<ApiResponse> => {
  // Set cache headers
  if (event.node.res) {
    event.node.res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60')
  }

  // Try AwesomeAPI first
  try {
    const url = `${AWESOME_API_URL}/USD-BRL,EUR-BRL`
    const response = await $fetch(url, {
      timeout: 5000
    })
    
    const currencies = parseAwesomeApiResponse(response as Record<string, any>)
    
    if (currencies.length > 0) {
      return {
        success: true,
        data: currencies,
        source: 'awesomeapi',
        timestamp: Date.now()
      }
    }
  } catch (awesomeError) {
    console.error('[/api/currencies] AwesomeAPI error:', awesomeError)
  }

  // Try Yahoo Finance fallback
  try {
    const currencies: CurrencyData[] = []
    
    // Fetch USD/BRL
    const usdResponse = await $fetch(`${YAHOO_FINANCE_URL}/USDBRL=X`, {
      timeout: 5000
    })
    
    const usdData = parseYahooFinanceResponse(usdResponse)
    if (usdData) {
      currencies.push(usdData)
    }

    // Fetch EUR/BRL (if available)
    try {
      const eurResponse = await $fetch(`${YAHOO_FINANCE_URL}/EURBRL=X`, {
        timeout: 5000
      })
      
      const eurData = parseYahooFinanceResponse(eurResponse)
      if (eurData) {
        currencies.push({
          ...eurData,
          code: 'EUR',
          name: 'Euro/Real Brasileiro'
        })
      }
    } catch {
      // EUR/BRL might not be available, skip
      console.warn('[/api/currencies] Yahoo Finance EUR/BRL not available')
    }

    if (currencies.length > 0) {
      return {
        success: true,
        data: currencies,
        source: 'yahoo',
        timestamp: Date.now()
      }
    }
  } catch (yahooError) {
    console.error('[/api/currencies] Yahoo Finance error:', yahooError)
  }

  // All APIs failed - return safe fallback with error message
  return {
    success: false,
    data: [],
    source: 'fallback',
    timestamp: Date.now(),
    error: 'All currency APIs unavailable. Please try again later.'
  }
})