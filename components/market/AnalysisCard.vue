<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

interface Props {
  analysis: string
  scenario: 'Risk-On' | 'Risk-Off' | 'Neutro'
  generatedAt: Date | null
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null
})

const emit = defineEmits<{
  refresh: []
}>()

const isRefreshing = ref(false)
const isExpanded = ref(false)
const contentRef = ref<HTMLElement | null>(null)
const hasOverflow = ref(false)

const checkOverflow = () => {
  if (contentRef.value) {
    hasOverflow.value = contentRef.value.scrollHeight > contentRef.value.clientHeight
  }
}

onMounted(() => {
  checkOverflow()
  window.addEventListener('resize', checkOverflow)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkOverflow)
})

watch(() => props.analysis, () => {
  isExpanded.value = false
  nextTick(() => checkOverflow())
})

const scenarioConfig = computed(() => {
  switch (props.scenario) {
    case 'Risk-On':
      return {
        label: 'Risk-On',
        color: '#4edea3',
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/30',
        icon: '📈'
      }
    case 'Risk-Off':
      return {
        label: 'Risk-Off',
        color: '#ffb2b7',
        bgColor: 'bg-secondary/10',
        borderColor: 'border-secondary/30',
        icon: '📉'
      }
    default:
      return {
        label: 'Neutro',
        color: '#f9bd22',
        bgColor: 'bg-tertiary/10',
        borderColor: 'border-tertiary/30',
        icon: '➡️'
      }
  }
})

const formattedTime = computed(() => {
  if (!props.generatedAt) return ''
  const date = props.generatedAt instanceof Date 
    ? props.generatedAt 
    : new Date(props.generatedAt)
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
})

const handleRefresh = () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  emit('refresh')
  // Reset refreshing state after a delay (parent will update)
  setTimeout(() => {
    isRefreshing.value = false
  }, 2000)
}
</script>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 1.5s infinite;
}

.analysis-content {
  font-size: 0.9rem;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
  overflow-y: auto;
  max-height: 400px;
}

.analysis-content h1,
.analysis-content h2,
.analysis-content h3 {
  color: #4edea3;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.analysis-content h1 {
  font-size: 1.25rem;
}

.analysis-content h2 {
  font-size: 1.1rem;
}

.analysis-content h3 {
  font-size: 1rem;
}

.analysis-content p {
  margin-bottom: 0.75rem;
}

.analysis-content ul,
.analysis-content ol {
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.analysis-content ul {
  list-style: disc;
}

.analysis-content ol {
  list-style: decimal;
}

.analysis-content li {
  margin-bottom: 0.25rem;
}

.analysis-content strong,
.analysis-content b {
  color: #f9bd22;
  font-weight: 600;
}

.analysis-content em,
.analysis-content i {
  color: #ffb2b7;
  font-style: italic;
}

.analysis-content code {
  background: rgba(78, 222, 163, 0.1);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85em;
  color: #4edea3;
}

.analysis-content pre {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 0.75rem;
}

.analysis-content pre code {
  background: transparent;
  padding: 0;
}

.analysis-content a {
  color: #4edea3;
  text-decoration: underline;
}

.analysis-content a:hover {
  color: #6ee7b7;
}

.analysis-content blockquote {
  border-left: 3px solid #4edea3;
  padding-left: 1rem;
  margin-left: 0;
  color: #a0aec0;
  font-style: italic;
}
</style>

<template>
  <div
    class="relative overflow-hidden rounded-xl border transition-all duration-300
           bg-surface-container border-outline/20"
  >
    <!-- Loading State - Creative Indicator -->
    <div v-if="loading" class="p-6 sm:p-8">
      <div class="flex flex-col items-center justify-center py-8">
        <!-- Animated AI Icon -->
        <div class="relative mb-5">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
            <span class="material-symbols-outlined text-3xl text-primary" style="font-variation-settings: 'FILL' 1;">
              auto_awesome
            </span>
          </div>
          <!-- Pulsing ring -->
          <div class="absolute -inset-2 rounded-2xl bg-primary/10 animate-ping" style="animation-duration: 1.5s;" />
        </div>
        
        <!-- Loading Text -->
        <div class="flex items-center gap-2 text-on-surface-variant mb-3">
          <span class="material-symbols-outlined animate-spin text-primary">psychology</span>
          <span class="text-sm italic">Gerando análise com dados macroeconômicos...</span>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-6">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
          <span class="text-xl">⚠️</span>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold text-secondary mb-2">
            Erro na Análise
          </h3>
          <p class="text-sm text-on-surface-variant mb-4">
            {{ error }}
          </p>
          <button
            @click="handleRefresh"
            :disabled="isRefreshing"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                   bg-secondary/20 hover:bg-secondary/30 text-secondary transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
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
            Tentar novamente
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="p-4 sm:p-6">
      <!-- Header -->
      <div class="flex items-start justify-between mb-3 sm:mb-4">
        <div class="flex items-start gap-3">
          <!-- AI Icon -->
          <div
            class="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex-shrink-0"
          >
            <svg class="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>

          <div class="min-w-0">
            <h3 class="text-base sm:text-lg font-semibold text-on-surface flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span class="hidden sm:inline">Análise do Mercado</span>
              <span class="sm:hidden text-sm">Análise</span>
              <span
                class="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium w-fit"
                :class="scenarioConfig.bgColor"
                :style="{ color: scenarioConfig.color }"
              >
                <span>{{ scenarioConfig.icon }}</span>
                <span class="hidden xs:inline">{{ scenarioConfig.label }}</span>
              </span>
            </h3>
            <p class="text-[10px] sm:text-xs text-on-surface-variant mt-0.5 sm:mt-0">
              Gerado por MacroView Pro 1.0 • {{ formattedTime }}
            </p>
          </div>
        </div>

        <!-- Refresh Button -->
        <button
          @click="handleRefresh"
          :disabled="isRefreshing"
          class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg
                 bg-surface-container-high hover:bg-surface-bright/10 border border-outline/20
                 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
          title="Regenerar análise"
        >
          <svg
            :class="['w-3.5 h-3.5 sm:w-4 sm:h-4 text-on-surface-variant', isRefreshing && 'animate-spin']"
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
        </button>
      </div>

      <!-- Analysis Content -->
      <div class="p-3 sm:p-4 rounded-lg bg-surface-lowest/50 border border-outline/10">
        <div 
          ref="contentRef"
          class="analysis-content text-xs sm:text-sm text-on-surface leading-relaxed transition-all duration-300"
          :class="{ 'max-h-[200px] sm:max-h-[400px] overflow-y-auto pr-2': !isExpanded }"
          v-html="analysis"
        />
        <!-- Ver mais button -->
        <button
          v-if="hasOverflow || isExpanded"
          @click="isExpanded = !isExpanded"
          class="mt-2 w-full py-2 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 
                 transition-colors flex items-center justify-center gap-1"
        >
          <span>{{ isExpanded ? 'Ver menos' : 'Ver mais' }}</span>
          <svg 
            class="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300" 
            :class="{ 'rotate-180': isExpanded }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <!-- Footer Info -->
      <div class="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-outline/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <div class="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-on-surface-variant">
          <svg class="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Considere esta análise um complemento às suas confluências individuais.</span>
        </div>
        <div class="flex items-center gap-1 text-[10px] sm:text-xs text-on-surface-variant">
          <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span>Ao vivo</span>
        </div>
      </div>
    </div>

    <!-- Decorative Background Gradient -->
    <div
      class="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none transform translate-x-1/2 -translate-y-1/2"
      :style="{
        background: `radial-gradient(circle, ${scenarioConfig.color} 0%, transparent 70%)`
      }"
    />
  </div>
</template>
