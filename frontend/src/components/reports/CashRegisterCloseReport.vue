<template>
  <div class="space-y-6">
    <!-- Header con Selector de Fecha -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
      <div class="flex items-center gap-3">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Día Operativo:</label>
        <input 
          type="date" 
          v-model="cierreCajaStore.fechaSeleccionada"
          @change="cargarDatos"
          class="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
        <button
          @click="cargarHoy"
          class="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
        >
          Hoy
        </button>
      </div>

      <div class="text-right">
        <p class="text-xs text-gray-500 dark:text-gray-400">Horario Operativo</p>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">10:00 AM - 01:00 AM (+1)</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="cierreCajaStore.loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Turnos del Día -->
      <div v-if="cierreCajaStore.turnos.length > 0" class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Turnos del Día ({{ cierreCajaStore.turnos.length }})
        </h3>

        <div class="grid gap-4 md:grid-cols-2">
          <div 
            v-for="turno in cierreCajaStore.turnos" 
            :key="turno.id"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
          >
            <!-- Header del Turno -->
            <div class="flex justify-between items-start mb-3">
              <div>
                <p class="font-semibold text-gray-900 dark:text-white">
                  {{ turno.usuario?.nombre || 'Usuario' }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatTime(turno.hora_inicio) }} - {{ turno.hora_fin ? formatTime(turno.hora_fin) : 'Abierto' }}
                </p>
              </div>
              <span 
                :class="turno.estado === 'ABIERTO' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'"
                class="px-2 py-0.5 text-xs font-medium rounded-full"
              >
                {{ turno.estado }}
              </span>
            </div>

            <!-- Totales por Método de Pago -->
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500 dark:text-gray-400">Efectivo:</span>
                <span class="font-medium text-green-600 dark:text-green-400">{{ formatCurrency(getTurnoValue(turno, 'total_efectivo')) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500 dark:text-gray-400">Tarjeta:</span>
                <span class="font-medium text-blue-600 dark:text-blue-400">{{ formatCurrency(getTurnoValue(turno, 'total_tarjeta')) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500 dark:text-gray-400">Transferencia:</span>
                <span class="font-medium text-purple-600 dark:text-purple-400">{{ formatCurrency(getTurnoValue(turno, 'total_transferencia')) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500 dark:text-gray-400">Crédito:</span>
                <span class="font-medium text-orange-600 dark:text-orange-400">{{ formatCurrency(getTurnoValue(turno, 'total_credito')) }}</span>
              </div>
            </div>

            <!-- Total y Ventas -->
            <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span class="text-gray-600 dark:text-gray-400">
                {{ getTurnoValue(turno, 'cantidad_ventas') }} ventas
                <span v-if="turno.estado === 'ABIERTO'" class="ml-1 inline-flex items-center">
                  <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span class="ml-1 text-xs text-green-600 dark:text-green-400">EN VIVO</span>
                </span>
              </span>
              <span class="text-lg font-bold text-gray-900 dark:text-white">
                {{ formatCurrency(calcularTotalTurno(turno)) }}
              </span>
            </div>

            <!-- Observaciones -->
            <p v-if="turno.observaciones" class="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
              📝 {{ turno.observaciones }}
            </p>

            <!-- Botón Desglose de Ventas -->
            <button
              @click="toggleDesglose(turno)"
              class="mt-3 w-full py-2 px-3 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg 
                :class="turnosExpandidos.has(turno.id) ? 'rotate-180' : ''"
                class="w-4 h-4 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
              {{ turnosExpandidos.has(turno.id) ? 'Ocultar' : 'Ver' }} Desglose de Ventas
            </button>

            <!-- Desglose Expandido -->
            <div v-if="turnosExpandidos.has(turno.id)" class="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
              <!-- Loading State -->
              <div v-if="cargandoDesglose.has(turno.id)" class="flex justify-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>

              <!-- Desglose Cargado -->
              <div v-else class="space-y-3">
                <!-- Ventas DENTRO del Turno -->
                <div class="bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-green-800 dark:text-green-300 flex items-center gap-1">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                      Ventas en Turno
                    </h4>
                    <span class="text-sm font-bold text-green-700 dark:text-green-300">
                      {{ formatCurrency(turno.totales_dentro?.total || 0) }}
                    </span>
                  </div>
                  
                  <div v-if="turno.ventas_dentro_turno && turno.ventas_dentro_turno.length > 0" class="space-y-1">
                    <div 
                      v-for="venta in turno.ventas_dentro_turno" 
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
                      <span>{{ turno.totales_dentro?.cantidad || 0 }} ventas</span>
                      <span>Total: {{ formatCurrency(turno.totales_dentro?.total || 0) }}</span>
                    </div>
                  </div>
                  <p v-else class="text-xs text-gray-500 dark:text-gray-400 italic">
                    Sin ventas registradas en turno
                  </p>
                </div>

                <!-- Ventas FUERA del Turno -->
                <div v-if="turno.ventas_fuera_turno && turno.ventas_fuera_turno.length > 0" class="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                      </svg>
                      Ventas Fuera de Turno
                    </h4>
                    <span class="text-sm font-bold text-amber-700 dark:text-amber-300">
                      {{ formatCurrency(turno.totales_fuera?.total || 0) }}
                    </span>
                  </div>
                  
                  <div class="space-y-1">
                    <div 
                      v-for="venta in turno.ventas_fuera_turno" 
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
                      <span>{{ turno.totales_fuera?.cantidad || 0 }} ventas</span>
                      <span>Total: {{ formatCurrency(turno.totales_fuera?.total || 0) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Resumen Comparativo -->
                <div class="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3 border-l-4 border-primary-500">
                  <h5 class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">📊 Resumen</h5>
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span class="text-gray-500 dark:text-gray-400">En turno:</span>
                      <span class="ml-1 font-bold text-green-600 dark:text-green-400">{{ formatCurrency(turno.totales_dentro?.total || 0) }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500 dark:text-gray-400">Fuera:</span>
                      <span class="ml-1 font-bold text-amber-600 dark:text-amber-400">{{ formatCurrency(turno.totales_fuera?.total || 0) }}</span>
                    </div>
                    <div class="col-span-2 pt-1 border-t border-gray-300 dark:border-gray-600">
                      <span class="text-gray-700 dark:text-gray-300 font-semibold">Total Usuario:</span>
                      <span class="ml-1 font-bold text-gray-900 dark:text-white">
                        {{ formatCurrency((turno.totales_dentro?.total || 0) + (turno.totales_fuera?.total || 0)) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sin Turnos -->
      <div v-else class="text-center py-12 text-gray-500 dark:text-gray-400">
        <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>No hay turnos registrados para este día</p>
      </div>

      <!-- Consolidado del Día -->
      <div v-if="cierreCajaStore.turnos.length > 0" class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <h3 class="text-lg font-semibold mb-4">📊 Consolidado del Día</h3>
        
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div class="bg-white/10 rounded-lg p-3">
            <p class="text-xs opacity-80">Efectivo</p>
            <p class="text-xl font-bold">{{ formatCurrency(consolidado.total_efectivo) }}</p>
          </div>
          <div class="bg-white/10 rounded-lg p-3">
            <p class="text-xs opacity-80">Tarjeta</p>
            <p class="text-xl font-bold">{{ formatCurrency(consolidado.total_tarjeta) }}</p>
          </div>
          <div class="bg-white/10 rounded-lg p-3">
            <p class="text-xs opacity-80">Transferencia</p>
            <p class="text-xl font-bold">{{ formatCurrency(consolidado.total_transferencia) }}</p>
          </div>
          <div class="bg-white/10 rounded-lg p-3">
            <p class="text-xs opacity-80">Crédito</p>
            <p class="text-xl font-bold">{{ formatCurrency(consolidado.total_credito) }}</p>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-white/20">
          <div class="text-center sm:text-left mb-2 sm:mb-0">
            <p class="text-sm opacity-80">Total de Ventas</p>
            <p class="text-lg font-medium">{{ consolidado.cantidad_ventas }} transacciones</p>
          </div>
          <div class="text-center sm:text-right">
            <p class="text-sm opacity-80">Total Recaudado</p>
            <p class="text-3xl font-bold">{{ formatCurrency(consolidado.total_general) }}</p>
          </div>
        </div>
      </div>

      <!-- Botón Imprimir -->
      <div v-if="cierreCajaStore.turnos.length > 0" class="flex justify-end">
        <button
          @click="imprimirReporte"
          class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir Reporte
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useCierreCajaStore } from '@/stores/cierreCaja'
import { formatCurrency } from '@/utils/formatters'

const cierreCajaStore = useCierreCajaStore()

// Estado para estadísticas en vivo de turnos abiertos
const liveStats = ref<Record<string, {
  total_efectivo: number
  total_tarjeta: number
  total_transferencia: number
  total_credito: number
  cantidad_ventas: number
  total_general: number
}>>({})

// Estado para expandir desglose de ventas
const turnosExpandidos = ref<Set<string>>(new Set())
const cargandoDesglose = ref<Set<string>>(new Set())

let refreshInterval: ReturnType<typeof setInterval> | null = null

const consolidado = computed(() => cierreCajaStore.consolidadoDia)

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

const calcularTotalTurno = (turno: any) => {
  // Si hay stats en vivo para este turno, usarlas
  if (turno.estado === 'ABIERTO' && liveStats.value[turno.id]) {
    return liveStats.value[turno.id]?.total_general || 0
  }
  return Number(turno.total_efectivo || 0) + 
         Number(turno.total_tarjeta || 0) + 
         Number(turno.total_transferencia || 0) + 
         Number(turno.total_credito || 0)
}

// Obtener el valor correcto para mostrar (live o estático)
const getTurnoValue = (turno: any, field: 'total_efectivo' | 'total_tarjeta' | 'total_transferencia' | 'total_credito' | 'cantidad_ventas') => {
  if (turno.estado === 'ABIERTO' && liveStats.value[turno.id]) {
    return liveStats.value[turno.id]?.[field] || 0
  }
  return turno[field]
}

const cargarDatos = async () => {
  await cierreCajaStore.fetchTurnosDia()
  await cargarEstadisticasVivo()
}

const cargarEstadisticasVivo = async () => {
  const turnosAbiertos = cierreCajaStore.turnos.filter(t => t.estado === 'ABIERTO')
  for (const turno of turnosAbiertos) {
    const stats = await cierreCajaStore.calcularEstadisticasTurnoVivo(turno.id)
    liveStats.value[turno.id] = stats
  }
}

const cargarHoy = () => {
  const today = new Date().toISOString().split('T')[0]
  cierreCajaStore.fechaSeleccionada = today || new Date().toLocaleDateString('en-CA')
  cargarDatos()
}

const toggleDesglose = async (turno: any) => {
  const turnoId = turno.id
  
  if (turnosExpandidos.value.has(turnoId)) {
    // Colapsar
    turnosExpandidos.value.delete(turnoId)
  } else {
    // Expandir y cargar desglose si no existe
    turnosExpandidos.value.add(turnoId)
    
    if (!turno.ventas_dentro_turno) {
      cargandoDesglose.value.add(turnoId)
      const desglose = await cierreCajaStore.fetchVentasDesgloseTurno(
        turno.id,
        turno.usuario_id,
        turno.hora_inicio,
        turno.hora_fin
      )
      
      // Actualizar el turno con el desglose
      Object.assign(turno, desglose)
      cargandoDesglose.value.delete(turnoId)
    }
  }
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('es-CL', { 
    hour: '2-digit', 
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  })
}

const imprimirReporte = () => {
  window.print()
}

onMounted(async () => {
  await cargarDatos()
  // Actualizar estadísticas en vivo cada 30 segundos
  refreshInterval = setInterval(cargarEstadisticasVivo, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

