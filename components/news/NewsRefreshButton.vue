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
 * - Provides feedback when no new news or on error
 */

import { ref, onMounted } from 'vue'
import { useNewsCache } from '~/composables/useNewsCache'
import { useNewsScheduler } from '~/composables/useNewsScheduler'
import { useNewsAnalysisSync } from '~/composables/useNewsAnalysisSync'
import type { NewsApiResponse } from '~/types/news'

const isRefreshing = ref(false)
const lastUpdated = ref<Date | null>(null)
const refreshMessage = ref<string | null>(null)
const refreshMessageType = ref<'success' | 'info' | 'error'>('success')
const newsCache = useNewsCache()
const { isWithinMarketHours } = useNewsScheduler()
const newsSync = useNewsAnalysisSync()

/**
 * Clear refresh message after delay
 */
let messageTimeout: ReturnType<typeof setTimeout> | null = null
const clearMessage = () => {
  if (messageTimeout) clearTimeout(messageTimeout)
  messageTimeout = setTimeout(() => {
    refreshMessage.value = null
    messageTimeout = null
  }, 5000)
}

/**
 * Show feedback message to user
 */
const showMessage = (message: string, type: 'success' | 'info' | 'error') => {
  refreshMessage.value = message
  refreshMessageType.value = type
  clearMessage()
}

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
  refreshMessage.value = null
  
  try {
    const response = await $fetch<NewsApiResponse>('/api/news/latest?refresh=true', { method: 'POST' })
    lastUpdated.value = new Date()

    // Check if news actually changed before triggering AI refresh
    if (response.success && response.data?.articles) {
      const hasChanged = newsSync.onNewsRefreshed(response.data.articles)
      
      if (hasChanged) {
        showMessage('Notícias atualizadas! Análise AI sendo regenerada...', 'success')
      } else {
        showMessage('Nenhuma notícia nova encontrada.', 'info')
      }
    } else {
      // Fallback: trigger refresh anyway (backward compatibility)
      newsSync.triggerAnalysisRefresh()
      showMessage('Notícias atualizadas!', 'success')
    }
  } catch (error) {
    console.error('[NewsRefreshButton] Error:', error)
    showMessage('Erro ao atualizar notícias', 'error')
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
  <div class="flex items-center gap-2">
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
        {{ isRefreshing ? 'Atualizando...' : (isWithinMarketHours() ? 'Atualizar notícias' : 'Fora do horário') }}
      </span>
      
      <span v-if="lastUpdated && !isRefreshing && isWithinMarketHours()" class="text-xs text-[#f9bd22]">
        {{ formatRelativeTime(lastUpdated) }}
      </span>
    </button>

    <!-- Feedback message -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-x-2"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-2"
    >
      <span
        v-if="refreshMessage"
        :class="[
          'text-sm px-3 py-1 rounded-md',
          refreshMessageType === 'success' && 'text-[#4edea3] bg-[#4edea3]/10',
          refreshMessageType === 'info' && 'text-[#f9bd22] bg-[#f9bd22]/10',
          refreshMessageType === 'error' && 'text-[#ffb2b7] bg-[#ffb2b7]/10'
        ]"
      >
        {{ refreshMessage }}
      </span>
    </Transition>
  </div>
</template>
