-- =====================================================
-- CREAR PRIMER USUARIO ADMINISTRADOR
-- =====================================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard > Authentication > Users
-- 2. Click en "Add user" → "Create new user"
-- 3. Email: admin@bargordy.com
-- 4. Password: (tu contraseña segura)
-- 5. Copia el UUID del usuario creado
-- 6. Reemplaza 'AQUI-EL-UUID' en la línea 30 con ese UUID
-- 7. Ejecuta este script en SQL Editor
--
-- =====================================================

-- Verificar que el usuario existe en auth.users
-- (Deberías ver el usuario que acabas de crear)
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@bargordy.com';

-- =====================================================
-- IMPORTANTE: Reemplaza 'AQUI-EL-UUID' con el UUID del paso anterior
-- =====================================================

INSERT INTO usuarios (id, nombre, email, rol_id, activo)
VALUES (
  'AQUI-EL-UUID',  -- ← REEMPLAZAR CON UUID DE auth.users
  'Administrador Principal',
  'admin@bargordy.com',
  (SELECT id FROM roles WHERE nombre = 'Administrador'),
  true
);

-- Verificar que se creó correctamente
SELECT 
  u.id,
  u.nombre,
  u.email,
  r.nombre as rol,
  u.activo
FROM usuarios u
LEFT JOIN roles r ON r.id = u.rol_id
WHERE u.email = 'admin@bargordy.com';

-- Ver permisos del usuario
SELECT * FROM obtener_permisos_usuario(
  (SELECT id FROM usuarios WHERE email = 'admin@bargordy.com')
);

-- =====================================================
-- OPCIONAL: Crear usuarios adicionales
-- =====================================================

-- Ejemplo: Crear un Cajero (primero crear en Authentication > Users)
-- INSERT INTO usuarios (id, nombre, email, rol_id, activo, pin)
-- VALUES (
--   'UUID-DEL-CAJERO',
--   'Juan Pérez',
--   'cajero@bargordy.com',
--   (SELECT id FROM roles WHERE nombre = 'Cajero'),
--   true,
--   '1234' -- PIN opcional para acceso rápido
-- );

-- Ejemplo: Crear un Mesero (primero crear en Authentication > Users)
-- INSERT INTO usuarios (id, nombre, email, rol_id, activo, pin)
-- VALUES (
--   'UUID-DEL-MESERO',
--   'María García',
--   'mesero@bargordy.com',
--   (SELECT id FROM roles WHERE nombre = 'Mesero'),
--   true,
--   '5678' -- PIN opcional para acceso rápido
-- );
