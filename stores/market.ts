import { defineStore } from 'pinia'
import type { 
  MarketOverview, 
  CurrencyData, 
  CommodityData, 
  MarketIndex, 
  RiskIndicator,
  EtfFlow,
  TreasuryYield,
  OrderFlowSignal,
  ScenarioResult 
} from '~/types/market'

interface MarketState {
  marketData: MarketOverview | null
  lastUpdate: Date | null
  isLoading: boolean
  error: string | null
  refreshInterval: number
}

export const useMarketStore = defineStore('market', {
  state: (): MarketState => ({
    marketData: null,
    lastUpdate: null,
    isLoading: false,
    error: null,
    refreshInterval: 60000, // 60 seconds
  }),

  getters: {
    /**
     * Formatted last update time
     */
    formattedLastUpdate(): string {
      if (!this.lastUpdate) return '--:--:--'
      return this.lastUpdate.toISOString().split('T')[1].split('.')[0]
    },

    /**
     * Current market scenario (computed from market data)
     */
    scenario(): ScenarioResult | null {
      if (!this.marketData?.riskIndicators) return null
      
      const { vix, dxy } = this.marketData.riskIndicators
      
      // Risk-On: VIX < 15, DXY falling (below 105)
      if (vix < 15 && dxy < 105) {
        return {
          scenario: 'Risk-On',
          color: '#4edea3',
          signals: ['VIX < 15 (Low Fear)', 'DXY < 105 (USD Weak)'],
          interpretation: 'Mercado busca risco em emergentes. Alta probabilidade de WIN subir durante o pregão.',
          confidence: 88
        }
      }
      
      // Risk-Off: VIX > 25, DXY rising
      if (vix > 25 || dxy > 108) {
        return {
          scenario: 'Risk-Off',
          color: '#ffb2b7',
          signals: ['VIX > 25 (High Fear)', 'DXY > 108 (USD Strong)'],
          interpretation: 'Mercado em modo de aversão a risco. Protect assets em alta.',
          confidence: 85
        }
      }
      
      // Neutro
      return {
        scenario: 'Neutro',
        color: '#f9bd22',
        signals: ['VIX between 15-25', 'DXY between 105-108'],
        interpretation: 'Mercado em modo neutro. Aguardando catalisadores para direção.',
        confidence: 65
      }
    },

    /**
     * Get currency by code
     */
    getCurrencyByCode: (state) => (code: string): CurrencyData | undefined => {
      return state.marketData?.currencies.find(c => c.code === code)
    },

    /**
     * Get commodity by symbol
     */
    getCommodityBySymbol: (state) => (symbol: string): CommodityData | undefined => {
      return state.marketData?.commodities.find(c => c.symbol === symbol)
    },

    /**
     * Get index by symbol
     */
    getIndexBySymbol: (state) => (symbol: string): MarketIndex | undefined => {
      return state.marketData?.indices.find(i => i.symbol === symbol)
    },
  },

  actions: {
    /**
     * Set loading state
     */
    setLoading(loading: boolean): void {
      this.isLoading = loading
      if (loading) {
        this.error = null
      }
    },

    /**
     * Fetch market overview from API
     */
    async fetchMarketOverview(): Promise<void> {
      this.setLoading(true)
      
      try {
        const config = useRuntimeConfig()
        
        // In production, this would call the actual API
        // const response = await $fetch<MarketOverview>('/api/market/overview', {
        //   headers: {
        //     'Authorization': `Bearer ${config.marketApiKey}`
        //   }
        // })
        
        // Mock data for development
        const mockData: MarketOverview = {
          currencies: [
            {
              code: 'USD/BRL',
              name: 'Dólar Americano / Real Brasileiro',
              bid: 5.2423,
              ask: 5.2445,
              variation: -0.0126,
              variationPercent: -0.24,
              timestamp: new Date()
            },
            {
              code: 'DXY',
              name: 'DXY Index',
              bid: 104.21,
              ask: 104.23,
              variation: 0.1146,
              variationPercent: 0.11,
              timestamp: new Date()
            },
            {
              code: 'USD/MXN',
              name: 'USD / Peso Mexicano',
              bid: 16.78,
              ask: 16.79,
              variation: 0,
              variationPercent: 0,
              timestamp: new Date()
            }
          ],
          commodities: [
            {
              symbol: 'XAU',
              name: 'Ouro',
              price: 2350,
              variation: 9.4,
              variationPercent: 0.4,
              unit: 'oz'
            },
            {
              symbol: 'BRENT',
              name: 'Petróleo Brent',
              price: 85.40,
              variation: -1.03,
              variationPercent: -1.2,
              unit: 'barrel'
            },
            {
              symbol: 'IRON',
              name: 'Minério de Ferro',
              price: 115.2,
              variation: 0,
              variationPercent: 0,
              unit: 'ton'
            }
          ],
          indices: [
            {
              symbol: 'VIX',
              name: 'VIX Index (Fear Gauge)',
              price: 14.52,
              variation: -0.38,
              variationPercent: -2.55,
              dayLow: 14.1,
              dayHigh: 15.2
            },
            {
              symbol: 'SPX',
              name: 'S&P 500',
              price: 5230,
              variation: 25.5,
              variationPercent: 0.49
            }
          ],
          riskIndicators: {
            vix: 14.52,
            dxy: 104.21,
            interpretation: 'Mercado Tranquilo'
          },
          etfFlows: [
            {
              symbol: 'EWZ',
              name: 'iShares Brazil',
              price: 32.41,
              variation: 0.384,
              variationPercent: 1.2,
              preMarket: 1.2,
              institutional: 'JP MORGAN'
            }
          ],
          treasuryYields: [
            {
              symbol: '^TNX',
              name: '10Y Treasury Note',
              yield: 4.322,
              change: -5,
              changePeriod: '1D',
              curveStatus: 'Inverted'
            }
          ],
          orderFlowSignals: [
            {
              type: 'BUY',
              instrument: 'WINM24',
              volume: '128.4k',
              price: 128400,
              timestamp: new Date(),
              institution: 'JP MORGAN'
            },
            {
              type: 'SELL',
              instrument: 'WDOM24',
              volume: '5.2410k',
              price: 5.241,
              timestamp: new Date(),
              institution: 'BRADESCO'
            },
            {
              type: 'BUY',
              instrument: 'EWZ ETF',
              volume: '15.0k',
              price: 32.41,
              timestamp: new Date(),
              institution: 'GOLDMAN SACHS'
            },
            {
              type: 'NEUTRAL',
              instrument: 'DXY',
              volume: '',
              price: 104.22,
              timestamp: new Date(),
              system: 'HFT_ALPHA'
            }
          ],
          lastUpdate: new Date(),
          isLoading: false,
          error: null
        }
        
        this.marketData = mockData
        this.lastUpdate = new Date()
        this.error = null
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market data'
        this.error = errorMessage
        console.error('[MarketStore] Error fetching market overview:', err)
      } finally {
        this.setLoading(false)
      }
    },

    /**
     * Initialize market data with auto-refresh
     */
    async initializeMarketData(): Promise<void> {
      await this.fetchMarketOverview()
    }
  }
})
