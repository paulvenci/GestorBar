<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ userToEdit ? 'Editar Usuario' : 'Nuevo Usuario' }}
        </h3>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="px-6 py-4 space-y-4">
        <!-- Nombre -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre Completo *
          </label>
          <input
            v-model="form.nombre"
            type="text"
            required
            class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="Juan Pérez"
          />
        </div>

        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email *
          </label>
          <input
            v-model="form.email"
            type="email"
            required
            :disabled="!!userToEdit"
            class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="usuario@bargordy.com"
          />
          <p v-if="userToEdit" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            El email no se puede modificar
          </p>
        </div>

        <!-- Password (solo para nuevo usuario) -->
        <div v-if="!userToEdit">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contraseña *
          </label>
          <input
            v-model="form.password"
            type="password"
            required
            minlength="6"
            class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <!-- Rol -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rol *
          </label>
          <select
            v-model="form.rol_id"
            required
            class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Seleccionar rol...</option>
            <option v-for="rol in roles" :key="rol.id" :value="rol.id">
              {{ rol.nombre }}
            </option>
          </select>
        </div>

        <!-- PIN (opcional) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            PIN (Opcional)
          </label>
          <input
            v-model="form.pin"
            type="text"
            pattern="[0-9]{4}"
            maxlength="4"
            class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="4 dígitos para acceso rápido"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            El PIN permite inicio de sesión rápido (4 dígitos)
          </p>
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
            Usuario activo
          </label>
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
import { reactive, watch } from 'vue'
import type { Usuario, Rol } from '@/types/auth.types'

interface Props {
  userToEdit: Usuario | null
  roles: Rol[]
  loading: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [formData: any]
}>()

const form = reactive({
  nombre: '',
  email: '',
  password: '',
  rol_id: '',
  pin: '',
  activo: true
})

// Cargar datos si estamos editando
watch(() => props.userToEdit, (usuario) => {
  if (usuario) {
    form.nombre = usuario.nombre
    form.email = usuario.email
    form.rol_id = usuario.rol_id
    form.pin = usuario.pin || ''
    form.activo = usuario.activo
    form.password = '' // No se muestra la contraseña
  } else {
    // Reset para nuevo usuario
    form.nombre = ''
    form.email = ''
    form.password = ''
    form.rol_id = ''
    form.pin = ''
    form.activo = true
  }
}, { immediate: true })

const handleSubmit = () => {
  // Validar PIN si está presente
  if (form.pin && !/^\d{4}$/.test(form.pin)) {
    alert('El PIN debe ser de 4 dígitos numéricos')
    return
  }

  // Validar password solo para nuevos usuarios
  if (!props.userToEdit && form.password.length < 6) {
    alert('La contraseña debe tener al menos 6 caracteres')
    return
  }

  emit('save', { ...form })
}
</script>
