import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { CodigoPermiso } from '@/types/auth.types'

/**
 * Composable para verificar permisos fácilmente en componentes
 */
export function usePermissions() {
  const authStore = useAuthStore()

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const can = (permiso: CodigoPermiso): boolean => {
    return authStore.hasPermission(permiso)
  }

  /**
   * Verifica si el usuario tiene TODOS los permisos
   */
  const canAll = (...permisos: CodigoPermiso[]): boolean => {
    return authStore.hasAllPermissions(permisos)
  }

  /**
   * Verifica si el usuario tiene AL MENOS UNO de los permisos
   */
  const canAny = (...permisos: CodigoPermiso[]): boolean => {
    return authStore.hasAnyPermission(permisos)
  }

  /**
   * Computed refs para acceso rápido
   */
  const permissions = computed(() => ({
    // POS
    canAccessPOS: authStore.canAccessPOS,
    canSell: authStore.canSell,
    canApplyDiscounts: authStore.canApplyDiscounts,
    canCancelSales: can('pos.cancelar_ventas'),
    canViewSalesHistory: can('pos.ver_historial'),

    // Productos
    canAccessProducts: authStore.canAccessProducts,
    canCreateProducts: can('productos.crear'),
    canEditProducts: can('productos.editar'),
    canDeleteProducts: can('productos.eliminar'),
    canManageRecipes: can('productos.gestionar_recetas'),

    // Inventario
    canAccessInventory: authStore.canAccessInventory,
    canRegisterEntry: can('inventario.entrada'),
    canRegisterExit: can('inventario.salida'),
    canAdjustInventory: can('inventario.ajuste'),

    // Mesas
    canAccessTables: authStore.canAccessTables,
    canTakeOrders: can('mesas.tomar_orden'),
    canChargetables: can('mesas.cobrar'),
    canCancelOrders: can('mesas.cancelar'),

    // Reportes
    canAccessReports: authStore.canAccessReports,
    canViewSalesReports: can('reportes.ventas'),
    canViewInventoryReports: can('reportes.inventario'),
    canExportReports: can('reportes.exportar'),

    // Configuración
    canAccessConfig: authStore.canAccessConfig,
    canConfigBusiness: can('config.negocio'),
    canConfigTickets: can('config.tickets'),

    // Usuarios
    canAccessUsers: authStore.canAccessUsers,
    canCreateUsers: can('usuarios.crear'),
    canEditUsers: can('usuarios.editar'),
    canDeleteUsers: can('usuarios.eliminar'),
    canManageRoles: authStore.canManageRoles
  }))

  return {
    can,
    canAll,
    canAny,
    permissions
  }
}
