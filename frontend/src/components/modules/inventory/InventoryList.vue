<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          📋 Historial de Movimientos
        </h3>
        <div class="flex items-center gap-2">
          <!-- Search Input -->
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar..."
              class="pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-primary-500 focus:border-primary-500 w-40"
            />
            <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
          <span class="text-sm text-gray-500">{{ filteredMovimientos.length }} movimientos</span>
        </div>
      </div>
    </div>
    
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th 
              @click="sortBy('fecha')" 
              scope="col" 
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Fecha {{ sortField === 'fecha' ? (sortAsc ? '↑' : '↓') : '' }}
            </th>
            <th 
              @click="sortBy('producto')" 
              scope="col" 
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Producto {{ sortField === 'producto' ? (sortAsc ? '↑' : '↓') : '' }}
            </th>
            <th 
              @click="sortBy('tipo')" 
              scope="col" 
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Tipo {{ sortField === 'tipo' ? (sortAsc ? '↑' : '↓') : '' }}
            </th>
            <th 
              @click="sortBy('cantidad')" 
              scope="col" 
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Cantidad {{ sortField === 'cantidad' ? (sortAsc ? '↑' : '↓') : '' }}
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Observaciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="loading" class="animate-pulse">
            <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
              Cargando movimientos...
            </td>
          </tr>
          <tr v-else-if="paginatedMovimientos.length === 0">
            <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
              No hay movimientos registrados.
            </td>
          </tr>
          <tr v-for="mov in paginatedMovimientos" :key="mov.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ formatDateTime(mov.fecha) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              {{ mov.producto?.nombre || 'Producto eliminado' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                :class="{
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': mov.tipo_movimiento === 'ENTRADA',
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': mov.tipo_movimiento === 'SALIDA',
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': mov.tipo_movimiento === 'AJUSTE'
                }">
                {{ mov.tipo_movimiento }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium"
                :class="mov.tipo_movimiento === 'ENTRADA' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              {{ mov.tipo_movimiento === 'SALIDA' ? '-' : '+' }}{{ mov.cantidad }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
              {{ mov.observaciones || '-' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">Items por página:</span>
        <select v-model="pageSize" class="text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white px-2 py-1">
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">
          {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, filteredMovimientos.length) }} de {{ filteredMovimientos.length }}
        </span>
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="px-2 py-1 text-sm border rounded dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          ←
        </button>
        <button 
          @click="currentPage++" 
          :disabled="currentPage >= totalPages"
          class="px-2 py-1 text-sm border rounded dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatDateTime } from '@/utils/formatters'

// Extending type locally to include joined data
interface MovimientoWithProduct {
  id: string
  producto_id: string
  tipo_movimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE'
  cantidad: number
  fecha: string
  observaciones?: string | null
  producto?: {
    nombre: string
    codigo: string
  }
}

const props = defineProps<{
  movimientos: MovimientoWithProduct[]
  loading: boolean
}>()

// Search
const searchQuery = ref('')

// Sorting
const sortField = ref<'fecha' | 'producto' | 'tipo' | 'cantidad'>('fecha')
const sortAsc = ref(false) // Default descending for date

const sortBy = (field: 'fecha' | 'producto' | 'tipo' | 'cantidad') => {
  if (sortField.value === field) {
    sortAsc.value = !sortAsc.value
  } else {
    sortField.value = field
    sortAsc.value = field !== 'fecha' // Ascending for all except date
  }
}

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Filtered and sorted movimientos
const filteredMovimientos = computed(() => {
  let result = [...props.movimientos]
  
  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(m => 
      (m.producto?.nombre && m.producto.nombre.toLowerCase().includes(query)) ||
      (m.observaciones && m.observaciones.toLowerCase().includes(query)) ||
      m.tipo_movimiento.toLowerCase().includes(query)
    )
  }
  
  // Sort
  result.sort((a, b) => {
    let cmp = 0
    if (sortField.value === 'fecha') {
      cmp = a.fecha.localeCompare(b.fecha)
    } else if (sortField.value === 'producto') {
      cmp = (a.producto?.nombre || '').localeCompare(b.producto?.nombre || '')
    } else if (sortField.value === 'tipo') {
      cmp = a.tipo_movimiento.localeCompare(b.tipo_movimiento)
    } else if (sortField.value === 'cantidad') {
      cmp = a.cantidad - b.cantidad
    }
    return sortAsc.value ? cmp : -cmp
  })
  
  return result
})

// Paginated movimientos
const totalPages = computed(() => Math.ceil(filteredMovimientos.value.length / pageSize.value))

const paginatedMovimientos = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredMovimientos.value.slice(start, start + pageSize.value)
})

// Reset page when filters change
watch([searchQuery, pageSize], () => {
  currentPage.value = 1
})
</script>
