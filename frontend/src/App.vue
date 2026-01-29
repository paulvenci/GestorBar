<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useConfiguracionStore } from './stores/configuracion'
import { useOfflineStore } from './stores/offline'
import { useAuthStore } from './stores/auth'
import { onMounted, watch } from 'vue'
import ToastContainer from './components/common/ToastContainer.vue'
import UpdateNotification from './components/common/UpdateNotification.vue'

const configStore = useConfiguracionStore()
const offlineStore = useOfflineStore()
const authStore = useAuthStore()

// Actualizar título del navegador cuando cambie el nombre del negocio
const updateDocumentTitle = () => {
  document.title = configStore.nombreNegocio || 'POS System'
}

// Actualizar favicon cuando cambie el logo
const updateFavicon = () => {
  if (configStore.logoUrl) {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = configStore.logoUrl
  }
}

// Cargar configuración (se llama al inicio y cuando el usuario se autentica)
const loadConfig = async () => {
  await configStore.fetchConfiguracion()
  updateDocumentTitle()
  updateFavicon()
}

onMounted(async () => {
  // Cargar configuración inmediatamente (intenta aunque no haya sesión)
  loadConfig()
  
  // Inicializar autenticación
  await authStore.initAuth()
  
  // Recargar configuración si hay un usuario autenticado
  if (authStore.isAuthenticated) {
    loadConfig()
  }
  
  offlineStore.initializeListener()
})

// Cuando el usuario inicie sesión, recargar configuración
watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    loadConfig()
  }
})

// Watchers para cambios dinámicos
watch(() => configStore.nombreNegocio, updateDocumentTitle)
watch(() => configStore.logoUrl, updateFavicon)
</script>

<template>
  <UpdateNotification />
  <RouterView />
  <ToastContainer />
</template>
