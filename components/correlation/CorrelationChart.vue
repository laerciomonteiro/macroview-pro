<script setup lang="ts">
import type { ChartDataPoint } from '~/types/correlation'

interface Props {
  type: 'inverse' | 'direct'
  goldData: ChartDataPoint[]
  dxyData: ChartDataPoint[]
  correlationStrength?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  correlationStrength: -0.92
})

// Dynamic correlation strength text with sign
const correlationPercent = computed(() => {
  const value = props.correlationStrength * 100
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(0)}`
})

// Check if correlation is inverse (negative) or direct (positive)
const isInverseCorrelation = computed(() => props.correlationStrength < 0)

// Dynamic insight text based on correlation type
const insightText = computed(() => {
  if (props.type === 'inverse') {
    return 'Correlação inversa: Quando Ouro sobe e DXY cai, sinaliza dólar fraco globalmente. Ativos de risco tendem a ganhar tração no curto prazo.'
  } else {
    return 'Correlação direta: Ouro e DXY tendem a se mover juntos. Força do dólar reflete aversão a risco.'
  }
})

// Generate SVG path from data points
function generatePath(data: ChartDataPoint[], height: number, width: number): string {
  if (!data.length) return ''
  
  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((d.value - min) / range) * height * 0.8 - height * 0.1
    return `${x},${y}`
  })
  
  return `M${points.join(' L')}`
}

// Smooth curve using quadratic bezier
function generateSmoothPath(data: ChartDataPoint[], height: number, width: number): string {
  if (!data.length) return ''
  
  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  
  const points: { x: number; y: number }[] = data.map((d, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((d.value - min) / range) * height * 0.8 - height * 0.1
  }))
  
  let path = `M${points[0].x},${points[0].y}`
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx = (prev.x + curr.x) / 2
    path += ` Q${prev.x + (curr.x - prev.x) * 0.5},${prev.y} ${cpx},${(prev.y + curr.y) / 2}`
  }
  
  path += ` L${points[points.length - 1].x},${points[points.length - 1].y}`
  
  return path
}

const chartWidth = 800
const chartHeight = 200

const goldPath = computed(() => generateSmoothPath(props.goldData, chartHeight, chartWidth))
const dxyPath = computed(() => generateSmoothPath(props.dxyData, chartHeight, chartWidth))

// Scale DXY to be visible on same chart (invert and scale)
const scaledDxyPath = computed(() => {
  if (!props.dxyData.length) return ''
  
  const goldValues = props.goldData.map(d => d.value)
  const dxyValues = props.dxyData.map(d => d.value)
  
  const goldMin = Math.min(...goldValues)
  const goldMax = Math.max(...goldValues)
  const dxyMin = Math.min(...dxyValues)
  const dxyMax = Math.max(...dxyValues)
  
  const height = chartHeight
  const width = chartWidth
  
  const points: { x: number; y: number }[] = props.dxyData.map((d, i) => {
    const x = (i / (props.dxyData.length - 1)) * width
    // Invert DXY so it shows opposite movement (true inverse correlation)
    const normalizedDxy = 1 - ((d.value - dxyMin) / (dxyMax - dxyMin || 1))
    const y = normalizedDxy * height * 0.8 + height * 0.1
    return { x, y }
  })
  
  let path = `M${points[0].x},${points[0].y}`
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    path += ` Q${prev.x + (curr.x - prev.x) * 0.5},${prev.y} ${(prev.x + curr.x) / 2},${(prev.y + curr.y) / 2}`
  }
  
  path += ` L${points[points.length - 1].x},${points[points.length - 1].y}`
  
  return path
})

// Format dates for X-axis labels (DD/MM)
const dateLabels = computed(() => {
  if (!props.goldData.length) return []
  
  // Show every 5th label to avoid crowding
  return props.goldData.map((d, i) => {
    if (typeof d.time === 'string' && d.time.includes('-')) {
      const parts = d.time.split('-')
      const day = parts[2] || parts[0]
      const month = parts[1]
      // Show label every 5 points
      if (i % 5 === 0 || i === props.goldData.length - 1) {
        return { x: (i / (props.goldData.length - 1)) * chartWidth, label: `${day}/${month}` }
      }
    }
    return null
  }).filter(Boolean)
})
</script>

<template>
  <div class="bg-surface-container-low p-6 rounded-xl relative overflow-hidden">
    <!-- Header -->
    <div class="flex justify-between items-start mb-6">
      <div>
        <h2 class="text-xs font-bold text-outline uppercase tracking-widest mb-1">
          {{ type === 'inverse' ? 'Análise de Correlação Inversa' : 'Análise de Correlação Direta' }}
        </h2>
        <h3 class="text-xl font-black font-mono text-on-surface">
          OURO (XAU) vs DXY (Índice)
        </h3>
      </div>
      <div class="flex items-center gap-3">
        <span 
          class="px-3 py-1 rounded-full text-[10px] font-bold border"
          :class="isInverseCorrelation 
            ? 'bg-secondary/10 text-secondary border-secondary/20' 
            : 'bg-primary/10 text-primary border-primary/20'"
        >
          {{ correlationPercent }}% Correlação
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="h-56 flex items-center justify-center">
      <div class="w-full h-32 rounded bg-surface-bright/20 animate-pulse" />
    </div>

    <!-- Chart -->
    <div v-else class="relative h-56">
      <!-- Grid Lines -->
      <div class="absolute inset-0 flex flex-col justify-between opacity-10">
        <div class="h-[1px] w-full bg-outline" />
        <div class="h-[1px] w-full bg-outline" />
        <div class="h-[1px] w-full bg-outline" />
        <div class="h-[1px] w-full bg-outline" />
      </div>

      <!-- SVG Chart -->
      <svg 
        class="absolute inset-0 w-full h-full" 
        preserveaspectratio="none"
        viewBox="0 0 800 200"
      >
        <!-- Gold Line (Yellow) -->
        <path
          :d="goldPath"
          fill="none"
          stroke="#f9bd22"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="drop-shadow-[0_0_8px_rgba(249,189,34,0.5)]"
        />
        
        <!-- DXY Line (Green/Inverted) -->
        <path
          :d="scaledDxyPath"
          fill="none"
          stroke="#4edea3"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="drop-shadow-[0_0_8px_rgba(78,222,163,0.5)]"
        />
        
        <!-- X-Axis Date Labels -->
        <g class="date-labels">
          <text
            v-for="(label, idx) in dateLabels"
            :key="idx"
            :x="label.x"
            y="195"
            text-anchor="middle"
            class="fill-on-surface-variant text-[9px] font-mono"
          >
            {{ label.label }}
          </text>
        </g>
      </svg>

      <!-- Legend -->
      <div class="absolute bottom-4 left-4 flex gap-6">
        <div class="flex items-center gap-2">
          <div class="w-8 h-0.5 bg-[#f9bd22] rounded" />
          <span class="font-mono text-[11px] text-tertiary font-medium">OURO (Ouro)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-0.5 bg-[#4edea3] rounded" />
          <span class="font-mono text-[11px] text-primary font-medium">DXY (Dólar Americano)</span>
        </div>
      </div>

      <!-- Inverse/Direct Indicator (Dynamic) -->
      <div class="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high/80 backdrop-blur-sm border border-outline/20">
        <span 
          class="material-symbols-outlined text-xs" 
          :class="isInverseCorrelation ? 'text-secondary' : 'text-primary'"
        >
          {{ isInverseCorrelation ? 'sync_alt' : 'trending_up' }}
        </span>
        <span 
          class="text-[10px] font-bold uppercase tracking-wider"
          :class="isInverseCorrelation ? 'text-secondary' : 'text-primary'"
        >
          {{ isInverseCorrelation ? 'INVERSA' : 'DIRETA' }}
        </span>
      </div>
    </div>

    <!-- Insight Text -->
    <div class="mt-4 p-3 rounded-lg bg-surface-container border-l-4 border-primary">
      <p class="text-xs text-on-surface-variant leading-relaxed">
        <span class="text-primary font-semibold">Correlação Ouro vs Dólar:</span>
        {{ insightText }}
      </p>
    </div>
  </div>
</template>
