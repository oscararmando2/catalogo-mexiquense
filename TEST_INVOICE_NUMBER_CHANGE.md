# Prueba de la Funcionalidad: Cambiar Número de Factura

## Objetivo
Verificar que la funcionalidad de cambio de número de factura funciona correctamente para regresar del INVOICE #35 al INVOICE #30.

## Procedimiento de Prueba

### Test Case 1: Verificar Estado Inicial
**Pasos:**
1. Abrir `factura.html` en el navegador
2. Observar el número de factura actual en el encabezado

**Resultado Esperado:**
- Se debe ver "INVOICE #31" (o el número que esté guardado en localStorage)

### Test Case 2: Abrir el Modal de Cambio
**Pasos:**
1. Localizar el botón "Cambiar # Factura" en la barra de acciones
2. Hacer clic en el botón

**Resultado Esperado:**
- Se abre un modal con título "Cambiar Número de Factura"
- El campo de entrada muestra el número actual
- El campo está seleccionado y listo para editar

### Test Case 3: Cambiar a Factura #30
**Pasos:**
1. En el campo de entrada, borrar el número actual
2. Escribir "30"
3. Hacer clic en "Cambiar Número"

**Resultado Esperado:**
- El modal se cierra automáticamente
- Se muestra un toast verde con el mensaje: "Número de factura cambiado a #30"
- El encabezado de la factura ahora muestra "INVOICE #30"
- El número se guarda en localStorage

### Test Case 4: Verificar Persistencia
**Pasos:**
1. Recargar la página (F5 o Ctrl+R)
2. Observar el número de factura en el encabezado

**Resultado Esperado:**
- El número sigue siendo "INVOICE #30"
- El número no se ha perdido al recargar

### Test Case 5: Incremento Automático
**Pasos:**
1. Hacer clic en el botón "Nueva Factura"
2. Confirmar la acción
3. Observar el número de factura en el encabezado

**Resultado Esperado:**
- El número de factura se incrementa automáticamente a "INVOICE #31"
- La nueva factura comienza limpia pero con el número correcto

### Test Case 6: Validación de Errores
**Pasos:**
1. Hacer clic en "Cambiar # Factura"
2. Intentar ingresar valores inválidos:
   - Número negativo (-5)
   - Cero (0)
   - Texto ("abc")
   - Campo vacío
3. Hacer clic en "Cambiar Número"

**Resultado Esperado:**
- Se muestra un toast rojo con el mensaje: "Por favor, ingresa un número válido (mínimo 1)"
- El modal NO se cierra
- El número de factura no cambia

### Test Case 7: Cancelar Cambio
**Pasos:**
1. Hacer clic en "Cambiar # Factura"
2. Cambiar el valor en el campo
3. Hacer clic en "Cancelar" o en la X del modal

**Resultado Esperado:**
- El modal se cierra
- El número de factura NO cambia
- Se mantiene el número original

## Verificación de Implementación

### Archivos Modificados
- ✅ `factura.html` - Agregado botón, modal y funcionalidad

### Componentes Agregados
1. ✅ Botón "Cambiar # Factura" en la barra de acciones
2. ✅ Modal con:
   - Título descriptivo
   - Campo de entrada numérico
   - Botón "Cambiar Número"
   - Botón "Cancelar"
   - Botón X para cerrar
3. ✅ Variables DOM:
   - `changeInvoiceNumberModal`
   - `closeChangeInvoiceModal`
   - `cancelChangeInvoiceBtn`
   - `confirmChangeInvoiceBtn`
   - `newInvoiceNumberInput`
   - `changeInvoiceNumberBtn`
4. ✅ Event Listeners:
   - Click en botón principal
   - Click en botón confirmar
   - Click en botón cancelar
   - Click en X
   - Click fuera del modal
5. ✅ Funciones:
   - `openChangeInvoiceNumberModal()`
   - `closeChangeInvoiceNumberModal()`
   - `confirmChangeInvoiceNumber()`

### Validaciones Implementadas
- ✅ Número debe ser entero positivo (>= 1)
- ✅ No se permite NaN
- ✅ Muestra mensaje de error si es inválido
- ✅ Muestra mensaje de éxito si es válido

### Integración con Sistema Existente
- ✅ Usa `invoiceNumber` (variable existente)
- ✅ Usa `saveInvoiceNumberToLocalStorage()` (función existente)
- ✅ Usa `updateInvoiceNumber()` (función existente)
- ✅ Usa `showToast()` (función existente)
- ✅ Usa clases CSS existentes para modal y botones

## Escenario Real del Usuario

### Situación Original
```
Usuario está en: INVOICE #35
Usuario necesita: INVOICE #30
```

### Solución Implementada
```
1. Usuario abre factura.html
2. Usuario ve "INVOICE #35" (o el número actual)
3. Usuario hace clic en "Cambiar # Factura"
4. Modal se abre con valor "35"
5. Usuario cambia a "30"
6. Usuario hace clic en "Cambiar Número"
7. Sistema actualiza a "INVOICE #30"
8. Usuario ve confirmación en verde
9. Número se guarda en localStorage
10. ¡Listo! Usuario puede continuar desde #30
```

## Notas de Prueba
- La funcionalidad NO requiere acceso a internet (todo es local)
- El número se guarda en el navegador (localStorage)
- Si se usa modo incógnito, el número se perderá al cerrar la ventana
- Compatible con Chrome, Firefox, Safari, Edge

## Resultado Final
✅ **FUNCIONALIDAD COMPLETADA Y LISTA PARA USAR**

El usuario ahora puede:
- Cambiar cualquier número de factura
- Regresar de #35 a #30 (o cualquier otro número)
- El número persiste en el navegador
- Las nuevas facturas incrementan automáticamente desde el nuevo número
