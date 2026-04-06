/**
 * Market Data TypeScript Interfaces
 * MacroView Pro - Institutional Trading Terminal
 */

// Currency pair data (FOREX)
export interface CurrencyData {
  code: string           // e.g., 'USD/BRL'
  name: string          // e.g., 'Dólar Americano / Real Brasileiro'
  bid: number           // Bid price
  ask: number           // Ask price
  variation: number     // Absolute change
  variationPercent: number  // Percentage change
  timestamp: Date       // Last update time
}

// Commodity data (Gold, Oil, etc.)
export interface CommodityData {
  symbol: string        // e.g., 'XAU', 'BRENT'
  name: string          // e.g., 'Ouro', 'Petróleo Brent'
  price: number         // Current price
  variation: number     // Absolute change
  variationPercent: number  // Percentage change
  unit: string          // e.g., 'oz', 'barrel'
}

// Market index data (S&P 500, VIX, etc.)
export interface MarketIndex {
  symbol: string        // e.g., 'SPX', 'VIX', 'DXY'
  name: string          // e.g., 'S&P 500', 'VIX Index'
  price: number         // Current price
  variation: number     // Absolute change
  variationPercent: number  // Percentage change
  dayLow?: number       // Day low
  dayHigh?: number      // Day high
}

// Risk indicator for scenario analysis
export interface RiskIndicator {
  vix: number           // VIX index value
  vixChangePercent?: number  // VIX change percent (for Risk-On detection)
  dxy: number           // DXY dollar index
  dxyChangePercent?: number  // DXY change percent
  interpretation: string // Market interpretation text
}

// ETF and Brazil-specific flow data
export interface EtfFlow {
  symbol: string        // e.g., 'EWZ', 'SPY'
  name: string          // e.g., 'iShares Brazil'
  price: number         // Current price
  variation: number     // Absolute change
  variationPercent: number  // Percentage change
  preMarket?: number     // Pre-market change
  institutional?: string // e.g., 'JP MORGAN'
}

// VALE stock data (iron ore proxy)
export interface ValeData {
  symbol: string        // e.g., 'VALE3.SA'
  name: string          // e.g., 'VALE S.A.'
  price: number         // Current price
  variation: number     // Absolute change
  variationPercent: number  // Percentage change
  trend: 'up' | 'down' | 'neutral'  // Price direction
  ironOreProxy: boolean // True when used as iron ore proxy
}

// Treasury yield data
export interface TreasuryYield {
  symbol: string        // e.g., '^TNX'
  name: string          // e.g., '10Y Treasury Note'
  yield: number         // Yield percentage
  change: number        // Basis points change
  changePeriod: string  // e.g., '1D', '1W'
  curveStatus: string   // e.g., 'Inverted', 'Normal'
}

// Order flow signal
export interface OrderFlowSignal {
  type: 'BUY' | 'SELL' | 'NEUTRAL'
  instrument: string   // e.g., 'WINM24'
  volume: string       // e.g., '128.4k'
  price: number        // Execution price
  timestamp: Date      // Signal time
  institution?: string // e.g., 'JP MORGAN'
  system?: string      // e.g., 'HFT_ALPHA'
}

// Consolidated market overview
export interface MarketOverview {
  currencies: CurrencyData[]
  commodities: CommodityData[]
  indices: MarketIndex[]
  riskIndicators: RiskIndicator
  etfFlows: EtfFlow[]
  treasuryYields: TreasuryYield[]
  orderFlowSignals: OrderFlowSignal[]
  lastUpdate: Date
  isLoading: boolean
  error: string | null
}

// Scenario types for market interpretation
export type ScenarioType = 'Risk-On' | 'Risk-Off' | 'Neutro'

// Scenario result from market analysis
export interface ScenarioResult {
  scenario: ScenarioType
  color: string         // e.g., '#4edea3' for Risk-On
  signals: string[]     // Array of signal descriptions
  interpretation: string // Full interpretation text
  confidence: number    // Confidence level 0-100
}

// Ticker item for bottom bar
export interface TickerItem {
  symbol: string
  price: number
  change: number
  changeType: 'up' | 'down' | 'stable'
}

// AI-generated market analysis result
export interface AnalysisResult {
  analysis: string      // The generated analysis text in Portuguese
  generatedAt: Date     // When the analysis was generated
  scenario: ScenarioType // The market scenario at time of generation
  confidence: number    // Confidence level of the analysis
  cached: boolean       // Whether this was served from cache
}
