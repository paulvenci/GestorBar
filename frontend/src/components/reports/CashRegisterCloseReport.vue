<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
      <div>
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">
          {{ modoAdmin ? 'Reporte Consolidado Diario' : 'Mi Cierre de Caja' }}
        </h2>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ modoAdmin ? 'Muestra el desglose por cajero del día seleccionado.' : 'Resumen de tus ventas del día.' }}
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <label class="text-sm text-gray-600 dark:text-gray-300">Fecha:</label>
        <input 
          type="date" 
          v-model="cierreCajaStore.fechaSeleccionada"
          @change="cargarDatos"
          class="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
        <button @click="cargarHoy" class="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors">
          Hoy
        </button>
        <button @click="cargarDatos" class="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-md transition-colors flex items-center gap-1">
          🔄 Actualizar
        </button>
        <button @click="imprimirReporte" class="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-md transition-colors flex items-center gap-1">
          🖨️ Imprimir
        </button>
      </div>
    </div>

    <!-- Toggle Admin/Personal (solo para admin/gerente) -->
    <div v-if="esAdminOGerente" class="flex gap-2">
      <button
        @click="cambiarModo(false)"
        :class="!modoAdmin ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
        class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
      >
        👤 Mi Cierre
      </button>
      <button
        @click="cambiarModo(true)"
        :class="modoAdmin ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
        class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
      >
        👥 Consolidado (Todos)
      </button>
    </div>

    <!-- Loading -->
    <div v-if="cierreCajaStore.loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>

    <template v-else>
      <!-- ═══════ VISTA ADMIN: Tabla Consolidada ═══════ -->
      <template v-if="modoAdmin">
        <div v-if="cierreCajaStore.cajeros.length > 0">
          <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="w-8 px-2 py-3"></th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cajero</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Efectivo</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tarjeta</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Transferencia</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Crédito</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total Recaudado</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <template v-for="cajero in cierreCajaStore.cajeros" :key="cajero.usuario_id">
                  <!-- Fila del cajero -->
                  <tr 
                    @click="toggleDesglose(cajero)"
                    class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    :class="expandidos.has(cajero.usuario_id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''"
                  >
                    <td class="px-2 py-4 text-center">
                      <span class="text-gray-400 transition-transform inline-block" :class="{ 'rotate-90': expandidos.has(cajero.usuario_id) }">▶</span>
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-gray-900 dark:text-white">{{ cajero.nombre }}</span>
                        <span v-if="cajero.tiene_turno_abierto" class="text-xs text-green-600 dark:text-green-400 font-medium bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">En Turno</span>
                      </div>
                      <span class="text-xs text-gray-500 dark:text-gray-400">{{ cajero.cantidad_ventas }} ventas</span>
                    </td>
                    <td class="px-4 py-4 text-right font-medium text-green-600 dark:text-green-400">{{ formatCurrency(cajero.total_efectivo) }}</td>
                    <td class="px-4 py-4 text-right font-medium text-blue-600 dark:text-blue-400">{{ formatCurrency(cajero.total_tarjeta) }}</td>
                    <td class="px-4 py-4 text-right font-medium text-purple-600 dark:text-purple-400">{{ formatCurrency(cajero.total_transferencia) }}</td>
                    <td class="px-4 py-4 text-right font-medium text-orange-600 dark:text-orange-400">{{ formatCurrency(cajero.total_credito) }}</td>
                    <td class="px-4 py-4 text-right text-lg font-bold text-gray-900 dark:text-white">{{ formatCurrency(cajero.total_recaudado) }}</td>
                  </tr>
                  <!-- Desglose expandido -->
                  <tr v-if="expandidos.has(cajero.usuario_id)">
                    <td colspan="7" class="px-6 py-4 bg-gray-50 dark:bg-gray-700/30">
                      <DesgloseVentas :cajero="cajero" :cargando="cargandoDesglose.has(cajero.usuario_id)" />
                    </td>
                  </tr>
                </template>
              </tbody>
              <!-- Footer TOTAL GENERAL -->
              <tfoot>
                <tr class="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                  <td class="px-2 py-4"></td>
                  <td class="px-4 py-4 font-bold text-sm uppercase">Total General:</td>
                  <td class="px-4 py-4 text-right font-bold">EF: {{ formatCurrency(consolidado.total_efectivo) }}</td>
                  <td class="px-4 py-4 text-right font-bold">TJ: {{ formatCurrency(consolidado.total_tarjeta) }}</td>
                  <td class="px-4 py-4 text-right font-bold">TR: {{ formatCurrency(consolidado.total_transferencia) }}</td>
                  <td class="px-4 py-4 text-right font-bold">CR: {{ formatCurrency(consolidado.total_credito) }}</td>
                  <td class="px-4 py-4 text-right text-lg font-bold">{{ formatCurrency(consolidado.total_general) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <EmptyState v-else />
      </template>

      <!-- ═══════ VISTA PERSONAL: Mi Cierre ═══════ -->
      <template v-else>
        <div v-if="miCierre">
          <!-- Info del cajero -->
          <div class="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
            <div>
              <p class="text-xl font-bold text-gray-900 dark:text-white">{{ miCierre.nombre }}</p>
              <p v-if="miCierre.tiene_turno_abierto && miCierre.turno_inicio" class="text-sm text-gray-500 dark:text-gray-400">
                Turno actual desde las {{ formatTime(miCierre.turno_inicio) }}
              </p>
            </div>
            <span 
              :class="miCierre.tiene_turno_abierto 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'"
              class="px-3 py-1.5 text-sm font-medium rounded-full flex items-center gap-1.5"
            >
              <span :class="miCierre.tiene_turno_abierto ? 'bg-green-500' : 'bg-gray-400'" class="w-2 h-2 rounded-full" :style="miCierre.tiene_turno_abierto ? 'animation: pulse 2s infinite' : ''"></span>
              {{ miCierre.tiene_turno_abierto ? 'En Turno' : 'Sin Turno' }}
            </span>
          </div>

          <!-- Tarjetas de totales (Solo Admin/Gerente) -->
          <template v-if="esAdminOGerente">
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <p class="text-xs font-medium text-green-600 dark:text-green-400 uppercase">Efectivo</p>
              <p class="text-xl font-bold text-green-700 dark:text-green-300 mt-1">{{ formatCurrency(miCierre.total_efectivo) }}</p>
            </div>
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
              <p class="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">Tarjeta</p>
              <p class="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">{{ formatCurrency(miCierre.total_tarjeta) }}</p>
            </div>
            <div class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 text-center">
              <p class="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase">Transferencia</p>
              <p class="text-xl font-bold text-purple-700 dark:text-purple-300 mt-1">{{ formatCurrency(miCierre.total_transferencia) }}</p>
            </div>
            <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 text-center">
              <p class="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase">Crédito</p>
              <p class="text-xl font-bold text-orange-700 dark:text-orange-300 mt-1">{{ formatCurrency(miCierre.total_credito) }}</p>
            </div>
            <div class="bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg p-4 text-center text-white col-span-2 sm:col-span-1">
              <p class="text-xs font-medium uppercase opacity-80">Total Recaudado</p>
              <p class="text-2xl font-bold mt-1">{{ formatCurrency(miCierre.total_recaudado) }}</p>
              <p class="text-xs opacity-70 mt-0.5">{{ miCierre.cantidad_ventas }} ventas</p>
            </div>
          </div>

          <!-- Botón desglose -->
          <button
            @click="toggleDesglosePersonal"
            class="w-full py-3 px-4 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex items-center justify-center gap-2 border border-primary-200 dark:border-primary-800"
          >
            <svg :class="desglosePersonalAbierto ? 'rotate-180' : ''" class="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
            {{ desglosePersonalAbierto ? 'Ocultar' : 'Ver' }} Desglose de Ventas
          </button>

          <!-- Desglose expandido -->
            <div v-if="desglosePersonalAbierto" class="mt-4">
              <DesgloseVentas :cajero="miCierre" :cargando="cargandoDesglosePersonal" />
            </div>
          </template>

          <!-- Caja Ciega (Para Meseros/Cajeros) -->
          <template v-else>
            <div class="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg text-center border border-gray-200 dark:border-gray-700 mb-6">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 mb-4">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Modo Caja Ciega</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">Tus totales de venta están ocultos por seguridad. Para finalizar tu jornada, imprime tu comprobante y cierra tu turno.</p>
              
              <button 
                @click="cerrarCajaYSalir" 
                :disabled="cerrando" 
                class="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-colors text-lg shadow-lg flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
              >
                <svg v-if="cerrando" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span v-else>🔒</span>
                {{ cerrando ? 'Cerrando turno...' : 'Cerrar Turno e Imprimir' }}
              </button>
            </div>
          </template>
        </div>
        <EmptyState v-else />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCierreCajaStore, type CajeroDia } from '@/stores/cierreCaja'
import { useAuthStore } from '@/stores/auth'
import { useConfiguracionStore } from '@/stores/configuracion'
import { formatCurrency } from '@/utils/formatters'
import DesgloseVentas from './DesgloseVentas.vue'
import EmptyState from './CierreEmptyState.vue'
import { useTurnoStore } from '@/stores/turno'
import { useRouter } from 'vue-router'

const cierreCajaStore = useCierreCajaStore()
const authStore = useAuthStore()
const configStore = useConfiguracionStore()
const turnoStore = useTurnoStore()
const router = useRouter()

// Estado local
const expandidos = ref<Set<string>>(new Set())
const cargandoDesglose = ref<Set<string>>(new Set())
const desglosePersonalAbierto = ref(false)
const cargandoDesglosePersonal = ref(false)
const cerrando = ref(false)

let refreshInterval: ReturnType<typeof setInterval> | null = null

// Computed
const esAdminOGerente = computed(() => {
  const rol = authStore.userRole
  return rol === 'Administrador' || rol === 'Gerente'
})

const modoAdmin = computed(() => cierreCajaStore.modoAdmin)
const miCierre = computed(() => cierreCajaStore.miCierre)
const consolidado = computed(() => cierreCajaStore.consolidadoDia)

// Methods
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

const cargarDatos = async () => {
  expandidos.value.clear()
  desglosePersonalAbierto.value = false
  if (modoAdmin.value) {
    await cierreCajaStore.fetchConsolidado()
  } else {
    await cierreCajaStore.fetchMiCierre()
  }
}

const cargarHoy = () => {
  const now = new Date()
  if (now.getHours() < 6) {
    now.setDate(now.getDate() - 1)
  }
  cierreCajaStore.fechaSeleccionada = now.toLocaleDateString('en-CA')
  cargarDatos()
}

const cambiarModo = (admin: boolean) => {
  expandidos.value.clear()
  desglosePersonalAbierto.value = false
  if (admin) {
    cierreCajaStore.fetchConsolidado()
  } else {
    cierreCajaStore.fetchMiCierre()
  }
}

const toggleDesglose = async (cajero: CajeroDia) => {
  const id = cajero.usuario_id
  if (expandidos.value.has(id)) {
    expandidos.value.delete(id)
  } else {
    expandidos.value.add(id)
    if (!cajero.ventas_en_turno) {
      cargandoDesglose.value.add(id)
      await cierreCajaStore.fetchDesglose(id)
      cargandoDesglose.value.delete(id)
    }
  }
}

const toggleDesglosePersonal = async () => {
  desglosePersonalAbierto.value = !desglosePersonalAbierto.value
  if (desglosePersonalAbierto.value && miCierre.value && !miCierre.value.ventas_en_turno) {
    cargandoDesglosePersonal.value = true
    await cierreCajaStore.fetchDesglose(miCierre.value.usuario_id)
    cargandoDesglosePersonal.value = false
  }
}

const imprimirReporte = () => {
  const fecha = cierreCajaStore.fechaSeleccionada
  const cajeros = cierreCajaStore.cajeros
  const W = 42
  const sep = '='.repeat(W)
  const dash = '-'.repeat(W)
  const pad = (l: string, r: string) => l + ' '.repeat(Math.max(1, W - l.length - r.length)) + r
  const center = (t: string) => ' '.repeat(Math.max(0, Math.floor((W - t.length) / 2))) + t

  let lines: string[] = []
  lines.push(sep)
  lines.push(center(modoAdmin.value ? 'CONSOLIDADO DIARIO' : 'MI CIERRE DE CAJA'))
  lines.push(center(configStore.nombreNegocio))
  lines.push(sep)
  lines.push(pad('Fecha:', fecha))
  lines.push(sep)

  for (const c of cajeros) {
    const estado = c.tiene_turno_abierto ? '[EN TURNO]' : '[CERRADO]'
    lines.push('')
    lines.push(pad(c.nombre.toUpperCase(), estado))
    lines.push(dash)
    lines.push(pad('Efectivo:', formatCurrency(c.total_efectivo)))
    lines.push(pad('Tarjeta:', formatCurrency(c.total_tarjeta)))
    lines.push(pad('Transferencia:', formatCurrency(c.total_transferencia)))
    lines.push(pad('Credito:', formatCurrency(c.total_credito)))
    lines.push(dash)
    lines.push(pad(`${c.cantidad_ventas} ventas`, formatCurrency(c.total_recaudado)))
    lines.push(sep)
  }

  if (modoAdmin.value && cajeros.length > 1) {
    const c = consolidado.value
    lines.push('')
    lines.push(center('TOTAL GENERAL'))
    lines.push(dash)
    lines.push(pad('Efectivo:', formatCurrency(c.total_efectivo)))
    lines.push(pad('Tarjeta:', formatCurrency(c.total_tarjeta)))
    lines.push(pad('Transferencia:', formatCurrency(c.total_transferencia)))
    lines.push(pad('Credito:', formatCurrency(c.total_credito)))
    lines.push(sep)
    lines.push(pad(`${c.cantidad_ventas} ventas`, formatCurrency(c.total_general)))
    lines.push(sep)
  }

  lines.push('')
  lines.push(center(new Date().toLocaleString('es-CL')))
  lines.push('')

  const sw = screen.width
  const sh = screen.height
  const pw = window.open('', '_blank', `width=${sw},height=${sh},left=0,top=0`)
  if (!pw) return
  pw.document.write(`<!DOCTYPE html><html><head><title>Cierre - ${fecha}</title>
<style>@page{size:80mm auto;margin:0}body{font-family:'Courier New',monospace;font-size:9px;line-height:1.3;margin:0;padding:0;display:flex;justify-content:center;color:#000;background:#fff}pre{margin:2mm;white-space:pre-wrap;font-family:inherit;font-size:inherit}</style>
</head><body><pre>${lines.join('\n')}</pre>
<script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)};<\/script></body></html>`)
  pw.document.close()
}

const cerrarCajaYSalir = async () => {
  if (cerrando.value) return
  
  const confirmar = confirm('¿Estás seguro de que deseas cerrar tu turno? Se imprimirá tu comprobante y se cerrará tu sesión.')
  if (!confirmar) return

  cerrando.value = true
  
  try {
    // 1. Cerrar Turno
    const result = await turnoStore.cerrarTurno('Cierre de caja ciega')
    if (!result.success) {
      alert(result.error || 'Error al cerrar el turno')
      cerrando.value = false
      return
    }

    // 2. Imprimir (ya tenemos los datos cargados en miCierre)
    imprimirReporte()

    // 3. Esperar un poco para que el print dialogue no se interrumpa
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 4. Logout y volver a login
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Error en cierre de caja:', error)
    alert('Ocurrió un error inesperado')
    cerrando.value = false
  }
}

onMounted(async () => {
  await cargarDatos()
  refreshInterval = setInterval(() => {
    if (modoAdmin.value) {
      cierreCajaStore.fetchConsolidado()
    } else {
      cierreCajaStore.fetchMiCierre()
    }
  }, 60000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>
