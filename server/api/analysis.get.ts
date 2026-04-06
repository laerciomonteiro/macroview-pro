/**
 * Market Analysis API Endpoint
 * MacroView Pro - Institutional Trading Terminal
 * 
 * Uses Gemini 2.5 to generate AI-powered market commentary
 * for day traders focused on WDO and WIN futures
 * 
 * Cached for 5 minutes to avoid excessive API calls
 */

import { defineEventHandler, createError } from 'h3'
import type { ApiResponse, MarketOverview } from '../types/market'
import type { NewsApiResponse } from '../../types/news'
import { withCache, setCacheHeaders } from '../utils/cache'
import { generateMarketAnalysis, validateMarketData, type MarketDataForAnalysis } from '../utils/gemini'
import { parseMarkdown } from '../utils/markdown'

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000

// Cache key for analysis
const CACHE_KEY = 'market-analysis:gemini'

/**
 * Extract market data from the consolidated market overview
 * for the Gemini analysis prompt
 */
function extractMarketDataForAnalysis(marketOverview: MarketOverview): MarketDataForAnalysis {
  // Default values if data is missing
  const defaultValues = {
    vix: 0,
    dxy: 0,
    gold: 0,
    brent: 0,
    ewz: 0,
    usdBrl: 0,
    treasury: 0,
    scenario: 'Neutro' as const
  }

  // Find USD/BRL currency
  let usdBrl = 0
  const usdCurrency = marketOverview.currencies?.find(
    c => c.code === 'USD' && c.codein === 'BRL'
  )
  if (usdCurrency?.bid) {
    usdBrl = usdCurrency.bid
  }

  // Find VIX data
  let vix = 0
  let vixInterpretation = 'Mercado tranquilo'
  if (marketOverview.riskIndicators?.vix) {
    vix = marketOverview.riskIndicators.vix.price || 0
    vixInterpretation = marketOverview.riskIndicators.interpretation || 'Mercado tranquilo'
  }

  // Find DXY data
  let dxy = 0
  if (marketOverview.riskIndicators?.dxy) {
    dxy = marketOverview.riskIndicators.dxy.price || 0
  }

  // Find Gold (XAU)
  let gold = 0
  const goldCommodity = marketOverview.commodities?.find(
    c => c.symbol === 'GC=F' || c.symbol === 'XAUUSD' || c.name.toLowerCase().includes('ouro')
  )
  if (goldCommodity?.price) {
    gold = goldCommodity.price
  }

  // Find Brent
  let brent = 0
  const brentCommodity = marketOverview.commodities?.find(
    c => c.symbol === 'BZ=F' || c.name.toLowerCase().includes('brent')
  )
  if (brentCommodity?.price) {
    brent = brentCommodity.price
  }

  // Find EWZ (Brazil ETF)
  let ewz = 0
  if (marketOverview.brazilFlow?.price) {
    ewz = marketOverview.brazilFlow.price
  }

  // Find Treasury 10YR
  let treasury = 0
  const treasury10yr = marketOverview.treasuries?.find(
    t => t.symbol === '^TNX' || t.name.includes('10 Year')
  )
  if (treasury10yr?.yield) {
    treasury = treasury10yr.yield
  }

  // Determine scenario based on VIX and DXY
  // NOVOS LIMIARES: VIX > 15 = Risk-Off, VIX < 15 + ~7% variação = Risk-On
  let vixChangePercent = 0
  if (marketOverview.riskIndicators?.vix?.changePercent) {
    vixChangePercent = marketOverview.riskIndicators.vix.changePercent
  }
  
  let scenario: 'Risk-On' | 'Risk-Off' | 'Neutro' = 'Neutro'
  
  // Risk-Off: VIX > 15
  if (vix > 15) {
    scenario = 'Risk-Off'
  }
  // Risk-On: VIX < 15 e variação >= 7%
  else if (vix < 15 && vixChangePercent >= 7) {
    scenario = 'Risk-On'
  }

  return {
    vix,
    vixInterpretation,
    dxy,
    gold,
    brent,
    ewz,
    usdBrl,
    treasury,
    scenario
  }
}

/**
 * Fetch fresh analysis from Gemini
 */
async function fetchFreshAnalysis(): Promise<{
  analysis: string
  generatedAt: number
  scenario: 'Risk-On' | 'Risk-Off' | 'Neutro'
}> {
  // Fetch current market overview
  const marketResponse = await $fetch<ApiResponse<MarketOverview>>('/api/market-overview')

  if (!marketResponse?.data) {
    throw new Error('Failed to fetch market overview data')
  }

  const marketData = extractMarketDataForAnalysis(marketResponse.data)

  // Validate we have enough data
  if (!validateMarketData(marketData)) {
    throw new Error('Invalid market data for analysis')
  }

  // Fetch news context for enriched analysis
  const newsContext = await getNewsContext()

  // Generate analysis using Gemini
  const analysis = await generateMarketAnalysis({
    ...marketData,
    newsContext
  })

  return {
    analysis,
    generatedAt: Date.now(),
    scenario: marketData.scenario
  }
}

/**
 * Fetch news context from the news endpoint
 */
async function getNewsContext(): Promise<string> {
  try {
    // Call our news endpoint
    const response = await $fetch<NewsApiResponse>('/api/news/latest')
    if (response.success && response.data.articles.length > 0) {
      const articles = response.data.articles
        .filter((a) => a.relevanceScore >= 0.7)
        .slice(0, 5)

      return articles.map((a) =>
        `- ${a.source.name}: ${a.title}`
      ).join('\n')
    }
  } catch (err) {
    console.warn('[Analysis] News fetch failed:', err)
  }
  return ''
}

export interface AnalysisResponse {
  success: boolean
  data: {
    analysis: string
    generatedAt: number
    scenario: 'Risk-On' | 'Risk-Off' | 'Neutro'
  } | null
  error?: string
  timestamp: number
}

/**
 * GET /api/analysis
 * Returns AI-generated market analysis from Gemini 2.5
 * 
 * The analysis provides:
 * - Current scenario interpretation (Risk-On/Risk-Off/Neutro)
 * - Key signals from VIX, DXY, Gold, Brent, EWZ
 * - Implications for WDO and WIN
 * - Support/resistance levels to watch
 * - Time-sensitive catalysts
 * 
 * Cached for 5 minutes to avoid excessive API calls
 */
export default defineEventHandler(async (event) => {
  // Set cache headers (5 minutes)
  setCacheHeaders(event, 300)

  try {
    // Try to get cached analysis first
    const cachedAnalysis = await withCache<{
      analysis: string
      generatedAt: number
      scenario: 'Risk-On' | 'Risk-Off' | 'Neutro'
    }>(
      CACHE_KEY,
      fetchFreshAnalysis,
      CACHE_TTL
    )

    if (!cachedAnalysis) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Failed to generate market analysis'
      })
    }

    // Parse markdown to HTML before returning
    const parsedAnalysis = parseMarkdown(cachedAnalysis.analysis)

    const response: AnalysisResponse = {
      success: true,
      data: {
        analysis: parsedAnalysis,
        generatedAt: cachedAnalysis.generatedAt,
        scenario: cachedAnalysis.scenario
      },
      timestamp: Date.now()
    }

    return response
  } catch (error: any) {
    console.error('[/api/analysis] Error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: `Failed to generate analysis: ${error.message || 'Unknown error'}`
    })
  }
})
