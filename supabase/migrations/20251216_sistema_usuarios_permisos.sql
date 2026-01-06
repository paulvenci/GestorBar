-- =====================================================
-- SISTEMA DE USUARIOS Y PERMISOS PERSONALIZABLES
-- =====================================================

-- Tabla: roles
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  es_sistema BOOLEAN DEFAULT false, -- true para roles predefinidos (no editables)
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: permisos (catálogo de todos los permisos disponibles)
CREATE TABLE IF NOT EXISTS permisos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT NOT NULL UNIQUE, -- ej: 'pos.vender', 'productos.crear'
  nombre TEXT NOT NULL,
  descripcion TEXT,
  modulo TEXT NOT NULL, -- 'pos', 'productos', 'inventario', 'reportes', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: rol_permisos (permisos asignados a cada rol)
CREATE TABLE IF NOT EXISTS rol_permisos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rol_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permiso_id UUID NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rol_id, permiso_id)
);

-- Tabla: usuarios (extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT true,
  pin TEXT, -- PIN de 4 dígitos para acceso rápido
  turno_actual UUID, -- referencia al turno activo
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: sesiones_usuario (auditoría)
CREATE TABLE IF NOT EXISTS sesiones_usuario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_login TIMESTAMPTZ DEFAULT NOW(),
  fecha_logout TIMESTAMPTZ,
  ip_address TEXT,
  dispositivo TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);
CREATE INDEX IF NOT EXISTS idx_rol_permisos_rol ON rol_permisos(rol_id);
CREATE INDEX IF NOT EXISTS idx_rol_permisos_permiso ON rol_permisos(permiso_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones_usuario(usuario_id);

-- =====================================================
-- INSERTAR PERMISOS DEL SISTEMA
-- =====================================================

INSERT INTO permisos (codigo, nombre, descripcion, modulo) VALUES
-- POS / Ventas
('pos.acceder', 'Acceder al POS', 'Puede acceder a la caja rápida', 'pos'),
('pos.vender', 'Realizar ventas', 'Puede procesar ventas', 'pos'),
('pos.aplicar_descuentos', 'Aplicar descuentos', 'Puede aplicar descuentos en ventas', 'pos'),
('pos.cancelar_ventas', 'Cancelar ventas', 'Puede cancelar ventas completadas', 'pos'),
('pos.ver_historial', 'Ver historial de ventas', 'Puede ver ventas anteriores', 'pos'),

-- Productos
('productos.ver', 'Ver productos', 'Puede ver el listado de productos', 'productos'),
('productos.crear', 'Crear productos', 'Puede crear nuevos productos', 'productos'),
('productos.editar', 'Editar productos', 'Puede modificar productos', 'productos'),
('productos.eliminar', 'Eliminar productos', 'Puede eliminar productos', 'productos'),
('productos.gestionar_recetas', 'Gestionar recetas', 'Puede crear/editar recetas de productos compuestos', 'productos'),

-- Inventario
('inventario.ver', 'Ver inventario', 'Puede ver el inventario', 'inventario'),
('inventario.entrada', 'Registrar entradas', 'Puede registrar entradas de inventario', 'inventario'),
('inventario.salida', 'Registrar salidas', 'Puede registrar salidas de inventario', 'inventario'),
('inventario.ajuste', 'Hacer ajustes', 'Puede hacer ajustes de inventario', 'inventario'),

-- Mesas
('mesas.ver', 'Ver mesas', 'Puede ver el módulo de mesas', 'mesas'),
('mesas.tomar_orden', 'Tomar órdenes', 'Puede crear órdenes en mesas', 'mesas'),
('mesas.cobrar', 'Cobrar mesas', 'Puede cobrar comandas de mesas', 'mesas'),
('mesas.cancelar', 'Cancelar órdenes', 'Puede cancelar órdenes de mesas', 'mesas'),

-- Reportes
('reportes.ver', 'Ver reportes', 'Puede acceder al módulo de reportes', 'reportes'),
('reportes.ventas', 'Reportes de ventas', 'Puede ver reportes de ventas', 'reportes'),
('reportes.inventario', 'Reportes de inventario', 'Puede ver reportes de inventario', 'reportes'),
('reportes.exportar', 'Exportar reportes', 'Puede exportar reportes', 'reportes'),

-- Configuración
('config.ver', 'Ver configuración', 'Puede acceder a configuración', 'config'),
('config.negocio', 'Configurar negocio', 'Puede editar datos del negocio', 'config'),
('config.tickets', 'Configurar tickets', 'Puede configurar formato de tickets', 'config'),

-- Usuarios y Permisos
('usuarios.ver', 'Ver usuarios', 'Puede ver listado de usuarios', 'usuarios'),
('usuarios.crear', 'Crear usuarios', 'Puede crear nuevos usuarios', 'usuarios'),
('usuarios.editar', 'Editar usuarios', 'Puede modificar usuarios', 'usuarios'),
('usuarios.eliminar', 'Eliminar usuarios', 'Puede eliminar usuarios', 'usuarios'),
('roles.gestionar', 'Gestionar roles', 'Puede crear/editar roles y permisos', 'usuarios');

-- =====================================================
-- INSERTAR ROLES PREDEFINIDOS
-- =====================================================

INSERT INTO roles (nombre, descripcion, es_sistema) VALUES
('Administrador', 'Acceso total al sistema', true),
('Gerente', 'Gestión completa excepto usuarios', true),
('Cajero', 'Solo operaciones de venta', true),
('Mesero', 'Solo operaciones de mesas', true);

-- =====================================================
-- ASIGNAR PERMISOS A ROLES PREDEFINIDOS
-- =====================================================

-- ADMINISTRADOR: Todos los permisos
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 
  (SELECT id FROM roles WHERE nombre = 'Administrador'),
  id
FROM permisos;

-- GERENTE: Todos excepto usuarios
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 
  (SELECT id FROM roles WHERE nombre = 'Gerente'),
  id
FROM permisos
WHERE modulo != 'usuarios';

-- CAJERO: Solo POS básico
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 
  (SELECT id FROM roles WHERE nombre = 'Cajero'),
  id
FROM permisos
WHERE codigo IN (
  'pos.acceder',
  'pos.vender',
  'pos.ver_historial',
  'productos.ver'
);

-- MESERO: Mesas y POS básico
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 
  (SELECT id FROM roles WHERE nombre = 'Mesero'),
  id
FROM permisos
WHERE codigo IN (
  'pos.acceder',
  'pos.vender',
  'productos.ver',
  'mesas.ver',
  'mesas.tomar_orden',
  'mesas.cobrar'
);

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función: Verificar si un usuario tiene un permiso
CREATE OR REPLACE FUNCTION usuario_tiene_permiso(
  p_usuario_id UUID,
  p_codigo_permiso TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM usuarios u
    JOIN rol_permisos rp ON rp.rol_id = u.rol_id
    JOIN permisos p ON p.id = rp.permiso_id
    WHERE u.id = p_usuario_id
      AND p.codigo = p_codigo_permiso
      AND u.activo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Obtener todos los permisos de un usuario
CREATE OR REPLACE FUNCTION obtener_permisos_usuario(p_usuario_id UUID)
RETURNS TABLE (
  codigo TEXT,
  nombre TEXT,
  modulo TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT 
    p.codigo,
    p.nombre,
    p.modulo
  FROM usuarios u
  JOIN rol_permisos rp ON rp.rol_id = u.rol_id
  JOIN permisos p ON p.id = rp.permiso_id
  WHERE u.id = p_usuario_id
    AND u.activo = true
  ORDER BY p.modulo, p.nombre;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Actualizar updated_at en usuarios
CREATE OR REPLACE FUNCTION actualizar_usuarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION actualizar_usuarios_updated_at();

-- Trigger: Actualizar updated_at en roles
CREATE TRIGGER trigger_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION actualizar_usuarios_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rol_permisos ENABLE ROW LEVEL SECURITY;

-- Políticas: Todos los usuarios autenticados pueden ver permisos y roles
CREATE POLICY "Usuarios autenticados pueden ver roles"
ON roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden ver permisos"
ON permisos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden ver rol_permisos"
ON rol_permisos FOR SELECT
TO authenticated
USING (true);

-- Políticas: Solo quien tiene permiso puede gestionar usuarios
CREATE POLICY "Ver usuarios con permiso"
ON usuarios FOR SELECT
TO authenticated
USING (
  usuario_tiene_permiso(auth.uid(), 'usuarios.ver')
  OR auth.uid() = id -- Puede verse a sí mismo
);

CREATE POLICY "Crear usuarios con permiso"
ON usuarios FOR INSERT
TO authenticated
WITH CHECK (
  usuario_tiene_permiso(auth.uid(), 'usuarios.crear')
);

CREATE POLICY "Editar usuarios con permiso"
ON usuarios FOR UPDATE
TO authenticated
USING (
  usuario_tiene_permiso(auth.uid(), 'usuarios.editar')
  OR auth.uid() = id -- Puede editarse a sí mismo
);

CREATE POLICY "Eliminar usuarios con permiso"
ON usuarios FOR DELETE
TO authenticated
USING (
  usuario_tiene_permiso(auth.uid(), 'usuarios.eliminar')
);

-- Políticas: Solo quien tiene permiso puede gestionar roles
CREATE POLICY "Gestionar roles con permiso"
ON roles FOR ALL
TO authenticated
USING (
  usuario_tiene_permiso(auth.uid(), 'roles.gestionar')
);

CREATE POLICY "Gestionar rol_permisos con permiso"
ON rol_permisos FOR ALL
TO authenticated
USING (
  usuario_tiene_permiso(auth.uid(), 'roles.gestionar')
);

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE roles IS 'Roles de usuario con permisos personalizables';
COMMENT ON TABLE permisos IS 'Catálogo de todos los permisos disponibles en el sistema';
COMMENT ON TABLE rol_permisos IS 'Relación muchos a muchos entre roles y permisos';
COMMENT ON TABLE usuarios IS 'Usuarios del sistema extendiendo auth.users';
COMMENT ON FUNCTION usuario_tiene_permiso IS 'Verifica si un usuario tiene un permiso específico';
COMMENT ON FUNCTION obtener_permisos_usuario IS 'Obtiene todos los permisos de un usuario';
