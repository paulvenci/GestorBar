import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { CodigoPermiso } from '@/types/auth.types'

// Importaciones estáticas para todas las rutas (disponibles offline)
import Dashboard from '../views/Dashboard.vue'
import Products from '../views/Products.vue'
import Inventory from '../views/Inventory.vue'
import POS from '../views/POS.vue'
import Tables from '../views/Tables.vue'
import Reports from '../views/Reports.vue'
import Settings from '../views/Settings.vue'
import Login from '../views/Login.vue'

// Extender RouteMeta para incluir permisos
declare module 'vue-router' {
    interface RouteMeta {
        title?: string
        requiresAuth?: boolean
        requiresPermission?: CodigoPermiso
        requiresAnyPermission?: CodigoPermiso[]
    }
}

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: Login,
            meta: { title: 'Iniciar Sesión' }
        },
        {
            path: '/',
            name: 'dashboard',
            component: Dashboard,
            meta: { 
                title: 'Dashboard',
                requiresAuth: true
            }
        },
        {
            path: '/productos',
            name: 'productos',
            component: Products,
            meta: { 
                title: 'Gestión de Productos',
                requiresAuth: true,
                requiresPermission: 'productos.ver'
            }
        },
        {
            path: '/inventario',
            name: 'inventario',
            component: Inventory,
            meta: { 
                title: 'Gestión de Inventario',
                requiresAuth: true,
                requiresPermission: 'inventario.ver'
            }
        },
        {
            path: '/pos',
            name: 'pos',
            component: POS,
            meta: { 
                title: 'Punto de Venta',
                requiresAuth: true,
                requiresPermission: 'pos.acceder'
            }
        },
        {
            path: '/mesas',
            name: 'mesas',
            component: Tables,
            meta: {
                title: 'Mesas',
                requiresAuth: true,
                requiresPermission: 'mesas.ver'
            }
        },
        {
            path: '/reportes',
            name: 'reportes',
            component: Reports,
            meta: { 
                title: 'Reportes',
                requiresAuth: true,
                requiresPermission: 'reportes.ver'
            }
        },
        {
            path: '/configuracion',
            name: 'configuracion',
            component: Settings,
            meta: { 
                title: 'Configuración',
                requiresAuth: true,
                requiresPermission: 'config.ver'
            }
        }
    ]
})

// Guard de autenticación y permisos
router.beforeEach(async (to, from, next) => {
    // Actualizar título
    document.title = `${to.meta.title as string} | Bar Gordy` || 'Bar Gordy'
    
    const authStore = useAuthStore()
    
    // Si va al login y ya está autenticado, redirigir al dashboard
    if (to.path === '/login' && authStore.isAuthenticated) {
        next('/')
        return
    }
    
    // Si la ruta no requiere autenticación, permitir acceso
    if (!to.meta.requiresAuth) {
        next()
        return
    }
    
    // Verificar autenticación
    if (!authStore.isAuthenticated) {
        console.log('⚠️ No autenticado, redirigiendo a login')
        next('/login')
        return
    }
    
    // Verificar permiso específico
    if (to.meta.requiresPermission) {
        const hasPermission = authStore.hasPermission(to.meta.requiresPermission)
        if (!hasPermission) {
            console.log(`⚠️ Sin permiso: ${to.meta.requiresPermission}`)
            alert(`No tienes permiso para acceder a ${to.meta.title}`)
            next(from.path || '/')
            return
        }
    }
    
    // Verificar cualquiera de los permisos
    if (to.meta.requiresAnyPermission) {
        const hasAnyPermission = authStore.hasAnyPermission(to.meta.requiresAnyPermission)
        if (!hasAnyPermission) {
            console.log(`⚠️ Sin ninguno de los permisos requeridos`)
            alert(`No tienes permiso para acceder a ${to.meta.title}`)
            next(from.path || '/')
            return
        }
    }
    
    next()
})

export default router
