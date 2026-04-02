<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { MarketOverview } from '~/server/types/market'
import { useMarketStore } from '~/stores/market'
import { useMacroAnalysis } from '~/composables/useMacroAnalysis'

// Page meta
definePageMeta({
  title: 'Dashboard - MacroView Pro',
  description: 'Real-time market data dashboard'
})

// Analysis API response type
interface AnalysisApiResponse {
  success: boolean
  data: {
    analysis: string
    generatedAt: number
    scenario: 'Risk-On' | 'Risk-Off' | 'Neutro'
  } | null
  error?: string
  timestamp: number
}

// Fetch AI analysis from Gemini
const { data: analysisResponse, pending: analysisPending, error: analysisError, refresh: refreshAnalysis } = await useFetch<AnalysisApiResponse>('/api/analysis', {
  key: 'market-analysis',
  lazy: true,
  server: false,
  default: () => null,
})

// Analysis data
const analysisData = computed(() => {
  if (!analysisResponse.value?.data) return null
  return {
    analysis: analysisResponse.value.data.analysis,
    scenario: analysisResponse.value.data.scenario,
    generatedAt: new Date(analysisResponse.value.data.generatedAt)
  }
})

// Handle analysis refresh
const handleAnalysisRefresh = () => {
  refreshAnalysis()
}

// Refs
const lastUpdate = ref<Date | null>(null)
const isRefreshing = ref(false)
const refreshInterval = 60 // seconds
const manualRefreshKey = ref(0)

// API Response type
interface ApiResponse<T> {
  success: boolean
  data: T | null
  error?: string
  timestamp: number
}

// Fetch market data
const { data: apiResponse, pending, error, refresh } = await useFetch<ApiResponse<MarketOverview>>('/api/market-overview', {
  key: 'market-overview',
  lazy: false,
  server: false,
  default: () => null,
})

// Use market store for centralized scenario management
const marketStore = useMarketStore()

// Get trend and VIX level helpers from macro analysis
const { getVixLevel, getTrend } = useMacroAnalysis()

// Parse market data and calculate scenario
const marketData = computed(() => {
  if (!apiResponse.value?.data) return null
  return apiResponse.value.data
})

// Format currency data (USD-BRL)
const usdBrl = computed(() => {
  if (!marketData.value?.currencies) return null
  const currency = marketData.value.currencies.find(c => c.code === 'USD' && c.codein === 'BRL')
  if (!currency) return null
  return {
    value: currency.bid,
    variation: currency.varBid,
    variationPercent: currency.pctChange,
    trend: getTrend(currency.varBid),
    sparklineData: [] // Could add historical data here
  }
})

// Risk indicators
const vixData = computed(() => {
  if (!marketData.value?.riskIndicators) return null
  return {
    value: marketData.value.riskIndicators.vix.price,
    variation: marketData.value.riskIndicators.vix.change,
    variationPercent: marketData.value.riskIndicators.vix.changePercent,
    trend: getTrend(marketData.value.riskIndicators.vix.change),
    vixLevel: getVixLevel(marketData.value.riskIndicators.vix.price)
  }
})

const dxyData = computed(() => {
  if (!marketData.value?.riskIndicators) return null
  return {
    value: marketData.value.riskIndicators.dxy.price,
    variation: marketData.value.riskIndicators.dxy.change,
    variationPercent: marketData.value.riskIndicators.dxy.changePercent,
    trend: getTrend(marketData.value.riskIndicators.dxy.change),
    sparklineData: []
  }
})

// Commodities
const goldData = computed(() => {
  if (!marketData.value?.commodities) return null
  const gold = marketData.value.commodities.find(c => c.symbol === 'GC=F' || c.symbol === 'XAUUSD')
  if (!gold) return null
  return {
    value: gold.price,
    variation: gold.change,
    variationPercent: gold.changePercent,
    trend: getTrend(gold.change),
    sparklineData: []
  }
})

const brentData = computed(() => {
  if (!marketData.value?.commodities) return null
  const brent = marketData.value.commodities.find(c => c.symbol === 'BZ=F' || c.symbol === 'BRENT')
  if (!brent) return null
  return {
    value: brent.price,
    variation: brent.change,
    variationPercent: brent.changePercent,
    trend: getTrend(brent.change),
    sparklineData: []
  }
})

const ironOreData = computed(() => {
  if (!marketData.value?.commodities) return null
  const iron = marketData.value.commodities.find(c => c.symbol === 'IRONORE' || c.name.toLowerCase().includes('ferro'))
  if (!iron) return null
  return {
    value: iron.price,
    variation: iron.change,
    variationPercent: iron.changePercent,
    trend: getTrend(iron.change),
    sparklineData: []
  }
})

// Brazil flow (EWZ)
const ewzData = computed(() => {
  if (!marketData.value?.brazilFlow) return null
  return {
    value: marketData.value.brazilFlow.price,
    variation: marketData.value.brazilFlow.change,
    variationPercent: marketData.value.brazilFlow.changePercent,
    trend: getTrend(marketData.value.brazilFlow.change),
    sparklineData: []
  }
})

// Treasuries
const treasury10yrData = computed(() => {
  if (!marketData.value?.treasuries) return null
  const treasury = marketData.value.treasuries.find(t => t.symbol === '^TNX' || t.name.includes('10 Year'))
  if (!treasury) return null
  return {
    value: treasury.yield,
    variation: treasury.change,
    variationPercent: treasury.changePercent,
    trend: getTrend(treasury.change),
    sparklineData: []
  }
})

// Market cards data
const marketCards = computed(() => {
  const cards = []

  if (usdBrl.value) {
    cards.push({
      title: 'USD/BRL',
      value: usdBrl.value.value,
      variation: usdBrl.value.variation,
      variationPercent: usdBrl.value.variationPercent,
      trend: usdBrl.value.trend,
      unit: '',
      icon: '💵',
      sparklineData: usdBrl.value.sparklineData
    })
  }

  if (dxyData.value) {
    cards.push({
      title: 'DXY Index',
      value: dxyData.value.value,
      variation: dxyData.value.variation,
      variationPercent: dxyData.value.variationPercent,
      trend: dxyData.value.trend,
      unit: '',
      icon: '📊',
      sparklineData: dxyData.value.sparklineData
    })
  }

  if (vixData.value) {
    cards.push({
      title: 'VIX',
      value: vixData.value.value,
      variation: vixData.value.variation,
      variationPercent: vixData.value.variationPercent,
      trend: vixData.value.trend,
      unit: '',
      icon: '🌊',
      vixLevel: vixData.value.vixLevel
    })
  }

  if (goldData.value) {
    cards.push({
      title: 'Ouro (XAU)',
      value: goldData.value.value,
      variation: goldData.value.variation,
      variationPercent: goldData.value.variationPercent,
      trend: goldData.value.trend,
      unit: 'USD',
      icon: '🥇',
      sparklineData: goldData.value.sparklineData
    })
  }

  if (brentData.value) {
    cards.push({
      title: 'Brent',
      value: brentData.value.value,
      variation: brentData.value.variation,
      variationPercent: brentData.value.variationPercent,
      trend: brentData.value.trend,
      unit: 'USD',
      icon: '🛢️',
      sparklineData: brentData.value.sparklineData
    })
  }

  if (ewzData.value) {
    cards.push({
      title: 'EWZ (Brasil)',
      value: ewzData.value.value,
      variation: ewzData.value.variation,
      variationPercent: ewzData.value.variationPercent,
      trend: ewzData.value.trend,
      unit: 'USD',
      icon: '🇧🇷',
      sparklineData: ewzData.value.sparklineData
    })
  }

  if (treasury10yrData.value) {
    cards.push({
      title: 'Treasury 10yr',
      value: treasury10yrData.value.value,
      variation: treasury10yrData.value.variation,
      variationPercent: treasury10yrData.value.variationPercent,
      trend: treasury10yrData.value.trend,
      unit: '%',
      icon: '📈',
      sparklineData: treasury10yrData.value.sparklineData
    })
  }

  if (ironOreData.value) {
    cards.push({
      title: 'Minério de Ferro',
      value: ironOreData.value.value,
      variation: ironOreData.value.variation,
      variationPercent: ironOreData.value.variationPercent,
      trend: ironOreData.value.trend,
      unit: 'USD',
      icon: '⛏️',
      sparklineData: ironOreData.value.sparklineData
    })
  }

  return cards
})

// Sync scenario from API (Gemini) to store for centralized access
// This ensures MarketScenarioCard and MarketAnalysisCard show the same scenario
watch(() => analysisData.value?.scenario, (newScenario) => {
  if (newScenario) {
    marketStore.setScenarioFromApi(newScenario)
  }
}, { immediate: true })

// Scenario result from store (prioritizes API/Gemini, falls back to computed rules)
const scenarioResult = computed(() => {
  return marketStore.scenario
})

// Auto-refresh logic using native Page Visibility API
const isVisible = ref(true)

const handleVisibilityChange = () => {
  isVisible.value = document.visibilityState === 'visible'
}

let refreshTimer: ReturnType<typeof setInterval> | null = null

const startAutoRefresh = () => {
  if (refreshTimer) return
  
  refreshTimer = setInterval(async () => {
    if (isVisible.value && !isRefreshing.value) {
      await doRefresh()
    }
  }, refreshInterval * 1000)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const doRefresh = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  try {
    await refresh()
    lastUpdate.value = new Date()
  } finally {
    isRefreshing.value = false
  }
}

const handleManualRefresh = () => {
  doRefresh()
}

// Watch for visibility changes
watch(isVisible, (visible) => {
  if (visible) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

// Initialize
onMounted(() => {
  // Set initial visibility state
  isVisible.value = document.visibilityState === 'visible'
  
  // Listen for visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  lastUpdate.value = new Date()
  if (isVisible.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  stopAutoRefresh()
})

// Loading state
const isLoading = computed(() => pending.value || !marketData.value)
</script>

<template>
  <div class="min-h-screen bg-background pb-16 sm:pb-8">
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
      <!-- Error State -->
      <div v-if="error" class="mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl bg-secondary/10 border border-secondary/30">
        <div class="flex items-start gap-3 mb-3">
          <svg class="w-5 sm:w-6 h-5 sm:h-6 text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 class="text-base sm:text-lg font-semibold text-secondary">Erro ao carregar dados</h3>
            <p class="text-sm text-on-surface mt-1">{{ error.message || 'Não foi possível obter os dados do mercado.' }}</p>
          </div>
        </div>
        <button
          @click="handleManualRefresh"
          class="ml-8 sm:ml-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                 bg-secondary/20 hover:bg-secondary/30 text-secondary transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Tentar novamente
        </button>
      </div>

      <!-- Scenario Card -->
      <section v-if="!error" class="mb-6 sm:mb-8">
        <MarketScenarioCard
          :scenario="scenarioResult?.scenario ?? 'Neutro'"
          :interpretation="scenarioResult?.interpretation ?? ''"
          :signals="scenarioResult?.signals ?? []"
          :loading="isLoading || !scenarioResult"
        />
      </section>

      <!-- AI Analysis Card -->
      <section class="mb-6 sm:mb-8">
        <MarketAnalysisCard
          :analysis="analysisData?.analysis ?? ''"
          :scenario="analysisData?.scenario ?? 'Neutro'"
          :generated-at="analysisData?.generatedAt ?? null"
          :loading="analysisPending"
          :error="analysisError ? (analysisError.message || 'Erro ao carregar análise') : null"
          @refresh="handleAnalysisRefresh"
        />
      </section>

      <!-- Section Title -->
      <div class="mb-4 sm:mb-6">
        <h2 class="text-lg font-semibold text-on-surface">Métricas do Mercado</h2>
        <p class="text-sm text-on-surface-variant">Dados atualizados em tempo real</p>
      </div>

      <!-- Market Cards Grid -->
      <MarketMetricGrid
        :cards="marketCards"
        :loading="isLoading"
      />

      <!-- No Data Message -->
      <div v-if="!isLoading && marketCards.length === 0 && !error" class="mt-6 sm:mt-8 text-center py-8 sm:py-12">
        <svg class="w-12 sm:w-16 h-12 sm:h-16 mx-auto text-on-surface-variant/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 class="text-base sm:text-lg font-medium text-on-surface mb-2">Nenhum dado disponível</h3>
        <p class="text-sm text-on-surface-variant mb-4">Tente atualizar a página para obter os dados mais recentes.</p>
        <button
          @click="handleManualRefresh"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                 bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Atualizar dados
        </button>
      </div>

      <!-- Footer Info -->
      <div class="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-outline/10">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-xs text-on-surface-variant">
          <div class="flex items-center gap-2 sm:gap-4">
            <span class="hidden sm:inline">Dados de mercado fornecidos por Yahoo Finance e AwesomeAPI</span>
            <span class="sm:hidden">Dados: Yahoo Finance</span>
          </div>
          <div class="flex items-center gap-2">
            <span
              :class="[
                'w-2 h-2 rounded-full',
                marketData ? 'bg-primary animate-pulse' : 'bg-on-surface-variant/40'
              ]"
            />
            <span>{{ marketData ? 'Conectado' : 'Desconectado' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
