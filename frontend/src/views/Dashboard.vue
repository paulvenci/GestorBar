<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        📊 Dashboard
      </h1>
      
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">Cargando datos...</p>
        </div>
      </div>

      <!-- Dashboard Content -->
      <div v-else>
        <!-- KPIs Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Productos"
            :value="totalProductos"
            icon="📦"
            format="number"
            subtitle="Productos activos"
          />
          
          <KPICard
            title="Stock Bajo"
            :value="productosStockBajo"
            icon="⚠️"
            format="number"
            :type="productosStockBajo > 0 ? 'warning' : 'success'"
            :alert="productosStockBajo > 0 ? `${productosStockBajo} productos requieren reposición` : undefined"
          />
          
          <KPICard
            title="Ventas de Hoy"
            :value="ventasHoy"
            icon="💰"
            format="number"
            type="success"
            subtitle="Transacciones completadas"
          />
          
          <KPICard
            title="Ganancias de Hoy"
            :value="gananciasHoy"
            icon="💵"
            format="currency"
            type="success"
            :subtitle="`Total recaudado: ${formatCurrency(totalRecaudado)}`"
          />
        </div>

        <!-- Quick Actions -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Acceso Rápido
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <router-link
              to="/pos"
              class="flex items-center gap-3 px-4 py-3 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors group"
            >
              <span class="text-3xl">💰</span>
              <div>
                <p class="font-semibold text-primary-700 dark:text-primary-300">Nueva Venta</p>
                <p class="text-sm text-primary-600 dark:text-primary-400">Ir al POS</p>
              </div>
            </router-link>

            <router-link
              to="/productos"
              class="flex items-center gap-3 px-4 py-3 bg-secondary-50 dark:bg-secondary-900/20 hover:bg-secondary-100 dark:hover:bg-secondary-900/30 rounded-lg transition-colors group"
            >
              <span class="text-3xl">🛍️</span>
              <div>
                <p class="font-semibold text-secondary-700 dark:text-secondary-300">Gestionar Productos</p>
                <p class="text-sm text-secondary-600 dark:text-secondary-400">Ver catálogo</p>
              </div>
            </router-link>

            <router-link
              to="/inventario"
              class="flex items-center gap-3 px-4 py-3 bg-accent-50 dark:bg-accent-900/20 hover:bg-accent-100 dark:hover:bg-accent-900/30 rounded-lg transition-colors group"
            >
              <span class="text-3xl">📦</span>
              <div>
                <p class="font-semibold text-accent-700 dark:text-accent-300">Entrada de Stock</p>
                <p class="text-sm text-accent-600 dark:text-accent-400">Gestionar inventario</p>
              </div>
            </router-link>

            <router-link
              to="/reportes"
              class="flex items-center gap-3 px-4 py-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors group"
            >
              <span class="text-3xl">📈</span>
              <div>
                <p class="font-semibold text-purple-700 dark:text-purple-300">Ver Reportes</p>
                <p class="text-sm text-purple-600 dark:text-purple-400">Análisis de ventas</p>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Products with Low Stock -->
        <div v-if="productosConStockBajo.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>⚠️</span>
            <span>Productos con Stock Bajo</span>
          </h2>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Producto
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Código
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock Actual
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock Mínimo
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="producto in productosConStockBajo" :key="producto.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ producto.nombre }}
                    </div>
                    <div v-if="producto.categoria" class="text-xs text-gray-500 dark:text-gray-400">
                      {{ producto.categoria.nombre }}
                    </div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ producto.codigo }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                      {{ producto.stock_actual }}
                    </span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ producto.stock_minimo }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-4">
            <router-link
              to="/inventario"
              class="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
            >
              Reabastecer Stock →
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import AppLayout from '@/components/layout/AppLayout.vue'
import KPICard from '@/components/dashboard/KPICard.vue'
import { useProductosStore } from '@/stores/productos'
import { useVentasStore } from '@/stores/ventas'
import { formatCurrency } from '@/utils/formatters'

const productosStore = useProductosStore()
const ventasStore = useVentasStore()

const { productosConStockBajo, productosActivos } = storeToRefs(productosStore)
const loading = ref(true)

const totalProductos = computed(() => productosActivos.value.length)
const productosStockBajo = computed(() => productosConStockBajo.value.length)
const ventasHoy = computed(() => ventasStore.totalVentasHoy)
const gananciasHoy = computed(() => ventasStore.gananciaHoy)
const totalRecaudado = computed(() => ventasStore.totalRecaudadoHoy)

onMounted(async () => {
  loading.value = true
  await Promise.all([
    productosStore.fetchProductos(),
    productosStore.fetchCategorias(),
    ventasStore.fetchVentasHoy()
  ])
  loading.value = false
})
</script>
