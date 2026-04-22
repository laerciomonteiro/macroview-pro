/**
 * Correlation TypeScript Interfaces
 * MacroView Pro - Institutional Trading Terminal
 */

/**
 * Represents a single correlation item between assets
 */
export interface CorrelationItem {
  asset: string           // e.g., 'VIX', 'DXY', 'EWZ', 'OURO'
  name: string           // Full name e.g., 'Volatility Index', 'Dollar Index'
  meaning: string        // What it represents e.g., 'Fear & Volatility Index'
  signal: string         // Current signal e.g., 'Low Vol', 'Soft Dollar'
  signalType: 'positive' | 'negative' | 'neutral'  // Signal classification
  impactWin: 'up' | 'down' | 'stable'  // Impact on WIN contract
  impactWdo: 'up' | 'down' | 'stable'  // Impact on WDO contract
  impactWinStrength?: number  // 1 or 2 for strength
  description: string    // Detailed explanation
  correlation?: number   // -1 to 1 correlation value
  changePercent?: number // Real price change percentage (e.g., -0.27)
}

/**
 * Represents a market scenario (Risk-On, Risk-Off, Neutral)
 */
export interface ScenarioDetail {
  name: 'Risk-On' | 'Risk-Off' | 'Neutro'
  label: string         // Display label
  color: string         // Hex color for the scenario
  description: string  // Brief description
  conditions: string[]  // Array of conditions for this scenario
  expectedOutcome: string  // Expected market outcome
  interpretation: string  // Full interpretation text
  signals: string[]     // Signal descriptions
  icon: string          // Emoji or icon identifier
}

/**
 * Correlation chart data point
 */
export interface ChartDataPoint {
  time: string | number
  value: number
}

/**
 * Correlation chart series
 */
export interface CorrelationChartSeries {
  name: string
  data: ChartDataPoint[]
  color: string
}

/**
 * API response wrapper for correlations
 */
export interface CorrelationApiResponse {
  success: boolean
  data: CorrelationData
  timestamp: number
}

/**
 * Current market data from real APIs
 */
export interface CurrentMarketData {
  vix: number
  dxy: number
  gold: number
  brent: number
  ironOre: number  // NEW: Iron Ore for VALE correlation
  mxm: number      // NEW: Mexican Peso (USD/MXN)
  mxmChange: number // NEW: MXN change for signal
  scenario: 'Risk-On' | 'Risk-Off' | 'Neutro'
  vixChange: number
  dxyChange: number
  goldChange: number   // Gold price change percent
  brentChange: number  // Brent price change percent
  ewzPrice: number     // EWZ ETF price
  ewzChange: number    // EWZ ETF change percent
}

export interface CorrelationData {
  correlations: CorrelationItem[]
  scenarios: ScenarioDetail[]
  goldDxyChartData: {
    gold: ChartDataPoint[]
    dxy: ChartDataPoint[]
    correlation: number
  }
  lastUpdate: number
  currentData: CurrentMarketData
}
