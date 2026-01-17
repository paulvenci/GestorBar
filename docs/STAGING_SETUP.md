# Guía: Configuración de Supabase Local (Staging)

## Requisitos
- Docker Desktop instalado y corriendo

## Paso 1: Inicializar Supabase Local

```bash
cd "d:\Electrosun\bar gordy"
supabase init
```

Esto crea la carpeta `supabase/` con la configuración.

## Paso 2: Iniciar Supabase Local

```bash
supabase start
```

Primera vez toma unos minutos (descarga imágenes Docker).
Al terminar, muestra las credenciales:

```
API URL: http://localhost:54321
anon key: eyJhbGciOiJS...
service_role key: eyJhbGciOiJS...
Studio URL: http://localhost:54323
```

## Paso 3: Configurar .env.staging

Edita `frontend/.env.staging`:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<anon key que te mostró>
```

## Paso 4: Ejecutar Migraciones

Opción A - Automático:
```bash
supabase db push
```

Opción B - Manual (en Studio http://localhost:54323):
1. Ir a SQL Editor
2. Ejecutar schema.sql y migraciones en orden

## Paso 5: Crear Usuario Admin

En Studio (http://localhost:54323):
1. Authentication → Users → Create User
2. Email: `admin@staging.local`
3. Password: `1234`

Luego en SQL Editor:
```sql
INSERT INTO usuarios (id, nombre, email, pin, activo, rol_id)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@staging.local'),
  'Admin Staging',
  'admin@staging.local',
  '1234',
  true,
  (SELECT id FROM roles WHERE nombre = 'Administrador')
);
```

## Paso 6: Ejecutar App en Staging

```bash
cd frontend
npm run dev:staging
```

## Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `supabase start` | Iniciar Supabase local |
| `supabase stop` | Detener Supabase local |
| `supabase status` | Ver estado y URLs |
| `supabase db reset` | Resetear base de datos |

## Accesos

- **Studio**: http://localhost:54323 (Dashboard visual)
- **API**: http://localhost:54321
- **App**: http://localhost:5173 (con `npm run dev:staging`)
