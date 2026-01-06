<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ roleToEdit ? 'Editar Rol' : 'Nuevo Rol' }}
        </h3>
        <p v-if="roleToEdit?.es_sistema" class="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
          ⚠️ Este es un rol del sistema. Solo puedes modificar sus permisos, no su nombre.
        </p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="px-6 py-4 space-y-6">
        <!-- Información Básica -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del Rol *
            </label>
            <input
              v-model="form.nombre"
              type="text"
              required
              :disabled="roleToEdit?.es_sistema"
              class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50"
              placeholder="ej: Supervisor"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <input
              v-model="form.descripcion"
              type="text"
              class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Descripción breve del rol"
            />
          </div>
        </div>

        <!-- Estado -->
        <div class="flex items-center">
          <input
            v-model="form.activo"
            type="checkbox"
            id="activo"
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label for="activo" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Rol activo
          </label>
        </div>

        <!-- Permisos por Módulo -->
        <div>
          <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            Permisos
            <span class="text-sm font-normal text-gray-500">
              ({{ selectedCount }} seleccionados)
            </span>
          </h4>

          <!-- Botones de Acción Rápida -->
          <div class="flex gap-2 mb-4">
            <button
              type="button"
              @click="selectAll"
              class="px-3 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 rounded"
            >
              Seleccionar Todos
            </button>
            <button
              type="button"
              @click="deselectAll"
              class="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 rounded"
            >
              Deseleccionar Todos
            </button>
          </div>

          <!-- Permisos agrupados por módulo -->
          <div class="space-y-4 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div
              v-for="modulo in modulos"
              :key="modulo"
              class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
            >
              <div class="flex items-center justify-between mb-3">
                <h5 class="font-semibold text-gray-900 dark:text-white capitalize">
                  {{ getModuloLabel(modulo) }}
                </h5>
                <button
                  type="button"
                  @click="toggleModule(modulo)"
                  class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  {{ isModuleSelected(modulo) ? 'Deseleccionar' : 'Seleccionar' }} todos
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label
                  v-for="permiso in getPermisosByModule(modulo)"
                  :key="permiso.id"
                  class="flex items-start gap-2 p-2 hover:bg-white dark:hover:bg-gray-600/50 rounded cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    :value="permiso.id"
                    v-model="form.permisos_ids"
                    class="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {{ permiso.nombre }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ permiso.descripcion }}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        <button
          @click="$emit('close')"
          type="button"
          :disabled="loading"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          @click="handleSubmit"
          :disabled="loading"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 flex items-center gap-2"
        >
          <span v-if="loading" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          <span>{{ loading ? 'Guardando...' : 'Guardar' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type { Rol, Permiso } from '@/types/auth.types'

interface Props {
  roleToEdit: Rol | null
  allPermisos: Permiso[]
  loading: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [formData: any]
}>()

const form = reactive({
  nombre: '',
  descripcion: '',
  activo: true,
  permisos_ids: [] as string[]
})

// Obtener módulos únicos
const modulos = computed(() => {
  const uniqueModules = new Set(props.allPermisos.map(p => p.modulo))
  return Array.from(uniqueModules).sort()
})

// Contar permisos seleccionados
const selectedCount = computed(() => form.permisos_ids.length)

// Cargar datos si estamos editando
watch(() => props.roleToEdit, (rol) => {
  if (rol) {
    form.nombre = rol.nombre
    form.descripcion = rol.descripcion || ''
    form.activo = rol.activo
    form.permisos_ids = rol.permisos?.map(p => p.id) || []
  } else {
    // Reset para nuevo rol
    form.nombre = ''
    form.descripcion = ''
    form.activo = true
    form.permisos_ids = []
  }
}, { immediate: true })

const getModuloLabel = (modulo: string) => {
  const labels: Record<string, string> = {
    'pos': 'POS / Ventas',
    'productos': 'Productos',
    'inventario': 'Inventario',
    'mesas': 'Mesas',
    'reportes': 'Reportes',
    'config': 'Configuración',
    'usuarios': 'Usuarios y Roles'
  }
  return labels[modulo] || modulo
}

const getPermisosByModule = (modulo: string) => {
  return props.allPermisos.filter(p => p.modulo === modulo)
}

const isModuleSelected = (modulo: string) => {
  const permisosDelModulo = getPermisosByModule(modulo)
  return permisosDelModulo.every(p => form.permisos_ids.includes(p.id))
}

const toggleModule = (modulo: string) => {
  const permisosDelModulo = getPermisosByModule(modulo)
  const isSelected = isModuleSelected(modulo)

  if (isSelected) {
    // Deseleccionar todos del módulo
    form.permisos_ids = form.permisos_ids.filter(
      id => !permisosDelModulo.some(p => p.id === id)
    )
  } else {
    // Seleccionar todos del módulo
    const idsToAdd = permisosDelModulo
      .map(p => p.id)
      .filter(id => !form.permisos_ids.includes(id))
    form.permisos_ids.push(...idsToAdd)
  }
}

const selectAll = () => {
  form.permisos_ids = props.allPermisos.map(p => p.id)
}

const deselectAll = () => {
  form.permisos_ids = []
}

const handleSubmit = () => {
  if (!form.nombre.trim()) {
    alert('El nombre del rol es requerido')
    return
  }

  if (form.permisos_ids.length === 0) {
    const confirm = window.confirm('No has seleccionado ningún permiso. ¿Deseas continuar?')
    if (!confirm) return
  }

  emit('save', { ...form })
}
</script>
