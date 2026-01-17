<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500/75 transition-opacity" aria-hidden="true" @click="$emit('close')"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="relative z-10 inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4" id="modal-title">
            Registrar Movimiento de Stock
          </h3>
          
          <form @submit.prevent="onSubmit" class="space-y-4">
            <!-- Producto -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Producto</label>
              <!-- Search field -->
              <div class="relative mt-1 mb-2">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="🔍 Buscar producto..."
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                />
              </div>
              <select 
                v-model="form.producto_id"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                required
                size="5"
              >
                <option value="" disabled>Seleccionar producto</option>
                <option v-for="prod in filteredProducts" :key="prod.id" :value="prod.id">
                  {{ prod.nombre }} (Stock: {{ prod.stock_actual }})
                </option>
              </select>
              <p v-if="searchQuery && filteredProducts.length === 0" class="text-sm text-gray-500 mt-1">
                No se encontraron productos
              </p>
            </div>

            <!-- Advertenica Compuesto -->
            <div v-if="selectedProduct?.tipo_producto === 'COMPUESTO'" class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <span class="text-yellow-400">⚠️</span>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-yellow-700">
                    Estás ajustando un <strong>Producto Compuesto</strong> (Trago).
                    Su stock mostrado se calcula automáticamente según sus ingredientes.
                    <br>
                    Si quieres aumentar la disponibilidad, ajusta el stock de sus ingredientes (ej. Pisco, Coca-Cola).
                    <br>
                    Si registras aquí, solo cambiarás el stock físico pre-preparado (si existe).
                  </p>
                </div>
              </div>
            </div>

            <!-- Tipo Movimiento -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Movimiento</label>
              <div class="mt-2 flex gap-4">
                <label class="inline-flex items-center">
                  <input type="radio" v-model="form.tipo_movimiento" value="ENTRADA" class="form-radio text-primary-600">
                  <span class="ml-2 text-gray-700 dark:text-gray-300">Entrada (Compra)</span>
                </label>
                <label class="inline-flex items-center">
                  <input type="radio" v-model="form.tipo_movimiento" value="SALIDA" class="form-radio text-red-600">
                  <span class="ml-2 text-gray-700 dark:text-gray-300">Salida (Merma/Uso)</span>
                </label>
              </div>
            </div>

            <!-- Cantidad -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad</label>
              <input 
                v-model.number="form.cantidad"
                type="number" 
                min="0.01"
                step="0.01"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                required
              />
            </div>

            <!-- Observaciones -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
              <textarea 
                v-model="form.observaciones"
                rows="3"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                placeholder="Ej: Compra proveedor X, Botella rota, etc."
              ></textarea>
            </div>

            <!-- Error -->
            <div v-if="error" class="text-red-600 text-sm">
              {{ error }}
            </div>
          </form>
        </div>
        
        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button 
            @click="onSubmit"
            type="button" 
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
            :disabled="saving"
          >
            {{ saving ? 'Registrar' : 'Guardar' }}
          </button>
          <button 
            @click="$emit('close')"
            type="button" 
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
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
import type { Producto } from '@/types/database.types'
import { useInventoryStore } from '@/stores/inventory'

const props = defineProps<{
  products: Producto[]
  initialProductId?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save'): void
}>()

const inventoryStore = useInventoryStore()
const saving = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')

const form = ref({
  producto_id: '',
  tipo_movimiento: 'ENTRADA' as 'ENTRADA' | 'SALIDA' | 'AJUSTE',
  cantidad: 1,
  observaciones: ''
})

// Filtered products based on search
const filteredProducts = computed(() => {
  if (!searchQuery.value) return props.products
  const query = searchQuery.value.toLowerCase()
  return props.products.filter(p => 
    p.nombre.toLowerCase().includes(query) ||
    (p.codigo && p.codigo.toLowerCase().includes(query))
  )
})

const selectedProduct = computed(() => 
  props.products.find(p => p.id === form.value.producto_id)
)

// Initialize form
if (props.initialProductId) {
  form.value.producto_id = props.initialProductId
  // Si seleccionamos ajustar desde la tabla, probablemente queramos hacer un ajuste, no una compra/entrada por defecto?
  // O quizás entrada es el caso más común. Lo dejamos por defecto o ajustamos lógica?
  // Dejemos entrada por defecto, el usuario elige.
  // Pero si viene de "Stock Actual", "Ajuste" (tipo inventario físico) a veces tiene sentido.
  // Por ahora mantenemos default.
}

const onSubmit = async () => {
  error.value = null
  saving.value = true
  
  try {
    if (!form.value.producto_id) throw new Error('Selecciona un producto')
    if (form.value.cantidad <= 0) throw new Error('Cantidad inválida')

    const result = await inventoryStore.registrarMovimiento(form.value)

    if (!result.success) {
      throw new Error(result.error)
    }

    emit('save')
    emit('close')
  } catch (err: any) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}
</script>
