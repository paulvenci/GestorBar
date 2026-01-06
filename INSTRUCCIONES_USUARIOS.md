# 🚀 Guía de Inicio Rápido - Sistema de Usuarios

## 📋 Resumen

Has implementado un sistema completo de gestión de usuarios y permisos en tu aplicación Bar Gordy. Ahora puedes crear usuarios con diferentes roles y controlar qué puede hacer cada uno.

---

## 🎯 Paso 1: Crear tu Primer Usuario Administrador

### Opción A: Usando Supabase Dashboard (Recomendado)

1. **Ve a Supabase Dashboard**
   - Abre: https://supabase.com/dashboard
   - Selecciona tu proyecto "Bar Gordy"

2. **Crear Usuario en Authentication**
   - Ve a **Authentication > Users**
   - Click en **"Add user"** → **"Create new user"**
   - Ingresa:
     - Email: `admin@bargordy.com` (o el que prefieras)
     - Password: Una contraseña segura (mínimo 6 caracteres)
   - Click en **"Create user"**
   - **IMPORTANTE**: Copia el UUID que aparece (algo como `a1b2c3d4-e5f6-...`)

3. **Vincular con la Tabla Usuarios**
   - Ve a **SQL Editor** en Supabase
   - Pega y ejecuta este código (reemplaza `TU-UUID-AQUI`):

```sql
-- Primero verifica que el usuario existe
SELECT id, email FROM auth.users WHERE email = 'admin@bargordy.com';

-- Copia el UUID del resultado anterior y úsalo aquí:
INSERT INTO usuarios (id, nombre, email, rol_id, activo)
VALUES (
  'TU-UUID-AQUI',  -- ← Pega aquí el UUID
  'Administrador Principal',
  'admin@bargordy.com',
  (SELECT id FROM roles WHERE nombre = 'Administrador'),
  true
);

-- Verificar que se creó correctamente
SELECT u.nombre, u.email, r.nombre as rol 
FROM usuarios u 
JOIN roles r ON r.id = u.rol_id 
WHERE u.email = 'admin@bargordy.com';
```

### Opción B: Usar el Script Preparado

Alternativamente, puedes usar el archivo `supabase/crear_usuario_admin.sql` que ya tiene las instrucciones paso a paso.

---

## 🔐 Paso 2: Iniciar Sesión

1. Abre tu aplicación Bar Gordy
2. Verás la pantalla de login
3. Ingresa:
   - Email: `admin@bargordy.com`
   - Password: La contraseña que creaste
4. Click en **"Iniciar Sesión"**

¡Listo! Ahora tienes acceso completo como administrador.

---

## 👥 Paso 3: Crear Más Usuarios (Desde la Aplicación)

Ahora que eres administrador, puedes crear más usuarios directamente desde la app:

1. **Ve a Configuración**
   - Click en el menú lateral: **"Configuración"**
   - Scroll hacia abajo hasta la sección **"Gestión de Usuarios"**

2. **Crear Nuevo Usuario**
   - Click en **"+ Nuevo Usuario"**
   - Llena el formulario:
     - **Nombre**: Nombre completo del empleado
     - **Email**: Email único para el usuario
     - **Contraseña**: Contraseña inicial (mínimo 6 caracteres)
     - **Rol**: Selecciona el rol apropiado:
       - **Administrador**: Acceso total
       - **Gerente**: Todo excepto gestión de usuarios
       - **Cajero**: Solo ventas básicas
       - **Mesero**: Mesas y ventas
     - **PIN** (opcional): 4 dígitos para acceso rápido
     - **Usuario activo**: Marcar para que pueda iniciar sesión

3. **Guardar**
   - Click en **"Guardar"**
   - El usuario ya puede iniciar sesión con su email y contraseña

---

## 🎭 Roles Predefinidos

Tu sistema viene con 4 roles predefinidos:

### 1. Administrador
- ✅ **Acceso Total**
- Puede gestionar usuarios y roles
- Puede ver y modificar todo

### 2. Gerente
- ✅ Gestión completa de productos, inventario y reportes
- ❌ NO puede crear/editar usuarios ni roles
- Ideal para supervisores

### 3. Cajero
- ✅ Puede usar el POS y realizar ventas
- ✅ Puede ver productos
- ❌ NO puede aplicar descuentos grandes
- ❌ NO puede acceder a reportes o configuración

### 4. Mesero
- ✅ Puede tomar órdenes en mesas
- ✅ Puede cobrar comandas
- ✅ Puede usar POS básico
- ❌ Acceso limitado a otras funciones

---

## 🔧 Gestión de Roles y Permisos

### Crear Rol Personalizado

1. Ve a **Configuración** → **"Gestión de Roles y Permisos"**
2. Click en **"+ Nuevo Rol"**
3. Llena el formulario:
   - **Nombre**: Ej: "Supervisor de Turno"
   - **Descripción**: Breve descripción
   - **Permisos**: Selecciona los permisos necesarios por módulo
4. Click en **"Guardar"**

### Modificar Permisos de un Rol Existente

1. En la sección de roles, busca el rol que quieres editar
2. Click en **"Editar"**
3. Marca o desmarca los permisos que necesites
4. Click en **"Guardar"**

**Nota**: Los roles del sistema (Administrador, Gerente, Cajero, Mesero) no se pueden eliminar, pero SÍ puedes modificar sus permisos.

---

## 📱 Login con PIN (Acceso Rápido)

Los usuarios pueden configurar un PIN de 4 dígitos para acceso rápido:

### Configurar PIN

1. Como administrador, edita el usuario
2. En el campo **"PIN"**, ingresa 4 dígitos (ej: `1234`)
3. Guarda

### Usar PIN para Login

1. En la pantalla de login, click en la pestaña **"PIN"**
2. Ingresa los 4 dígitos
3. Acceso instantáneo

**Importante**: El PIN NO reemplaza la contraseña, es solo para acceso rápido.

---

## 🛡️ Permisos Disponibles

El sistema tiene permisos granulares para cada módulo:

### POS / Ventas
- `pos.acceder` - Acceder al POS
- `pos.vender` - Realizar ventas
- `pos.aplicar_descuentos` - Aplicar descuentos
- `pos.cancelar_ventas` - Cancelar ventas
- `pos.ver_historial` - Ver historial

### Productos
- `productos.ver` - Ver productos
- `productos.crear` - Crear productos
- `productos.editar` - Editar productos
- `productos.eliminar` - Eliminar productos
- `productos.gestionar_recetas` - Gestionar recetas

### Inventario
- `inventario.ver` - Ver inventario
- `inventario.entrada` - Registrar entradas
- `inventario.salida` - Registrar salidas
- `inventario.ajuste` - Hacer ajustes

### Mesas
- `mesas.ver` - Ver mesas
- `mesas.tomar_orden` - Tomar órdenes
- `mesas.cobrar` - Cobrar mesas
- `mesas.cancelar` - Cancelar órdenes

### Reportes
- `reportes.ver` - Ver reportes
- `reportes.ventas` - Reportes de ventas
- `reportes.inventario` - Reportes de inventario
- `reportes.exportar` - Exportar reportes

### Configuración
- `config.ver` - Ver configuración
- `config.negocio` - Configurar negocio
- `config.tickets` - Configurar tickets

### Usuarios
- `usuarios.ver` - Ver usuarios
- `usuarios.crear` - Crear usuarios
- `usuarios.editar` - Editar usuarios
- `usuarios.eliminar` - Eliminar usuarios
- `roles.gestionar` - Gestionar roles

---

## 🔄 Operaciones Comunes

### Desactivar un Usuario

1. Ve a **Configuración** → **"Gestión de Usuarios"**
2. Busca el usuario
3. Click en **"Desactivar"**
4. El usuario no podrá iniciar sesión, pero sus datos se conservan

### Reactivar un Usuario

1. Busca el usuario desactivado
2. Click en **"Activar"**
3. El usuario puede volver a iniciar sesión

### Cambiar el Rol de un Usuario

1. Edita el usuario
2. Selecciona un nuevo rol en el dropdown
3. Guarda
4. El usuario tendrá los nuevos permisos inmediatamente

### Eliminar un Usuario

1. Click en **"Eliminar"** junto al usuario
2. Confirma escribiendo "ELIMINAR"
3. **IMPORTANTE**: Esta acción NO se puede deshacer

---

## ⚠️ Notas Importantes

1. **Los roles del sistema no se pueden eliminar** (Administrador, Gerente, Cajero, Mesero)
2. **El permiso `roles.gestionar` es muy poderoso** - Otórgalo con cuidado
3. **Siempre mantén al menos un usuario Administrador activo**
4. **Los cambios en permisos aplican inmediatamente** (puede requerir recargar)
5. **El PIN es opcional** - Solo úsalo si necesitas acceso rápido

---

## 🆘 Solución de Problemas

### No puedo iniciar sesión

1. Verifica que el usuario existe en Authentication:
   ```sql
   SELECT * FROM auth.users WHERE email = 'tu-email@ejemplo.com';
   ```

2. Verifica que existe en la tabla usuarios:
   ```sql
   SELECT * FROM usuarios WHERE email = 'tu-email@ejemplo.com';
   ```

3. Verifica que está activo:
   ```sql
   SELECT activo FROM usuarios WHERE email = 'tu-email@ejemplo.com';
   ```

### El usuario no tiene permisos

1. Verifica su rol:
   ```sql
   SELECT u.nombre, r.nombre as rol
   FROM usuarios u
   JOIN roles r ON r.id = u.rol_id
   WHERE u.email = 'tu-email@ejemplo.com';
   ```

2. Verifica los permisos del rol:
   ```sql
   SELECT p.codigo, p.nombre
   FROM rol_permisos rp
   JOIN permisos p ON p.id = rp.permiso_id
   WHERE rp.rol_id = (
     SELECT rol_id FROM usuarios WHERE email = 'tu-email@ejemplo.com'
   );
   ```

### Error al crear usuario desde la app

**Posible causa**: No tienes permisos de administrador en Supabase Auth.

**Solución**: Los usuarios deben crearse manualmente desde Supabase Dashboard primero, o debes configurar las claves de servicio en tu aplicación.

---

## 🎉 ¡Todo Listo!

Tu sistema de usuarios está completamente funcional. Ahora puedes:

✅ Crear y gestionar usuarios  
✅ Asignar roles y permisos  
✅ Controlar acceso a cada módulo  
✅ Usar PIN para acceso rápido  
✅ Auditar sesiones  

**¡Empieza creando tu primer usuario administrador y comienza a usar el sistema!** 🚀

---

## 📚 Archivos de Referencia

- `supabase/migrations/20251216_sistema_usuarios_permisos.sql` - Migración SQL completa
- `supabase/crear_usuario_admin.sql` - Script para crear administrador
- `SISTEMA_USUARIOS_PERMISOS.md` - Documentación técnica completa
- `frontend/src/stores/auth.ts` - Store de autenticación
- `frontend/src/components/modules/settings/` - Componentes de gestión

---

**Fecha de creación**: Diciembre 2024  
**Versión**: 1.0
