<template>
  <div class="flex items-center justify-center h-full">
    <div class="text-center">
      <div class="material-symbols-outlined text-6xl text-primary animate-spin">progress_activity</div>
      <p class="mt-4 text-on-surface-variant">Loading MacroView Pro...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // Redirect to dashboard after a brief moment
  setTimeout(() => {
    router.replace('/dashboard')
  }, 500)
})
</script>
