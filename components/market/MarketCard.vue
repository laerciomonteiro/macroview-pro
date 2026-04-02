<script setup lang="ts">
interface Props {
  title: string
  value: string | number
  variation: number
  variationPercent?: number
  unit?: string
  icon?: string
  trend: 'up' | 'down' | 'neutral'
  loading?: boolean
  sparklineData?: number[]
  vixLevel?: 'low' | 'medium' | 'high'
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  loading: false,
  sparklineData: () => [],
  vixLevel: undefined,
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  return props.value
})

const formattedVariation = computed(() => {
  const sign = props.variation >= 0 ? '+' : ''
  return `${sign}${props.variation.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
})

const formattedPercent = computed(() => {
  if (props.variationPercent === undefined) return null
  const sign = props.variationPercent >= 0 ? '+' : ''
  return `${sign}${props.variationPercent.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
})

const trendColor = computed(() => {
  if (props.vixLevel) {
    switch (props.vixLevel) {
      case 'low': return 'text-primary'
      case 'medium': return 'text-tertiary'
      case 'high': return 'text-secondary'
    }
  }
  switch (props.trend) {
    case 'up': return 'text-primary'
    case 'down': return 'text-secondary'
    default: return 'text-on-surface-variant'
  }
})

const arrowIcon = computed(() => {
  switch (props.trend) {
    case 'up': return '↑'
    case 'down': return '↓'
    default: return '→'
  }
})

const cardGlow = computed(() => {
  if (props.vixLevel) {
    switch (props.vixLevel) {
      case 'low': return 'shadow-primary/20'
      case 'medium': return 'shadow-tertiary/20'
      case 'high': return 'shadow-secondary/20'
    }
  }
  switch (props.trend) {
    case 'up': return 'shadow-primary/20'
    case 'down': return 'shadow-secondary/20'
    default: return 'shadow-on-surface-variant/10'
  }
})
</script>

<template>
  <div
    :class="[
      'relative overflow-hidden rounded-xl border transition-all duration-300',
      'bg-surface-container border-outline/20',
      'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10',
      'group cursor-pointer',
      cardGlow
    ]"
  >
    <!-- Loading Skeleton -->
    <div v-if="loading" class="p-5 space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-surface-bright/20 animate-pulse" />
        <div class="w-24 h-4 rounded bg-surface-bright/20 animate-pulse" />
      </div>
      <div class="w-32 h-8 rounded bg-surface-bright/20 animate-pulse" />
      <div class="flex gap-2">
        <div class="w-20 h-5 rounded bg-surface-bright/20 animate-pulse" />
        <div class="w-16 h-5 rounded bg-surface-bright/20 animate-pulse" />
      </div>
    </div>

    <!-- Content -->
    <div v-else class="p-5">
      <!-- Header with Icon -->
      <div class="flex items-center gap-3 mb-4">
        <div
          :class="[
            'flex items-center justify-center w-10 h-10 rounded-lg',
            'bg-surface-bright/10 border border-outline/10',
            'group-hover:border-primary/30 transition-colors'
          ]"
        >
          <span v-if="icon" class="text-lg">{{ icon }}</span>
          <svg
            v-else
            class="w-5 h-5 text-on-surface-variant"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        </div>
        <span class="text-sm font-medium text-on-surface-variant uppercase tracking-wide">
          {{ title }}
        </span>
      </div>

      <!-- Value -->
      <div class="mb-3">
        <span class="text-3xl font-bold font-mono text-on-surface">
          {{ formattedValue }}
        </span>
        <span v-if="unit" class="ml-1 text-lg text-on-surface-variant">{{ unit }}</span>
      </div>

      <!-- Sparkline -->
      <div v-if="sparklineData && sparklineData.length > 0" class="h-12 mb-3">
        <SparklineChart
          :data="sparklineData"
          :color="trend === 'up' ? '#4edea3' : trend === 'down' ? '#ffb2b7' : '#86948a'"
          :height="48"
        />
      </div>

      <!-- Variation -->
      <div class="flex items-center gap-2">
        <span
          :class="[
            'inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium',
            trend === 'up' && 'bg-primary/10 text-primary',
            trend === 'down' && 'bg-secondary/10 text-secondary',
            trend === 'neutral' && 'bg-on-surface-variant/10 text-on-surface-variant'
          ]"
        >
          <span>{{ arrowIcon }}</span>
          <span>{{ formattedVariation }}</span>
        </span>
        <span
          v-if="formattedPercent"
          :class="[
            'text-sm font-medium',
            trend === 'up' && 'text-primary',
            trend === 'down' && 'text-secondary',
            trend === 'neutral' && 'text-on-surface-variant'
          ]"
        >
          ({{ formattedPercent }})
        </span>
      </div>

      <!-- VIX Level Indicator -->
      <div v-if="vixLevel" class="mt-3 flex items-center gap-2">
        <span
          :class="[
            'w-2 h-2 rounded-full animate-pulse',
            vixLevel === 'low' && 'bg-primary',
            vixLevel === 'medium' && 'bg-tertiary',
            vixLevel === 'high' && 'bg-secondary'
          ]"
        />
        <span class="text-xs text-on-surface-variant">
          {{ vixLevel === 'low' ? 'Medo Baixo' : vixLevel === 'medium' ? 'Neutro' : 'Medo Alto' }}
        </span>
      </div>
    </div>

    <!-- Hover Glow Effect -->
    <div
      :class="[
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none',
        'bg-gradient-to-br from-primary/5 to-transparent'
      ]"
    />
  </div>
</template>
