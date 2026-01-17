-- Migration: Agregar campos para anulación de ventas
-- Fecha: 2026-01-16

-- Agregar estado ANULADA a ventas si no existe
ALTER TABLE ventas 
DROP CONSTRAINT IF EXISTS ventas_estado_check;

ALTER TABLE ventas
ADD CONSTRAINT ventas_estado_check 
CHECK (estado IN ('PENDIENTE', 'COMPLETADA', 'CANCELADA', 'ANULADA'));

-- Agregar campos de anulación a ventas
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS anulada_por UUID REFERENCES usuarios(id);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS autorizada_por UUID REFERENCES usuarios(id);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS fecha_anulacion TIMESTAMPTZ;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT;

-- Comentarios
COMMENT ON COLUMN ventas.anulada_por IS 'Usuario que realizó la anulación';
COMMENT ON COLUMN ventas.autorizada_por IS 'Usuario administrador que autorizó la anulación';
COMMENT ON COLUMN ventas.fecha_anulacion IS 'Fecha y hora en que se anuló la venta';
COMMENT ON COLUMN ventas.motivo_anulacion IS 'Razón de la anulación';

-- Índice para consultas de anulaciones
CREATE INDEX IF NOT EXISTS idx_ventas_anulada_por ON ventas(anulada_por) WHERE estado = 'ANULADA';

-- Agregar permiso ventas.anular si no existe
INSERT INTO permisos (codigo, nombre, descripcion, modulo)
SELECT 'ventas.anular', 'Anular Ventas', 'Anular ventas (requiere autorización)', 'ventas'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE codigo = 'ventas.anular');
