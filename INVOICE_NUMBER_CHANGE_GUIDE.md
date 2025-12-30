# Guía para Cambiar el Número de Factura

## Problema Resuelto
Se agregó una funcionalidad para cambiar el número de factura actual. Ahora puedes cambiar de la factura #35 a la factura #30 (o cualquier otro número que necesites).

## Cómo Usar la Funcionalidad

### Paso 1: Abrir el Sistema de Facturación
1. Abre el archivo `factura.html` en tu navegador
2. Verás el sistema de facturación con el número de factura actual

### Paso 2: Cambiar el Número de Factura
1. Busca el botón **"Cambiar # Factura"** en la barra de acciones (junto a los botones de "Productos", "Descargar PDF", etc.)
2. Haz clic en el botón **"Cambiar # Factura"**
3. Se abrirá un modal con el número de factura actual

### Paso 3: Ingresar el Nuevo Número
1. Verás un campo de texto con el número actual
2. Borra el número actual e ingresa el nuevo número (ejemplo: 30)
3. Haz clic en el botón **"Cambiar Número"**

### Paso 4: Confirmar el Cambio
1. Verás un mensaje de confirmación: "Número de factura cambiado a #30"
2. El encabezado de la factura se actualizará automáticamente con el nuevo número
3. El nuevo número se guardará en el navegador (localStorage)

## Características

### Persistencia
- El número de factura se guarda automáticamente en el navegador
- El número persiste incluso si cierras la página
- La próxima vez que crees una nueva factura, el número se incrementará automáticamente

### Validación
- Solo se permiten números enteros positivos (1, 2, 3, ...)
- No se permiten números negativos o cero
- Si ingresas un valor inválido, verás un mensaje de error

### Ejemplo de Uso
**Situación:** Estás en la factura #35 y necesitas regresar a la factura #30

**Pasos:**
1. Haz clic en "Cambiar # Factura"
2. Ingresa "30" en el campo
3. Haz clic en "Cambiar Número"
4. Confirma que el encabezado ahora muestra "INVOICE #30"
5. La próxima factura nueva será automáticamente #31

## Notas Técnicas
- Los cambios se guardan en `localStorage` con la clave `factura_invoiceNumber`
- El valor se almacena como string pero se valida como número entero
- El sistema funciona con cualquier número de factura entre 1 y 999999999

## Solución de Problemas

### El número no cambia
- Asegúrate de hacer clic en "Cambiar Número" (no solo cerrar el modal)
- Verifica que ingresaste un número válido (entero positivo)

### El número se resetea
- Verifica que tu navegador permita localStorage
- No uses modo incógnito/privado (se borra al cerrar la ventana)

### El número incrementa incorrectamente
- Al hacer clic en "Nueva Factura", el número se incrementa automáticamente en 1
- Si no quieres que se incremente, usa "Cambiar # Factura" para establecer el número que desees
