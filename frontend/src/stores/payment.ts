import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { useCartStore } from './cart'
import { useProductosStore } from './productos'
import { useConfiguracionStore } from './configuracion'
import { useAuthStore } from './auth'
import { useTurnoStore } from './turno'



export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CREDITO'

interface PaymentState {
    processingSale: boolean
    error: string | null
}

export const usePaymentStore = defineStore('payment', {
    state: (): PaymentState => ({
        processingSale: false,
        error: null
    }),

    actions: {
        /**
         * Calcula totales finales aplicando descuento
         */
        calculateFinalTotals(discountAmount: number = 0) {
            const cartStore = useCartStore()
            const configStore = useConfiguracionStore()

            const rawTotals = cartStore.cartTotals
            const finalTotal = Math.max(0, rawTotals.total - discountAmount)
            const ivaRate = configStore.porcentajeIVA / 100 || 0.19
            const finalNeto = Math.round(finalTotal / (1 + ivaRate))
            const finalIva = finalTotal - finalNeto

            return { finalNeto, finalIva, finalTotal }
        },

        /**
         * Valida el stock disponible para todos los items del carrito
         */
        async validateStock(): Promise<{ valid: boolean, error?: string }> {
            const cartStore = useCartStore()
            const productosStore = useProductosStore()
            const consumoTotal = new Map<string, number>()

            // Calcular consumo total por producto
            for (const item of cartStore.cart) {
                const producto = productosStore.productos.find(p => p.id === item.productoId)
                if (!producto) continue

                if (producto.tipo_producto === 'SIMPLE') {
                    const actual = consumoTotal.get(producto.id) || 0
                    consumoTotal.set(producto.id, actual + item.cantidad)
                } else if (producto.tipo_producto === 'COMPUESTO' && producto.receta) {
                    const receta = Array.isArray(producto.receta) ? producto.receta[0] : producto.receta
                    if (receta && receta.componentes) {
                        for (const comp of receta.componentes) {
                            if (comp.producto_simple) {
                                const id = comp.producto_simple.id
                                const cant = comp.cantidad * item.cantidad
                                const actual = consumoTotal.get(id) || 0
                                consumoTotal.set(id, actual + cant)
                            }
                        }
                    }
                }
            }

            if (consumoTotal.size === 0) return { valid: true }

            // Verificar stock en BD
            const idsToCheck = Array.from(consumoTotal.keys())
            const { data: stocksDB, error: stockError } = await supabase
                .from('productos')
                .select('id, nombre, stock_actual, contenido_total')
                .in('id', idsToCheck)

            if (stockError) {
                return { valid: false, error: stockError.message }
            }

            for (const prodDB of stocksDB || []) {
                const requerido = consumoTotal.get(prodDB.id) || 0
                const factorConversion = prodDB.contenido_total || 1
                const totalDisponible = prodDB.stock_actual * factorConversion

                if (totalDisponible < requerido) {
                    return {
                        valid: false,
                        error: `Stock insuficiente para ${prodDB.nombre}. Requerido: ${requerido}, Disponible: ${totalDisponible}`
                    }
                }
            }

            return { valid: true }
        },

        /**
         * Descuenta el stock de los productos vendidos
         * IMPORTANTE: Consulta la BD directamente para evitar problemas de caché
         */
        async deductStock(ventaId: string): Promise<void> {
            const cartStore = useCartStore()
            const productosStore = useProductosStore()

            console.log(`📉 deductStock: Procesando ${cartStore.cart.length} items para venta ${ventaId}`)

            for (const item of cartStore.cart) {
                console.log(`  → Procesando: ${item.nombre} (ID: ${item.productoId}), cantidad: ${item.cantidad}`)

                // Buscar primero en el store local
                let productoFull: any = productosStore.productos.find(p => p.id === item.productoId)

                // Si no está en el store, consultar la BD directamente
                if (!productoFull) {
                    console.log(`    ⚠️ Producto no encontrado en store, consultando BD...`)
                    const { data: productoBD, error } = await supabase
                        .from('productos')
                        .select(`*, receta:recetas(id, componentes:componentes_receta(cantidad, unidad_medida, producto_simple:productos(id, stock_actual, contenido_total)))`)
                        .eq('id', item.productoId)
                        .single()

                    if (error || !productoBD) {
                        console.error(`    ❌ Producto ${item.nombre} no encontrado en BD, saltando...`)
                        continue
                    }
                    productoFull = productoBD
                    console.log(`    ✅ Producto encontrado en BD: ${productoFull.nombre}, tipo: ${productoFull.tipo_producto}`)
                }

                if (productoFull.tipo_producto === 'SIMPLE') {
                    const nuevoStock = productoFull.stock_actual - item.cantidad
                    console.log(`    📦 SIMPLE: Stock ${productoFull.stock_actual} → ${nuevoStock}`)

                    const { error: updateError } = await supabase
                        .from('productos')
                        .update({ stock_actual: nuevoStock })
                        .eq('id', item.productoId)

                    if (updateError) {
                        console.error(`    ❌ Error actualizando stock:`, updateError)
                    }

                    const { error: movError } = await supabase.from('movimientos_stock').insert({
                        producto_id: item.productoId,
                        tipo_movimiento: 'SALIDA',
                        cantidad: item.cantidad,
                        observaciones: `Venta POS #${ventaId}`
                    })

                    if (movError) {
                        console.error(`    ❌ Error insertando movimiento:`, movError)
                    } else {
                        console.log(`    ✅ Movimiento de stock registrado`)
                    }

                } else if (productoFull.tipo_producto === 'COMPUESTO' && productoFull.receta) {
                    console.log(`    🧪 COMPUESTO: Procesando ingredientes...`)
                    const recetaData = Array.isArray(productoFull.receta) ? productoFull.receta[0] : productoFull.receta
                    if (recetaData && recetaData.componentes) {
                        for (const componente of recetaData.componentes) {
                            if (componente.producto_simple) {
                                const ingredienteId = componente.producto_simple.id
                                const cantidadRequeridaTotal = componente.cantidad * item.cantidad

                                const { data: ingDB } = await supabase
                                    .from('productos')
                                    .select('stock_actual, contenido_total')
                                    .eq('id', ingredienteId)
                                    .single()

                                if (ingDB) {
                                    const contenidoEnvase = ingDB.contenido_total || 1
                                    const unidadesADescontar = cantidadRequeridaTotal / contenidoEnvase
                                    let nuevoStockIng = Math.max(0, Number((ingDB.stock_actual - unidadesADescontar).toFixed(4)))

                                    await supabase
                                        .from('productos')
                                        .update({ stock_actual: nuevoStockIng })
                                        .eq('id', ingredienteId)

                                    await supabase.from('movimientos_stock').insert({
                                        producto_id: ingredienteId,
                                        tipo_movimiento: 'SALIDA',
                                        cantidad: Number(unidadesADescontar.toFixed(4)),
                                        observaciones: `Venta POS #${ventaId} (Ingrediente de ${productoFull.nombre})`
                                    })
                                    console.log(`      → Ingrediente ${ingredienteId}: -${unidadesADescontar.toFixed(4)} unidades`)
                                }
                            }
                        }
                    }
                } else {
                    console.warn(`    ⚠️ Tipo de producto no manejado: ${productoFull.tipo_producto}`)
                }
            }

            // Refrescar productos
            console.log(`📉 deductStock: Refrescando productos...`)
            await productosStore.fetchProductos()
            console.log(`📉 deductStock: Completado`)
        },

        /**
         * Procesa una venta completa
         */
        async processSale(
            paymentMethod: PaymentMethod,
            cliente?: string,
            discountAmount: number = 0
        ): Promise<{ success: boolean, data?: any, error?: string }> {
            const cartStore = useCartStore()

            this.processingSale = true
            this.error = null

            // Verificar modo offline
            if (!navigator.onLine) {
                return this.processOfflineSale(paymentMethod, cliente, discountAmount)
            }

            if (cartStore.cart.length === 0) {
                this.error = "El carrito está vacío"
                this.processingSale = false
                return { success: false, error: "El carrito está vacío" }
            }

            try {
                // 1. Validar stock
                const stockValidation = await this.validateStock()
                if (!stockValidation.valid) {
                    throw new Error(stockValidation.error)
                }

                // 2. Calcular totales
                const { finalNeto, finalIva, finalTotal } = this.calculateFinalTotals(discountAmount)

                let ventaId: string
                let ventaData: any

                // 3. Crear o actualizar venta según flujo (mesa vs directo)
                if (cartStore.activeTableId) {
                    // == FLUJO MESA ==
                    const result = await this.processTableSale(paymentMethod, cliente, finalNeto, finalIva, finalTotal, discountAmount)
                    if (!result.success) throw new Error(result.error)
                    ventaId = result.ventaId!
                    ventaData = result.ventaData
                } else {
                    // == FLUJO DIRECTO ==
                    const result = await this.processDirectSale(paymentMethod, cliente, finalNeto, finalIva, finalTotal, discountAmount)
                    if (!result.success) throw new Error(result.error)
                    ventaId = result.ventaId!
                    ventaData = result.ventaData
                }

                // 4. Descontar stock
                await this.deductStock(ventaId)

                // 5. Limpiar estado
                cartStore.clearCart()
                if (cartStore.activeTableId) {
                    cartStore.reset()
                }

                this.processingSale = false
                return { success: true, data: ventaData }

            } catch (err: any) {
                console.error('Error processing sale:', err)
                this.error = err.message
                this.processingSale = false
                return { success: false, error: err.message }
            }
        },

        /**
         * Procesa venta para mesa (actualiza venta pendiente)
         */
        async processTableSale(
            paymentMethod: PaymentMethod,
            cliente: string | undefined,
            finalNeto: number,
            finalIva: number,
            finalTotal: number,
            discountAmount: number
        ): Promise<{ success: boolean, ventaId?: string, ventaData?: any, error?: string }> {
            const cartStore = useCartStore()

            // Buscar venta pendiente usando activeVentaId o mesaId
            let ventaId = cartStore.activeVentaId

            if (!ventaId) {
                const { data: existingSale, error: fetchError } = await supabase
                    .from('ventas')
                    .select('id')
                    .eq('mesa_id', cartStore.activeTableId)
                    .eq('estado', 'PENDIENTE')
                    .maybeSingle()

                if (fetchError) return { success: false, error: fetchError.message }
                if (!existingSale) return { success: false, error: 'No se encontró la comanda abierta para esta mesa.' }
                ventaId = existingSale.id
            }

            // Get current user and shift for attribution
            const authStore = useAuthStore()
            const turnoStore = useTurnoStore()

            // Actualizar venta
            const { data: updatedSale, error: updateError } = await supabase
                .from('ventas')
                .update({
                    estado: 'COMPLETADA',
                    metodo_pago: paymentMethod,
                    cliente_nombre: cliente || null,
                    subtotal: finalNeto,
                    iva: finalIva,
                    total: finalTotal,
                    descuento: discountAmount,
                    fecha: new Date().toISOString(),
                    vendedor_id: authStore.usuario?.id || null,
                    turno_id: turnoStore.turnoActivo?.id || null
                })
                .eq('id', ventaId)
                .select()
                .single()

            if (updateError) return { success: false, error: updateError.message }

            // Reemplazar items
            await supabase.from('items_venta').delete().eq('venta_id', ventaId)

            const itemsData = cartStore.cart.map(item => ({
                venta_id: ventaId,
                producto_id: item.productoId,
                nombre_producto: item.nombre,
                cantidad: item.cantidad,
                precio_unitario: item.precioUnitario,
                subtotal: item.precioUnitario * item.cantidad,
                costo: item.costo
            }))

            const { error: insertError } = await supabase.from('items_venta').insert(itemsData)
            if (insertError) return { success: false, error: insertError.message }

            return { success: true, ventaId: ventaId || undefined, ventaData: updatedSale }
        },

        /**
         * Procesa venta directa (crea nueva venta)
         */
        async processDirectSale(
            paymentMethod: PaymentMethod,
            cliente: string | undefined,
            finalNeto: number,
            finalIva: number,
            finalTotal: number,
            discountAmount: number
        ): Promise<{ success: boolean, ventaId?: string, ventaData?: any, error?: string }> {
            const cartStore = useCartStore()
            const authStore = useAuthStore()
            const turnoStore = useTurnoStore()

            const { data: newSale, error: saleError } = await supabase
                .from('ventas')
                .insert({
                    subtotal: finalNeto,
                    iva: finalIva,
                    total: finalTotal,
                    descuento: discountAmount,
                    metodo_pago: paymentMethod,
                    estado: 'COMPLETADA',
                    cliente_nombre: cliente || 'Cliente General',
                    vendedor_id: authStore.usuario?.id || null,
                    turno_id: turnoStore.turnoActivo?.id || null
                })
                .select()
                .single()

            if (saleError) return { success: false, error: saleError.message }

            const itemsToInsert = cartStore.cart.map(item => ({
                venta_id: newSale.id,
                producto_id: item.productoId,
                nombre_producto: item.nombre,
                cantidad: item.cantidad,
                precio_unitario: item.precioUnitario,
                subtotal: item.precioUnitario * item.cantidad,
                costo: item.costo || 0
            }))

            const { error: itemsError } = await supabase.from('items_venta').insert(itemsToInsert)
            if (itemsError) return { success: false, error: itemsError.message }

            return { success: true, ventaId: newSale.id, ventaData: newSale }
        },

        /**
         * Procesa venta en modo offline
         */
        async processOfflineSale(
            paymentMethod: PaymentMethod,
            cliente: string | undefined,
            discountAmount: number
        ): Promise<{ success: boolean, data?: any, error?: string }> {
            const cartStore = useCartStore()
            const productosStore = useProductosStore()

            try {
                const { useOfflineStore } = await import('./offline')
                const offlineStore = useOfflineStore()

                const { finalNeto, finalIva, finalTotal } = this.calculateFinalTotals(discountAmount)
                const ventaId = crypto.randomUUID()

                const ventaData = {
                    subtotal: finalNeto,
                    iva: finalIva,
                    total: finalTotal,
                    descuento: discountAmount,
                    metodo_pago: paymentMethod,
                    estado: 'COMPLETADA',
                    cliente_nombre: cliente || 'Cliente General',
                    mesa_id: cartStore.activeTableId || null,
                    fecha: new Date().toISOString()
                }

                const itemsData = cartStore.cart.map(item => ({
                    producto_id: item.productoId,
                    nombre_producto: item.nombre,
                    cantidad: item.cantidad,
                    precio_unitario: item.precioUnitario,
                    subtotal: item.precioUnitario * item.cantidad,
                    costo: item.costo || 0
                }))

                // Guardar en cola offline
                await offlineStore.addTransaction('SALE', {
                    cabecera: ventaData,
                    items: itemsData
                }, true)

                // Actualización optimista de stock local
                for (const item of cartStore.cart) {
                    const productoFull = productosStore.productos.find(p => p.id === item.productoId)
                    if (productoFull && productoFull.tipo_producto === 'SIMPLE') {
                        const nuevoStock = Math.max(0, productoFull.stock_actual - item.cantidad)
                        productosStore.updateStockLocal(productoFull.id, nuevoStock)
                    }
                }

                cartStore.clearCart()
                if (cartStore.activeTableId) {
                    cartStore.reset()
                }

                this.processingSale = false
                return { success: true, data: { ...ventaData, id: ventaId, isOffline: true } }

            } catch (e: any) {
                this.processingSale = false
                return { success: false, error: 'Error Offline: ' + e.message }
            }
        }
    }
})
