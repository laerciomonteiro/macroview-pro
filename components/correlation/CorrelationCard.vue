<script setup lang="ts">
import type { CorrelationItem } from '~/types/correlation'

interface Props {
  item: CorrelationItem
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const impactConfig = {
  up: { symbol: '↑', color: 'text-primary', bg: 'bg-primary/10' },
  down: { symbol: '↓', color: 'text-secondary', bg: 'bg-secondary/10' },
  stable: { symbol: '↔', color: 'text-outline', bg: 'bg-outline/10' }
}

const signalConfig = computed(() => {
  switch (props.item.signalType) {
    case 'positive':
      return {
        bg: 'bg-primary/10',
        border: 'border-primary/30',
        text: 'text-primary'
      }
    case 'negative':
      return {
        bg: 'bg-secondary/10',
        border: 'border-secondary/30',
        text: 'text-secondary'
      }
    default:
      return {
        bg: 'bg-outline/10',
        border: 'border-outline/30',
        text: 'text-outline'
      }
  }
})

const assetColor = computed(() => {
  switch (props.item.asset) {
    case 'VIX': return 'text-secondary'
    case 'DXY': return 'text-primary'
    case 'EWZ': return 'text-tertiary'
    case 'OURO': return 'text-[#f9bd22]'
    case 'BRENT': return 'text-[#4edea3]'
    case 'MINERIO': return 'text-[#ff6b35]'
    case 'TNX': return 'text-[#bbcabf]'
    case 'SPX': return 'text-[#4edea3]'
    default: return 'text-on-surface'
  }
})

// Display value: show changePercent if available, otherwise correlation
const displayValue = computed(() => {
  if (props.item.changePercent !== undefined) {
    const val = props.item.changePercent
    return val >= 0 ? `+${val.toFixed(2)}%` : `${val.toFixed(2)}%`
  }
  if (props.item.correlation !== undefined) {
    const val = props.item.correlation
    return val >= 0 ? `+${val.toFixed(2)}` : `${val.toFixed(2)}`
  }
  return null
})

// Color for display value: green for positive change, red for negative
const displayValueColor = computed(() => {
  if (props.item.changePercent !== undefined) {
    return props.item.changePercent >= 0
      ? 'bg-primary/10 text-primary'
      : 'bg-secondary/10 text-secondary'
  }
  if (props.item.correlation !== undefined) {
    return props.item.correlation < 0
      ? 'bg-secondary/10 text-secondary'
      : 'bg-primary/10 text-primary'
  }
  return 'bg-outline/10 text-outline'
})

// Label: % for changePercent, corr for correlation
const displayLabel = computed(() => {
  return props.item.changePercent !== undefined ? 'Δ%' : 'corr'
})
</script>

<template>
  <div class="relative overflow-hidden rounded-xl border bg-surface-container transition-all duration-300 hover:bg-surface-container-high/40 group">
    <!-- Loading Skeleton -->
    <div v-if="loading" class="p-5 space-y-3">
      <div class="w-16 h-6 rounded bg-surface-bright/20 animate-pulse" />
      <div class="w-32 h-4 rounded bg-surface-bright/20 animate-pulse" />
      <div class="flex gap-2 mt-3">
        <div class="w-20 h-6 rounded bg-surface-bright/20 animate-pulse" />
        <div class="w-20 h-6 rounded bg-surface-bright/20 animate-pulse" />
      </div>
    </div>

    <!-- Content -->
    <div v-else class="p-5">
      <!-- Header -->
      <div class="flex items-start justify-between mb-3">
        <div>
          <h4 :class="['font-mono font-bold text-lg', assetColor]">
            {{ item.asset }}
          </h4>
          <p class="text-xs text-on-surface-variant mt-0.5">
            {{ item.name }}
          </p>
        </div>
        
        <!-- Tooltip Trigger -->
        <div class="relative">
          <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-0 z-10 w-72 p-4 rounded-lg bg-surface-container-highest border border-outline/20 shadow-xl transform translate-x-2 -translate-y-2">
            <p class="text-sm text-on-surface leading-relaxed">
              {{ item.description }}
            </p>
          </div>
          <span class="material-symbols-outlined text-sm text-on-surface-variant cursor-help">
            info
          </span>
        </div>
      </div>

      <!-- Meaning -->
      <p class="text-xs text-on-surface-variant mb-3">
        {{ item.meaning }}
      </p>

      <!-- Signal Badge -->
      <div class="mb-4">
        <span :class="[
          'inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider',
          signalConfig.bg,
          signalConfig.border,
          signalConfig.text
        ]">
          {{ item.signal }}
        </span>
      </div>

      <!-- Impact Badges -->
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-on-surface-variant">WIN</span>
          <span :class="[
            'font-mono text-sm font-bold px-2 py-0.5 rounded',
            impactConfig[item.impactWin].bg,
            impactConfig[item.impactWin].color
          ]">
            {{ impactConfig[item.impactWin].symbol }}
            <span v-if="item.impactWinStrength === 2" class="text-xs ml-0.5">2x</span>
          </span>
        </div>
        
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-on-surface-variant">WDO</span>
          <span :class="[
            'font-mono text-sm font-bold px-2 py-0.5 rounded',
            impactConfig[item.impactWdo].bg,
            impactConfig[item.impactWdo].color
          ]">
            {{ impactConfig[item.impactWdo].symbol }}
          </span>
        </div>

        <!-- Display Value (changePercent or correlation) -->
        <div v-if="displayValue" class="ml-auto flex items-center gap-1.5">
          <span class="text-[10px] font-medium text-on-surface-variant uppercase">{{ displayLabel }}</span>
          <span :class="['font-mono text-xs px-2 py-0.5 rounded', displayValueColor]">
            {{ displayValue }}
          </span>
        </div>
      </div>
    </div>

    <!-- Decorative Side Bar -->
    <div
      :class="['absolute top-0 left-0 w-1 h-full', signalConfig.bg]"
      :style="{ backgroundColor: signalConfig.text.includes('primary') ? '#4edea3' : signalConfig.text.includes('secondary') ? '#ffb2b7' : '#86948a' }"
    />
  </div>
</template>
