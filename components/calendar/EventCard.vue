<script setup lang="ts">
import type { EconomicEvent, ImpactLevel } from '~/types/calendar'

interface Props {
  event: EconomicEvent
}

const props = defineProps<Props>()

// Format time for display
const formattedTime = computed(() => {
  const date = new Date(props.event.datetime)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
})

// Region flags
const regionFlags: Record<string, string> = {
  US: '🇺🇸',
  BR: '🇧🇷',
  EU: '🇪🇺'
}

const regionLabels: Record<string, string> = {
  US: 'Estados Unidos',
  BR: 'Brasil',
  EU: 'Eurozona'
}

// Impact bars configuration
const impactConfig: Record<ImpactLevel, { active: number, colors: string[] }> = {
  high: { active: 3, colors: ['bg-secondary', 'bg-secondary', 'bg-secondary'] },
  medium: { active: 2, colors: ['bg-tertiary', 'bg-tertiary', 'bg-on-surface-variant/20'] },
  low: { active: 1, colors: ['bg-primary', 'bg-on-surface-variant/20', 'bg-on-surface-variant/20'] }
}

const impactInfo = computed(() => impactConfig[props.event.impact])

// Format value for display
const formatValue = (value: string | null | undefined): string => {
  if (value === null || value === undefined) return '-'
  return value
}

// Check if event is high impact
const isHighImpact = computed(() => props.event.impact === 'high')
</script>

<template>
  <div
    :class="[
      'relative group rounded-xl border transition-all duration-300',
      'bg-surface-container border-outline/20',
      'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
      isHighImpact && 'ring-1 ring-secondary/20'
    ]"
  >
    <div class="p-4">
      <!-- Header Row: Time, Region Flag, Currency -->
      <div class="flex items-center justify-between mb-3">
        <!-- Time -->
        <div class="flex items-center gap-2">
          <span class="text-lg font-mono font-bold text-on-surface">
            {{ formattedTime }}
          </span>
          <span class="text-xs text-on-surface-variant uppercase tracking-wide">
            ({{ regionLabels[event.region] }})
          </span>
        </div>

        <!-- Region Flag -->
        <div class="flex items-center gap-2">
          <span class="text-2xl">{{ regionFlags[event.region] }}</span>
          <span class="px-2 py-1 rounded-md bg-surface-bright/10 text-xs font-medium text-on-surface-variant uppercase">
            {{ event.currency }}
          </span>
        </div>
      </div>

      <!-- Event Name -->
      <h3 
        :class="[
          'text-base font-semibold mb-3',
          isHighImpact ? 'text-secondary' : 'text-on-surface'
        ]"
      >
        {{ event.eventName }}
      </h3>

      <!-- Impact Indicator (3 bars) -->
      <div class="flex items-center gap-1 mb-3">
        <div
          v-for="i in 3"
          :key="i"
          :class="[
            'w-8 h-1.5 rounded-full transition-colors',
            i <= impactInfo.active ? impactInfo.colors[i - 1] : 'bg-on-surface-variant/20'
          ]"
        />
        <span class="ml-2 text-xs text-on-surface-variant uppercase tracking-wide">
          {{ event.impact }}
        </span>
      </div>

      <!-- Values Row: Actual, Forecast, Previous -->
      <div class="grid grid-cols-3 gap-2 pt-3 border-t border-outline/10">
        <!-- Actual -->
        <div class="text-center">
          <div class="text-xs text-on-surface-variant uppercase tracking-wide mb-1">Atual</div>
          <div 
            :class="[
              'text-sm font-mono font-semibold',
              event.actual ? 'text-on-surface' : 'text-on-surface-variant/50'
            ]"
          >
            {{ formatValue(event.actual) }}
          </div>
        </div>

        <!-- Forecast -->
        <div class="text-center">
          <div class="text-xs text-on-surface-variant uppercase tracking-wide mb-1">Previsão</div>
          <div class="text-sm font-mono font-semibold text-primary">
            {{ formatValue(event.forecast) }}
          </div>
        </div>

        <!-- Previous -->
        <div class="text-center">
          <div class="text-xs text-on-surface-variant uppercase tracking-wide mb-1">Anterior</div>
          <div class="text-sm font-mono font-semibold text-on-surface-variant">
            {{ formatValue(event.previous) }}
          </div>
        </div>
      </div>
    </div>

    <!-- High Impact Glow Effect -->
    <div
      v-if="isHighImpact"
      class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl bg-gradient-to-br from-secondary/5 to-transparent"
    />
  </div>
</template>
