<template>
  <header 
    class="bg-white dark:bg-gray-800 shadow-sm fixed top-0 right-0 z-20 h-16 transition-all duration-300 ease-in-out"
    :class="uiStore.isSidebarCollapsed ? 'left-20' : 'left-64'"
  >
    <div class="px-6 py-3 flex items-center justify-between h-full">
      
      <!-- Toggle Button (Optional in header, but for now just title) -->
      <div class="flex items-center gap-4">
        <!-- We could put a hamburger here, but user asked for sidebar collapse. The button is already in sidebar bottom. -->
        <h1 class="text-2xl font-bold text-primary-600 dark:text-primary-400 truncate hidden md:block">
          🍺 {{ nombreNegocio }}
        </h1>

        <!-- Version Badge -->
        <div class="hidden sm:flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-600 dark:text-gray-400">
          v{{ appVersion }}
        </div>

        <!-- Offline Indicator Mobile Friendly -->
         <div class="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors"
             :class="offlineStore.isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'"
         >
            <span class="relative flex h-2 w-2">
              <span v-if="offlineStore.isOnline" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2" :class="offlineStore.isOnline ? 'bg-green-500' : 'bg-red-500'"></span>
            </span>
            {{ offlineStore.isOnline ? 'ONLINE' : 'OFFLINE' }}
         </div>

         <!-- Barcode Scanner Toggle Switch -->
         <div class="flex items-center gap-2">
           <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
           </svg>
           <button
             @click="toggleBarcodeScanner"
             class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
             :class="barcodeScannerActive ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
             role="switch"
             :aria-checked="barcodeScannerActive"
             title="Toggle barcode scanner"
           >
             <span
               class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
               :class="barcodeScannerActive ? 'translate-x-6' : 'translate-x-1'"
             ></span>
           </button>
         </div>
      </div>
      
      <div class="flex items-center gap-4">

        <!-- Sync Button -->
        <button
          v-if="offlineStore.pendingTransactions.length > 0 && offlineStore.isOnline"
          @click="offlineStore.syncTransactions()"
          class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors animate-pulse"
        >
           <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
           </svg>
           Sincronizar ({{ offlineStore.pendingTransactions.length }})
        </button>

        <span v-if="offlineStore.pendingTransactions.length > 0 && !offlineStore.isOnline" class="text-xs text-orange-500 font-bold">
            ⚠ {{ offlineStore.pendingTransactions.length }} Pendientes
        </span>

        <!-- User Info & Logout -->
        <div class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
            {{ authStore.userName }}
          </span>
        </div>

        <button
          @click="handleLogout"
          class="flex items-center gap-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg transition-colors font-medium text-sm"
          title="Cerrar sesión"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span class="hidden md:inline">Salir</span>
        </button>

        <button
          @click="toggleDarkMode"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Cambiar tema"
        >
          <svg v-if="isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfiguracionStore } from '@/stores/configuracion'
import { useUIStore } from '@/stores/ui'
import { useOfflineStore } from '@/stores/offline'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import packageJson from '../../../package.json'
import { useBarcodeScanner } from '@/composables/useBarcodeScanner'

const router = useRouter()
const configStore = useConfiguracionStore()
const uiStore = useUIStore()
const offlineStore = useOfflineStore()
const authStore = useAuthStore()
const { nombreNegocio } = storeToRefs(configStore)

const appVersion = ref(packageJson.version)
const isDark = ref(false)

// Barcode Scanner State (shared composable)
const { isActive: barcodeScannerActive, toggle: toggleBarcodeScanner } = useBarcodeScanner()

const toggleDarkMode = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

const handleLogout = async () => {
  if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
    const result = await authStore.logout()
    if (result.success) {
      router.push('/login')
    } else {
      alert('Error al cerrar sesión: ' + result.error)
    }
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})
</script>
