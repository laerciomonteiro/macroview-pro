<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  lastUpdate: Date | null
  isRefreshing?: boolean
  refreshInterval?: number // in seconds
}

const props = withDefaults(defineProps<Props>(), {
  isRefreshing: false,
  refreshInterval: 60,
})

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null

const formattedUtcTime = computed(() => {
  return now.value.toLocaleTimeString('pt-BR', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }) + ' UTC'
})

const secondsAgo = computed(() => {
  if (!props.lastUpdate) return null
  const diffMs = now.value.getTime() - props.lastUpdate.getTime()
  return Math.floor(diffMs / 1000)
})

const formattedLastUpdate = computed(() => {
  if (secondsAgo.value === null) return 'Nunca'
  if (secondsAgo.value < 5) return 'agora mesmo'
  if (secondsAgo.value < 60) return `${secondsAgo.value} segundos atrás`
  
  const minutes = Math.floor(secondsAgo.value / 60)
  if (minutes === 1) return '1 minuto atrás'
  if (minutes < 60) return `${minutes} minutos atrás`
  
  const hours = Math.floor(minutes / 60)
  if (hours === 1) return '1 hora atrás'
  return `${hours} horas atrás`
})

const countdownSeconds = computed(() => {
  if (!props.lastUpdate) return props.refreshInterval
  const elapsed = secondsAgo.value || 0
  return Math.max(0, props.refreshInterval - elapsed)
})

const countdownProgress = computed(() => {
  return ((props.refreshInterval - countdownSeconds.value) / props.refreshInterval) * 100
})

const isDataFresh = computed(() => {
  return secondsAgo.value !== null && secondsAgo.value < 10
})

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<template>
  <div class="flex items-center gap-4">
    <!-- UTC Time Display -->
    <div class="flex items-center gap-2">
      <svg
        class="w-4 h-4 text-on-surface-variant"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span class="text-sm font-mono text-on-surface">
        {{ formattedUtcTime }}
      </span>
    </div>

    <!-- Separator -->
    <div class="w-px h-4 bg-outline/30" />

    <!-- Last Update -->
    <div class="flex items-center gap-2">
      <!-- Fresh Indicator -->
      <span
        :class="[
          'w-2 h-2 rounded-full transition-colors',
          isDataFresh ? 'bg-primary animate-pulse' : 'bg-on-surface-variant/40'
        ]"
      />

      <span class="text-sm text-on-surface-variant">
        {{ formattedLastUpdate }}
      </span>
    </div>

    <!-- Countdown Progress (optional) -->
    <div class="hidden sm:flex items-center gap-2">
      <!-- Separator -->
      <div class="w-px h-4 bg-outline/30" />

      <!-- Progress Bar -->
      <div class="w-20 h-1.5 bg-surface-bright/20 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-1000 ease-linear"
          :class="[
            isRefreshing ? 'bg-tertiary' : 'bg-primary'
          ]"
          :style="{
            width: `${countdownProgress}%`
          }"
        />
      </div>

      <!-- Countdown Text -->
      <span class="text-xs font-mono text-on-surface-variant">
        {{ countdownSeconds }}s
      </span>
    </div>

    <!-- Refreshing Indicator -->
    <div v-if="isRefreshing" class="flex items-center gap-1">
      <svg
        class="w-4 h-4 text-tertiary animate-spin"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  </div>
</template>
