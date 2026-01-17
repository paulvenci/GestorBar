<template>
  <div class="space-y-4">
    <!-- Header with filters -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        📋 Historial de Ventas Detallado
      </h3>
      <div class="flex items-center gap-3">
        <!-- Date range -->
        <input 
          type="date" 
          v-model="fechaInicio" 
          class="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <span class="text-gray-400">-</span>
        <input 
          type="date" 
          v-model="fechaFin" 
          class="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <button 
          @click="seleccionarHoy" 
          class="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
        >
          📅 Hoy
        </button>
        <button 
          @click="cargarVentas" 
          class="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
        >
          🔍 Buscar
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="flex items-center gap-4">
      <div class="relative flex-1">
        <input
          v-model="busqueda"
          type="text"
          placeholder="Buscar por #, cliente, vendedor o producto..."
          class="w-full pl-8 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
        />
        <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <button 
          v-if="busqueda"
          @click="busqueda = ''"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>
      <span class="text-sm text-gray-500">
        {{ ventasFiltradas.length }} ventas | Total: {{ formatCurrency(totalFiltrado) }}
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="w-8 px-2 py-3"></th>
            <th 
              @click="ordenarPor('numero')"
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              # {{ campoOrden === 'numero' ? (ordenAsc ? '↑' : '↓') : '' }}
            </th>
            <th 
              @click="ordenarPor('fecha')"
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Fecha {{ campoOrden === 'fecha' ? (ordenAsc ? '↑' : '↓') : '' }}
            </th>

            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              Vendedor
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              Cliente
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              Método
            </th>
            <th 
              @click="ordenarPor('total')"
              class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Total {{ campoOrden === 'total' ? (ordenAsc ? '↑' : '↓') : '' }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <template v-if="ventasOrdenadas.length === 0">
            <tr>
              <td colspan="8" class="px-4 py-8 text-center text-gray-500">
                No hay ventas en el período seleccionado
              </td>
            </tr>
          </template>
          <template v-for="venta in ventasOrdenadas" :key="venta.id">
            <!-- Main row -->
            <tr 
              @click="toggleExpand(venta.id)"
              class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              :class="{ 'bg-primary-50 dark:bg-primary-900/20': expandedId === venta.id }"
            >
              <td class="px-2 py-3 text-center">
                <span class="text-gray-400 transition-transform" :class="{ 'rotate-90': expandedId === venta.id }">
                  ▶
                </span>
              </td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                {{ venta.numero }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {{ formatFecha(venta.fecha) }}
              </td>

              <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                {{ venta.vendedor?.nombre || '-' }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
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
              <td class="px-4 py-3 text-sm text-right font-bold text-gray-900 dark:text-white">
                {{ formatCurrency(venta.total) }}
              </td>
            </tr>
            <!-- Expanded detail row -->
            <tr v-if="expandedId === venta.id" class="bg-gray-50 dark:bg-gray-700/50">
              <td colspan="8" class="px-6 py-4">
                <div class="ml-6">
                  <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    📦 Productos de la venta #{{ venta.numero }}
                  </h4>
                  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-600 text-sm">
                    <thead>
                      <tr class="text-xs text-gray-500 dark:text-gray-400 uppercase">
                        <th class="py-2 text-left">Producto</th>
                        <th class="py-2 text-right">Cantidad</th>
                        <th class="py-2 text-right">Precio Unit.</th>
                        <th class="py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
                      <tr v-for="item in venta.items" :key="item.id">
                        <td class="py-2 text-gray-900 dark:text-white">{{ item.nombre_producto }}</td>
                        <td class="py-2 text-right text-gray-500 dark:text-gray-400">{{ item.cantidad }}</td>
                        <td class="py-2 text-right text-gray-500 dark:text-gray-400">{{ formatCurrency(item.precio_unitario) }}</td>
                        <td class="py-2 text-right font-medium text-gray-900 dark:text-white">{{ formatCurrency(item.subtotal) }}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr class="border-t-2 border-gray-300 dark:border-gray-500">
                        <td colspan="3" class="py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Total:</td>
                        <td class="py-2 text-right font-bold text-primary-600 dark:text-primary-400">{{ formatCurrency(venta.total) }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPaginas > 1" class="flex items-center justify-between">
      <span class="text-sm text-gray-500">
        Página {{ paginaActual }} de {{ totalPaginas }}
      </span>
      <div class="flex gap-2">
        <button 
          @click="paginaActual--" 
          :disabled="paginaActual === 1"
          class="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          ← Anterior
        </button>
        <button 
          @click="paginaActual++"
          :disabled="paginaActual >= totalPaginas"
          class="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Siguiente →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDateTime } from '@/utils/formatters'

interface ItemVenta {
  id: string
  nombre_producto: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

interface Venta {
  id: string
  numero: number
  fecha: string
  total: number
  cliente_nombre: string | null
  metodo_pago: string | null
  vendedor?: { nombre: string } | null
  items: ItemVenta[]
}

// State
const ventas = ref<Venta[]>([])
const loading = ref(false)
const busqueda = ref('')
const fechaInicio = ref('')
const fechaFin = ref('')
const expandedId = ref<string | null>(null)
const campoOrden = ref<'numero' | 'fecha' | 'total'>('fecha')
const ordenAsc = ref(false)
const paginaActual = ref(1)
const itemsPorPagina = 20

// Initialize dates (last 7 days)
const initDates = () => {
  const hoy = new Date()
  const hace7Dias = new Date()
  hace7Dias.setDate(hoy.getDate() - 7)
  
  const formatDate = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  fechaFin.value = formatDate(hoy)
  fechaInicio.value = formatDate(hace7Dias)
}

// Computed
const ventasFiltradas = computed(() => {
  if (!busqueda.value) return ventas.value
  const query = busqueda.value.toLowerCase()
  return ventas.value.filter(v => 
    v.numero.toString().includes(query) ||
    (v.cliente_nombre && v.cliente_nombre.toLowerCase().includes(query)) ||
    (v.vendedor?.nombre && v.vendedor.nombre.toLowerCase().includes(query)) ||
    // Buscar en productos de la venta
    v.items?.some(item => item.nombre_producto.toLowerCase().includes(query))
  )
})

const ventasOrdenadas = computed(() => {
  const sorted = [...ventasFiltradas.value].sort((a, b) => {
    let cmp = 0
    if (campoOrden.value === 'numero') cmp = a.numero - b.numero
    else if (campoOrden.value === 'fecha') cmp = a.fecha.localeCompare(b.fecha)
    else if (campoOrden.value === 'total') cmp = a.total - b.total
    return ordenAsc.value ? cmp : -cmp
  })
  
  // Paginate
  const start = (paginaActual.value - 1) * itemsPorPagina
  return sorted.slice(start, start + itemsPorPagina)
})

const totalFiltrado = computed(() => 
  ventasFiltradas.value.reduce((sum, v) => sum + v.total, 0)
)

const totalPaginas = computed(() => 
  Math.ceil(ventasFiltradas.value.length / itemsPorPagina)
)

// Methods
const formatFecha = (fecha: string) => {
  return formatDateTime(fecha)
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

const ordenarPor = (campo: 'numero' | 'fecha' | 'total') => {
  if (campoOrden.value === campo) {
    ordenAsc.value = !ordenAsc.value
  } else {
    campoOrden.value = campo
    ordenAsc.value = campo !== 'fecha'
  }
}

const seleccionarHoy = () => {
  const hoy = new Date()
  const year = hoy.getFullYear()
  const month = String(hoy.getMonth() + 1).padStart(2, '0')
  const day = String(hoy.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`
  
  fechaInicio.value = todayStr
  fechaFin.value = todayStr
  cargarVentas()
}

const toggleExpand = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id
}

const cargarVentas = async () => {
  if (!fechaInicio.value || !fechaFin.value) return
  
  loading.value = true
  expandedId.value = null
  
  try {
    const startDate = `${fechaInicio.value}T00:00:00`
    const endDate = `${fechaFin.value}T23:59:59`
    
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        id, numero, fecha, total, cliente_nombre, metodo_pago,
        vendedor:usuarios!ventas_vendedor_id_fkey(nombre),
        items:items_venta(id, nombre_producto, cantidad, precio_unitario, subtotal)
      `)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .eq('estado', 'COMPLETADA')
      .order('fecha', { ascending: false })

    if (error) throw error
    
    // Transform data to match interface
    ventas.value = (data || []).map((v: any) => ({
      ...v,
      vendedor: Array.isArray(v.vendedor) ? v.vendedor[0] : v.vendedor
    }))
  } catch (err) {
    console.error('Error cargando ventas:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  initDates()
  cargarVentas()
})
</script>
