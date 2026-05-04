<template>
  <!-- Mobile Backdrop (teleported) -->
  <Teleport to="body">
    <div 
      v-if="uiStore.isSidebarOpenMobile" 
      class="fixed inset-0 bg-black/50 z-20 md:hidden" 
      @click="uiStore.closeSidebarMobile()"
    ></div>
  </Teleport>

  <aside 
    class="fixed left-0 top-0 bottom-0 z-30 transition-all duration-300 ease-in-out flex flex-col justify-between overflow-hidden"
    :class="[
      uiStore.isSidebarCollapsed ? 'w-20' : 'w-64',
      uiStore.isSidebarOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    ]"
  >
    <!-- Midnight Slate Background Wrapper -->
    <div class="absolute inset-0 bg-slate-950 -z-10 shadow-2xl border-r border-slate-800"></div>
    
    <!-- Subtle Gradient Overlay -->
    <div class="absolute inset-0 bg-gradient-to-b from-primary-900/10 to-transparent -z-5 pointer-events-none"></div>

    <!-- Sidebar Toggle -->
    <div class="flex justify-end pt-4 pr-3">
        <button 
          @click="uiStore.toggleSidebar"
          class="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
    </div>

      <nav class="flex-1 px-3 py-2 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
        <!-- Main Navigation -->
        <ul class="space-y-1">
          <li v-for="item in visibleMainMenuItems" :key="item.path">
            <router-link
              :to="item.path"
              @click="handleNavClick(item)"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative"
              :class="[
                isActive(item) 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              ]"
            >
              <span class="text-xl transition-transform group-hover:scale-110 duration-300 w-6 text-center flex justify-center">
                {{ item.icon }}
              </span>
              
              <span 
                class="font-medium text-sm tracking-wide transition-all duration-300 whitespace-nowrap overflow-hidden"
                :class="uiStore.isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'"
              >
                {{ item.label }}
              </span>
              
              <!-- Active Glow (Collapsed) -->
              <div v-if="isActive(item) && uiStore.isSidebarCollapsed" class="absolute inset-0 rounded-xl bg-primary-500/20 blur-md -z-10"></div>
            </router-link>
          </li>
        </ul>

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Divider -->
        <div class="h-px bg-slate-800/50 mx-2"></div>

        <!-- Bottom Navigation (Settings, etc) -->
        <ul class="space-y-1">
          <li v-for="item in visibleBottomMenuItems" :key="item.path">
            <router-link
              :to="item.path"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative"
              :class="[
                isActive(item) 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              ]"
            >
              <span class="text-xl transition-transform group-hover:scale-110 duration-300 w-6 text-center flex justify-center">
                {{ item.icon }}
              </span>
              
              <span 
                class="font-medium text-sm tracking-wide transition-all duration-300 whitespace-nowrap overflow-hidden"
                :class="uiStore.isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'"
              >
                {{ item.label }}
              </span>
            </router-link>
          </li>
        </ul>
      </nav>

      <!-- User Profile Footer -->
      <div class="p-3 mt-auto">
        <div class="bg-slate-900/50 rounded-xl p-2 border border-slate-800/50 flex items-center gap-3 overflow-hidden transition-all duration-300 hover:bg-slate-800/50 group cursor-pointer" @click="handleLogout">
            <!-- Avatar -->
            <div class="w-10 h-10 min-w-[2.5rem] rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg relative">
              {{ authStore.userName?.charAt(0).toUpperCase() || 'U' }}
              <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
            </div>

            <!-- Info -->
            <div class="flex flex-col overflow-hidden transition-all duration-300" 
                 :class="uiStore.isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'">
                <span class="text-sm font-bold text-white truncate">{{ authStore.userName }}</span>
                <span class="text-[10px] text-slate-400 truncate">{{ authStore.userRole || 'Admin' }}</span>
            </div>

            <!-- Logout Icon (Hover) -->
            <div class="ml-auto text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" 
                 :class="uiStore.isSidebarCollapsed ? 'hidden' : 'block'">
                <span class="text-lg">🚪</span>
            </div>
        </div>
        
        <!-- Version -->
         <div v-if="!uiStore.isSidebarCollapsed" class="text-center mt-2 opacity-20 hover:opacity-100 transition-opacity">
             <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest cursor-default">v{{ appVersion }}</span>
         </div>
      </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { usePOSStore } from '@/stores/pos'
import { useAuthStore } from '@/stores/auth'
import packageJson from '../../../package.json'

const route = useRoute()
const router = useRouter()
const uiStore = useUIStore()
const posStore = usePOSStore()
const authStore = useAuthStore()
const appVersion = ref(packageJson.version)

// Flattened structure for the "Clean List" look
const mainMenuItems = [
  { path: '/', label: 'Inicio', icon: '🏠', permission: 'dashboard.ver' },
  { path: '/pos', label: 'Caja', icon: '💰', permission: 'pos.acceder' },
  { path: '/mesas', label: 'Salón', icon: '🍷', permission: 'mesas.ver' },
  { path: '/productos', label: 'Catálogo', icon: '🛍️', permission: 'productos.ver' },
  { path: '/inventario', label: 'Stock', icon: '📦', permission: 'inventario.ver' },
  { path: '/reportes', label: 'Reportes', icon: '📊', permission: 'reportes.ver' },
  { path: '/cierre-caja', label: 'Cierre', icon: '🔒', permission: 'cierre.ver' },
]

const bottomMenuItems = [
  { path: '/configuracion', label: 'Ajustes', icon: '⚙️', permission: 'config.ver' },
  { path: '/ayuda', label: 'Ayuda', icon: '❓' } // Optional
]

import { computed } from 'vue'

const visibleMainMenuItems = computed(() => {
  return mainMenuItems.filter(item => {
    if (!item.permission) return true
    return authStore.hasPermission(item.permission as any)
  })
})

const visibleBottomMenuItems = computed(() => {
  return bottomMenuItems.filter(item => {
    if (!item.permission) return true
    return authStore.hasPermission(item.permission as any)
  })
})

const isActive = (item: any) => {
  if (item.path === '/') return route.path === '/'
  return route.path.startsWith(item.path)
}

const handleNavClick = (item: { path: string }) => {
  // Cerrar sidebar en móvil al navegar
  uiStore.closeSidebarMobile()
  if (item.path === '/pos') {
    posStore.setActiveTable(null, null)
    posStore.clearCart()
  }
}

const handleLogout = async () => {
  if (confirm('¿Cerrar sesión?')) {
    const result = await authStore.logout()
    if (result.success) router.push('/login')
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
}
</style>
