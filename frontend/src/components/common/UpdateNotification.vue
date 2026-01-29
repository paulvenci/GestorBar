<template>
  <Transition name="slide-down">
    <div 
      v-if="showUpdateBanner" 
      class="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0">
              <svg class="w-6 h-6 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium">
                🎉 Nueva versión disponible
              </p>
              <p class="text-xs opacity-90">
                Actualiza para obtener las últimas mejoras y correcciones
              </p>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <button
              @click="updateApp"
              class="px-4 py-2 bg-white text-primary-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Actualizar ahora
            </button>
            <button
              @click="dismissUpdate"
              class="px-3 py-2 text-white hover:bg-white/10 rounded-lg text-sm transition-colors"
              title="Más tarde"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const showUpdateBanner = ref(false)

const { updateServiceWorker } = useRegisterSW({
  onNeedRefresh() {
    showUpdateBanner.value = true
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  }
})

const updateApp = () => {
  updateServiceWorker(true)
}

const dismissUpdate = () => {
  showUpdateBanner.value = false
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
