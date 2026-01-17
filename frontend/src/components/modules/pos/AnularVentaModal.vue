<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="$emit('close')">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          ⚠️ Anular Venta #{{ venta.numero }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Total: {{ formatCurrency(venta.total) }} - {{ formatFecha(venta.fecha) }}
        </p>
      </div>

      <!-- Content -->
      <div class="px-6 py-4 space-y-4">
        <!-- Error Message -->
        <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
          <p class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
        </div>

        <!-- Motivo de anulación -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Motivo de anulación *
          </label>
          <select 
            v-model="motivoSeleccionado"
            class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Seleccionar motivo...</option>
            <option v-for="motivo in motivosPredefinidos" :key="motivo" :value="motivo">
              {{ motivo }}
            </option>
            <option value="OTRO">Otro (especificar)</option>
          </select>
        </div>

        <!-- Motivo personalizado -->
        <div v-if="motivoSeleccionado === 'OTRO'">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Especificar motivo *
          </label>
          <input 
            v-model="motivoPersonalizado"
            type="text"
            placeholder="Escribir motivo..."
            class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>

        <!-- Autorización -->
        <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            🔐 PIN de Autorización (Administrador)
          </label>
          <input 
            v-model="pinAutorizacion"
            type="password"
            maxlength="4"
            placeholder="****"
            class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 text-center text-2xl tracking-widest"
            @keyup.enter="confirmarAnulacion"
          />
          <p class="text-xs text-gray-500 mt-1">
            Ingrese el PIN de un usuario con permiso de anulación
          </p>
        </div>

        <!-- Info de devolución -->
        <div class="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md">
          <p class="text-sm text-blue-700 dark:text-blue-300">
            ℹ️ Al anular, el stock de los productos será devuelto automáticamente.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        <button 
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          Cancelar
        </button>
        <button 
          @click="confirmarAnulacion"
          :disabled="!puedeAnular || procesando"
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span v-if="procesando" class="animate-spin">⏳</span>
          {{ procesando ? 'Procesando...' : 'Anular Venta' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useProductosStore } from '@/stores/productos'
import { formatCurrency } from '@/utils/formatters'

interface VentaParaAnular {
  id: string
  numero: number
  total: number
  fecha: string
  items?: Array<{
    producto_id: string
    cantidad: number
    nombre_producto: string
  }>
}

const props = defineProps<{
  venta: VentaParaAnular
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'anulada'): void
}>()

const authStore = useAuthStore()
const productosStore = useProductosStore()

// State
const motivoSeleccionado = ref('')
const motivoPersonalizado = ref('')
const pinAutorizacion = ref('')
const error = ref('')
const procesando = ref(false)

// Motivos predefinidos
const motivosPredefinidos = [
  'Error en el precio',
  'Cliente no pagó',
  'Venta duplicada',
  'Error de producto',
  'Devolución de cliente',
  'Pedido incompleto'
]

// Computed
const motivoFinal = computed(() => {
  if (motivoSeleccionado.value === 'OTRO') {
    return motivoPersonalizado.value.trim()
  }
  return motivoSeleccionado.value
})

const puedeAnular = computed(() => {
  return motivoFinal.value.length > 0 && pinAutorizacion.value.length === 4
})

// Methods
const formatFecha = (fecha: string) => {
  const date = new Date(fecha)
  return date.toLocaleDateString('es-CL', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const confirmarAnulacion = async () => {
  if (!puedeAnular.value) return
  
  error.value = ''
  procesando.value = true

  try {
    // 1. Verificar PIN y permiso del autorizador
    const { data: autorizador, error: authError } = await supabase
      .from('usuarios')
      .select('id, nombre, rol:roles(permisos:rol_permisos(permiso:permisos(codigo)))')
      .eq('pin', pinAutorizacion.value)
      .eq('activo', true)
      .single()

    if (authError || !autorizador) {
      error.value = 'PIN inválido o usuario no encontrado'
      procesando.value = false
      return
    }

    // Verificar permiso ventas.anular
    const rol = autorizador.rol as any
    const permisosRol = rol?.permisos || []
    const permisos = permisosRol.flatMap((p: any) => p.permiso?.codigo || [])
    if (!permisos.includes('ventas.anular')) {
      error.value = 'El usuario no tiene permiso para anular ventas'
      procesando.value = false
      return
    }

    // 2. Verificar que la venta es del día actual
    const hoy = new Date()
    const fechaVenta = new Date(props.venta.fecha)
    if (fechaVenta.toDateString() !== hoy.toDateString()) {
      error.value = 'Solo se pueden anular ventas del día actual'
      procesando.value = false
      return
    }

    // 3. Obtener items de la venta para devolver stock
    const { data: items, error: itemsError } = await supabase
      .from('items_venta')
      .select('producto_id, cantidad, nombre_producto')
      .eq('venta_id', props.venta.id)

    if (itemsError) throw itemsError

    // 4. Anular la venta
    const { error: updateError } = await supabase
      .from('ventas')
      .update({
        estado: 'ANULADA',
        anulada_por: authStore.usuario?.id,
        autorizada_por: autorizador.id,
        fecha_anulacion: new Date().toISOString(),
        motivo_anulacion: motivoFinal.value
      })
      .eq('id', props.venta.id)

    if (updateError) throw updateError

    // 5. Devolver stock de los productos
    for (const item of (items || [])) {
      // Obtener stock actual
      const { data: producto } = await supabase
        .from('productos')
        .select('stock_actual, tipo_producto')
        .eq('id', item.producto_id)
        .single()

      if (producto && producto.tipo_producto === 'SIMPLE') {
        const nuevoStock = producto.stock_actual + item.cantidad

        // Actualizar stock
        await supabase
          .from('productos')
          .update({ stock_actual: nuevoStock })
          .eq('id', item.producto_id)

        // Registrar movimiento de entrada
        await supabase.from('movimientos_stock').insert({
          producto_id: item.producto_id,
          tipo_movimiento: 'ENTRADA',
          cantidad: item.cantidad,
          observaciones: `Anulación de venta #${props.venta.numero}`
        })
      }
    }

    // 6. Refrescar productos
    await productosStore.fetchProductos()

    // 7. Emitir evento de éxito
    emit('anulada')

  } catch (err: any) {
    console.error('Error anulando venta:', err)
    error.value = err.message || 'Error al anular la venta'
  } finally {
    procesando.value = false
  }
}
</script>
