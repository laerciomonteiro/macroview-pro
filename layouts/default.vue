<template>
  <div class="flex h-screen overflow-hidden bg-background">
    <!-- Mobile Overlay -->
    <div 
      v-if="isSidebarOpen"
      class="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden"
      @click="toggleSidebar"
    />

    <!-- SideNavBar -->
    <aside 
      :class="[
        'fixed left-0 top-0 z-40 flex flex-col h-screen w-64 bg-background border-r border-outline-variant/15',
        'transform transition-transform duration-300 ease-in-out',
        'lg:translate-x-0',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
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
          @click="closeSidebarOnMobile"
        >
          <span class="material-symbols-outlined">dashboard</span>
          <span class="text-sm font-medium">Painel</span>
        </NuxtLink>

        <!-- [DESABILITADO] Calendário Econômico - habilitado novamente quando API estiver disponível
        <NuxtLink 
          to="/agenda" 
          class="nav-item flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors"
          :class="{ 'text-primary': isActiveRoute('/agenda'), 'text-on-surface-variant': !isActiveRoute('/agenda') }"
          @click="closeSidebarOnMobile"
        >
          <span class="material-symbols-outlined">calendar_today</span>
          <span class="text-sm font-medium">Calendário Econômico</span>
        </NuxtLink>
        -->

        <NuxtLink 
          to="/correlacoes" 
          class="nav-item flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors"
          :class="{ 'text-primary': isActiveRoute('/correlacoes'), 'text-on-surface-variant': !isActiveRoute('/correlacoes') }"
          @click="closeSidebarOnMobile"
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
        <!-- [REMOVIDO] Support e Sign Out - removidos conforme solicitação -->
      </div>
    </aside>

    <!-- Main Content Wrapper -->
    <main 
      :class="[
        'flex flex-col h-screen overflow-hidden flex-1',
        'lg:ml-64', // Add left margin on desktop to account for fixed sidebar
        'transition-all duration-300 ease-in-out'
      ]"
    >
      <!-- TopNavBar -->
      <header class="flex justify-between items-center px-4 lg:px-6 py-3 w-full z-50 bg-background sticky top-0 border-b border-outline-variant/10">
        <!-- Mobile Menu Button -->
        <button 
          @click="toggleSidebar"
          class="lg:hidden p-2 -ml-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
        >
          <span class="material-symbols-outlined">menu</span>
        </button>

        <!-- Left: Market Status & Time -->
        <div class="flex items-center gap-3 lg:gap-6">
          <div class="hidden sm:flex items-center gap-2 font-mono text-xs">
            <span class="status-dot">
              <span class="status-dot-ping" :class="isMarketOpen ? 'bg-[#4edea3]' : 'bg-[#ffb2b7]'"></span>
              <span class="status-dot-solid" :class="isMarketOpen ? 'bg-[#4edea3]' : 'bg-[#ffb2b7]'"></span>
            </span>
            <span class="hidden md:inline text-outline">Status do mercado:</span>
            <span :class="marketStatusColor">{{ marketStatusText }}</span>
          </div>
          <div class="text-outline font-mono text-xs">{{ currentUtcTime }}</div>
        </div>

        <!-- Right: Settings & User -->
        <div class="flex items-center gap-2 lg:gap-4">
          <div class="hidden sm:block h-6 w-px bg-outline-variant/30"></div>
          
          <!-- Refresh Indicator -->
          <div v-if="isRefreshing" class="flex items-center gap-2 text-xs text-primary">
            <span class="material-symbols-outlined animate-spin text-sm">refresh</span>
            <span class="hidden lg:inline">Updating...</span>
          </div>      
        </div>
      </header>

      <!-- Content Canvas -->
      <div class="flex-1 overflow-y-auto p-3 lg:p-6 space-y-6 scrollbar-thin">
        <slot />
      </div>

      <!-- BottomNavBar (Tickers Marquee) -->
      <footer class="fixed bottom-0 w-full z-50 flex justify-between items-center px-2 lg:px-4 h-10 overflow-hidden bg-background/80 backdrop-blur-xl border-t border-outline-variant/15"
        :class="['lg:left-64', 'left-0', 'lg:w-[calc(100%-16rem)]', 'w-full']"
      >
        <div class="flex items-center gap-8 lg:gap-12 w-full animate-marquee whitespace-nowrap">
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
        <div class="absolute right-0 bg-background pl-2 lg:pl-4 flex items-center h-full pr-2 lg:pr-4 border-l border-outline-variant/20">
          <span class="text-[9px] font-bold text-outline uppercase tracking-tighter mr-1 lg:mr-2">Core API</span>
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

// Sidebar state
const isSidebarOpen = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebarOnMobile = () => {
  if (window.innerWidth < 1024) {
    isSidebarOpen.value = false
  }
}

// State
const currentUtcTime = ref('')
const isRefreshing = ref(false)

// Computed
const currentScenario = computed(() => marketStore.scenario?.scenario || 'Loading...')

/**
 * Market Status (Brazilian WDO/WIN hours: Mon-Fri 9:00-18:00 Brasília time)
 */
const isMarketOpen = computed(() => {
  const now = new Date()
  
  // Get current time in Brasília timezone (GMT-3)
  const brasiliaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const dayOfWeek = brasiliaTime.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const hour = brasiliaTime.getHours()
  
  // Market is open Monday (1) to Friday (5), 9:00 to 17:59 (hour 9-17)
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
  const isDuringHours = hour >= 9 && hour < 18
  
  return isWeekday && isDuringHours
})

const marketStatusText = computed(() => isMarketOpen.value ? 'Aberto' : 'Fechado')
const marketStatusColor = computed(() => isMarketOpen.value ? 'text-[#4edea3]' : 'text-[#ffb2b7]')

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