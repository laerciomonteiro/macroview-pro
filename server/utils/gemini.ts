/**
 * Gemini AI Service for Market Analysis
 * MacroView Pro - Institutional Trading Terminal
 * 
 * Provides AI-generated market commentary using Google Gemini 2.5
 * for day traders focused on WDO (Dólar Futuro) and WIN (Mini Índice)
 */

import { useRuntimeConfig } from '#imports'

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent'

// Rate limiting configuration
const MAX_RETRIES = 3
const BASE_RETRY_DELAY_MS = 1000
const MAX_RETRY_DELAY_MS = 16000
const RATE_LIMIT_STATUS = 429

// Cache for analysis results (avoid redundant API calls)
let analysisCache: {
  text: string
  timestamp: number
} | null = null
const CACHE_TTL_MS = 30000 // 30 seconds cache

// Fallback analysis when API fails
const FALLBACK_ANALYSIS = `Análise de mercado temporariamente indisponível. 

Enquanto aguardamos a atualização do Gemini, considere:

📊 Cenário Geral:
• Mantenha cautela com posições abertas
• Monitore VIX e DXY para direcionamento
• Aguarde confirmação de tendência

⚠️ Recomendação:
Não realize operações de grande volume até que a análise seja restaurada.`

export interface MarketDataForAnalysis {
  vix: number
  vixInterpretation: string
  dxy: number
  dxyChange: number
  gold: number
  goldChange: number
  goldTrend: 'up' | 'down' | 'neutral'
  brent: number
  brentChange: number
  ironOre: number
  ironOreChange: number
  ewz: number
  usdBrl: number
  mxm: number  // NEW: Mexican Peso
  mxmChange: number
  treasury: number
  scenario: 'Risk-On' | 'Risk-Off' | 'Neutro'
  
  // NEW: Correlation signals for AI
  goldRisingDxyFalling: boolean  // CONFIRMA Risk-On
  brentRisingPetrobrasUp: boolean    // PRESSÃO ALTA
  ironOreRisingValeUp: boolean       // PRESSÃO ALTA
  mxnRisingEmergingUp: boolean     // CONFIRMA Risk-On
  
  // NEW: VALE data (iron ore proxy)
  valePrice: number
  valeChange: number
  isValeProxy: boolean  // true when using VALE as iron ore proxy
  
  newsContext?: string
}

/**
 * Build a concise prompt for Gemini for day traders
 */
function buildAnalysisPrompt(data: MarketDataForAnalysis): string {
  const newsSection = data.newsContext
    ? `\n\n## NOTÍCIAS RECENTES:\n${data.newsContext}`
    : ''

  // Build correlation signals section
  const activeCorrelations: string[] = []
  if (data.goldRisingDxyFalling) activeCorrelations.push('OURO↑ + DXY↓ = Risk-On Confirm')
  if (data.brentRisingPetrobrasUp) activeCorrelations.push(`BRENT↑ → PETR4 em alta`)
  if (data.ironOreRisingValeUp) activeCorrelations.push(`MINÉRIO↑ → VALE em alta`)
  if (data.mxnRisingEmergingUp) activeCorrelations.push('MXN↑ = Emergiuentes em alta')
  
  const correlationsSection = activeCorrelations.length > 0
    ? `\n\n## CORRELAÇÕES ATIVAS:\n${activeCorrelations.join('\n')}`
    : ''

  // Gold + DXY signal description
  const goldSignal = data.goldTrend === 'up' ? 'subindo' : data.goldTrend === 'down' ? 'caindo' : 'lateral'
  const dxySignal = data.dxyChange < 0 ? 'caindo (fraco)' : data.dxyChange > 0 ? 'subindo (forte)' : 'lateral'
  const mxmSignal = data.mxmChange > 0 ? 'subindo (apreciando)' : data.mxmChange < 0 ? 'caindo (depreciando)' : 'lateral'
  const brentSignal = data.brentChange > 0 ? 'subindo' : data.brentChange < 0 ? 'caindo' : 'lateral'
  const ironSignal = data.ironOreChange > 0 ? 'subindo' : data.ironOreChange < 0 ? 'caindo' : 'lateral'
  const valeSignal = data.valeChange > 0 ? 'subindo (proxy minério)' : data.valeChange < 0 ? 'caindo (proxy minério)' : 'lateral'
  
  // VALE proxy indicator
  const valeProxyNote = data.isValeProxy ? ' (via VALE3.SA como proxy)' : ''

  return `Gere uma análise macroeconômica BREVE e DIRETA para day traders de WDO e WIN.

## DADOS DE MERCADO:
- VIX: ${data.vix.toFixed(2)} (${data.vixInterpretation})
- DXY: ${data.dxy.toFixed(2)} ${dxySignal}
- Ouro: ${data.gold.toFixed(2)} ${goldSignal}
- Brent: ${data.brent.toFixed(2)} ${brentSignal}
- Minério: ${data.ironOre.toFixed(2)} ${ironSignal}${valeProxyNote}
- VALE3.SA: ${data.valePrice.toFixed(2)} ${valeSignal}
- MXN: ${data.mxm.toFixed(4)} ${mxmSignal}
- USD/BRL: ${data.usdBrl.toFixed(4)}
- EWZ: ${data.ewz.toFixed(2)}
- Treasury 10YR: ${data.treasury.toFixed(3)}%
- CENÁRIO: ${data.scenario}${newsSection}${correlationsSection}

## CORRELAÇÕES DE COMMODITIES:
- Brent subindo → PETR4 em alta
- VALE subindo → Minério de ferro em alta (correlação ~0.85)
- Ouro subindo + Dólar caindo = Confirma Risk-On
- MXN subindo = Confirma Risk-On em emergentes

Estrutura Obrigatória (máximo 400 palavras no total):
1. CENÁRIO: [2 linhas] Resumo do cenário atual
2. SINAIS-CHAVE: [3 bullets] Os 3 indicadores mais importantes (incluindo correlações ativas)
3. DIREÇÃO: [WIN e WDO] Alta, Baixa ou Lateral com rationale em 1 linha cada
4. ALERTAS: [2 bullets] O que pode mudar o cenário hoje

Seja extremamente objetivo. Use as notícias e correlações para enriquecer a análise. Sem títulos elaborados.
Formato de saída livre mas MÁXIMO 400 palavras.`
}

/**
 * Calculate exponential backoff delay with jitter
 */
function getRetryDelay(attempt: number): number {
  const exponentialDelay = Math.min(
    BASE_RETRY_DELAY_MS * Math.pow(2, attempt),
    MAX_RETRY_DELAY_MS
  )
  // Add jitter (±25%) to prevent thundering herd
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1)
  return Math.round(exponentialDelay + jitter)
}

/**
 * Check if response indicates rate limiting
 */
function isRateLimited(response: any): boolean {
  return response?.error?.code === RATE_LIMIT_STATUS || 
         response?.error?.message?.includes('rate limit') ||
         response?.error?.message?.includes('quota')
}

/**
 * Call Gemini API with exponential backoff retry
 */
async function callGeminiAPI(prompt: string, apiKey: string): Promise<string> {
  const url = `${GEMINI_API_URL}?key=${apiKey}`
  
  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4000,
      topP: 0.95,
      topK: 40
    }
  }

  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await $fetch<{
        candidates?: Array<{
          content?: {
            role?: string
            parts?: Array<{
              text?: string
            }>
          }
          finishReason?: string
        }>
        usageMetadata?: {
          thoughtsTokenCount?: number
        }
        error?: {
          message: string
          code: number
        }
      }>(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      })

      // Handle rate limiting with exponential backoff
      if (isRateLimited(response)) {
        const retryAfter = getRetryDelay(attempt)
        console.warn(`[Gemini Service] Rate limited, retrying in ${retryAfter}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
        
        if (attempt < MAX_RETRIES - 1) {
          await sleep(retryAfter)
          continue
        }
        
        throw new Error('Gemini API rate limit exceeded. Por favor, aguarde alguns minutos antes de tentar novamente.')
      }

      // Handle API errors
      if (response.error) {
        throw new Error(`Gemini API error: ${response.error.message} (code: ${response.error.code})`)
      }

      // Extract the generated text
      const candidates = response.candidates

      if (!candidates || candidates.length === 0) {
        console.error('[Gemini Service] No candidates in response. Full response:', response)
        throw new Error('No response from Gemini API')
      }

      // Extract text using the correct Gemini 2.5 Pro response structure:
      const candidate = candidates[0]
      
      // Check finish reason
      const finishReason = candidate?.finishReason
      if (finishReason === 'MAX_TOKENS') {
        console.warn('[Gemini Service] Response truncated due to MAX_TOKENS - may be incomplete')
      } else if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
        throw new Error(`Gemini API blocked response: ${finishReason}`)
      }

      // Try to extract text from parts
      const parts = candidate?.content?.parts
      const text = parts?.[0]?.text

      if (!text) {
        console.error('[Gemini Service] Invalid response format. Expected structure:')
        console.error('[Gemini Service] { candidates: [{ content: { parts: [{ text: "..." }] } }] }')
        console.error('[Gemini Service] Actual candidate content:', candidate?.content)
        console.error('[Gemini Service] Finish reason:', finishReason)
        throw new Error('Invalid response format from Gemini API')
      }

      return text
    } catch (error: any) {
      lastError = error
      
      // Don't retry on certain errors
      if (error.message?.includes('Invalid response format') ||
          error.message?.includes('blocked response') ||
          error.message?.includes('rate limit exceeded')) {
        throw error
      }
      
      // Retry on network errors or other issues
      if (attempt < MAX_RETRIES - 1) {
        const retryDelay = getRetryDelay(attempt)
        console.warn(`[Gemini Service] Request failed (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${retryDelay}ms:`, error.message)
        await sleep(retryDelay)
        continue
      }
    }
  }
  
  throw lastError || new Error('Gemini API request failed after all retries')
}

/**
 * Sleep utility for async delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate market analysis using Gemini 2.5
 * 
 * @param marketData - Current market data for analysis
 * @returns AI-generated analysis text in Portuguese
 */
export async function generateMarketAnalysis(marketData: MarketDataForAnalysis): Promise<string> {
  const config = useRuntimeConfig()
  
  // Check if API key is configured
  const apiKey = config.public.geminiApiKey as string | undefined
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    console.warn('[Gemini Service] API key not configured, using fallback analysis')
    return FALLBACK_ANALYSIS
  }

  // Check cache first to avoid redundant API calls
  const now = Date.now()
  if (analysisCache && (now - analysisCache.timestamp) < CACHE_TTL_MS) {
    console.log('[Gemini Service] Returning cached analysis')
    return analysisCache.text
  }

  try {
    const prompt = buildAnalysisPrompt(marketData)
    const analysis = await callGeminiAPI(prompt, apiKey)
    
    // Store in cache
    analysisCache = {
      text: analysis,
      timestamp: now
    }
    
    console.log('[Gemini Service] Analysis generated successfully')
    return analysis
  } catch (error: any) {
    console.error('[Gemini Service] API call failed:', error.message)
    
    // Return fallback analysis on error - user-friendly message without exposing HTTP codes
    const userFriendlyMessage = error.message?.includes('rate limit')
      ? 'Sistema temporariamente sobrecarregado. A análise será restaurada automaticamente em breve.'
      : 'Estamos enfrentando dificuldades com a análise automatizada. Tente novamente em alguns minutos.'
    
    return `${FALLBACK_ANALYSIS}

📋 Nota: ${userFriendlyMessage}`
  }
}

/**
 * Validate that market data has required fields
 */
export function validateMarketData(data: Partial<MarketDataForAnalysis>): data is MarketDataForAnalysis {
  const required: (keyof MarketDataForAnalysis)[] = [
    'vix', 'dxy', 'gold', 'brent', 'ewz', 'usdBrl', 'treasury', 'scenario',
    'dxyChange', 'goldChange', 'goldTrend', 'brentChange', 'ironOre', 'ironOreChange',
    'mxm', 'mxmChange', 'goldRisingDxyFalling', 'brentRisingPetrobrasUp',
    'ironOreRisingValeUp', 'mxnRisingEmergingUp',
    // NEW: VALE fields
    'valePrice', 'valeChange', 'isValeProxy'
  ]
  
  return required.every(key => {
    const value = data[key]
    return typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean'
  })
}
