<template>
  <header 
    class="bg-white dark:bg-gray-800 shadow-sm fixed top-0 right-0 z-20 h-14 md:h-16 transition-all duration-300 ease-in-out"
    :class="uiStore.isSidebarCollapsed ? 'left-0 md:left-20' : 'left-0 md:left-64'"
  >
      <div class="px-3 md:px-6 py-2 md:py-3 flex items-center justify-between h-full">
      
      <!-- Left Section: Hamburger + Brand -->
      <div class="flex items-center gap-2 md:gap-4">
        <!-- Mobile Hamburger -->
        <button 
          @click="uiStore.toggleSidebarMobile()"
          class="md:hidden p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>

        <h1 class="text-lg font-black text-slate-800 dark:text-white tracking-tight hidden md:flex items-center gap-2">
          <span>⚡ GestorBar</span>
          <span class="text-slate-400 font-semibold">| {{ nombreNegocio }}</span>
        </h1>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- Turno Action Button -->
        <button
          v-if="!turnoStore.tieneTurnoAbierto"
          @click="iniciarTurno"
          class="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <span>⚡ INICIAR TURNO</span>
        </button>

        <!-- Turno Activo Badge -->
        <button 
          v-else
          @click="abrirCierreTurno"
          class="hidden sm:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer group"
          title="Click to Close Shift"
        >
            <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse group-hover:scale-125 transition-transform"></div>
            <span class="text-xs font-bold text-emerald-700 dark:text-emerald-300">TURNO ACTIVO</span>
        </button>

        <!-- Offline Indicator -->
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black transition-all border"
             :class="offlineStore.isOnline 
               ? 'bg-green-500/10 text-green-600 border-green-500/20' 
               : 'bg-red-500/10 text-red-600 border-red-500/20'"
        >
          <span class="relative flex h-2 w-2">
            <span v-if="offlineStore.isOnline" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2" :class="offlineStore.isOnline ? 'bg-green-500' : 'bg-red-500'"></span>
          </span>
          <span class="hidden lg:inline">{{ offlineStore.isOnline ? 'CONECTADO' : 'SIN CONEXIÓN' }}</span>
        </div>

        <!-- Barcode Scanner Pill Button -->
        <button
          @click="toggleBarcodeScanner"
          class="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all border-2"
          :class="barcodeScannerActive 
            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-900/20' 
            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'"
        >
          <span class="text-sm">🎯</span>
          <span>Escáner</span>
        </button>

        <!-- Sync Button -->
        <button
          v-if="offlineStore.pendingTransactions.length > 0 && offlineStore.isOnline"
          @click="offlineStore.syncTransactions()"
          class="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20 animate-pulse"
        >
           🔄 {{ offlineStore.pendingTransactions.length }}
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
    
    <!-- Turno Modal (Teleported) -->
    <Teleport to="body">
       <TurnoIndicatorModal v-if="showTurnoModal" @close="showTurnoModal = false" />
    </Teleport>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useConfiguracionStore } from '@/stores/configuracion'
import { useUIStore } from '@/stores/ui'
import { useOfflineStore } from '@/stores/offline'
import { useTurnoStore } from '@/stores/turno'
import { storeToRefs } from 'pinia'
import { useBarcodeScanner } from '@/composables/useBarcodeScanner'
import TurnoIndicatorModal from './TurnoIndicatorModal.vue'

const configStore = useConfiguracionStore()
const uiStore = useUIStore()
const offlineStore = useOfflineStore()
const turnoStore = useTurnoStore()
const { nombreNegocio } = storeToRefs(configStore)

const isDark = ref(false)
const showTurnoModal = ref(false)

// Barcode Scanner State (shared composable)
const { isActive: barcodeScannerActive, toggle: toggleBarcodeScanner } = useBarcodeScanner()

const iniciarTurno = async () => {
    try {
        const result = await turnoStore.iniciarTurno()
        if (!result.success) {
            alert('Error al iniciar turno: ' + result.error)
        }
    } catch (e: any) {
        alert('Error inesperado: ' + e.message)
    }
}

const abrirCierreTurno = () => {
    showTurnoModal.value = true
}

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

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
  
  // Fetch active shift for current user
  turnoStore.fetchTurnoActivo()
})
</script>
