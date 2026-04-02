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
  gold: number
  brent: number
  ewz: number
  usdBrl: number
  treasury: number
  scenario: 'Risk-On' | 'Risk-Off' | 'Neutro'
}

/**
 * Build a concise prompt for Gemini for day traders
 */
function buildAnalysisPrompt(data: MarketDataForAnalysis): string {
  return `Gere uma análise macroeconômica BREVE e DIRETA para day traders de WDO e WIN.

Dados: VIX=${data.vix.toFixed(2)} (${data.vixInterpretation}), DXY=${data.dxy.toFixed(2)}, Ouro=${data.gold.toFixed(2)}, Brent=${data.brent.toFixed(2)}, USD/BRL=${data.usdBrl.toFixed(4)}, Treasury 10YR=${data.treasury.toFixed(3)}%, Cenário=${data.scenario}.

Estrutura Obrigatória (máximo 400 palavras no total):
1. CENÁRIO: [2 linhas] Resumo do cenário atual
2. SINAIS-CHAVE: [3 bullets] Os 3 indicadores mais importantes
3. DIREÇÃO: [WIN e WDO] Alta, Baixa ou Lateral com rationale em 1 linha cada
4. ALERTAS: [2 bullets] O que pode mudar o cenário hoje

Seja extremamente objetivo. Sem títulos elaborados. Sem explicações extensas.
Formato de saída livre mas MÁXIMO 400 palavras.`
}

/**
 * Call Gemini API with the given prompt
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

  // Handle API errors
  if (response.error) {
    throw new Error(`Gemini API error: ${response.error.message} (code: ${response.error.code})`)
  }

  // Extract the generated text
  const candidates = response.candidates

  // Debug logging for troubleshooting
  console.log('[Gemini Service] Raw response structure:', JSON.stringify(response, null, 2))

  if (!candidates || candidates.length === 0) {
    console.error('[Gemini Service] No candidates in response. Full response:', response)
    throw new Error('No response from Gemini API')
  }

  // Extract text using the correct Gemini 2.5 Pro response structure:
  // response.candidates[0].content.parts[0].text
  const candidate = candidates[0]
  
  // Check finish reason
  const finishReason = candidate?.finishReason
  if (finishReason === 'MAX_TOKENS') {
    console.warn('[Gemini Service] Response truncated due to MAX_TOKENS - may be incomplete')
  } else if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
    throw new Error(`Gemini API blocked response: ${finishReason}`)
  }

  // Try to extract text from parts - handle various response structures
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

  try {
    const prompt = buildAnalysisPrompt(marketData)
    const analysis = await callGeminiAPI(prompt, apiKey)
    
    console.log('[Gemini Service] Analysis generated successfully')
    return analysis
  } catch (error: any) {
    console.error('[Gemini Service] API call failed:', error.message)
    
    // Return fallback analysis on error
    return `${FALLBACK_ANALYSIS}

⚠️ Nota: A análise automatizada encontrou um erro: ${error.message || 'Falha na conexão com o Gemini'}.`
  }
}

/**
 * Validate that market data has required fields
 */
export function validateMarketData(data: Partial<MarketDataForAnalysis>): data is MarketDataForAnalysis {
  const required: (keyof MarketDataForAnalysis)[] = [
    'vix', 'dxy', 'gold', 'brent', 'ewz', 'usdBrl', 'treasury', 'scenario'
  ]
  
  return required.every(key => {
    const value = data[key]
    return typeof value === 'number' || typeof value === 'string'
  })
}
