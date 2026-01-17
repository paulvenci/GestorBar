<template>
  <div class="space-y-6">
    <!-- Controls -->
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Rango:</label>
        <select 
          v-model="rangeType" 
          @change="updateRange"
          class="rounded-md border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="week">Última Semana</option>
          <option value="month">Mes Actual</option>
          <option value="year">Año Actual</option>
          <option value="custom">Personalizado</option>
        </select>
      </div>
      
      <div v-if="rangeType === 'custom'" class="flex items-center gap-2">
        <input type="date" v-model="customStart" class="rounded-md border-gray-300 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
        <span class="text-gray-500">-</span>
        <input type="date" v-model="customEnd" class="rounded-md border-gray-300 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
        <button @click="loadData" class="px-3 py-1 bg-primary-600 text-white rounded text-sm">Aplicar</button>
      </div>

      <div class="text-right">
        <p class="text-sm text-gray-500 dark:text-gray-400">Total Período</p>
        <p class="text-xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(totalPeriodo) }}</p>
      </div>
    </div>

    <!-- Chart -->
    <div class="h-80 relative">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 z-10">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
      <Bar v-if="chartData.labels && chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
      <div v-else-if="!loading" class="h-full flex items-center justify-center text-gray-500">
        No hay datos para el período seleccionado
      </div>
    </div>

    <!-- Two Column Layout for Tables -->
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Daily Summary Table -->
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">📅 Resumen por Día</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Haz clic en un día para ver sus productos</p>
        <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                <th 
                  @click="sortDailyBy('fecha')" 
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Fecha {{ dailySortField === 'fecha' ? (dailySortAsc ? '↑' : '↓') : '' }}
                </th>
                <th 
                  @click="sortDailyBy('count')" 
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Ventas {{ dailySortField === 'count' ? (dailySortAsc ? '↑' : '↓') : '' }}
                </th>
                <th 
                  @click="sortDailyBy('total')" 
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Total {{ dailySortField === 'total' ? (dailySortAsc ? '↑' : '↓') : '' }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr 
                v-for="row in sortedSummaryData" 
                :key="row.fecha" 
                @click="selectDay(row.fecha)"
                class="cursor-pointer transition-colors"
                :class="selectedDay === row.fecha 
                  ? 'bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'"
              >
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ row.fecha.split('-').reverse().join('-') }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{{ row.count }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">{{ formatCurrency(row.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Product Breakdown Table -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            📦 Desglose por Producto
          </h3>
          <span v-if="selectedDay" class="text-sm text-primary-600 dark:text-primary-400 font-medium">
            {{ selectedDay.split('-').reverse().join('-') }}
            <button @click="clearDaySelection" class="ml-2 text-gray-400 hover:text-gray-600">✕</button>
          </span>
          <span v-else class="text-xs text-gray-500 dark:text-gray-400">Todo el período</span>
        </div>
        <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                <th 
                  @click="sortProductsBy('nombre')" 
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Producto {{ productSortField === 'nombre' ? (productSortAsc ? '↑' : '↓') : '' }}
                </th>
                <th 
                  @click="sortProductsBy('cantidad')" 
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Cantidad {{ productSortField === 'cantidad' ? (productSortAsc ? '↑' : '↓') : '' }}
                </th>
                <th 
                  @click="sortProductsBy('total')" 
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Total {{ productSortField === 'total' ? (productSortAsc ? '↑' : '↓') : '' }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="producto in sortedProductos" :key="producto.nombre" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{{ producto.nombre }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{{ producto.cantidad }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">{{ formatCurrency(producto.total) }}</td>
              </tr>
              <tr v-if="displayedProducts.length === 0 && !loading">
                <td colspan="3" class="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  Sin productos en el período
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Individual Sales with Time (shown when a day is selected) -->
    <div v-if="selectedDay" class="mt-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          🕐 Ventas del {{ selectedDay.split('-').reverse().join('-') }}
        </h3>
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ ventasDelDia.length }} transacciones
        </span>
      </div>
      <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Hora</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Productos</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="(venta, index) in ventasDelDia" :key="index" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {{ formatHora(venta.fecha) }}
              </td>
              <td class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                {{ venta.items?.length || 0 }} items
              </td>
              <td class="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(venta.total) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/formatters'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface ProductoVendido {
  nombre: string
  cantidad: number
  total: number
}

interface VentaConItems {
  fecha: string
  total: number
  estado: string
  items: Array<{
    nombre_producto: string
    cantidad: number
    subtotal: number
  }>
}

const loading = ref(false)
const rangeType = ref('week')
const customStart = ref('')
const customEnd = ref('')
const chartData = ref<any>({ labels: [], datasets: [] })
const summaryData = ref<any[]>([])
const allVentas = ref<VentaConItems[]>([])
const totalPeriodo = ref(0)

// Day selection
const selectedDay = ref<string | null>(null)

// Sorting state for daily table
const dailySortField = ref<'fecha' | 'count' | 'total'>('fecha')
const dailySortAsc = ref(false)

// Sorting state for products table
const productSortField = ref<'nombre' | 'cantidad' | 'total'>('total')
const productSortAsc = ref(false)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#e5e7eb' }
    },
    x: {
      grid: { display: false }
    }
  }
}

// Computed: sorted daily data
const sortedSummaryData = computed(() => {
  const data = [...summaryData.value]
  data.sort((a, b) => {
    let cmp = 0
    if (dailySortField.value === 'fecha') {
      cmp = a.fecha.localeCompare(b.fecha)
    } else if (dailySortField.value === 'count') {
      cmp = a.count - b.count
    } else {
      cmp = a.total - b.total
    }
    return dailySortAsc.value ? cmp : -cmp
  })
  return data
})

// Computed: products to display (filtered by selected day or all)
const displayedProducts = computed((): ProductoVendido[] => {
  const productMap = new Map<string, { cantidad: number, total: number }>()
  
  const ventasToProcess = selectedDay.value
    ? allVentas.value.filter(v => v.fecha && v.fecha.startsWith(selectedDay.value!))
    : allVentas.value

  for (const venta of ventasToProcess) {
    if (venta.items && Array.isArray(venta.items)) {
      for (const item of venta.items) {
        const nombre = item.nombre_producto || 'Sin nombre'
        const existing = productMap.get(nombre) || { cantidad: 0, total: 0 }
        productMap.set(nombre, {
          cantidad: existing.cantidad + (Number(item.cantidad) || 0),
          total: existing.total + (Number(item.subtotal) || 0)
        })
      }
    }
  }

  return Array.from(productMap.entries()).map(([nombre, data]) => ({
    nombre,
    cantidad: data.cantidad,
    total: data.total
  }))
})

// Computed: sorted products
const sortedProductos = computed(() => {
  const data = [...displayedProducts.value]
  data.sort((a, b) => {
    let cmp = 0
    if (productSortField.value === 'nombre') {
      cmp = a.nombre.localeCompare(b.nombre)
    } else if (productSortField.value === 'cantidad') {
      cmp = a.cantidad - b.cantidad
    } else {
      cmp = a.total - b.total
    }
    return productSortAsc.value ? cmp : -cmp
  })
  return data
})

// Sort handlers
const sortDailyBy = (field: 'fecha' | 'count' | 'total') => {
  if (dailySortField.value === field) {
    dailySortAsc.value = !dailySortAsc.value
  } else {
    dailySortField.value = field
    dailySortAsc.value = field === 'fecha' // Fecha ascending by default
  }
}

const sortProductsBy = (field: 'nombre' | 'cantidad' | 'total') => {
  if (productSortField.value === field) {
    productSortAsc.value = !productSortAsc.value
  } else {
    productSortField.value = field
    productSortAsc.value = field === 'nombre' // Nombre ascending by default
  }
}

// Day selection
const selectDay = (fecha: string) => {
  selectedDay.value = selectedDay.value === fecha ? null : fecha
}

const clearDaySelection = () => {
  selectedDay.value = null
}

// Computed: ventas del día seleccionado
const ventasDelDia = computed(() => {
  if (!selectedDay.value) return []
  return allVentas.value
    .filter(v => v.fecha && v.fecha.startsWith(selectedDay.value!))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
})

// Format hora from fecha
const formatHora = (fecha: string) => {
  const date = new Date(fecha)
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

const updateRange = () => {
  const today = new Date()
  const start = new Date()
  
  if (rangeType.value === 'week') {
    start.setDate(today.getDate() - 7)
    fetchData(start, today)
  } else if (rangeType.value === 'month') {
    start.setDate(1)
    fetchData(start, today)
  } else if (rangeType.value === 'year') {
    start.setMonth(0, 1)
    fetchData(start, today)
  }
}

const loadData = () => {
  if (customStart.value && customEnd.value) {
    // Parsear fechas directamente para evitar problemas de timezone
    // customStart y customEnd vienen como 'YYYY-MM-DD' desde input type="date"
    const startParts = customStart.value.split('-').map(Number)
    const endParts = customEnd.value.split('-').map(Number)
    
    const startYear = startParts[0] || 2026
    const startMonth = startParts[1] || 1
    const startDay = startParts[2] || 1
    const endYear = endParts[0] || 2026
    const endMonth = endParts[1] || 1
    const endDay = endParts[2] || 1
    
    // Crear fechas usando la hora local (no UTC)
    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0)
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59)
    
    fetchData(start, end)
  }
}

const fetchData = async (startDate: Date, endDate: Date) => {
  loading.value = true
  selectedDay.value = null
  
  try {
    const formatLocalDate = (date: Date, endOfDay = false) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const time = endOfDay ? 'T23:59:59' : 'T00:00:00'
      return `${year}-${month}-${day}${time}`
    }
    
    const startIso = formatLocalDate(startDate)
    const endIso = formatLocalDate(endDate, true)

    const { data: ventasData, error } = await supabase
      .from('ventas')
      .select(`
        fecha, 
        total, 
        estado,
        items:items_venta(nombre_producto, cantidad, subtotal)
      `)
      .gte('fecha', startIso)
      .lte('fecha', endIso)
      .eq('estado', 'COMPLETADA')
      .order('fecha', { ascending: true })

    if (error) throw error

    allVentas.value = (ventasData || []) as VentaConItems[]

    // Process daily summary
    const dailyMap = new Map<string, { count: number, total: number }>()

    for (const venta of allVentas.value) {
      if (!venta.fecha) continue
      
      const fechaCorta = typeof venta.fecha === 'string' 
        ? (venta.fecha.split('T')[0] as string)
        : (new Date(venta.fecha).toISOString().split('T')[0] as string)
      
      const existing = dailyMap.get(fechaCorta) || { count: 0, total: 0 }
      dailyMap.set(fechaCorta, {
        count: existing.count + 1,
        total: existing.total + (Number(venta.total) || 0)
      })
    }

    summaryData.value = Array.from(dailyMap.entries())
      .map(([fecha, data]) => ({ fecha, count: data.count, total: data.total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))

    totalPeriodo.value = summaryData.value.reduce((sum, row) => sum + row.total, 0)

    // Chart - formatear fechas directamente para evitar problemas de timezone
    const labels = summaryData.value.map(row => {
      // row.fecha viene como 'YYYY-MM-DD'
      const [, month, day] = row.fecha.split('-')
      return `${day}-${month}` // Formato DD-MM para el gráfico
    })
    const values = summaryData.value.map(row => row.total)

    chartData.value = {
      labels,
      datasets: [{
        label: 'Ventas ($)',
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        data: values,
        tension: 0.3,
        fill: true
      }]
    }
  } catch (err) {
    console.error('Error fetching report:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  updateRange()
})
</script>


