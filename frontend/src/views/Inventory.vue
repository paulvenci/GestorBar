<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto">
      <div class="md:flex md:items-center md:justify-between mb-6">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            📦 Gestión de Inventario
          </h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Registra entradas, salidas y ajustes de stock.
          </p>
        </div>
        <div class="mt-4 flex md:ml-4 md:mt-0">
          <button
            @click="openMovementModal"
            class="ml-3 inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <span class="mr-2 text-lg">⇄</span> Registrar Movimiento
          </button>
        </div>
      </div>

      <!-- Inventory Stats could go here (e.g. Total Stock Value) -->
      
      <!-- Stock Overview Table -->
      <StockOverview 
         :products="productos" 
         :loading="productosStore.loading"
         @adjust="openAdjustModal"
      />

      <!-- Movement History -->
      <InventoryList :movimientos="movimientos" :loading="loading" />

      <!-- Movement Modal -->
      <StockMovementForm 
        v-if="showModal"
        :products="productos"
        :initial-product-id="selectedProductForAdjust?.id"
        @close="showModal = false"
        @save="onSave"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import AppLayout from '@/components/layout/AppLayout.vue'
import StockOverview from '@/components/modules/inventory/StockOverview.vue' 
import InventoryList from '@/components/modules/inventory/InventoryList.vue'
import StockMovementForm from '@/components/modules/inventory/StockMovementForm.vue'
import { useInventoryStore } from '@/stores/inventory'
import { useProductosStore } from '@/stores/productos'
import type { Producto } from '@/types/database.types'

const inventoryStore = useInventoryStore()
const productosStore = useProductosStore()

const { movimientos, loading } = storeToRefs(inventoryStore) as any 
const { productos } = storeToRefs(productosStore)

const showModal = ref(false)
const selectedProductForAdjust = ref<Producto | null>(null)

onMounted(() => {
  refreshData()
})

const refreshData = () => {
  inventoryStore.fetchMovimientos()
  productosStore.fetchProductos()
}

const openMovementModal = () => {
  selectedProductForAdjust.value = null
  showModal.value = true
}

const openAdjustModal = (product: Producto) => {
  selectedProductForAdjust.value = product
  showModal.value = true
}

const onSave = () => {
  refreshData()
  showModal.value = false
}
</script>
