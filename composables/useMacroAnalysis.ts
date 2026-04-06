export interface MarketData {
  usdBrl: {
    value: number
    variation: number
    variationPercent: number
    trend: 'up' | 'down' | 'neutral'
  }
  dxy: {
    value: number
    variation: number
    variationPercent: number
    trend: 'up' | 'down' | 'neutral'
  }
  vix: {
    value: number
    variation: number
    variationPercent: number
    trend: 'up' | 'down' | 'neutral'
  }
  gold: {
    value: number
    variation: number
    variationPercent: number
    trend: 'up' | 'down' | 'neutral'
  }
  brent: {
    value: number
    variation: number
    variationPercent: number
    trend: 'up' | 'down' | 'neutral'
  }
  ewz: {
    value: number
    variation: number
    variationPercent: number
    trend: 'up' | 'down' | 'neutral'
  }
  treasury10yr: {
    value: number
    variation: number
    variationPercent: number
    trend: 'up' | 'down' | 'neutral'
  }
  ironOre: {
    value: number
    variation: number
    variationPercent: number
    trend: 'up' | 'down' | 'neutral'
  }
  mxn: {  // NEW: Mexican Peso (USD/MXN)
    value: number
    variation: number
    variationPercent: number
    trend: 'up' | 'down' | 'neutral'
  }
}

export interface ScenarioResult {
  scenario: 'Risk-On' | 'Risk-Off' | 'Neutro'
  color: string
  bgColor: string
  signals: string[]
  interpretation: string
}

export function useMacroAnalysis() {
  /**
    * Calculate market scenario based on multiple indicators
    * 
    * NOVOS LIMIARES:
    * - Risk-On: VIX < 15 AND variação DECRESCENTE -7% (caindo = menos medo)
    * - Risk-Off: VIX > 15
    * - Neutro: outras condições
    */
  const calculateScenario = (marketData: MarketData): ScenarioResult => {
    const signals: string[] = []
    const { vix, dxy, ewz, gold, usdBrl, brent, treasury10yr, ironOre, mxn } = marketData

    // VIX Analysis - NOVOS LIMIARES
    const vixHigh = vix.value > 15  // Alterado de 20 para 15
    const vixLow = vix.value < 15
    const vixWithDecline = vixLow && vix.variationPercent <= -7  // VIX caindo = menos medo

    if (vixWithDecline) signals.push('VIX Baixo (<15) + queda -7% - Tomando Risco')
    else if (vixLow) signals.push('VIX Baixo (<15) - Cautela')
    else if (vixHigh) signals.push('VIX Alto (>15) - Medo')

    // DXY Analysis
    const dxyFalling = dxy.trend === 'down' || dxy.variation < 0
    const dxyRising = dxy.trend === 'up' || dxy.variation > 0

    if (dxyFalling) signals.push('DXY em queda - Dólar fraco')
    if (dxyRising) signals.push('DXY em alta - Dólar forte')

    // EWZ Analysis
    if (ewz.trend === 'up' || ewz.variation > 0) {
      signals.push('EWZ em alta - Bolsas em alta')
    } else if (ewz.trend === 'down' || ewz.variation < 0) {
      signals.push('EWZ em queda - Bolsas em queda')
    }

    // Gold Analysis
    if (gold.trend === 'up' || gold.variation > 0) {
      signals.push('Ouro em alta - Busca por segurança')
    } else if (gold.trend === 'down' || gold.variation < 0) {
      signals.push('Ouro em queda - Menor demanda por segurança')
    }

    // NEW: Gold + DXY correlation = Risk-On confirmation
    const goldRising = gold.trend === 'up' || gold.variation > 0
    const dxyFallingConfirm = dxy.trend === 'down' || dxy.variation < 0
    if (goldRising && dxyFallingConfirm) {
      signals.push('Ouro subindo + Dólar caindo = Confirma Risk-On')
    }

    // NEW: Brent → PETR4 correlation
    if (brent.trend === 'up' || brent.variation > 0) {
      signals.push(`Brent em alta (${brent.variationPercent.toFixed(1)}%) → Pressão positiva em PETR4`)
    } else if (brent.trend === 'down' || brent.variation < 0) {
      signals.push(`Brent em queda (${brent.variationPercent.toFixed(1)}%) → Pressão negativa em PETR4`)
    }

    // NEW: Iron Ore → VALE correlation (iron ore proxy via VALE)
    if (ironOre.trend === 'up' || ironOre.variation > 0) {
      signals.push(`Minério em alta (${ironOre.variationPercent.toFixed(1)}%) → Proxy: VALE em alta`)
    } else if (ironOre.trend === 'down' || ironOre.variation < 0) {
      signals.push(`Minério em queda (${ironOre.variationPercent.toFixed(1)}%) → Proxy: VALE em queda`)
    }
    
    // NEW: VALE direct signal (iron ore proxy)
    // VALE é uma mineradora de ferro pure-play, 
    // quando VALE sobe → minério de ferro provavelmentesubindo
    if (ironOre.trend === 'up' || ironOre.variation > 0) {
      signals.push(`VALE em alta → Proxy: Minério de ferro em alta (correlação ~0.85)`)
    } else if (ironOre.trend === 'down' || ironOre.variation < 0) {
      signals.push(`VALE em queda → Proxy: Minério de ferro em queda (correlação ~0.85)`)
    }

    // NEW: MXN (Mexican Peso) - Emerging markets sentiment
    if (mxn.trend === 'up' || mxn.variation > 0) {
      signals.push(`MXN em alta (${mxn.variationPercent.toFixed(1)}%) → Confirma Risk-On em emergentes`)
    } else if (mxn.trend === 'down' || mxn.variation < 0) {
      signals.push(`MXN em queda (${mxn.variationPercent.toFixed(1)}%) → Confirma Risk-Off em emergentes`)
    }

    // Additional signals
    if (usdBrl.trend === 'down' || usdBrl.variation < 0) {
      signals.push('USD/BRL caindo - Real fortalecendo')
    } else if (usdBrl.trend === 'up' || usdBrl.variation > 0) {
      signals.push('USD/BRL subindo - Real enfraquecendo')
    }

    // Risk-On conditions: VIX < 15 AND variação DECRESCENTE >= 7% (caindo = menos medo)
    if (vixLow && vix.variationPercent <= -7) {
      return {
        scenario: 'Risk-On',
        color: '#4edea3',
        bgColor: 'bg-primary/10',
        signals,
        interpretation: `O ambiente é favoravel para ativos de risco. O índice de medo (VIX) está em ${vix.value.toFixed(2)} (abaixo de 15), com queda de ${Math.abs(vix.variationPercent).toFixed(1)}% (-7%), indicando busca por risco nos mercados.`
      }
    }

    // Risk-Off conditions: VIX > 15 (NOVO LIMIAR)
    if (vixHigh) {
      return {
        scenario: 'Risk-Off',
        color: '#ffb2b7',
        bgColor: 'bg-secondary/10',
        signals,
        interpretation: `Cuidado no mercado. O VIX em ${vix.value.toFixed(2)} (acima de 15) indica medo/aversion a risco. Recomendamos cautela e possível redução de exposição a ativos de risco.`
      }
    }

    // Neutro - default case: VIX < 15 sem variação suficiente
    let neutrInterpretation = `Mercado em modo de espera. VIX em ${vix.value.toFixed(2)} `
    
    if (vixLow) {
      neutrInterpretation += `está abaixo de 15, porém sem variação -7% (atual: ${vix.variationPercent.toFixed(1)}%). Aguardando confirmação de Risk-On. `
    }

    if (dxy.trend === 'neutral') {
      neutrInterpretation += `O DXY está lateral, sem direção clara. `
    }

    if (ewz.trend === 'neutral') {
      neutrInterpretation += `O EWZ não mostra direção definida. `
    }

    neutrInterpretation += `Aguarde por maior clareza antes de posicionar.`

    return {
      scenario: 'Neutro',
      color: '#f9bd22',
      bgColor: 'bg-tertiary/10',
      signals,
      interpretation: neutrInterpretation
    }
  }

  /**
   * Determine VIX level for color coding
   * NOVOS LIMIARES: > 15 = high, < 15 = low
   */
  const getVixLevel = (vixValue: number): 'low' | 'medium' | 'high' => {
    if (vixValue > 15) return 'high'  // Risk-Off
    if (vixValue < 15) return 'low'   // Risk-On ou Neutro
    return 'medium'
  }

  /**
   * Get trend from variation value
   */
  const getTrend = (variation: number): 'up' | 'down' | 'neutral' => {
    if (variation > 0.1) return 'up'
    if (variation < -0.1) return 'down'
    return 'neutral'
  }

  return {
    calculateScenario,
    getVixLevel,
    getTrend,
  }
}
