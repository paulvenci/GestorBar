# 🚀 Guía de Despliegue a GitHub Pages

Esta guía te ayudará a desplegar **Bar Gordy POS** a GitHub Pages usando GitHub Actions.

---

## 📋 Requisitos Previos

- [x] Repositorio en GitHub: `paulvenci/bar-jordy`
- [ ] Proyecto Supabase configurado
- [ ] Variables de entorno de Supabase disponibles

---

## 🔧 Configuración Inicial (Una sola vez)

### 1. Subir el Código a GitHub

Si aún no has subido tu código:

```bash
# En el directorio raíz del proyecto (d:\Electrosun\bar gordy)
git init
git add .
git commit -m "Initial commit: Bar Gordy POS"
git branch -M main
git remote add origin https://github.com/paulvenci/bar-jordy.git
git push -u origin main
```

### 2. Habilitar GitHub Pages

1. Ve a tu repositorio: https://github.com/paulvenci/bar-jordy
2. Click en **Settings** (Configuración)
3. En el menú lateral, click en **Pages**
4. En **Source**, selecciona **GitHub Actions**

![Configuración de GitHub Pages](https://docs.github.com/assets/cb-47267/mw-1440/images/help/pages/select-github-actions-source.webp)

### 3. Configurar Secrets (Variables de Entorno)

Las variables de Supabase deben configurarse como secrets:

1. Ve a **Settings > Secrets and variables > Actions**
2. Click en **New repository secret**
3. Agrega los siguientes secrets:

| Nombre | Valor | Dónde obtenerlo |
|--------|-------|-----------------|
| `VITE_SUPABASE_URL` | `https://tu-proyecto.supabase.co` | Supabase Dashboard > Settings > API > Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Supabase Dashboard > Settings > API > Project API keys > anon public |

**Pasos detallados:**

```
1. Click "New repository secret"
2. Name: VITE_SUPABASE_URL
3. Secret: https://pbuolrpiixuqegrqlxxp.supabase.co (tu URL)
4. Click "Add secret"

Repetir para VITE_SUPABASE_ANON_KEY
```

---

## 🚀 Despliegue Automático

Una vez configurado todo lo anterior, el despliegue es automático:

1. **Haz cambios en tu código**
2. **Haz commit y push a la rama `main`**:
   ```bash
   git add .
   git commit -m "Descripción de tus cambios"
   git push origin main
   ```
3. **GitHub Actions se ejecutará automáticamente** 🎉

### Monitorear el Despliegue

1. Ve a tu repositorio en GitHub
2. Click en la pestaña **Actions**
3. Verás el workflow "Deploy to GitHub Pages" ejecutándose
4. Click en él para ver el progreso en tiempo real
5. Cuando termine (✅ verde), tu sitio estará desplegado

**URL de tu aplicación en producción:**
```
https://paulvenci.github.io/bar-jordy/
```

---

## 🔄 Despliegue Manual (Opcional)

Si prefieres desplegar manualmente sin usar GitHub Actions:

### 1. Instalar gh-pages

```bash
cd frontend
npm install --save-dev gh-pages
```

### 2. Crear archivo .env local

Crea `frontend/.env` (no subir a Git):

```env
VITE_SUPABASE_URL=https://pbuolrpiixuqegrqlxxp.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aquí
```

### 3. Desplegar

```bash
cd frontend
npm run deploy
```

Este comando:
1. Ejecuta `npm run build` automáticamente
2. Despliega el contenido de `dist/` a la rama `gh-pages`
3. GitHub Pages lo publica automáticamente

---

## ⚙️ Configuración Post-Despliegue

### Configurar CORS en Supabase

**MUY IMPORTANTE:** Después del primer despliegue, debes permitir que tu sitio de GitHub Pages acceda a Supabase:

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com)
2. **Authentication > URL Configuration**
3. En **Site URL**, agrega:
   ```
   https://paulvenci.github.io/bar-jordy/
   ```
4. En **Redirect URLs**, agrega (si usas autenticación):
   ```
   https://paulvenci.github.io/bar-jordy/**
   ```
5. Click **Save**

Sin esto, la aplicación no podrá conectarse a Supabase desde producción.

---

## 🧪 Verificación Post-Despliegue

### Checklist de Verificación

- [ ] El sitio carga en https://paulvenci.github.io/bar-jordy/
- [ ] No hay errores en la consola del navegador (F12 > Console)
- [ ] Los estilos se aplican correctamente
- [ ] Las imágenes/assets se cargan
- [ ] La conexión a Supabase funciona
- [ ] Puedes navegar entre páginas
- [ ] El PWA se instala correctamente (opcional)

### Debugging

Si algo no funciona:

1. **Revisar la consola del navegador** (F12)
2. **Revisar el log de GitHub Actions** en la pestaña Actions
3. **Verificar que los Secrets están configurados** correctamente
4. **Confirmar la configuración CORS en Supabase**

---

## 🔄 Actualizar el Sitio

Para actualizar tu aplicación en producción:

```bash
# 1. Hacer cambios en el código
# 2. Commit
git add .
git commit -m "Descripción del cambio"

# 3. Push (esto activará el despliegue automático)
git push origin main
```

El workflow de GitHub Actions se ejecutará automáticamente y desplegará la nueva versión en ~2-3 minutos.

---

## 🐛 Troubleshooting

### Error: "Missing Supabase environment variables"

**Causa:** Los Secrets no están configurados en GitHub
**Solución:** Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` existen en Settings > Secrets

### Error: CORS en producción

**Causa:** Supabase no permite requests desde GitHub Pages
**Solución:** Agrega `https://paulvenci.github.io` a las URLs permitidas en Supabase

### Assets (CSS/JS) no cargan (404)

**Causa:** La ruta base no está configurada correctamente
**Solución:** Verifica que `vite.config.ts` tiene `base: '/bar-jordy/'`

### El sitio muestra 404

**Causa:** GitHub Pages no está habilitado o mal configurado
**Solución:** 
1. Settings > Pages > Source: **GitHub Actions**
2. Espera a que el workflow termine completamente

### Build falla en GitHub Actions

**Causa:** Errores de compilación o dependencias faltantes
**Solución:**
1. Revisa el log completo en Actions
2. Ejecuta `npm run build` localmente para ver el error
3. Corrige el error y haz push nuevamente

---

## 📝 Archivos Modificados

Los siguientes archivos fueron modificados/creados para el despliegue:

- ✅ `frontend/vite.config.ts` - Agregada configuración `base`
- ✅ `frontend/package.json` - Scripts de deploy
- ✅ `frontend/.env.example` - Plantilla de variables
- ✅ `.github/workflows/deploy.yml` - Workflow de GitHub Actions
- ✅ `DEPLOYMENT.md` - Esta guía

---

## 🎯 Resumen Rápido

1. **Primera vez:**
   - Subir código a GitHub
   - Configurar Secrets (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
   - Habilitar GitHub Pages (Source: GitHub Actions)
   - Configurar CORS en Supabase

2. **Cada actualización:**
   - Hacer cambios en el código
   - `git add . && git commit -m "mensaje"`
   - `git push origin main`
   - Esperar ~2-3 minutos
   - Visitar https://paulvenci.github.io/bar-jordy/

---

## 📚 Recursos Adicionales

- [Documentación de GitHub Pages](https://docs.github.com/en/pages)
- [Documentación de GitHub Actions](https://docs.github.com/en/actions)
- [Documentación de Vite](https://vitejs.dev/guide/static-deploy.html#github-pages)
- [Documentación de Supabase](https://supabase.com/docs)

---

**¿Problemas o preguntas?** Revisa la sección de Troubleshooting o consulta los logs de GitHub Actions.
