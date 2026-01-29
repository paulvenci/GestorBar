-- Agregar configuración para días permitidos de anulación de ventas
-- Fecha: 2026-01-29

-- Insertar configuración de días para anular ventas
INSERT INTO configuracion (clave, valor, tipo_dato, descripcion)
VALUES (
  'dias_anulacion_ventas', 
  '7', 
  'number', 
  'Número de días hacia atrás permitidos para anular una venta (ej: 7 = se pueden anular ventas de los últimos 7 días)'
)
ON CONFLICT (clave) DO UPDATE SET
  valor = EXCLUDED.valor,
  tipo_dato = EXCLUDED.tipo_dato,
  descripcion = EXCLUDED.descripcion;

-- Comentario de la configuración
COMMENT ON TABLE configuracion IS 'Configuraciones generales del sistema. dias_anulacion_ventas controla cuántos días hacia atrás se puede anular una venta.';
