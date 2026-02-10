# Guía Rápida - Panel CTD

## 🎯 ¿Qué es el Panel CTD?

El Panel CTD es una herramienta interna para comparar precios y analizar márgenes de ganancia en la cadena de distribución. Muestra tarjetas visuales tipo e-commerce con toda la información de precios y cálculos automáticos de márgenes.

## 🔗 ¿Cómo Acceder?

**URL Directa:** `https://oscararmando2.github.io/catalogo-mexiquense/CTD`

⚠️ **Importante:** No hay enlaces públicos a este panel. Solo se accede mediante la URL directa.

## 📊 ¿Qué Muestra Cada Tarjeta?

Cada tarjeta de producto muestra:

### 1. Información del Producto
- Imagen del producto
- Nombre/Descripción
- Código de barras
- Proveedor y tienda

### 2. Flujo de Precios
```
Cortes → Tienda:  $25.50
Cortes → CTD:     $23.00
CTD → Tienda:     $26.00
Venta Cliente:    $32.00
```

### 3. Márgenes Calculados
- **Margen CTD**: Ganancia del centro de distribución
- **Margen Tienda (vía CTD)**: Ganancia de la tienda
- **MARGEN GRUPO**: Ganancia total (destacado en colores)

### 4. Código de Colores

El **Margen Grupo** se muestra en colores para identificación rápida:

| Color | Significado | Rango |
|-------|-------------|-------|
| 🟢 **Verde** | Excelente ganancia | Más de $10.00 |
| 🟡 **Amarillo** | Ganancia baja | Entre $0.01 y $10.00 |
| 🔴 **Rojo** | Pérdida | $0.00 o negativo |

## ➕ ¿Cómo Agregar Productos?

### Paso 1: Abrir el Formulario
Haz clic en el botón verde **"Cargar Productos"** en la parte superior derecha.

### Paso 2: Llenar los Datos

**Información Básica:**
- **Descripción del Producto**: Nombre completo (ej: "Frijol Goya Negro 500g")
- **Código de Barras**: Código UPC/EAN del producto
- **URL de Imagen**: Enlace a la imagen del producto

**Configuración:**
- **Proveedor Origen**: Seleccionar "Cortes" u "Otro"
- **Tienda**: Seleccionar la tienda destino

**Precios (los 4 son obligatorios):**
- **Precio Cortes → Tienda**: Precio directo del proveedor a la tienda
- **Precio Cortes → CTD**: Precio del proveedor al centro de distribución
- **Precio CTD → Tienda**: Precio del CTD a la tienda
- **Precio Venta Cliente**: Precio final al cliente

### Paso 3: Guardar
Haz clic en **"Guardar Producto"**. El producto aparecerá inmediatamente en la pantalla.

## 📝 Ejemplo Práctico

Supongamos que queremos agregar "Arroz Morelos 1kg":

```
Descripción:           Arroz Morelos Premium 1kg
Código de Barras:      7501112223334
URL de Imagen:         [enlace a la imagen]
Proveedor:             Cortes
Tienda:                Mexiquense

Precio Cortes → Tienda:    $18.00
Precio Cortes → CTD:       $16.50
Precio CTD → Tienda:       $19.00
Precio Venta Cliente:      $24.00
```

**Resultado del cálculo automático:**
- Margen CTD: $19.00 - $16.50 = **$2.50**
- Margen Tienda vía CTD: $24.00 - $19.00 = **$5.00**
- **MARGEN GRUPO: $7.50** (se mostrará en amarillo)

## 🎨 Interpretación Visual

### Tarjeta Verde 🟢
```
[Imagen del producto]  [Badge: Margen: $15.00]

Frijol Goya Negro 500g
Código: 7501234567890
Cortes → Mexiquense

Cortes → Tienda:  $25.50
Cortes → CTD:     $23.00
CTD → Tienda:     $26.00
Venta Cliente:    $32.00

Margen CTD:              $3.00
Margen Tienda (vía CTD): $6.00
┌────────────────────────────┐
│ MARGEN GRUPO:      $9.00   │ <- Destacado en verde
└────────────────────────────┘
```

### Tarjeta Amarilla 🟡
Igual que la verde, pero el badge y el fondo del margen grupo son amarillos.
Indica que la ganancia es positiva pero baja (menos de $10).

### Tarjeta Roja 🔴
Igual estructura, pero en rojo.
**¡Alerta!** El producto está generando pérdidas.

## 🔧 Resolución de Problemas

### No veo productos
1. Verifica que hayas agregado productos mediante el botón "Cargar Productos"
2. Revisa la consola del navegador (F12) para ver errores
3. Confirma que Firebase esté configurado correctamente

### No puedo agregar productos
1. Verifica que todos los campos estén llenos
2. Los precios deben ser números positivos
3. La URL de la imagen debe ser válida (https://...)

### Las imágenes no cargan
- Verifica que la URL de la imagen sea correcta y accesible
- La imagen debe estar en formato compatible (JPG, PNG)

## 📱 Uso en Dispositivos Móviles

El panel es completamente responsivo:
- **Móvil**: 1 tarjeta por fila
- **Tablet**: 2 tarjetas por fila
- **Desktop**: 3-4 tarjetas por fila

## 💡 Consejos de Uso

### Para Análisis Rápido
1. Busca tarjetas rojas (pérdidas) para actuar inmediatamente
2. Revisa tarjetas amarillas para optimizar márgenes
3. Las tarjetas verdes indican productos rentables

### Para Toma de Decisiones
- Compara el Margen Grupo entre productos similares
- Identifica qué tiendas tienen mejores márgenes
- Analiza si conviene más vender directo o vía CTD

### Para Planificación
- Usa los datos para negociar con proveedores
- Ajusta precios de venta basándote en los márgenes
- Identifica oportunidades de mejora en la cadena

## 🔒 Seguridad y Privacidad

- Este panel es interno y no está vinculado al catálogo público
- Solo personas con la URL pueden acceder
- Los datos se guardan en Firebase en un nodo separado (`/CTD/products`)
- No afecta ni modifica el catálogo público

## 📚 Documentación Adicional

Para información técnica detallada, consulta:
- `README.md` - Documentación técnica completa
- `IMPLEMENTATION_SUMMARY.md` - Resumen de implementación
- `sample-data.json` - Ejemplos de estructura de datos

## 🆘 Soporte

Si tienes dudas o problemas:
1. Revisa esta guía primero
2. Consulta la consola del navegador (F12) para mensajes de error
3. Verifica que Firebase esté configurado correctamente
4. Confirma que el nodo `/CTD/products` existe en Firebase

---

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Última actualización:** 10/02/2026
