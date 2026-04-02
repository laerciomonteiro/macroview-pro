<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  scenario: 'Risk-On' | 'Risk-Off' | 'Neutro'
  interpretation: string
  signals: string[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// Simulated progress from 0 to 100%
const loadingProgress = ref(0)
let progressInterval: ReturnType<typeof setInterval> | null = null

onUnmounted(() => {
  if (progressInterval) {
    clearInterval(progressInterval)
  }
})

// Sincronizar animação com estado real de loading
watch(() => props.loading, (isLoading) => {
  if (isLoading) {
    // INICIAR animação - resetar e começar
    loadingProgress.value = 0
    progressInterval = setInterval(() => {
      if (loadingProgress.value < 90) {
        loadingProgress.value += Math.random() * 15
      }
    }, 500)
  } else {
    // PARAR animação - ir para 100%
    if (progressInterval) {
      clearInterval(progressInterval)
      progressInterval = null
    }
    loadingProgress.value = 100
    setTimeout(() => { loadingProgress.value = 0 }, 500)
  }
})

const scenarioConfig = computed(() => {
  switch (props.scenario) {
    case 'Risk-On':
      return {
        label: 'Risk-On',
        color: '#4edea3',
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/30',
        icon: '📈',
        description: 'Ambiente de busca por risco - mercados em alta, dólar fraco',
      }
    case 'Risk-Off':
      return {
        label: 'Risk-Off',
        color: '#ffb2b7',
        bgColor: 'bg-secondary/10',
        borderColor: 'border-secondary/30',
        icon: '📉',
        description: 'Fuga de risco - mercados em queda, dólar forte, busca por segurança',
      }
    default:
      return {
        label: 'Neutro',
        color: '#f9bd22',
        bgColor: 'bg-tertiary/10',
        borderColor: 'border-tertiary/30',
        icon: '➡️',
        description: 'Cautela lateral - esperando por catalisadores',
      }
  }
})

/**
 * Generate a concise mini-analysis based on scenario signals
 * This creates a DIFFERENT analysis from the main Gemini analysis
 */
function generateMiniAnalysis(scenario: string, signals: string[]): string {
  if (!signals || signals.length === 0) return ''

  // Extract key values from signals for contextual analysis
  const vixSignal = signals.find(s => s.toLowerCase().includes('vix'))
  const dxySignal = signals.find(s => s.toLowerCase().includes('dxy') || s.toLowerCase().includes('dólar'))
  const fearSignal = signals.find(s => s.toLowerCase().includes('fear') || s.toLowerCase().includes('aversão'))
  const riskSignal = signals.find(s => s.toLowerCase().includes('risco') || s.toLowerCase().includes('risc'))

  let miniAnalysis = ''

  switch (scenario) {
    case 'Risk-On':
      miniAnalysis = 'O ambiente sugere busca por risco em mercados emergentes. '
      if (vixSignal) miniAnalysis += 'VIX em níveis baixos indica baixa aversão a risco. '
      if (dxySignal) miniAnalysis += 'Dólar enfraquecido favorece posições compradas em WIN. '
      break
    case 'Risk-Off':
      miniAnalysis = 'Mercado em modo de aversão a risco ativo. '
      if (vixSignal) miniAnalysis += 'VIX elevado sinaliza volatilidade e cautela. '
      if (dxySignal) miniAnalysis += 'Dólar fortalecido pressiona mercados emergentes. '
      break
    default:
      miniAnalysis = 'Cenário neutro aguardando catalisadores. '
      if (vixSignal) miniAnalysis += 'VIX estável sugere equilíbrio. '
      if (dxySignal) miniAnalysis += 'Dólar lateral não define direção clara. '
      break
  }

  // Clean up any trailing spaces and limit length
  return miniAnalysis.replace(/\s+/g, ' ').trim()
}

// Always generate mini-analysis from signals to ensure it's DIFFERENT from main analysis
const miniAnalysis = computed(() => {
  return generateMiniAnalysis(props.scenario, props.signals)
})
</script>

<template>
  <div
    :class="[
      'relative overflow-hidden rounded-xl border transition-all duration-300',
      'bg-surface-container',
      scenarioConfig.borderColor
    ]"
  >
    <!-- Loading State - Creative Indicator -->
    <div v-if="loading" class="p-6 sm:p-8">
      <div class="flex flex-col items-center justify-center py-6">
        <!-- Animated Icon -->
        <div class="relative mb-4">
          <span class="material-symbols-outlined text-5xl text-primary animate-bounce" style="font-variation-settings: 'FILL' 1;">
            auto_awesome
          </span>
          <!-- Subtle pulse ring -->
          <div class="absolute inset-0 rounded-full bg-primary/20 animate-ping" style="animation-duration: 1.5s;" />
        </div>
        
        <!-- Loading Text -->
        <div class="flex items-center gap-2 text-on-surface-variant">
          <span class="material-symbols-outlined animate-spin text-primary">psychology</span>
          <span class="text-sm italic">Robô analisando...</span>
        </div>
        
        <!-- Percentage Progress Bar -->
        <div class="w-64 mt-4">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-on-surface-variant">Progresso</span>
            <span class="text-xs font-mono text-primary">{{ Math.round(loadingProgress) }}%</span>
          </div>
          <div class="w-full h-2 rounded-full bg-surface-bright/20 overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300 ease-out"
              :style="{ width: `${loadingProgress}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="p-4 sm:p-6">
      <!-- Header -->
      <div class="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
        <!-- Large Visual Indicator -->
        <div
          :class="[
            'relative flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full flex-shrink-0',
            scenarioConfig.bgColor,
            'border-2'
          ]"
          :style="{ borderColor: scenarioConfig.color }"
        >
          <span class="text-2xl sm:text-3xl">{{ scenarioConfig.icon }}</span>
          
          <!-- Pulsing Ring -->
          <div
            class="absolute inset-0 rounded-full animate-ping opacity-20"
            :style="{
              backgroundColor: scenarioConfig.color,
              animationDuration: '2s'
            }"
          />
        </div>

        <!-- Scenario Title -->
        <div class="min-w-0">
          <h3
            class="text-lg sm:text-xl font-bold"
            :style="{ color: scenarioConfig.color }"
          >
            {{ scenarioConfig.label }}
          </h3>
          <p class="text-xs sm:text-sm text-on-surface-variant line-clamp-2 sm:line-clamp-none">
            {{ scenarioConfig.description }}
          </p>
        </div>
      </div>

      <!-- Interpretation -->
      <div class="mb-4 sm:mb-5 p-3 sm:p-4 rounded-lg bg-surface-lowest/50 border border-outline/10">
        <p class="text-sm text-on-surface leading-relaxed">
          {{ interpretation }}
        </p>
      </div>

      <!-- Signals -->
      <div>
        <h4 class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2 sm:mb-3">
          Sinais que determinaram este cenário
        </h4>
        <div class="flex flex-wrap gap-1.5 sm:gap-2">
          <span
            v-for="(signal, index) in signals"
            :key="index"
            :class="[
              'inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium',
              'border transition-colors',
              scenarioConfig.bgColor,
              scenarioConfig.borderColor
            ]"
          >
            <span :style="{ color: scenarioConfig.color }">●</span>
            {{ signal }}
          </span>
        </div>

        <!-- Mini Analysis -->
        <div
          v-if="miniAnalysis"
          class="mt-3 sm:mt-4 p-2 sm:p-3 rounded-lg bg-surface-lowest/30 border border-outline/10 italic"
        >
          <p class="text-xs text-on-surface-variant leading-relaxed">
            <span class="font-semibold not-italic text-primary/80">Mini-análise:</span>
            {{ miniAnalysis }}
          </p>
        </div>
      </div>
    </div>

    <!-- Decorative Background Gradient -->
    <div
      class="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2"
      :style="{
        background: `radial-gradient(circle, ${scenarioConfig.color} 0%, transparent 70%)`
      }"
    />
  </div>
</template>
