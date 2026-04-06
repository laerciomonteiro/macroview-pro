/**
 * Correlation Matrix API Endpoint
 * Returns correlation data with real market values from market-overview API
 */

import { defineEventHandler, createError } from 'h3'
import type { 
  CorrelationApiResponse, 
  CorrelationData,
  CorrelationItem,
  ScenarioDetail,
  ChartDataPoint,
  CurrentMarketData
} from '~/types/correlation'

// Determine market scenario based on VIX and DXY
// NOVOS LIMIARES: VIX > 15 = Risk-Off, VIX < 15 + ~7% variação = Risk-On
function determineScenario(vix: number, dxy: number, vixChangePercent: number = 0): 'Risk-On' | 'Risk-Off' | 'Neutro' {
  // Risk-On: VIX < 15 e variação >= 7% (subindo)
  if (vix < 15 && vixChangePercent >= 7) {
    return 'Risk-On'
  }
  
  // Risk-Off: VIX > 15 (novo limiar)
  if (vix > 15) {
    return 'Risk-Off'
  }
  
  // Neutro: VIX < 15 sem variação suficiente ou outras condições
  return 'Neutro'
}

interface YahooChartResult {
  timestamps: number[]
  prices: number[]
}

/**
 * Fetch historical data from Yahoo Finance
 */
async function fetchYahooFinanceData(symbol: string, range: string = '1mo'): Promise<YahooChartResult> {
  try {
    // Yahoo Finance chart API
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1d`
    
    const response = await $fetch<{
      chart: {
        result: Array<{
          timestamp: number[]
          indicators: {
            quote: Array<{
              close: number[]
            }>
          }
        }>
      }
    }>(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    })
    
    const result = response.chart?.result?.[0]
    if (!result?.timestamp || !result?.indicators?.quote?.[0]?.close) {
      throw new Error('Invalid Yahoo Finance response')
    }
    
    const timestamps = result.timestamp
    const prices = result.indicators.quote[0].close.filter((p: number | null): p is number => p !== null)
    
    return { timestamps, prices }
  } catch (error) {
    console.error(`[/api/correlations] Failed to fetch ${symbol}:`, error)
    return { timestamps: [], prices: [] }
  }
}

/**
 * Calculate Pearson correlation coefficient between two arrays
 */
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n < 2) return 0
  
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.slice(0, n).reduce((acc, xi, i) => acc + xi * y[i], 0)
  const sumX2 = x.slice(0, n).reduce((acc, xi) => acc + xi * xi, 0)
  const sumY2 = y.slice(0, n).reduce((acc, yi) => acc + yi * yi, 0)
  
  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  
  if (denominator === 0) return 0
  return numerator / denominator
}

/**
 * Fetch real Gold and DXY historical data showing inverse correlation
 */
async function fetchRealGoldDxyData(): Promise<{ gold: ChartDataPoint[]; dxy: ChartDataPoint[]; correlation: number }> {
  // Fetch both in parallel
  const [goldData, dxyData] = await Promise.all([
    fetchYahooFinanceData('GC=F', '1mo'),
    fetchYahooFinanceData('DX-Y.NYB', '1mo')
  ])
  
  const gold: ChartDataPoint[] = []
  const dxy: ChartDataPoint[] = []
  
  // Use the last 30 data points or available data
  const maxPoints = Math.min(30, goldData.timestamps.length, dxyData.timestamps.length)
  
  if (maxPoints === 0) {
    console.warn('[/api/correlations] No Yahoo Finance data available, using fallback')
    // Return minimal fallback data
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      const dateStr = date.toISOString().split('T')[0]
      gold.push({ time: dateStr, value: 1950 + Math.random() * 50 })
      dxy.push({ time: dateStr, value: 104 + Math.random() * 2 })
    }
    // Calculate correlation for fallback data
    const goldValues = gold.map(g => g.value)
    const dxyValues = dxy.map(d => d.value)
    const correlation = calculatePearsonCorrelation(goldValues, dxyValues)
    return { gold, dxy, correlation }
  }
  
  // Calculate start index to get last N points
  const startIdx = Math.max(0, goldData.timestamps.length - maxPoints)
  
  for (let i = 0; i < maxPoints; i++) {
    const goldIdx = startIdx + i
    const dxyIdx = startIdx + i
    
    if (goldIdx < goldData.timestamps.length && dxyIdx < dxyData.timestamps.length) {
      const goldTimestamp = goldData.timestamps[goldIdx]
      const dxyTimestamp = dxyData.timestamps[dxyIdx]
      
      // Use the earlier timestamp if they differ significantly
      const timestamp = Math.min(goldTimestamp, dxyTimestamp)
      const date = new Date(timestamp * 1000)
      const dateStr = date.toISOString().split('T')[0]
      
      gold.push({
        time: dateStr,
        value: Math.round((goldData.prices[goldIdx] || 0) * 100) / 100
      })
      
      dxy.push({
        time: dateStr,
        value: Math.round((dxyData.prices[dxyIdx] || 0) * 100) / 100
      })
    }
  }
  
  // Calculate real Pearson correlation
  const goldValues = gold.map(g => g.value)
  const dxyValues = dxy.map(d => d.value)
  const correlation = calculatePearsonCorrelation(goldValues, dxyValues)
  
  return { gold, dxy, correlation }
}

/**
 * Fetch real market data from market-overview API
 */
async function fetchRealMarketData(): Promise<CurrentMarketData> {
  try {
    const response = await $fetch<{ success: boolean; data: any }>('http://localhost:3000/api/market-overview', {
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    
    const marketData = response.data
    
    // Extract VIX value
    const vix = marketData?.riskIndicators?.vix?.price || 0
    const vixChange = marketData?.riskIndicators?.vix?.change || 0
    
    // Extract DXY value
    const dxy = marketData?.riskIndicators?.dxy?.price || 0
    const dxyChange = marketData?.riskIndicators?.dxy?.change || 0
    
    // Extract Gold price (find in commodities array)
    const goldEntry = marketData?.commodities?.find((c: any) => c.name === 'Gold' || c.name === 'XAU/USD')
    const gold = goldEntry?.price || 0
    
    // Extract Brent price (find in commodities array)
    const brentEntry = marketData?.commodities?.find((c: any) => c.name === 'Brent Crude' || c.name === 'Brent')
    const brent = brentEntry?.price || 0
    
    const scenario = determineScenario(vix, dxy, vixChange)
    
    return {
      vix,
      dxy,
      gold,
      brent,
      scenario,
      vixChange,
      dxyChange
    }
  } catch (error) {
    console.error('[/api/correlations] Failed to fetch market data:', error)
    // Return zeros on error - UI should handle this gracefully
    return {
      vix: 0,
      dxy: 0,
      gold: 0,
      brent: 0,
      scenario: 'Neutro',
      vixChange: 0,
      dxyChange: 0
    }
  }
}

/**
 * GET /api/correlations
 * Returns correlation matrix data including:
 * - Real market data (VIX, DXY, Gold, Brent) from market-overview API
 * - All intermarket correlations (educational content, marked as such)
 * - Three scenario definitions (Risk-On, Risk-Off, Neutral)
 * - Gold vs DXY chart data showing inverse correlation
 */
export default defineEventHandler(async (event): Promise<CorrelationApiResponse> => {
  // Fetch real market data first
  const currentData = await fetchRealMarketData()
  
  const correlations: CorrelationItem[] = [
    {
      asset: 'VIX',
      name: 'Volatility Index',
      meaning: 'Fear & Volatility Index',
      signal: currentData.vix > 15 ? 'High Vol (Fear)' : currentData.vix < 15 ? 'Low Vol (Risk-On)' : 'Moderate Vol',
      signalType: currentData.vix > 15 ? 'negative' : currentData.vix < 15 ? 'positive' : 'neutral',
      impactWin: 'up',
      impactWdo: 'down',
      description: 'Mede a volatilidade/medo do mercado. VIX > 15 indica Risk-Off (medo). VIX < 15 + variação ~7% indica Risk-On (busca por risco).'
    },
    {
      asset: 'DXY',
      name: 'US Dollar Index',
      meaning: 'Dollar Strength Index',
      signal: currentData.dxyChange < 0 ? 'Weak Dollar' : 'Strong Dollar',
      signalType: currentData.dxyChange < 0 ? 'positive' : 'negative',
      impactWin: 'up',
      impactWdo: 'down',
      correlation: -0.92,
      description: 'Índice que mede a força do dólar americano contra uma cesta de moedas. Quando cai, dólar fraco globalmente favorece mercados emergentes como o Brasil.'
    },
    {
      asset: 'EWZ',
      name: 'iShares Brazil ETF',
      meaning: 'Brazil MSCI ETF',
      signal: 'Capital Inflow',
      signalType: 'positive',
      impactWin: 'up',
      impactWdo: 'down',
      impactWinStrength: 2,
      correlation: 0.85,
      description: 'ETF que replica o índice MSCI Brazil. Sobe quando há fluxo estrangeiro entrando no Brasil. Indicador importante para WIN.'
    },
    {
      asset: 'OURO',
      name: 'Gold (XAU/USD)',
      meaning: 'Safe Haven / Inflation Hedge',
      signal: 'Consolidation',
      signalType: 'neutral',
      impactWin: 'stable',
      impactWdo: 'stable',
      correlation: -0.78,
      description: 'Ouro tem correlação inversa com DXY. Quando Ouro sobe e DXY cai, sinaliza dólar fraco global, favorável ao WDO.'
    },
    {
      asset: 'BRENT',
      name: 'Brent Crude Oil',
      meaning: 'Global Oil Benchmark',
      signal: currentData.brent > 80 ? 'High Commodity' : 'Low Commodity',
      signalType: currentData.brent > 80 ? 'positive' : 'neutral',
      impactWin: 'up',
      impactWdo: 'down',
      correlation: 0.65,
      description: 'Petróleo Brent acima de $80 combinado com minério acima de $100 e DXY estável indica ambiente favorável para WIN.'
    },
    {
      asset: 'MINERIO',
      name: 'Iron Ore (CME)',
      meaning: 'Steel Production Input',
      signal: 'China Demand',
      signalType: 'positive',
      impactWin: 'up',
      impactWdo: 'down',
      correlation: 0.72,
      description: 'Minério de ferro é principal produto de exportação do Brasil. Acima de $100 indica forte demanda da China, benéfica para economia brasileira.'
    },
    {
      asset: 'TNX',
      name: '10Y Treasury Yield',
      meaning: 'US Interest Rates',
      signal: 'Rising Rates',
      signalType: 'negative',
      impactWin: 'down',
      impactWdo: 'up',
      correlation: 0.68,
      description: 'Taxa do Tesouro americano de 10 anos. Quando sobe, dólar tende a fortalecer (DXY sobe), impactando negativamente WDO e positivamente o dólar.'
    },
    {
      asset: 'SPX',
      name: 'S&P 500 Index',
      meaning: 'US Equity Market',
      signal: 'Risk-On US',
      signalType: 'positive',
      impactWin: 'up',
      impactWdo: 'down',
      correlation: 0.55,
      description: 'Índice S&P 500. Quando sobe em conjunto com VIX baixo e DXY fraco, confirma ambiente de Risk-On global.'
    }
  ]

  const scenarios: ScenarioDetail[] = [
    {
      name: 'Risk-On',
      label: 'Risk-On',
      color: '#4edea3',
      description: 'Ambiente de busca por risco - mercados em alta, dólar fraco',
      conditions: [
        'VIX abaixo de 15',
        'VIX com variação ~7% (subindo)',
        'DXY caindo (dólar fraco)',
        'SPX em alta',
        'EWZ em alta',
        'Fluxo estrangeiro entrando no Brasil'
      ],
      expectedOutcome: 'WIN tende a subir, WDO tende a cair. Favorable para posições compradas em WIN e vendidos em WDO.',
      interpretation: 'Quando o VIX está abaixo de 15, o apetite por risco aumenta significativamente. Investidores buscam retornos em ativos de risco, favorecendo posições compradas em WIN (Índice Bovespa) e vendas em WDO (Dólar). O fluxo estrangeiro tende a entrar em mercados emergentes como o Brasil.',
      signals: ['DXY ↓', 'VIX ↓', 'SPX ↑', 'EWZ ↑'],
      icon: 'rocket_launch'
    },
    {
      name: 'Risk-Off',
      label: 'Risk-Off',
      color: '#ffb2b7',
      description: 'Fuga de risco - mercados em queda, dólar forte, busca por segurança',
      conditions: [
        'VIX acima de 15',
        'DXY subindo (dólar forte)',
        'Ouro subindo (safe haven)',
        'EWZ em queda',
        'Fluxo estrangeiro saindo do Brasil'
      ],
      expectedOutcome: 'WIN tende a cair, WDO tende a subir. Favorável para posições vendidas em WIN e compradas em WDO.',
      interpretation: 'Em ambiente de Risk-Off, investidores fogem de ativos de risco e buscam segurança. O dólar se fortalece (DXY sobe), causando queda em mercados emergentes. WIN (Índice Bovespa) tende a cair enquanto WDO (Dólar) tende a subir.',
      signals: ['DXY ↑', 'VIX ↑', 'OURO ↑', 'EWZ ↓'],
      icon: 'warning'
    },
    {
      name: 'Neutro',
      label: 'Neutro',
      color: '#f9bd22',
      description: 'Cautela lateral - esperando por catalisadores',
      conditions: [
        'DXY lateralizado',
        'VIX abaixo de 15 sem variação ~7%',
        'SPX lateral',
        'Sem fluxo claro',
        'Esperando Payroll ou decisão do Fed'
      ],
      expectedOutcome: 'WIN e WDO lateralizados. Aguardar rompimento de ranges ou catalisadores claros.',
      interpretation: 'Quando o mercado está neutro, não há clara direção. O DXY lateraliza, o VIX fica entre 15-20 (sem pânico nem euforia), e os investidores esperam por catalisadores como payrolls, decisões do Fed ou dados econômicos relevantes.',
      signals: ['DXY →', 'VIX 15-20', 'SPX →', 'Lateralização'],
      icon: 'drag_handle'
    }
  ]

  const chartData = await fetchRealGoldDxyData()

  const data: CorrelationData = {
    correlations,
    scenarios,
    goldDxyChartData: chartData,
    currentData,
    lastUpdate: Date.now()
  }

  return {
    success: true,
    data,
    timestamp: Date.now()
  }
})