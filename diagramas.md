# Diagramas del Sistema - Bar Gordy

## 1. Diagrama de Flujo de Venta (POS)

```mermaid
flowchart TD
    Start([Inicio Nueva Venta]) --> Search[Buscar Producto<br/>por Código/Nombre]
    Search --> Found{¿Producto<br/>Encontrado?}
    Found -->|No| Search
    Found -->|Sí| Display[Mostrar Info Producto]
    Display --> QtyInput[Ingresar Cantidad]
    QtyInput --> CheckStock{¿Stock<br/>Disponible?}
    CheckStock -->|No| Alert[Alerta: Sin Stock]
    Alert --> Search
    CheckStock -->|Sí| AddCart[Agregar al Carrito]
    AddCart --> More{¿Agregar<br/>Más Productos?}
    More -->|Sí| Search
    More -->|No| ShowCart[Mostrar Carrito]
    ShowCart --> Review{¿Modificar<br/>Carrito?}
    Review -->|Cambiar Cantidad| ModQty[Modificar Cantidad]
    ModQty --> ShowCart
    Review -->|Eliminar Item| DelItem[Eliminar Producto]
    DelItem --> ShowCart
    Review -->|No| CalcTotal[Calcular Total<br/>+ IVA]
    CalcTotal --> SelectPayment[Seleccionar<br/>Método de Pago]
    SelectPayment --> Confirm{¿Confirmar<br/>Venta?}
    Confirm -->|No| ShowCart
    Confirm -->|Sí| ProcessSale[Procesar Venta]
    ProcessSale --> UpdateStock[Actualizar Stock]
    UpdateStock --> SaveSale[Guardar Venta<br/>en BD]
    SaveSale --> PrintTicket[Imprimir Ticket]
    PrintTicket --> End([Fin Venta])
```

---

## 2. Diagrama de Modelo de Datos (ERD)

```mermaid
erDiagram
    USUARIOS ||--o{ VENTAS : realiza
    USUARIOS ||--o{ MOVIMIENTOS_STOCK : registra
    
    PRODUCTOS ||--o{ ITEMS_VENTA : contiene
    PRODUCTOS ||--o{ MOVIMIENTOS_STOCK : tiene
    PRODUCTOS }o--|| CATEGORIAS : pertenece
    PRODUCTOS ||--o{ RECETAS : "es_compuesto"
    PRODUCTOS ||--o{ COMPONENTES_RECETA : "es_componente"
    
    RECETAS ||--o{ COMPONENTES_RECETA : tiene
    
    VENTAS ||--o{ ITEMS_VENTA : contiene
    
    USUARIOS {
        uuid id PK
        string nombre
        string email
        string password
        string rol
        boolean activo
        timestamp created_at
    }
    
    CATEGORIAS {
        uuid id PK
        string nombre
        string descripcion
    }
    
    PRODUCTOS {
        uuid id PK
        string nombre
        string codigo UK
        uuid categoria_id FK
        text descripcion
        string foto
        decimal valor_costo
        decimal valor_venta
        enum tipo_producto
        integer stock_actual
        integer stock_minimo
        boolean activo
        timestamp created_at
        timestamp updated_at
    }
    
    RECETAS {
        uuid id PK
        uuid producto_compuesto_id FK
        text instrucciones
    }
    
    COMPONENTES_RECETA {
        uuid id PK
        uuid receta_id FK
        uuid producto_simple_id FK
        decimal cantidad
        string unidad_medida
    }
    
    MOVIMIENTOS_STOCK {
        uuid id PK
        uuid producto_id FK
        enum tipo_movimiento
        integer cantidad
        decimal precio
        uuid referencia_id
        text observaciones
        uuid usuario_id FK
        timestamp fecha
    }
    
    VENTAS {
        uuid id PK
        integer numero UK
        timestamp fecha
        decimal subtotal
        decimal iva
        decimal total
        enum metodo_pago
        enum estado
        uuid usuario_id FK
    }
    
    ITEMS_VENTA {
        uuid id PK
        uuid venta_id FK
        uuid producto_id FK
        string nombre_producto
        integer cantidad
        decimal precio_unitario
        decimal subtotal
        decimal costo
    }
```

---

## 3. Diagrama de Arquitectura del Sistema

```mermaid
graph TB
    subgraph "Cliente / Frontend"
        UI[Interface de Usuario<br/>React + TypeScript]
        Store[Estado Global<br/>React Query]
        Router[Navegación<br/>React Router]
    end
    
    subgraph "Servidor / Backend"
        API[API REST<br/>Express + TypeScript]
        Auth[Autenticación<br/>JWT]
        Business[Lógica de Negocio]
        ORM[Prisma ORM]
    end
    
    subgraph "Base de Datos"
        DB[(PostgreSQL)]
    end
    
    subgraph "Servicios Externos"
        Print[Servicio de<br/>Impresión]
        Export[Exportación<br/>PDF/Excel]
    end
    
    UI --> Store
    Store --> Router
    Router --> API
    
    API --> Auth
    Auth --> Business
    Business --> ORM
    ORM --> DB
    
    Business --> Print
    Business --> Export
    
    style UI fill:#4CAF50
    style API fill:#2196F3
    style DB fill:#FF9800
```

---

## 4. Diagrama de Navegación del Sistema

```mermaid
graph LR
    Login[Login] --> Dashboard[Dashboard]
    Dashboard --> NuevaVenta[Nueva Venta/POS]
    Dashboard --> Productos[Gestión<br/>Productos]
    Dashboard --> Inventario[Gestión<br/>Inventario]
    Dashboard --> Reportes[Reportes]
    Dashboard --> Config[Configuración]
    
    Productos --> AddProd[Crear Producto]
    Productos --> EditProd[Editar Producto]
    Productos --> ViewProd[Ver Producto]
    Productos --> Categorias[Gestionar<br/>Categorías]
    
    Inventario --> Entrada[Entrada Stock]
    Inventario --> Ajuste[Ajuste Stock]
    Inventario --> Historial[Historial<br/>Movimientos]
    
    NuevaVenta --> Carrito[Carrito]
    Carrito --> Pago[Confirmar Pago]
    Pago --> Ticket[Ticket Venta]
    
    Reportes --> Ventas[Reporte Ventas]
    Reportes --> TopProductos[Top 10<br/>Productos]
    Reportes --> EstadoInv[Estado<br/>Inventario]
    
    Config --> General[Config General]
    Config --> Fiscal[Config Fiscal]
    Config --> Sistema[Config Sistema]
    
    style Dashboard fill:#FFD700
    style NuevaVenta fill:#4CAF50
    style Productos fill:#2196F3
    style Inventario fill:#FF9800
    style Reportes fill:#9C27B0
    style Config fill:#607D8B
```

---

## 5. Flujo de Cálculo de Costo para Producto Compuesto

```mermaid
flowchart TD
    Start([Crear/Editar<br/>Producto Compuesto]) --> SelectComponents[Seleccionar<br/>Componentes]
    SelectComponents --> AddComp{¿Agregar<br/>Componente?}
    AddComp -->|Sí| ChooseProduct[Elegir Producto<br/>Simple]
    ChooseProduct --> SetQty[Definir Cantidad<br/>y Unidad]
    SetQty --> CalcPartial[Calcular Costo<br/>Parcial]
    CalcPartial --> AddComp
    AddComp -->|No| CalcTotal[Calcular Costo Total]
    CalcTotal --> Formula["Costo = Σ(cantidad × costo_unitario)"]
    Formula --> Display[Mostrar Costo<br/>Calculado]
    Display --> SetPrice[Definir Precio<br/>de Venta]
    SetPrice --> Save[Guardar Producto]
    Save --> End([Fin])
    
    style CalcTotal fill:#4CAF50
    style Formula fill:#FF9800
```

---

## 6. Flujo de Actualización de Stock

```mermaid
sequenceDiagram
    participant U as Usuario
    participant POS as Sistema POS
    participant DB as Base de Datos
    participant INV as Sistema Inventario
    
    U->>POS: Finalizar Venta
    POS->>DB: Guardar Venta
    
    loop Por cada Item en Venta
        POS->>DB: Verificar Tipo Producto
        alt Producto Simple
            POS->>DB: Descontar Stock Directo
            DB-->>INV: stock_actual -= cantidad
        else Producto Compuesto
            POS->>DB: Obtener Receta
            loop Por cada Componente
                POS->>DB: Descontar Stock Componente
                DB-->>INV: stock_actual -= (cantidad × cant_receta)
            end
        end
        
        POS->>DB: Registrar Movimiento Stock
        
        POS->>DB: Verificar Stock Mínimo
        alt Stock < Stock Mínimo
            DB-->>POS: Generar Alerta
            POS-->>U: Notificar Stock Bajo
        end
    end
    
    POS-->>U: Venta Completada
```

---

## 7. Estructura de Carpetas del Proyecto

```
bar-gordy/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuración (DB, env)
│   │   ├── controllers/     # Controladores de rutas
│   │   ├── middlewares/     # Auth, validación
│   │   ├── models/          # Modelos de datos
│   │   ├── routes/          # Definición de rutas
│   │   ├── services/        # Lógica de negocio
│   │   ├── utils/           # Utilidades
│   │   └── index.ts         # Entry point
│   ├── prisma/
│   │   └── schema.prisma    # Schema de BD
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/          # Imágenes, iconos
│   │   ├── components/      # Componentes reutilizables
│   │   │   ├── common/      # Botones, inputs, etc.
│   │   │   ├── layout/      # Header, Sidebar
│   │   │   └── modules/     # Componentes por módulo
│   │   ├── pages/           # Páginas/Vistas
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── Inventory.tsx
│   │   │   ├── POS.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API calls
│   │   ├── store/           # Estado global
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Helpers
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                    # Documentación
│   ├── requerimiento.txt
│   ├── especificacion-tecnica.md
│   └── diagramas.md
│
├── docker-compose.yml       # Docker config
├── .gitignore
└── README.md
```
