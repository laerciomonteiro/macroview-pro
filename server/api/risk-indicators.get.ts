/**
 * Risk Indicators API Endpoint
 * Fetches VIX (volatility index) and DXY (US Dollar Index) from Yahoo Finance
 * Calculates market interpretation based on VIX levels
 * Cached for 60 seconds
 */

import { defineEventHandler, createError } from 'h3'
import type { ApiResponse, RiskIndicatorData, YahooQuote } from '../types/market'
import { fetchYahooQuote, YAHOO_SYMBOLS } from '../utils/yahooFetcher'
import { withCache, setCacheHeaders } from '../utils/cache'

// Cache TTL in milliseconds (60 seconds)
const CACHE_TTL = 60000

/**
 * VIX interpretation thresholds (NOVOS LIMIARES)
 * - < 15 + ~7% variação: "Tomando Risco" (Risk-On)
 * - >= 15 e < 25: "Medo" (Risk-Off)
 * - >= 25: "Medo Extremo" (Extreme Risk-Off)
 * - < 15 sem variação ~7%: "Cautela"
 */
function interpretVix(vixValue: number, vixChangePercent: number = 0): RiskIndicatorData['interpretation'] {
  // Risk-On: VIX < 15 e variação >= 7% (subindo)
  if (vixValue < 15 && vixChangePercent >= 7) {
    return 'Tomando Risco'
  }
  
  // Risk-Off: VIX >= 15
  if (vixValue >= 15 && vixValue < 25) {
    return 'Medo'
  }
  
  // Extreme Risk-Off: VIX >= 25
  if (vixValue >= 25) {
    return 'Medo Extremo'
  }
  
  // VIX < 15 sem variação suficiente: Cautela
  return 'Cautela'
}

/**
 * Fetch risk indicators from Yahoo Finance
 */
async function fetchRiskIndicatorsFromApi(): Promise<RiskIndicatorData> {
  // Fetch VIX and DXY in parallel using Promise.allSettled
  const [dxyResult, vixResult] = await Promise.allSettled([
    fetchYahooQuote(YAHOO_SYMBOLS.DXY),
    fetchYahooQuote(YAHOO_SYMBOLS.VIX)
  ])
  
  // Parse DXY result
  let dxyQuote: YahooQuote = {
    price: 0,
    previousClose: 0,
    change: 0,
    changePercent: 0
  }
  
  if (dxyResult.status === 'fulfilled' && dxyResult.value) {
    dxyQuote = dxyResult.value
  } else {
    console.warn('[/api/risk-indicators] Failed to fetch DXY:', dxyResult.status)
  }
  
  // Parse VIX result
  let vixQuote: YahooQuote = {
    price: 0,
    previousClose: 0,
    change: 0,
    changePercent: 0
  }
  
  if (vixResult.status === 'fulfilled' && vixResult.value) {
    vixQuote = vixResult.value
  } else {
    console.warn('[/api/risk-indicators] Failed to fetch VIX:', vixResult.status)
  }
  
  // Calculate VIX interpretation with change percent for Risk-On detection
  const interpretation = interpretVix(vixQuote.price, vixQuote.changePercent)
  
  return {
    vix: vixQuote,
    dxy: dxyQuote,
    interpretation
  }
}

/**
 * GET /api/risk-indicators
 * Returns VIX, DXY, and market interpretation
 */
export default defineEventHandler(async (event) => {
  // Set cache headers (60 seconds)
  setCacheHeaders(event, 60)
  
  try {
    // Use cache wrapper
    const riskData = await withCache<RiskIndicatorData>(
      'risk-indicators:yahoo',
      fetchRiskIndicatorsFromApi,
      CACHE_TTL
    )
    
    if (!riskData) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Failed to fetch risk indicators'
      })
    }
    
    const response: ApiResponse<RiskIndicatorData> = {
      success: true,
      data: riskData,
      source: 'yahoo-finance',
      timestamp: Date.now()
    }
    
    return response
  } catch (error: any) {
    console.error('[/api/risk-indicators] Error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Internal server error: ${error.message || 'Unknown error'}`
    })
  }
})
