<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { createChart, type IChartApi, type ISeriesApi, type LineStyle } from 'lightweight-charts'

interface Props {
  data: number[]
  color?: string
  height?: number
  lineWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: '#4edea3',
  height: 48,
  lineWidth: 2,
})

const chartContainer = ref<HTMLDivElement | null>(null)
let chart: IChartApi | null = null
let lineSeries: ISeriesApi<'Line'> | null = null

const initChart = () => {
  if (!chartContainer.value || !props.data || props.data.length === 0) return

  // Create chart with minimal configuration
  chart = createChart(chartContainer.value, {
    width: chartContainer.value.clientWidth,
    height: props.height,
    layout: {
      background: { color: 'transparent' },
      textColor: 'transparent',
      fontSize: 0,
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { visible: false },
    },
    rightPriceScale: {
      visible: false,
      borderVisible: false,
    },
    timeScale: {
      visible: false,
      borderVisible: false,
      timeVisible: false,
    },
    leftPriceScale: {
      visible: false,
      borderVisible: false,
    },
    crosshair: {
      mode: 0,
      vertLine: {
        visible: false,
        labelVisible: false,
        style: LineStyle.Dashed,
        width: 0,
        color: 'transparent',
      },
      horzLine: {
        visible: false,
        labelVisible: false,
        style: LineStyle.Dashed,
        width: 0,
        color: 'transparent',
      },
    },
    handleScroll: false,
    handleScale: false,
  })

  // Create line series
  lineSeries = chart.addLineSeries({
    color: props.color,
    lineWidth: props.lineWidth,
    lineStyle: LineStyle.Solid,
    crosshairMarkerVisible: false,
    priceLineVisible: false,
    lastValueVisible: false,
    priceLineStyle: LineStyle.Dashed,
    topColor: `${props.color}40`,
    bottomColor: `${props.color}00`,
  })

  // Set data
  const chartData = props.data.map((value, index) => ({
    time: index as number,
    value,
  }))

  lineSeries.setData(chartData)

  // Fit content
  chart.timeScale().fitContent()
}

const updateChart = () => {
  if (!lineSeries || !props.data || props.data.length === 0) return

  const chartData = props.data.map((value, index) => ({
    time: index as number,
    value,
  }))

  lineSeries.setData(chartData)
}

const handleResize = () => {
  if (chart && chartContainer.value) {
    chart.applyOptions({ width: chartContainer.value.clientWidth })
  }
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.remove()
    chart = null
  }
})

watch(() => props.data, () => {
  updateChart()
}, { deep: true })

watch(() => props.color, () => {
  if (lineSeries) {
    lineSeries.applyOptions({
      color: props.color,
      topColor: `${props.color}40`,
      bottomColor: `${props.color}00`,
    })
  }
})
</script>

<template>
  <div ref="chartContainer" class="w-full" :style="{ height: `${height}px` }" />
</template>
