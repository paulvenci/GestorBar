import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

interface PendingTransaction {
    id: string
    timestamp: number
    type: 'SALE'
    data: any
    stockAlreadyDeducted?: boolean // Flag para indicar si el stock ya fue descontado optimísticamente
}

interface OfflineState {
    isOnline: boolean
    pendingTransactions: PendingTransaction[]
}

export const useOfflineStore = defineStore('offline', {
    state: (): OfflineState => ({
        isOnline: navigator.onLine,
        pendingTransactions: JSON.parse(localStorage.getItem('pendingTransactions') || '[]')
    }),

    actions: {
        initializeListener() {
            window.addEventListener('online', () => {
                this.isOnline = true
                this.syncTransactions()
            })
            window.addEventListener('offline', () => {
                this.isOnline = false
            })
            // Initial check
            this.isOnline = navigator.onLine
        },

        async addTransaction(type: 'SALE', data: any, stockAlreadyDeducted: boolean = false) {
            const txn: PendingTransaction = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                type,
                data,
                stockAlreadyDeducted
            }
            this.pendingTransactions.push(txn)
            this.saveToStorage()
        },

        saveToStorage() {
            localStorage.setItem('pendingTransactions', JSON.stringify(this.pendingTransactions))
        },

        async syncTransactions() {
            if (this.pendingTransactions.length === 0) {
                console.log('ℹ️ No hay transacciones pendientes para sincronizar')
                return
            }

            console.log('🔄 Sincronizando transacciones pendientes...', this.pendingTransactions.length)
            console.log('📋 Datos de transacciones:', JSON.stringify(this.pendingTransactions, null, 2))

            const remaining: PendingTransaction[] = []
            let successCount = 0
            let errorCount = 0

            for (const txn of this.pendingTransactions) {
                try {
                    if (txn.type === 'SALE') {
                        console.log(`🔄 Procesando transacción ${txn.id}...`)

                        const { cabecera, items } = txn.data

                        console.log('📦 Cabecera:', cabecera)
                        console.log('📦 Items:', items)

                        // Insertar venta
                        const { data: ventaData, error: ventaError } = await supabase
                            .from('ventas')
                            .insert(cabecera)
                            .select()
                            .single()

                        if (ventaError) {
                            console.error('❌ Error insertando venta:', ventaError)
                            throw ventaError
                        }

                        const ventaId = ventaData.id
                        console.log(`✅ Venta creada con ID: ${ventaId}`)

                        // Preparar items con validación
                        const itemsToInsert = items.map((item: any) => {
                            const itemData = {
                                venta_id: ventaId,
                                producto_id: item.producto_id,
                                nombre_producto: item.nombre_producto || 'Producto sin nombre',
                                cantidad: item.cantidad,
                                precio_unitario: item.precio_unitario,
                                subtotal: item.subtotal,
                                costo: item.costo || 0
                            }
                            console.log('📦 Item a insertar:', itemData)
                            return itemData
                        })

                        // Insertar items
                        const { error: itemsError } = await supabase
                            .from('items_venta')
                            .insert(itemsToInsert)

                        if (itemsError) {
                            console.error('❌ Error insertando items:', itemsError)
                            throw itemsError
                        }

                        console.log(`✅ Items insertados correctamente`)

                        // DESCONTAR STOCK: El trigger de BD debería hacerlo, pero por si no está habilitado,
                        // lo hacemos manualmente aquí. Usamos la misma lógica que en pos.ts (venta online)
                        console.log('📉 Descontando stock en BD...')
                        for (const item of items) {
                            try {
                                // Consulta correcta con join de recetas
                                const { data: producto, error: prodError } = await supabase
                                    .from('productos')
                                    .select(`
                                        stock_actual, 
                                        tipo_producto, 
                                        contenido_total,
                                        receta:recetas(
                                            id,
                                            componentes:componentes_receta(
                                                cantidad,
                                                producto_simple:productos(id, stock_actual, contenido_total, nombre)
                                            )
                                        )
                                    `)
                                    .eq('id', item.producto_id)
                                    .single()

                                if (prodError) {
                                    console.error(`❌ Error consultando producto:`, prodError)
                                    continue
                                }

                                if (!producto) {
                                    console.warn(`⚠️ Producto ${item.producto_id} no encontrado`)
                                    continue
                                }

                                console.log(`📦 Producto: ${item.nombre_producto}, Tipo: ${producto.tipo_producto}, Stock BD: ${producto.stock_actual}`)

                                if (producto.tipo_producto === 'SIMPLE') {
                                    const nuevoStock = Math.max(0, producto.stock_actual - item.cantidad)
                                    console.log(`  → Descontando: ${producto.stock_actual} - ${item.cantidad} = ${nuevoStock}`)

                                    const { error: updateError } = await supabase
                                        .from('productos')
                                        .update({ stock_actual: nuevoStock })
                                        .eq('id', item.producto_id)

                                    if (updateError) {
                                        console.error(`❌ Error actualizando stock:`, updateError)
                                        continue
                                    }

                                    await supabase.from('movimientos_stock').insert({
                                        producto_id: item.producto_id,
                                        tipo_movimiento: 'SALIDA',
                                        cantidad: item.cantidad,
                                        observaciones: `Venta Offline Sincronizada #${ventaId}`
                                    })

                                    console.log(`  ✅ Stock actualizado en BD: ${nuevoStock}`)
                                } else if (producto.tipo_producto === 'COMPUESTO' && producto.receta) {
                                    const recetaData = Array.isArray(producto.receta) ? producto.receta[0] : producto.receta
                                    if (recetaData && recetaData.componentes) {
                                        console.log(`  → Producto compuesto con ${recetaData.componentes.length} ingredientes`)

                                        for (const componente of recetaData.componentes) {
                                            if (componente.producto_simple) {
                                                const ingredienteData = Array.isArray(componente.producto_simple) ? componente.producto_simple[0] : componente.producto_simple
                                                if (!ingredienteData) continue

                                                const ingrediente = ingredienteData
                                                const cantidadRequerida = componente.cantidad * item.cantidad
                                                const contenidoEnvase = ingrediente.contenido_total || 1
                                                const unidadesADescontar = cantidadRequerida / contenidoEnvase
                                                const nuevoStockIng = Math.max(0, Number((ingrediente.stock_actual - unidadesADescontar).toFixed(4)))

                                                console.log(`    → Ingrediente: ${ingrediente.nombre}, Stock: ${ingrediente.stock_actual} - ${unidadesADescontar.toFixed(4)} = ${nuevoStockIng}`)

                                                const { error: updateIngError } = await supabase
                                                    .from('productos')
                                                    .update({ stock_actual: nuevoStockIng })
                                                    .eq('id', ingrediente.id)

                                                if (updateIngError) {
                                                    console.error(`❌ Error actualizando ingrediente:`, updateIngError)
                                                    continue
                                                }

                                                await supabase.from('movimientos_stock').insert({
                                                    producto_id: ingrediente.id,
                                                    tipo_movimiento: 'SALIDA',
                                                    cantidad: Number(unidadesADescontar.toFixed(4)),
                                                    observaciones: `Venta Offline Sincronizada #${ventaId} (Ingrediente de ${item.nombre_producto})`
                                                })

                                                console.log(`    ✅ Stock ingrediente actualizado: ${nuevoStockIng}`)
                                            }
                                        }
                                    }
                                }
                            } catch (stockError) {
                                console.error(`❌ Error actualizando stock para ${item.producto_id}:`, stockError)
                            }
                        }

                        console.log(`✅ Transacción ${txn.id} sincronizada completamente.`)
                        successCount++
                    }
                } catch (error: any) {
                    console.error(`❌ Error sincronizando tx ${txn.id}:`, error)
                    console.error('📋 Detalles del error:', {
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code
                    })
                    errorCount++
                    remaining.push(txn) // Keep it for next retry
                }
            }

            this.pendingTransactions = remaining
            this.saveToStorage()

            console.log(`✅ Sincronización completada: ${successCount} exitosas, ${errorCount} fallidas, ${remaining.length} pendientes`)

            // Recargar productos desde la BD para reflejar el stock correcto después de sincronizar
            if (successCount > 0) {
                try {
                    console.log('🔄 Esperando 500ms antes de recargar productos para asegurar que BD esté actualizada...')
                    await new Promise(resolve => setTimeout(resolve, 500))

                    const { useProductosStore } = await import('./productos')
                    const productosStore = useProductosStore()

                    console.log('📦 Recargando productos desde la base de datos...')
                    await productosStore.fetchProductos()
                    console.log('✅ Productos recargados desde la base de datos')
                    console.log(`📊 Total productos en memoria: ${productosStore.productos.length}`)
                } catch (error) {
                    console.error('⚠️ Error recargando productos:', error)
                }

                alert(`✅ ${successCount} venta(s) sincronizada(s) correctamente`)
            }
            if (errorCount > 0) {
                alert(`⚠️ ${errorCount} venta(s) no pudieron sincronizarse. Revisa la consola para más detalles.`)
            }
        }
    }
})
