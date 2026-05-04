import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

// ── Interfaces ──────────────────────────────────────────────────

interface VentaResumen {
    id: string
    numero: number
    fecha: string
    total: number
    metodo_pago: string
    turno_id: string | null
}

interface TotalesPorMetodo {
    efectivo: number
    tarjeta: number
    transferencia: number
    credito: number
    total: number
    cantidad: number
}

export interface CajeroDia {
    usuario_id: string
    nombre: string
    tiene_turno_abierto: boolean
    turno_inicio: string | null
    turno_ids_del_dia: string[]
    // Totales consolidados (TODAS las ventas del usuario ese día)
    total_efectivo: number
    total_tarjeta: number
    total_transferencia: number
    total_credito: number
    cantidad_ventas: number
    total_recaudado: number
    // Desglose (cargado on-demand al expandir)
    ventas_en_turno?: VentaResumen[]
    ventas_fuera_turno?: VentaResumen[]
    totales_en_turno?: TotalesPorMetodo
    totales_fuera_turno?: TotalesPorMetodo
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
    cajeros: CajeroDia[]
    fechaSeleccionada: string
    loading: boolean
    error: string | null
    modoAdmin: boolean
}

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Rango del día operativo: 06:00 AM del día seleccionado → 06:00 AM del día siguiente
 * Consistente con el módulo de Reportes.
 */
function getDiaOperativoRange(fecha: string): { inicio: string, fin: string } {
    const parts = fecha.split('-').map(Number)
    const year = parts[0] || new Date().getFullYear()
    const month = parts[1] || (new Date().getMonth() + 1)
    const day = parts[2] || new Date().getDate()

    const inicio = new Date(year, month - 1, day, 6, 0, 0)
    const fin = new Date(year, month - 1, day + 1, 6, 0, 0)

    return {
        inicio: inicio.toISOString(),
        fin: fin.toISOString()
    }
}

/**
 * Clasifica un array de ventas sumando totales por método de pago
 */
function calcularTotalesPorMetodo(ventas: VentaResumen[]): TotalesPorMetodo {
    const totales: TotalesPorMetodo = {
        efectivo: 0, tarjeta: 0, transferencia: 0, credito: 0, total: 0, cantidad: ventas.length
    }
    for (const v of ventas) {
        const monto = Number(v.total) || 0
        totales.total += monto
        switch (v.metodo_pago) {
            case 'EFECTIVO': totales.efectivo += monto; break
            case 'TARJETA': totales.tarjeta += monto; break
            case 'TRANSFERENCIA': totales.transferencia += monto; break
            case 'CREDITO': totales.credito += monto; break
        }
    }
    return totales
}

// ── Store ───────────────────────────────────────────────────────

export const useCierreCajaStore = defineStore('cierreCaja', {
    state: (): CierreCajaState => {
        const now = new Date()
        // Si es antes de las 6 AM, día operativo es el anterior
        if (now.getHours() < 6) {
            now.setDate(now.getDate() - 1)
        }
        const todayLocal = now.toLocaleDateString('en-CA') // YYYY-MM-DD

        return {
            cajeros: [],
            fechaSeleccionada: todayLocal,
            loading: false,
            error: null,
            modoAdmin: false
        }
    },

    getters: {
        /**
         * Consolidado sumando todos los cajeros del día
         */
        consolidadoDia: (state): ConsolidadoDia => {
            return state.cajeros.reduce((acc, c) => ({
                total_efectivo: acc.total_efectivo + c.total_efectivo,
                total_tarjeta: acc.total_tarjeta + c.total_tarjeta,
                total_transferencia: acc.total_transferencia + c.total_transferencia,
                total_credito: acc.total_credito + c.total_credito,
                cantidad_ventas: acc.cantidad_ventas + c.cantidad_ventas,
                total_general: acc.total_general + c.total_recaudado
            }), {
                total_efectivo: 0,
                total_tarjeta: 0,
                total_transferencia: 0,
                total_credito: 0,
                cantidad_ventas: 0,
                total_general: 0
            })
        },

        /**
         * El cajero del usuario logueado (primer y único en vista personal)
         */
        miCierre: (state): CajeroDia | null => {
            return state.cajeros.length > 0 && state.cajeros[0] ? state.cajeros[0] : null
        }
    },

    actions: {
        /**
         * Obtiene las ventas del usuario logueado para el día seleccionado.
         * Vista personal del cajero.
         */
        async fetchMiCierre(fecha?: string) {
            const authStore = useAuthStore()
            if (!authStore.usuario?.id) return

            this.modoAdmin = false
            this.loading = true
            this.error = null

            const fechaBuscar = fecha || this.fechaSeleccionada
            this.fechaSeleccionada = fechaBuscar

            try {
                const cajero = await this._buildCajeroData(
                    authStore.usuario.id,
                    authStore.usuario.nombre || 'Usuario',
                    fechaBuscar
                )
                this.cajeros = [cajero]
            } catch (err: any) {
                console.error('Error en fetchMiCierre:', err)
                this.error = err.message
            } finally {
                this.loading = false
            }
        },

        /**
         * Obtiene las ventas de TODOS los cajeros del día.
         * Vista consolidada para Admin/Gerente.
         */
        async fetchConsolidado(fecha?: string) {
            this.modoAdmin = true
            this.loading = true
            this.error = null

            const fechaBuscar = fecha || this.fechaSeleccionada
            this.fechaSeleccionada = fechaBuscar
            const { inicio, fin } = getDiaOperativoRange(fechaBuscar)

            try {
                // 1. Obtener todas las ventas COMPLETADAS del día, agrupadas por vendedor
                const { data: ventas, error: ventasError } = await supabase
                    .from('ventas')
                    .select('id, numero, fecha, total, metodo_pago, turno_id, vendedor_id')
                    .eq('estado', 'COMPLETADA')
                    .gte('fecha', inicio)
                    .lt('fecha', fin)
                    .order('fecha', { ascending: true })

                if (ventasError) throw ventasError

                // 2. Agrupar ventas por vendedor_id
                const ventasPorVendedor = new Map<string, VentaResumen[]>()
                const vendedorIds = new Set<string>()

                for (const v of (ventas || [])) {
                    if (!v.vendedor_id) continue
                    vendedorIds.add(v.vendedor_id)
                    if (!ventasPorVendedor.has(v.vendedor_id)) {
                        ventasPorVendedor.set(v.vendedor_id, [])
                    }
                    ventasPorVendedor.get(v.vendedor_id)!.push({
                        id: v.id,
                        numero: v.numero,
                        fecha: v.fecha,
                        total: Number(v.total) || 0,
                        metodo_pago: v.metodo_pago,
                        turno_id: v.turno_id
                    })
                }

                if (vendedorIds.size === 0) {
                    this.cajeros = []
                    return
                }

                // 3. Obtener nombres de usuarios
                const { data: usuarios, error: usrError } = await supabase
                    .from('usuarios')
                    .select('id, nombre')
                    .in('id', Array.from(vendedorIds))

                if (usrError) throw usrError

                const nombresMap = new Map<string, string>()
                for (const u of (usuarios || [])) {
                    nombresMap.set(u.id, u.nombre)
                }

                // 4. Obtener turnos abiertos del día
                const { data: turnosAbiertos, error: turnosError } = await supabase
                    .from('turnos_mesero')
                    .select('id, usuario_id, hora_inicio')
                    .eq('estado', 'ABIERTO')
                    .gte('hora_inicio', inicio)
                    .lt('hora_inicio', fin)

                if (turnosError) throw turnosError

                const turnoAbiertoMap = new Map<string, string>() // usuario_id → hora_inicio
                for (const t of (turnosAbiertos || [])) {
                    turnoAbiertoMap.set(t.usuario_id, t.hora_inicio)
                }

                // 5. Construir array de cajeros
                const cajeros: CajeroDia[] = []
                for (const [vendedorId, ventasVendedor] of ventasPorVendedor) {
                    const totales = calcularTotalesPorMetodo(ventasVendedor)
                    cajeros.push({
                        usuario_id: vendedorId,
                        nombre: nombresMap.get(vendedorId) || 'Desconocido',
                        tiene_turno_abierto: turnoAbiertoMap.has(vendedorId),
                        turno_inicio: turnoAbiertoMap.get(vendedorId) || null,
                        turno_ids_del_dia: [], // se cargan en fetchDesglose
                        total_efectivo: totales.efectivo,
                        total_tarjeta: totales.tarjeta,
                        total_transferencia: totales.transferencia,
                        total_credito: totales.credito,
                        cantidad_ventas: totales.cantidad,
                        total_recaudado: totales.total
                    })
                }

                // Ordenar por nombre
                cajeros.sort((a, b) => a.nombre.localeCompare(b.nombre))
                this.cajeros = cajeros

            } catch (err: any) {
                console.error('Error en fetchConsolidado:', err)
                this.error = err.message
            } finally {
                this.loading = false
            }
        },

        /**
         * Construye los datos de un cajero específico para un día
         */
        async _buildCajeroData(usuarioId: string, nombre: string, fecha: string): Promise<CajeroDia> {
            const { inicio, fin } = getDiaOperativoRange(fecha)

            // 1. Obtener todas las ventas COMPLETADAS del usuario en el día
            const { data: ventas, error: ventasError } = await supabase
                .from('ventas')
                .select('id, numero, fecha, total, metodo_pago, turno_id')
                .eq('vendedor_id', usuarioId)
                .eq('estado', 'COMPLETADA')
                .gte('fecha', inicio)
                .lt('fecha', fin)
                .order('fecha', { ascending: true })

            if (ventasError) throw ventasError

            // 2. Calcular totales
            const totales = calcularTotalesPorMetodo(
                (ventas || []).map(v => ({
                    id: v.id,
                    numero: v.numero,
                    fecha: v.fecha,
                    total: Number(v.total) || 0,
                    metodo_pago: v.metodo_pago,
                    turno_id: v.turno_id
                }))
            )

            // 3. Verificar turno abierto
            const { data: turnoAbierto } = await supabase
                .from('turnos_mesero')
                .select('id, hora_inicio')
                .eq('usuario_id', usuarioId)
                .eq('estado', 'ABIERTO')
                .maybeSingle()

            return {
                usuario_id: usuarioId,
                nombre,
                tiene_turno_abierto: !!turnoAbierto,
                turno_inicio: turnoAbierto?.hora_inicio || null,
                turno_ids_del_dia: [],
                total_efectivo: totales.efectivo,
                total_tarjeta: totales.tarjeta,
                total_transferencia: totales.transferencia,
                total_credito: totales.credito,
                cantidad_ventas: totales.cantidad,
                total_recaudado: totales.total
            }
        },

        /**
         * Carga el desglose de ventas "En Turno" / "Fuera de Turno"
         * para un cajero específico
         */
        async fetchDesglose(usuarioId: string) {
            const { inicio, fin } = getDiaOperativoRange(this.fechaSeleccionada)

            const cajero = this.cajeros.find(c => c.usuario_id === usuarioId)
            if (!cajero) return

            try {
                // 1. Obtener todos los turno_id del usuario en el día
                const { data: turnos, error: turnosError } = await supabase
                    .from('turnos_mesero')
                    .select('id')
                    .eq('usuario_id', usuarioId)
                    .gte('hora_inicio', inicio)
                    .lt('hora_inicio', fin)

                if (turnosError) throw turnosError

                const turnoIds = new Set((turnos || []).map(t => t.id))
                cajero.turno_ids_del_dia = Array.from(turnoIds)

                // 2. Obtener todas las ventas del usuario en el día
                const { data: ventas, error: ventasError } = await supabase
                    .from('ventas')
                    .select('id, numero, fecha, total, metodo_pago, turno_id')
                    .eq('vendedor_id', usuarioId)
                    .eq('estado', 'COMPLETADA')
                    .gte('fecha', inicio)
                    .lt('fecha', fin)
                    .order('fecha', { ascending: true })

                if (ventasError) throw ventasError

                // 3. Clasificar ventas
                const enTurno: VentaResumen[] = []
                const fueraTurno: VentaResumen[] = []

                for (const v of (ventas || [])) {
                    const venta: VentaResumen = {
                        id: v.id,
                        numero: v.numero,
                        fecha: v.fecha,
                        total: Number(v.total) || 0,
                        metodo_pago: v.metodo_pago,
                        turno_id: v.turno_id
                    }

                    if (v.turno_id && turnoIds.has(v.turno_id)) {
                        enTurno.push(venta)
                    } else {
                        fueraTurno.push(venta)
                    }
                }

                // 4. Actualizar cajero
                cajero.ventas_en_turno = enTurno
                cajero.ventas_fuera_turno = fueraTurno
                cajero.totales_en_turno = calcularTotalesPorMetodo(enTurno)
                cajero.totales_fuera_turno = calcularTotalesPorMetodo(fueraTurno)

            } catch (err: any) {
                console.error('Error en fetchDesglose:', err)
            }
        }
    }
})
