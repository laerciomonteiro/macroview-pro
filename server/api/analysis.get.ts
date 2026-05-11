/**
 * Market Analysis API Endpoint
 * MacroView Pro - Institutional Trading Terminal
 * 
 * Uses Gemini 2.5 to generate AI-powered market commentary
 * for day traders focused on WDO and WIN futures
 * 
 * Cached for 5 minutes to avoid excessive API calls
 */

import { defineEventHandler, createError, getQuery } from 'h3'
import type { ApiResponse, MarketOverview } from '../types/market'
import type { NewsApiResponse } from '../../types/news'
import { withCache, setCacheHeaders, clearCache, getFromCache, setCache } from '../utils/cache'
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
    dxyChange: 0,
    gold: 0,
    goldChange: 0,
    goldTrend: 'neutral' as const,
    brent: 0,
    brentChange: 0,
    ironOre: 0,
    ironOreChange: 0,
    ewz: 0,
    usdBrl: 0,
    mxm: 0,
    mxmChange: 0,
    treasury: 0,
    scenario: 'Neutro' as const,
    goldRisingDxyFalling: false,
    brentRisingPetrobrasUp: false,
    ironOreRisingValeUp: false,
    mxnRisingEmergingUp: false,
    // NEW: VALE defaults
    valePrice: 0,
    valeChange: 0,
    isValeProxy: false
  }

  // Find USD/BRL currency
  let usdBrl = 0
  const usdCurrency = marketOverview.currencies?.find(
    c => c.code === 'USD' && c.codein === 'BRL'
  )
  if (usdCurrency?.bid) {
    usdBrl = usdCurrency.bid
  }

  // NEW: Find MXN (USD/MXN)
  let mxm = 0
  let mxmChange = 0
  const mxmCurrency = marketOverview.currencies?.find(
    c => c.code === 'USD' && c.codein === 'MXN'
  )
  if (mxmCurrency?.bid) {
    mxm = mxmCurrency.bid
    mxmChange = mxmCurrency.pctChange || 0
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
  let dxyChange = 0
  if (marketOverview.riskIndicators?.dxy) {
    dxy = marketOverview.riskIndicators.dxy.price || 0
    dxyChange = marketOverview.riskIndicators.dxy.changePercent || 0
  }

  // Find Gold (XAU)
  let gold = 0
  let goldChange = 0
  const goldCommodity = marketOverview.commodities?.find(
    c => c.symbol === 'GC=F' || c.symbol === 'XAUUSD' || c.name.toLowerCase().includes('ouro')
  )
  if (goldCommodity?.price) {
    gold = goldCommodity.price
    goldChange = goldCommodity.changePercent || 0
  }
  const goldTrend: 'up' | 'down' | 'neutral' = goldChange > 0 ? 'up' : goldChange < 0 ? 'down' : 'neutral'

  // Find Brent
  let brent = 0
  let brentChange = 0
  const brentCommodity = marketOverview.commodities?.find(
    c => c.symbol === 'BZ=F' || c.name.toLowerCase().includes('brent')
  )
  if (brentCommodity?.price) {
    brent = brentCommodity.price
    brentChange = brentCommodity.changePercent || 0
  }

  // NEW: Find Iron Ore (via VALE proxy)
  // Try to find direct iron ore data first, then use VALE as proxy
  let ironOre = 0
  let ironOreChange = 0
  let valePrice = 0
  let valeChange = 0
  
  // First try: direct iron ore (if available)
  const ironCommodity = marketOverview.commodities?.find(
    c => c.symbol === 'IRON' || c.name.toLowerCase().includes('ferro') || c.name.toLowerCase().includes('iron')
  )
  
  // Second try: VALE as iron ore proxy
  const valeCommodity = marketOverview.commodities?.find(
    c => c.symbol === 'VALE3.SA' || c.name.toLowerCase().includes('vale')
  )
  
  if (ironCommodity?.price) {
    // Direct iron ore data available
    ironOre = ironCommodity.price
    ironOreChange = ironCommodity.changePercent || 0
  } else if (valeCommodity?.price) {
    // Use VALE as proxy for iron ore
    ironOre = valeCommodity.price
    ironOreChange = valeCommodity.changePercent || 0
    valePrice = valeCommodity.price
    valeChange = valeCommodity.changePercent || 0
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
  // NOVOS LIMIARES: VIX > 15 = Risk-Off, VIX < 15 + VIX DECRESCENTE -7% = Risk-On
  let vixChangePercent = 0
  if (marketOverview.riskIndicators?.vix?.changePercent) {
    vixChangePercent = marketOverview.riskIndicators.vix.changePercent
  }
  
  let scenario: 'Risk-On' | 'Risk-Off' | 'Neutro' = 'Neutro'
  
  // Risk-Off: VIX > 15
  if (vix > 15) {
    scenario = 'Risk-Off'
  }
  // Risk-On: VIX < 15 e variação DECRESCENTE >= 7% (caindo = menos medo)
  else if (vix < 15 && vixChangePercent <= -7) {
    scenario = 'Risk-On'
  }

  // NEW: Calculate correlation signals
  const goldRisingDxyFalling = goldChange > 0 && dxyChange < 0
  const brentRisingPetrobrasUp = brentChange > 0
  const ironOreRisingValeUp = ironOreChange > 0
  const mxnRisingEmergingUp = mxmChange > 0

  return {
    vix,
    vixInterpretation,
    dxy,
    dxyChange,
    gold,
    goldChange,
    goldTrend,
    brent,
    brentChange,
    ironOre,
    ironOreChange,
    ewz,
    usdBrl,
    mxm,
    mxmChange,
    treasury,
    scenario,
    goldRisingDxyFalling,
    brentRisingPetrobrasUp,
    ironOreRisingValeUp,
    mxnRisingEmergingUp,
    // NEW: VALE data for iron ore proxy
    valePrice,
    valeChange,
    isValeProxy: valePrice > 0 && ironOre === valePrice
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

  // Check if refresh is explicitly requested (bypass cache)
  const query = getQuery(event)
  const forceRefresh = query.refresh === 'true'
  
  try {
    let cachedAnalysis: { analysis: string; generatedAt: number; scenario: 'Risk-On' | 'Risk-Off' | 'Neutro' } | null = null
    
    // Only check cache if NOT doing a force refresh
    if (!forceRefresh) {
      cachedAnalysis = await getFromCache<{
        analysis: string
        generatedAt: number
        scenario: 'Risk-On' | 'Risk-Off' | 'Neutro'
      }>(CACHE_KEY)
    }
    
    // Use cached data if available and not force refreshing
    if (cachedAnalysis) {
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
    }
    
    // No cache or force refresh - fetch fresh analysis
    console.log('[Analysis] Fetching fresh analysis (forceRefresh=' + forceRefresh + ')')
    const freshAnalysis = await fetchFreshAnalysis()
    
    // Store in cache for future requests (5 minutes TTL)
    setCache(CACHE_KEY, freshAnalysis, CACHE_TTL)
    
    // Parse markdown to HTML before returning
    const parsedAnalysis = parseMarkdown(freshAnalysis.analysis)

    const response: AnalysisResponse = {
      success: true,
      data: {
        analysis: parsedAnalysis,
        generatedAt: freshAnalysis.generatedAt,
        scenario: freshAnalysis.scenario
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
