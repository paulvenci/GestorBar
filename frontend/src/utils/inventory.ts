import type { Producto } from '@/types/database.types'

/**
 * Calcula el stock disponible de un producto.
 * Si es SIMPLE, retorna stock_actual.
 * Si es COMPUESTO, calcula el máximo de unidades posibles según el stock de sus ingredientes (Reactivo Limitante).
 */
export const calculateProductStock = (product: Producto): number => {
    if (product.tipo_producto === 'SIMPLE' || !product.receta) {
        return product.stock_actual
    }

    // Manejo de estructura de respuesta de Supabase (obj vs arr)
    const receta = Array.isArray(product.receta) ? product.receta[0] : product.receta

    // Si no tiene receta o componentes vacíos, el stock es 0 (o lo que diga la base si se quiere fallback, pero debería ser 0)
    if (!receta || !receta.componentes || receta.componentes.length === 0) {
        // Fallback opcional: return product.stock_actual
        // Pero un compuesto sin receta no se puede fabricar.
        return 0
    }

    let maxStockPosible = Infinity

    for (const component of receta.componentes) {
        const simpleInfo = component.producto_simple
        if (!simpleInfo) continue

        // Contenido total del envase (ej. 750ml)
        const contenidoTotalEnvase = simpleInfo.contenido_total || 1
        // Stock de envases (ej. 2 botellas)
        const stockEnvases = simpleInfo.stock_actual
        // Disponibilidad total base (ej. 1500ml)
        const totalDisponibleBase = stockEnvases * contenidoTotalEnvase

        // Cantidad requerida por trago (ej. 60ml)
        const cantidadRequerida = component.cantidad
        if (cantidadRequerida <= 0) continue

        // Cuántos tragos puedo hacer con este ingrediente
        const tragosPosibles = Math.floor(totalDisponibleBase / cantidadRequerida)

        if (tragosPosibles < maxStockPosible) {
            maxStockPosible = tragosPosibles
        }
    }

    return maxStockPosible === Infinity ? 0 : maxStockPosible
}
