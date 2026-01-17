<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-8">
    <div class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          📦 Stock Actual
        </h3>
        <div class="flex items-center gap-2">
          <!-- Search Input -->
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar producto..."
              class="pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-primary-500 focus:border-primary-500 w-48"
            />
            <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
          <span class="text-sm text-gray-500">{{ filteredProducts.length }} productos</span>
        </div>
      </div>
    </div>
    
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th 
              @click="sortBy('nombre')" 
              scope="col" 
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Producto {{ sortField === 'nombre' ? (sortAsc ? '↑' : '↓') : '' }}
            </th>
            <th 
              @click="sortBy('tipo_producto')" 
              scope="col" 
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Tipo {{ sortField === 'tipo_producto' ? (sortAsc ? '↑' : '↓') : '' }}
            </th>
            <th 
              @click="sortBy('stock')" 
              scope="col" 
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Stock {{ sortField === 'stock' ? (sortAsc ? '↑' : '↓') : '' }}
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Unidad
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="loading" class="animate-pulse">
             <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500 text-center">Cargando inventario...</td>
          </tr>
          <tr v-else-if="paginatedProducts.length === 0">
             <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500 text-center">No hay productos.</td>
          </tr>
          <tr v-for="product in paginatedProducts" :key="product.id" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900 dark:text-white">{{ product.nombre }}</div>
              <div class="text-xs text-gray-500">{{ product.codigo }}</div>
            </td>
             <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                :class="product.tipo_producto === 'SIMPLE' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'">
                {{ product.tipo_producto }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
              <span :class="getStockClass(product)">
                {{ calculateProductStock(product) }}
                <span v-if="product.tipo_producto === 'COMPUESTO'" class="text-xs text-gray-400 font-normal ml-1">(Calc)</span>
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
               {{ product.unidad_medida_base || 'u' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button 
                @click="$emit('adjust', product)" 
                class="text-primary-600 hover:text-primary-900 dark:text-primary-400 font-medium"
              >
                Ajustar
              </button>
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
          {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, filteredProducts.length) }} de {{ filteredProducts.length }}
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
import type { Producto } from '@/types/database.types'
import { calculateProductStock } from '@/utils/inventory'

const props = defineProps<{
  products: Producto[]
  loading: boolean
}>()

defineEmits<{
  (e: 'adjust', product: Producto): void
}>()

// Search
const searchQuery = ref('')

// Sorting
const sortField = ref<'nombre' | 'tipo_producto' | 'stock'>('nombre')
const sortAsc = ref(true)

const sortBy = (field: 'nombre' | 'tipo_producto' | 'stock') => {
  if (sortField.value === field) {
    sortAsc.value = !sortAsc.value
  } else {
    sortField.value = field
    sortAsc.value = true
  }
}

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Filtered and sorted products
const filteredProducts = computed(() => {
  let result = [...props.products]
  
  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p => 
      p.nombre.toLowerCase().includes(query) ||
      (p.codigo && p.codigo.toLowerCase().includes(query))
    )
  }
  
  // Sort
  result.sort((a, b) => {
    let cmp = 0
    if (sortField.value === 'nombre') {
      cmp = a.nombre.localeCompare(b.nombre)
    } else if (sortField.value === 'tipo_producto') {
      cmp = (a.tipo_producto || '').localeCompare(b.tipo_producto || '')
    } else if (sortField.value === 'stock') {
      cmp = calculateProductStock(a) - calculateProductStock(b)
    }
    return sortAsc.value ? cmp : -cmp
  })
  
  return result
})

// Paginated products
const totalPages = computed(() => Math.ceil(filteredProducts.value.length / pageSize.value))

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredProducts.value.slice(start, start + pageSize.value)
})

// Reset page when filters change
watch([searchQuery, pageSize], () => {
  currentPage.value = 1
})

const getStockClass = (product: Producto) => {
  const stock = calculateProductStock(product)
  if (stock <= 0) return 'text-red-600'
  if (stock <= product.stock_minimo) return 'text-yellow-600'
  return 'text-gray-900 dark:text-white'
}
</script>
