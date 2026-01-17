import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

interface TurnoConUsuario {
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
    usuario: {
        nombre: string
    }
}

interface ConsolidadoDia {
    total_efectivo: number
    total_tarjeta: number
    total_transferencia: number
    total_credito: number
    cantidad_ventas: number
    total_general: number
}

interface CierreCajaState {
    turnos: TurnoConUsuario[]
    fechaSeleccionada: string
    loading: boolean
    error: string | null
}

// Helper para obtener fecha operativa (10 AM - 1 AM del día siguiente)
function getFechaOperativaRange(fecha: string): { inicio: string, fin: string } {
    // fecha viene como 'YYYY-MM-DD'
    const baseDate = new Date(fecha + 'T10:00:00')
    const nextDay = new Date(baseDate)
    nextDay.setDate(nextDay.getDate() + 1)
    nextDay.setHours(1, 0, 0, 0)

    return {
        inicio: baseDate.toISOString(),
        fin: nextDay.toISOString()
    }
}

export const useCierreCajaStore = defineStore('cierreCaja', {
    state: (): CierreCajaState => ({
        turnos: [],
        fechaSeleccionada: new Date().toISOString().split('T')[0] || new Date().toLocaleDateString('en-CA'),
        loading: false,
        error: null
    }),

    getters: {
        /**
         * Calcula el consolidado de todos los turnos del día
         */
        consolidadoDia: (state): ConsolidadoDia => {
            return state.turnos.reduce((acc, turno) => {
                return {
                    total_efectivo: acc.total_efectivo + Number(turno.total_efectivo || 0),
                    total_tarjeta: acc.total_tarjeta + Number(turno.total_tarjeta || 0),
                    total_transferencia: acc.total_transferencia + Number(turno.total_transferencia || 0),
                    total_credito: acc.total_credito + Number(turno.total_credito || 0),
                    cantidad_ventas: acc.cantidad_ventas + (turno.cantidad_ventas || 0),
                    total_general: acc.total_general +
                        Number(turno.total_efectivo || 0) +
                        Number(turno.total_tarjeta || 0) +
                        Number(turno.total_transferencia || 0) +
                        Number(turno.total_credito || 0)
                }
            }, {
                total_efectivo: 0,
                total_tarjeta: 0,
                total_transferencia: 0,
                total_credito: 0,
                cantidad_ventas: 0,
                total_general: 0
            })
        },

        /**
         * Turnos cerrados del día
         */
        turnosCerrados: (state) => state.turnos.filter(t => t.estado === 'CERRADO'),

        /**
         * Turnos abiertos del día
         */
        turnosAbiertos: (state) => state.turnos.filter(t => t.estado === 'ABIERTO')
    },

    actions: {
        /**
         * Obtiene todos los turnos del día operativo
         */
        async fetchTurnosDia(fecha?: string) {
            this.loading = true
            this.error = null

            const fechaBuscar = fecha || this.fechaSeleccionada
            this.fechaSeleccionada = fechaBuscar

            const { inicio, fin } = getFechaOperativaRange(fechaBuscar)

            try {
                const { data, error } = await supabase
                    .from('turnos_mesero')
                    .select(`
                        *,
                        usuario:usuarios(nombre)
                    `)
                    .gte('hora_inicio', inicio)
                    .lt('hora_inicio', fin)
                    .order('hora_inicio', { ascending: true })

                if (error) throw error
                this.turnos = data || []
            } catch (err: any) {
                console.error('Error al obtener turnos del día:', err)
                this.error = err.message
            } finally {
                this.loading = false
            }
        },

        /**
         * Obtiene las ventas de un turno específico
         */
        async fetchVentasTurno(turnoId: string) {
            try {
                const { data, error } = await supabase
                    .from('ventas')
                    .select(`
                        *,
                        items:items_venta(*)
                    `)
                    .eq('turno_id', turnoId)
                    .eq('estado', 'COMPLETADA')
                    .order('fecha', { ascending: true })

                if (error) throw error
                return data || []
            } catch (err: any) {
                console.error('Error al obtener ventas del turno:', err)
                return []
            }
        },

        /**
         * Cambia la fecha seleccionada y recarga los turnos
         */
        async cambiarFecha(fecha: string) {
            await this.fetchTurnosDia(fecha)
        },

        /**
         * Calcula estadísticas en vivo para un turno abierto
         * Consulta las ventas asociadas al turno directamente
         */
        async calcularEstadisticasTurnoVivo(turnoId: string): Promise<{
            total_efectivo: number
            total_tarjeta: number
            total_transferencia: number
            total_credito: number
            cantidad_ventas: number
            total_general: number
        }> {
            try {
                const { data: ventas, error } = await supabase
                    .from('ventas')
                    .select('total, metodo_pago')
                    .eq('turno_id', turnoId)
                    .eq('estado', 'COMPLETADA')

                if (error) throw error

                const stats = {
                    total_efectivo: 0,
                    total_tarjeta: 0,
                    total_transferencia: 0,
                    total_credito: 0,
                    cantidad_ventas: 0,
                    total_general: 0
                }

                for (const venta of (ventas || [])) {
                    const total = Number(venta.total) || 0
                    stats.total_general += total
                    stats.cantidad_ventas++

                    switch (venta.metodo_pago) {
                        case 'EFECTIVO':
                            stats.total_efectivo += total
                            break
                        case 'TARJETA':
                            stats.total_tarjeta += total
                            break
                        case 'TRANSFERENCIA':
                            stats.total_transferencia += total
                            break
                        case 'CREDITO':
                            stats.total_credito += total
                            break
                    }
                }

                return stats
            } catch (err: any) {
                console.error('Error calculando estadísticas en vivo:', err)
                return {
                    total_efectivo: 0,
                    total_tarjeta: 0,
                    total_transferencia: 0,
                    total_credito: 0,
                    cantidad_ventas: 0,
                    total_general: 0
                }
            }
        }
    }
})
