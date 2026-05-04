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


  </div>
</template>

<script setup lang="ts">
import { useTurnoStore } from '@/stores/turno'

const turnoStore = useTurnoStore()

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
</script>
