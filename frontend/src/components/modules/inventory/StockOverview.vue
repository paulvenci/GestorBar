<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-8">
    <div class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
        📦 Stock Actual
      </h3>
      <div class="text-sm text-gray-500">
        {{ products.length }} productos registrados
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Producto
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Tipo
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Stock Total
            </th>
             <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Unidad Base
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
          <tr v-else-if="products.length === 0">
             <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500 text-center">No hay productos.</td>
          </tr>
          <tr v-for="product in products" :key="product.id" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
  </div>
</template>

<script setup lang="ts">
import type { Producto } from '@/types/database.types'
import { calculateProductStock } from '@/utils/inventory'

defineProps<{
  products: Producto[]
  loading: boolean
}>()

defineEmits<{
  (e: 'adjust', product: Producto): void
}>()

const getStockClass = (product: Producto) => {
  const stock = calculateProductStock(product)
  if (stock <= 0) return 'text-red-600'
  if (stock <= product.stock_minimo) return 'text-yellow-600'
  return 'text-gray-900 dark:text-white'
}
</script>
