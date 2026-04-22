/**
 * Centralized Market Scenario Determination
 * 
 * Provides a single, robust function for determining market scenario
 * based on multiple technical indicators. Used by both client (store)
 * and server (API) to ensure consistency.
 * 
 * @module utils/scenario
 */

import type { ScenarioType } from '~/types/market'
import type { ScenarioResult } from '~/types/market'

/**
 * Input parameters for scenario determination
 */
export interface ScenarioInput {
  vix: number
  dxy: number
  vixChangePercent?: number
  dxyChangePercent?: number
  gold?: number
  brent?: number
  spx?: number
}

/**
 * Detailed scenario result with confidence and signals
 */
export interface ScenarioAnalysis {
  scenario: ScenarioType
  color: string
  signals: string[]
  interpretation: string
  confidence: number
}

/**
 * Determine market scenario from risk indicators
 * 
 * Uses weighted combination of VIX, DXY, and other indicators:
 * - VIX absolute value (primary fear indicator)
 * - VIX change percent (momentum)
 * - DXY (dollar strength)
 * 
 * @param input - Risk indicator values
 * @returns ScenarioAnalysis with scenario type, color, signals, and confidence
 * 
 * @example
 * ```ts
 * const result = determineScenario({ vix: 18.5, dxy: 108.5, vixChangePercent: 3.2 })
 * // Returns { scenario: 'Risk-Off', color: '#ffb2b7', ... }
 * ```
 */
export function determineScenario(input: ScenarioInput): ScenarioAnalysis {
  const {
    vix,
    dxy,
    vixChangePercent = 0,
    dxyChangePercent = 0,
    gold = 0,
    brent = 0
  } = input

  // Track signals for explanation
  const signals: string[] = []

  // ========================================
  // RISK-OFF CONDITIONS (weighted check)
  // ========================================
  // Primary: VIX above 18 indicates significant fear
  // Secondary: VIX above 15 with elevated DXY
  // Tertiary: High VIX with positive momentum (rising fear)
  
  const isHighVix = vix >= 18
  const isElevatedVix = vix >= 15
  const isHighDxy = dxy >= 108
  const isVixRising = vixChangePercent > 0
  
  if (isHighVix || (isElevatedVix && isHighDxy) || (isElevatedVix && isVixRising && dxy > 106)) {
    signals.push(`VIX ${vix >= 18 ? '>= 18' : '>= 15'}: ${vix.toFixed(2)}`)
    if (isHighDxy) signals.push(`DXY > 108: ${dxy.toFixed(2)}`)
    if (isVixRising) signals.push(`VIX subindo: ${vixChangePercent > 0 ? '+' : ''}${vixChangePercent.toFixed(1)}%`)
    
    return {
      scenario: 'Risk-Off',
      color: '#ffb2b7',
      signals,
      interpretation: 'Mercado em modo de aversão a risco. Incerteza elevada. Protect assets em alta, mercados emergentes em queda.',
      confidence: vix >= 20 ? 92 : vix >= 18 ? 85 : 75
    }
  }

  // ========================================
  // RISK-ON CONDITIONS (weighted check)
  // ========================================
  // Requires: VIX below 15 AND either:
  //   - VIX declining significantly (-7% or more), OR
  //   - DXY below 105 (weak dollar)
  
  const isLowVix = vix < 15
  const isVixDeclining = vixChangePercent <= -7
  const isWeakDxy = dxy < 105
  const isVeryWeakDxy = dxy < 103

  if (isLowVix && (isVixDeclining || isWeakDxy)) {
    if (isVixDeclining) {
      signals.push(`VIX em queda: ${vixChangePercent <= -10 ? '-10%+' : vixChangePercent.toFixed(1)}%`)
    }
    if (isWeakDxy) {
      signals.push(`DXY fraco: ${dxy.toFixed(2)}`)
    }
    signals.push(`VIX < 15: ${vix.toFixed(2)}`)
    
    // Strong Risk-On: VIX < 14 AND declining AND weak DXY
    if (vix < 14 && isVixDeclining && isWeakDxy) {
      return {
        scenario: 'Risk-On',
        color: '#4edea3',
        signals,
        interpretation: 'Mercado em forte busca por risco. Apetite elevado em emergentes. WIN com alta probabilidade de Alta.',
        confidence: 90
      }
    }
    
    return {
      scenario: 'Risk-On',
      color: '#4edea3',
      signals,
      interpretation: 'Mercado busca risco em emergentes. Dólar fraco favorece posições compradas em WIN.',
      confidence: 80
    }
  }

  // ========================================
  // NEUTRAL CONDITIONS
  // ========================================
  // VIX between 15-18 without clear momentum
  // Or VIX < 15 but not declining enough
  
  const vixInRange = vix >= 15 && vix < 18
  
  if (vixInRange) {
    signals.push(`VIX range neutro: ${vix.toFixed(2)}`)
  } else if (vix < 15) {
    signals.push(`VIX abaixo de 15 sem queda suficiente: ${vix.toFixed(2)} (${vixChangePercent.toFixed(1)}%)`)
  }
  
  if (dxy >= 105 && dxy <= 108) {
    signals.push(`DXY lateral: ${dxy.toFixed(2)}`)
  }

  return {
    scenario: 'Neutro',
    color: '#f9bd22',
    signals,
    interpretation: 'Mercado em modo neutro. Aguardando catalisadores para direção. VIX não indica pânico nem euforia.',
    confidence: 65
  }
}

/**
 * Simple scenario type only (for APIs that just need the type)
 * 
 * @param vix - VIX value
 * @param dxy - DXY value  
 * @param vixChangePercent - VIX change percentage
 * @returns ScenarioType
 */
export function determineScenarioType(
  vix: number,
  dxy: number,
  vixChangePercent: number = 0
): ScenarioType {
  const result = determineScenario({ vix, dxy, vixChangePercent })
  return result.scenario
}