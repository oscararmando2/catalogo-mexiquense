# CTD - Panel de Comparación de Precios

## Descripción

Panel interno para comparación de precios y márgenes de ganancia. Este panel muestra tarjetas estilo e-commerce con información detallada de productos y cálculos automáticos de márgenes.

## Acceso

- **URL:** `https://oscararmando2.github.io/catalogo-mexiquense/CTD`
- **Tipo:** Acceso directo por URL (no hay enlaces en la UI pública)
- **Propósito:** Panel interno para análisis de precios y márgenes

## Características

### Visualización de Productos
- Tarjetas estilo e-commerce (reutilizando estilos del catálogo público)
- Imagen del producto
- Descripción y código de barras
- Información de proveedor y tienda

### Comparación de Precios
Cada tarjeta muestra el flujo completo de precios:
- **Cortes → Tienda**: Precio directo del proveedor a la tienda
- **Cortes → CTD**: Precio del proveedor al centro de distribución
- **CTD → Tienda**: Precio del CTD a la tienda
- **Venta Cliente**: Precio final al cliente

### Cálculo de Márgenes

El sistema calcula automáticamente:

1. **Margen Tienda Directo** = `precio_venta_cliente - precio_cortes_tienda`
2. **Margen CTD** = `precio_ctd_tienda - precio_cortes_ctd`
3. **Margen Tienda vía CTD** = `precio_venta_cliente - precio_ctd_tienda`
4. **Margen Grupo** = `Margen CTD + Margen Tienda vía CTD`

### Código de Colores

El **Margen Grupo** se muestra con colores distintivos:
- 🟢 **Verde**: Margen > $10 (excelente)
- 🟡 **Amarillo**: Margen > $0 y ≤ $10 (bajo pero positivo)
- 🔴 **Rojo**: Margen ≤ $0 (negativo, pérdida)

## Carga de Productos

### Método 1: Interfaz Web (Recomendado)

1. Acceder a `/CTD`
2. Hacer clic en el botón **"Cargar Productos"**
3. Llenar el formulario con:
   - Descripción del producto
   - Código de barras
   - URL de la imagen
   - Proveedor origen (Cortes u Otro)
   - Tienda destino
   - Los 4 precios requeridos
4. Hacer clic en **"Guardar Producto"**

### Método 2: Firebase Console (Avanzado)

1. Ir a Firebase Console
2. Navegar a Realtime Database
3. Ir al nodo `/CTD/products`
4. Agregar productos manualmente con la siguiente estructura:

```json
{
  "CTD": {
    "products": {
      "-NxxxxxxxxxXXXX": {
        "description": "Frijol Goya 500g",
        "barcode": "7501234567890",
        "image_url": "https://example.com/frijol.jpg",
        "proveedor_origen": "Cortes",
        "tienda": "Mexiquense",
        "precio_cortes_tienda": 25.50,
        "precio_cortes_ctd": 23.00,
        "precio_ctd_tienda": 26.00,
        "precio_venta_cliente": 32.00
      }
    }
  }
}
```

## Estructura de Datos

Cada producto debe tener los siguientes campos:

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `description` | string | Nombre del producto | "Frijol Goya 500g" |
| `barcode` | string | Código de barras | "7501234567890" |
| `image_url` | string | URL de la imagen | "https://..." |
| `proveedor_origen` | string | Nombre del proveedor | "Cortes" |
| `tienda` | string | Nombre de la tienda | "Mexiquense" |
| `precio_cortes_tienda` | number | Precio Cortes → Tienda | 25.50 |
| `precio_cortes_ctd` | number | Precio Cortes → CTD | 23.00 |
| `precio_ctd_tienda` | number | Precio CTD → Tienda | 26.00 |
| `precio_venta_cliente` | number | Precio venta al público | 32.00 |

## Ejemplo de Producto

```json
{
  "description": "Arroz Morelos 1kg",
  "barcode": "7501112223334",
  "image_url": "https://example.com/arroz.jpg",
  "proveedor_origen": "Cortes",
  "tienda": "Mexiquense",
  "precio_cortes_tienda": 18.00,
  "precio_cortes_ctd": 16.50,
  "precio_ctd_tienda": 19.00,
  "precio_venta_cliente": 24.00
}
```

**Márgenes calculados para este ejemplo:**
- Margen CTD: $19.00 - $16.50 = $2.50
- Margen Tienda vía CTD: $24.00 - $19.00 = $5.00
- **Margen Grupo: $2.50 + $5.00 = $7.50** (🟡 Amarillo)

## Archivos del Proyecto

```
/CTD/
├── index.html    # Interfaz HTML principal
├── script.js     # Lógica JavaScript y Firebase
└── README.md     # Esta documentación
```

## Tecnologías

- **JavaScript Puro** (sin frameworks)
- **Firebase Realtime Database** (lectura/escritura)
- **Tailwind CSS** (estilos)
- **CSS Global** (reutilizado de `../styles.css`)

## Notas Técnicas

### Firebase
- Usa la misma configuración que el catálogo principal
- Nodo independiente: `/CTD/products`
- Listeners en tiempo real para actualizaciones automáticas

### Compatibilidad
- Compatible con GitHub Pages
- Funciona en dispositivos móviles y desktop
- No requiere compilación ni build

### Seguridad
- Solo lectura/escritura en el nodo `/CTD/products`
- No modifica el catálogo público
- Sanitización de inputs para prevenir XSS

## Restricciones

✅ **SÍ permitido:**
- Agregar productos a `/CTD/products`
- Leer productos desde `/CTD/products`
- Acceso directo por URL

❌ **NO permitido:**
- Modificar archivos fuera de `/CTD`
- Agregar enlaces en navbar/menú/footer
- Modificar catálogo público
- Modificar configuración de Firebase

## Mantenimiento

Para agregar nuevos productos:
1. Usar el botón "Cargar Productos" en la interfaz
2. O agregar manualmente en Firebase Console

Para modificar un producto existente:
1. Ir a Firebase Console
2. Navegar a `/CTD/products`
3. Editar el producto específico

Para eliminar un producto:
1. Ir a Firebase Console
2. Navegar a `/CTD/products`
3. Eliminar el producto específico

## Soporte

Para problemas o dudas:
- Revisar la consola del navegador (F12) para errores
- Verificar que Firebase esté configurado correctamente
- Confirmar que el nodo `/CTD/products` existe en Firebase
