-- Migración para agregar contenido y unidad a productos
-- Permitirá calcular costos proporcionales para recetas

ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS contenido_total DECIMAL(10,2) DEFAULT 1,
ADD COLUMN IF NOT EXISTS unidad_medida_base TEXT DEFAULT 'unidad';

COMMENT ON COLUMN productos.contenido_total IS 'Cantidad total del producto para prorrateo (ej. 750 para botella de 750ml)';
COMMENT ON COLUMN productos.unidad_medida_base IS 'Unidad base para el contenido (ej. ml, g, unidad)';

-- Actualizar productos existentes (opcional, defaults a 1 unidad)
UPDATE productos SET contenido_total = 1, unidad_medida_base = 'unidad' WHERE contenido_total IS NULL;
