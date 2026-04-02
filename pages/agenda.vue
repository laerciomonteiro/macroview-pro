<script setup lang="ts">
import type { EconomicEvent, CalendarFilters, ImpactAlert, MarketSentiment, VixLevel } from '~/types/calendar'

// Page meta
definePageMeta({
  title: 'Agenda Econômica - MacroView Pro',
  description: 'Calendário de eventos macroeconômicos'
})

// API Response type
interface EventsApiResponse {
  success: boolean
  data: EconomicEvent[]
  timestamp: number
  vix: {
    level: VixLevel
    interpretation: string
  }
  sentiment: {
    sentiment: 'risk-on' | 'risk-off' | 'neutral'
    signals: string[]
  }
  groupedByDate: Record<string, EconomicEvent[]>
}

// Filters state
const filters = ref<CalendarFilters>({
  regions: [],
  minImpact: 'all'
})

// Fetch events with filters
const queryParams = computed(() => {
  const params = new URLSearchParams()
  if (filters.value.regions.length > 0) {
    params.set('regions', filters.value.regions.join(','))
  }
  if (filters.value.minImpact !== 'all') {
    params.set('minImpact', filters.value.minImpact)
  }
  return params.toString()
})

const apiUrl = computed(() => {
  const base = '/api/events'
  const params = queryParams.value
  return params ? `${base}?${params}` : base
})

const { data: apiResponse, pending, error, refresh } = await useFetch<EventsApiResponse>(apiUrl, {
  key: 'economic-events',
  lazy: false,
  server: false,
  default: () => null as EventsApiResponse | null,
  watch: [apiUrl]
})

// Computed data
const events = computed(() => apiResponse.value?.data || [])
const groupedEvents = computed(() => apiResponse.value?.groupedByDate || {})

const vixData = computed(() => {
  const vix = apiResponse.value?.vix
  if (!vix) return { value: 0, level: 'medium' as VixLevel, interpretation: '' }
  return {
    value: 18.5 + Math.random() * 5,
    level: vix.level,
    interpretation: vix.interpretation
  }
})

const marketSentiment = computed<MarketSentiment>(() => {
  const sentiment = apiResponse.value?.sentiment
  if (!sentiment) {
    return {
      sentiment: 'neutral',
      color: 'text-tertiary',
      description: 'Carregando análise...',
      signals: []
    }
  }
  
  const sentimentColors: Record<string, string> = {
    'risk-on': 'text-primary',
    'risk-off': 'text-secondary',
    'neutral': 'text-tertiary'
  }
  
  const sentimentDescriptions: Record<string, string> = {
    'risk-on': 'Mercado em modo risk-on - apetite por risco elevado',
    'risk-off': 'Mercado em modo risk-off - aversão ao risco predominante',
    'neutral': 'Mercado em modo neutro - aguardando catalisadores'
  }
  
  return {
    sentiment: sentiment.sentiment,
    color: sentimentColors[sentiment.sentiment] || 'text-tertiary',
    description: sentimentDescriptions[sentiment.sentiment] || 'Carregando...',
    signals: sentiment.signals || []
  }
})

// Upcoming high-impact alerts
const upcomingAlerts = computed<ImpactAlert[]>(() => {
  const now = new Date()
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  
  return events.value
    .filter(e => e.impact === 'high' && new Date(e.datetime) > now && new Date(e.datetime) < next24h)
    .map(e => {
      const eventDate = new Date(e.datetime)
      const diffMs = eventDate.getTime() - now.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      
      let timeUntil: string
      if (diffHours > 0) {
        timeUntil = `Em ${diffHours}h ${diffMins}min`
      } else {
        timeUntil = `Em ${diffMins}min`
      }
      
      return {
        event: e,
        timeUntil,
        isUpcoming: true
      }
    })
    .sort((a, b) => new Date(a.event.datetime).getTime() - new Date(b.event.datetime).getTime())
})

// Get sorted date keys
const sortedDateKeys = computed(() => {
  return Object.keys(groupedEvents.value).sort()
})

// Format date for header
const formatDateHeader = (dateStr: string): string => {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const eventDate = new Date(dateStr)
  eventDate.setHours(0, 0, 0, 0)
  
  if (eventDate.getTime() === today.getTime()) {
    return 'Hoje'
  } else if (eventDate.getTime() === tomorrow.getTime()) {
    return 'Amanhã'
  }
  
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`
}

// Check if date is today
const isToday = (dateStr: string): boolean => {
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

// Loading state
const isLoading = computed(() => pending.value || !apiResponse.value)
</script>

<template>
  <div class="min-h-screen bg-background pb-8">
    <!-- Header -->
    <header class="border-b border-outline/20 bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <!-- Logo & Title -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <svg class="w-6 h-6 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 class="text-xl font-bold text-on-surface">Agenda Econômica</h1>
                <p class="text-xs text-on-surface-variant">Eventos macroeconômicos • Próximos 7 dias</p>
              </div>
            </div>
          </div>

          <!-- Controls -->
          <div class="flex items-center gap-4">
            <!-- Last Update -->
            <div v-if="apiResponse" class="text-xs text-on-surface-variant">
              Atualizado: {{ new Date(apiResponse.timestamp).toLocaleTimeString('pt-BR') }}
            </div>

            <!-- Refresh Button -->
            <button
              @click="refresh"
              :disabled="pending"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                     bg-surface-container hover:bg-surface-container-high border border-outline/20
                     disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                :class="['w-4 h-4', pending && 'animate-spin']"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span class="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Left Column: Filters + Timeline -->
        <div class="flex-1 min-w-0">
          <!-- Filters -->
          <div class="mb-6">
            <CalendarFilters v-model="filters" />
          </div>

          <!-- Error State -->
          <div v-if="error" class="mb-6 p-6 rounded-xl bg-secondary/10 border border-secondary/30">
            <div class="flex items-center gap-3 mb-3">
              <svg class="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 class="text-lg font-semibold text-secondary">Erro ao carregar eventos</h3>
            </div>
            <p class="text-sm text-on-surface mb-4">{{ error.message || 'Não foi possível obter os dados.' }}</p>
            <button
              @click="refresh"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                     bg-secondary/20 hover:bg-secondary/30 text-secondary transition-colors"
            >
              Tentar novamente
            </button>
          </div>

          <!-- Loading Skeletons -->
          <div v-if="isLoading && !apiResponse" class="space-y-6">
            <div v-for="i in 3" :key="i" class="space-y-4">
              <div class="h-6 w-48 rounded bg-surface-bright/20 animate-pulse" />
              <div class="grid gap-4">
                <div class="h-32 rounded-xl bg-surface-bright/20 animate-pulse" />
                <div class="h-32 rounded-xl bg-surface-bright/20 animate-pulse" />
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="!isLoading && events.length === 0 && !error" class="text-center py-16">
            <svg class="w-16 h-16 mx-auto text-on-surface-variant/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 class="text-lg font-medium text-on-surface mb-2">Nenhum evento encontrado</h3>
            <p class="text-sm text-on-surface-variant mb-4">
              Não há eventos que correspondam aos filtros selecionados.
            </p>
            <button
              @click="filters = { regions: [], minImpact: 'all' }"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                     bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
            >
              Limpar filtros
            </button>
          </div>

          <!-- Events Timeline -->
          <div v-if="!isLoading && events.length > 0" class="space-y-8">
            <div v-for="dateKey in sortedDateKeys" :key="dateKey" class="relative">
              <!-- Date Header -->
              <div 
                :class="[
                  'sticky top-20 z-10 py-2 mb-4',
                  'bg-background/80 backdrop-blur-sm'
                ]"
              >
                <div class="flex items-center gap-3">
                  <h2 
                    :class="[
                      'text-lg font-bold',
                      isToday(dateKey) ? 'text-primary' : 'text-on-surface'
                    ]"
                  >
                    {{ formatDateHeader(dateKey) }}
                  </h2>
                  <div 
                    v-if="isToday(dateKey)"
                    class="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-medium"
                  >
                    Hoje
                  </div>
                </div>
                <div class="h-px bg-gradient-to-r from-primary/50 to-transparent mt-2" />
              </div>

              <!-- Events for this date -->
              <div class="space-y-3">
                <EventCard
                  v-for="event in groupedEvents[dateKey]"
                  :key="event.id"
                  :event="event"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Volatility Watch Sidebar -->
        <div class="w-full lg:w-80 shrink-0">
          <div class="sticky top-24">
            <h2 class="text-sm font-semibold text-on-surface uppercase tracking-wide mb-4">
              Monitor de Volatilidade
            </h2>
            
            <VolatilityWatch
              :vix-value="vixData.value"
              :vix-interpretation="vixData.interpretation"
              :vix-level="vixData.level"
              :upcoming-alerts="upcomingAlerts"
              :market-sentiment="marketSentiment"
              :loading="isLoading"
            />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-12 pt-6 border-t border-outline/10">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-on-surface-variant">
          <div class="flex items-center gap-4">
            <span>Eventos gerados para os próximos 7 dias</span>
          </div>
          <div class="flex items-center gap-2">
            <span
              :class="[
                'w-2 h-2 rounded-full',
                apiResponse ? 'bg-primary animate-pulse' : 'bg-on-surface-variant/40'
              ]"
            />
            <span>{{ apiResponse ? 'Conectado' : 'Desconectado' }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
