# 🚀 Guía de Implementación para Nuevo Cliente

## Resumen Ejecutivo

Para implementar Bar Gordy POS para un nuevo cliente, necesitarás crear un **nuevo proyecto Supabase** (base de datos separada) para mantener los datos aislados y seguros.

---

## Opciones de Implementación

### Opción 1: Base de Datos Separada (Recomendado) ✅

**Ventajas:**
- ✅ Datos completamente aislados por cliente
- ✅ Fácil de gestionar permisos
- ✅ Backups independientes
- ✅ Escalabilidad simple

**Cuándo usar:** Para cada cliente nuevo

### Opción 2: Multi-tenant en una BD

**Ventajas:**
- ✅ Una sola base de datos
- ✅ Menor costo

**Desventajas:**
- ❌ Riesgo de filtración de datos entre clientes
- ❌ Más complejo de implementar
- ❌ Difícil de escalar

**Cuándo usar:** No recomendado para clientes de pago

---

## Pasos para Implementar Nuevo Cliente

### 1. Crear Nuevo Proyecto Supabase

1. Ve a https://supabase.com
2. Click **"New Project"**
3. Completa:
   - **Name:** `bar-[nombre-cliente]` (ej: `bar-restaurant-mar`)
   - **Database Password:** Genera una segura
   - **Region:** Elige la más cercana al cliente
   - **Plan:** Free o Pro según necesidad
4. Click **"Create new project"**
5. Espera 2-3 minutos mientras se configura

### 2. Ejecutar Script de Base de Datos

1. En el nuevo proyecto Supabase, ve a **SQL Editor**
2. Click **"New Query"**
3. Abre el archivo local: `database/schema.sql`
4. **Copia TODO el contenido** del archivo
5. **Pega** en el editor SQL de Supabase
6. Click **"Run"** (▶️)
7. Verifica que se crearon todas las tablas:
   - `usuarios`
   - `productos`
   - `categorias`
   - `ventas`
   - `items_venta`
   - `inventario`
   - `configuracion`
   - etc.

### 3. Configurar RLS (Row Level Security)

El script `schema.sql` ya incluye las políticas RLS, pero verifica:

1. Ve a **Authentication** > **Policies**
2. Confirma que cada tabla tiene políticas configuradas
3. Las políticas deben permitir:
   - SELECT: usuarios autenticados
   - INSERT/UPDATE/DELETE: según rol del usuario

### 4. Crear Usuario Administrador

Tienes 2 opciones:

#### Opción A: Desde Supabase Dashboard (Recomendado)

1. Ve a **Authentication** > **Users**
2. Click **"Add user"** > **"Create new user"**
3. Completa:
   - **Email:** admin@[cliente].com
   - **Password:** Genera una segura
   - **Email Confirm:** ✅ (marca auto-confirm)
4. Click **"Create user"**
5. Copia el **UUID** del usuario
6. Ve a **SQL Editor** y ejecuta:

```sql
-- Insertar usuario en tabla usuarios con rol admin
INSERT INTO usuarios (id, email, nombre_completo, rol, pin, activo)
VALUES (
  '[UUID del usuario]',
  'admin@[cliente].com',
  'Administrador',
  'admin',
  '1234',
  true
);
```

#### Opción B: Usando Edge Function

> **Nota:** Requiere desplegar la función `crear-usuario` primero (ver paso 6)

### 5. Configurar Variables de Entorno

1. **Clonar/Copiar el proyecto:**

   ```bash
   # Si es para desarrollo local del cliente
   git clone https://github.com/paulvenci/bar-jordy.git bar-[cliente]
   cd bar-[cliente]
   ```

2. **Obtener credenciales de Supabase:**
   
   En el proyecto Supabase del cliente:
   - Ve a **Settings** > **API**
   - Copia:
     - **Project URL**
     - **anon public** key

3. **Crear archivo `.env`:**

   ```bash
   cd frontend
   cp .env.example .env
   ```

4. **Editar `.env`:**

   ```env
   VITE_SUPABASE_URL=https://[project-id].supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

5. **Instalar dependencias:**

   ```bash
   npm install
   ```

6. **Probar localmente:**

   ```bash
   npm run dev
   ```

   Abre http://localhost:5173 y login con el usuario admin creado

### 6. Personalizar Configuración del Negocio

1. **Login como admin** en la aplicación
2. Ve a **Configuración**
3. Actualiza:
   - **Nombre del Negocio:** Nombre real del cliente
   - **RUT:** RUT del cliente
   - **Dirección:** Dirección física
   - **Teléfono:** Teléfono de contacto
   - **Logo:** Subir logo del cliente (opcional)
   - **Ticket - Ancho de papel:** 58mm o 80mm según impresora
   - **Ticket - Mensaje de pie:** Mensaje personalizado

4. Click **"Guardar"**

### 7. Desplegar a Producción

Tienes 3 opciones:

#### Opción A: GitHub Pages (Gratis, Recomendado)

1. **Crear repositorio para el cliente:**
   
   ```bash
   # Desde el directorio del proyecto
   cd bar-[cliente]
   git remote remove origin
   git remote add origin https://github.com/[usuario]/bar-[cliente].git
   git push -u origin main
   ```

2. **Configurar GitHub Actions:**
   
   El workflow ya existe en `.github/workflows/deploy.yml`
   
3. **Activar GitHub Pages:**
   
   - Ve a **Settings** > **Pages**
   - Source: **GitHub Actions**
   - Espera el deployment

4. **URL de producción:**
   
   `https://[usuario].github.io/bar-[cliente]/`

#### Opción B: Vercel (Gratis, Fácil)

1. Ve a https://vercel.com
2. Importa el repositorio
3. Configura variables de entorno (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
4. Deploy automático

#### Opción C: Netlify (Gratis, Alternativa)

Similar a Vercel

### 8. Configurar Supabase Edge Functions (Opcional)

Si quieres gestión de usuarios desde la app:

1. **Instalar Supabase CLI:**

   ```bash
   npm install -g supabase
   ```

2. **Login en Supabase:**

   ```bash
   supabase login
   ```

3. **Link al proyecto del cliente:**

   ```bash
   supabase link --project-ref [project-id]
   ```

4. **Desplegar funciones:**

   ```bash
   cd supabase/functions
   supabase functions deploy crear-usuario
   supabase functions deploy eliminar-usuario
   ```

5. **Configurar secrets:**

   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
   ```

### 9. Cargar Datos Iniciales

#### Categorías de Productos

1. Login como admin
2. Ve a **Configuración** > **Categorías**
3. Crea categorías según el negocio del cliente:
   - Bebidas
   - Comidas
   - Postres
   - etc.

#### Productos Iniciales

1. Ve a **Productos** > **+ Nuevo Producto**
2. Agrega productos del menú del cliente
3. Para cada producto:
   - Nombre
   - Categoría
   - Precio
   - Stock inicial
   - Código de barras (si usa pistola lectora)
   - Imagen (opcional)

### 10. Capacitación del Cliente

1. **Crear usuarios adicionales:**
   - Cajeros con PIN
   - Meseros (si aplica)
   - Gerentes

2. **Entrenar al personal:**
   - Login con PIN
   - Caja Rápida (POS)
   - Gestión de mesas
   - Reportes básicos

3. **Entregar documentación:**
   - [MANUAL_USUARIO.md](file:///d:/Electrosun/bar%20gordy/MANUAL_USUARIO.md)
   - [MODO_KIOSCO.md](file:///d:/Electrosun/bar%20gordy/MODO_KIOSCO.md) (si usa impresora térmica)

---

## Checklist de Implementación

Para cada nuevo cliente, completa:

### Pre-Implementación
- [ ] Reunión con cliente para entender necesidades
- [ ] Definir plan Supabase (Free/Pro)
- [ ] Acordar dominio/URL (si es custom)

### Configuración Técnica
- [ ] Crear proyecto Supabase
- [ ] Ejecutar schema.sql
- [ ] Verificar RLS configurado
- [ ] Crear usuario admin
- [ ] Configurar .env con credenciales
- [ ] Probar localmente
- [ ] Desplegar a producción
- [ ] Configurar dominio custom (opcional)

### Configuración de Negocio
- [ ] Personalizar datos del negocio
- [ ] Crear categorías de productos
- [ ] Cargar productos iniciales
- [ ] Configurar impresora térmica
- [ ] Probar flujo de venta completo

### Entrega
- [ ] Capacitar usuarios finales
- [ ] Entregar credenciales de admin
- [ ] Entregar documentación
- [ ] Configurar backup automático (Supabase Pro)
- [ ] Establecer canal de soporte

---

## Gestión Multi-Cliente

### Estructura Recomendada

```
/proyectos
  /bar-cliente1
    /frontend
    .env
  /bar-cliente2
    /frontend
    .env
  /bar-cliente3
    /frontend
    .env
```

Cada cliente tiene:
- ✅ Repositorio Git separado (o branch)
- ✅ Proyecto Supabase separado
- ✅ Deployment separado
- ✅ Configuración `.env` propia

### Ventajas de este Enfoque

1. **Aislamiento total:** Datos nunca se mezclan
2. **Personalización fácil:** Cada cliente puede tener features custom
3. **Facturación clara:** Costos de Supabase por proyecto
4. **Escalabilidad:** Agregar clientes no afecta a los existentes
5. **Mantenimiento:** Puedes actualizar un cliente sin tocar otros

---

## Costos Estimados por Cliente

### Plan Free (Supabase)
- **Costo:** $0/mes
- **Límites:**
  - 500MB base de datos
  - 1GB transferencia
  - Pausa después 7 días inactividad
- **Para:** Clientes pequeños, pruebas

### Plan Pro (Supabase)
- **Costo:** $25/mes
- **Incluye:**
  - 8GB base de datos
  - 250GB transferencia
  - Sin pausa
  - Backups automáticos
- **Para:** Clientes productivos

### Plan Team/Enterprise
- **Contactar Supabase** para cotización
- **Para:** Múltiples locales, franquicias

---

## Actualizaciones del Código Base

Cuando mejoras el código (ej: nueva feature):

1. **Actualiza el repositorio principal:**
   
   ```bash
   cd bar-gordy-base
   git add .
   git commit -m "feat: nueva funcionalidad"
   git push
   ```

2. **Propaga a clientes:**

   ```bash
   # Para cada cliente
   cd ../bar-cliente1
   git remote add upstream https://github.com/paulvenci/bar-jordy.git
   git fetch upstream
   git merge upstream/main
   # Resolver conflictos si hay
   git push
   ```

---

## Soporte y Mantenimiento

### Niveles de Soporte

**Básico:**
- Setup inicial
- Documentación entregada
- Soporte por email

**Premium:**
- Setup + capacitación presencial
- Soporte 24/7
- Actualizaciones incluidas
- Customizaciones

### Modelo de Negocio Sugerido

1. **Setup único:** $XXX (configuración inicial)
2. **Mensualidad:** $XX/mes (mantenimiento + soporte)
3. **Customizaciones:** Por cotización

---

## Preguntas Frecuentes

### ¿Puedo usar una sola base de datos para todos?

Técnicamente sí, pero **no recomendado**. Requiere:
- Agregar campo `tenant_id` a todas las tablas
- Modificar todas las queries
- Mayor riesgo de filtración de datos
- Complejidad en RLS

### ¿El cliente puede tener su propia cuenta Supabase?

Sí, es ideal si el cliente tiene conocimientos técnicos y quiere control total.

### ¿Cómo migro un cliente de Free a Pro?

1. En Supabase: Settings > Billing > Upgrade
2. No requiere cambios en el código
3. URL y keys permanecen iguales

### ¿Puedo usar mi propio dominio?

Sí, con GitHub Pages:
1. Configura CNAME en tu proveedor de dominio
2. Agrega archivo `CNAME` en `/public`
3. GitHub Pages servirá en tu dominio

---

**¿Necesitas ayuda con la implementación?** Solo dime qué cliente quieres configurar y lo hacemos juntos paso a paso. 🚀
