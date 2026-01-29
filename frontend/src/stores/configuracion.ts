import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

interface ConfigState {
    porcentajeIVA: number
    stockMinimoDefault: number
    moneda: string
    nombreNegocio: string
    logoUrl: string
    diasSinRotacion: number
    diasAnulacionVentas: number
    ticketAncho: '80mm' | '58mm'
    ticketMensajePie: string
    loading: boolean
}

export const useConfiguracionStore = defineStore('configuracion', {
    state: (): ConfigState => ({
        porcentajeIVA: 19,
        stockMinimoDefault: 5,
        moneda: 'CLP',
        nombreNegocio: 'Bar Gordy',
        logoUrl: '',
        diasSinRotacion: 30,
        diasAnulacionVentas: 7,
        ticketAncho: '80mm',
        ticketMensajePie: '¡Gracias por su preferencia!',
        loading: false
    }),

    actions: {
        async fetchConfiguracion() {
            this.loading = true
            try {
                const { data, error } = await supabase
                    .from('configuracion')
                    .select('*')

                if (error) throw error

                // Mapear configuración a state
                data?.forEach(config => {
                    switch (config.clave) {
                        case 'porcentaje_iva':
                            this.porcentajeIVA = Number(config.valor)
                            break
                        case 'stock_minimo_default':
                            this.stockMinimoDefault = Number(config.valor)
                            break
                        case 'moneda':
                            this.moneda = config.valor
                            break
                        case 'nombre_negocio':
                            this.nombreNegocio = config.valor
                            break
                        case 'logo_url':
                            this.logoUrl = config.valor || ''
                            break
                        case 'dias_sin_rotacion':
                            this.diasSinRotacion = Number(config.valor)
                            break
                        case 'dias_anulacion_ventas':
                            this.diasAnulacionVentas = Number(config.valor)
                            break
                        case 'ticket_ancho':
                            this.ticketAncho = config.valor as '80mm' | '58mm'
                            break
                        case 'ticket_mensaje_pie':
                            this.ticketMensajePie = config.valor
                            break
                    }
                })
            } catch (error) {
                console.error('Error al cargar configuración:', error)
            } finally {
                this.loading = false
            }
        },

        async updateConfiguracion(updates: Partial<Omit<ConfigState, 'loading'>>) {
            try {
                const promises = []

                if (updates.porcentajeIVA !== undefined) {
                    promises.push(
                        supabase.from('configuracion').update({ valor: String(updates.porcentajeIVA) }).eq('clave', 'porcentaje_iva')
                    )
                }

                if (updates.stockMinimoDefault !== undefined) {
                    promises.push(
                        supabase.from('configuracion').update({ valor: String(updates.stockMinimoDefault) }).eq('clave', 'stock_minimo_default')
                    )
                }

                if (updates.nombreNegocio !== undefined) {
                    promises.push(
                        supabase.from('configuracion').update({ valor: updates.nombreNegocio }).eq('clave', 'nombre_negocio')
                    )
                }

                if (updates.logoUrl !== undefined) {
                    promises.push(
                        supabase.from('configuracion').upsert({ clave: 'logo_url', valor: updates.logoUrl }, { onConflict: 'clave' })
                    )
                }

                if (updates.diasSinRotacion !== undefined) {
                    promises.push(
                        supabase.from('configuracion').update({ valor: String(updates.diasSinRotacion) }).eq('clave', 'dias_sin_rotacion')
                    )
                }

                if (updates.diasAnulacionVentas !== undefined) {
                    promises.push(
                        supabase.from('configuracion').update({ valor: String(updates.diasAnulacionVentas) }).eq('clave', 'dias_anulacion_ventas')
                    )
                }

                if (updates.ticketAncho !== undefined) {
                    promises.push(
                        supabase.from('configuracion').update({ valor: updates.ticketAncho }).eq('clave', 'ticket_ancho')
                    )
                }

                if (updates.ticketMensajePie !== undefined) {
                    promises.push(
                        supabase.from('configuracion').update({ valor: updates.ticketMensajePie }).eq('clave', 'ticket_mensaje_pie')
                    )
                }

                await Promise.all(promises)

                // Actualizar state local
                Object.assign(this, updates)

                return true
            } catch (error) {
                console.error('Error al actualizar configuración:', error)
                return false
            }
        }
    }
})
