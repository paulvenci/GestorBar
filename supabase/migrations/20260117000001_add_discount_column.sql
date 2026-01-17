-- Agregar columna descuento a la tabla ventas
ALTER TABLE ventas 
ADD COLUMN IF NOT EXISTS descuento DECIMAL(10,2) DEFAULT 0 CHECK (descuento >= 0);

COMMENT ON COLUMN ventas.descuento IS 'Monto de descuento aplicado a la venta';
