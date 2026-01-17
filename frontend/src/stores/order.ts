import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { useCartStore } from './cart'
import type { ItemCarrito } from '@/types/database.types'



export interface ClienteInfo {
    nombre: string
    ventaId: string
    total: number
    itemCount: number
}

interface OrderState {
    loading: boolean
    error: string | null
}

export const useOrderStore = defineStore('order', {
    state: (): OrderState => ({
        loading: false,
        error: null
    }),

    actions: {
        /**
         * Obtiene los clientes con pedidos pendientes en una mesa
         */
        async getClientesMesa(mesaId: string): Promise<ClienteInfo[]> {
            const { data, error } = await supabase
                .from('ventas')
                .select('id, cliente_nombre, total, items:items_venta(cantidad)')
                .eq('mesa_id', mesaId)
                .eq('estado', 'PENDIENTE')

            if (error) {
                console.error('Error fetching clients:', error)
                return []
            }

            return (data || []).map(v => ({
                nombre: v.cliente_nombre || 'Sin nombre',
                ventaId: v.id,
                total: v.total || 0,
                itemCount: v.items?.reduce((sum: number, i: any) => sum + (i.cantidad || 0), 0) || 0
            }))
        },

        /**
         * Carga un pedido existente en el carrito
         */
        async loadOrder(): Promise<boolean> {
            const cartStore = useCartStore()

            if (!cartStore.activeVentaId) {
                cartStore.clearCart()
                this.loading = false
                return false
            }
            return this.loadClientOrder(cartStore.activeVentaId)
        },

        /**
         * Carga el pedido de un cliente específico
         */
        async loadClientOrder(ventaId: string): Promise<boolean> {
            const cartStore = useCartStore()
            this.loading = true

            const { data: venta, error } = await supabase
                .from('ventas')
                .select('*, items:items_venta(*)')
                .eq('id', ventaId)
                .single()

            if (error) {
                console.error('Error loading order:', error)
                this.error = error.message
                this.loading = false
                return false
            }

            if (venta && venta.items) {
                cartStore.activeVentaId = venta.id
                cartStore.activeClientName = venta.cliente_nombre || 'Sin nombre'

                const productIds = venta.items.map((i: any) => i.producto_id)
                const { data: productsInfo } = await supabase
                    .from('productos')
                    .select('id, stock_actual, valor_costo, foto, descripcion')
                    .in('id', productIds)

                const productsMap = new Map(productsInfo?.map((p: any) => [p.id, p]) || [])

                const items: ItemCarrito[] = venta.items.map((i: any) => {
                    const pInfo = productsMap.get(i.producto_id)
                    return {
                        productoId: i.producto_id,
                        nombre: i.nombre_producto,
                        cantidad: i.cantidad,
                        precioUnitario: i.precio_unitario,
                        subtotal: i.subtotal,
                        costo: i.costo,
                        stock: pInfo?.stock_actual || 999,
                        foto: pInfo?.foto,
                        descripcion: pInfo?.descripcion
                    }
                })

                cartStore.loadItems(items)
                this.loading = false
                return true
            }

            cartStore.clearCart()
            this.loading = false
            return false
        },

        /**
         * Guarda el pedido actual (park order)
         */
        async parkOrder(): Promise<{ success: boolean, error?: string }> {
            const cartStore = useCartStore()

            if (!cartStore.activeTableId) return { success: false, error: 'No hay mesa seleccionada' }
            if (!cartStore.activeClientName) return { success: false, error: 'No hay cliente seleccionado' }
            if (cartStore.cart.length === 0) return { success: false, error: 'Carrito vacío' }

            this.loading = true

            try {
                const totals = cartStore.cartTotals

                // Buscar venta existente para este cliente en esta mesa
                let query = supabase
                    .from('ventas')
                    .select('id')
                    .eq('mesa_id', cartStore.activeTableId)
                    .eq('estado', 'PENDIENTE')
                    .eq('cliente_nombre', cartStore.activeClientName)

                // Si tenemos ventaId activo, usarlo directamente
                if (cartStore.activeVentaId) {
                    query = supabase
                        .from('ventas')
                        .select('id')
                        .eq('id', cartStore.activeVentaId)
                        .eq('estado', 'PENDIENTE')
                }

                const { data: existingSale } = await query.maybeSingle()

                let saleId = existingSale?.id

                if (saleId) {
                    // Actualizar venta existente
                    await supabase.from('items_venta').delete().eq('venta_id', saleId)

                    await supabase.from('ventas').update({
                        subtotal: totals.neto,
                        iva: totals.iva,
                        total: totals.total,
                        cliente_nombre: cartStore.activeClientName,
                        fecha: new Date().toISOString()
                    }).eq('id', saleId)
                } else {
                    // Crear nueva venta
                    const { data: newSale, error: saleError } = await supabase
                        .from('ventas')
                        .insert({
                            subtotal: totals.neto,
                            iva: totals.iva,
                            total: totals.total,
                            metodo_pago: null,
                            estado: 'PENDIENTE',
                            mesa_id: cartStore.activeTableId,
                            cliente_nombre: cartStore.activeClientName
                        })
                        .select()
                        .single()

                    if (saleError) throw saleError
                    saleId = newSale.id
                    cartStore.activeVentaId = saleId
                }

                // Insertar items
                const itemsData = cartStore.cart.map(item => ({
                    venta_id: saleId,
                    producto_id: item.productoId,
                    nombre_producto: item.nombre,
                    cantidad: item.cantidad,
                    precio_unitario: item.precioUnitario,
                    subtotal: item.precioUnitario * item.cantidad,
                    costo: item.costo
                }))

                const { error: itemsError } = await supabase
                    .from('items_venta')
                    .insert(itemsData)

                if (itemsError) throw itemsError

                this.loading = false
                return { success: true }

            } catch (err: any) {
                console.error('Error parking order:', err)
                this.loading = false
                return { success: false, error: err.message }
            }
        },

        /**
         * Cancela la orden del cliente activo
         */
        async cancelTableOrder(): Promise<{ success: boolean, error?: string }> {
            const cartStore = useCartStore()

            if (!cartStore.activeTableId) return { success: false, error: 'No hay mesa seleccionada' }
            if (!cartStore.activeVentaId && !cartStore.activeClientName) {
                return { success: false, error: 'No hay cliente seleccionado' }
            }

            this.loading = true

            try {
                let ventaIdToCancel = cartStore.activeVentaId

                // Si no tenemos ventaId pero sí nombre de cliente, buscar la venta
                if (!ventaIdToCancel && cartStore.activeClientName) {
                    const { data: existingSale } = await supabase
                        .from('ventas')
                        .select('id')
                        .eq('mesa_id', cartStore.activeTableId)
                        .eq('cliente_nombre', cartStore.activeClientName)
                        .eq('estado', 'PENDIENTE')
                        .maybeSingle()

                    ventaIdToCancel = existingSale?.id || null
                }

                if (ventaIdToCancel) {
                    const { error } = await supabase
                        .from('ventas')
                        .update({ estado: 'CANCELADA' })
                        .eq('id', ventaIdToCancel)

                    if (error) throw error
                }

                cartStore.reset()
                this.loading = false
                return { success: true }

            } catch (err: any) {
                console.error('Error canceling order:', err)
                this.loading = false
                return { success: false, error: err.message }
            }
        }
    }
})
