<script setup lang="ts">
/**
 * NewsRefreshButton Component
 * Manual refresh button for news with market hours awareness
 * 
 * Features:
 * - Shows loading state while refreshing
 * - Shows last update time
 * - Only enabled during market hours (7:00-12:00 BRT)
 * - Shows "Fora do horário de mercado" outside market hours
 */

import { ref, onMounted } from 'vue'
import { useNewsCache } from '~/composables/useNewsCache'
import { useNewsScheduler } from '~/composables/useNewsScheduler'
import { useNewsAnalysisSync } from '~/composables/useNewsAnalysisSync'
import type { NewsApiResponse } from '~/types/news'

const isRefreshing = ref(false)
const lastUpdated = ref<Date | null>(null)
const newsCache = useNewsCache()
const { isWithinMarketHours } = useNewsScheduler()
const newsSync = useNewsAnalysisSync()

/**
 * Format date to relative time string
 */
const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'agora'
  if (diffMins < 60) return `${diffMins}min`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  
  return date.toLocaleDateString('pt-BR')
}

/**
 * Handle manual refresh
 */
const handleRefresh = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  try {
    const response = await $fetch<NewsApiResponse>('/api/news/latest?refresh=true', { method: 'POST' })
    lastUpdated.value = new Date()

    // Check if news actually changed before triggering AI refresh
    if (response.success && response.data?.articles) {
      newsSync.onNewsRefreshed(response.data.articles)
    } else {
      // Fallback: trigger refresh anyway (backward compatibility)
      newsSync.triggerAnalysisRefresh()
    }
  } catch (error) {
    console.error('[NewsRefreshButton] Error:', error)
  } finally {
    isRefreshing.value = false
  }
}

// Load cached timestamp on mount
onMounted(() => {
  const cached = newsCache.getCached()
  if (cached?.data?.lastUpdated) {
    lastUpdated.value = new Date(cached.data.lastUpdated)
  }
})
</script>

<template>
  <button
    @click="handleRefresh"
    :disabled="isRefreshing || !isWithinMarketHours()"
    :title="isWithinMarketHours() ? 'Atualizar notícias' : 'Fora do horário de mercado (7:00-12:00)'"
    class="flex items-center gap-2 px-4 py-2 bg-[#151c2c] border border-[#1e2736] rounded-lg hover:bg-[#1e2736] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <svg
      :class="['w-4 h-4', isRefreshing && 'animate-spin']"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
    
    <span class="text-sm text-white">
      {{ isRefreshing ? 'Atualizando...' : (isWithinMarketHours() ? 'Atualizar Notícias' : 'Fora do horário') }}
    </span>
    
    <span v-if="lastUpdated && !isRefreshing && isWithinMarketHours()" class="text-xs text-[#f9bd22]">
      {{ formatRelativeTime(lastUpdated) }}
    </span>
  </button>
</template>
