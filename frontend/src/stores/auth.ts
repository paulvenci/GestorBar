import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Usuario, Permiso, CodigoPermiso } from '@/types/auth.types'

interface AuthState {
  user: User | null
  session: Session | null
  usuario: Usuario | null
  permisos: Permiso[]
  loading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    session: null,
    usuario: null,
    permisos: [],
    loading: false,
    error: null
  }),

  getters: {
    // Verificar autenticación
    isAuthenticated: (state) => !!state.user && !!state.usuario,

    // Info del usuario
    userName: (state) => state.usuario?.nombre || state.user?.email || 'Usuario',
    userRole: (state) => state.usuario?.rol?.nombre || 'Sin rol',

    // Verificar permisos
    hasPermission: (state) => {
      return (codigo: CodigoPermiso): boolean => {
        return state.permisos.some(p => p.codigo === codigo)
      }
    },

    // Verificar múltiples permisos (requiere TODOS)
    hasAllPermissions: (state) => {
      return (codigos: CodigoPermiso[]): boolean => {
        return codigos.every(codigo =>
          state.permisos.some(p => p.codigo === codigo)
        )
      }
    },

    // Verificar múltiples permisos (requiere AL MENOS UNO)
    hasAnyPermission: (state) => {
      return (codigos: CodigoPermiso[]): boolean => {
        return codigos.some(codigo =>
          state.permisos.some(p => p.codigo === codigo)
        )
      }
    },

    // Permisos por módulo
    getPermissionsByModule: (state) => {
      return (modulo: string): Permiso[] => {
        return state.permisos.filter(p => p.modulo === modulo)
      }
    },

    // Verificar acceso a módulos
    canAccessPOS: (state) => state.permisos.some(p => p.codigo === 'pos.acceder'),
    canAccessProducts: (state) => state.permisos.some(p => p.codigo === 'productos.ver'),
    canAccessInventory: (state) => state.permisos.some(p => p.codigo === 'inventario.ver'),
    canAccessTables: (state) => state.permisos.some(p => p.codigo === 'mesas.ver'),
    canAccessReports: (state) => state.permisos.some(p => p.codigo === 'reportes.ver'),
    canAccessConfig: (state) => state.permisos.some(p => p.codigo === 'config.ver'),
    canAccessUsers: (state) => state.permisos.some(p => p.codigo === 'usuarios.ver'),

    // Verificaciones específicas comunes
    canSell: (state) => state.permisos.some(p => p.codigo === 'pos.vender'),
    canApplyDiscounts: (state) => state.permisos.some(p => p.codigo === 'pos.aplicar_descuentos'),
    canManageProducts: (state) => state.permisos.some(p => p.codigo === 'productos.editar'),
    canManageRoles: (state) => state.permisos.some(p => p.codigo === 'roles.gestionar')
  },

  actions: {
    // Login con email y password
    async login(email: string, password: string) {
      this.loading = true
      this.error = null

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error

        this.session = data.session
        this.user = data.user

        await this.fetchUsuario()
        await this.fetchPermisos()

        // Registrar sesión
        await this.registrarSesion()

        this.loading = false
        return { success: true }
      } catch (err: any) {
        this.loading = false
        this.error = err.message
        return { success: false, error: err.message }
      }
    },

    // Login rápido con PIN
    async loginWithPIN(pin: string) {
      this.loading = true
      this.error = null

      try {
        // Buscar usuario por PIN
        const { data: usuario, error } = await supabase
          .from('usuarios')
          .select('*, rol:roles(*)')
          .eq('pin', pin)
          .eq('activo', true)
          .single()

        if (error || !usuario) {
          throw new Error('PIN incorrecto o usuario inactivo')
        }

        // Hacer login con el email del usuario
        // Nota: Para login con PIN, el usuario debe haber iniciado sesión al menos una vez con email/password
        // O podemos usar signInWithPassword con el email del usuario
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: usuario.email,
          password: pin // Intentar con el PIN como password (esto fallará si no coincide)
        })

        // Si falla con PIN, intentar obtener la sesión existente
        if (authError) {
          // Verificar si hay una sesión activa
          const { data: { session } } = await supabase.auth.getSession()

          if (!session) {
            throw new Error('PIN correcto, pero necesitas iniciar sesión primero con email y contraseña para habilitar el acceso rápido con PIN')
          }

          // Verificar que el usuario de la sesión coincida con el usuario del PIN
          if (session.user.id !== usuario.id) {
            throw new Error('PIN correcto, pero pertenece a otro usuario. Por favor cierra sesión e inicia con email y contraseña')
          }

          this.session = session
          this.user = session.user
        } else {
          this.session = authData.session
          this.user = authData.user
        }

        this.usuario = usuario as Usuario
        await this.fetchPermisos()
        await this.registrarSesion()

        this.loading = false
        return { success: true }
      } catch (err: any) {
        this.loading = false
        this.error = err.message
        return { success: false, error: err.message }
      }
    },

    // Obtener datos del usuario desde la tabla usuarios
    async fetchUsuario() {
      if (!this.user) return

      const { data, error } = await supabase
        .from('usuarios')
        .select('*, rol:roles(*)')
        .eq('id', this.user.id)
        .single()

      if (error) {
        console.error('Error fetching usuario:', error)
        return
      }

      this.usuario = data as Usuario
    },

    // Obtener permisos del usuario
    async fetchPermisos() {
      if (!this.usuario?.rol_id) return

      const { data, error } = await supabase
        .from('rol_permisos')
        .select('permiso:permisos(*)')
        .eq('rol_id', this.usuario.rol_id)

      if (error) {
        console.error('Error fetching permisos:', error)
        return
      }

      this.permisos = data.map((item: any) => item.permiso) as Permiso[]
      console.log('✅ Permisos cargados:', this.permisos.length)
    },

    // Registrar sesión
    async registrarSesion() {
      if (!this.usuario) return

      try {
        await supabase.from('sesiones_usuario').insert({
          usuario_id: this.usuario.id,
          ip_address: await this.getIPAddress(),
          dispositivo: navigator.userAgent
        })
      } catch (err) {
        console.error('Error registrando sesión:', err)
      }
    },

    // Cerrar sesión
    async logout() {
      try {
        // Cerrar sesión en Supabase
        await supabase.auth.signOut()

        // Limpiar estado
        this.user = null
        this.session = null
        this.usuario = null
        this.permisos = []
        this.error = null

        return { success: true }
      } catch (err: any) {
        console.error('Error al cerrar sesión:', err)
        return { success: false, error: err.message }
      }
    },

    // Inicializar autenticación al cargar la app
    async initAuth() {
      this.loading = true

      try {
        // Verificar sesión existente
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          this.session = session
          this.user = session.user
          await this.fetchUsuario()
          await this.fetchPermisos()
        }

        // Escuchar cambios de autenticación
        supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event)

          if (event === 'SIGNED_IN' && session) {
            this.session = session
            this.user = session.user
            await this.fetchUsuario()
            await this.fetchPermisos()
          } else if (event === 'SIGNED_OUT') {
            this.user = null
            this.session = null
            this.usuario = null
            this.permisos = []
          }
        })
      } catch (err) {
        console.error('Error initializing auth:', err)
      } finally {
        this.loading = false
      }
    },

    // Obtener IP del usuario (best effort)
    async getIPAddress(): Promise<string> {
      try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        return data.ip
      } catch {
        return 'unknown'
      }
    },

    // Verificar permiso (helper)
    checkPermission(codigo: CodigoPermiso): boolean {
      return this.permisos.some(p => p.codigo === codigo)
    }
  }
})
