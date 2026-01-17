-- =====================================================
-- SISTEMA DE TURNOS Y CIERRE DE CAJA
-- Migración para Bar Gordy
-- =====================================================

-- Tabla de turnos de meseros (turnos dinámicos)
-- El mesero inicia/cierra su turno manualmente
CREATE TABLE IF NOT EXISTS turnos_mesero (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  hora_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hora_fin TIMESTAMPTZ,
  -- Totales calculados al cerrar turno
  total_efectivo DECIMAL(10,2) DEFAULT 0,
  total_tarjeta DECIMAL(10,2) DEFAULT 0,
  total_transferencia DECIMAL(10,2) DEFAULT 0,
  total_credito DECIMAL(10,2) DEFAULT 0,
  cantidad_ventas INTEGER DEFAULT 0,
  -- Estado del turno
  estado TEXT DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'CERRADO')),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columnas a ventas para rastrear vendedor y turno
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES usuarios(id);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS turno_id UUID REFERENCES turnos_mesero(id);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_turnos_usuario ON turnos_mesero(usuario_id);
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON turnos_mesero(estado);
CREATE INDEX IF NOT EXISTS idx_turnos_hora_inicio ON turnos_mesero(hora_inicio);
CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON ventas(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_ventas_turno ON ventas(turno_id);

-- Deshabilitar RLS para la nueva tabla (consistente con el resto del sistema)
ALTER TABLE turnos_mesero DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE turnos_mesero IS 'Turnos dinámicos de meseros - inician/cierran manualmente';
COMMENT ON COLUMN turnos_mesero.hora_inicio IS 'Momento en que el mesero inicia su turno';
COMMENT ON COLUMN turnos_mesero.hora_fin IS 'Momento en que el mesero cierra su turno (NULL si está abierto)';
COMMENT ON COLUMN turnos_mesero.estado IS 'ABIERTO: turno activo, CERRADO: turno finalizado';
COMMENT ON COLUMN ventas.vendedor_id IS 'Mesero que procesó el pago de la venta';
COMMENT ON COLUMN ventas.turno_id IS 'Turno en el que se registró la venta';
