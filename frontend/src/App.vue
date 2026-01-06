<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useConfiguracionStore } from './stores/configuracion'
import { useOfflineStore } from './stores/offline'
import { useAuthStore } from './stores/auth'
import { onMounted } from 'vue'

const configStore = useConfiguracionStore()
const offlineStore = useOfflineStore()
const authStore = useAuthStore()

onMounted(async () => {
  // Inicializar autenticación primero
  await authStore.initAuth()
  
  // Luego el resto de stores
  configStore.fetchConfiguracion()
  offlineStore.initializeListener()
})
</script>

<template>
  <RouterView />
</template>
