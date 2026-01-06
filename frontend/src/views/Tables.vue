<template>
  <AppLayout>
    <div class="h-full flex flex-col">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            🍽️ Gestión de Mesas
          </h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Selecciona una mesa para tomar pedido</p>
        </div>
        
        <div class="flex gap-2">
            <div class="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 rounded-lg shadow text-sm">
                <div class="w-4 h-4 rounded-full bg-green-500"></div>
                <span>Libre</span>
            </div>
             <div class="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 rounded-lg shadow text-sm">
                <div class="w-4 h-4 rounded-full bg-red-500"></div>
                <span>Ocupada</span>
            </div>
            <button 
                @click="refreshTables" 
                class="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors"
                title="Actualizar"
            >
                🔄
            </button>
        </div>
      </div>

      <!-- Grid de Mesas -->
      <div v-if="loading" class="flex-1 flex justify-center items-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
      
      <div v-else class="grid grid-cols-2md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <div 
            v-for="mesa in sortedTables" 
            :key="mesa.id"
            @click="handleTableClick(mesa)"
            class="relative group cursor-pointer transition-all duration-300 transform hover:scale-105"
        >
            <div 
                class="aspect-square rounded-2xl shadow-md border-4 flex flex-col items-center justify-center p-4"
                :class="mesa.estado === 'LIBRE' 
                    ? 'bg-white dark:bg-gray-800 border-green-500 hover:shadow-green-500/30' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-500 hover:shadow-red-500/30'"
            >
                <div class="text-4xl mb-2">{{ getTableIcon(mesa.capacidad) }}</div>
                <h3 class="text-2xl font-bold text-gray-800 dark:text-white">Mesa {{ mesa.numero }}</h3>
                <p class="text-gray-500 dark:text-gray-400 text-sm mb-2">Capacidad: {{ mesa.capacidad }}p</p>
                
                <div v-if="mesa.estado === 'OCUPADA'" class="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wide">
                    Ocupada
                </div>
                <div v-else class="mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide">
                    Libre
                </div>
            </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useTablesStore } from '@/stores/tables'
import { usePOSStore } from '@/stores/pos'
import type { Mesa } from '@/types/database.types'

const router = useRouter()
const tablesStore = useTablesStore()
const posStore = usePOSStore()
const { sortedTables, loading } = storeToRefs(tablesStore)

onMounted(() => {
    tablesStore.fetchTables()
    // tablesStore.subscribeToTables() // Si habilitamos realtime
})

const refreshTables = () => {
    tablesStore.fetchTables()
}

const getTableIcon = (capacidad: number) => {
    if (capacidad <= 2) return '☕'
    if (capacidad <= 4) return '🍔'
    return '🍻'
}

const handleTableClick = async (mesa: Mesa) => {
    // Set active table in POS store
    posStore.setActiveTable(mesa.id, mesa.numero)
    
    if (mesa.estado === 'OCUPADA') {
        const hasOrder = await posStore.loadOrder(mesa.id)
        if (!hasOrder) {
            // Error logic or just open empty?
            console.warn('Mesa marcada ocupada pero sin orden pendiente')
        }
    }
    
    // Navigate to POS
    router.push('/pos')
}
</script>
