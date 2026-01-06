<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500/75 transition-opacity" aria-hidden="true" @click="$emit('close')"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="relative z-10 inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full">
        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <h3 class="text-xl font-bold text-center text-gray-900 dark:text-white mb-6" id="modal-title">
            Finalizar Venta
          </h3>
          
          
          <div class="text-center mb-8">
            <div v-if="discount > 0" class="text-sm text-gray-400 line-through decoration-red-500 mb-1">
               ${{ formatNumber(total) }}
            </div>
            <span class="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total a Pagar</span>
            <div class="text-4xl font-extrabold text-primary-600 dark:text-primary-400 mt-1">
              ${{ formatNumber(finalTotal) }}
            </div>
          </div>

          <div class="space-y-4">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Selecciona Método de Pago</p>
            
            <div class="grid grid-cols-2 gap-3">
              <button 
                @click="paymentMethod = 'EFECTIVO'"
                class="p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                :class="paymentMethod === 'EFECTIVO' 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500' 
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'"
              >
                <span class="text-2xl">💵</span>
                <span class="font-medium">Efectivo</span>
              </button>

              <button 
                @click="paymentMethod = 'TARJETA'"
                class="p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                :class="paymentMethod === 'TARJETA' 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500' 
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'"
              >
                <span class="text-2xl">💳</span>
                <span class="font-medium">Tarjeta</span>
              </button>
              
              <button 
                @click="paymentMethod = 'TRANSFERENCIA'"
                class="p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                :class="paymentMethod === 'TRANSFERENCIA' 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500' 
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'"
              >
                <span class="text-2xl">🏦</span>
                <span class="font-medium">Transferencia</span>
              </button>

               <button 
                @click="paymentMethod = 'CREDITO'"
                class="p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                :class="paymentMethod === 'CREDITO' 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500' 
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'"
              >
                <span class="text-2xl">📝</span>
                <span class="font-medium">Cuenta Cliente</span>
              </button>
            </div>

            <!-- Sección Descuentos -->
             <div class="mt-4 p-4 border rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Descuento</span>
                    <span v-if="discount > 0" class="text-xs font-bold text-green-600">Ahórras ${{ formatNumber(discountAmount) }}</span>
                </div>
                <div class="flex gap-2">
                    <button 
                         v-for="opt in [0, 10, 20, 50]" 
                         :key="opt"
                         @click="selectedDiscountPercent = opt; isCustomDiscount = false"
                         class="px-3 py-1.5 rounded text-sm transition-colors border"
                         :class="selectedDiscountPercent === opt && !isCustomDiscount
                            ? 'bg-blue-100 text-blue-700 border-blue-300 font-bold' 
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'"
                    >
                        {{ opt === 0 ? 'Sin desc.' : `${opt}%` }}
                    </button>
                    <button 
                        @click="isCustomDiscount = true"
                        class="px-3 py-1.5 rounded text-sm transition-colors border"
                         :class="isCustomDiscount
                            ? 'bg-blue-100 text-blue-700 border-blue-300 font-bold' 
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'"
                    >
                        Manual
                    </button>
                </div>
                <div v-if="isCustomDiscount" class="mt-2 flex items-center gap-2">
                    <div class="relative flex-1">
                        <span class="absolute left-2 top-1.5 text-gray-400">$</span>
                        <input 
                            v-model.number="customDiscountAmount" 
                            type="number" 
                            min="0" 
                            :max="total"
                            class="pl-6 w-full text-sm rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                            placeholder="Monto a descontar"
                        />
                    </div>
                </div>
             </div>

            <!-- Calculadora de Vuelto (Solo Efectivo) -->
            <div v-if="paymentMethod === 'EFECTIVO'" class="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg animate-fade-in">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Monto recibio</label>
              <div class="flex gap-2 mb-2">
                 <input 
                  v-model.number="amountReceived"
                  type="number" 
                  class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 text-lg font-bold"
                  placeholder="$0"
                  autofocus
                />
              </div>
              <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <span class="font-medium text-gray-600 dark:text-gray-400">Vuelto:</span>
                <span class="text-xl font-bold" :class="change >= 0 ? 'text-green-600' : 'text-red-600'">
                  ${{ formatNumber(Math.max(0, change)) }}
                </span>
              </div>
            </div>

            <div v-if="paymentMethod === 'CREDITO'" class="mt-4">
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Cliente</label>
                 <input 
                  v-model="clientName"
                  type="text" 
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                  placeholder="Ingrese nombre..."
                />
            </div>
          </div>
        </div>
        
        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
          <button 
            @click="onConfirm"
            type="button" 
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-3 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:w-auto sm:text-lg"
            :disabled="processing || (paymentMethod === 'EFECTIVO' && amountReceived < finalTotal)"
          >
            {{ processing ? 'Procesando...' : 'Confirmar Pago' }}
          </button>
          <button 
            @click="$emit('close')"
            type="button" 
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  total: number
  processing: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', method: string, client?: string, discount?: number): void
}>()

const paymentMethod = ref<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CREDITO'>('EFECTIVO')
const amountReceived = ref(0)
const clientName = ref('')

// Discount Logic
const selectedDiscountPercent = ref(0)
const isCustomDiscount = ref(false)
const customDiscountAmount = ref(0)

const discountAmount = computed(() => {
    if (isCustomDiscount.value) {
        return Math.min(customDiscountAmount.value, props.total)
    }
    return Math.round(props.total * (selectedDiscountPercent.value / 100))
})

const finalTotal = computed(() => Math.max(0, props.total - discountAmount.value))
const discount = computed(() => discountAmount.value)

const change = computed(() => {
  return amountReceived.value - finalTotal.value
})

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('es-CL').format(num)
}

const onConfirm = () => {
    emit('confirm', paymentMethod.value, clientName.value, discountAmount.value)
}
</script>
