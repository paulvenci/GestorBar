<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Ventas Totales -->
    <div class="bg-white dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
      <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Ventas Totales</h3>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-3xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(currentData.total) }}</span>
        <span :class="[
          'text-sm font-medium flex items-center',
          getTrend(currentData.total, previousData.total) >= 0 ? 'text-green-600' : 'text-red-600'
        ]">
          {{ getTrend(currentData.total, previousData.total) > 0 ? '↑' : '↓' }}
          {{ Math.abs(getTrend(currentData.total, previousData.total)).toFixed(1) }}%
        </span>
      </div>
      <p class="mt-1 text-xs text-gray-500">vs. {{ formatCurrency(previousData.total) }} mes anterior</p>
    </div>

    <!-- Transacciones -->
    <div class="bg-white dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
      <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Transacciones</h3>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-3xl font-bold text-gray-900 dark:text-white">{{ currentData.count }}</span>
        <span :class="[
          'text-sm font-medium flex items-center',
          getTrend(currentData.count, previousData.count) >= 0 ? 'text-green-600' : 'text-red-600'
        ]">
          {{ getTrend(currentData.count, previousData.count) > 0 ? '↑' : '↓' }}
          {{ Math.abs(getTrend(currentData.count, previousData.count)).toFixed(1) }}%
        </span>
      </div>
      <p class="mt-1 text-xs text-gray-500">vs. {{ previousData.count }} mes anterior</p>
    </div>

    <!-- Ticket Promedio -->
    <div class="bg-white dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
      <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Ticket Promedio</h3>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-3xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(currentAvg) }}</span>
        <span :class="[
          'text-sm font-medium flex items-center',
          getTrend(currentAvg, previousAvg) >= 0 ? 'text-green-600' : 'text-red-600'
        ]">
          {{ getTrend(currentAvg, previousAvg) > 0 ? '↑' : '↓' }}
          {{ Math.abs(getTrend(currentAvg, previousAvg)).toFixed(1) }}%
        </span>
      </div>
      <p class="mt-1 text-xs text-gray-500">vs. {{ formatCurrency(previousAvg) }} mes anterior</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/formatters'

const loading = ref(false)
const currentData = ref({ total: 0, count: 0 })
const previousData = ref({ total: 0, count: 0 })

const currentAvg = computed(() => currentData.value.count ? currentData.value.total / currentData.value.count : 0)
const previousAvg = computed(() => previousData.value.count ? previousData.value.total / previousData.value.count : 0)

const getTrend = (current: number, previous: number) => {
  if (!previous) return 100
  return ((current - previous) / previous) * 100
}

const fetchData = async () => {
  loading.value = true
  const now = new Date()
  
  // Mes Actual
  const startCurrent = new Date(now.getFullYear(), now.getMonth(), 1)
  const endCurrent = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  
  // Mes Anterior
  const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endPrev = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  try {
    // Fetch Current
    const { data: curr, error: errCurr } = await supabase
      .from('ventas')
      .select('total')
      .gte('fecha', startCurrent.toISOString())
      .lte('fecha', endCurrent.toISOString())
      .eq('estado', 'COMPLETADA')

    if (errCurr) throw errCurr
    
    currentData.value = {
      total: (curr || []).reduce((sum, v) => sum + v.total, 0),
      count: (curr || []).length
    }

    // Fetch Previous
    const { data: prev, error: errPrev } = await supabase
      .from('ventas')
      .select('total')
      .gte('fecha', startPrev.toISOString())
      .lte('fecha', endPrev.toISOString())
      .eq('estado', 'COMPLETADA')

    if (errPrev) throw errPrev

    previousData.value = {
      total: (prev || []).reduce((sum, v) => sum + v.total, 0),
      count: (prev || []).length
    }

  } catch (err) {
    console.error('Error fetching comparisons:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
