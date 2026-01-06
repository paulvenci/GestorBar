<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <AppHeader />
    <AppSidebar />
    <main 
      class="mt-16 p-6 min-h-screen transition-all duration-300 ease-in-out"
      :class="uiStore.isSidebarCollapsed ? 'ml-20' : 'ml-64'"
    >
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
</script>
