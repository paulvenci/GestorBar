# 👤 Guía Rápida: Cómo Crear Usuarios

## 📝 Proceso Simple (2 Pasos)

### Paso 1: Crear Usuario en Supabase Dashboard

1. **Abre Supabase Dashboard**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto "Bar Gordy"

2. **Ve a Authentication → Users**
   - En el menú lateral, click en **"Authentication"**
   - Click en **"Users"**

3. **Crear Nuevo Usuario**
   - Click en botón verde **"Add user"**
   - Selecciona **"Create new user"**
   - Llena el formulario:
     - **Email**: mesero1@bargordy.com (ejemplo)
     - **Password**: crea una contraseña segura
     - **Auto Confirm User**: Déjalo marcado (YES)
   - Click en **"Create user"**

4. **Copiar el UUID**
   - Una vez creado, verás una lista de usuarios
   - Busca el usuario que acabas de crear
   - En la columna **"ID"**, verás algo como: `a1b2c3d4-e5f6-...`
   - **Copia ese ID completo** (click derecho → copiar)

---

### Paso 2: Vincular Usuario en la Aplicación

1. **Abre tu aplicación Bar Gordy**
   - Inicia sesión como administrador

2. **Ve a Configuración**
   - Click en el menú lateral: **"Configuración"**
   - Scroll hasta encontrar **"Gestión de Usuarios"**

3. **Click en "+ Nuevo Usuario"**
   - Se abrirá un modal con instrucciones

4. **Click en "Ya creé el usuario, continuar"**

5. **Llenar el formulario**:
   - **UUID del Usuario**: Pega el UUID que copiaste (paso 1.4)
   - **Nombre Completo**: Juan Pérez (ejemplo)
   - **Email**: mesero1@bargordy.com (debe coincidir con paso 1.3)
   - **Rol**: Selecciona el rol apropiado (Mesero, Cajero, etc.)
   - **PIN**: (Opcional) 1234 - para acceso rápido con 4 dígitos
   - **Usuario activo**: Déjalo marcado

6. **Click en "Guardar"**

**¡Listo!** El usuario ya puede iniciar sesión con su email y contraseña.

---

## 🎭 Roles Disponibles

- **Administrador**: Acceso total, puede gestionar usuarios
- **Gerente**: Todo excepto usuarios y roles
- **Cajero**: Solo POS y ventas básicas
- **Mesero**: Mesas y POS básico

---

## 🔐 Login con PIN

Si configuraste un PIN, el usuario puede:

1. Ir a la pantalla de login
2. Click en pestaña **"PIN"**
3. Ingresar los 4 dígitos
4. Acceso instantáneo

---

## 📋 Ejemplo Completo

### Crear un Mesero:

**En Supabase Dashboard:**
- Email: `mesero1@bargordy.com`
- Password: `mesero123456`
- Copiar UUID: `a1b2c3d4-e5f6-7890-abcd-1234567890ab`

**En la Aplicación:**
- UUID: `a1b2c3d4-e5f6-7890-abcd-1234567890ab`
- Nombre: `Juan Pérez`
- Email: `mesero1@bargordy.com`
- Rol: `Mesero`
- PIN: `1234`
- Activo: ✅

---

## ❓ Preguntas Frecuentes

### ¿Por qué tengo que crear primero en Supabase?

Por seguridad, solo el servidor de Supabase puede crear usuarios en Authentication. La aplicación frontend no tiene ese permiso.

### ¿Puedo cambiar el rol de un usuario después?

Sí, simplemente edita el usuario en la aplicación y selecciona otro rol.

### ¿Qué pasa si me equivoco en el UUID?

Verás un error: "El UUID no es válido". Verifica que copiaste el UUID correcto desde Supabase Dashboard.

### ¿Puedo eliminar usuarios?

Puedes **desvincular** usuarios desde la app (los elimina de la tabla `usuarios`), pero seguirán existiendo en Authentication. Para eliminarlos completamente, debes hacerlo desde Supabase Dashboard → Authentication → Users.

### ¿Cómo cambio la contraseña de un usuario?

1. Ve a Supabase Dashboard → Authentication → Users
2. Busca el usuario
3. Click en los 3 puntos → "Reset Password"
4. Ingresa la nueva contraseña

---

## 🎯 Video Tutorial (Recomendado)

Si prefieres ver el proceso en video, aquí está la secuencia:

1. Dashboard → Authentication → Users → Add user
2. Copiar UUID
3. App → Configuración → Gestión de Usuarios → + Nuevo Usuario
4. Pegar UUID y llenar formulario
5. Guardar

**Tiempo total**: ~2 minutos por usuario

---

## 🚀 Opción Avanzada: Edge Functions

Si quieres crear usuarios directamente desde la app sin ir a Supabase Dashboard, puedes desplegar Edge Functions:

1. Lee el archivo: `supabase/DEPLOY_FUNCTIONS.md`
2. Sigue las instrucciones para desplegar
3. Una vez desplegadas, podrás crear usuarios sin UUID

---

## ✅ Checklist

Para verificar que todo funciona:

- [ ] Puedes crear usuario en Supabase Dashboard
- [ ] Puedes copiar el UUID del usuario
- [ ] Puedes vincular el usuario en la aplicación
- [ ] El usuario aparece en la lista de usuarios
- [ ] El usuario puede iniciar sesión con email/password
- [ ] El usuario puede iniciar sesión con PIN (si configuraste uno)
- [ ] El usuario tiene los permisos correctos según su rol

---

**¡Eso es todo!** Ahora puedes crear todos los usuarios que necesites para tu equipo. 🎉
