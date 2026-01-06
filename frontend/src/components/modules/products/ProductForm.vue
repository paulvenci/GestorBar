<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500/75 transition-opacity" aria-hidden="true" @click="$emit('close')"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="relative z-10 inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4" id="modal-title">
            {{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}
          </h3>
          
          <form @submit.prevent="onSubmit" class="space-y-4">
            <!-- Nombre -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
              <input 
                v-model="form.nombre"
                type="text" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                required
              />
            </div>

            <!-- Código -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Código</label>
              <input 
                v-model="form.codigo"
                type="text" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                required
              />
            </div>

            <!-- Categoría -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
              <select 
                v-model="form.categoria_id"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
              >
                <option value="">Seleccionar categoría</option>
                <option v-for="cat in categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
              </select>
            </div>

            <!-- Contenido (Solo Simple) -->
            <div v-if="form.tipo_producto === 'SIMPLE'" class="grid grid-cols-2 gap-4 border p-3 rounded-md bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
               <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Contenido Total</label>
                <input 
                  v-model.number="form.contenido_total"
                  type="number" 
                  min="0.01"
                  step="0.01"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                  placeholder="Ej: 750"
                  required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Unidad Medida</label>
                <select 
                  v-model="form.unidad_medida_base"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                >
                  <option value="ml">Mililitros (ml)</option>
                  <option value="l">Litros (l)</option>
                  <option value="g">Gramos (g)</option>
                  <option value="kg">Kilos (kg)</option>
                  <option value="u">Unidad (u)</option>
                </select>
              </div>
              <p class="col-span-2 text-xs text-gray-500 dark:text-gray-400">
                * Define el contenido total del envase para calcular costos proporcionales en recetas.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- Precio Costo -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Costo</label>
                <input 
                  v-model.number="form.valor_costo"
                  type="number" 
                  min="0"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                  :readonly="form.tipo_producto === 'COMPUESTO'"
                  :class="{'bg-gray-100 dark:bg-gray-600 cursor-not-allowed': form.tipo_producto === 'COMPUESTO'}"
                  required
                />
                <p v-if="form.tipo_producto === 'COMPUESTO'" class="text-xs text-gray-500 mt-1">Calculado automáticamente</p>
              </div>

              <!-- Precio Venta -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Precio Venta</label>
                <input 
                  v-model.number="form.valor_venta"
                  type="number" 
                  min="0"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                  required
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
               <!-- Stock Actual -->
               <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock Actual</label>
                <input 
                  v-model.number="form.stock_actual"
                  type="number" 
                  min="0"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                  :disabled="form.tipo_producto === 'COMPUESTO'"
                />
              </div>

              <!-- Stock Mínimo -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock Mínimo</label>
                <input 
                  v-model.number="form.stock_minimo"
                  type="number" 
                  min="0"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                />
              </div>
            </div>

            <!-- Foto del Producto -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Imagen</label>
              <div class="mt-1 flex items-center gap-4">
                <div class="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 bg-gray-100 flex-shrink-0">
                  <img v-if="previewImage || form.foto" :src="previewImage || form.foto" class="w-full h-full object-cover" />
                  <div v-else class="flex items-center justify-center h-full text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  
                  <!-- Loading overlay -->
                  <div v-if="uploadingImage" class="absolute inset-0 bg-white/50 flex items-center justify-center">
                    <span class="block w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></span>
                  </div>
                </div>
                
                <div class="flex-1">
                  <input 
                    type="file" 
                    accept="image/*"
                    @change="handleImageUpload"
                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:text-gray-300 dark:file:bg-gray-700 dark:file:text-primary-400"
                  />
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">PNG, JPG, max 2MB.</p>
                </div>
              </div>
            </div>

            <!-- Tipo de Producto -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Producto</label>
              <select 
                v-model="form.tipo_producto"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                :disabled="isEditing"
              >
                <option value="SIMPLE">Producto Simple (Directo)</option>
                <option value="COMPUESTO">Producto Compuesto (Receta)</option>
              </select>
            </div>

            <!-- Receta (Solo para Compuestos) -->
            <div v-if="form.tipo_producto === 'COMPUESTO'" class="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-900">
               <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Ingredientes (Receta)</h4>
               
               <div v-for="(ingrediente, index) in ingredientes" :key="index" class="mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                 <div class="flex gap-2 items-start">
                   <div class="flex-1">
                     <select 
                        v-model="ingrediente.producto_simple_id"
                        class="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        @change="recalculateTotals"
                     >
                       <option value="">Seleccionar ingrediente</option>
                       <option v-for="p in simpleProducts" :key="p.id" :value="p.id">
                          {{ p.nombre }} ({{ formatContent(p) }}) - ${{ p.valor_costo }}
                       </option>
                     </select>
                   </div>
                   <div class="w-20">
                      <input 
                          v-model.number="ingrediente.cantidad"
                          type="number" 
                          placeholder="Cant"
                          min="0.1"
                          step="0.1"
                          class="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          @input="recalculateTotals"
                      />
                   </div>
                   <div class="w-20">
                      <input 
                          v-model="ingrediente.unidad_medida"
                          type="text" 
                          placeholder="Unidad"
                          class="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          @input="recalculateTotals"
                      />
                   </div>
                   <button @click.prevent="removeIngrediente(index)" class="text-red-500 hover:text-red-700 mt-2">
                     ✕
                   </button>
                 </div>
                 
                 <!-- Detalle del cálculo (ayuda visual) dentro del scope -->
                 <div v-if="ingrediente.producto_simple_id" class="text-xs text-gray-500 mt-1 ml-1">
                   <span v-if="getIngredienteDetail(ingrediente)">
                      {{ getIngredienteDetail(ingrediente) }}
                   </span>
                 </div>
               </div>
               
               <div class="flex justify-between items-center mt-2">
                  <button @click.prevent="addIngrediente" class="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400">
                    + Agregar Ingrediente
                  </button>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Costo Calculado: ${{ Math.round(form.valor_costo) }}
                  </span>
               </div>
            </div>

            <!-- Errores -->
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
            {{ saving ? 'Guardando...' : 'Guardar' }}
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
import { ref, computed, onMounted, watch } from 'vue'
import type { Producto, Categoria } from '@/types/database.types'
import { useProductosStore } from '@/stores/productos'
import { supabase } from '@/lib/supabase' 

const props = defineProps<{
  productToEdit?: Producto | null
  categorias: Categoria[]
  simpleProducts: Producto[] // Para el selector de ingredientes
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save'): void
}>()

const productosStore = useProductosStore()
const saving = ref(false)
const uploadingImage = ref(false)
const previewImage = ref<string | null>(null)
const error = ref<string | null>(null)

interface IngredienteForm {
  producto_simple_id: string
  cantidad: number
  unidad_medida: string
}

const form = ref({
  nombre: '',
  codigo: '',
  categoria_id: '',
  valor_costo: 0,
  valor_venta: 0,
  stock_actual: 0,
  stock_minimo: 5,
  tipo_producto: 'SIMPLE' as 'SIMPLE' | 'COMPUESTO',
  descripcion: '',
  contenido_total: 1,
  unidad_medida_base: 'ml',
  foto: ''
})

const ingredientes = ref<IngredienteForm[]>([])

const isEditing = computed(() => !!props.productToEdit)

// Inicializar form si es edición
onMounted(() => {
  if (props.productToEdit) {
    const p = props.productToEdit
    form.value = {
      nombre: p.nombre,
      codigo: p.codigo,
      categoria_id: p.categoria_id || '',
      valor_costo: p.valor_costo,
      valor_venta: p.valor_venta,
      stock_actual: p.stock_actual,
      stock_minimo: p.stock_minimo,
      tipo_producto: p.tipo_producto as 'SIMPLE' | 'COMPUESTO',
      descripcion: p.descripcion || '',
      contenido_total: p.contenido_total || 1,
      unidad_medida_base: p.unidad_medida_base || 'ml',
      foto: p.foto || ''
    }

    if (p.foto) {
        previewImage.value = p.foto
    }

    // Cargar ingredientes si existen y es compuesto
    if (p.tipo_producto === 'COMPUESTO') {
        console.log('Cargando receta para:', p.nombre, p.receta)
        if (p.receta) {
            // Manejar caso array vs objeto que devuelve supabase
            const recetaData = Array.isArray(p.receta) ? p.receta[0] : p.receta
            
            if (recetaData && recetaData.componentes) {
                console.log('Componentes encontrados:', recetaData.componentes)
                ingredientes.value = recetaData.componentes.map((c: any) => ({
                    producto_simple_id: c.producto_simple?.id || '',
                    cantidad: c.cantidad,
                    unidad_medida: c.unidad_medida || 'ml'
                }))
            }
        }
    }
  }
})

const addIngrediente = () => {
  ingredientes.value.push({
    producto_simple_id: '',
    cantidad: 1,
    unidad_medida: 'ml'
  })
}

const removeIngrediente = (index: number) => {
  ingredientes.value.splice(index, 1)
  recalculateTotals()
}

const formatContent = (p: Producto) => {
  if (p.contenido_total && p.unidad_medida_base) {
    return `${p.contenido_total}${p.unidad_medida_base}`
  }
  return '1u'
}

const recalculateTotals = () => {
  if (form.value.tipo_producto !== 'COMPUESTO') return

  let totalCost = 0
  
  // Calcular Costo Total
  for (const item of ingredientes.value) {
    if (!item.producto_simple_id) continue
    
    const simpleProduct = props.simpleProducts.find(p => p.id === item.producto_simple_id)
    if (simpleProduct) {
      const contenidoBase = simpleProduct.contenido_total || 1 
      const costoBase = simpleProduct.valor_costo
      
      const itemCost = (costoBase / contenidoBase) * item.cantidad
      totalCost += itemCost
    }
  }
  
  form.value.valor_costo = Math.round(totalCost * 100) / 100 
  
  // Calcular Stock Potencial (Minimun Limiting Factor)
  if (ingredientes.value.length === 0) {
    form.value.stock_actual = 0
    return
  }

  let maxStockPosible = Infinity

  for (const item of ingredientes.value) {
     if (!item.producto_simple_id || item.cantidad <= 0) continue

     const simpleProduct = props.simpleProducts.find(p => p.id === item.producto_simple_id)
     if (simpleProduct) {
       // Total disponible en unidad base (ej. ml) = Botellas * Capacidad
       const contenidoTotalEnvase = simpleProduct.contenido_total || 1
       const stockEnvases = simpleProduct.stock_actual
       const totalDisponibleBase = stockEnvases * contenidoTotalEnvase
       
       // Cuántos tragos puedo hacer con este ingrediente?
       const tragosPosibles = Math.floor(totalDisponibleBase / item.cantidad)
       
       if (tragosPosibles < maxStockPosible) {
         maxStockPosible = tragosPosibles
       }
     }
  }
  
  form.value.stock_actual = maxStockPosible === Infinity ? 0 : maxStockPosible
}

const getIngredienteDetail = (item: IngredienteForm) => {
  const p = props.simpleProducts.find(p => p.id === item.producto_simple_id)
  if (!p) return null
  
  const costo = p.valor_costo
  const contenido = p.contenido_total || 1
  const cantidad = item.cantidad
  const subtotal = (costo / contenido) * cantidad
  
  return `Cálculo: ($${costo} / ${contenido}${p.unidad_medida_base}) * ${cantidad} = $${Math.round(subtotal)}`
}

const handleImageUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return

    const file = input.files[0]
    if (!file) return
    
    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('La imagen es muy pesada. Máximo 2MB.')
        return
    }

    uploadingImage.value = true
    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('productos')
            .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data } = supabase.storage
            .from('productos')
            .getPublicUrl(filePath)

        form.value.foto = data.publicUrl
        previewImage.value = data.publicUrl
        
    } catch (err: any) {
        console.error('Error uploading image:', err)
        alert('Error al subir imagen. Asegúrate de tener el bucket "productos" creado y público en Supabase.')
    } finally {
        uploadingImage.value = false
    }
}

// Watch ingredientes to recalc automatically
watch(ingredientes, () => {
  recalculateTotals()
}, { deep: true })

const onSubmit = async () => {
  error.value = null
  saving.value = true
  
  try {
    // Validaciones básicas
    if (!form.value.nombre || !form.value.codigo) {
      throw new Error('Nombre y Código son obligatorios')
    }
    
    // Preparar objeto
    const productData = {
      ...form.value,
    }

    let result
    if (isEditing && props.productToEdit) {
      result = await productosStore.updateProducto(props.productToEdit.id, productData)
    } else {
      result = await productosStore.createProducto(productData)
    }

    if (!result.success) {
      throw new Error(result.error)
    }
    
    // Guardar receta si es compuesto
    if (form.value.tipo_producto === 'COMPUESTO' && ingredientes.value.length > 0) {
       const recetaResult = await productosStore.saveReceta(result.data.id, ingredientes.value)
       if (!recetaResult.success) {
           console.error('Error guardando receta:', recetaResult.error)
           // No bloqueamos el flujo principal, pero idealmente mostraríamos warning
       }
    }
    
    // Si editamos y cambiamos a SIMPLE, deberíamos borrar la receta? 
    // Por ahora lo dejamos así.

    // Recargar productos para que el listado tenga la receta actualizada en el join
    await productosStore.fetchProductos()

    emit('save')
    emit('close')
  } catch (err: any) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}
</script>
