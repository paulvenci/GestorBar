// Tipos para el sistema de autenticación y permisos

export interface Permiso {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  modulo: string
  created_at: string
}

export interface Rol {
  id: string
  nombre: string
  descripcion?: string
  es_sistema: boolean
  activo: boolean
  created_at: string
  updated_at: string
  permisos?: Permiso[]
}

export interface RolPermiso {
  id: string
  rol_id: string
  permiso_id: string
  created_at: string
}

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol_id: string
  activo: boolean
  pin?: string
  turno_actual?: string
  created_at: string
  updated_at: string
  rol?: Rol
}

export interface SesionUsuario {
  id: string
  usuario_id: string
  fecha_login: string
  fecha_logout?: string
  ip_address?: string
  dispositivo?: string
}

// Códigos de permisos (para autocompletado y type-safety)
export type CodigoPermiso =
  // Dashboard
  | 'dashboard.ver'
  // POS
  | 'pos.acceder'
  | 'pos.vender'
  | 'pos.aplicar_descuentos'
  | 'pos.cancelar_ventas'
  | 'pos.ver_historial'
  // Productos
  | 'productos.ver'
  | 'productos.crear'
  | 'productos.editar'
  | 'productos.eliminar'
  | 'productos.gestionar_recetas'
  // Inventario
  | 'inventario.ver'
  | 'inventario.entrada'
  | 'inventario.salida'
  | 'inventario.ajuste'
  // Mesas
  | 'mesas.ver'
  | 'mesas.tomar_orden'
  | 'mesas.cobrar'
  | 'mesas.cancelar'
  // Reportes
  | 'reportes.ver'
  | 'reportes.ventas'
  | 'reportes.inventario'
  | 'reportes.exportar'
  | 'cierre.ver'
  // Configuración
  | 'config.ver'
  | 'config.negocio'
  | 'config.tickets'
  // Usuarios
  | 'usuarios.ver'
  | 'usuarios.crear'
  | 'usuarios.editar'
  | 'usuarios.eliminar'
  | 'roles.gestionar'

// Módulos del sistema
export type Modulo = 
  | 'dashboard'
  | 'pos'
  | 'productos'
  | 'inventario'
  | 'mesas'
  | 'reportes'
  | 'config'
  | 'usuarios'
