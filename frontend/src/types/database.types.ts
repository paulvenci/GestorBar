// Tipos de la base de datos
export interface Categoria {
    id: string
    nombre: string
    descripcion?: string
    created_at: string
}

export interface Producto {
    id: string
    nombre: string
    codigo: string
    categoria_id?: string
    categoria?: Categoria
    descripcion?: string
    foto?: string
    valor_costo: number
    valor_venta: number
    tipo_producto: 'SIMPLE' | 'COMPUESTO'
    contenido_total?: number
    unidad_medida_base?: string
    stock_actual: number
    stock_minimo: number
    activo: boolean
    created_at: string
    updated_at: string
    receta?: {
        componentes: {
            cantidad: number
            producto_simple: {
                id: string
                stock_actual: number
                contenido_total: number
            }
        }[]
    } | null // Array or object depends on relation, but simple join usually returns object if 1:1 or array if 1:N
}

export interface Receta {
    id: string
    producto_compuesto_id: string
    componentes?: ComponenteReceta[]
}

export interface ComponenteReceta {
    id: string
    receta_id: string
    producto_simple_id: string
    producto?: Producto
    cantidad: number
    unidad_medida: string
}

export interface MovimientoStock {
    id: string
    producto_id: string
    producto?: Producto
    tipo_movimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE'
    cantidad: number
    precio?: number
    referencia_id?: string
    observaciones?: string
    fecha: string
}

// Eliminada referencia a Database['public']...
export interface Mesa {
    id: string
    numero: number
    capacidad: number
    estado: 'LIBRE' | 'OCUPADA'
    descripcion?: string
    created_at: string
}

export interface Venta {
    id: string
    numero: number
    fecha: string
    subtotal: number
    iva: number
    total: number
    metodo_pago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CREDITO' | null // Puede ser null si es PENDIENTE
    estado: 'COMPLETADA' | 'CANCELADA' | 'PENDIENTE'
    cliente_nombre?: string
    mesa_id?: string | null
    created_at?: string
    items?: ItemVenta[]
    descuento: number
}

export interface ItemVenta {
    id?: string
    venta_id?: string
    producto_id: string
    nombre_producto: string
    cantidad: number
    precio_unitario: number
    subtotal: number
    costo: number
}

export interface Configuracion {
    clave: string
    valor: string
    tipo_dato: 'number' | 'string' | 'boolean'
    descripcion?: string
}

// Tipos auxiliares
export interface ItemCarrito {
    productoId: string
    nombre: string
    cantidad: number
    precioUnitario: number
    costo: number
    stock: number // Para validar máximo disponible
    foto?: string | null
    descripcion?: string | null
}
