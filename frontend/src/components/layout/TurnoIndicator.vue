<template>
  <div class="flex items-center gap-2">
    <!-- Turno Activo -->
    <div 
      v-if="turnoStore.tieneTurnoAbierto"
      class="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg"
    >
      <span class="relative flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      <span class="text-sm font-medium hidden sm:inline">
        Turno: {{ turnoStore.horaInicioFormateada }} ({{ turnoStore.duracionTurno }})
      </span>
      <button
        @click="showCloseModal = true"
        class="ml-1 px-2 py-0.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
      >
        Cerrar
      </button>
    </div>

    <!-- Sin Turno -->
    <button
      v-else
      @click="iniciarTurno"
      :disabled="turnoStore.loading"
      class="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
    >
      <svg v-if="turnoStore.loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="hidden sm:inline">Iniciar Turno</span>
    </button>

    <!-- Modal Cierre de Turno -->
    <Teleport to="body">
      <div 
        v-if="showCloseModal" 
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="showCloseModal = false"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Cerrar Turno
          </h2>

          <!-- Resumen -->
          <div v-if="!loadingResumen" class="space-y-3 mb-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p class="text-xs text-green-600 dark:text-green-400 font-medium">Efectivo</p>
                <p class="text-lg font-bold text-green-700 dark:text-green-300">{{ formatCurrency(resumen.total_efectivo) }}</p>
              </div>
              <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p class="text-xs text-blue-600 dark:text-blue-400 font-medium">Tarjeta</p>
                <p class="text-lg font-bold text-blue-700 dark:text-blue-300">{{ formatCurrency(resumen.total_tarjeta) }}</p>
              </div>
              <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <p class="text-xs text-purple-600 dark:text-purple-400 font-medium">Transferencia</p>
                <p class="text-lg font-bold text-purple-700 dark:text-purple-300">{{ formatCurrency(resumen.total_transferencia) }}</p>
              </div>
              <div class="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                <p class="text-xs text-orange-600 dark:text-orange-400 font-medium">Crédito</p>
                <p class="text-lg font-bold text-orange-700 dark:text-orange-300">{{ formatCurrency(resumen.total_credito) }}</p>
              </div>
            </div>

            <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <div class="flex justify-between items-center">
                <span class="font-medium text-gray-700 dark:text-gray-300">Total del Turno</span>
                <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(resumen.total_general) }}</span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ resumen.cantidad_ventas }} ventas</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observaciones (opcional)
              </label>
              <textarea
                v-model="observaciones"
                rows="2"
                class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Notas sobre el turno..."
              ></textarea>
            </div>
          </div>

          <div v-else class="py-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p class="mt-2 text-gray-500">Calculando resumen...</p>
          </div>

          <div class="flex gap-3 mt-4">
            <button
              @click="showCloseModal = false"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              @click="confirmarCierreTurno"
              :disabled="turnoStore.loading"
              class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {{ turnoStore.loading ? 'Cerrando...' : 'Confirmar Cierre' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTurnoStore } from '@/stores/turno'
import { formatCurrency } from '@/utils/formatters'

const turnoStore = useTurnoStore()

const showCloseModal = ref(false)
const loadingResumen = ref(false)
const observaciones = ref('')
const resumen = ref({
  total_efectivo: 0,
  total_tarjeta: 0,
  total_transferencia: 0,
  total_credito: 0,
  cantidad_ventas: 0,
  total_general: 0
})

// Calcular resumen cuando se abre el modal
watch(showCloseModal, async (isOpen) => {
  if (isOpen) {
    loadingResumen.value = true
    resumen.value = await turnoStore.calcularResumenTurno()
    loadingResumen.value = false
  }
})

const iniciarTurno = async () => {
  const result = await turnoStore.verificarYAutoIniciarTurno()
  if (!result.success) {
    if (result.requiresAuth) {
      alert(result.error)
    } else {
      alert(result.error || 'Error al iniciar turno')
    }
  }
}

const confirmarCierreTurno = async () => {
  const result = await turnoStore.cerrarTurno(observaciones.value)
  if (result.success) {
    showCloseModal.value = false
    observaciones.value = ''
    alert('Turno cerrado correctamente')
  } else {
    alert('Error al cerrar turno: ' + result.error)
  }
}
</script>
