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
   * Logic:
   * - Risk-On: VIX < 15 AND DXY falling AND EWZ rising
   * - Risk-Off: VIX > 20 AND DXY rising AND Gold rising
   * - Else: Neutro
   */
  const calculateScenario = (marketData: MarketData): ScenarioResult => {
    const signals: string[] = []
    const { vix, dxy, ewz, gold, usdBrl, brent, treasury10yr, ironOre } = marketData

    // VIX Analysis
    const vixLow = vix.value < 15
    const vixHigh = vix.value > 20
    const vixMedium = !vixLow && !vixHigh

    if (vixLow) signals.push('VIX Baixo (<15) - Baixo medo')
    if (vixMedium) signals.push('VIX Moderado (15-20) - Cautela')
    if (vixHigh) signals.push('VIX Alto (>20) - Alto medo')

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

    // Additional signals
    if (usdBrl.trend === 'down' || usdBrl.variation < 0) {
      signals.push('USD/BRL caindo - Real fortalecendo')
    } else if (usdBrl.trend === 'up' || usdBrl.variation > 0) {
      signals.push('USD/BRL subindo - Real enfraquecendo')
    }

    // Risk-On conditions: VIX < 15 AND DXY falling AND EWZ rising
    if (vixLow && dxyFalling && (ewz.trend === 'up' || ewz.variation > 0)) {
      return {
        scenario: 'Risk-On',
        color: '#4edea3',
        bgColor: 'bg-primary/10',
        signals,
        interpretation: `O ambiente é favoravel para ativos de risco. O índice de medo (VIX) está em ${vix.value.toFixed(2)}, abaixo de 15, indicando calma nos mercados. O dólar está enfraquecendo (DXY caindo), o que tende a beneficiar moedas emergentes e commodities. O ETF brasileiro (EWZ) mostra força, sugerindo entrada de recursos no Brasil.`
      }
    }

    // Risk-Off conditions: VIX > 20 AND DXY rising AND Gold rising
    if (vixHigh && dxyRising && (gold.trend === 'up' || gold.variation > 0)) {
      return {
        scenario: 'Risk-Off',
        color: '#ffb2b7',
        bgColor: 'bg-secondary/10',
        signals,
        interpretation: `Cuidado elevado no mercado. O VIX em ${vix.value.toFixed(2)} (acima de 20) indica medo significativo. O dólar está fortalecendo (DXY subindo), pressionando moedas emergentes. O ouro em alta reflete busca por segurança. Recomendamos cautela e possível redução de exposição a ativos de risco.`
      }
    }

    // Neutro - default case
    let neutrInterpretation = `Mercado em modo de espera. VIX em ${vix.value.toFixed(2)} `
    
    if (vixMedium) {
      neutrInterpretation += `não indica nem pânico nem euforia. `
    } else if (vixLow) {
      neutrInterpretation += `está baixo mas outros indicadores não confirmam Risk-On. `
    } else {
      neutrInterpretation += `está alto mas outros indicadores não confirmam Risk-Off. `
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
   */
  const getVixLevel = (vixValue: number): 'low' | 'medium' | 'high' => {
    if (vixValue < 15) return 'low'
    if (vixValue > 20) return 'high'
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
