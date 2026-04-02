<script setup lang="ts">
import type { Component } from 'vue'

interface MarketCardData {
  title: string
  value: string | number
  variation: number
  variationPercent?: number
  unit?: string
  icon?: string
  trend: 'up' | 'down' | 'neutral'
  sparklineData?: number[]
  vixLevel?: 'low' | 'medium' | 'high'
}

interface Props {
  cards: MarketCardData[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// Generate skeleton cards for loading state
const skeletonCards = Array.from({ length: 8 }, (_, i) => i)
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Loading Skeletons -->
    <template v-if="loading">
      <div
        v-for="i in skeletonCards"
        :key="`skeleton-${i}`"
        class="h-48 rounded-xl bg-surface-container border border-outline/20 animate-pulse"
      >
        <div class="p-5 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-surface-bright/20" />
            <div class="w-24 h-4 rounded bg-surface-bright/20" />
          </div>
          <div class="w-32 h-8 rounded bg-surface-bright/20" />
          <div class="flex gap-2">
            <div class="w-20 h-5 rounded bg-surface-bright/20" />
            <div class="w-16 h-5 rounded bg-surface-bright/20" />
          </div>
        </div>
      </div>
    </template>

    <!-- Actual Cards -->
    <template v-else>
      <MarketCard
        v-for="(card, index) in cards"
        :key="`card-${index}`"
        :title="card.title"
        :value="card.value"
        :variation="card.variation"
        :variation-percent="card.variationPercent"
        :unit="card.unit"
        :icon="card.icon"
        :trend="card.trend"
        :sparkline-data="card.sparklineData"
        :vix-level="card.vixLevel"
      />
    </template>
  </div>
</template>
