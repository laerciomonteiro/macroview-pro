<script setup lang="ts">
import type { CorrelationApiResponse, CorrelationItem, ScenarioDetail, ChartDataPoint, CurrentMarketData } from '~/types/correlation'

// Fetch correlation data from API
const { data: apiData, pending, error } = await useFetch<CorrelationApiResponse>('/api/correlations', {
  key: 'correlations-data'
})

// Destructure with defaults for reactive binding
const correlations = computed<CorrelationItem[]>(() => apiData.value?.data?.correlations || [])
const scenarios = computed<ScenarioDetail[]>(() => apiData.value?.data?.scenarios || [])
const goldChartData = computed<ChartDataPoint[]>(() => apiData.value?.data?.goldDxyChartData?.gold || [])
const dxyChartData = computed<ChartDataPoint[]>(() => apiData.value?.data?.goldDxyChartData?.dxy || [])
const goldDxyCorrelation = computed<number>(() => apiData.value?.data?.goldDxyChartData?.correlation ?? -0.92)

// Real market data from API
const currentData = computed<CurrentMarketData>(() => apiData.value?.data?.currentData || {
  vix: 0,
  dxy: 0,
  gold: 0,
  brent: 0,
  scenario: 'Neutro',
  vixChange: 0,
  dxyChange: 0
})

// Format timestamp
const lastUpdate = computed(() => {
  if (!apiData.value?.timestamp) return '—'
  return new Date(apiData.value.timestamp).toLocaleString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
})

// Determine scenario color
const scenarioColor = computed(() => {
  switch (currentData.value.scenario) {
    case 'Risk-On': return '#4edea3'
    case 'Risk-Off': return '#ffb2b7'
    default: return '#f9bd22'
  }
})

// VIX icon based on value
const vixIcon = computed(() => {
  if (currentData.value.vix < 15) return 'trending_down'
  if (currentData.value.vix > 20) return 'trending_up'
  return 'trending_flat'
})

// Page meta
definePageMeta({
  title: 'Matriz de Correlações | MacroView Pro',
  description: 'Análise de correlações intermercado para trading de WIN e WDO'
})

useHead({
  title: 'Matriz de Correlações | MacroView Pro',
  meta: [
    { name: 'description', content: 'Visualize e entenda as correlações entre ativos como Gold, DXY, VIX, EWZ e seu impacto no mercado brasileiro.' }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Page Header -->
    <header class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-on-surface tracking-tight">
            Matriz de Correlações
          </h1>
          <p class="text-sm text-on-surface-variant mt-1">
            Análise intermarket e cenários para WIN/WDO
          </p>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline/10">
            <div class="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span class="text-xs font-mono text-on-surface-variant">Última Atualização: {{ lastUpdate }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="pending" class="space-y-6">
      <!-- Hero Loading -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-8 bg-surface-container-low p-6 rounded-xl animate-pulse h-80" />
        <div class="lg:col-span-4 space-y-6">
          <div class="bg-surface-container p-6 rounded-xl h-40 animate-pulse" />
          <div class="bg-surface-container-high p-6 rounded-xl h-40 animate-pulse" />
        </div>
      </div>
      <!-- Cards Loading -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="bg-surface-container-low p-5 rounded-xl animate-pulse h-48" />
      </div>
      <!-- Table Loading -->
      <div class="bg-surface-container-low rounded-xl p-6 animate-pulse h-96" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-8 rounded-xl bg-error-container/20 border border-error/30 text-center">
      <span class="material-symbols-outlined text-4xl text-error mb-4">error</span>
      <h3 class="text-lg font-bold text-error mb-2">Erro ao carregar dados</h3>
      <p class="text-sm text-on-surface-variant">{{ error.message }}</p>
    </div>

    <!-- Content -->
    <div v-else class="space-y-8">
      <!-- Section 1: Hero - Inverse Correlation Chart + Quick Insights -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Gold vs DXY Chart -->
        <div class="lg:col-span-8">
          <CorrelationChart
            type="inverse"
            :gold-data="goldChartData"
            :dxy-data="dxyChartData"
            :correlation-strength="goldDxyCorrelation"
          />
        </div>

        <!-- Quick Insight Cards -->
        <div class="lg:col-span-4 space-y-6">
          <!-- Gold Insight -->
          <InsightCard
            title="Insight Ouro vs Dólar"
            content="Correlação Ouro vs Dólar: Se Ouro sobe e DXY cai, sinaliza dólar fraco globalmente. Ativos de risco tendem a ganhar tração no curto prazo."
            icon="insights"
            variant="success"
          />

          <!-- VIX Risk Appetite -->
          <div class="bg-surface-container-high p-5 rounded-xl border-l-4 border-primary">
            <h4 class="text-xs font-bold text-outline uppercase tracking-widest mb-3">
              Sinal de Apetite de Risco
            </h4>
            <div class="flex items-center justify-between mb-3">
              <div class="flex flex-col">
                <span class="font-mono text-xl text-primary">VIX: {{ currentData.vix.toFixed(2) }}</span>
                <span class="text-xs" :class="currentData.vixChange >= 0 ? 'text-error' : 'text-primary'">
                  {{ currentData.vixChange >= 0 ? '+' : '' }}{{ currentData.vixChange.toFixed(2) }}
                </span>
              </div>
              <span class="material-symbols-outlined text-primary">{{ vixIcon }}</span>
            </div>
            <p class="text-xs text-on-surface-variant italic">
              "Quando VIX está abaixo de 15, o apetite por risco aumenta, favorecendo posições compradas em WIN e EWZ."
            </p>
            <div class="mt-3 pt-3 border-t border-outline/10">
              <div class="flex items-center justify-between text-xs">
                <span class="text-on-surface-variant">Cenário:</span>
                <span class="font-bold" :style="{ color: scenarioColor }">{{ currentData.scenario }}</span>
              </div>
              <div class="flex items-center justify-between text-xs mt-1">
                <span class="text-on-surface-variant">DXY:</span>
                <span class="font-mono">{{ currentData.dxy.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Commodities Insight -->
          <div class="bg-surface-container-high p-5 rounded-xl border-l-4 border-tertiary">
            <h4 class="text-xs font-bold text-outline uppercase tracking-widest mb-3">
              Commodities
            </h4>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs text-on-surface-variant">Gold:</span>
                <span class="font-mono text-sm text-tertiary">${{ currentData.gold.toFixed(2) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-on-surface-variant">Brent:</span>
                <span class="font-mono text-sm text-tertiary">${{ currentData.brent.toFixed(2) }}</span>
              </div>
            </div>
            <p class="text-xs text-on-surface-variant italic mt-3">
              Quando Brent > $80 E Minério > $100 E DXY estável = WIN tende a subir.
            </p>
          </div>
        </div>
      </div>

      <!-- Section 2: Correlation Cards Grid -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-bold text-on-surface">Ativos Principais</h2>
            <p class="text-xs text-on-surface-variant">Clique em cada card para ver detalhes</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CorrelationCard
            v-for="(item, index) in correlations"
            :key="index"
            :item="item"
          />
        </div>
      </section>

      <!-- Section 3: Correlation Matrix Table -->
      <section>
        <MatrixTable :correlations="correlations" />
      </section>

      <!-- Section 4: Interactive Scenarios -->
      <section>
        <div class="mb-6">
          <h2 class="text-lg font-bold text-on-surface">Cenários Interativos</h2>
          <p class="text-xs text-on-surface-variant">
            Selecione um cenário para ver condições detalhadas e resultado esperado
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScenarioDetailCard
            v-for="(scenario, index) in scenarios"
            :key="index"
            :scenario="scenario"
          />
        </div>
      </section>

      <!-- Section 5: Additional Insights -->
      <section class="pt-4">
        <div class="mb-6">
          <h2 class="text-lg font-bold text-on-surface">Insights de Trading</h2>
          <p class="text-xs text-on-surface-variant">
            Informações práticas baseadas nas correlações
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InsightCard
            title="VIX como Termômetro"
            content="VIX abaixo de 15 = Risk-On (comprar WIN, vender WDO). VIX acima de 20 = Risk-Off (vender WIN, comprar WDO)."
            icon="speed"
            variant="success"
          />

          <InsightCard
            title="Fluxo Estrangeiro (EWZ)"
            content="EWZ subindo indica capital entrando no Brasil. Confirmação de força no WIN. EWZ caindo = cautela com posições em WIN."
            icon="south"
            variant="info"
          />

          <InsightCard
            title="DXY Inverso"
            content="DXY tem correlação inversa com mercados emergentes. DXY fraco = ambiente propício para WIN subir."
            icon="sync_alt"
            variant="warning"
          />

          <InsightCard
            title="Treasuries (TNX)"
            content="Juros americanos em alta fortalecem o dólar (DXY sobe). Impacto negativo em mercados emergentes e commodities."
            icon="account_balance"
            variant="warning"
          />

          <InsightCard
            title="Safe Haven - Ouro"
            content="Ouro subindo pode indicar tanto medo (Risk-Off) quanto hedge contra inflação. Use em conjunto com VIX."
            icon="shield"
            variant="default"
          />

          <InsightCard
            title="Timing de Entrada"
            content="Aguarde confirmação: DXY caindo + VIX < 15 + EWZ subindo = entrada agressiva em WIN. Um ou dois confirma."
            icon="schedule"
            variant="success"
          />
        </div>
      </section>
    </div>
  </div>
</template>
