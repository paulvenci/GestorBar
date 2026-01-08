<template>
  <AppLayout>
    <!-- Barcode Scanner Component (invisible) -->
    <BarcodeScanner
      :active="barcodeModeActive"
      :products="productos"
      @product-found="handleProductScanned"
      @product-not-found="handleBarcodeError"
    />

    <div class="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-4 max-w-7xl mx-auto overflow-hidden">
      <!-- Left Panel: Products -->
      <div class="flex-1 min-w-0 h-1/2 md:h-full overflow-auto">
         <ProductGrid 
            :products="productos"
            :categories="categorias"
            :loading="loadingProducts"
            @add-to-cart="posStore.addToCart"
         />
      </div>

      <!-- Right Panel: Cart -->
      <div class="w-full md:w-96 h-1/2 md:h-full flex-shrink-0 flex flex-col">
          <!-- Table Header -->
          <div v-if="posStore.activeTableId" class="bg-blue-50 border-b border-blue-100 p-3 flex justify-between items-center shrink-0">
             <div class="flex items-center gap-2">
                <span class="bg-blue-600 text-white rounded-md px-2 py-1 text-sm font-bold">Mesa {{ posStore.activeTableNumber }}</span>
                <span class="text-xs text-blue-600" v-if="cart.length > 0">({{ cart.length }} items)</span>
             </div>
             <button @click="router.push('/mesas')" class="text-sm text-gray-500 hover:text-gray-700 underline">
                Volver
             </button>
          </div>

         <div class="flex-1 min-h-0 overflow-hidden">
             <CartSummary 
                :cart="cart"
                :totals="cartTotals"
                @update-quantity="posStore.updateQuantity"
                @remove="posStore.removeFromCart"
                @clear="posStore.clearCart"
                @checkout="openCheckout"
             />
         </div>

         <!-- Table Actions -->
         <div v-if="posStore.activeTableId" class="p-3 bg-white border-t border-gray-100 shrink-0 grid grid-cols-1 gap-2">
             <button 
                @click="handleParkOrder" 
                :disabled="cart.length === 0 || processingSale"
                class="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <span>📌</span> Guardar Comanda
             </button>
             <button 
                @click="handleCancelTable" 
                :disabled="processingSale"
                class="w-full py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                <span>🚫</span> Liberar Mesa
             </button>
          </div>
      </div>

      <!-- Payment Modal -->
      <PaymentModal 
        v-if="showPaymentModal"
        :total="cartTotals.total"
        :processing="processingSale"
        @close="showPaymentModal = false"
        @confirm="processPayment"
      />

      <!-- Receipt Modal -->
      <ReceiptModal
        v-if="showReceiptModal && lastTransaction"
        :transaction-data="lastTransaction"
        @close="closeReceipt"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import ProductGrid from '@/components/modules/pos/ProductGrid.vue'
import CartSummary from '@/components/modules/pos/CartSummary.vue'
import PaymentModal from '@/components/modules/pos/PaymentModal.vue'
import ReceiptModal from '@/components/modules/pos/ReceiptModal.vue'
import BarcodeScanner from '@/components/modules/pos/BarcodeScanner.vue'

import { useProductosStore } from '@/stores/productos'
import { usePOSStore } from '@/stores/pos'
import { useToast } from '@/composables/useToast'
import { useBarcodeScanner } from '@/composables/useBarcodeScanner'
import type { Producto } from '@/types/database.types'
// import type { Venta } from '@/types/database.types'

const productosStore = useProductosStore()
const posStore = usePOSStore()
const router = useRouter()

const { productos, categorias, loading: loadingProducts } = storeToRefs(productosStore)
const { cart, cartTotals } = storeToRefs(posStore)
const toast = useToast()

const showPaymentModal = ref(false)
const processingSale = ref(false)

const showReceiptModal = ref<any>(null)
const lastTransaction = ref<any>(null)

// Barcode Scanner State (shared composable)
const { isActive: barcodeModeActive } = useBarcodeScanner()

onMounted(() => {
  productosStore.fetchProductos()
  productosStore.fetchCategorias()
})

// Handle Product Scanned
const handleProductScanned = (product: Producto) => {
  posStore.addToCart(product)
  toast.success(`✅ ${product.nombre} agregado`, 2000)
}

// Handle Barcode Error
const handleBarcodeError = (code: string) => {
  toast.error(`❌ Código no encontrado: ${code}`, 3000)
}

const openCheckout = () => {
  showPaymentModal.value = true
}

const processPayment = async (method: any, client?: string /*, discount: number = 0*/) => {
  processingSale.value = true
  // Capturamos una copia de los items antes de limpiar el carrito, ya que el result.data de la venta podría no traerlos populados completamente dependiendo de la query
  // Sin embargo, posStore.processSale retorna "items" si hacemos el insert. 
  // Mejor estrategia: la store nos devuelve el objeto venta completo?
  // La store `processSale` actual retorna { success: true, data: ventaData }. ventaData es solo la cabecera.
  // Necesitamos recomponer los items para el ticket.
  
  const currentCartItems = [...cart.value]
  const result = await posStore.processSale(method, client)
  processingSale.value = false
  
  if (result.success && result.data) {
    showPaymentModal.value = false
    
    // Preparar datos para recibo
    lastTransaction.value = {
        ...result.data,
        items: currentCartItems.map(i => ({
            id: i.productoId,
            cantidad: i.cantidad,
            nombre_producto: i.nombre,
            subtotal: i.precioUnitario * i.cantidad
        }))
    }
    
    // Si es mesa, redirigimos a mesas al cerrar?
    // O le damos la opción de seguir?
    // Generalmente al cobrar un ticket de mesa, la mesa se libera.
    // El store processSale ya libera la mesa en DB (al pasar a COMPLETADA).
    // Y el store limpia activeTableId?
    // pos.ts: if (this.activeTableId) { this.setActiveTable(null, null) }
    // Así que visualmente saldrá del "modo mesa".
    
    // Mostrar recibo
    showReceiptModal.value = true
    
  } else {
    alert('Error al procesar venta: ' + result.error)
  }
}

const handleParkOrder = async () => {
    processingSale.value = true
    const result = await posStore.parkOrder()
    processingSale.value = false
    
    if (result.success) {
        // Redirigir a mesas
        router.push('/mesas')
    } else {
        alert('Error al guardar comanda: ' + result.error)
    }
}

const handleCancelTable = async () => {
    if (!confirm('¿Liberar mesa? Si hay pedidos guardados, se marcarán como cancelados.')) return
    
    processingSale.value = true
    const result = await posStore.cancelTableOrder()
    processingSale.value = false
    
    if (result.success) {
        router.push('/mesas')
    } else {
        alert('Error al liberar mesa: ' + result.error)
    }
}

const closeReceipt = () => {
    showReceiptModal.value = false
    lastTransaction.value = null
}
</script>
