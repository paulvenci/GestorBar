<template>
  <div class="barcode-scanner">
    <!-- Input invisible para capturar código de barras -->
    <input
      ref="barcodeInput"
      v-model="barcodeBuffer"
      @keydown.enter.prevent="handleBarcodeScanned"
      @blur="refocusBarcodeInput"
      type="text"
      class="fixed -left-[9999px] opacity-0 pointer-events-none"
      aria-label="Escáner de código de barras"
      autocomplete="off"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { Producto } from '@/types/database.types'

interface Props {
  active: boolean
  products: Producto[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'product-found', product: Producto): void
  (e: 'product-not-found', code: string): void
  (e: 'update:active', value: boolean): void
}>()

const barcodeInput = ref<HTMLInputElement | null>(null)
const barcodeBuffer = ref('')

// Mantener focus cuando está activo
const refocusBarcodeInput = () => {
  if (props.active && barcodeInput.value) {
    setTimeout(() => {
      barcodeInput.value?.focus()
    }, 100)
  }
}

// Manejar código escaneado
const handleBarcodeScanned = () => {
  const codigo = barcodeBuffer.value.trim()
  
  if (!codigo) return
  
  console.log('🔍 Código escaneado:', codigo)
  
  // Buscar producto por código
  const producto = props.products.find(p => p.codigo === codigo)
  
  if (producto) {
    console.log('✅ Producto encontrado:', producto.nombre)
    emit('product-found', producto)
  } else {
    console.log('❌ Producto no encontrado:', codigo)
    emit('product-not-found', codigo)
  }
  
  // Limpiar buffer para siguiente escaneo
  barcodeBuffer.value = ''
}

// Watch para activar/desactivar focus
watch(() => props.active, (isActive) => {
  if (isActive) {
    refocusBarcodeInput()
  }
}, { immediate: true })

onMounted(() => {
  if (props.active) {
    refocusBarcodeInput()
  }
})

// Cleanup
onUnmounted(() => {
  barcodeBuffer.value = ''
})
</script>

<style scoped>
/* Asegurar que el input esté completamente oculto pero funcional */
input:focus {
  outline: none;
}
</style>
