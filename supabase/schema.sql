-- =====================================================
-- SCHEMA SQL PARA SISTEMA BAR GORDY
-- Base de Datos: PostgreSQL (Supabase)
-- =====================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLAS
-- =====================================================

-- Tabla: categorias
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  descripcion TEXT,
  foto TEXT,
  valor_costo DECIMAL(10,2) NOT NULL CHECK (valor_costo >= 0),
  valor_venta DECIMAL(10,2) NOT NULL CHECK (valor_venta >= 0),
  tipo_producto TEXT NOT NULL CHECK (tipo_producto IN ('SIMPLE', 'COMPUESTO')),
  stock_actual DECIMAL(10,2) DEFAULT 0 CHECK (stock_actual >= 0),
  stock_minimo INTEGER DEFAULT 5 CHECK (stock_minimo >= 0),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para productos
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_tipo ON productos(tipo_producto);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);

-- Tabla: recetas (para productos compuestos)
CREATE TABLE IF NOT EXISTS recetas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_compuesto_id UUID UNIQUE REFERENCES productos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: componentes_receta
CREATE TABLE IF NOT EXISTS componentes_receta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receta_id UUID REFERENCES recetas(id) ON DELETE CASCADE,
  producto_simple_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  cantidad DECIMAL(10,2) NOT NULL CHECK (cantidad > 0),
  unidad_medida TEXT DEFAULT 'ml',
  UNIQUE(receta_id, producto_simple_id)
);

-- Tabla: movimientos_stock
CREATE TABLE IF NOT EXISTS movimientos_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
  cantidad DECIMAL(10,2) NOT NULL,
  precio DECIMAL(10,2),
  referencia_id UUID,
  observaciones TEXT,
  fecha TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para movimientos_stock
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_stock(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_stock(fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_stock(tipo_movimiento);

-- Tabla: ventas
CREATE TABLE IF NOT EXISTS ventas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero SERIAL,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  iva DECIMAL(10,2) NOT NULL CHECK (iva >= 0),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  metodo_pago TEXT CHECK (metodo_pago IN ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CREDITO')),
  estado TEXT DEFAULT 'COMPLETADA' CHECK (estado IN ('COMPLETADA', 'CANCELADA')),
  cliente_nombre TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para ventas
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_metodo_pago ON ventas(metodo_pago);

-- Tabla: items_venta
CREATE TABLE IF NOT EXISTS items_venta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  nombre_producto TEXT NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  costo DECIMAL(10,2) NOT NULL CHECK (costo >= 0)
);

-- Índice para items_venta
CREATE INDEX IF NOT EXISTS idx_items_venta_venta ON items_venta(venta_id);
CREATE INDEX IF NOT EXISTS idx_items_venta_producto ON items_venta(producto_id);

-- Tabla: configuracion
CREATE TABLE IF NOT EXISTS configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  tipo_dato TEXT CHECK (tipo_dato IN ('number', 'string', 'boolean')),
  descripcion TEXT
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Actualizar updated_at en productos
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_productos_updated_at
BEFORE UPDATE ON productos
FOR EACH ROW
EXECUTE FUNCTION actualizar_updated_at();

-- Trigger: Actualizar stock al vender
CREATE OR REPLACE FUNCTION actualizar_stock_venta()
RETURNS TRIGGER AS $$
DECLARE
  v_tipo_producto TEXT;
  v_componente RECORD;
BEGIN
  -- Obtener tipo de producto
  SELECT tipo_producto INTO v_tipo_producto
  FROM productos WHERE id = NEW.producto_id;

  IF v_tipo_producto = 'SIMPLE' THEN
    -- Producto simple: descontar stock directo
    UPDATE productos
    SET stock_actual = stock_actual - NEW.cantidad
    WHERE id = NEW.producto_id;
    
    -- Registrar movimiento de stock
    INSERT INTO movimientos_stock (
      producto_id, tipo_movimiento, cantidad, referencia_id
    ) VALUES (
      NEW.producto_id, 'SALIDA', NEW.cantidad, NEW.venta_id
    );
    
  ELSIF v_tipo_producto = 'COMPUESTO' THEN
    -- Producto compuesto: descontar cada componente
    FOR v_componente IN 
      SELECT cr.producto_simple_id, cr.cantidad
      FROM recetas r
      JOIN componentes_receta cr ON cr.receta_id = r.id
      WHERE r.producto_compuesto_id = NEW.producto_id
    LOOP
      UPDATE productos
      SET stock_actual = stock_actual - (v_componente.cantidad * NEW.cantidad)
      WHERE id = v_componente.producto_simple_id;
      
      -- Registrar movimiento de stock para cada componente
      INSERT INTO movimientos_stock (
        producto_id, tipo_movimiento, cantidad, referencia_id, observaciones
      ) VALUES (
        v_componente.producto_simple_id, 
        'SALIDA', 
        v_componente.cantidad * NEW.cantidad, 
        NEW.venta_id,
        'Venta de producto compuesto'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_stock
AFTER INSERT ON items_venta
FOR EACH ROW
EXECUTE FUNCTION actualizar_stock_venta();

-- =====================================================
-- FUNCIONES
-- =====================================================

-- Función: Calcular costo de producto compuesto
CREATE OR REPLACE FUNCTION calcular_costo_compuesto(p_producto_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_costo_total DECIMAL := 0;
  v_componente RECORD;
BEGIN
  FOR v_componente IN
    SELECT cr.cantidad, p.valor_costo
    FROM recetas r
    JOIN componentes_receta cr ON cr.receta_id = r.id
    JOIN productos p ON p.id = cr.producto_simple_id
    WHERE r.producto_compuesto_id = p_producto_id
  LOOP
    v_costo_total := v_costo_total + (v_componente.cantidad * v_componente.valor_costo);
  END LOOP;
  
  RETURN v_costo_total;
END;
$$ LANGUAGE plpgsql;

-- Función: Validar stock disponible (antes de venta)
CREATE OR REPLACE FUNCTION validar_stock_disponible(p_producto_id UUID, p_cantidad INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_tipo_producto TEXT;
  v_componente RECORD;
  v_stock_disponible DECIMAL;
BEGIN
  SELECT tipo_producto INTO v_tipo_producto
  FROM productos WHERE id = p_producto_id;
  
  IF v_tipo_producto = 'SIMPLE' THEN
    SELECT stock_actual INTO v_stock_disponible
    FROM productos WHERE id = p_producto_id;
    
    RETURN v_stock_disponible >= p_cantidad;
    
  ELSIF v_tipo_producto = 'COMPUESTO' THEN
    -- Verificar cada componente
    FOR v_componente IN
      SELECT cr.producto_simple_id, cr.cantidad, p.stock_actual
      FROM recetas r
      JOIN componentes_receta cr ON cr.receta_id = r.id
      JOIN productos p ON p.id = cr.producto_simple_id
      WHERE r.producto_compuesto_id = p_producto_id
    LOOP
      IF v_componente.stock_actual < (v_componente.cantidad * p_cantidad) THEN
        RETURN FALSE;
      END IF;
    END LOOP;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTAS
-- =====================================================

-- Vista: Productos con stock bajo
CREATE OR REPLACE VIEW productos_stock_bajo AS
SELECT 
  p.id,
  p.nombre,
  p.codigo,
  p.stock_actual,
  p.stock_minimo,
  c.nombre AS categoria
FROM productos p
LEFT JOIN categorias c ON c.id = p.categoria_id
WHERE p.stock_actual <= p.stock_minimo 
  AND p.activo = true;

-- Vista: Resumen de ventas diarias
CREATE OR REPLACE VIEW ventas_diarias AS
SELECT 
  DATE(fecha) AS fecha,
  COUNT(*) AS cantidad_ventas,
  SUM(total) AS total_ventas,
  SUM(total - subtotal) AS total_iva,
  AVG(total) AS ticket_promedio
FROM ventas
WHERE estado = 'COMPLETADA'
GROUP BY DATE(fecha)
ORDER BY fecha DESC;

-- Vista: Top productos más vendidos
CREATE OR REPLACE VIEW top_productos_vendidos AS
SELECT 
  iv.producto_id,
  iv.nombre_producto,
  SUM(iv.cantidad) AS cantidad_total_vendida,
  SUM(iv.subtotal) AS ingresos_totales,
  COUNT(DISTINCT iv.venta_id) AS numero_ventas
FROM items_venta iv
JOIN ventas v ON v.id = iv.venta_id
WHERE v.estado = 'COMPLETADA'
GROUP BY iv.producto_id, iv.nombre_producto
ORDER BY cantidad_total_vendida DESC;

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Para MVP sin autenticación, deshabilitamos RLS
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE recetas DISABLE ROW LEVEL SECURITY;
ALTER TABLE componentes_receta DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_stock DISABLE ROW LEVEL SECURITY;
ALTER TABLE ventas DISABLE ROW LEVEL SECURITY;
ALTER TABLE items_venta DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion DISABLE ROW LEVEL SECURITY;

-- Si en el futuro se agrega autenticación:
-- ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Permitir lectura a todos" ON productos FOR SELECT USING (true);
-- CREATE POLICY "Solo autenticados pueden modificar" ON productos FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar categorías predeterminadas
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Bebidas', 'Bebidas sin alcohol'),
  ('Jugos', 'Jugos naturales y artificiales'),
  ('Con Alcohol', 'Bebidas alcohólicas'),
  ('Licores', 'Licores y destilados'),
  ('Cervezas', 'Cervezas nacionales e importadas')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar configuración predeterminada
INSERT INTO configuracion (clave, valor, tipo_dato, descripcion) VALUES
  ('porcentaje_iva', '19', 'number', 'Porcentaje de IVA en Chile'),
  ('stock_minimo_default', '5', 'number', 'Stock mínimo por defecto para productos'),
  ('moneda', 'CLP', 'string', 'Código de moneda'),
  ('nombre_negocio', 'Bar Gordy', 'string', 'Nombre del negocio'),
  ('dias_sin_rotacion', '30', 'number', 'Días sin ventas para considerar producto sin rotación')
ON CONFLICT (clave) DO NOTHING;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE productos IS 'Catálogo de productos del bar';
COMMENT ON TABLE recetas IS 'Recetas para productos compuestos';
COMMENT ON TABLE componentes_receta IS 'Ingredientes de cada receta';
COMMENT ON TABLE movimientos_stock IS 'Historial de movimientos de inventario';
COMMENT ON TABLE ventas IS 'Registro de todas las ventas';
COMMENT ON TABLE items_venta IS 'Detalle de productos por venta';

COMMENT ON COLUMN productos.tipo_producto IS 'SIMPLE: producto individual, COMPUESTO: elaborado con receta';
COMMENT ON COLUMN movimientos_stock.tipo_movimiento IS 'ENTRADA: compra/ingreso, SALIDA: venta, AJUSTE: corrección manual';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
