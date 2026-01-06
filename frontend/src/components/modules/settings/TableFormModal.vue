<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ isEdit ? 'Editar Mesa' : 'Nueva Mesa' }}
        </h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
          ✕
        </button>
      </div>

      <!-- Body -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Número de Mesa *
          </label>
          <input
            v-model.number="form.numero"
            type="number"
            required
            min="1"
            class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            :disabled="loading"
          />
        </div>

        <div>
           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
             Capacidad (Personas)
           </label>
           <input
             v-model.number="form.capacidad"
             type="number"
             min="1"
             class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
             :disabled="loading"
           />
        </div>

        <div>
           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
             Descripción / Zona (Opcional)
           </label>
           <input
             v-model="form.descripcion"
             type="text"
             placeholder="Ej. Terraza, Barra"
             class="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
             :disabled="loading"
           />
        </div>
        
        <div v-if="error" class="text-red-500 text-sm">
            {{ error }}
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-3 pt-2">
            <button 
                type="button" 
                @click="$emit('close')"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                :disabled="loading"
            >
                Cancelar
            </button>
            <button 
                type="submit"
                class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2"
                :disabled="loading"
            >
                <span v-if="loading" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                <span>{{ isEdit ? 'Actualizar' : 'Crear' }}</span>
            </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import type { Mesa } from '@/types/database.types'

const props = defineProps<{
    tableToEdit?: Mesa | null
    loading: boolean
}>()

const emit = defineEmits(['close', 'save'])

const isEdit = computed(() => !!props.tableToEdit)
const error = ref('')

const form = reactive({
    numero: 1,
    capacidad: 4,
    descripcion: ''
})

onMounted(() => {
    if (props.tableToEdit) {
        form.numero = props.tableToEdit.numero
        form.capacidad = props.tableToEdit.capacidad
        form.descripcion = props.tableToEdit.descripcion || ''
    }
})

const handleSubmit = () => {
    error.value = ''
    if (!form.numero || form.numero < 1) {
        error.value = 'Número de mesa inválido'
        return
    }
    emit('save', { ...form })
}
</script>
