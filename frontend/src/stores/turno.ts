import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

interface TurnoMesero {
    id: string
    usuario_id: string
    hora_inicio: string
    hora_fin: string | null
    total_efectivo: number
    total_tarjeta: number
    total_transferencia: number
    total_credito: number
    cantidad_ventas: number
    estado: 'ABIERTO' | 'CERRADO'
    observaciones: string | null
    usuario?: {
        nombre: string
    }
}

interface ResumenTurno {
    total_efectivo: number
    total_tarjeta: number
    total_transferencia: number
    total_credito: number
    cantidad_ventas: number
    total_general: number
}

interface TurnoState {
    turnoActivo: TurnoMesero | null
    loading: boolean
    error: string | null
}

export const useTurnoStore = defineStore('turno', {
    state: (): TurnoState => ({
        turnoActivo: null,
        loading: false,
        error: null
    }),

    getters: {
        tieneTurnoAbierto: (state) => !!state.turnoActivo,

        horaInicioFormateada: (state) => {
            if (!state.turnoActivo) return ''
            const fecha = new Date(state.turnoActivo.hora_inicio)
            return fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
        },

        duracionTurno: (state) => {
            if (!state.turnoActivo) return ''
            const inicio = new Date(state.turnoActivo.hora_inicio)
            const ahora = new Date()
            const diffMs = ahora.getTime() - inicio.getTime()
            const horas = Math.floor(diffMs / (1000 * 60 * 60))
            const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
            return `${horas}h ${minutos}m`
        }
    },

    actions: {
        /**
         * Obtiene el turno activo del usuario actual
         */
        async fetchTurnoActivo() {
            const authStore = useAuthStore()
            if (!authStore.usuario?.id) return

            this.loading = true
            try {
                const { data, error } = await supabase
                    .from('turnos_mesero')
                    .select('*')
                    .eq('usuario_id', authStore.usuario.id)
                    .eq('estado', 'ABIERTO')
                    .maybeSingle()

                if (error) throw error
                this.turnoActivo = data
            } catch (err: any) {
                console.error('Error al obtener turno activo:', err)
                this.error = err.message
            } finally {
                this.loading = false
            }
        },

        /**
         * Verifica el estado de turnos del día y auto-inicia si corresponde
         */
        async verificarYAutoIniciarTurno(adminPin?: string): Promise<{ success: boolean, error?: string, requiresAuth?: boolean }> {
            const authStore = useAuthStore()
            if (!authStore.usuario?.id) {
                return { success: false, error: 'Usuario no autenticado' }
            }

            // Calcular rango del día operativo actual
            const now = new Date()
            if (now.getHours() < 6) {
                now.setDate(now.getDate() - 1)
            }
            const year = now.getFullYear()
            const month = now.getMonth()
            const day = now.getDate()
            const inicioDiaOperativo = new Date(year, month, day, 6, 0, 0).toISOString()
            const finDiaOperativo = new Date(year, month, day + 1, 6, 0, 0).toISOString()

            this.loading = true
            try {
                // Si el usuario proporcionó un PIN de autorización, validarlo
                if (adminPin) {
                    const { data: adminUser, error: adminErr } = await supabase
                        .from('usuarios')
                        .select('*, rol:roles(*)')
                        .eq('pin', adminPin)
                        .eq('activo', true)
                        .single()
                    
                    if (adminErr || !adminUser) {
                        return { success: false, error: 'PIN de autorización incorrecto' }
                    }
                    
                    // Verificar si es admin/gerente (suponemos que sí si el código pasa, o verificamos el rol)
                    const tienePermisoAdmin = adminUser.rol?.nombre === 'Administrador' || adminUser.rol?.nombre === 'Gerente'
                    if (!tienePermisoAdmin) {
                        return { success: false, error: 'El usuario no tiene permisos de autorización' }
                    }
                } else {
                    // Verificar si hay turnos cerrados HOY (día operativo)
                    const { data: turnosCerradosHoy, error: turnosErr } = await supabase
                        .from('turnos_mesero')
                        .select('id')
                        .eq('usuario_id', authStore.usuario.id)
                        .eq('estado', 'CERRADO')
                        .gte('hora_inicio', inicioDiaOperativo)
                        .lt('hora_inicio', finDiaOperativo)

                    if (turnosErr) throw turnosErr

                    if (turnosCerradosHoy && turnosCerradosHoy.length > 0) {
                        // Ya cerró caja hoy
                        return { success: false, requiresAuth: true, error: 'Caja ya cerrada por hoy. Requiere autorización.' }
                    }
                }

                // Verificar si ya tiene turno abierto
                if (!this.turnoActivo) {
                    await this.fetchTurnoActivo()
                }

                if (this.turnoActivo) {
                    return { success: true } // Ya está abierto
                }

                // Iniciar nuevo turno
                const { data, error } = await supabase
                    .from('turnos_mesero')
                    .insert({
                        usuario_id: authStore.usuario.id,
                        hora_inicio: new Date().toISOString(),
                        estado: 'ABIERTO'
                    })
                    .select()
                    .single()

                if (error) throw error
                this.turnoActivo = data
                return { success: true }
            } catch (err: any) {
                console.error('Error al iniciar turno:', err)
                this.error = err.message
                return { success: false, error: err.message }
            } finally {
                this.loading = false
            }
        },

        /**
         * Calcula el resumen de ventas del turno actual
         */
        async calcularResumenTurno(): Promise<ResumenTurno> {
            if (!this.turnoActivo) {
                return {
                    total_efectivo: 0,
                    total_tarjeta: 0,
                    total_transferencia: 0,
                    total_credito: 0,
                    cantidad_ventas: 0,
                    total_general: 0
                }
            }

            try {
                const { data: ventas, error } = await supabase
                    .from('ventas')
                    .select('total, metodo_pago')
                    .eq('turno_id', this.turnoActivo.id)
                    .eq('estado', 'COMPLETADA')

                if (error) throw error

                const resumen: ResumenTurno = {
                    total_efectivo: 0,
                    total_tarjeta: 0,
                    total_transferencia: 0,
                    total_credito: 0,
                    cantidad_ventas: ventas?.length || 0,
                    total_general: 0
                }

                for (const venta of ventas || []) {
                    const total = Number(venta.total) || 0
                    switch (venta.metodo_pago) {
                        case 'EFECTIVO':
                            resumen.total_efectivo += total
                            break
                        case 'TARJETA':
                            resumen.total_tarjeta += total
                            break
                        case 'TRANSFERENCIA':
                            resumen.total_transferencia += total
                            break
                        case 'CREDITO':
                            resumen.total_credito += total
                            break
                    }
                    resumen.total_general += total
                }

                return resumen
            } catch (err) {
                console.error('Error al calcular resumen:', err)
                return {
                    total_efectivo: 0,
                    total_tarjeta: 0,
                    total_transferencia: 0,
                    total_credito: 0,
                    cantidad_ventas: 0,
                    total_general: 0
                }
            }
        },

        /**
         * Cierra el turno actual
         */
        async cerrarTurno(observaciones?: string): Promise<{ success: boolean, resumen?: ResumenTurno, error?: string }> {
            if (!this.turnoActivo) {
                return { success: false, error: 'No hay turno abierto' }
            }

            this.loading = true
            try {
                // Calcular resumen antes de cerrar
                const resumen = await this.calcularResumenTurno()

                // Actualizar turno con totales y cerrar
                const { error } = await supabase
                    .from('turnos_mesero')
                    .update({
                        hora_fin: new Date().toISOString(),
                        total_efectivo: resumen.total_efectivo,
                        total_tarjeta: resumen.total_tarjeta,
                        total_transferencia: resumen.total_transferencia,
                        total_credito: resumen.total_credito,
                        cantidad_ventas: resumen.cantidad_ventas,
                        estado: 'CERRADO',
                        observaciones: observaciones || null
                    })
                    .eq('id', this.turnoActivo.id)

                if (error) throw error

                this.turnoActivo = null
                return { success: true, resumen }
            } catch (err: any) {
                console.error('Error al cerrar turno:', err)
                this.error = err.message
                return { success: false, error: err.message }
            } finally {
                this.loading = false
            }
        }
    }
})
