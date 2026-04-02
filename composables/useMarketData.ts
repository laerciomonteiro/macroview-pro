/**
 * Market Data Composable
 * Wrapper for market API calls with error handling
 */
import { ref, readonly, computed } from 'vue'
import type { MarketOverview, CurrencyData, CommodityData, MarketIndex, ScenarioResult } from '~/types/market'
import { useMarketStore } from '~/stores/market'

export interface UseMarketDataReturn {
  // State
  isLoading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  marketData: Readonly<Ref<MarketOverview | null>>
  lastUpdate: Readonly<Ref<Date | null>>
  
  // Computed
  scenario: Readonly<Ref<ScenarioResult | null>>
  formattedLastUpdate: Readonly<Ref<string>>
  
  // Currency helpers
  getCurrency: (code: string) => CurrencyData | undefined
  getCommodity: (symbol: string) => CommodityData | undefined
  getIndex: (symbol: string) => MarketIndex | undefined
  
  // Methods
  fetchData: () => Promise<void>
}

export const useMarketData = (): UseMarketDataReturn => {
  const store = useMarketStore()

  // Convenience refs
  const isLoading = readonly(ref(store.isLoading))
  const error = readonly(ref(store.error))
  const marketData = readonly(ref(store.marketData))
  const lastUpdate = readonly(ref(store.lastUpdate))

  // Computed
  const scenario = computed(() => store.scenario)
  const formattedLastUpdate = computed(() => store.formattedLastUpdate)

  // Helper methods
  const getCurrency = (code: string): CurrencyData | undefined => {
    return store.getCurrencyByCode(code)
  }

  const getCommodity = (symbol: string): CommodityData | undefined => {
    return store.getCommodityBySymbol(symbol)
  }

  const getIndex = (symbol: string): MarketIndex | undefined => {
    return store.getIndexBySymbol(symbol)
  }

  // Fetch method
  const fetchData = async (): Promise<void> => {
    await store.fetchMarketOverview()
  }

  return {
    // State
    isLoading,
    error,
    marketData,
    lastUpdate,
    
    // Computed
    scenario,
    formattedLastUpdate,
    
    // Helpers
    getCurrency,
    getCommodity,
    getIndex,
    
    // Methods
    fetchData,
  }
}

/**
 * Format variation with sign and color class
 */
export const formatVariation = (variation: number, variationPercent: number): string => {
  const sign = variation >= 0 ? '+' : ''
  return `${sign}${variationPercent.toFixed(2)}%`
}

/**
 * Get variation type based on value
 */
export const getVariationType = (variation: number): 'up' | 'down' | 'stable' => {
  if (variation > 0) return 'up'
  if (variation < 0) return 'down'
  return 'stable'
}

/**
 * Format price based on instrument type
 */
export const formatPrice = (price: number, type: 'currency' | 'index' | 'commodity' = 'currency'): string => {
  switch (type) {
    case 'currency':
      return price.toFixed(4)
    case 'index':
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    case 'commodity':
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    default:
      return price.toFixed(2)
  }
}
