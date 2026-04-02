<script setup lang="ts">
import type { VixLevel, ImpactAlert, MarketSentiment } from '~/types/calendar'

interface Props {
  vixValue: number
  vixInterpretation: string
  vixLevel: VixLevel
  upcomingAlerts: ImpactAlert[]
  marketSentiment: MarketSentiment
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// VIX level colors
const vixLevelColors: Record<VixLevel, { bg: string, text: string, border: string, label: string }> = {
  low: { 
    bg: 'bg-primary/10', 
    text: 'text-primary', 
    border: 'border-primary/20',
    label: 'Medo Baixo'
  },
  medium: { 
    bg: 'bg-tertiary/10', 
    text: 'text-tertiary', 
    border: 'border-tertiary/20',
    label: 'Volatilidade Moderada'
  },
  high: { 
    bg: 'bg-secondary/10', 
    text: 'text-secondary', 
    border: 'border-secondary/20',
    label: 'Medo Alto'
  }
}

const vixColors = computed(() => vixLevelColors[props.vixLevel])

// Sentiment colors
const sentimentConfig: Record<string, { bg: string, text: string, border: string, icon: string }> = {
  'risk-on': {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
    icon: '↑'
  },
  'risk-off': {
    bg: 'bg-secondary/10',
    text: 'text-secondary',
    border: 'border-secondary/20',
    icon: '↓'
  },
  'neutral': {
    bg: 'bg-tertiary/10',
    text: 'text-tertiary',
    border: 'border-tertiary/20',
    icon: '→'
  }
}

const sentimentStyle = computed(() => sentimentConfig[props.marketSentiment.sentiment] || sentimentConfig.neutral)

// Format VIX value
const formattedVix = computed(() => {
  return props.vixValue.toFixed(2)
})

// Format VIX change
const formattedVixChange = computed(() => {
  // Simulated change
  const change = (Math.random() - 0.5) * 2
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}`
})
</script>

<template>
  <div class="space-y-4">
    <!-- VIX Card -->
    <div 
      :class="[
        'rounded-xl border p-4 transition-all',
        vixColors.bg,
        vixColors.border
      ]"
    >
      <!-- Loading Skeleton -->
      <div v-if="loading" class="space-y-3">
        <div class="h-4 w-24 rounded bg-surface-bright/20 animate-pulse" />
        <div class="h-8 w-16 rounded bg-surface-bright/20 animate-pulse" />
        <div class="h-3 w-32 rounded bg-surface-bright/20 animate-pulse" />
      </div>

      <!-- Content -->
      <div v-else>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
            VIX Index
          </span>
          <span
            :class="[
              'px-2 py-0.5 rounded text-xs font-medium',
              vixColors.bg,
              vixColors.text
            ]"
          >
            {{ vixColors.label }}
          </span>
        </div>

        <div class="flex items-end gap-2 mb-2">
          <span class="text-3xl font-bold font-mono" :class="vixColors.text">
            {{ formattedVix }}
          </span>
          <span class="text-sm font-mono text-on-surface-variant mb-1">
            {{ formattedVixChange }}
          </span>
        </div>

        <p class="text-xs" :class="vixColors.text">
          {{ vixInterpretation }}
        </p>
      </div>
    </div>

    <!-- Market Sentiment Card -->
    <div 
      :class="[
        'rounded-xl border p-4',
        sentimentStyle.bg,
        sentimentStyle.border
      ]"
    >
      <!-- Loading Skeleton -->
      <div v-if="loading" class="space-y-3">
        <div class="h-4 w-28 rounded bg-surface-bright/20 animate-pulse" />
        <div class="h-3 w-full rounded bg-surface-bright/20 animate-pulse" />
        <div class="h-3 w-3/4 rounded bg-surface-bright/20 animate-pulse" />
      </div>

      <!-- Content -->
      <div v-else>
        <div class="flex items-center gap-2 mb-3">
          <div
            :class="[
              'w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold',
              sentimentStyle.bg,
              sentimentStyle.text
            ]"
          >
            {{ sentimentStyle.icon }}
          </div>
          <div>
            <span class="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
              Sentimento
            </span>
            <h4 class="text-sm font-semibold capitalize" :class="sentimentStyle.text">
              {{ marketSentiment.sentiment === 'risk-on' ? 'Risk-On' : 
                 marketSentiment.sentiment === 'risk-off' ? 'Risk-Off' : 'Neutro' }}
            </h4>
          </div>
        </div>

        <p class="text-xs text-on-surface-variant mb-3">
          {{ marketSentiment.description }}
        </p>

        <!-- Sentiment Signals -->
        <div v-if="marketSentiment.signals.length > 0" class="space-y-1">
          <div
            v-for="(signal, index) in marketSentiment.signals"
            :key="index"
            class="flex items-start gap-2 text-xs"
          >
            <span :class="sentimentStyle.text">•</span>
            <span class="text-on-surface-variant">{{ signal }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Impact Alerts -->
    <div 
      v-if="upcomingAlerts.length > 0"
      class="rounded-xl border bg-surface-container border-outline/20 p-4"
    >
      <!-- Loading Skeleton -->
      <div v-if="loading" class="space-y-3">
        <div class="h-4 w-24 rounded bg-surface-bright/20 animate-pulse" />
        <div class="h-16 w-full rounded bg-surface-bright/20 animate-pulse" />
        <div class="h-16 w-full rounded bg-surface-bright/20 animate-pulse" />
      </div>

      <!-- Content -->
      <div v-else>
        <div class="flex items-center gap-2 mb-3">
          <div class="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span class="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
            Alertas de Impacto
          </span>
        </div>

        <div class="space-y-2">
          <div
            v-for="alert in upcomingAlerts.slice(0, 3)"
            :key="alert.event.id"
            class="p-3 rounded-lg bg-surface-bright/5 border border-outline/10"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-on-surface truncate">
                  {{ alert.event.eventName }}
                </p>
                <p class="text-xs text-on-surface-variant">
                  {{ alert.event.region }} • {{ alert.event.currency }}
                </p>
              </div>
              <span
                :class="[
                  'px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap',
                  alert.event.impact === 'high' && 'bg-secondary/20 text-secondary',
                  alert.event.impact === 'medium' && 'bg-tertiary/20 text-tertiary',
                  alert.event.impact === 'low' && 'bg-primary/20 text-primary'
                ]"
              >
                {{ alert.event.impact }}
              </span>
            </div>
            <p class="mt-1 text-xs" :class="alert.isUpcoming ? 'text-secondary' : 'text-on-surface-variant'">
              {{ alert.timeUntil }}
            </p>
          </div>
        </div>

        <p v-if="upcomingAlerts.length > 3" class="mt-2 text-xs text-center text-on-surface-variant">
          +{{ upcomingAlerts.length - 3 }} mais eventos
        </p>
      </div>
    </div>
  </div>
</template>
