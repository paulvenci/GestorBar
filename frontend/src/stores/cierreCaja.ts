import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

interface VentaResumen {
    id: string
    numero: number
    fecha: string
    total: number
    metodo_pago: string
    turno_id: string | null
    vendedor_id: string | null
}

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
    ventas_dentro_turno?: VentaResumen[]
    ventas_fuera_turno?: VentaResumen[]
    totales_dentro?: {
        efectivo: number
        tarjeta: number
        transferencia: number
        credito: number
        total: number
        cantidad: number
    }
    totales_fuera?: {
        efectivo: number
        tarjeta: number
        transferencia: number
        credito: number
        total: number
        cantidad: number
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
        },

        /**
         * Obtiene el desglose de ventas de un turno
         * Separa las ventas DENTRO del turno de las FUERA del turno
         */
        async fetchVentasDesgloseTurno(turnoId: string, usuarioId: string, horaInicio: string, horaFin: string | null) {
            try {
                // Determinar el rango de fechas del turno
                const inicio = new Date(horaInicio)
                const fin = horaFin ? new Date(horaFin) : new Date()

                // Obtener todas las ventas del usuario en el período del turno
                const { data: ventas, error } = await supabase
                    .from('ventas')
                    .select('id, numero, fecha, total, metodo_pago, turno_id, vendedor_id')
                    .eq('vendedor_id', usuarioId)
                    .eq('estado', 'COMPLETADA')
                    .gte('fecha', inicio.toISOString())
                    .lte('fecha', fin.toISOString())
                    .order('fecha', { ascending: true })

                if (error) throw error

                // Separar ventas dentro y fuera del turno
                const ventasDentro: VentaResumen[] = []
                const ventasFuera: VentaResumen[] = []

                const totalesDentro = {
                    efectivo: 0,
                    tarjeta: 0,
                    transferencia: 0,
                    credito: 0,
                    total: 0,
                    cantidad: 0
                }

                const totalesFuera = {
                    efectivo: 0,
                    tarjeta: 0,
                    transferencia: 0,
                    credito: 0,
                    total: 0,
                    cantidad: 0
                }

                for (const venta of (ventas || [])) {
                    const ventaResumen: VentaResumen = {
                        id: venta.id,
                        numero: venta.numero,
                        fecha: venta.fecha,
                        total: Number(venta.total) || 0,
                        metodo_pago: venta.metodo_pago,
                        turno_id: venta.turno_id,
                        vendedor_id: venta.vendedor_id
                    }

                    const total = ventaResumen.total

                    // Clasificar la venta
                    if (venta.turno_id === turnoId) {
                        ventasDentro.push(ventaResumen)
                        totalesDentro.total += total
                        totalesDentro.cantidad++

                        switch (venta.metodo_pago) {
                            case 'EFECTIVO':
                                totalesDentro.efectivo += total
                                break
                            case 'TARJETA':
                                totalesDentro.tarjeta += total
                                break
                            case 'TRANSFERENCIA':
                                totalesDentro.transferencia += total
                                break
                            case 'CREDITO':
                                totalesDentro.credito += total
                                break
                        }
                    } else {
                        ventasFuera.push(ventaResumen)
                        totalesFuera.total += total
                        totalesFuera.cantidad++

                        switch (venta.metodo_pago) {
                            case 'EFECTIVO':
                                totalesFuera.efectivo += total
                                break
                            case 'TARJETA':
                                totalesFuera.tarjeta += total
                                break
                            case 'TRANSFERENCIA':
                                totalesFuera.transferencia += total
                                break
                            case 'CREDITO':
                                totalesFuera.credito += total
                                break
                        }
                    }
                }

                return {
                    ventas_dentro_turno: ventasDentro,
                    ventas_fuera_turno: ventasFuera,
                    totales_dentro: totalesDentro,
                    totales_fuera: totalesFuera
                }
            } catch (err: any) {
                console.error('Error obteniendo desglose de ventas del turno:', err)
                return {
                    ventas_dentro_turno: [],
                    ventas_fuera_turno: [],
                    totales_dentro: {
                        efectivo: 0,
                        tarjeta: 0,
                        transferencia: 0,
                        credito: 0,
                        total: 0,
                        cantidad: 0
                    },
                    totales_fuera: {
                        efectivo: 0,
                        tarjeta: 0,
                        transferencia: 0,
                        credito: 0,
                        total: 0,
                        cantidad: 0
                    }
                }
            }
        }
    }
})
