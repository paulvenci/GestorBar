<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">Productos Sin Rotación (Estancados)</h3>
      
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Mostrar productos sin ventas en:</label>
        <select 
          v-model="daysThreshold" 
          @change="fetchData"
          class="rounded-md border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option :value="15">Últimos 15 días</option>
          <option :value="30">Últimos 30 días</option>
          <option :value="60">Últimos 60 días</option>
          <option :value="90">Últimos 90 días</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Producto</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Categoría</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock Inmovilizado</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valor Inventario</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="item in staleProducts" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              {{ item.nombre }}
              <span class="block text-xs text-gray-500">{{ item.codigo }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ item.categoria?.nombre || 'Sin categoría' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
              <span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                {{ item.stock_actual }} un
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
              {{ formatCurrency(item.stock_actual * item.valor_costo) }}
            </td>
          </tr>
          <tr v-if="staleProducts.length === 0 && !loading">
            <td colspan="4" class="px-6 py-8 text-center text-gray-500">
              ¡Excelente! Todos tus productos tienen movimiento reciente.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/formatters'

const loading = ref(false)
const daysThreshold = ref(30)
const staleProducts = ref<any[]>([])

const fetchData = async () => {
  loading.value = true
  try {
    // 1. Obtener lista de IDs de productos vendidos en el periodo
    const dateLimit = new Date()
    dateLimit.setDate(dateLimit.getDate() - daysThreshold.value)

    const { data: soldItems, error: soldError } = await supabase
      .from('items_venta')
      .select(`
        producto_id,
        ventas!inner(fecha, estado)
      `)
      .gte('ventas.fecha', dateLimit.toISOString())
      .eq('ventas.estado', 'COMPLETADA')

    if (soldError) throw soldError

    const soldIds = new Set(soldItems?.map(i => i.producto_id) || [])

    // 2. Traer productos que NO estén en esa lista y tengan stock > 0
    const { data: allProducts, error: prodError } = await supabase
      .from('productos')
      .select('*, categoria:categorias(nombre)')
      .gt('stock_actual', 0) // Solo nos preocupa lo que tenemos en bodega ocupando espacio
      .eq('activo', true)
    
    if (prodError) throw prodError

    // Filtrar en memoria (Supabase no tiene easy "NOT IN" con subquery compleja en cliente JS simple)
    staleProducts.value = allProducts.filter(p => !soldIds.has(p.id))

  } catch (err) {
    console.error('Error fetching stale products:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
