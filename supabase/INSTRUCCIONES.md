# Instrucciones para Ejecutar el SQL en Supabase

## Paso 1: Acceder al SQL Editor de Supabase

1. Ve a tu proyecto en [https://supabase.com](https://supabase.com)
2. En el menú lateral izquierdo, click en **SQL Editor**
3. Click en **New query**

## Paso 2: Copiar y Ejecutar el Script

1. Abre el archivo `supabase/schema.sql`
2. Copia TODO el contenido del archivo
3. Pégalo en el editor SQL de Supabase
4. Click en **Run** (esquina inferior derecha)

## Paso 3: Verificar que se Crearon las Tablas

1. En el menú lateral, ve a **Table Editor**
2. Deberías ver las siguientes tablas:
   - ✅ categorias
   - ✅ productos
   - ✅ recetas
   - ✅ componentes_receta
   - ✅ movimientos_stock
   - ✅ ventas
   - ✅ items_venta
   - ✅ configuracion

## Paso 4: Verificar Datos Iniciales

1. Click en la tabla `categorias`
2. Deberías ver 5 categorías predefinidas:
   - Bebidas
   - Jugos  
   - Con Alcohol
   - Licores
   - Cervezas

3. Click en la tabla `configuracion`
4. Deberías ver la configuración inicial:
   - porcentaje_iva = 19
   - stock_minimo_default = 5
   - moneda = CLP
   - nombre_negocio = Bar Gordy
   - dias_sin_rotacion = 30

## Paso 5: Obtener el Anon Key (si aún no lo tienes)

1. Ve a **Settings** → **API**
2. Copia el **Project API keys** → **anon** / **public**
3. El key empieza con `eyJ...`
4. Actualiza este valor en el archivo `frontend/.env`

```env
VITE_SUPABASE_URL=https://pbuolrpiixuqegrqlxxp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (tu key aquí)
```

## Paso 6: Probar la Conexión desde Vue

Una vez actualizado el `.env`, reinicia el servidor de desarrollo:

```bash
cd frontend
npm run dev
```

Abre la consola del navegador (F12) y verifica que no haya errores de conexión a Supabase.

## Troubleshooting

### Error: "extension uuid-ossp does not exist"

Si obtienes este error, ejecuta primero:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Luego vuelve a ejecutar el script completo.

### Error: "permission denied"

Asegúrate de estar usando el servicio de Supabase en el plan Free, que tiene todos los permisos necesarios.

### RLS (Row Level Security) está habilitado

El script desactiva RLS para el MVP. Si por alguna razón las políticas están activas y no puedes insertar datos, ejecuta:

```sql
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE ventas DISABLE ROW LEVEL SECURITY;
-- ... para cada tabla
```

## Próximos Pasos

Una vez ejecutado el SQL exitosamente:
1. ✅ Base de datos lista
2. ⏳ Volver al proyecto Vue y continuar con la implementación del frontend
3. ⏳ Crear componentes y vistas
