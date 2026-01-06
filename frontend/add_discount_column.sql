-- Add discount column to ventas table
ALTER TABLE ventas 
ADD COLUMN descuento INTEGER DEFAULT 0;

-- Comment on column
COMMENT ON COLUMN ventas.descuento IS 'Monto total descontado de la venta';
