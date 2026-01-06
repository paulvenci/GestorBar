<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">Ranking de Productos</h3>
      
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Ordenar por:</label>
        <select 
          v-model="sortBy" 
          @change="processData"
          class="rounded-md border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="quantity">Cantidad Vendida</option>
          <option value="revenue">Ingresos Generados</option>
        </select>
      </div>
    </div>

    <!-- Chart -->
    <div class="h-96 relative">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 z-10">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
      <Bar v-if="chartData.labels && chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
      <div v-else-if="!loading" class="h-full flex items-center justify-center text-gray-500">
        No hay datos suficientes
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Producto</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cantidad</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ingresos</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="(item, index) in topProducts" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ index + 1 }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ item.nombre }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">{{ item.cantidad }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">{{ formatCurrency(item.ingresos) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

const loading = ref(false)
const sortBy = ref('quantity')
const topProducts = ref<any[]>([])
const chartData = ref<any>({ labels: [], datasets: [] })
const rawItems = ref<any[]>([])

const chartOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    x: {
      grid: { color: '#e5e7eb' }
    },
    y: {
      grid: { display: false }
    }
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    // Traer items de venta de los últimos 30 días default
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data, error } = await supabase
      .from('items_venta')
      .select('producto_id, nombre_producto, cantidad, subtotal, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (error) throw error

    rawItems.value = data || []
    processData()

  } catch (err) {
    console.error('Error fetching top products:', err)
  } finally {
    loading.value = false
  }
}

const processData = () => {
  const grouped = new Map<string, { id: string, nombre: string, cantidad: number, ingresos: number }>()

  rawItems.value.forEach(item => {
    const existing = grouped.get(item.producto_id)
    if (existing) {
      existing.cantidad += item.cantidad
      existing.ingresos += item.subtotal
    } else {
      grouped.set(item.producto_id, {
        id: item.producto_id,
        nombre: item.nombre_producto,
        cantidad: item.cantidad,
        ingresos: item.subtotal
      })
    }
  })

  // Convert to array and sort
  const sorted = Array.from(grouped.values()).sort((a, b) => {
    if (sortBy.value === 'quantity') {
      return b.cantidad - a.cantidad
    } else {
      return b.ingresos - a.ingresos
    }
  })

  // Take top 10
  topProducts.value = sorted.slice(0, 10)

  // Chart Data
  chartData.value = {
    labels: topProducts.value.map(p => p.nombre),
    datasets: [{
      label: sortBy.value === 'quantity' ? 'Cantidad Vendida' : 'Ingresos ($)',
      backgroundColor: sortBy.value === 'quantity' ? '#10b981' : '#f59e0b',
      data: topProducts.value.map(p => sortBy.value === 'quantity' ? p.cantidad : p.ingresos),
      borderRadius: 4
    }]
  }
}

onMounted(() => {
  fetchData()
})
</script>
