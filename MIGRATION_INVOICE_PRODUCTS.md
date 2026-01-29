# Migración de Productos - Separación de Facturas y Catálogo

## Resumen de Cambios

Se han separado los productos de facturas y catálogo para que cada sección tenga su propia base de datos:

### Antes (❌ Problema):
- **Catálogo (index.html)**: `database.ref('products')` → Productos del catálogo con URLs de imágenes
- **Facturas (factura.html)**: `database.ref('products')` → **MISMO** que catálogo (PROBLEMA)

### Después (✅ Solución):
- **Catálogo (index.html)**: `database.ref('products')` → Productos del catálogo con URLs de imágenes
- **Facturas (factura.html)**: `database.ref('invoiceProducts')` → **SEPARADO** solo productos de facturas

## Estado Actual

Después de los cambios:

1. ✅ **factura.html** ahora usa `database.ref('invoiceProducts')` y `localStorage.getItem('invoiceProducts')`
2. ✅ **index.html/script.js** continúan usando `database.ref('products')` y `localStorage.getItem('products')`
3. ✅ Las dos secciones están completamente separadas

## Migración de Datos

### Opción A: Limpiar y Empezar de Nuevo (Recomendado si tienes backup)

Si tienes un backup de tus productos originales de facturas:

1. Abre la consola de Firebase: https://console.firebase.google.com
2. Ve a tu proyecto → Realtime Database
3. Encuentra el nodo `products` (productos del catálogo)
4. Crea un nuevo nodo `invoiceProducts` al mismo nivel
5. Importa/agrega manualmente los productos que deben estar en facturas

### Opción B: Filtrar Productos Existentes

Si quieres separar los productos existentes en `products` entre catálogo y facturas:

**Criterio sugerido**: Los productos con URL de imagen (`imageUrl` o `catalogoUrl`) son del catálogo, los demás son de facturas.

Puedes usar la consola del navegador:

```javascript
// 1. Cargar productos actuales
const currentProducts = JSON.parse(localStorage.getItem('products') || '[]');

// 2. Separar productos
const catalogProducts = currentProducts.filter(p => p.imageUrl || p.catalogoUrl);
const invoiceProducts = currentProducts.filter(p => !p.imageUrl && !p.catalogoUrl);

// 3. Guardar en los nuevos lugares
localStorage.setItem('products', JSON.stringify(catalogProducts));
localStorage.setItem('invoiceProducts', JSON.stringify(invoiceProducts));

console.log('Catálogo:', catalogProducts.length, 'productos');
console.log('Facturas:', invoiceProducts.length, 'productos');
```

### Opción C: Mantener Todo en Facturas Temporalmente

Si prefieres conservar todos los productos en facturas hasta que decidas qué hacer:

1. En Firebase Console, copia el nodo `products` completo
2. Pega el contenido en un nuevo nodo `invoiceProducts`
3. Luego puedes limpiar los productos que no necesites

## Verificación

Para verificar que todo funciona correctamente:

1. **Abre index.html** (catálogo):
   - Presiona F12 → Consola
   - Deberías ver: "Products loaded from localStorage: X products"
   - Verifica que solo muestre productos del catálogo

2. **Abre factura.html** (facturas):
   - Presiona F12 → Consola
   - Deberías ver: "Products loaded from localStorage: Y products"
   - Verifica que solo muestre productos de facturas

## Firebase Console

Para gestionar productos en Firebase:

1. Ve a: https://console.firebase.google.com
2. Selecciona proyecto: "catalogomexiquense"
3. Click en "Realtime Database"
4. Verás dos nodos:
   - `products` → Para catálogo (index.html)
   - `invoiceProducts` → Para facturas (factura.html)

## Estructura de Datos

### Productos de Catálogo (`products`):
```json
[
  {
    "nombre": "Producto Ejemplo",
    "upc": "123456",
    "costo": 10.50,
    "imageUrl": "https://ejemplo.com/imagen.jpg",
    "proveedor": "Proveedor"
  }
]
```

### Productos de Facturas (`invoiceProducts`):
```json
[
  {
    "nombre": "Producto Factura",
    "upc": "789012",
    "costo": 15.00,
    "proveedor": "Proveedor"
  }
]
```

## Notas Importantes

1. **No se perderán datos**: Los productos originales en `products` siguen ahí
2. **Migración manual**: Necesitas decidir qué productos van en cada sección
3. **Backup**: Siempre haz backup antes de mover/eliminar productos
4. **localStorage**: Se limpió automáticamente al migrar de `factura_products` a `invoiceProducts`

## Soporte

Si necesitas ayuda:
1. Revisa los logs de la consola del navegador (F12)
2. Verifica Firebase Console para ver los nodos de datos
3. Abre un issue con capturas de pantalla de los errores
