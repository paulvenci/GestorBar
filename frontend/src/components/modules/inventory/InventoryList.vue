<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
        Historial de Movimientos
      </h3>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Fecha
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Producto
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Tipo
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Cantidad
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
          <tr v-else-if="movimientos.length === 0">
            <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
              No hay movimientos registrados.
            </td>
          </tr>
          <tr v-for="mov in movimientos" :key="mov.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(mov.fecha) }}
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
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/formatters'

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

defineProps<{
  movimientos: MovimientoWithProduct[]
  loading: boolean
}>()
</script>
