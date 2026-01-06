# 🚀 Desplegar Funciones Edge de Supabase

## 📋 Descripción

Para solucionar el error de "Bearer token" al crear usuarios, hemos creado funciones Edge de Supabase que se ejecutan en el servidor y tienen acceso a las credenciales de administrador.

## 🔧 Funciones Creadas

1. **crear-usuario**: Crea un nuevo usuario en auth.users y en la tabla usuarios
2. **eliminar-usuario**: Elimina un usuario de auth.users y de la tabla usuarios

---

## 📦 Opción 1: Desplegar con Supabase CLI (Recomendado)

### Paso 1: Instalar Supabase CLI

```bash
# Windows (con npm)
npm install -g supabase

# O con Scoop
scoop install supabase
```

### Paso 2: Login en Supabase

```bash
supabase login
```

Esto abrirá tu navegador para autenticarte.

### Paso 3: Vincular tu Proyecto

```bash
# En la raíz del proyecto
supabase link --project-ref TU-PROJECT-REF
```

Para obtener tu `project-ref`:
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. La URL será algo como: `https://app.supabase.com/project/abc123def456`
4. Tu `project-ref` es: `abc123def456`

### Paso 4: Desplegar las Funciones

```bash
# Desplegar todas las funciones
supabase functions deploy crear-usuario
supabase functions deploy eliminar-usuario
```

### Paso 5: Verificar Despliegue

Ve a tu dashboard de Supabase:
1. **Edge Functions** en el menú lateral
2. Deberías ver las dos funciones listadas
3. Click en cada una para ver sus logs y estado

---

## 📝 Opción 2: Copiar y Pegar en Dashboard

Si no quieres usar CLI, puedes crear las funciones directamente en el dashboard:

### Paso 1: Crear Función en Dashboard

1. Ve a **Edge Functions** en Supabase Dashboard
2. Click en **"Create a new function"**
3. Nombre: `crear-usuario`
4. Copia el contenido de `supabase/functions/crear-usuario/index.ts`
5. Pégalo en el editor
6. Click en **"Deploy function"**

### Paso 2: Repetir para la Segunda Función

1. Click en **"Create a new function"**
2. Nombre: `eliminar-usuario`
3. Copia el contenido de `supabase/functions/eliminar-usuario/index.ts`
4. Pégalo en el editor
5. Click en **"Deploy function"**

---

## 🧪 Probar las Funciones

### Desde la Aplicación

1. Inicia sesión como administrador
2. Ve a **Configuración → Gestión de Usuarios**
3. Click en **"+ Nuevo Usuario"**
4. Llena el formulario y guarda
5. Deberías ver el mensaje: "Usuario creado correctamente"

### Desde el Dashboard

1. Ve a **Edge Functions** en Supabase
2. Selecciona `crear-usuario`
3. Click en la pestaña **"Invoke"**
4. Usa este payload de prueba:

```json
{
  "email": "test@bargordy.com",
  "password": "test123456",
  "nombre": "Usuario Test",
  "rol_id": "UUID-DEL-ROL-CAJERO",
  "activo": true,
  "pin": "1234"
}
```

5. Click en **"Invoke function"**
6. Deberías ver una respuesta exitosa

---

## 🔑 Configurar Variables de Entorno

Las funciones ya tienen acceso automático a estas variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

No necesitas configurar nada adicional.

---

## 🐛 Troubleshooting

### Error: "Function not found"

**Causa**: La función no está desplegada correctamente.

**Solución**:
1. Verifica que la función aparece en **Edge Functions** del dashboard
2. Revisa los logs de despliegue
3. Intenta redesplegar con `supabase functions deploy crear-usuario --no-verify-jwt`

### Error: "No authorization header"

**Causa**: El frontend no está enviando el token de autenticación.

**Solución**:
1. Verifica que estás autenticado en la aplicación
2. Revisa que la sesión sea válida
3. Cierra sesión y vuelve a iniciar sesión

### Error: "No tienes permisos para crear usuarios"

**Causa**: Tu usuario no tiene el permiso `usuarios.crear`.

**Solución**:
1. Verifica tu rol en la BD:
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
WHERE rp.rol_id = (SELECT rol_id FROM usuarios WHERE email = 'tu-email@ejemplo.com');
```

3. Si necesitas agregar el permiso:
```sql
INSERT INTO rol_permisos (rol_id, permiso_id)
VALUES (
  (SELECT rol_id FROM usuarios WHERE email = 'tu-email@ejemplo.com'),
  (SELECT id FROM permisos WHERE codigo = 'usuarios.crear')
);
```

### Los logs muestran errores de CORS

**Causa**: Problema de configuración de CORS en las funciones.

**Solución**:
Las funciones ya tienen configurado CORS para aceptar todos los orígenes (`*`). Si sigues teniendo problemas:

1. Verifica que tu aplicación está enviando las cabeceras correctas
2. Revisa la consola del navegador para ver el error exacto
3. Considera agregar tu dominio específico en `corsHeaders`

---

## 📊 Monitoreo

### Ver Logs de las Funciones

1. Ve a **Edge Functions** en el dashboard
2. Selecciona la función
3. Click en la pestaña **"Logs"**
4. Aquí verás todas las invocaciones, errores y mensajes de debug

### Métricas

En el dashboard podrás ver:
- Número de invocaciones
- Tiempo de ejecución promedio
- Tasa de errores
- Uso de recursos

---

## 🔄 Actualizar las Funciones

Si necesitas hacer cambios:

1. Edita el archivo en `supabase/functions/[nombre-funcion]/index.ts`
2. Despliega nuevamente:
```bash
supabase functions deploy crear-usuario
```

3. Los cambios estarán disponibles inmediatamente

---

## ✅ Checklist de Verificación

Antes de considerar que todo está funcionando, verifica:

- [ ] Las funciones aparecen en **Edge Functions** del dashboard
- [ ] Puedes invocar las funciones desde el dashboard (pestaña Invoke)
- [ ] Puedes crear un usuario desde la aplicación
- [ ] Puedes eliminar un usuario desde la aplicación
- [ ] Los logs no muestran errores
- [ ] El usuario creado aparece en **Authentication → Users**
- [ ] El usuario creado aparece en la tabla `usuarios`

---

## 📚 Referencias

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase CLI Docs](https://supabase.com/docs/reference/cli/introduction)
- [Deno Deploy Docs](https://deno.com/deploy/docs)

---

## 💡 Tips

1. **Desarrollo Local**: Puedes ejecutar las funciones localmente con:
```bash
supabase functions serve crear-usuario --env-file .env.local
```

2. **Debugging**: Usa `console.log()` en tus funciones y revisa los logs en el dashboard

3. **Seguridad**: Las funciones ya validan que el usuario tenga los permisos necesarios antes de ejecutar acciones

4. **Performance**: Las funciones Edge se ejecutan cerca de tus usuarios para mínima latencia

---

¡Listo! Una vez desplegadas las funciones, podrás crear y eliminar usuarios directamente desde la aplicación sin problemas. 🎉
