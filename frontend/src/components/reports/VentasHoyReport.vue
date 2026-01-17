<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          📋 Ventas del Día
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ formatFechaLarga(new Date()) }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          @click="cargarVentas" 
          class="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors flex items-center gap-1"
        >
          🔄 Actualizar
        </button>
        <span class="text-sm text-gray-500">
          {{ ventasFiltradas.length }} ventas | Total: {{ formatCurrency(totalVentas) }}
        </span>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="flex flex-wrap gap-3">
      <div class="relative flex-1 min-w-[200px]">
        <input
          v-model="busqueda"
          type="text"
          placeholder="Buscar por cliente o número..."
          class="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-primary-500 focus:border-primary-500"
        />
        <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      </div>
      <select 
        v-model="filtroEstado"
        class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
      >
        <option value="todas">Todas</option>
        <option value="COMPLETADA">Completadas</option>
        <option value="ANULADA">Anuladas</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>

    <!-- Tabla de Ventas -->
    <div v-else class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th 
              @click="cambiarOrden('numero')" 
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              # {{ ordenCampo === 'numero' ? (ordenAsc ? '↑' : '↓') : '' }}
            </th>
            <th 
              @click="cambiarOrden('hora')" 
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Hora {{ ordenCampo === 'hora' ? (ordenAsc ? '↑' : '↓') : '' }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              Cliente
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              Método
            </th>
            <th 
              @click="cambiarOrden('total')" 
              class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Total {{ ordenCampo === 'total' ? (ordenAsc ? '↑' : '↓') : '' }}
            </th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              Estado
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="ventasOrdenadas.length === 0">
            <td colspan="7" class="px-4 py-8 text-center text-gray-500">
              No hay ventas para mostrar
            </td>
          </tr>
          <tr 
            v-for="venta in ventasOrdenadas" 
            :key="venta.id" 
            class="hover:bg-gray-50 dark:hover:bg-gray-700"
            :class="{ 'opacity-50': venta.estado === 'ANULADA' }"
          >
            <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
              {{ venta.numero }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              {{ formatHora(venta.fecha) }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
              {{ venta.cliente_nombre || 'Cliente General' }}
            </td>
            <td class="px-4 py-3 text-sm">
              <span 
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="getMetodoPagoClass(venta.metodo_pago)"
              >
                {{ venta.metodo_pago || '-' }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(venta.total) }}
            </td>
            <td class="px-4 py-3 text-center">
              <span 
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="getEstadoClass(venta.estado)"
              >
                {{ venta.estado }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button 
                v-if="venta.estado === 'COMPLETADA'"
                @click="abrirModalAnular(venta)"
                class="text-red-600 hover:text-red-800 dark:text-red-400 text-sm font-medium"
              >
                Anular
              </button>
              <span 
                v-else-if="venta.estado === 'ANULADA'"
                class="text-xs text-gray-400 cursor-help"
                :title="`Motivo: ${venta.motivo_anulacion || 'No especificado'}`"
              >
                Ver motivo
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de Anulación -->
    <AnularVentaModal 
      v-if="ventaAAnular"
      :venta="ventaAAnular"
      @close="ventaAAnular = null"
      @anulada="handleVentaAnulada"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/formatters'
import AnularVentaModal from '@/components/modules/pos/AnularVentaModal.vue'

interface Venta {
  id: string
  numero: number
  fecha: string
  total: number
  cliente_nombre: string | null
  metodo_pago: string | null
  estado: string
  motivo_anulacion: string | null
}

// State
const ventas = ref<Venta[]>([])
const loading = ref(false)
const busqueda = ref('')
const filtroEstado = ref('todas')
const ordenCampo = ref<'numero' | 'hora' | 'total'>('hora')
const ordenAsc = ref(false)
const ventaAAnular = ref<Venta | null>(null)

// Computed
const ventasFiltradas = computed(() => {
  let result = [...ventas.value]
  
  // Filtrar por búsqueda
  if (busqueda.value) {
    const query = busqueda.value.toLowerCase()
    result = result.filter(v => 
      (v.cliente_nombre && v.cliente_nombre.toLowerCase().includes(query)) ||
      v.numero.toString().includes(query)
    )
  }
  
  // Filtrar por estado
  if (filtroEstado.value !== 'todas') {
    result = result.filter(v => v.estado === filtroEstado.value)
  }
  
  return result
})

const ventasOrdenadas = computed(() => {
  const result = [...ventasFiltradas.value]
  
  result.sort((a, b) => {
    let cmp = 0
    if (ordenCampo.value === 'numero') {
      cmp = a.numero - b.numero
    } else if (ordenCampo.value === 'hora') {
      cmp = a.fecha.localeCompare(b.fecha)
    } else if (ordenCampo.value === 'total') {
      cmp = a.total - b.total
    }
    return ordenAsc.value ? cmp : -cmp
  })
  
  return result
})

const totalVentas = computed(() => {
  return ventasFiltradas.value
    .filter(v => v.estado === 'COMPLETADA')
    .reduce((sum, v) => sum + v.total, 0)
})

// Methods
const formatFechaLarga = (date: Date) => {
  return date.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatHora = (fecha: string) => {
  return new Date(fecha).toLocaleTimeString('es-CL', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const getMetodoPagoClass = (metodo: string | null) => {
  switch (metodo) {
    case 'EFECTIVO': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'TARJETA': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'TRANSFERENCIA': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    case 'CREDITO': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
}

const getEstadoClass = (estado: string) => {
  switch (estado) {
    case 'COMPLETADA': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'ANULADA': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
}

const cambiarOrden = (campo: 'numero' | 'hora' | 'total') => {
  if (ordenCampo.value === campo) {
    ordenAsc.value = !ordenAsc.value
  } else {
    ordenCampo.value = campo
    ordenAsc.value = campo !== 'hora'
  }
}

const cargarVentas = async () => {
  loading.value = true
  
  try {
    // Usar formato local YYYY-MM-DD para evitar problemas de zona horaria
    const hoy = new Date()
    const year = hoy.getFullYear()
    const month = String(hoy.getMonth() + 1).padStart(2, '0')
    const day = String(hoy.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`
    
    const startOfDay = `${todayStr}T00:00:00`
    const endOfDay = `${todayStr}T23:59:59`
    
    const { data, error } = await supabase
      .from('ventas')
      .select('id, numero, fecha, total, cliente_nombre, metodo_pago, estado, motivo_anulacion')
      .gte('fecha', startOfDay)
      .lte('fecha', endOfDay)
      .in('estado', ['COMPLETADA', 'ANULADA'])
      .order('fecha', { ascending: false })

    if (error) throw error
    ventas.value = data || []
  } catch (err) {
    console.error('Error cargando ventas:', err)
  } finally {
    loading.value = false
  }
}

const abrirModalAnular = (venta: Venta) => {
  ventaAAnular.value = venta
}

const handleVentaAnulada = () => {
  ventaAAnular.value = null
  cargarVentas()
}

onMounted(() => {
  cargarVentas()
})
</script>
