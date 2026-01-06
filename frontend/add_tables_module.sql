-- =====================================================
-- MÓDULO DE MESAS Y CUENTAS ABIERTAS
-- =====================================================

-- 1. Crear tabla de Mesas
CREATE TABLE IF NOT EXISTS mesas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero INTEGER NOT NULL UNIQUE,
  capacidad INTEGER DEFAULT 4,
  estado TEXT DEFAULT 'LIBRE' CHECK (estado IN ('LIBRE', 'OCUPADA')),
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Modificar tabla Ventas para soportar Mesas y Estado Pendiente
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL;

-- Para modificar el CHECK constraint, primero lo eliminamos y luego lo recreamos con los nuevos valores
ALTER TABLE ventas DROP CONSTRAINT IF EXISTS ventas_estado_check;
ALTER TABLE ventas ADD CONSTRAINT ventas_estado_check 
  CHECK (estado IN ('COMPLETADA', 'CANCELADA', 'PENDIENTE'));

-- 3. Índices nuevos
CREATE INDEX IF NOT EXISTS idx_ventas_mesa ON ventas(mesa_id);
CREATE INDEX IF NOT EXISTS idx_mesas_estado ON mesas(estado);

-- 4. Datos Iniciales (10 Mesas por defecto)
INSERT INTO mesas (numero, capacidad, estado) VALUES
(1, 4, 'LIBRE'), (2, 4, 'LIBRE'), (3, 4, 'LIBRE'), (4, 4, 'LIBRE'), (5, 4, 'LIBRE'),
(6, 6, 'LIBRE'), (7, 6, 'LIBRE'), (8, 2, 'LIBRE'), (9, 2, 'LIBRE'), (10, 8, 'LIBRE')
ON CONFLICT (numero) DO NOTHING;

-- 5. Trigger para actualizar estado de mesa automáticamente
-- Cuando una venta se crea como PENDIENTE con mesa_id, la mesa pasa a OCUPADA
-- Cuando una venta pasa a COMPLETADA o CANCELADA, la mesa pasa a LIBRE

CREATE OR REPLACE FUNCTION actualizar_estado_mesa()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.mesa_id IS NOT NULL THEN
      IF NEW.estado = 'PENDIENTE' THEN
        UPDATE mesas SET estado = 'OCUPADA' WHERE id = NEW.mesa_id;
      ELSIF NEW.estado IN ('COMPLETADA', 'CANCELADA') THEN
        UPDATE mesas SET estado = 'LIBRE' WHERE id = NEW.mesa_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_estado_mesa ON ventas;
CREATE TRIGGER trigger_estado_mesa
AFTER INSERT OR UPDATE ON ventas
FOR EACH ROW
EXECUTE FUNCTION actualizar_estado_mesa();
