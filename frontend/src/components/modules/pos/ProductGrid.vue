<template>
  <div class="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <!-- Header: Search & Filter -->
    <div class="p-2 md:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <div class="flex gap-2 mb-2 md:mb-3">
        <div class="relative flex-1">
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Buscar producto (nombre o código)..." 
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-1.5 md:p-2 pr-10 border text-sm"
            autofocus
          />
          <button 
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
            type="button"
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        </div>
      </div>
      
      <!-- Category Chips -->
      <div class="flex gap-1.5 md:gap-2 overflow-x-auto pb-1 md:pb-2 scrollbar-hide">
        <button 
          @click="selectedCategory = ''"
          class="px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-colors"
          :class="selectedCategory === '' 
            ? 'bg-primary-600 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'"
        >
          Todo
        </button>
        <button 
          v-for="cat in categories" 
          :key="cat.id"
          @click="selectedCategory = cat.id"
          class="px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-colors"
          :class="selectedCategory === cat.id 
            ? 'bg-primary-600 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'"
        >
          {{ cat.nombre }}
        </button>
      </div>
    </div>

    <!-- Product Grid -->
    <div class="flex-1 overflow-y-auto p-2 md:p-4 bg-gray-100 dark:bg-gray-900/50">
      <div v-if="loading" class="text-center py-10">
        <p class="text-gray-500">Cargando productos...</p>
      </div>
      
      <div v-else-if="filteredProducts.length === 0" class="text-center py-10">
        <p class="text-gray-500">No se encontraron productos.</p>
      </div>
      
      <div v-else class="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-1.5 md:gap-3">
        <div 
          v-for="product in filteredProducts" 
          :key="product.id"
          @click="$emit('add-to-cart', product)"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-24 md:h-48 active:scale-95"
        >
          <!-- Product Content -->
          <div class="h-24 w-full relative overflow-hidden bg-gray-100 dark:bg-gray-700 hidden md:block">
            <img 
              v-if="product.foto" 
              :src="product.foto" 
              class="w-full h-full object-cover" 
              alt="Foto producto"
            />
             <div v-else class="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            
            <!-- Type Badge overlay -->
             <div 
              class="absolute top-0 right-0 px-2 py-0.5 text-[10px] font-bold text-white rounded-bl-lg shadow-sm"
              :class="product.tipo_producto === 'SIMPLE' ? 'bg-green-500' : 'bg-purple-500'"
            >
              {{ product.tipo_producto === 'SIMPLE' ? 'S' : 'C' }}
            </div>
          </div>

          <div class="p-1.5 md:p-2 flex flex-col justify-between flex-1">
            <div>
              <h4 class="font-bold text-gray-900 dark:text-white text-[10px] md:text-xs line-clamp-2 leading-tight">
                {{ product.nombre }}
              </h4>
              <p class="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 hidden md:block">
                Stock: 
                <span :class="calculateProductStock(product) <= product.stock_minimo ? 'text-red-500 font-bold' : ''">
                  {{ calculateProductStock(product) }}
                  <span v-if="product.tipo_producto === 'COMPUESTO'" class="text-[9px] text-gray-400">(Mix)</span>
                </span>
              </p>
            </div>
            <div class="text-right mt-0.5 md:mt-1">
              <span class="text-primary-600 dark:text-primary-400 font-bold text-[11px] md:text-sm">
                ${{ formatNumber(product.valor_venta) }}
              </span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Producto, Categoria } from '@/types/database.types'
import { calculateProductStock } from '@/utils/inventory'
import { useProductosStore } from '@/stores/productos'

const productosStore = useProductosStore()

const props = defineProps<{
  products: Producto[]
  categories: Categoria[]
  loading: boolean
}>()

defineEmits<{
  (e: 'add-to-cart', product: Producto): void
}>()

const searchQuery = ref('')
const selectedCategory = ref('')

const filteredProducts = computed(() => {
  // Filtrar por búsqueda
  if (searchQuery.value) {
    return props.products.filter(p => 
      p.nombre.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
      p.codigo.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  // Filtrar por categoría
  if (selectedCategory.value) {
    return props.products.filter(p => p.categoria_id === selectedCategory.value)
  }

  // Si no hay filtros, mostrar TOP 20 más vendidos
  if (productosStore.topProductsIds && productosStore.topProductsIds.length > 0) {
    const topProducts = productosStore.topProductsIds
      .map(id => props.products.find(p => p.id === id))
      .filter(p => p !== undefined) as Producto[]
    
    // Si por alguna razón la lista top está vacía después del filtro, devolver los primeros 20
    if (topProducts.length > 0) {
      return topProducts
    }
  }

  // Fallback: Si no hay Top 20 calculado aún, mostrar los primeros 20 del catálogo
  return props.products.slice(0, 20)
})

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('es-CL').format(num)
}
</script>
