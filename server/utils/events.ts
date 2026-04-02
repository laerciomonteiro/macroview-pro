/**
 * Economic Events Utilities
 * MacroView Pro - Institutional Trading Terminal
 * 
 * Provides predefined economic events and functions to generate events
 * for a given date range. Real scraping would require external services.
 */

import type { EconomicEvent, RegionCode, ImpactLevel } from '~/types/calendar'

// Predefined economic events template (would be replaced by real data in production)
interface EventTemplate {
  id: string
  region: RegionCode
  currency: string
  eventName: string
  impact: ImpactLevel
  hour: number
  minute: number
}

// Common economic events templates
const EVENT_TEMPLATES: EventTemplate[] = [
  // US Events
  { id: 'us-fomc', region: 'US', currency: 'USD', eventName: 'FOMC Decision', impact: 'high', hour: 14, minute: 0 },
  { id: 'us-payroll', region: 'US', currency: 'USD', eventName: 'Non-Farm Payrolls', impact: 'high', hour: 8, minute: 30 },
  { id: 'us-cpi', region: 'US', currency: 'USD', eventName: 'CPI (Consumer Price Index)', impact: 'high', hour: 8, minute: 30 },
  { id: 'us-ppi', region: 'US', currency: 'USD', eventName: 'PPI (Producer Price Index)', impact: 'medium', hour: 8, minute: 30 },
  { id: 'us-gdp', region: 'US', currency: 'USD', eventName: 'GDP (Gross Domestic Product)', impact: 'high', hour: 8, minute: 30 },
  { id: 'us-retail', region: 'US', currency: 'USD', eventName: 'Retail Sales', impact: 'medium', hour: 8, minute: 30 },
  { id: 'us-claims', region: 'US', currency: 'USD', eventName: 'Jobless Claims', impact: 'medium', hour: 8, minute: 30 },
  { id: 'us-pmi', region: 'US', currency: 'USD', eventName: 'ISM Manufacturing PMI', impact: 'medium', hour: 10, minute: 0 },
  { id: 'us-housing', region: 'US', currency: 'USD', eventName: 'Housing Starts', impact: 'low', hour: 8, minute: 30 },
  { id: 'us-confidence', region: 'US', currency: 'USD', eventName: 'Consumer Confidence', impact: 'medium', hour: 10, minute: 0 },
  { id: 'us-fed-chair', region: 'US', currency: 'USD', eventName: 'Fed Chair Speech', impact: 'high', hour: 10, minute: 0 },
  { id: 'us-nfp', region: 'US', currency: 'USD', eventName: 'Average Hourly Earnings', impact: 'medium', hour: 8, minute: 30 },
  { id: 'us-inventory', region: 'US', currency: 'USD', eventName: 'Crude Oil Inventories', impact: 'low', hour: 10, minute: 30 },

  // Brazil Events
  { id: 'br-selic', region: 'BR', currency: 'BRL', eventName: 'COPOM Decision (Selic Rate)', impact: 'high', hour: 18, minute: 0 },
  { id: 'br-ipca', region: 'BR', currency: 'BRL', eventName: 'IPCA (Inflation)', impact: 'high', hour: 9, minute: 0 },
  { id: 'br-gdp', region: 'BR', currency: 'BRL', eventName: 'GDP (Brazil)', impact: 'high', hour: 9, minute: 0 },
  { id: 'br-pj', region: 'BR', currency: 'BRL', eventName: 'Primary Budget Result', impact: 'medium', hour: 10, minute: 30 },
  { id: 'br-unemployment', region: 'BR', currency: 'BRL', eventName: 'Unemployment Rate', impact: 'medium', hour: 9, minute: 0 },
  { id: 'br-trade', region: 'BR', currency: 'BRL', eventName: 'Trade Balance', impact: 'medium', hour: 15, minute: 0 },
  { id: 'br-retail', region: 'BR', currency: 'BRL', eventName: 'Retail Sales (Brazil)', impact: 'medium', hour: 9, minute: 0 },
  { id: 'br-pmc', region: 'BR', currency: 'BRL', eventName: 'PMC (Trade Survey)', impact: 'low', hour: 10, minute: 0 },
  { id: 'br-bc-speech', region: 'BR', currency: 'BRL', eventName: 'BCB President Speech', impact: 'high', hour: 16, minute: 0 },

  // EU Events
  { id: 'eu-ecb', region: 'EU', currency: 'EUR', eventName: 'ECB Interest Rate Decision', impact: 'high', hour: 14, minute: 15 },
  { id: 'eu-gdp', region: 'EU', currency: 'EUR', eventName: 'Eurozone GDP', impact: 'high', hour: 11, minute: 0 },
  { id: 'eu-cpi', region: 'EU', currency: 'EUR', eventName: 'Eurozone CPI', impact: 'high', hour: 11, minute: 0 },
  { id: 'eu-pmi', region: 'EU', currency: 'EUR', eventName: 'Eurozone PMI', impact: 'medium', hour: 10, minute: 0 },
  { id: 'eu-employment', region: 'EU', currency: 'EUR', eventName: 'Eurozone Employment Change', impact: 'medium', hour: 11, minute: 0 },
  { id: 'eu-zew', region: 'EU', currency: 'EUR', eventName: 'ZEW Economic Sentiment', impact: 'medium', hour: 10, minute: 0 },
  { id: 'eu-trade', region: 'EU', currency: 'EUR', eventName: 'Eurozone Trade Balance', impact: 'low', hour: 11, minute: 0 },
  { id: 'eu-industrial', region: 'EU', currency: 'EUR', eventName: 'Industrial Production', impact: 'medium', hour: 11, minute: 0 },
  { id: 'eu-ecb-president', region: 'EU', currency: 'EUR', eventName: 'ECB President Speech', impact: 'high', hour: 9, minute: 0 },
  { id: 'eu-inflation', region: 'EU', currency: 'EUR', eventName: 'Flash CPI', impact: 'high', hour: 11, minute: 0 },
]

// Map months in Portuguese for display
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

/**
 * Format date for event display
 */
export function formatEventDate(date: Date): string {
  const day = date.getDate()
  const month = MONTHS_PT[date.getMonth()]
  const year = date.getFullYear()
  return `${day} de ${month} de ${year}`
}

/**
 * Format time for event display
 */
export function formatEventTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Generate a unique ID for an event
 */
function generateEventId(template: EventTemplate, date: Date): string {
  const dateStr = date.toISOString().split('T')[0]
  return `${template.id}-${dateStr}`
}

/**
 * Generate economic events for a specific date
 */
export function generateEventsForDate(date: Date): EconomicEvent[] {
  const events: EconomicEvent[] = []
  
  // Only generate events for dates that could have economic data
  // In a real app, this would query a database or external API
  
  // Add some randomness to simulate real events
  const dayOfWeek = date.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  
  for (const template of EVENT_TEMPLATES) {
    // Skip some events on weekends for realism
    if (isWeekend && template.impact === 'low') continue
    
    // Randomly include events to simulate varying daily schedules
    const shouldInclude = Math.random() > 0.3
    if (!shouldInclude && template.impact !== 'high') continue
    
    const eventDate = new Date(date)
    eventDate.setHours(template.hour, template.minute, 0, 0)
    
    events.push({
      id: generateEventId(template, date),
      datetime: eventDate,
      region: template.region,
      currency: template.currency,
      eventName: template.eventName,
      impact: template.impact,
      actual: null,
      forecast: generateMockForecast(template.impact),
      previous: generateMockPrevious(template.impact),
    })
  }
  
  // Sort by datetime
  events.sort((a, b) => a.datetime.getTime() - b.datetime.getTime())
  
  return events
}

/**
 * Generate mock forecast value based on impact
 */
function generateMockForecast(impact: ImpactLevel): string {
  const values: Record<ImpactLevel, string[]> = {
    high: ['0.5%', '1.2%', '2.1%', '3.0%', '0.75%', '200K', '250K'],
    medium: ['0.3%', '0.8%', '1.5%', '0.4%', '150K'],
    low: ['0.2%', '0.1%', '0.4%', '0.3%', '50K', '100K'],
  }
  const options = values[impact]
  return options[Math.floor(Math.random() * options.length)]
}

/**
 * Generate mock previous value
 */
function generateMockPrevious(impact: ImpactLevel): string {
  const values: Record<ImpactLevel, string[]> = {
    high: ['0.4%', '1.0%', '2.0%', '2.8%', '0.6%', '180K', '220K'],
    medium: ['0.2%', '0.7%', '1.3%', '0.3%', '140K'],
    low: ['0.1%', '0.2%', '0.3%', '0.5%', '60K', '90K'],
  }
  const options = values[impact]
  return options[Math.floor(Math.random() * options.length)]
}

/**
 * Get events for a date range
 */
export function getEventsForDateRange(startDate: Date, days: number = 7): EconomicEvent[] {
  const events: EconomicEvent[] = []
  
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    
    const dayEvents = generateEventsForDate(currentDate)
    events.push(...dayEvents)
  }
  
  return events
}

/**
 * Filter events by region
 */
export function filterEventsByRegion(events: EconomicEvent[], regions: RegionCode[]): EconomicEvent[] {
  if (regions.length === 0) return events
  return events.filter(event => regions.includes(event.region))
}

/**
 * Filter events by minimum impact level
 */
export function filterEventsByImpact(events: EconomicEvent[], minImpact: ImpactLevel | 'all'): EconomicEvent[] {
  if (minImpact === 'all') return events
  
  const impactOrder: Record<ImpactLevel, number> = {
    low: 1,
    medium: 2,
    high: 3,
  }
  
  const minLevel = impactOrder[minImpact]
  return events.filter(event => impactOrder[event.impact] >= minLevel)
}

/**
 * Group events by date string
 */
export function groupEventsByDate(events: EconomicEvent[]): Map<string, EconomicEvent[]> {
  const grouped = new Map<string, EconomicEvent[]>()
  
  for (const event of events) {
    const dateKey = event.datetime.toISOString().split('T')[0]
    
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push(event)
  }
  
  return grouped
}

/**
 * Get VIX interpretation
 */
export function getVixInterpretation(vix: number): { level: 'low' | 'medium' | 'high', interpretation: string } {
  if (vix < 15) {
    return {
      level: 'low',
      interpretation: 'Medo Baixo - Mercado em calma'
    }
  } else if (vix < 25) {
    return {
      level: 'medium',
      interpretation: 'Neutro - Volatilidade moderada'
    }
  } else {
    return {
      level: 'high',
      interpretation: 'Medo Alto - Incerteza elevada'
    }
  }
}

/**
 * Get market sentiment based on events
 */
export function getMarketSentiment(events: EconomicEvent[]): { sentiment: 'risk-on' | 'risk-off' | 'neutral', signals: string[] } {
  const highImpactCount = events.filter(e => e.impact === 'high').length
  const signals: string[] = []
  
  if (highImpactCount >= 3) {
    signals.push('Múltiplos eventos de alto impacto programados')
  }
  
  const hasFedEvent = events.some(e => e.eventName.toLowerCase().includes('fomc') || e.eventName.toLowerCase().includes('fed'))
  if (hasFedEvent) {
    signals.push('Decisões do Federal Reserve')
  }
  
  const hasCOPOM = events.some(e => e.eventName.toLowerCase().includes('copom'))
  if (hasCOPOM) {
    signals.push('Decisões de política monetária do Brasil')
  }
  
  const hasECB = events.some(e => e.eventName.toLowerCase().includes('ecb'))
  if (hasECB) {
    signals.push('Decisões do Banco Central Europeu')
  }
  
  let sentiment: 'risk-on' | 'risk-off' | 'neutral' = 'neutral'
  if (highImpactCount >= 4) {
    sentiment = 'risk-off'
    signals.push('Expectativa de alta volatilidade')
  } else if (highImpactCount <= 1) {
    sentiment = 'risk-on'
    signals.push('Calendário calmo - menor incerteza')
  }
  
  return { sentiment, signals }
}
