<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Gestión de Roles y Permisos</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">Configura roles personalizados y asigna permisos</p>
      </div>
      <button
        @click="openRoleModal()"
        class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
      >
        <span>+</span>
        <span>Nuevo Rol</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
      <p class="mt-2 text-gray-500">Cargando roles...</p>
    </div>

    <!-- Roles Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="rol in roles"
        :key="rol.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
      >
        <!-- Rol Header -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {{ rol.nombre }}
              <span
                v-if="rol.es_sistema"
                class="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
              >
                Sistema
              </span>
            </h4>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ rol.descripcion || 'Sin descripción' }}
            </p>
          </div>
        </div>

        <!-- Permisos Count -->
        <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
          <p class="text-sm text-gray-600 dark:text-gray-300">
            <span class="font-semibold">{{ rol.permisos?.length || 0 }}</span> permisos asignados
          </p>
        </div>

        <!-- Permisos por Módulo -->
        <div class="space-y-2 mb-4 max-h-40 overflow-y-auto">
          <div
            v-for="modulo in getModulosConPermisos(rol)"
            :key="modulo"
            class="flex items-center justify-between text-xs"
          >
            <span class="text-gray-600 dark:text-gray-300 capitalize">{{ modulo }}</span>
            <span class="px-2 py-0.5 bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 rounded">
              {{ getPermisosCountByModule(rol, modulo) }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            @click="openRoleModal(rol)"
            class="flex-1 px-3 py-2 text-sm bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50 rounded transition-colors"
          >
            Editar
          </button>
          <button
            v-if="!rol.es_sistema"
            @click="deleteRol(rol)"
            class="px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded transition-colors"
          >
            Eliminar
          </button>
          <button
            v-else
            disabled
            class="px-3 py-2 text-sm bg-gray-100 text-gray-400 dark:bg-gray-700 rounded cursor-not-allowed"
            title="Los roles del sistema no se pueden eliminar"
          >
            Sistema
          </button>
        </div>
      </div>
    </div>

    <!-- Role Form Modal -->
    <RoleFormModal
      v-if="showRoleModal"
      :role-to-edit="selectedRole"
      :all-permisos="allPermisos"
      :loading="modalLoading"
      @close="showRoleModal = false"
      @save="handleRoleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Rol, Permiso } from '@/types/auth.types'
import RoleFormModal from './RoleFormModal.vue'

const loading = ref(false)
const roles = ref<Rol[]>([])
const allPermisos = ref<Permiso[]>([])
const showRoleModal = ref(false)
const selectedRole = ref<Rol | null>(null)
const modalLoading = ref(false)

onMounted(async () => {
  await fetchRoles()
  await fetchAllPermisos()
})

const fetchRoles = async () => {
  loading.value = true
  try {
    // Obtener roles
    const { data: rolesData, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .order('nombre')

    if (rolesError) throw rolesError

    // Para cada rol, obtener sus permisos
    const rolesConPermisos = await Promise.all(
      rolesData.map(async (rol) => {
        const { data: permisosData } = await supabase
          .from('rol_permisos')
          .select('permiso:permisos(*)')
          .eq('rol_id', rol.id)

        return {
          ...rol,
          permisos: permisosData?.map((item: any) => item.permiso) || []
        }
      })
    )

    roles.value = rolesConPermisos as Rol[]
  } catch (e: any) {
    console.error('Error fetching roles:', e)
    alert('Error al cargar roles: ' + e.message)
  } finally {
    loading.value = false
  }
}

const fetchAllPermisos = async () => {
  try {
    const { data, error } = await supabase
      .from('permisos')
      .select('*')
      .order('modulo, nombre')

    if (error) throw error
    allPermisos.value = data as Permiso[]
  } catch (e: any) {
    console.error('Error fetching permisos:', e)
  }
}

const getModulosConPermisos = (rol: Rol) => {
  if (!rol.permisos) return []
  const modulos = new Set(rol.permisos.map(p => p.modulo))
  return Array.from(modulos)
}

const getPermisosCountByModule = (rol: Rol, modulo: string) => {
  if (!rol.permisos) return 0
  return rol.permisos.filter(p => p.modulo === modulo).length
}

const openRoleModal = (rol: Rol | null = null) => {
  selectedRole.value = rol
  showRoleModal.value = true
}

const handleRoleSave = async (formData: any) => {
  modalLoading.value = true
  try {
    if (selectedRole.value) {
      // Editar rol existente
      const { error: updateError } = await supabase
        .from('roles')
        .update({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          activo: formData.activo
        })
        .eq('id', selectedRole.value.id)

      if (updateError) throw updateError

      // Actualizar permisos: eliminar existentes y agregar nuevos
      await supabase
        .from('rol_permisos')
        .delete()
        .eq('rol_id', selectedRole.value.id)

      if (formData.permisos_ids.length > 0) {
        const rolPermisos = formData.permisos_ids.map((permiso_id: string) => ({
          rol_id: selectedRole.value!.id,
          permiso_id
        }))

        const { error: permisosError } = await supabase
          .from('rol_permisos')
          .insert(rolPermisos)

        if (permisosError) throw permisosError
      }

      alert('Rol actualizado correctamente')
    } else {
      // Crear nuevo rol
      const { data: newRole, error: insertError } = await supabase
        .from('roles')
        .insert({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          es_sistema: false,
          activo: formData.activo
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Agregar permisos
      if (formData.permisos_ids.length > 0) {
        const rolPermisos = formData.permisos_ids.map((permiso_id: string) => ({
          rol_id: newRole.id,
          permiso_id
        }))

        const { error: permisosError } = await supabase
          .from('rol_permisos')
          .insert(rolPermisos)

        if (permisosError) throw permisosError
      }

      alert('Rol creado correctamente')
    }

    showRoleModal.value = false
    await fetchRoles()
  } catch (e: any) {
    console.error('Error saving rol:', e)
    alert('Error al guardar rol: ' + e.message)
  } finally {
    modalLoading.value = false
  }
}

const deleteRol = async (rol: Rol) => {
  if (rol.es_sistema) {
    alert('No se pueden eliminar roles del sistema')
    return
  }

  const confirmMsg = `¿Eliminar el rol "${rol.nombre}"?\n\nLos usuarios con este rol quedarán sin rol asignado.`
  if (!confirm(confirmMsg)) return

  try {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', rol.id)

    if (error) throw error
    alert('Rol eliminado correctamente')
    await fetchRoles()
  } catch (e: any) {
    console.error('Error deleting rol:', e)
    alert('Error al eliminar rol: ' + e.message)
  }
}
</script>
