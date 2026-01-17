-- Crear tabla mesas si no existe
CREATE TABLE IF NOT EXISTS mesas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL UNIQUE,
  estado TEXT DEFAULT 'LIBRE' CHECK (estado IN ('LIBRE', 'OCUPADA')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar mesa_id a ventas
ALTER TABLE ventas 
ADD COLUMN IF NOT EXISTS mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_ventas_mesa ON ventas(mesa_id);
