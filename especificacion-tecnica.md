# Especificación Técnica - Sistema de Gestión de Bar "Gordy"

## 1. Visión General del Sistema

Sistema web de gestión integral para bar que permite administrar inventario, productos, ventas y generar reportes de negocio.

---

## 2. Módulos del Sistema

### 2.1 Dashboard 📊

**Objetivo:** Proporcionar una vista rápida del estado del negocio

**Componentes:**

#### Indicadores KPI (Key Performance Indicators)
- **Total de Productos Activos**
  - Muestra cantidad total de productos en el sistema
  - Actualización en tiempo real
  
- **Productos con Stock Bajo** 
  - Muestra productos debajo del umbral configurado
  - Alerta visual (color rojo/amarillo)
  - Click para ver listado detallado
  
- **Ganancias del Día**
  - Cálculo: suma(precio_venta - precio_costo) de ventas de hoy
  - Formato moneda local (CLP)
  - Comparación con día anterior (%)
  
- **Cantidad de Ventas del Día**
  - Contador de transacciones completadas
  - Comparación con día anterior

#### Acceso Rápido
Botones de navegación directa:
- Nueva Venta → Módulo POS
- Gestionar Productos → CRUD Productos
- Entrada de Stock → Gestión Inventario
- Ver Reportes → Módulo Reportes

---

### 2.2 Gestión de Productos 🍺

**Objetivo:** Administrar catálogo de productos y recetas

**Modelo de Datos - Producto:**

```typescript
interface Producto {
  id: string
  nombre: string                    // OBLIGATORIO
  codigo: string                    // OBLIGATORIO, único
  categoria?: Categoria             // OPCIONAL
  descripcion?: string              // OPCIONAL
  foto?: string                     // OPCIONAL, URL o base64
  valorCosto: number                // OBLIGATORIO
  valorVenta: number                // OBLIGATORIO
  tipoProducto: TipoProducto        // OBLIGATORIO
  activo: boolean
  stockActual: number
  stockMinimo: number
  fechaCreacion: Date
  fechaActualizacion: Date
}

enum TipoProducto {
  SIMPLE = "SIMPLE",
  COMPUESTO = "COMPUESTO"
}

interface Categoria {
  id: string
  nombre: string                    // Ej: "Bebidas", "Jugos", "Con Alcohol"
  descripcion?: string
}
```

**Producto SIMPLE:**
- Representa un ítem individual del inventario
- Ejemplo: Botella Coca-Cola 350cc
- Stock se descuenta directamente de inventario

**Producto COMPUESTO:**
- Se compone de 2 o más productos simples
- Ejemplo: Piscola = 500ml Coca-Cola + 150ml Pisco
- **Cálculo de Costo:** proporcional a componentes
  ```
  Costo Total = Σ(cantidad_componente × costo_unitario_componente)
  ```
- Stock se descuenta automáticamente de cada componente

**Modelo de Datos - Receta (para Compuestos):**

```typescript
interface Receta {
  productoCompuestoId: string
  componentes: ComponenteReceta[]
}

interface ComponenteReceta {
  productoSimpleId: string
  cantidad: number
  unidadMedida: string              // "ml", "gr", "unidades"
}
```

**Funcionalidades:**
- ✅ Crear/Editar/Eliminar productos
- ✅ Búsqueda por nombre/código
- ✅ Filtrado por categoría
- ✅ Carga masiva de productos (CSV)
- ✅ Visualización en tabla con paginación
- ✅ Vista detalle de producto
- ✅ Gestión de categorías

---

### 2.3 Gestión de Inventario/Stock 📦

**Objetivo:** Controlar entradas y salidas de inventario

**Operaciones:**

#### Entrada de Stock
```typescript
interface EntradaStock {
  id: string
  productoId: string
  cantidad: number
  precioCompra: number
  proveedor?: string
  fechaEntrada: Date
  observaciones?: string
  usuarioId: string
}
```

#### Ajuste de Stock
- Corrección manual de inventario
- Registro de motivo (merma, robo, error)
- Historial de ajustes

#### Alertas Automáticas
- Notificación cuando stock < stockMinimo
- Reporte de productos sin stock
- Predicción de reorden (basado en ventas promedio)

**Funcionalidades:**
- ✅ Registrar entrada de stock
- ✅ Ajustar inventario manualmente
- ✅ Ver historial de movimientos
- ✅ Exportar reporte de inventario
- ✅ Configurar alertas de stock bajo

---

### 2.4 Punto de Venta (POS) 💰

**Objetivo:** Registrar ventas de manera rápida y eficiente

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  PANEL IZQUIERDO         │  PANEL DERECHO          │
│  (Búsqueda/Agregar)      │  (Carrito de Compra)    │
├──────────────────────────┼─────────────────────────┤
│  Código/Nombre: [____]   │  PRODUCTOS EN VENTA     │
│  Descripción: _______    │  ┌──────────────────┐   │
│  Cantidad: [__]          │  │ Coca-Cola 350    │   │
│  Valor Unit: $____       │  │ Cant: 2  $1000   │   │
│  [Agregar Producto]      │  │ [- Cambiar] [X]  │   │
│                          │  └──────────────────┘   │
│                          │                         │
│                          │  TOTAL: $2000           │
│                          │  [Finalizar Venta]      │
└──────────────────────────┴─────────────────────────┘
```

**Modelo de Datos:**

```typescript
interface Venta {
  id: string
  numero: number                    // Número correlativo
  fecha: Date
  items: ItemVenta[]
  subtotal: number
  iva: number                       // Calculado según config
  total: number
  metodoPago: MetodoPago
  estado: EstadoVenta
  usuarioId: string
}

interface ItemVenta {
  productoId: string
  nombreProducto: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  costo: number                     // Para calcular ganancia
}

enum MetodoPago {
  EFECTIVO = "EFECTIVO",
  TARJETA = "TARJETA",
  TRANSFERENCIA = "TRANSFERENCIA"
}

enum EstadoVenta {
  COMPLETADA = "COMPLETADA",
  CANCELADA = "CANCELADA"
}
```

**Flujo de Venta:**
1. Buscar producto por código/nombre (autocompletado)
2. Seleccionar producto → campos se auto-completan
3. Ingresar cantidad
4. Agregar al carrito
5. Modificar cantidad o eliminar items del carrito
6. Finalizar venta → seleccionar método de pago
7. Descontar stock automáticamente
8. Generar comprobante/ticket

**Funcionalidades:**
- ✅ Búsqueda rápida de productos (lectura código barras)
- ✅ Auto-completado de productos
- ✅ Modificación de carrito en tiempo real
- ✅ Cálculo automático de totales e IVA
- ✅ Múltiples métodos de pago
- ✅ Impresión de ticket
- ✅ Atajo de teclado para operaciones rápidas

---

### 2.5 Reportes 📈

**Objetivo:** Generar insights del negocio mediante análisis de datos

**Reportes Disponibles:**

#### 1. Reporte de Ventas por Período
- Última semana (día por día)
- Mes actual (día por día)
- Año actual (mes por mes)
- Período personalizado

**Datos mostrados:**
- Total ventas
- Cantidad de transacciones
- Ticket promedio
- Ganancias netas

#### 2. Top 10 Productos Más Vendidos
- Ranking por cantidad vendida
- Ranking por ingresos generados
- Período seleccionable

#### 3. Análisis de Inventario
- Productos con mayor rotación
- Productos con menor rotación
- Valor total del inventario
- Mermas y pérdidas

#### 4. Gráficos Visuales
```typescript
interface Grafico {
  tipo: "linea" | "barras" | "torta"
  datos: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
    }[]
  }
}
```

**Tipos de gráficos:**
- 📊 Ventas diarias/mensuales (línea)
- 📊 Comparativo de productos (barras)
- 📊 Distribución por categoría (torta)
- 📊 Evolución de ganancias (área)

**Funcionalidades:**
- ✅ Filtros por fecha
- ✅ Exportar a PDF/Excel
- ✅ Visualizaciones interactivas
- ✅ Comparación entre períodos

---

### 2.6 Configuración ⚙️

**Objetivo:** Ajustar parámetros del sistema

**Parámetros Configurables:**

```typescript
interface Configuracion {
  general: {
    nombreNegocio: string
    direccion: string
    telefono: string
    email: string
  }
  
  fiscal: {
    porcentajeIVA: number           // Default: 19% (Chile)
    razonSocial?: string
    rut?: string
  }
  
  inventario: {
    stockMinimoPorDefecto: number   // Default: 5
    alertaStockBajo: boolean
    emailAlertas?: string
  }
  
  ventas: {
    impresionAutomaticaTicket: boolean
    formatoTicket: "simple" | "detallado"
    permitirVentaSinStock: boolean
  }
  
  moneda: {
    simbolo: string                 // Default: "$"
    codigo: string                  // Default: "CLP"
  }
}
```

**Parámetros Propuestos Adicionales:**
- 🔧 Horario de apertura/cierre del negocio
- 🔧 Días de operación
- 🔧 Límite de descuento permitido
- 🔧 Backup automático de base de datos
- 🔧 Idioma del sistema
- 🔧 Zona horaria
- 🔧 Formato de fecha/hora
- 🔧 Número de decimales en precios

**Funcionalidades:**
- ✅ Guardar configuración
- ✅ Cancelar cambios
- ✅ Restaurar valores por defecto
- ✅ Validación de datos
- ✅ Backup antes de guardar

---

## 3. Requisitos No Funcionales

### 3.1 Performance
- Tiempo de carga inicial < 3 segundos
- Búsqueda de productos < 500ms
- Registro de venta < 1 segundo

### 3.2 Seguridad
- Autenticación de usuarios
- Encriptación de contraseñas
- Logs de auditoría de operaciones críticas
- Backup automático diario

### 3.3 Usabilidad
- Interfaz intuitiva, responsive
- Soporte para pantallas táctiles (POS)
- Atajos de teclado
- Modo oscuro/claro

### 3.4 Escalabilidad
- Soporte para múltiples usuarios simultáneos
- Base de datos optimizada para alto volumen
- Posibilidad de agregar múltiples sucursales

---

## 4. Stack Tecnológico Propuesto

**Frontend:**
- Vue 3 + TypeScript (Composition API)
- Vite (build tool ultra-rápido)
- TailwindCSS para estilos
- Chart.js / Vue-ChartJS para gráficos
- Pinia para manejo de estado
- Vue Router para navegación
- VeeValidate para validación de formularios

**Backend (BaaS - Backend as a Service):**
- **Supabase** (plataforma todo-en-uno)
  - PostgreSQL (base de datos relacional)
  - PostgREST (API REST automática)
  - Auth (autenticación opcional para futuro)
  - Storage (almacenamiento de imágenes)
  - Edge Functions (funciones serverless cuando necesario)
  - Realtime (actualizaciones en tiempo real)

**Ventajas de Supabase:**
- ✅ Sin servidor que mantener
- ✅ Versión gratuita generosa (500MB DB, 2GB storage)
- ✅ Escalable (upgrade simple cuando crezcas)
- ✅ PostgreSQL real (relaciones, triggers, funciones)
- ✅ Dashboard visual para administrar datos
- ✅ Backups automáticos
- ✅ API automática generada desde esquema

**Herramientas:**
- ESLint + Prettier
- Git para control de versiones
- Supabase CLI (migraciones locales)

---

## 5. Modelo de Base de Datos

### Tablas Principales:

1. **usuarios**
   - id, nombre, email, password, rol, activo

2. **productos**
   - id, nombre, codigo, categoria_id, descripcion, foto, valor_costo, valor_venta, tipo_producto, stock_actual, stock_minimo, activo

3. **categorias**
   - id, nombre, descripcion

4. **recetas** (para productos compuestos)
   - id, producto_compuesto_id

5. **componentes_receta**
   - id, receta_id, producto_simple_id, cantidad, unidad_medida

6. **movimientos_stock**
   - id, producto_id, tipo_movimiento, cantidad, precio, referencia_id, fecha, usuario_id

7. **ventas**
   - id, numero, fecha, subtotal, iva, total, metodo_pago, estado, usuario_id

8. **items_venta**
   - id, venta_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal, costo

9. **configuracion**
   - clave, valor, tipo_dato, descripcion

---

## 6. Próximos Pasos

1. ✅ Validar especificación técnica con usuario
2. ⏳ Crear mockups/diseño UI
3. ⏳ Configurar proyecto base
4. ⏳ Implementar módulos por prioridad:
   - Dashboard (simple)
   - Gestión de Productos
   - POS
   - Inventario
   - Reportes
   - Configuración

---

## 7. Preguntas Pendientes

> [!IMPORTANT]
> **Preguntas para el usuario:**
> 
> 1. ¿Necesitas soporte para múltiples usuarios/empleados con diferentes roles (admin, cajero)?
> 2. ¿El sistema debe funcionar offline o siempre tendrás conexión a internet?
> 3. ¿Necesitas integración con algún sistema de facturación electrónica (SII Chile)?
> 4. ¿Qué tipo de impresora de tickets tienes? (térmica, láser, etc.)
> 5. ¿Necesitas control de mesas/pedidos o solo venta directa en barra?
> 6. ¿El inventario incluye productos perecibles con fecha de vencimiento?
> 7. ¿Necesitas gestión de proveedores y órdenes de compra?
