<template>
  <aside 
    class="bg-white dark:bg-gray-800 shadow-lg fixed left-0 top-0 bottom-0 overflow-y-auto z-10 pt-16 transition-all duration-300 ease-in-out flex flex-col justify-between"
    :class="uiStore.isSidebarCollapsed ? 'w-20' : 'w-64'"
  >
    <nav class="p-4">
      <ul class="space-y-2">
        <li v-for="item in menuItems" :key="item.path">
          <router-link
            :to="item.path"
            class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors overflow-hidden whitespace-nowrap"
            :class="[
              isActive(item.path) 
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
              uiStore.isSidebarCollapsed ? 'justify-center px-0' : ''
            ]"
            :title="uiStore.isSidebarCollapsed ? item.label : ''"
          >
            <span class="text-xl flex-shrink-0">{{ item.icon }}</span>
            <span 
              class="font-medium transition-opacity duration-200"
              :class="uiStore.isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'"
            >
              {{ item.label }}
            </span>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Toggle Button -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
      <button 
        @click="uiStore.toggleSidebar"
        class="w-full flex items-center justify-center p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <span v-if="!uiStore.isSidebarCollapsed">⏪ Colapsar</span>
        <span v-else>⏩</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'

const route = useRoute()
const uiStore = useUIStore()

const menuItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/productos', label: 'Productos', icon: '🛍' },
  { path: '/inventario', label: 'Inventario', icon: '📦' },
  { path: '/mesas', label: 'Mesas', icon: '🍽️' },
  { path: '/pos', label: 'Caja Rápida', icon: '💰' },
  { path: '/reportes', label: 'Reportes', icon: '📈' },
  { path: '/configuracion', label: 'Configuración', icon: '⚙' }
]

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>
