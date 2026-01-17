<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Reportes y Estadísticas</h1>

      <!-- Tabs Navigation -->
      <div class="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav class="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="currentTab = tab.id"
            :class="[
              currentTab === tab.id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors'
            ]"
          >
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Tab Content Placeholder -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 min-h-[400px]">
        <div v-if="currentTab === 'ventas-hoy'">
          <VentasHoyReport />
        </div>
        
        <div v-else-if="currentTab === 'cierre-caja'">
          <CashRegisterCloseReport />
        </div>
        
        <div v-else-if="currentTab === 'historial'">
          <VentasHistorialTable />
        </div>
        
        <div v-else-if="currentTab === 'sales'">
          <SalesReport />
        </div>
        
        <div v-else-if="currentTab === 'top-products'">
          <TopProductsReport />
        </div>

        <div v-else-if="currentTab === 'comparison'">
          <MonthlyComparisonReport />
        </div>
        
        <div v-else-if="currentTab === 'stale'">
          <StaleProductsReport />
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import VentasHoyReport from '@/components/reports/VentasHoyReport.vue'
import CashRegisterCloseReport from '@/components/reports/CashRegisterCloseReport.vue'
import VentasHistorialTable from '@/components/reports/VentasHistorialTable.vue'
import SalesReport from '@/components/reports/SalesReport.vue'
import TopProductsReport from '@/components/reports/TopProductsReport.vue'
import MonthlyComparisonReport from '@/components/reports/MonthlyComparisonReport.vue'
import StaleProductsReport from '@/components/reports/StaleProductsReport.vue'

const tabs = [
  { id: 'ventas-hoy', name: '📋 Ventas del Día' },
  { id: 'cierre-caja', name: '💰 Cierre de Caja' },
  { id: 'historial', name: '📜 Historial Detallado' },
  { id: 'sales', name: '📊 Gráfico Ventas' },
  { id: 'top-products', name: 'Productos Top' },
  { id: 'comparison', name: 'Comparativa Mensual' },
  { id: 'stale', name: 'Sin Rotación' }
]

const currentTab = ref('ventas-hoy')
</script>



