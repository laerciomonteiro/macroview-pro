/**
 * Economic Calendar TypeScript Interfaces
 * MacroView Pro - Institutional Trading Terminal
 */

// Region codes for economic events
export type RegionCode = 'US' | 'BR' | 'EU'

// Impact level for economic events
export type ImpactLevel = 'high' | 'medium' | 'low'

// Economic event data structure
export interface EconomicEvent {
  id: string
  datetime: Date
  region: RegionCode
  currency: string
  eventName: string
  impact: ImpactLevel
  actual?: string | null
  forecast?: string | null
  previous?: string | null
}

// Calendar filter state
export interface CalendarFilters {
  regions: RegionCode[]
  minImpact: ImpactLevel | 'all'
}

// API response wrapper for events
export interface EventsApiResponse {
  success: boolean
  data: EconomicEvent[]
  timestamp: number
}

// Grouped events by date
export interface EventsByDate {
  date: string
  events: EconomicEvent[]
}

// VIX interpretation levels
export type VixLevel = 'low' | 'medium' | 'high'

// VIX data for volatility watch
export interface VixData {
  value: number
  change: number
  changePercent: number
  interpretation: string
  level: VixLevel
}

// Market sentiment interpretation
export interface MarketSentiment {
  sentiment: 'risk-on' | 'risk-off' | 'neutral'
  color: string
  description: string
  signals: string[]
}

// High impact alert for upcoming events
export interface ImpactAlert {
  event: EconomicEvent
  timeUntil: string
  isUpcoming: boolean
}
