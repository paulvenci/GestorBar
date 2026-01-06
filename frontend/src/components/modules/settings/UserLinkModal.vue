<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ userToEdit ? 'Editar Usuario' : 'Vincular Nuevo Usuario' }}
        </h3>
        <p v-if="!userToEdit" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Primero crea el usuario en Supabase Dashboard, luego vincúlalo aquí
        </p>
      </div>

      <!-- Instrucciones (solo para nuevo usuario) -->
      <div v-if="!userToEdit && !showForm" class="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900">
        <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-2">📋 Pasos para crear usuario:</h4>
        <ol class="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>
            <strong>Ve a Supabase Dashboard</strong>
            <a :href="`https://supabase.com/dashboard/project/${projectRef}/auth/users`" 
               target="_blank" 
               class="ml-2 underline hover:text-blue-600"
            >
              Abrir Authentication
            </a>
          </li>
          <li><strong>Click en "Add user" → "Create new user"</strong></li>
          <li><strong>Ingresa email y contraseña</strong></li>
          <li><strong>Click en "Create user"</strong></li>
          <li><strong>Copia el UUID del usuario creado</strong></li>
          <li><strong>Vuelve aquí y pega el UUID abajo</strong></li>
        </ol>
        <button
          @click="showForm = true"
          class="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
        >
          Ya creé el usuario, continuar →
        </button>
      </div>

      <!-- Form -->
      <form v-if="userToEdit || showForm" @submit.prevent="handleSubmit" class="px-6 py-4 space-y-4">
        <!-- UUID del usuario (solo para nuevo) -->
        <div v-if="!userToEdit">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            UUID del Usuario *
          </label>
          <input
            v-model="form.id"
            type="text"
            required
            pattern="[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
            class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 font-mono text-sm"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Copia el UUID desde Supabase Dashboard → Authentication → Users
          </p>
        </div>

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
            class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="usuario@bargordy.com"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Debe coincidir con el email usado en Supabase Dashboard
          </p>
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
              {{ rol.nombre }} - {{ rol.descripcion }}
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
          v-if="userToEdit || showForm"
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
import { reactive, watch, ref, computed } from 'vue'
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

const showForm = ref(false)

const form = reactive({
  id: '',
  nombre: '',
  email: '',
  rol_id: '',
  pin: '',
  activo: true
})

// Extraer project ref de la URL de Supabase
const projectRef = computed(() => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
  return match ? match[1] : 'your-project'
})

// Cargar datos si estamos editando
watch(() => props.userToEdit, (usuario) => {
  if (usuario) {
    form.id = usuario.id
    form.nombre = usuario.nombre
    form.email = usuario.email
    form.rol_id = usuario.rol_id
    form.pin = usuario.pin || ''
    form.activo = usuario.activo
    showForm.value = true
  } else {
    // Reset para nuevo usuario
    form.id = ''
    form.nombre = ''
    form.email = ''
    form.rol_id = ''
    form.pin = ''
    form.activo = true
    showForm.value = false
  }
}, { immediate: true })

const handleSubmit = () => {
  // Validar PIN si está presente
  if (form.pin && !/^\d{4}$/.test(form.pin)) {
    alert('El PIN debe ser de 4 dígitos numéricos')
    return
  }

  // Validar UUID para nuevos usuarios
  if (!props.userToEdit) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(form.id)) {
      alert('El UUID no tiene un formato válido')
      return
    }
  }

  emit('save', { ...form })
}
</script>
