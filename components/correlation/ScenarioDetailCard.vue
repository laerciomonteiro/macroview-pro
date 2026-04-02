<script setup lang="ts">
import type { ScenarioDetail } from '~/types/correlation'

interface Props {
  scenario: ScenarioDetail
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const scenarioConfig = computed(() => {
  switch (props.scenario.name) {
    case 'Risk-On':
      return {
        bgColor: 'bg-primary/5',
        hoverBgColor: 'hover:bg-primary/10',
        borderColor: 'border-primary/20',
        iconColor: 'text-primary',
        badgeBg: 'bg-primary-container/20 text-primary',
        description: 'Ambiente de busca por risco - mercados em alta, dólar fraco'
      }
    case 'Risk-Off':
      return {
        bgColor: 'bg-secondary/5',
        hoverBgColor: 'hover:bg-secondary/10',
        borderColor: 'border-secondary/20',
        iconColor: 'text-secondary',
        badgeBg: 'bg-secondary-container/20 text-secondary',
        description: 'Fuga de risco - mercados em queda, dólar forte, busca por segurança'
      }
    default:
      return {
        bgColor: 'bg-outline/5',
        hoverBgColor: 'hover:bg-outline/10',
        borderColor: 'border-outline/20',
        iconColor: 'text-outline',
        badgeBg: 'bg-tertiary-container/20 text-tertiary',
        description: 'Cautela lateral - esperando por catalisadores'
      }
  }
})

const iconStyle = computed(() => ({
  fontVariationSettings: props.scenario.name === 'Risk-On' ? "'FILL' 1" : 'normal'
}))
</script>

<template>
  <div
    :class="[
      'relative overflow-hidden rounded-xl border p-5 transition-all duration-300 cursor-pointer group',
      scenarioConfig.bgColor,
      scenarioConfig.hoverBgColor,
      scenarioConfig.borderColor
    ]"
  >
    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-surface-bright/20 animate-pulse" />
        <div class="flex-1 space-y-2">
          <div class="w-24 h-6 rounded bg-surface-bright/20 animate-pulse" />
          <div class="w-36 h-4 rounded bg-surface-bright/20 animate-pulse" />
        </div>
      </div>
      <div class="space-y-2">
        <div class="w-full h-4 rounded bg-surface-bright/20 animate-pulse" />
        <div class="w-3/4 h-4 rounded bg-surface-bright/20 animate-pulse" />
      </div>
      <div class="flex gap-2">
        <div class="w-20 h-6 rounded bg-surface-bright/20 animate-pulse" />
        <div class="w-20 h-6 rounded bg-surface-bright/20 animate-pulse" />
      </div>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <!-- Icon -->
          <div
            :class="[
              'relative flex items-center justify-center w-14 h-14 rounded-full border-2',
              scenarioConfig.bgColor
            ]"
            :style="{ borderColor: scenario.color }"
          >
            <span
              :class="['material-symbols-outlined text-2xl', scenarioConfig.iconColor]"
              :style="iconStyle"
            >
              {{ scenario.icon === 'rocket_launch' ? 'rocket_launch' : scenario.icon === 'warning' ? 'warning' : 'drag_handle' }}
            </span>
            
            <!-- Pulsing Ring for Risk-On -->
            <div
              v-if="scenario.name === 'Risk-On'"
              class="absolute inset-0 rounded-full animate-ping opacity-20"
              :style="{ backgroundColor: scenario.color, animationDuration: '2s' }"
            />
          </div>

          <!-- Title and Description -->
          <div>
            <h3 class="text-lg font-bold" :style="{ color: scenario.color }">
              {{ scenario.label }}
            </h3>
            <p class="text-xs text-on-surface-variant">
              {{ scenarioConfig.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- Interpretation -->
      <div class="mb-4 p-3 rounded-lg bg-surface-lowest/50 border border-outline/10">
        <p class="text-sm text-on-surface leading-relaxed">
          {{ scenario.interpretation }}
        </p>
      </div>

      <!-- Conditions -->
      <div class="mb-4">
        <h4 class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
          Condições
        </h4>
        <ul class="space-y-1.5">
          <li
            v-for="(condition, index) in scenario.conditions"
            :key="index"
            class="flex items-center gap-2 text-xs text-on-surface-variant"
          >
            <span :class="['font-bold', scenarioConfig.iconColor]">●</span>
            {{ condition }}
          </li>
        </ul>
      </div>

      <!-- Expected Outcome -->
      <div class="mb-4 p-3 rounded-lg border" :class="scenarioConfig.borderColor">
        <h4 class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
          Resultado Esperado
        </h4>
        <p class="text-xs font-medium" :style="{ color: scenario.color }">
          {{ scenario.expectedOutcome }}
        </p>
      </div>

      <!-- Signal Badges -->
      <div class="flex flex-wrap gap-2">
        <span
          v-for="(signal, index) in scenario.signals"
          :key="index"
          :class="[
            'inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold border',
            scenarioConfig.bgColor,
            scenarioConfig.borderColor,
            scenarioConfig.iconColor
          ]"
        >
          {{ signal }}
        </span>
      </div>
    </div>

    <!-- Decorative Background Gradient -->
    <div
      class="absolute top-0 right-0 w-48 h-48 opacity-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2"
      :style="{ background: `radial-gradient(circle, ${scenario.color} 0%, transparent 70%)` }"
    />
  </div>
</template>
