<script setup lang="ts">
import type { CorrelationItem } from '~/types/correlation'

interface Props {
  correlations: CorrelationItem[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Asset color mapping
const assetColors: Record<string, string> = {
  'VIX': 'text-secondary',
  'DXY': 'text-primary',
  'EWZ': 'text-tertiary',
  'OURO': 'text-[#f9bd22]',
  'BRENT': 'text-[#4edea3]',
  'MINERIO': 'text-[#ff6b35]',
  'TNX': 'text-[#bbcabf]',
  'SPX': 'text-[#4edea3]'
}

// Signal badge styling
function getSignalBadge(signalType: 'positive' | 'negative' | 'neutral') {
  switch (signalType) {
    case 'positive':
      return 'bg-primary-container/20 text-primary'
    case 'negative':
      return 'bg-secondary-container/20 text-secondary'
    default:
      return 'bg-outline-variant/30 text-outline'
  }
}

// Impact rendering
function getImpactDisplay(impact: 'up' | 'down' | 'stable', strength?: number) {
  const symbols: Record<string, string> = {
    up: '↑',
    down: '↓',
    stable: '↔'
  }
  const colors: Record<string, string> = {
    up: 'text-primary',
    down: 'text-secondary',
    stable: 'text-outline'
  }
  return {
    symbol: symbols[impact] + (strength === 2 ? '2x' : ''),
    color: colors[impact]
  }
}
</script>

<template>
  <div class="bg-surface-container-low rounded-xl overflow-hidden">
    <!-- Header -->
    <div class="p-6 border-b border-outline-variant/10">
      <h3 class="text-lg font-bold text-on-surface">Intermarket Matrix</h3>
      <p class="text-xs text-on-surface-variant mt-1">Correlações entre ativos e impacto em WIN/WDO</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-6 space-y-4">
      <div v-for="i in 5" :key="i" class="flex items-center gap-4">
        <div class="w-16 h-6 rounded bg-surface-bright/20 animate-pulse" />
        <div class="flex-1 h-6 rounded bg-surface-bright/20 animate-pulse" />
        <div class="w-24 h-6 rounded bg-surface-bright/20 animate-pulse" />
        <div class="w-32 h-6 rounded bg-surface-bright/20 animate-pulse" />
      </div>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-surface-container-highest/50">
            <th class="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest border-b border-outline-variant/10">
              Asset
            </th>
            <th class="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest border-b border-outline-variant/10">
              Meaning
            </th>
            <th class="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest border-b border-outline-variant/10">
              Signal
            </th>
            <th class="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest border-b border-outline-variant/10">
              Impact WIN/WDO
            </th>
            <th class="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest border-b border-outline-variant/10">
              Correlation
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant/5">
          <tr
            v-for="(item, index) in correlations"
            :key="index"
            class="hover:bg-surface-container-high/40 transition-colors"
          >
            <!-- Asset -->
            <td class="px-6 py-4">
              <span :class="['font-mono font-bold text-sm', assetColors[item.asset] || 'text-on-surface']">
                {{ item.asset }}
              </span>
            </td>

            <!-- Meaning -->
            <td class="px-6 py-4">
              <span class="text-xs text-on-surface-variant">
                {{ item.meaning }}
              </span>
            </td>

            <!-- Signal -->
            <td class="px-6 py-4">
              <span
                :class="[
                  'px-2.5 py-1 rounded text-[10px] font-bold uppercase',
                  getSignalBadge(item.signalType)
                ]"
              >
                {{ item.signal }}
              </span>
            </td>

            <!-- Impact -->
            <td class="px-6 py-4">
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold text-on-surface-variant">WIN</span>
                  <span :class="['font-mono text-sm font-bold', getImpactDisplay(item.impactWin, item.impactWinStrength).color]">
                    {{ getImpactDisplay(item.impactWin, item.impactWinStrength).symbol }}
                  </span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold text-on-surface-variant">WDO</span>
                  <span :class="['font-mono text-sm font-bold', getImpactDisplay(item.impactWdo).color]">
                    {{ getImpactDisplay(item.impactWdo).symbol }}
                  </span>
                </div>
              </div>
            </td>

            <!-- Correlation -->
            <td class="px-6 py-4">
              <span
                v-if="item.correlation !== undefined"
                :class="[
                  'font-mono text-xs px-2 py-0.5 rounded',
                  item.correlation < 0 ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                ]"
              >
                {{ item.correlation > 0 ? '+' : '' }}{{ item.correlation }}
              </span>
              <span v-else class="text-outline text-xs">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Legend -->
    <div class="p-4 border-t border-outline-variant/10 bg-surface-container-lowest/50">
      <div class="flex items-center gap-6 text-xs text-on-surface-variant">
        <div class="flex items-center gap-2">
          <span class="text-primary">↑</span> <span>Positive impact on WIN</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-secondary">↓</span> <span>Negative impact on WIN</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-outline">↔</span> <span>Neutral/No direct impact</span>
        </div>
      </div>
    </div>
  </div>
</template>
