<template>
  <AppLayout>
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Configuración del Sistema
        </h1>
        <button
          @click="saveSettings"
          :disabled="saving"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="saving" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          <span>{{ saving ? 'Guardando...' : 'Guardar Cambios' }}</span>
        </button>
      </div>

      <div v-if="successMessage" class="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
        <span>✅</span>
        {{ successMessage }}
      </div>

      <div class="space-y-6">
        <!-- General Settings -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            🏪 General
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del Negocio
              </label>
              <input
                v-model="form.nombreNegocio"
                type="text"
                class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Este nombre aparecerá en el título del navegador.</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Moneda
                </label>
                <select 
                    v-model="form.moneda"
                    class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                    <option value="CLP">Peso Chileno (CLP)</option>
                    <option value="USD">Dólar (USD)</option>
                </select>
            </div>
          </div>
          
          <!-- Logo del Negocio -->
          <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Logo del Negocio (Favicon)
            </label>
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                <img v-if="form.logoUrl" :src="form.logoUrl" class="w-full h-full object-cover" @error="form.logoUrl = ''" />
                <span v-else class="text-2xl">🏪</span>
              </div>
              <div class="flex-1 space-y-2">
                <input 
                  type="file" 
                  accept="image/*"
                  @change="handleLogoUpload"
                  class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                <div class="flex gap-2">
                  <input 
                    v-model="logoUrlInput"
                    type="text"
                    placeholder="O pega URL de imagen..."
                    class="flex-1 text-sm rounded-md border-gray-300 shadow-sm p-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    @keyup.enter="applyLogoUrl"
                  />
                  <button 
                    type="button"
                    @click="applyLogoUrl"
                    :disabled="!logoUrlInput"
                    class="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md disabled:opacity-50"
                  >
                    Usar
                  </button>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400">Este logo aparecerá como favicon del navegador.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Fiscal Settings -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            💰 Fiscal
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Porcentaje IVA (%)
              </label>
              <input
                v-model.number="form.porcentajeIVA"
                type="number"
                min="0"
                max="100"
                class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Valor utilizado para desglose de impuestos en ventas.
              </p>
            </div>
          </div>
        </div>

        <!-- Inventory Settings -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            📦 Inventario
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock Mínimo por Defecto
              </label>
              <input
                v-model.number="form.stockMinimoDefault"
                type="number"
                min="0"
                class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Alerta automática cuando el stock baje de este número.
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Umbral "Sin Rotación" (Días)
              </label>
              <input
                v-model.number="form.diasSinRotacion"
                type="number"
                min="1"
                class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Días sin venta para considerar un producto como estancado.
              </p>
            </div>
          </div>
          
          <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ⚠️ Rango de Anulación de Ventas (Días)
            </label>
            <input
              v-model.number="form.diasAnulacionVentas"
              type="number"
              min="1"
              max="365"
              class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Número de días hacia atrás permitidos para anular una venta. Por ejemplo, si estableces 7 días, podrás anular ventas de los últimos 7 días.
            </p>
          </div>
        </div>

        <!-- Ticket Printing Settings -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            🖨️ Impresión de Tickets
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ancho del Papel
              </label>
              <select 
                  v-model="form.ticketAncho"
                  class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                  <option value="80mm">80mm (Estándar)</option>
                  <option value="58mm">58mm (Pequeño)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mensaje de Pie de Página
              </label>
              <input
                v-model="form.ticketMensajePie"
                type="text"
                class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="¡Gracias por su visita!"
              />
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Texto que aparecerá al final del recibo.
              </p>
            </div>
          </div>
        </div>

        <!-- Table Management -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
           <div class="flex items-center justify-between mb-4">
             <h2 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                 🍽️ Mesas
             </h2>
             <button 
                @click="openTableModal()"
                class="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-medium transition-colors"
             >
                + Nueva Mesa
             </button>
           </div>

           <div v-if="tablesStore.loading" class="text-center py-4">Cargando mesas...</div>
           <div v-else-if="tablesStore.tables.length === 0" class="text-center py-8 text-gray-500">
               No hay mesas configuradas.
           </div>
           <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
               <div 
                 v-for="mesa in tablesStore.sortedTables" 
                 :key="mesa.id"
                 class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 relative group bg-gray-50 dark:bg-gray-700/50"
               >
                   <div class="flex justify-between items-start">
                       <span class="font-bold text-lg dark:text-white">#{{ mesa.numero }}</span>
                       <span :class="{'text-green-600': mesa.estado === 'LIBRE', 'text-red-500': mesa.estado === 'OCUPADA'}" class="text-xs font-bold px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-600">
                         {{ mesa.estado }}
                       </span>
                   </div>
                   <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Cap: {{ mesa.capacidad }}p</div>
                   <div class="text-xs text-gray-400 italic truncate" v-if="mesa.descripcion">{{ mesa.descripcion }}</div>
                   
                   <!-- Actions Overlay -->
                   <div class="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button @click="openTableModal(mesa)" class="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600" title="Editar">✏️</button>
                       <button @click="deleteTable(mesa.id)" class="p-1.5 bg-red-500 text-white rounded hover:bg-red-600" title="Eliminar">🗑️</button>
                   </div>
               </div>
           </div>
        </div>

        <!-- Users Management -->
        <div v-if="authStore.canAccessUsers" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border-l-4 border-purple-500">
          <UsersManagement />
        </div>

        <!-- Roles Management -->
        <div v-if="authStore.canManageRoles" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border-l-4 border-indigo-500">
          <RolesManagement />
        </div>

        <!-- Data Management -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border-l-4 border-indigo-500">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            💾 Gestión de Datos
          </h2>
          
          <div class="space-y-6">
            <!-- Export -->
            <div>
                <h3 class="text-md font-medium text-gray-900 dark:text-white mb-2">Exportar Información</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Descarga una copia completa de toda la base de datos en formato Excel para respaldo.
                </p>
                <button 
                  @click="exportData" 
                  :disabled="exporting"
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                    <span v-if="exporting">⏳ Generando...</span>
                    <span v-else>📊 Descargar Excel (.xlsx)</span>
                </button>
            </div>

            <hr class="border-gray-200 dark:border-gray-700" />

            <!-- Danger Zone -->
            <div>
                <h3 class="text-md font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                    🚫 Zona de Peligro
                </h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-lg">
                        <h4 class="font-medium text-red-800 dark:text-red-300">Reiniciar Ventas e Historial</h4>
                        <p class="text-sm text-red-600 dark:text-red-400 mt-1 mb-3">
                            Elimina todas las ventas y movimientos de inventario. <br><strong>Los productos y configuraciones se mantienen.</strong>
                        </p>
                        <button 
                          @click="confirmReset('history')"
                          :disabled="exporting || saving"
                          class="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-800 dark:text-red-300 rounded text-sm font-medium transition-colors cursor-pointer"
                        >
                            Reiniciar Historial
                        </button>
                    </div>

                    <div class="p-4 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-lg">
                        <h4 class="font-medium text-red-800 dark:text-red-300">Restablecimiento de Fábrica</h4>
                        <p class="text-sm text-red-600 dark:text-red-400 mt-1 mb-3">
                            Elimina TODO: productos, categorías, recetas y ventas. <br><strong>El sistema quedará vacío como nuevo.</strong>
                        </p>
                        <button 
                          @click="confirmReset('full')"
                          :disabled="exporting || saving"
                          class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors cursor-pointer"
                        >
                            Borrar Todo
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table Form Modal -->
    <TableFormModal 
        v-if="showTableModal"
        :table-to-edit="selectedTable"
        :loading="tableModalLoading"
        @close="showTableModal = false"
        @save="handleTableSave"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useConfiguracionStore } from '@/stores/configuracion'
import { useTablesStore } from '@/stores/tables'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { utils, writeFile } from 'xlsx'
import AppLayout from '@/components/layout/AppLayout.vue'
import TableFormModal from '@/components/modules/settings/TableFormModal.vue'
import UsersManagement from '@/components/modules/settings/UsersManagement.vue'
import RolesManagement from '@/components/modules/settings/RolesManagement.vue'
import type { Mesa } from '@/types/database.types'

const configStore = useConfiguracionStore()
const tablesStore = useTablesStore()
const authStore = useAuthStore()
const saving = ref(false)
const exporting = ref(false)
const successMessage = ref('')

const form = reactive({
  nombreNegocio: '',
  logoUrl: '',
  moneda: 'CLP',
  porcentajeIVA: 19,
  stockMinimoDefault: 5,
  diasSinRotacion: 30,
  diasAnulacionVentas: 7,
  ticketAncho: '80mm',
  ticketMensajePie: ''
})

const logoUrlInput = ref('')

onMounted(async () => {
    await configStore.fetchConfiguracion()
    await tablesStore.fetchTables()
    // Sync form with store
    form.nombreNegocio = configStore.nombreNegocio
    form.logoUrl = configStore.logoUrl
    form.moneda = configStore.moneda
    form.porcentajeIVA = configStore.porcentajeIVA
    form.stockMinimoDefault = configStore.stockMinimoDefault
    form.diasSinRotacion = configStore.diasSinRotacion
    form.diasAnulacionVentas = configStore.diasAnulacionVentas
    form.ticketAncho = configStore.ticketAncho
    form.ticketMensajePie = configStore.ticketMensajePie
})

const saveSettings = async () => {
    saving.value = true
    successMessage.value = ''
    
    // Validar visualmente campos requeridos si fuese necesario
    
    const success = await configStore.updateConfiguracion({
        nombreNegocio: form.nombreNegocio,
        logoUrl: form.logoUrl,
        porcentajeIVA: form.porcentajeIVA,
        stockMinimoDefault: form.stockMinimoDefault,
        diasSinRotacion: form.diasSinRotacion,
        diasAnulacionVentas: form.diasAnulacionVentas,
        ticketAncho: form.ticketAncho as '80mm' | '58mm',
        ticketMensajePie: form.ticketMensajePie
    })

    if (success) {
        successMessage.value = 'Configuración guardada correctamente'
        setTimeout(() => successMessage.value = '', 3000)
    }
    
    saving.value = false
}

// Logo Management
const handleLogoUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return

    const file = input.files[0]
    if (!file) return
    
    if (file.size > 2 * 1024 * 1024) {
        alert('La imagen es muy pesada. Máximo 2MB.')
        return
    }

    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `logo-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('productos')
            .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data } = supabase.storage
            .from('productos')
            .getPublicUrl(fileName)

        form.logoUrl = data.publicUrl
    } catch (err: any) {
        console.error('Error uploading logo:', err)
        alert('Error al subir logo')
    }
}

const applyLogoUrl = () => {
    if (!logoUrlInput.value.trim()) return
    form.logoUrl = logoUrlInput.value.trim()
    logoUrlInput.value = ''
}

// Data Management
const exportData = async () => {
    exporting.value = true
    try {
        const wb = utils.book_new()
        
        // Tablas a exportar
        const tables = ['productos', 'categorias', 'ventas', 'items_venta', 'movimientos_stock', 'configuracion']
        
        for (const table of tables) {
            const { data } = await supabase.from(table).select('*')
            if (data && data.length > 0) {
                const ws = utils.json_to_sheet(data)
                utils.book_append_sheet(wb, ws, table)
            }
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
        writeFile(wb, `Backup_BarGordy_${timestamp}.xlsx`)
    } catch (e) {
        console.error(e)
        alert('Error al exportar datos')
    } finally {
        exporting.value = false
    }
}

const confirmReset = async (type: 'history' | 'full') => {
    const msg = type === 'history' 
        ? '⚠️ ¿Estás seguro? \n\nSe ELIMINARÁN permanentemente todas las ventas y el historial de stock.\nLos productos y recetas NO se borrarán.' 
        : '💥 ¡ALERTA DE SEGURIDAD! 💥\n\nEstás a punto de borrar TODO el sistema.\n- Se eliminarán productos, categorías y recetas.\n- Se eliminarán todas las ventas.\n- NO HAY FORMA DE DESHACER ESTO.\n\n¿Realmente deseas continuar?'
        
    if (!window.confirm(msg)) return
    
    // Doble confirmación solo para Full
    if (type === 'full') {
        const confirmationCode = Math.floor(1000 + Math.random() * 9000)
        const userInput = window.prompt(`Para confirmar, escribe el código: ${confirmationCode}`)
        if (userInput !== String(confirmationCode)) {
            alert('Código incorrecto. Operación cancelada.')
            return
        }
    }

    try {
        saving.value = true 
        const nullUUID = '00000000-0000-0000-0000-000000000000' // UUID vacío para hack delete all
        
        // 1. Borrar Transacciones (Orden importante por FKs)
        await supabase.from('items_venta').delete().neq('id', nullUUID)
        await supabase.from('ventas').delete().neq('id', nullUUID)
        await supabase.from('movimientos_stock').delete().neq('id', nullUUID)
        
        // 2. Borrar Catálogo (Solo si es Full)
        if (type === 'full') {
            await supabase.from('componentes_receta').delete().neq('id', nullUUID)
            await supabase.from('recetas').delete().neq('id', nullUUID)
            // Primero productos dependientes si hubiese autorelacion, luego productos
            await supabase.from('productos').delete().neq('id', nullUUID)
            await supabase.from('categorias').delete().neq('id', nullUUID)
        }
        
        alert('Operación realizada con éxito. La página se recargará.')
        window.location.reload()
    } catch (e: any) {
        console.error(e)
        alert(`Error al restablecer datos: ${e.message}`)
    } finally {
        saving.value = false
    }
}

// Table Management Logic
const showTableModal = ref(false)
const selectedTable = ref<Mesa | null>(null)
const tableModalLoading = ref(false)

const openTableModal = (mesa: Mesa | null = null) => {
    selectedTable.value = mesa
    showTableModal.value = true
}

const handleTableSave = async (formData: any) => {
    tableModalLoading.value = true
    try {
        if (selectedTable.value) {
            await tablesStore.updateTable(selectedTable.value.id, formData)
            alert('Mesa actualizada correctamente')
        } else {
            await tablesStore.createTable(formData)
            alert('Mesa creada correctamente')
        }
        showTableModal.value = false
    } catch (e: any) {
        alert('Error al guardar mesa: ' + e.message)
    } finally {
        tableModalLoading.value = false
    }
}

const deleteTable = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta mesa?')) return
    try {
        await tablesStore.deleteTable(id)
    } catch (e: any) {
        alert('Error al eliminar mesa: ' + e.message)
    }
}
</script>
