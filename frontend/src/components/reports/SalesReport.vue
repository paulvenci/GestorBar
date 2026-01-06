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
      <Line v-if="chartData.labels && chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
      <div v-else-if="!loading" class="h-full flex items-center justify-center text-gray-500">
        No hay datos para el período seleccionado
      </div>
    </div>

    <!-- Summary Table -->
    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
             <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ventas</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="row in summaryData" :key="row.fecha" class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{{ formatDate(row.fecha) }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{{ row.count }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">{{ formatCurrency(row.total) }}</td>
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
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/utils/formatters'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const loading = ref(false)
const rangeType = ref('week')
const customStart = ref('')
const customEnd = ref('')
const chartData = ref<any>({ labels: [], datasets: [] })
const summaryData = ref<any[]>([])
const totalPeriodo = ref(0)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: '#e5e7eb'
      }
    },
    x: {
        grid: {
            display: false
        }
    }
  }
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
        fetchData(new Date(customStart.value), new Date(customEnd.value))
    }
}

const fetchData = async (startDate: Date, endDate: Date) => {
    loading.value = true
    try {
        // Ajustar endDate a final del día
        const end = new Date(endDate)
        end.setHours(23, 59, 59)
        const startIso = startDate.toISOString()
        const endIso = end.toISOString()

        // Consultamos directo la tabla de ventas para asegurar datos consistentes
        const { data: ventasData, error } = await supabase
            .from('ventas')
            .select('fecha, total, estado')
            .gte('fecha', startIso)
            .lte('fecha', endIso)
            .eq('estado', 'COMPLETADA') // Solo ventas completadas
            .order('fecha', { ascending: true })

        if (error) throw error

        // Procesar datos en Frontend: Agrupar por día
        const dailyMap = new Map<string, number>()
        const rawData = ventasData || []

        rawData.forEach(venta => {
            // Extraer fecha corta YYYY-MM-DD
            const fechaCorta = venta.fecha.split('T')[0]
            const currentTotal = dailyMap.get(fechaCorta) || 0
            dailyMap.set(fechaCorta, currentTotal + (Number(venta.total) || 0))
        })

        // Convertir Map a Array ordenado
        const processedData = Array.from(dailyMap.entries())
            .map(([fecha, total]) => ({
                fecha,
                count: rawData.filter(v => v.fecha.startsWith(fecha)).length, // Contar txs del día
                total
            }))
            .sort((a, b) => a.fecha.localeCompare(b.fecha))

        summaryData.value = processedData
        
        // Totales Globales
        // Asegurar que sumamos números válidos para evitar NaN
        totalPeriodo.value = processedData.reduce((sum, row) => sum + (Number(row.total) || 0), 0)

        // Chart Data
        const labels = processedData.map(row => formatDate(row.fecha).split(',')[0])
        const values = processedData.map(row => row.total)

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
