<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Gestión de Usuarios</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">Administra usuarios y sus roles</p>
      </div>
      <button
        @click="openUserModal()"
        class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
      >
        <span>+</span>
        <span>Nuevo Usuario</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
      <p class="mt-2 text-gray-500">Cargando usuarios...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="usuarios.length === 0" class="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <p class="text-gray-500 dark:text-gray-400">No hay usuarios registrados</p>
      <button
        @click="openUserModal()"
        class="mt-4 text-primary-600 hover:text-primary-700 font-medium"
      >
        Crear primer usuario
      </button>
    </div>

    <!-- Users Table -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Usuario
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Rol
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Estado
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              PIN
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="usuario in usuarios"
            :key="usuario.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="h-10 w-10 flex-shrink-0">
                  <div class="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <span class="text-primary-800 dark:text-primary-200 font-medium text-sm">
                      {{ usuario.nombre.substring(0, 2).toUpperCase() }}
                    </span>
                  </div>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ usuario.nombre }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ usuario.email }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {{ usuario.rol?.nombre || 'Sin rol' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="usuario.activo
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'"
                class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
              >
                {{ usuario.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ usuario.pin ? '****' : 'No configurado' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button
                @click="openUserModal(usuario)"
                class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
              >
                Editar
              </button>
              <button
                @click="toggleUsuarioActivo(usuario)"
                class="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 mr-4"
              >
                {{ usuario.activo ? 'Desactivar' : 'Activar' }}
              </button>
              <button
                @click="deleteUsuario(usuario)"
                class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
              >
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- User Form Modal -->
    <UserFormModal
      v-if="showUserModal"
      :user-to-edit="selectedUser"
      :roles="roles"
      :loading="modalLoading"
      @close="showUserModal = false"
      @save="handleUserSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase, supabaseUrl } from '@/lib/supabase'
import type { Usuario, Rol } from '@/types/auth.types'
import UserFormModal from './UserFormModal.vue'

const loading = ref(false)
const usuarios = ref<Usuario[]>([])
const roles = ref<Rol[]>([])
const showUserModal = ref(false)
const selectedUser = ref<Usuario | null>(null)
const modalLoading = ref(false)

onMounted(async () => {
  await fetchUsuarios()
  await fetchRoles()
})

const fetchUsuarios = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, rol:roles(*)')
      .order('created_at', { ascending: false })

    if (error) throw error
    usuarios.value = data as Usuario[]
  } catch (e: any) {
    console.error('Error fetching usuarios:', e)
    alert('Error al cargar usuarios: ' + e.message)
  } finally {
    loading.value = false
  }
}

const fetchRoles = async () => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('activo', true)
      .order('nombre')

    if (error) throw error
    roles.value = data as Rol[]
  } catch (e: any) {
    console.error('Error fetching roles:', e)
  }
}

const openUserModal = (usuario: Usuario | null = null) => {
  selectedUser.value = usuario
  showUserModal.value = true
}

const handleUserSave = async (formData: any) => {
  modalLoading.value = true
  try {
    if (selectedUser.value) {
      // Editar usuario existente
      const { error } = await supabase
        .from('usuarios')
        .update({
          nombre: formData.nombre,
          rol_id: formData.rol_id,
          activo: formData.activo,
          pin: formData.pin || null
        })
        .eq('id', selectedUser.value.id)

      if (error) throw error
      alert('Usuario actualizado correctamente')
    } else {
      // Crear nuevo usuario usando Edge Function
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No hay sesión activa')
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/crear-usuario`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            nombre: formData.nombre,
            rol_id: formData.rol_id,
            activo: formData.activo,
            pin: formData.pin || null
          })
        }
      )

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error al crear usuario')
      }

      alert('Usuario creado correctamente')
    }

    showUserModal.value = false
    await fetchUsuarios()
  } catch (e: any) {
    console.error('Error saving usuario:', e)
    alert('Error al guardar usuario: ' + e.message)
  } finally {
    modalLoading.value = false
  }
}

const toggleUsuarioActivo = async (usuario: Usuario) => {
  const nuevoEstado = !usuario.activo
  const confirmMsg = nuevoEstado
    ? `¿Activar usuario ${usuario.nombre}?`
    : `¿Desactivar usuario ${usuario.nombre}? No podrá iniciar sesión.`

  if (!confirm(confirmMsg)) return

  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: nuevoEstado })
      .eq('id', usuario.id)

    if (error) throw error
    await fetchUsuarios()
  } catch (e: any) {
    console.error('Error toggling usuario:', e)
    alert('Error al cambiar estado: ' + e.message)
  }
}

const deleteUsuario = async (usuario: Usuario) => {
  const confirmMsg = `¿Eliminar permanentemente a ${usuario.nombre}?\n\nEsta acción NO se puede deshacer.`
  if (!confirm(confirmMsg)) return

  // Doble confirmación
  const confirmMsg2 = 'Escribe "ELIMINAR" para confirmar:'
  const userInput = prompt(confirmMsg2)
  if (userInput !== 'ELIMINAR') {
    alert('Operación cancelada')
    return
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('No hay sesión activa')
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/eliminar-usuario`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario_id: usuario.id
        })
      }
    )

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Error al eliminar usuario')
    }

    alert('Usuario eliminado correctamente')
    await fetchUsuarios()
  } catch (e: any) {
    console.error('Error deleting usuario:', e)
    alert('Error al eliminar usuario: ' + e.message)
  }
}
</script>
