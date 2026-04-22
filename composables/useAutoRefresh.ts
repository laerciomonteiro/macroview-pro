/**
 * Auto Refresh Composable
 * Handles automatic data refresh with visual indicator
 */
import { ref, onMounted, onUnmounted, computed, readonly } from 'vue'
import { useMarketStore } from '~/stores/market'

export interface UseAutoRefreshOptions {
  interval?: number        // Refresh interval in ms (default: 60000)
  enabled?: boolean        // Whether auto-refresh is enabled
  immediate?: boolean      // Fetch immediately on mount
}

export const useAutoRefresh = (options: UseAutoRefreshOptions = {}) => {
  const {
    interval = 60000,
    enabled = true,
    immediate = true
  } = options

  // State
  const isRefreshing = ref(false)
  const lastRefreshTime = ref<Date | null>(null)
  const nextRefreshIn = ref(interval)
  const isEnabled = ref(enabled)

  // Store
  const marketStore = useMarketStore()

  // Computed
  const formattedLastRefresh = computed(() => {
    if (!lastRefreshTime.value) return 'Never'
    return lastRefreshTime.value.toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Sao_Paulo'
    })
  })

  const formattedNextRefresh = computed(() => {
    const seconds = Math.ceil(nextRefreshIn.value / 1000)
    return `${seconds}s`
  })

  // Internal state
  let refreshInterval: ReturnType<typeof setInterval> | null = null
  let countdownInterval: ReturnType<typeof setInterval> | null = null
  let refreshTimeout: ReturnType<typeof setTimeout> | null = null

  // Methods
  const refresh = async (): Promise<void> => {
    if (isRefreshing.value) return

    isRefreshing.value = true
    nextRefreshIn.value = interval

    try {
      await marketStore.fetchMarketOverview()
      lastRefreshTime.value = new Date()
    } catch (error) {
      console.error('[useAutoRefresh] Refresh failed:', error)
    } finally {
      isRefreshing.value = false
    }
  }

  const startAutoRefresh = (): void => {
    if (refreshInterval) return

    // Countdown timer
    countdownInterval = setInterval(() => {
      if (nextRefreshIn.value > 0) {
        nextRefreshIn.value -= 1000
      }
    }, 1000)

    // Refresh timer
    refreshInterval = setInterval(() => {
      refresh()
    }, interval)
  }

  const stopAutoRefresh = (): void => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
    if (countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
    if (refreshTimeout) {
      clearTimeout(refreshTimeout)
      refreshTimeout = null
    }
  }

  const toggleEnabled = (): void => {
    isEnabled.value = !isEnabled.value
    if (isEnabled.value) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  }

  // Lifecycle
  onMounted(() => {
    if (immediate) {
      // Initial fetch with small delay to allow components to mount
      refreshTimeout = setTimeout(() => {
        refresh()
      }, 100)
    }
    
    if (isEnabled.value) {
      startAutoRefresh()
    }
  })

  onUnmounted(() => {
    stopAutoRefresh()
  })

  return {
    // State
    isRefreshing: readonly(isRefreshing),
    lastRefreshTime: readonly(lastRefreshTime),
    nextRefreshIn: readonly(nextRefreshIn),
    isEnabled: readonly(isEnabled),
    
    // Computed
    formattedLastRefresh,
    formattedNextRefresh,
    
    // Methods
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    toggleEnabled,
  }
}
