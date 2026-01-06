import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { Producto, Categoria } from '@/types/database.types'

interface ProductosState {
    productos: Producto[]
    categorias: Categoria[]
    loading: boolean
    error: string | null
}

export const useProductosStore = defineStore('productos', {
    state: (): ProductosState => ({
        productos: [],
        categorias: [],
        loading: false,
        error: null
    }),

    getters: {
        productosActivos: (state) => state.productos.filter(p => p.activo),

        productosSimples: (state) =>
            state.productos.filter(p => p.tipo_producto === 'SIMPLE' && p.activo),

        productosCompuestos: (state) =>
            state.productos.filter(p => p.tipo_producto === 'COMPUESTO' && p.activo),

        productosConStockBajo: (state) =>
            state.productos.filter(p => p.activo && p.stock_actual <= p.stock_minimo),

        productosPorCategoria: (state) => (categoriaId: string) =>
            state.productos.filter(p => p.categoria_id === categoriaId && p.activo)
    },

    actions: {
        async fetchProductos() {
            this.loading = true
            this.error = null
            try {
                console.log('🔄 fetchProductos: Consultando base de datos...')
                // Network First Strategy
                const { data, error } = await supabase
                    .from('productos')
                    .select(`
            *,
            categoria:categorias(*),
            receta:recetas(
              id,
              componentes:componentes_receta(
                cantidad,
                unidad_medida,
                producto_simple:productos(
                  id,
                  stock_actual,
                  contenido_total
                )
              )
            )
          `)
                    .eq('activo', true)
                    .order('nombre')

                if (error) throw error
                
                console.log(`✅ fetchProductos: Recibidos ${data?.length || 0} productos de BD`)
                if (data && data.length > 0) {
                    console.log(`📊 Ejemplo - Primer producto: ${data[0].nombre}, stock: ${data[0].stock_actual}`)
                }
                
                this.productos = data || []

                // Save to Storage
                localStorage.setItem('cached_productos', JSON.stringify(this.productos))
                console.log('💾 fetchProductos: Productos guardados en localStorage')

            } catch (err: any) {
                console.error('Error al cargar productos (Network):', err)
                // Fallback to Storage
                const cached = localStorage.getItem('cached_productos')
                if (cached) {
                    console.log('📦 Usando caché local de productos')
                    this.productos = JSON.parse(cached)
                } else {
                    this.error = 'No se pudo cargar productos y no hay copia local.'
                }
            } finally {
                this.loading = false
            }
        },

        async fetchCategorias() {
            try {
                const { data, error } = await supabase
                    .from('categorias')
                    .select('*')
                    .order('nombre')

                if (error) throw error
                this.categorias = data || []

                // Save to Storage
                localStorage.setItem('cached_categorias', JSON.stringify(this.categorias))

            } catch (err: any) {
                console.error('Error al cargar categorías (Network):', err)
                // Fallback
                const cached = localStorage.getItem('cached_categorias')
                if (cached) {
                    this.categorias = JSON.parse(cached)
                }
            }
        },

        async createProducto(producto: Partial<Producto>) {
            try {
                const { data, error } = await supabase
                    .from('productos')
                    .insert(producto)
                    .select()
                    .single()

                if (error) throw error

                if (data) {
                    this.productos.push(data)
                }

                return { success: true, data }
            } catch (err: any) {
                return { success: false, error: err.message }
            }
        },

        async updateProducto(id: string, updates: Partial<Producto>) {
            try {
                const { data, error } = await supabase
                    .from('productos')
                    .update(updates)
                    .eq('id', id)
                    .select()
                    .single()

                if (error) throw error

                const index = this.productos.findIndex(p => p.id === id)
                if (index !== -1 && data) {
                    this.productos[index] = data
                }

                return { success: true, data }
            } catch (err: any) {
                return { success: false, error: err.message }
            }
        },

        async deleteProducto(id: string) {
            try {
                const { error } = await supabase
                    .from('productos')
                    .delete()
                    .eq('id', id)

                if (error) throw error

                this.productos = this.productos.filter(p => p.id !== id)

                return { success: true }
            } catch (err: any) {
                return { success: false, error: err.message }
            }
        },

        async saveReceta(productoId: string, componentes: { producto_simple_id: string, cantidad: number, unidad_medida: string }[]) {
            try {
                // 1. Obtener o crear receta para el producto
                const { data: recetaExistente } = await supabase
                    .from('recetas')
                    .select('id')
                    .eq('producto_compuesto_id', productoId)
                    .single()

                let recetaId = recetaExistente?.id

                if (!recetaId) {
                    const { data: nuevaReceta, error: errorReceta } = await supabase
                        .from('recetas')
                        .insert({ producto_compuesto_id: productoId })
                        .select()
                        .single()

                    if (errorReceta) throw errorReceta
                    recetaId = nuevaReceta.id
                }

                // 2. Eliminar componentes anteriores (estrategia simple: borrar y re-insertar)
                const { error: errorDelete } = await supabase
                    .from('componentes_receta')
                    .delete()
                    .eq('receta_id', recetaId)

                if (errorDelete) throw errorDelete

                // 3. Insertar nuevos componentes
                if (componentes.length > 0) {
                    console.log('Guardando componentes:', componentes)
                    const componentesData = componentes.map(c => ({
                        receta_id: recetaId,
                        producto_simple_id: c.producto_simple_id,
                        cantidad: c.cantidad,
                        unidad_medida: c.unidad_medida
                    }))

                    const { error: errorInsert } = await supabase
                        .from('componentes_receta')
                        .insert(componentesData)

                    if (errorInsert) {
                        console.error('Error insertando componentes:', errorInsert)
                        throw errorInsert
                    }
                }

                console.log('Receta guardada exitosamente')
                return { success: true }
            } catch (err: any) {
                console.error('Error saving receta:', err)
                return { success: false, error: err.message }
            }
        },

        // Método para actualizar stock de forma reactiva (sin llamadas a DB)
        updateStockLocal(productoId: string, nuevoStock: number) {
            console.log(`🔧 updateStockLocal llamado para producto ${productoId}, nuevo stock: ${nuevoStock}`)
            const index = this.productos.findIndex(p => p.id === productoId)
            console.log(`🔍 Índice encontrado: ${index}`)
            if (index !== -1) {
                const producto = this.productos[index]
                if (!producto) {
                    console.error(`❌ Producto no encontrado en índice ${index}`)
                    return
                }
                console.log(`📦 Producto anterior: ${producto.nombre}, stock: ${producto.stock_actual}`)
                
                // Crear un nuevo array para forzar reactividad total
                this.productos = this.productos.map((p, i) => {
                    if (i === index) {
                        return {
                            ...p,
                            stock_actual: nuevoStock
                        } as Producto
                    }
                    return p
                })
                
                const productoActualizado = this.productos[index]
                if (productoActualizado) {
                    console.log(`✅ Producto actualizado: ${productoActualizado.nombre}, nuevo stock: ${productoActualizado.stock_actual}`)
                }
                // Actualizar cache
                localStorage.setItem('cached_productos', JSON.stringify(this.productos))
                console.log(`💾 Cache actualizado en localStorage`)
            } else {
                console.error(`❌ No se encontró el producto con ID: ${productoId}`)
            }
        }
    }
})
