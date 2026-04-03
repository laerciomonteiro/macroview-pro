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
            <h1 class="text-lg font-bold text-primary">MacroView Pro 1.0</h1>
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
            <span :class="marketStatusColor">{{ marketStatus.isOpen ? 'Aberto' : 'Fechado' }}{{ marketStatus.isHoliday ? ' - ' + marketStatus.holidayName : '' }}</span>
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

// B3 holidays 2026 (from ANBIMA)
const B3_HOLIDAYS = [
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-04-03',
  '2026-04-21', '2026-05-01', '2026-06-04', '2026-09-07',
  '2026-10-12', '2026-11-02', '2026-11-15', '2026-11-20',
  '2026-12-25'
]

const isHoliday = (dateStr: string): boolean => {
  return B3_HOLIDAYS.includes(dateStr)
}

const getHolidayName = (dateStr: string): string => {
  const holidays: Record<string, string> = {
    '2026-01-01': 'Confraternização Universal',
    '2026-02-16': 'Carnaval',
    '2026-02-17': 'Carnaval',
    '2026-04-03': 'Paixão de Cristo',
    '2026-04-21': 'Tiradentes',
    '2026-05-01': 'Dia do Trabalho',
    '2026-06-04': 'Corpus Christi',
    '2026-09-07': 'Independência do Brasil',
    '2026-10-12': 'Nossa Senhora Aparecida',
    '2026-11-02': 'Finados',
    '2026-11-15': 'Proclamação da República',
    '2026-11-20': 'Dia Nacional de Zumbi',
    '2026-12-25': 'Natal',
  }
  return holidays[dateStr] || 'Feriado'
}

const getMarketStatus = () => {
  const now = new Date()
  const brasiliaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  
  const dayOfWeek = brasiliaTime.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const hour = brasiliaTime.getHours()
  
  // Format date as YYYY-MM-DD in Brasília time
  const year = brasiliaTime.getFullYear()
  const month = String(brasiliaTime.getMonth() + 1).padStart(2, '0')
  const day = String(brasiliaTime.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`
  
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isHolidayToday = isHoliday(dateStr)
  const isDuringHours = hour >= 9 && hour < 18
  
  return {
    isOpen: !isWeekend && !isHolidayToday && isDuringHours,
    isWeekend,
    isHoliday: isHolidayToday,
    holidayName: isHolidayToday ? getHolidayName(dateStr) : null
  }
}

/**
 * Market Status (Brazilian WDO/WIN hours: Mon-Fri 9:00-18:00 Brasília time)
 * Includes B3 holiday checking
 */
const marketStatus = computed(() => getMarketStatus())

const isMarketOpen = computed(() => marketStatus.value.isOpen)

const marketStatusText = computed(() => {
  const status = marketStatus.value
  if (status.isHoliday) return status.holidayName || 'Feriado'
  if (status.isWeekend) return 'Fechado'
  if (status.isOpen) return 'Aberto'
  return 'Fechado'
})

const marketStatusColor = computed(() => {
  const status = marketStatus.value
  if (status.isHoliday) return 'text-[#f9bd22]' // Yellow for holiday
  if (status.isOpen) return 'text-[#4edea3]' // Green
  return 'text-[#ffb2b7]' // Red
})

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