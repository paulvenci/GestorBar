-- ================================================================
-- SCRIPT PARA DESACTIVAR DESCUENTO DE STOCK AUTOMÁTICO EN DB
-- ================================================================
-- El sistema usa una lógica avanzada en el Frontend para manejar 
-- conversiones de unidades (ml a botellas).
-- El trigger automático de la base de datos es muy simple y causa errores
-- al intentar restar mililitros directamente de botellas.
--
-- Instrucciones:
-- 1. Copia este código.
-- 2. Ve al SQL Editor en tu dashboard de Supabase.
-- 3. Pega y ejecuta (Run).

-- 1. Eliminar el trigger que se dispara al insertar items de venta
DROP TRIGGER IF EXISTS trigger_actualizar_stock ON items_venta;

-- 2. Eliminar la función asociada para limpiar
DROP FUNCTION IF EXISTS actualizar_stock_venta();

SELECT 'Trigger eliminado correctamente. Ahora el Frontend controla el stock.' as resultado;
