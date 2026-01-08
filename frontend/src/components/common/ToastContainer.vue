<template>
  <teleport to="body">
    <div class="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <transition-group name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto px-4 py-3 rounded-lg shadow-lg max-w-sm flex items-center gap-3 animate-slide-in"
          :class="toastClasses(toast.type)"
        >
          <span class="text-xl">{{ toastIcon(toast.type) }}</span>
          <p class="text-sm font-medium flex-1">{{ toast.message }}</p>
          <button
            @click="remove(toast.id)"
            class="text-current opacity-70 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()

const toastClasses = (type: string) => {
  const classes = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white'
  }
  return classes[type as keyof typeof classes]
}

const toastIcon = (type: string) => {
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  }
  return icons[type as keyof typeof icons]
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease;
}
</style>
