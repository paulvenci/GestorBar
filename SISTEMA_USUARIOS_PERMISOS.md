# 🔐 Sistema de Usuarios y Permisos Personalizables

## 📋 Descripción General

Sistema completo de autenticación y autorización con permisos granulares y personalizables por rol. Permite controlar el acceso a cada funcionalidad de la aplicación.

---

## 🏗️ Arquitectura

### **Base de Datos:**

```
roles (Roles configurables)
  ├── permisos (Catálogo de permisos)
  └── rol_permisos (Relación N:N)
       
usuarios (Extiende auth.users de Supabase)
  └── sesiones_usuario (Auditoría)
```

### **Frontend:**

```
stores/auth.ts (Store principal de autenticación)
  ├── Login/Logout
  ├── Gestión de sesión
  └── Verificación de permisos

composables/usePermissions.ts (Helper para componentes)
  └── can(), canAll(), canAny()

views/Login.vue (Vista de login con email y PIN)
```

---

## 🎯 Permisos Disponibles

### **POS / Ventas**
- `pos.acceder` - Acceder al POS
- `pos.vender` - Realizar ventas
- `pos.aplicar_descuentos` - Aplicar descuentos
- `pos.cancelar_ventas` - Cancelar ventas
- `pos.ver_historial` - Ver historial

### **Productos**
- `productos.ver` - Ver productos
- `productos.crear` - Crear productos
- `productos.editar` - Editar productos
- `productos.eliminar` - Eliminar productos
- `productos.gestionar_recetas` - Gestionar recetas

### **Inventario**
- `inventario.ver` - Ver inventario
- `inventario.entrada` - Registrar entradas
- `inventario.salida` - Registrar salidas
- `inventario.ajuste` - Hacer ajustes

### **Mesas**
- `mesas.ver` - Ver mesas
- `mesas.tomar_orden` - Tomar órdenes
- `mesas.cobrar` - Cobrar mesas
- `mesas.cancelar` - Cancelar órdenes

### **Reportes**
- `reportes.ver` - Ver reportes
- `reportes.ventas` - Reportes de ventas
- `reportes.inventario` - Reportes de inventario
- `reportes.exportar` - Exportar reportes

### **Configuración**
- `config.ver` - Ver configuración
- `config.negocio` - Configurar negocio
- `config.tickets` - Configurar tickets

### **Usuarios**
- `usuarios.ver` - Ver usuarios
- `usuarios.crear` - Crear usuarios
- `usuarios.editar` - Editar usuarios
- `usuarios.eliminar` - Eliminar usuarios
- `roles.gestionar` - Gestionar roles

---

## 👥 Roles Predefinidos

### **1. Administrador**
- ✅ **Todos los permisos**
- Gestión completa del sistema
- Puede crear/editar usuarios y roles

### **2. Gerente**
- ✅ Todos los permisos **excepto usuarios**
- Gestión de productos, inventario, reportes
- No puede crear usuarios ni modificar roles

### **3. Cajero**
- ✅ Solo POS básico
- Puede vender y ver productos
- No puede aplicar descuentos grandes

### **4. Mesero**
- ✅ Mesas y POS básico
- Puede tomar órdenes y cobrar
- Acceso limitado a reportes

---

## 🚀 Cómo Usar

### **1. Ejecutar Migración SQL**

```bash
# En Supabase SQL Editor, ejecuta:
supabase/migrations/20251216_sistema_usuarios_permisos.sql
```

### **2. Crear Primer Usuario Administrador**

```sql
-- En Supabase SQL Editor:

-- 1. Crear usuario en Auth
-- (Hacerlo desde Supabase Dashboard > Authentication > Users)
-- Email: admin@bargordy.com
-- Password: (tu contraseña segura)

-- 2. Obtener el UUID del usuario creado
SELECT id, email FROM auth.users WHERE email = 'admin@bargordy.com';

-- 3. Insertar en tabla usuarios
INSERT INTO usuarios (id, nombre, email, rol_id, activo)
VALUES (
  'UUID-DEL-PASO-2',
  'Administrador',
  'admin@bargordy.com',
  (SELECT id FROM roles WHERE nombre = 'Administrador'),
  true
);
```

### **3. Usar en Componentes**

```vue
<script setup lang="ts">
import { usePermissions } from '@/composables/usePermissions'

const { can, permissions } = usePermissions()
</script>

<template>
  <!-- Mostrar botón solo si tiene permiso -->
  <button v-if="can('productos.crear')">
    Crear Producto
  </button>

  <!-- Deshabilitar según permiso -->
  <button :disabled="!can('pos.aplicar_descuentos')">
    Aplicar Descuento
  </button>

  <!-- Usar helper de permissions -->
  <div v-if="permissions.canManageProducts">
    Gestión de productos
  </div>
</template>
```

### **4. Proteger Rutas**

Las rutas ya están protegidas automáticamente en `router/index.ts`:

```typescript
{
  path: '/productos',
  name: 'productos',
  component: Products,
  meta: { 
    requiresAuth: true,
    requiresPermission: 'productos.ver'
  }
}
```

---

## 🔧 Gestión de Roles y Permisos

### **Ver Permisos de un Usuario**

```sql
SELECT * FROM obtener_permisos_usuario('USER-UUID-HERE');
```

### **Crear Rol Personalizado**

```sql
-- 1. Crear el rol
INSERT INTO roles (nombre, descripcion, es_sistema)
VALUES ('Supervisor', 'Supervisor de turno', false);

-- 2. Asignar permisos
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 
  (SELECT id FROM roles WHERE nombre = 'Supervisor'),
  id
FROM permisos
WHERE codigo IN (
  'pos.acceder',
  'pos.vender',
  'pos.aplicar_descuentos',
  'productos.ver',
  'reportes.ver',
  'reportes.ventas'
);
```

### **Modificar Permisos de un Rol**

```sql
-- Remover un permiso
DELETE FROM rol_permisos
WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'Cajero')
  AND permiso_id = (SELECT id FROM permisos WHERE codigo = 'pos.ver_historial');

-- Agregar un permiso
INSERT INTO rol_permisos (rol_id, permiso_id)
VALUES (
  (SELECT id FROM roles WHERE nombre = 'Cajero'),
  (SELECT id FROM permisos WHERE codigo = 'pos.aplicar_descuentos')
);
```

---

## 🔐 Login con PIN

Los usuarios pueden configurar un PIN de 4 dígitos para acceso rápido:

```sql
-- Asignar PIN a un usuario
UPDATE usuarios
SET pin = '1234'
WHERE email = 'cajero@bargordy.com';
```

**Usar PIN en la app:**
1. Ir a vista de Login
2. Click en tab "PIN"
3. Ingresar 4 dígitos
4. Auto-login

---

## 📊 Auditoría

Todas las sesiones se registran en `sesiones_usuario`:

```sql
-- Ver últimas sesiones
SELECT 
  u.nombre,
  s.fecha_login,
  s.fecha_logout,
  s.ip_address
FROM sesiones_usuario s
JOIN usuarios u ON u.id = s.usuario_id
ORDER BY s.fecha_login DESC
LIMIT 20;
```

---

## 🛡️ Row Level Security (RLS)

El sistema usa RLS para proteger datos a nivel de base de datos:

- Solo usuarios con permiso pueden ver/editar usuarios
- Solo ADMIN puede gestionar roles y permisos
- Cada usuario puede ver/editar su propia información

---

## 🎨 Personalización

### **Agregar Nuevo Permiso**

1. **Insertar en BD:**
```sql
INSERT INTO permisos (codigo, nombre, descripcion, modulo)
VALUES (
  'reportes.avanzados',
  'Reportes Avanzados',
  'Puede ver reportes avanzados y estadísticas',
  'reportes'
);
```

2. **Actualizar TypeScript:**
```typescript
// types/auth.types.ts
export type CodigoPermiso =
  | 'pos.acceder'
  // ... otros permisos
  | 'reportes.avanzados' // ← Agregar aquí
```

3. **Usar en componente:**
```vue
<div v-if="can('reportes.avanzados')">
  Contenido avanzado
</div>
```

---

## 📱 Próximos Pasos Sugeridos

1. **Vista de Gestión de Usuarios** (CRUD completo)
2. **Vista de Gestión de Roles** (Editor visual de permisos)
3. **Cambio de Contraseña**
4. **Recuperación de Contraseña**
5. **Sesiones Activas** (Ver/cerrar sesiones)
6. **Logs de Actividad** (Auditoría detallada)
7. **Restricciones por Horario** (Permisos por turno)

---

## 🆘 Troubleshooting

### Usuario no puede hacer login
```sql
-- Verificar que existe en auth.users
SELECT * FROM auth.users WHERE email = 'usuario@ejemplo.com';

-- Verificar que existe en usuarios
SELECT * FROM usuarios WHERE email = 'usuario@ejemplo.com';

-- Verificar que está activo
SELECT activo FROM usuarios WHERE email = 'usuario@ejemplo.com';
```

### Usuario no tiene permisos
```sql
-- Ver rol del usuario
SELECT u.nombre, r.nombre as rol
FROM usuarios u
JOIN roles r ON r.id = u.rol_id
WHERE u.email = 'usuario@ejemplo.com';

-- Ver permisos del rol
SELECT p.codigo, p.nombre
FROM rol_permisos rp
JOIN permisos p ON p.id = rp.permiso_id
WHERE rp.rol_id = (
  SELECT rol_id FROM usuarios WHERE email = 'usuario@ejemplo.com'
);
```

---

## 📝 Notas Importantes

- ⚠️ Los roles con `es_sistema = true` no se pueden eliminar
- ⚠️ El permiso `roles.gestionar` es muy poderoso, otorgarlo con cuidado
- ⚠️ Cambiar permisos requiere reload del usuario para actualizar
- ⚠️ El PIN no reemplaza la contraseña, es solo acceso rápido

---

## 🎉 ¡Sistema Listo!

El sistema de usuarios y permisos está completamente funcional y listo para usar. Puedes:

✅ Crear usuarios con diferentes roles  
✅ Personalizar permisos por rol  
✅ Proteger rutas y componentes  
✅ Auditar sesiones  
✅ Login con email o PIN  
✅ Todo con seguridad RLS  

**¡Empieza creando tu primer usuario administrador!** 🚀
