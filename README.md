# 🍺 Bar Gordy - Sistema de Gestión

Sistema web de gestión integral para bar usando **Vue 3 + TypeScript + Supabase**.

---

## ✅ Estado Actual del Proyecto

### Completado

- ✅ Proyecto Vue 3 + TypeScript creado con Vite
- ✅ Dependencias instaladas (Supabase, Pinia, Vue Router, TailwindCSS, Chart.js)
- ✅ Estructura de carpetas creada
- ✅ Cliente Supabase configurado
- ✅ Tipos TypeScript definidos
- ✅ TailwindCSS configurado con tema personalizado
- ✅ Script SQL para base de datos (schema.sql)

### Pendiente

- ⏳ Ejecutar SQL en Supabase (ver instrucciones abajo)
- ⏳ Obtener y configurar Anon Key
- ⏳ Crear componentes Vue
- ⏳ Implementar módulos (Dashboard, Productos, POS, etc.)

---

## 🚀 Próximos Pasos

### 1. Ejecutar SQL en Supabase

**IMPORTANTE:** Antes de iniciar el proyecto, debes crear las tablas en Supabase.

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Menú lateral → **SQL Editor** → **New query**
3. Copia todo el contenido de `supabase/schema.sql`
4. Pégalo en el editor y click **Run**
5. Verifica en **Table Editor** que se crearon 8 tablas

👉 **Ver instrucciones detalladas en:** `supabase/INSTRUCCIONES.md`

### 2. Obtener Anon Key de Supabase

1. En Supabase, ve a **Settings** → **API**
2. Copia el **Project API keys** → **anon** / **public**
3. Actualiza `frontend/.env`:

```env
VITE_SUPABASE_URL=https://pbuolrpiixuqegrqlxxp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (tu key aquí)
```

###  3. Iniciar Servidor de Desarrollo

```bash
cd frontend
npm run dev
```

La aplicación se abrirá en: **http://localhost:5174**

### 4. Desplegar a Producción

Para desplegar la aplicación a **GitHub Pages**, sigue la guía completa en:

👉 **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guía de Despliegue a GitHub Pages

**URL de producción:** https://paulvenci.github.io/bar-jordy/

---

## 📁 Estructura del Proyecto

```
bar-gordy/
├── frontend/                    # Aplicación Vue 3
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Componentes reutilizables
│   │   │   ├── layout/          # Header, Sidebar
│   │   │   └── modules/         # Componentes por módulo
│   │   ├── views/               # Páginas principales
│   │   ├── stores/              # Pinia stores
│   │   ├── router/              # Vue Router
│   │   ├── lib/
│   │   │   └── supabase.ts      # Cliente Supabase
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Utilidades
│   ├── .env                     # Variables de entorno
│   └── package.json
│
├── supabase/
│   ├── schema.sql               # Script de creación de BD
│   └── INSTRUCCIONES.md         # Guía para ejecutar SQL
│
└── docs/
    ├── README.md
    ├── especificacion-tecnica.md
    ├── arquitectura-vue-supabase.md
    └── diagramas.md
```

---

## 🛠 ️ Stack Tecnológico

### Frontend
- **Vue 3** (Composition API) + **TypeScript**
- **Vite** (build tool)
- **Pinia** (state management)
- **Vue Router** (navegación)
- **TailwindCSS** (estilos)
- **Chart.js** (gráficos)
- **VeeValidate** (validación)

### Backend - Supabase
- **PostgreSQL** (base de datos)
- **PostgREST** (API REST automática)
- **Supabase Auth** (opcional, fase futura)
- **Supabase Storage** (imágenes)

---

## 📚 Documentación

- **[README.md](README.md)**: Este archivo
- **[especificacion-tecnica.md](especificacion-tecnica.md)**: Especificación completa del sistema
- **[arquitectura-vue-supabase.md](arquitectura-vue-supabase.md)**: Arquitectura técnica
- **[diagramas.md](diagramas.md)**: Diagramas de flujo y ERD
- **[supabase/INSTRUCCIONES.md](supabase/INSTRUCCIONES.md)**: Cómo ejecutar el SQL

---

## 🧪 Testing

Una vez que el proyecto esté completo, podrás probarlo:

```bash
cd frontend
npm run dev
```

Navega por los módulos:
- Dashboard: http://localhost:5174/
- Productos: http://localhost:5174/productos
- POS: http://localhost:5174/pos
- Reportes: http://localhost:5174/reportes

---

## 🔧 Comandos Útiles

```bash
# Instalar dependencias
cd frontend  
npm install

# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Lint
npm run lint
```

---

## ⚙️ Configuración

### Variables de Entorno (.env)

El archivo `frontend/.env` contiene:

```env
VITE_SUPABASE_URL=https://pbuolrpiixuqegrqlxxp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (obtener de Supabase)
```

**IMPORTANTE:** No compartas tu anon key públicamente, aunque es una key "pública" para el frontend.

---

## 📦 Dependencias Instaladas

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "chart.js": "^4.4.0",
    "pinia": "^2.1.7",
    "vee-validate": "^4.12.0",
    "vue": "^3.4.0",
    "vue-chartjs": "^5.3.0",
    "vue-router": "^4.2.5",
    "yup": "^1.3.3"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^7.2.7"
  }
}
```

---

## 🎯 Funcionalidades

### Módulos Implementados (Próximamente)

- [ ] **Dashboard**: KPIs del negocio
- [ ] **Gestión de Productos**: CRUD con productos simples y compuestos
- [ ] **Gestión de Inventario**: Entradas, ajustes, alertas
- [ ] **POS (Punto de Venta)**: Registro de ventas
- [ ] **Reportes**: Ventas, top productos, comparativos
- [ ] **Configuración**: Parámetros del sistema

---

## 🚨 Troubleshooting

### Error: "Missing Supabase environment variables"

- Verifica que `frontend/.env` existe
- Verifica que las variables tienen valores correctos
- Reinicia el servidor (`npm run dev`)

### Error: "Cannot connect to Supabase"

- Verifica que el proyecto Supabase está activo
- Verifica la URL del proyecto
- Verifica que el anon key es correcto

### Error al ejecutar SQL

- Ver `supabase/INSTRUCCIONES.md`
- Asegúrate de ejecutar TODO el script, no solo partes

---

## 📝 Licencia

Todos los derechos reservados © 2025 Bar Gordy

---

**¿Dudas o problemas?** Revisa la documentación en la carpeta `docs/` o consulta con el desarrollador.
