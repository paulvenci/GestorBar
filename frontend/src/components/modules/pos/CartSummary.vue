<template>
  <div class="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
      <h3 class="font-bold text-lg text-gray-900 dark:text-white">Ticket de Venta</h3>
      <button 
        @click="$emit('clear')"
        class="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
        v-if="cart.length > 0"
      >
        Limpiar Carrito
      </button>
    </div>

    <!-- Cart Items -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-gray-400">
        <span class="text-4xl mb-2">🛒</span>
        <p>Carrito vacío</p>
        <p class="text-sm">Agrega productos para comenzar</p>
      </div>

      <div 
        v-for="item in cart" 
        :key="item.productoId"
        class="flex flex-col p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600 gap-3"
      >
        <div class="flex items-start gap-3">
             <!-- Imagen -->
            <div class="h-16 w-16 flex-shrink-0 bg-gray-200 dark:bg-gray-600 rounded-md overflow-hidden border border-gray-200 dark:border-gray-500">
                <img 
                    v-if="item.foto" 
                    :src="item.foto" 
                    class="h-full w-full object-cover"
                />
                <div v-else class="h-full w-full flex items-center justify-center text-gray-400">
                    <span class="text-xl">🍹</span>
                </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1">
                    {{ item.nombre }}
                </p>
                <p v-if="item.descripcion" class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-1">
                    {{ item.descripcion }}
                </p>
                <p class="text-sm text-primary-600 dark:text-primary-400 font-bold">
                    ${{ formatNumber(item.precioUnitario) }}
                </p>
            </div>

            <!-- Remove Button (Top Right) -->
            <button 
                @click="$emit('remove', item.productoId)"
                class="text-gray-400 hover:text-red-500 transition-colors p-1"
            >
                ✕
            </button>
        </div>

        <!-- Controls Row -->
        <div class="flex items-center justify-between pl-19"> <!-- pl-19 to align with text starts roughly -->
             <!-- Quantity Controls -->
            <div class="flex items-center bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm">
                <button 
                @click="$emit('update-quantity', item.productoId, item.cantidad - 1)"
                class="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-md font-bold"
                >
                -
                </button>
                <span class="px-2 text-sm font-medium min-w-[2rem] text-center text-gray-900 dark:text-white">{{ item.cantidad }}</span>
                <button 
                @click="$emit('update-quantity', item.productoId, item.cantidad + 1)"
                class="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-md font-bold"
                >
                +
                </button>
            </div>

             <!-- Subtotal Item -->
            <div>
                <p class="text-base font-bold text-gray-900 dark:text-white">
                ${{ formatNumber(item.precioUnitario * item.cantidad) }}
                </p>
            </div>
        </div>
      </div>
    </div>

    <!-- Footer: Totals & Action -->
    <div class="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 space-y-3">
      <div class="space-y-1 text-sm">
        <div class="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Subtotal (Neto)</span>
          <span>${{ formatNumber(totals.neto) }}</span>
        </div>
        <div class="flex justify-between text-gray-600 dark:text-gray-400">
          <span>IVA (19%)</span>
          <span>${{ formatNumber(totals.iva) }}</span>
        </div>
        <div class="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
          <span>Total</span>
          <span>${{ formatNumber(totals.total) }}</span>
        </div>
      </div>

      <button
        @click="$emit('checkout')"
        :disabled="cart.length === 0"
        class="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-lg font-bold rounded-lg shadow transition-colors flex justify-center items-center gap-2"
      >
        <span>💰</span> Cobrar ${{ formatNumber(totals.total) }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ItemCarrito } from '@/types/database.types'

defineProps<{
  cart: ItemCarrito[]
  totals: { neto: number, iva: number, total: number }
}>()

defineEmits<{
  (e: 'update-quantity', id: string, quantity: number): void
  (e: 'remove', id: string): void
  (e: 'clear'): void
  (e: 'checkout'): void
}>()

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('es-CL').format(num)
}
</script>
