<template>
  <div class="space-y-3">
    <!-- Loading -->
    <div v-if="cargando" class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
    </div>

    <template v-else>
      <!-- Ventas En Turno -->
      <div class="bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-sm font-semibold text-green-800 dark:text-green-300 flex items-center gap-1">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Ventas en Turno
          </h4>
          <span class="text-sm font-bold text-green-700 dark:text-green-300">
            {{ formatCurrency(cajero.totales_en_turno?.total || 0) }}
          </span>
        </div>
        <div v-if="cajero.ventas_en_turno && cajero.ventas_en_turno.length > 0" class="space-y-1">
          <div 
            v-for="venta in cajero.ventas_en_turno" 
            :key="venta.id"
            class="flex justify-between text-xs bg-white dark:bg-gray-800 rounded px-2 py-1"
          >
            <span class="text-gray-600 dark:text-gray-400">
              #{{ venta.numero }} - {{ formatDateTime(venta.fecha) }}
            </span>
            <span class="font-medium text-gray-900 dark:text-white flex items-center gap-1">
              {{ formatCurrency(venta.total) }}
              <span class="text-xs text-gray-500">{{ venta.metodo_pago }}</span>
            </span>
          </div>
          <div class="text-xs text-green-700 dark:text-green-300 pt-1 flex justify-between font-medium">
            <span>{{ cajero.totales_en_turno?.cantidad || 0 }} ventas</span>
            <span>Total: {{ formatCurrency(cajero.totales_en_turno?.total || 0) }}</span>
          </div>
        </div>
        <p v-else class="text-xs text-gray-500 dark:text-gray-400 italic">Sin ventas en turno</p>
      </div>

      <!-- Ventas Fuera de Turno -->
      <div class="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            Ventas Fuera de Turno
          </h4>
          <span class="text-sm font-bold text-amber-700 dark:text-amber-300">
            {{ formatCurrency(cajero.totales_fuera_turno?.total || 0) }}
          </span>
        </div>
        <div v-if="cajero.ventas_fuera_turno && cajero.ventas_fuera_turno.length > 0" class="space-y-1">
          <div 
            v-for="venta in cajero.ventas_fuera_turno" 
            :key="venta.id"
            class="flex justify-between text-xs bg-white dark:bg-gray-800 rounded px-2 py-1"
          >
            <span class="text-gray-600 dark:text-gray-400">
              #{{ venta.numero }} - {{ formatDateTime(venta.fecha) }}
            </span>
            <span class="font-medium text-gray-900 dark:text-white flex items-center gap-1">
              {{ formatCurrency(venta.total) }}
              <span class="text-xs text-gray-500">{{ venta.metodo_pago }}</span>
            </span>
          </div>
          <div class="text-xs text-amber-700 dark:text-amber-300 pt-1 flex justify-between font-medium">
            <span>{{ cajero.totales_fuera_turno?.cantidad || 0 }} ventas</span>
            <span>Total: {{ formatCurrency(cajero.totales_fuera_turno?.total || 0) }}</span>
          </div>
        </div>
        <p v-else class="text-xs text-gray-500 dark:text-gray-400 italic">Sin ventas fuera de turno</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '@/utils/formatters'
import type { CajeroDia } from '@/stores/cierreCaja'

defineProps<{
  cajero: CajeroDia
  cargando: boolean
}>()

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('es-CL', { 
    hour: '2-digit', 
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  })
}
</script>
