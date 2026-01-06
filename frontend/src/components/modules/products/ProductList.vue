<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadowoverflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Producto
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Código
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Categoría
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Tipo
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Precio Venta
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Stock
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="loading" class="animate-pulse">
            <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Cargando productos...
            </td>
          </tr>
          <tr v-else-if="products.length === 0">
            <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No se encontraron productos.
            </td>
          </tr>
          <tr v-for="product in products" :key="product.id" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="h-10 w-10 flex-shrink-0">
                  <img v-if="product.foto" class="h-10 w-10 rounded-full object-cover" :src="product.foto" alt="" />
                  <div v-else class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                     📷
                  </div>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">{{ product.nombre }}</div>
                  <div v-if="product.descripcion" class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                    {{ product.descripcion }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ product.codigo }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              <span v-if="product.categoria" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {{ product.categoria.nombre }}
              </span>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                :class="product.tipo_producto === 'SIMPLE' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'">
                {{ product.tipo_producto }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(product.valor_venta) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
              <span :class="getStockClass(product)">
                {{ calculateProductStock(product) }}
                <span v-if="product.tipo_producto === 'COMPUESTO'" class="text-xs text-gray-400 font-normal ml-1">(Calc)</span>
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button @click="$emit('edit', product)" class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3">
                Editar
              </button>
              <button @click="$emit('delete', product)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Producto, Categoria } from '@/types/database.types'
import { formatCurrency } from '@/utils/formatters' // Keep this as it's used in the template
import { calculateProductStock } from '@/utils/inventory'

const props = defineProps<{
  products: Producto[]
  categories: Categoria[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', product: Producto): void
  (e: 'delete', product: Producto): void
  (e: 'toggle-status', product: Producto): void
}>()

const getStockClass = (product: Producto) => {
  const stock = calculateProductStock(product)
  if (stock <= 0) return 'text-red-600'
  if (stock <= product.stock_minimo) return 'text-yellow-600'
  return 'text-gray-900 dark:text-white'
}
</script>
