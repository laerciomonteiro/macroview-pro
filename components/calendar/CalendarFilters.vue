<script setup lang="ts">
import type { CalendarFilters, RegionCode, ImpactLevel } from '~/types/calendar'

interface Props {
  modelValue: CalendarFilters
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: CalendarFilters]
}>()

// Available regions with labels and flags
const regions: { code: RegionCode; label: string; flag: string }[] = [
  { code: 'US', label: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'BR', label: 'Brasil', flag: '🇧🇷' },
  { code: 'EU', label: 'Eurozona', flag: '🇪🇺' }
]

// Impact options
const impactOptions: { value: ImpactLevel | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'Todos', color: 'text-on-surface-variant' },
  { value: 'high', label: 'Alto Impacto', color: 'text-secondary' },
  { value: 'medium', label: 'Médio Impacto', color: 'text-tertiary' },
  { value: 'low', label: 'Baixo Impacto', color: 'text-primary' }
]

// Check if a region is selected
const isRegionSelected = (code: RegionCode): boolean => {
  return props.modelValue.regions.includes(code)
}

// Toggle region selection
const toggleRegion = (code: RegionCode) => {
  const newRegions = isRegionSelected(code)
    ? props.modelValue.regions.filter(r => r !== code)
    : [...props.modelValue.regions, code]
  
  emit('update:modelValue', {
    ...props.modelValue,
    regions: newRegions
  })
}

// Check if a region was initially selected (for showing all if none selected)
const hasActiveFilters = computed(() => {
  return props.modelValue.regions.length > 0 || props.modelValue.minImpact !== 'all'
})

// Clear all filters
const clearFilters = () => {
  emit('update:modelValue', {
    regions: [],
    minImpact: 'all'
  })
}

// Update minimum impact
const updateMinImpact = (impact: ImpactLevel | 'all') => {
  emit('update:modelValue', {
    ...props.modelValue,
    minImpact: impact
  })
}
</script>

<template>
  <div class="bg-surface-container rounded-xl border border-outline/20 p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-on-surface uppercase tracking-wide">
        Filtros
      </h3>
      
      <!-- Clear Filters Button -->
      <button
        v-if="hasActiveFilters"
        @click="clearFilters"
        class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all
               bg-surface-bright/10 hover:bg-surface-bright/20 
               text-on-surface-variant border border-outline/20
               flex items-center gap-1.5"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M6 18L18 6M6 6l12 12" />
        </svg>
        Limpar
      </button>
    </div>

    <!-- Region Filter -->
    <div class="mb-4">
      <label class="block text-xs text-on-surface-variant uppercase tracking-wide mb-3">
        Regiões
      </label>
      <div class="space-y-2">
        <label
          v-for="region in regions"
          :key="region.code"
          class="flex items-center gap-3 cursor-pointer group"
        >
          <div
            :class="[
              'relative w-5 h-5 rounded border-2 transition-all flex items-center justify-center',
              isRegionSelected(region.code)
                ? 'bg-primary border-primary'
                : 'bg-transparent border-outline hover:border-primary/50'
            ]"
          >
            <svg
              v-if="isRegionSelected(region.code)"
              class="w-3 h-3 text-background"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" 
                    d="M5 13l4 4L19 7" />
            </svg>
            
            <input
              type="checkbox"
              :checked="isRegionSelected(region.code)"
              @change="toggleRegion(region.code)"
              class="sr-only"
            />
          </div>
          
          <span class="text-xl">{{ region.flag }}</span>
          <span class="text-sm text-on-surface group-hover:text-primary transition-colors">
            {{ region.label }}
          </span>
        </label>
      </div>
    </div>

    <!-- Impact Filter -->
    <div>
      <label class="block text-xs text-on-surface-variant uppercase tracking-wide mb-3">
        Nível de Impacto
      </label>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="option in impactOptions"
          :key="option.value"
          @click="updateMinImpact(option.value)"
          :class="[
            'px-3 py-2 rounded-lg text-xs font-medium transition-all border',
            modelValue.minImpact === option.value
              ? 'bg-primary/20 border-primary/30 text-primary'
              : 'bg-surface-bright/5 border-outline/20 text-on-surface-variant hover:border-primary/30 hover:text-primary'
          ]"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- Active Filters Summary -->
    <div v-if="hasActiveFilters" class="mt-4 pt-4 border-t border-outline/10">
      <div class="flex flex-wrap gap-2">
        <span
          v-for="region in modelValue.regions"
          :key="'tag-' + region"
          class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                 bg-primary/10 text-primary border border-primary/20"
        >
          {{ regions.find(r => r.code === region)?.flag }}
          {{ region }}
        </span>
        
        <span
          v-if="modelValue.minImpact !== 'all'"
          :class="[
            'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border',
            modelValue.minImpact === 'high' && 'bg-secondary/10 text-secondary border-secondary/20',
            modelValue.minImpact === 'medium' && 'bg-tertiary/10 text-tertiary border-tertiary/20',
            modelValue.minImpact === 'low' && 'bg-primary/10 text-primary border-primary/20'
          ]"
        >
          {{ impactOptions.find(o => o.value === modelValue.minImpact)?.label }}
        </span>
      </div>
    </div>
  </div>
</template>
