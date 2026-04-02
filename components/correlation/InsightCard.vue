<script setup lang="ts">
interface Props {
  title: string
  content: string
  icon?: string
  variant?: 'default' | 'warning' | 'success' | 'info'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  variant: 'default',
  icon: 'lightbulb'
})

const variantConfig = computed(() => {
  switch (props.variant) {
    case 'warning':
      return {
        borderColor: 'border-tertiary/50',
        bgColor: 'bg-tertiary/10',
        iconColor: 'text-tertiary',
        badge: 'bg-tertiary-container/20 text-tertiary'
      }
    case 'success':
      return {
        borderColor: 'border-primary/50',
        bgColor: 'bg-primary/10',
        iconColor: 'text-primary',
        badge: 'bg-primary-container/20 text-primary'
      }
    case 'info':
      return {
        borderColor: 'border-[#6ffbbe]/50',
        bgColor: 'bg-[#6ffbbe]/10',
        iconColor: 'text-[#6ffbbe]',
        badge: 'bg-[#6ffbbe]/20 text-[#6ffbbe]'
      }
    default:
      return {
        borderColor: 'border-primary/50',
        bgColor: 'bg-surface-container',
        iconColor: 'text-primary',
        badge: 'bg-primary-container/20 text-primary'
      }
  }
})
</script>

<template>
  <div
    :class="[
      'relative overflow-hidden rounded-xl border-l-4 p-5 transition-all duration-300 hover:shadow-lg',
      variantConfig.borderColor,
      variantConfig.bgColor
    ]"
  >
    <!-- Loading State -->
    <div v-if="loading" class="space-y-3">
      <div class="w-10 h-10 rounded-full bg-surface-bright/20 animate-pulse" />
      <div class="w-32 h-5 rounded bg-surface-bright/20 animate-pulse" />
      <div class="w-full h-4 rounded bg-surface-bright/20 animate-pulse" />
      <div class="w-3/4 h-4 rounded bg-surface-bright/20 animate-pulse" />
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Icon and Title -->
      <div class="flex items-start gap-3 mb-3">
        <div :class="['w-10 h-10 rounded-full flex items-center justify-center', variantConfig.bgColor]">
          <span :class="['material-symbols-outlined text-xl', variantConfig.iconColor]">
            {{ icon }}
          </span>
        </div>
        <div>
          <h4 class="font-bold text-on-surface">{{ title }}</h4>
        </div>
      </div>

      <!-- Content Text -->
      <p class="text-sm text-on-surface-variant leading-relaxed ml-13">
        {{ content }}
      </p>
    </div>

    <!-- Decorative Gradient -->
    <div
      class="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2"
      :style="{
        background: `radial-gradient(circle, ${variantConfig.iconColor.includes('primary') ? '#4edea3' : variantConfig.iconColor.includes('tertiary') ? '#f9bd22' : '#6ffbbe'} 0%, transparent 70%)`
      }"
    />
  </div>
</template>
