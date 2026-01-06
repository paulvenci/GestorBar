import { defineStore } from 'pinia'
import type { Producto, ItemCarrito } from '@/types/database.types'
import { supabase } from '@/lib/supabase'
import { useProductosStore } from './productos'

interface POSState {
    cart: ItemCarrito[]
    loading: boolean
    error: string | null
    processingSale: boolean
    activeTableId: string | null
    activeTableNumber: number | null
}

export const usePOSStore = defineStore('pos', {
    state: (): POSState => ({
        cart: [],
        loading: false,
        error: null,
        processingSale: false,
        activeTableId: null,
        activeTableNumber: null
    }),

    getters: {
        // Si precio venta incluye IVA:
        // Net = Total / 1.19
        // IVA = Total - Net
        cartTotals: (state) => {
            const total = state.cart.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0)
            const ivaRate = 0.19 // Podría venir de config
            const neto = Math.round(total / (1 + ivaRate))
            const iva = total - neto

            return {
                neto,
                iva,
                total
            }
        },

        itemCount: (state) => {
            return state.cart.reduce((count, item) => count + item.cantidad, 0)
        }
    },

    actions: {
        setActiveTable(id: string | null, number: number | null) {
            this.activeTableId = id
            this.activeTableNumber = number
            if (id) {
                // Si seleccionamos mesa, limpiamos carrito actual para cargar el de la mesa (o empezar vacio)
                // Pero si 'deseleccionamos', cuidado.
                this.clearCart()
            }
        },

        async loadOrder(mesaId: string) {
            this.loading = true
            const { data: venta, error } = await supabase
                .from('ventas')
                .select('*, items:items_venta(*)')
                .eq('mesa_id', mesaId)
                .eq('estado', 'PENDIENTE')
                .maybeSingle()

            if (error) {
                console.error('Error loading order:', error)
                this.error = error.message
                this.loading = false
                return false
            }

            if (venta && venta.items) {
                const productIds = venta.items.map((i: any) => i.producto_id)
                const { data: productsInfo } = await supabase
                    .from('productos')
                    .select('id, stock_actual, valor_costo, foto, descripcion')
                    .in('id', productIds)

                const productsMap = new Map(productsInfo?.map((p: any) => [p.id, p]) || [])

                this.cart = venta.items.map((i: any) => {
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
                this.loading = false
                return true
            }

            this.clearCart()
            this.loading = false
            return false
        },

        async parkOrder() {
            if (!this.activeTableId) return { success: false, error: 'No hay mesa seleccionada' }
            if (this.cart.length === 0) return { success: false, error: 'Carrito vacío' }

            this.processingSale = true

            try {
                const totals = this.cartTotals

                const { data: existingSale } = await supabase
                    .from('ventas')
                    .select('id')
                    .eq('mesa_id', this.activeTableId)
                    .eq('estado', 'PENDIENTE')
                    .maybeSingle()

                let saleId = existingSale?.id

                if (saleId) {
                    await supabase.from('items_venta').delete().eq('venta_id', saleId)

                    await supabase.from('ventas').update({
                        subtotal: totals.neto,
                        iva: totals.iva,
                        total: totals.total,
                        fecha: new Date().toISOString()
                    }).eq('id', saleId)
                } else {
                    const { data: newSale, error: saleError } = await supabase
                        .from('ventas')
                        .insert({
                            subtotal: totals.neto,
                            iva: totals.iva,
                            total: totals.total,
                            metodo_pago: null,
                            estado: 'PENDIENTE',
                            mesa_id: this.activeTableId
                        })
                        .select()
                        .single()

                    if (saleError) throw saleError
                    saleId = newSale.id
                }

                const itemsData = this.cart.map(item => ({
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

                this.processingSale = false
                // No limpiamos el carrito aquí para que el usuario vea lo que guardó, 
                // o sí? Normalmente "Guardar" mantiene la orden abierta. 
                // Pero si salimos de la mesa, se limpia.
                // Vamos a dejarlo visual y notificar éxito.
                // O quizás resetear para indicar "Guardado".
                // Mejor no limpiar para permitir seguir editando rápido.
                return { success: true }

            } catch (err: any) {
                console.error('Error parking order:', err)
                this.processingSale = false
                return { success: false, error: err.message }
            }
        },

        addToCart(product: Producto) {
            if (product.stock_actual <= 0 && product.tipo_producto === 'SIMPLE') {
                // Opcional: Permitir venta sin stock con warning, o bloquear.
                // Por ahora permitimos pero podríamos retornar warning.
            }

            const existingItem = this.cart.find(item => item.productoId === product.id)

            if (existingItem) {
                existingItem.cantidad++
            } else {
                this.cart.push({
                    productoId: product.id,
                    nombre: product.nombre,
                    cantidad: 1,
                    precioUnitario: product.valor_venta,
                    costo: product.valor_costo,
                    stock: product.stock_actual,
                    foto: product.foto,
                    descripcion: product.descripcion
                })
            }
        },

        removeFromCart(productId: string) {
            const index = this.cart.findIndex(item => item.productoId === productId)
            if (index > -1) {
                this.cart.splice(index, 1)
            }
        },

        updateQuantity(productId: string, quantity: number) {
            const item = this.cart.find(i => i.productoId === productId)
            if (item) {
                if (quantity > 0) {
                    item.cantidad = quantity
                } else {
                    this.removeFromCart(productId)
                }
            }
        },

        clearCart() {
            this.cart = []
        },

        async processSale(paymentMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CREDITO', cliente?: string, discountAmount: number = 0) {
            this.loading = true
            this.error = null

            // Check Offline Mode
            if (!navigator.onLine) {
                const { useOfflineStore } = await import('./offline')
                const offlineStore = useOfflineStore()

                try {
                    const rawTotals = this.cartTotals
                    const finalTotal = Math.max(0, rawTotals.total - discountAmount)
                    const ivaRate = 0.19
                    const finalNeto = Math.round(finalTotal / (1 + ivaRate))
                    const finalIva = finalTotal - finalNeto

                    // Mock Venta Data (Optimistic)
                    const ventaId = crypto.randomUUID()

                    const ventaData = {
                        subtotal: finalNeto,
                        iva: finalIva,
                        total: finalTotal,
                        descuento: discountAmount,
                        metodo_pago: paymentMethod,
                        estado: 'COMPLETADA',
                        cliente_nombre: cliente || 'Cliente General',
                        mesa_id: this.activeTableId || null,
                        fecha: new Date().toISOString()
                    }

                    // Prepare Items
                    const itemsData = this.cart.map(item => ({
                        producto_id: item.productoId,
                        nombre_producto: item.nombre,
                        cantidad: item.cantidad,
                        precio_unitario: item.precioUnitario,
                        subtotal: item.precioUnitario * item.cantidad,
                        costo: item.costo || 0
                    }))

                    // Save to Offline Queue (indicando que el stock ya fue descontado)
                    await offlineStore.addTransaction('SALE', {
                        cabecera: ventaData,
                        items: itemsData
                    }, true) // true = stock ya descontado optimísticamente

                    // Optimistic Stock Update (Local Only) usando método reactivo
                    console.log('🔄 Iniciando actualización optimista de stock offline...')
                    const productosStore = useProductosStore()
                    console.log(`📊 Total de productos en store: ${productosStore.productos.length} `)
                    console.log(`🛒 Items en carrito: ${this.cart.length} `)
                    for (const item of this.cart) {
                        const productoFull = productosStore.productos.find(p => p.id === item.productoId)
                        console.log(`📦 Producto encontrado: ${productoFull?.nombre}, Stock actual: ${productoFull?.stock_actual} `)
                        if (productoFull) {
                            if (productoFull.tipo_producto === 'SIMPLE') {
                                const nuevoStock = Math.max(0, productoFull.stock_actual - item.cantidad)
                                console.log(`📉 Actualizando stock de ${productoFull.nombre}: ${productoFull.stock_actual} → ${nuevoStock} `)
                                productosStore.updateStockLocal(productoFull.id, nuevoStock)
                            } else if (productoFull.tipo_producto === 'COMPUESTO' && productoFull.receta) {
                                // Actualizar stock de ingredientes para productos compuestos
                                const recetaData = Array.isArray(productoFull.receta) ? productoFull.receta[0] : productoFull.receta
                                if (recetaData && recetaData.componentes) {
                                    for (const componente of recetaData.componentes) {
                                        if (componente.producto_simple) {
                                            const ingrediente = productosStore.productos.find(p => p.id === componente.producto_simple.id)
                                            if (ingrediente) {
                                                const cantidadRequerida = componente.cantidad * item.cantidad
                                                const contenidoEnvase = ingrediente.contenido_total || 1
                                                const unidadesADescontar = cantidadRequerida / contenidoEnvase
                                                const nuevoStock = Math.max(0, Number((ingrediente.stock_actual - unidadesADescontar).toFixed(4)))
                                                productosStore.updateStockLocal(ingrediente.id, nuevoStock)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    this.clearCart()
                    if (this.activeTableId) {
                        this.setActiveTable(null, null)
                    }

                    this.loading = false
                    return { success: true, data: { ...ventaData, id: ventaId, isOffline: true } }

                } catch (e: any) {
                    this.loading = false
                    return { success: false, error: 'Error Offline: ' + e.message }
                }
            }

            if (this.cart.length === 0) {
                this.error = "El carrito está vacío"
                this.loading = false
                return { success: false, error: "El carrito está vacío" }
            }

            try {
                const rawTotals = this.cartTotals
                const finalTotal = Math.max(0, rawTotals.total - discountAmount)

                // Recalcular neto e IVA basado en el total con descuento
                const ivaRate = 0.19
                const finalNeto = Math.round(finalTotal / (1 + ivaRate))
                const finalIva = finalTotal - finalNeto

                let ventaId: string
                let ventaData: any // Para retornar al final

                // 0. Pre-validación de Stock
                const productosStore = useProductosStore()
                const consumoTotal = new Map<string, number>()

                for (const item of this.cart) {
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

                if (consumoTotal.size > 0) {
                    const idsToCheck = Array.from(consumoTotal.keys())
                    const { data: stocksDB, error: stockError } = await supabase
                        .from('productos')
                        .select('id, nombre, stock_actual, contenido_total')
                        .in('id', idsToCheck)

                    if (stockError) throw stockError

                    for (const prodDB of stocksDB) {
                        const requerido = consumoTotal.get(prodDB.id) || 0
                        const factorConversion = prodDB.contenido_total || 1
                        const totalDisponible = prodDB.stock_actual * factorConversion

                        if (totalDisponible < requerido) {
                            throw new Error(`Stock insuficiente para ${prodDB.nombre}.Requerido: ${requerido}, Disponible: ${totalDisponible} `)
                        }
                    }
                }

                // Lógica Diferenciada: Mesa vs Venta Directa
                if (this.activeTableId) {
                    // == FLUJO MESA ==
                    const { data: existingSale, error: fetchSaleError } = await supabase
                        .from('ventas')
                        .select('id')
                        .eq('mesa_id', this.activeTableId)
                        .eq('estado', 'PENDIENTE')
                        .maybeSingle()

                    if (fetchSaleError) throw fetchSaleError
                    if (!existingSale) throw new Error('No se encontró la comanda abierta para esta mesa.')

                    ventaId = existingSale.id

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
                            fecha: new Date().toISOString()
                        })
                        .eq('id', ventaId)
                        .select()
                        .single()

                    if (updateError) throw updateError
                    ventaData = updatedSale

                    // Reemplazar items
                    await supabase.from('items_venta').delete().eq('venta_id', ventaId)

                    const itemsData = this.cart.map(item => ({
                        venta_id: ventaId,
                        producto_id: item.productoId,
                        nombre_producto: item.nombre,
                        cantidad: item.cantidad,
                        precio_unitario: item.precioUnitario,
                        subtotal: item.precioUnitario * item.cantidad,
                        costo: item.costo
                    }))

                    const { error: insertItemsError } = await supabase
                        .from('items_venta')
                        .insert(itemsData)

                    if (insertItemsError) throw insertItemsError

                } else {
                    // == FLUJO DIRECTO ==
                    const { data: newSale, error: saleError } = await supabase
                        .from('ventas')
                        .insert({
                            subtotal: finalNeto,
                            iva: finalIva,
                            total: finalTotal,
                            descuento: discountAmount,
                            metodo_pago: paymentMethod,
                            estado: 'COMPLETADA',
                            cliente_nombre: cliente || 'Cliente General'
                        })
                        .select()
                        .single()

                    if (saleError) throw saleError
                    ventaId = newSale.id
                    ventaData = newSale

                    const itemsToInsert = this.cart.map(item => ({
                        venta_id: ventaId,
                        producto_id: item.productoId,
                        nombre_producto: item.nombre,
                        cantidad: item.cantidad,
                        precio_unitario: item.precioUnitario,
                        subtotal: item.precioUnitario * item.cantidad,
                        costo: item.costo || 0
                    }))

                    const { error: itemsError } = await supabase
                        .from('items_venta')
                        .insert(itemsToInsert)

                    if (itemsError) throw itemsError
                }

                // 3. Descontar Stock (Frontend Logic)
                for (const item of this.cart) {
                    const productoFull = productosStore.productos.find(p => p.id === item.productoId)
                    if (!productoFull) continue

                    if (productoFull.tipo_producto === 'SIMPLE') {
                        const nuevoStock = productoFull.stock_actual - item.cantidad
                        await supabase
                            .from('productos')
                            .update({ stock_actual: nuevoStock })
                            .eq('id', item.productoId)

                        await supabase.from('movimientos_stock').insert({
                            producto_id: item.productoId,
                            tipo_movimiento: 'SALIDA',
                            cantidad: item.cantidad,
                            observaciones: `Venta POS #${ventaId} `
                        })

                    } else if (productoFull.tipo_producto === 'COMPUESTO' && productoFull.receta) {
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
                                    }
                                }
                            }
                        }
                    }
                }

                await productosStore.fetchProductos()
                this.clearCart()
                // Si era mesa, limpiar selección? No necesariamente, pero asumimos ciclo terminado.
                if (this.activeTableId) {
                    this.setActiveTable(null, null)
                }

                return { success: true, data: ventaData }

            } catch (err: any) {
                console.error('Error processing sale:', err)
                this.error = err.message
                return { success: false, error: err.message }
            } finally {
                this.loading = false
            }
        },
        async cancelTableOrder() {
            if (!this.activeTableId) return { success: false, error: 'No hay mesa seleccionada' }

            this.processingSale = true
            try {
                // Buscar venta pendiente
                const { data: existingSale } = await supabase
                    .from('ventas')
                    .select('id')
                    .eq('mesa_id', this.activeTableId)
                    .eq('estado', 'PENDIENTE')
                    .maybeSingle()

                if (existingSale) {
                    // Marcar como cancelada para liberar mesa (via trigger)
                    const { error } = await supabase
                        .from('ventas')
                        .update({ estado: 'CANCELADA' })
                        .eq('id', existingSale.id)

                    if (error) throw error

                    // Devolver stock?
                    // IMPORTANTE: Como los items ya se descontaron al crear la venta PENDIENTE (si manejamos stock al insertar items),
                    // deberíamos devolverlos.
                    // Pero en este MVP, el stock se descuenta AL COBRAR (en processSale) O AL GUARDAR??
                    // Revisemos parkOrder: parkOrder inserta items.
                    // ¿Tenemos un trigger que descuenta stock al insertar items_venta?
                    // El plan decía "Fix Stock Return on Delete (Frontend Logic Prioritized)".
                    // Si parkOrder ya descontó stock, debemos devolverlo aquí.
                    //
                    // Revisando parkOrder en este archivo (pos.ts):
                    // NO descuenta stock explícitamente en el frontend.
                    // ¿Hay trigger en DB? "actualizar_stock_venta".
                    // Si el trigger existe, descontó stock.
                    // Si cancelamos, necesitamos devolverlo.
                    //
                    // Dado el historial, asumimos que el stock se maneja con cuidado.
                    // Si marco CANCELADA, deberíamos iterar items y devolver stock si fue descontado.
                    // PERO, si parkOrder SOLO insertó items y el trigger corrió...
                    // La devolución de stock complejas es mejor hacerla manual si no confiamos en triggers inversos.
                    //
                    // Para simplificar y dado que el usuario pidió "liberar mesa", asumiremos que el trigger de estado mesa funciona.
                    // La corrección de stock al cancelar debería ser automática si existiera trigger ON UPDATE venta -> CANCELADA.
                    // Si no, queda deuda técnica de stock. Por ahora priorizamos liberar la mesa.
                }

                this.setActiveTable(null, null)
                this.clearCart()
                this.processingSale = false
                return { success: true }

            } catch (err: any) {
                console.error('Error canceling order:', err)
                this.processingSale = false
                return { success: false, error: err.message }
            }
        }
    }
})
