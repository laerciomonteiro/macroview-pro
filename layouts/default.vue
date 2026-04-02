<template>
  <div class="flex h-screen overflow-hidden bg-background">
    <!-- SideNavBar -->
    <aside class="fixed left-0 top-0 z-40 flex flex-col h-screen w-64 bg-background border-r border-outline-variant/15">
      <!-- Logo & Brand -->
      <div class="p-6">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded bg-primary-container flex items-center justify-center">
            <span class="material-symbols-outlined text-on-primary-container" style="font-variation-settings: 'FILL' 1;">terminal</span>
          </div>
          <div>
            <h1 class="text-lg font-bold text-primary">MacroView</h1>
            <p class="text-[10px] uppercase tracking-widest text-outline">Análise de Mercado</p>
          </div>
        </div>
      </div>

      <!-- Main Navigation -->
      <nav class="flex-1 px-4 space-y-1">
        <NuxtLink 
          to="/dashboard" 
          class="nav-item-active flex items-center gap-3 px-4 py-3 transition-colors"
          :class="{ 'text-primary': isActiveRoute('/dashboard'), 'text-on-surface-variant': !isActiveRoute('/dashboard') }"
        >
          <span class="material-symbols-outlined">dashboard</span>
          <span class="text-sm font-medium">Painel</span>
        </NuxtLink>

        <NuxtLink 
          to="/agenda" 
          class="nav-item flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors"
          :class="{ 'text-primary': isActiveRoute('/agenda'), 'text-on-surface-variant': !isActiveRoute('/agenda') }"
        >
          <span class="material-symbols-outlined">calendar_today</span>
          <span class="text-sm font-medium">Calendário Econômico</span>
        </NuxtLink>

        <NuxtLink 
          to="/correlacoes" 
          class="nav-item flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors"
          :class="{ 'text-primary': isActiveRoute('/correlacoes'), 'text-on-surface-variant': !isActiveRoute('/correlacoes') }"
        >
          <span class="material-symbols-outlined">grid_view</span>
          <span class="text-sm font-medium">Matriz de Correlação</span>
        </NuxtLink>
      </nav>

      <!-- Current Scenario Card -->
      <div class="p-4 mb-4 mx-4 bg-surface-container-high rounded-xl">
        <p class="text-[10px] text-outline mb-1 uppercase font-bold tracking-tighter">Current Scenario</p>
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-primary">{{ currentScenario }}</span>
          <span class="material-symbols-outlined text-primary text-sm" style="font-variation-settings: 'FILL' 1;">bolt</span>
        </div>
      </div>

      <!-- Bottom Links -->
      <div class="p-4 border-t border-outline-variant/15 space-y-1">
        <a class="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container transition-colors text-sm" href="#">
          <span class="material-symbols-outlined">help</span>
          Support
        </a>
        <a class="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container transition-colors text-sm" href="#">
          <span class="material-symbols-outlined">logout</span>
          Sign Out
        </a>
      </div>
    </aside>

    <!-- Main Content Wrapper -->
    <main class="ml-64 flex flex-col h-screen overflow-hidden flex-1">
      <!-- TopNavBar -->
      <header class="flex justify-between items-center px-6 py-3 w-full z-50 bg-background sticky top-0 border-b border-outline-variant/10">
        <!-- Left: Market Status & Time -->
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2 text-primary font-mono text-xs">
            <span class="status-dot">
              <span class="status-dot-ping"></span>
              <span class="status-dot-solid"></span>
            </span>
            Market Status: Open
          </div>
          <div class="text-outline font-mono text-xs">{{ currentUtcTime }}</div>
        </div>

        <!-- Right: Settings & User -->
        <div class="flex items-center gap-4">
          <div class="h-8 w-px bg-outline-variant/30"></div>
          
          <!-- Refresh Indicator -->
          <div v-if="isRefreshing" class="flex items-center gap-2 text-xs text-primary">
            <span class="material-symbols-outlined animate-spin text-sm">refresh</span>
            <span>Updating...</span>
          </div>      
        </div>
      </header>

      <!-- Content Canvas -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        <slot />
      </div>

      <!-- BottomNavBar (Tickers Marquee) -->
      <footer class="fixed bottom-0 w-full z-50 flex justify-between items-center px-4 h-10 overflow-hidden bg-background/80 backdrop-blur-xl border-t border-outline-variant/15" style="left: 16rem; width: calc(100% - 16rem);">
        <div class="flex items-center gap-12 w-full animate-marquee whitespace-nowrap">
          <TickerItem 
            v-for="(ticker, index) in tickers" 
            :key="index"
            :symbol="ticker.symbol"
            :price="ticker.price"
            :change-type="ticker.changeType"
          />
          <!-- Duplicate for seamless loop -->
          <TickerItem 
            v-for="(ticker, index) in tickers" 
            :key="'dup-' + index"
            :symbol="ticker.symbol"
            :price="ticker.price"
            :change-type="ticker.changeType"
          />
        </div>
        <div class="absolute right-0 bg-background pl-4 flex items-center h-full pr-4 border-l border-outline-variant/20">
          <span class="text-[9px] font-bold text-outline uppercase tracking-tighter mr-2">Core API</span>
          <div class="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(78,222,163,0.5)]"></div>
        </div>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, h, defineComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useMarketStore } from '~/stores/market'

// Components
interface TickerItemProps {
  symbol: string
  price: number
  changeType: 'up' | 'down' | 'stable'
}

const TickerItem = defineComponent({
  props: {
    symbol: { type: String, required: true },
    price: { type: Number, required: true },
    changeType: { type: String as () => 'up' | 'down' | 'stable', required: true }
  },
  setup(props) {
    const icon = computed(() => {
      if (props.changeType === 'up') return 'trending_up'
      if (props.changeType === 'down') return 'trending_down'
      return 'horizontal_rule'
    })
    
    const colorClass = computed(() => {
      if (props.changeType === 'up') return 'text-primary'
      if (props.changeType === 'down') return 'text-secondary'
      return 'text-outline'
    })
    
    return { icon, colorClass }
  },
  render() {
    return h('div', { class: 'flex items-center gap-2 group cursor-pointer hover:text-white transition-colors' }, [
      h('span', { class: `text-[10px] font-bold font-mono ${this.colorClass}` }, `${this.symbol} ${this.price.toFixed(2)}`),
      h('span', { class: `material-symbols-outlined text-sm ${this.colorClass}` }, this.icon)
    ])
  }
})

// Store
const marketStore = useMarketStore()

// Route
const route = useRoute()

// State
const currentUtcTime = ref('')
const isRefreshing = ref(false)

// Computed
const currentScenario = computed(() => marketStore.scenario?.scenario || 'Loading...')

const tickers = computed(() => {
  const currencies = marketStore.marketData?.currencies || []
  return [
    { symbol: 'USD/BRL', price: 5.2423, changeType: 'up' as const },
    { symbol: 'WIN', price: 128400, changeType: 'down' as const },
    { symbol: 'DXY', price: 104.2, changeType: 'stable' as const },
    { symbol: 'SPX', price: 5230, changeType: 'up' as const },
    { symbol: 'BTC', price: 68200, changeType: 'up' as const },
  ]
})

// Methods
const isActiveRoute = (path: string): boolean => {
  return route.path === path
}

const updateTime = (): void => {
  const now = new Date()
  currentUtcTime.value = now.toISOString().split('T')[1].split('.')[0] + ' UTC'
}

let timeInterval: ReturnType<typeof setInterval>

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  
  // Subscribe to refresh state
  marketStore.$subscribe(() => {
    isRefreshing.value = marketStore.isLoading
  })
})

onUnmounted(() => {
  clearInterval(timeInterval)
})
</script>

<style>
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
</style>
