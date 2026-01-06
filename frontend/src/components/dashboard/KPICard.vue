<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all hover:shadow-lg">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
          {{ title }}
        </p>
        <p class="text-3xl font-bold mt-2" :class="valueClass">
          {{ formattedValue }}
        </p>
        <p v-if="subtitle" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ subtitle }}
        </p>
      </div>
      <div 
        class="text-5xl opacity-20"
        :class="iconClass"
      >
        {{ icon }}
      </div>
    </div>
    
    <div v-if="alert" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <p class="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
        <span>⚠</span>
        <span>{{ alert }}</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  value: number | string
  icon: string
  subtitle?: string
  alert?: string
  type?: 'default' | 'success' | 'warning' | 'danger'
  format?: 'number' | 'currency' | 'text'
}>()

const formattedValue = computed(() => {
  if (props.format === 'currency' && typeof props.value === 'number') {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(props.value)
  }
  
  if (props.format === 'number' && typeof props.value === 'number') {
    return new Intl.NumberFormat('es-CL').format(props.value)
  }
  
  return props.value
})

const valueClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'text-green-600 dark:text-green-400'
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'danger':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-900 dark:text-white'
  }
})

const iconClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'text-green-500'
    case 'warning':
      return 'text-yellow-500'
    case 'danger':
      return 'text-red-500'
    default:
      return 'text-gray-400'
  }
})
</script>
