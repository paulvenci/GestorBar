# Preguntas Pendientes y Aclaraciones - Sistema Bar Gordy

## Preguntas Técnicas Importantes

### 1. Autenticación y Usuarios
**Pregunta:** ¿Necesitas que el sistema soporte múltiples usuarios con diferentes roles?

**Opciones:**
- ✅ **Sí, con roles**: Admin (acceso completo), Cajero (solo POS y reportes básicos), Inventario (solo gestión de stock)
- ⚪ **No, usuario único**: Una sola cuenta sin login

**Impacto:** Si es multi-usuario, se necesita:
- Sistema de login/logout
- Permisos por módulo
- Registro de quién hizo cada operación (auditoría)
Respuesta: No (posteriormente se pueda incorporar si es necesario)
---

### 2. Funcionamiento Offline
**Pregunta:** ¿El sistema necesita funcionar sin conexión a internet?

**Opciones:**
- ✅ **Solo online**: Requiere internet siempre (más fácil de implementar)
- ⚪ **Offline-first**: Funciona sin internet y sincroniza después (complejo)

**Impacto:** Modo offline requiere:
- Base de datos local (IndexedDB)
- Cola de sincronización
- Manejo de conflictos
- Mayor complejidad técnica

**Recomendación:** Empezar con versión online, evaluar offline en fase 2 si es necesario
Respuesta: No (posteriormente se pueda incorporar si es necesario)
---

### 3. Facturación Electrónica (SII Chile)
**Pregunta:** ¿Necesitas generar boletas o facturas electrónicas oficiales del SII?

**Opciones:**
- ✅ **Sí**: Integración con SII para facturación electrónica
- ⚪ **No**: Solo tickets/comprobantes internos (sin valor tributario)

**Impacto:** Integración con SII requiere:
- Certificado digital
- Servicio de firma electrónica
- Validación de formato XML
- Mayor tiempo de desarrollo (2-3 semanas adicionales)

**Alternativa:** Usar servicio de terceros (ej: Defontana, Bsale, Siempre Conectado)
Respuesta: No (posteriormente se pueda incorporar si es necesario)   
---
    
### 4. Tipo de Impresora
**Pregunta:** ¿Qué tipo de impresora usarás para los tickets de venta?

**Opciones:**
- ⚪ **Impresora térmica de tickets** (ej: Epson TM-T20, Star TSP100)
  - Requiere driver ESC/POS
  - Impresión directa desde navegador (complejo)
- ⚪ **Impresora láser/inkjet estándar**
  - Imprimir PDFs generados
- ✅ **Sin impresora física** (solo generar PDF para descargar/email)

**Recomendación:** Empezar con generación de PDF, agregar soporte térmico si es necesario
Respuesta: Sin impresora física (solo generar PDF para descargar/email)
---

### 5. Gestión de Mesas y Pedidos
**Pregunta:** ¿El bar tiene mesas y necesitas gestionar pedidos por mesa?

**Escenarios:**
- ⚪ **Solo barra**: Venta directa, cliente paga inmediatamente
- ✅ **Con mesas**: Cliente pide, se lleva cuenta, paga al final

**Impacto:** Sistema de mesas requiere:
- Modelo de Mesa (número, estado: libre/ocupada)
- Modelo de Pedido (separado de Venta)
- Vista de mesas con estado visual
- Transferencia de consumos entre mesas
- Propinas y división de cuenta
Respuesta: Solo barra (venta directa, cliente paga inmediatamente)
---

### 6. Productos Perecibles
**Pregunta:** ¿Vendes productos con fecha de vencimiento?

**Ejemplos:**
- Alimentos (sándwiches, frutas)
- Lácteos
- Algunos licores importados

**Opciones:**
- ✅ **Sí**: Necesitas campo fecha_vencimiento
- ⚪ **No**: Solo bebidas/licores sin vencimiento

**Impacto:** Si hay perecibles:
- Campo fecha_vencimiento en MovimientoStock
- Alerta de productos próximos a vencer
- Sistema FIFO (First In, First Out) para rotación
Respuesta: No
---

### 7. Gestión de Proveedores
**Pregunta:** ¿Necesitas llevar registro de proveedores y órdenes de compra?

**Funcionalidades:**
- Catálogo de proveedores (nombre, contacto, productos que suministra)
- Generar órdenes de compra
- Comparar precios entre proveedores
- Historial de compras por proveedor

**Opciones:**
- ✅ **Sí**: Módulo completo de proveedores
- ⚪ **Básico**: Solo campo "proveedor" en entrada de stock
- ⚪ **No**: Sin gestión de proveedores
Respuesta: No
---

## Preguntas de Negocio

### 8. Unidades de Medida
**Pregunta:** ¿Qué unidades de medida usarás?

**Ejemplos comunes:**
- Líquidos: ml, litros
- Sólidos: gramos, kilos
- Unidades: botellas, latas, paquetes

**Necesitas:** Lista predefinida de unidades o campo libre de texto?
Respuesta: Lista cc o ml

---

### 9. Descuentos y Promociones
**Pregunta:** ¿Necesitas aplicar descuentos en las ventas?

**Tipos:**
- Descuento por producto (%)
- Descuento al total de la venta
- Promociones 2×1, 3×2
- Happy hour (precios especiales por horario)
Respuesta: No

---

### 10. Métodos de Pago Adicionales
**Pregunta:** Además de Efectivo, Tarjeta y Transferencia, ¿usas otros métodos?

**Ejemplos:**
- Mercado Pago / PayPal
- Junaeb (tarjeta de alimentación)
- Sodexo
- Crédito a clientes conocidos
Respuesta: Crédito a clientes conocidos (posteriormente se pueda incorporar si es necesario)
---

### 11. Reportes Específicos
**Pregunta:** ¿Hay reportes específicos que necesites?

**Ejemplos propuestos:**
- Cierre de caja diario
- Comparación mes actual vs mes anterior
- Rentabilidad por producto
- Productos sin rotación (no se venden hace X días)
Respuesta: Comparación mes actual vs mes anterior, Productos sin rotación (no se venden hace X días)
   
---

### 12. Idioma y Moneda
**Pregunta:** ¿El sistema está solo en español y pesos chilenos (CLP)?

**Consideraciones:**
- Internacionalización futura?
- Soporte multi-moneda?

**Asumido:** Español y CLP únicamente
Respuesta: Español y CLP únicamente 
---

## Decisiones de Diseño

### 13. Colores y Branding
**Pregunta:** ¿Tienes logo o paleta de colores del bar?

**Opciones:**
- ✅ Proporcionar logo + colores → UI personalizada
- ⚪ Sin branding → Diseño genérico elegante
Respuesta: Sin branding → Diseño genérico elegante  
---

### 14. Nivel de Complejidad Visual
**Pregunta:** ¿Prefieres interfaz minimalista o con gráficos/animaciones?

**Opciones:**
- ⚪ **Minimalista**: Rápida, funcional, sin distracciones
- ✅ **Moderna**: Gráficos, transiciones suaves, visualmente atractiva
- ⚪ **Premium**: Animaciones, micro-interacciones, wow factor
Respuesta: Moderna  
---

## Planificación de Fases

### Propuesta de MVP (Minimum Viable Product)

**Fase 1 - MVP (4-6 semanas):**
- ✅ Dashboard básico con KPIs
- ✅ Gestión de productos (simple y compuesto)
- ✅ Gestión de inventario (entradas, ajustes)
- ✅ POS completo
- ✅ Reportes básicos (ventas, top productos)
- ✅ Configuración esencial (IVA, stocks mínimos)

**Fase 2 - Mejoras (2-3 semanas):**
- ⚪ Sistema de usuarios/roles
- ⚪ Reportes avanzados
- ⚪ Exportación a Excel
- ⚪ Gestión de proveedores
- ⚪ Productos perecibles

**Fase 3 - Integraciones (según necesidad):**
- ⚪ Facturación electrónica SII
- ⚪ Impresión térmica
- ⚪ Modo offline
- ⚪ App móvil (iOS/Android)

---

## Resumen de Decisiones Recomendadas

Para empezar rápido con un MVP funcional, recomiendo:

| Aspecto | Decisión Recomendada | Justificación |
|---------|---------------------|---------------|
| **Autenticación** | Usuario único sin login (fase 1) | Simplifica desarrollo inicial |
| **Offline** | Solo online | Menor complejidad |
| **Facturación SII** | No (solo tickets PDF) | Evita burocracia inicial |
| **Impresora** | Generar PDF | Compatible con cualquier impresora |
| **Mesas** | No (solo venta directa) | Reduce scope inicial |
| **Perecibles** | No | Simplifica inventario |
| **Proveedores** | Campo básico en entrada stock | Suficiente para empezar |
| **Diseño** | Moderno y atractivo | Buena experiencia usuario |

---

## Próximos Pasos

1. **Usuario responde preguntas críticas** (preguntas 1-7)
2. **Ajustar especificación técnica** según respuestas
3. **Iniciar desarrollo del MVP**
4. **Iteraciones según feedback**

---

## Contacto y Feedback

Si tienes dudas adicionales o quieres modificar alguna especificación, podemos:
- Actualizar `especificacion-tecnica.md`
- Crear documentos adicionales (ej: `casos-de-uso.md`, `manual-usuario.md`)
- Ajustar el plan de implementación
