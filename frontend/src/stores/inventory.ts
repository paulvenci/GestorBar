import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { MovimientoStock } from '@/types/database.types'
import { useProductosStore } from './productos'

interface InventoryState {
    movimientos: MovimientoStock[]
    loading: boolean
    error: string | null
}

export const useInventoryStore = defineStore('inventory', {
    state: (): InventoryState => ({
        movimientos: [],
        loading: false,
        error: null
    }),

    actions: {
        async fetchMovimientos(limit = 50) {
            this.loading = true
            this.error = null
            try {
                const { data, error } = await supabase
                    .from('movimientos_stock')
                    .select(`
            *,
            producto:productos(nombre, codigo)
          `)
                    .order('fecha', { ascending: false })
                    .limit(limit)

                if (error) throw error
                this.movimientos = data || []
            } catch (err: any) {
                this.error = err.message
                console.error('Error fetching movimientos:', err)
            } finally {
                this.loading = false
            }
        },

        async registrarMovimiento(movimiento: {
            producto_id: string
            tipo_movimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE'
            cantidad: number
            observaciones?: string
        }) {
            this.loading = true
            this.error = null
            try {
                // Validación básica
                if (movimiento.cantidad < 0) { // Permitir 0 para ajustes
                    throw new Error('La cantidad no puede ser negativa')
                }

                // 1. Obtener stock actual del producto para asegurar consistencia
                const { data: productoActual, error: errorProd } = await supabase
                    .from('productos')
                    .select('stock_actual')
                    .eq('id', movimiento.producto_id)
                    .single()

                if (errorProd || !productoActual) throw new Error('Producto no encontrado')

                let nuevoStock = productoActual.stock_actual
                let cantidadMovimiento = movimiento.cantidad

                // Calcular nuevo stock
                if (movimiento.tipo_movimiento === 'ENTRADA') {
                    nuevoStock += movimiento.cantidad
                } else if (movimiento.tipo_movimiento === 'SALIDA') {
                    if (nuevoStock < movimiento.cantidad) {
                        // Opcional: permitir stock negativo o bloquear
                        // throw new Error('Stock insuficiente')
                    }
                    nuevoStock -= movimiento.cantidad
                } else if (movimiento.tipo_movimiento === 'AJUSTE') {
                    // En Ajuste, la 'cantidad' es el Stock Final Deseado
                    // El movimiento real es la diferencia
                    cantidadMovimiento = Math.abs(nuevoStock - movimiento.cantidad)
                    // Para el historial, guardamos la diferencia positiva, pero el tipo indica ajuste
                    // O podríamos guardar el nuevo stock en observaciones
                    if (!movimiento.observaciones) {
                        movimiento.observaciones = `Ajuste manual de ${productoActual.stock_actual} a ${movimiento.cantidad}`
                    }
                    nuevoStock = movimiento.cantidad
                }

                // 2. Actualizar Producto
                const { error: errorUpdate } = await supabase
                    .from('productos')
                    .update({ stock_actual: nuevoStock })
                    .eq('id', movimiento.producto_id)

                if (errorUpdate) throw errorUpdate

                // 3. Insertar movimiento
                // Si fue ajuste, quizás querramos ajustar la cantidad registrada para que refleje el cambio neto?
                // O dejamos la cantidad como el valor objetivo?
                // Lo estándar es que movimiento refleje el flujo.
                // Si tena 10 y ajusto a 12. Entraron 2.
                // Si tenía 10 y ajusto a 8. Salieron 2.
                // Ajustemos la cantidad del movimiento para reflejar el Delta real si es Ajuste.

                const movimientoFinal = { ...movimiento }
                if (movimiento.tipo_movimiento === 'AJUSTE') {
                    // Si el stock subió, es como una entrada
                    // Si bajó, es como una salida
                    // Pero mantendremos el tipo AJUSTE para trazabilidad
                    movimientoFinal.cantidad = cantidadMovimiento
                }

                const { data, error } = await supabase
                    .from('movimientos_stock')
                    .insert(movimientoFinal)
                    .select()
                    .single()

                if (error) throw error

                // 4. Actualizar store local
                const productosStore = useProductosStore()
                await productosStore.fetchProductos()

                // Recargar movimientos
                await this.fetchMovimientos()

                return { success: true, data }
            } catch (err: any) {
                this.error = err.message
                return { success: false, error: err.message }
            } finally {
                this.loading = false
            }
        }
    }
})
