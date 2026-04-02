<script setup lang="ts">
interface Props {
  scenario: 'Risk-On' | 'Risk-Off' | 'Neutro'
  interpretation: string
  signals: string[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
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
</script>

<template>
  <div
    :class="[
      'relative overflow-hidden rounded-xl border transition-all duration-300',
      'bg-surface-container',
      scenarioConfig.borderColor
    ]"
  >
    <!-- Loading Skeleton -->
    <div v-if="loading" class="p-6 space-y-4">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-surface-bright/20 animate-pulse" />
        <div class="flex-1 space-y-2">
          <div class="w-32 h-6 rounded bg-surface-bright/20 animate-pulse" />
          <div class="w-48 h-4 rounded bg-surface-bright/20 animate-pulse" />
        </div>
      </div>
      <div class="space-y-2">
        <div class="w-full h-4 rounded bg-surface-bright/20 animate-pulse" />
        <div class="w-3/4 h-4 rounded bg-surface-bright/20 animate-pulse" />
      </div>
      <div class="flex gap-2">
        <div class="w-24 h-6 rounded bg-surface-bright/20 animate-pulse" />
        <div class="w-24 h-6 rounded bg-surface-bright/20 animate-pulse" />
        <div class="w-24 h-6 rounded bg-surface-bright/20 animate-pulse" />
      </div>
    </div>

    <!-- Content -->
    <div v-else class="p-6">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-4">
        <!-- Large Visual Indicator -->
        <div
          :class="[
            'relative flex items-center justify-center w-16 h-16 rounded-full',
            scenarioConfig.bgColor,
            'border-2'
          ]"
          :style="{ borderColor: scenarioConfig.color }"
        >
          <span class="text-3xl">{{ scenarioConfig.icon }}</span>
          
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
        <div>
          <h3
            class="text-xl font-bold"
            :style="{ color: scenarioConfig.color }"
          >
            {{ scenarioConfig.label }}
          </h3>
          <p class="text-sm text-on-surface-variant">
            {{ scenarioConfig.description }}
          </p>
        </div>
      </div>

      <!-- Interpretation -->
      <div class="mb-5 p-4 rounded-lg bg-surface-lowest/50 border border-outline/10">
        <p class="text-sm text-on-surface leading-relaxed">
          {{ interpretation }}
        </p>
      </div>

      <!-- Signals -->
      <div>
        <h4 class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">
          Sinais que determinaram este cenário
        </h4>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(signal, index) in signals"
            :key="index"
            :class="[
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
              'border transition-colors',
              scenarioConfig.bgColor,
              scenarioConfig.borderColor
            ]"
          >
            <span :style="{ color: scenarioConfig.color }">●</span>
            {{ signal }}
          </span>
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
