# Feature: Agregar al Catálogo desde Especiales

## Descripción General

Esta característica permite a los usuarios agregar productos desde la sección de "Especiales" al catálogo principal de productos. Cuando un usuario está editando un especial, ahora puede hacer clic en el botón "AGREGAR AL CATÁLOGO" para crear un nuevo producto en el catálogo utilizando la información del especial.

## Cambios Implementados

### 1. Botón de Editar en Tarjetas de Especiales

Cada tarjeta de especial ahora muestra dos botones:
- **Botón de Editar** (azul): Permite editar el especial existente
- **Botón de Eliminar** (rojo): Elimina el especial

El botón de editar se muestra en la parte superior derecha de cada tarjeta, junto al botón de eliminar.

### 2. Modal de Edición de Especiales

El modal de especiales ahora funciona en dos modos:
- **Modo Agregar**: Cuando se hace clic en "Agregar Nuevo Especial"
- **Modo Editar**: Cuando se hace clic en el botón de editar de una tarjeta

### 3. Botón "AGREGAR AL CATÁLOGO"

En el modo de edición, aparece un nuevo botón azul llamado "AGREGAR AL CATÁLOGO" que:
- Solo se muestra cuando se está editando un especial existente (no al agregar uno nuevo)
- Está ubicado en la parte inferior izquierda del modal, separado de los botones "Cancelar" y "Guardar"
- Tiene un ícono de carrito de compras

### 4. Flujo de Trabajo

Cuando el usuario hace clic en "AGREGAR AL CATÁLOGO":

1. **Cierra el modal de especial**
2. **Cambia a la vista de administración** (si no está ya en ella)
3. **Abre el formulario de nuevo producto** con los datos pre-llenados desde el especial:
   - **Item Number**: Copiado del especial (si existe)
   - **UPC**: Copiado del especial
   - **Nombre**: Copiado del especial
   - **URL de Imagen**: Copiada del especial
   - **Costo**: Usa el precio especial del especial
   - **Descripción**: Genera una descripción combinando nombre + proveedor + notas

4. **El usuario completa los campos faltantes**:
   - Tamaño (Size)
   - Cantidad (Qty)
   - Cualquier otro campo necesario

5. **Guarda el producto** haciendo clic en "Guardar Producto"

6. **El producto aparece en el catálogo principal** en la sección "MEXIQUENSE - Catálogo de Productos"

## Archivos Modificados

### index.html
- Se agregó el botón "AGREGAR AL CATÁLOGO" al modal de especiales
- El botón tiene la clase "hidden" por defecto para ocultarlo en modo agregar

### script.js

#### Nuevas Funciones

1. **`openEditEspecialModal(especialId)`**
   - Abre el modal de especiales en modo edición
   - Pre-llena todos los campos con los datos del especial
   - Muestra el botón "AGREGAR AL CATÁLOGO"

2. **`openProductFormFromEspecial(especialId)`**
   - Maneja el clic en "AGREGAR AL CATÁLOGO"
   - Cierra el modal de especiales
   - Cambia a la vista de administración si es necesario
   - Llama a `fillProductFormFromEspecial`

3. **`fillProductFormFromEspecial(especial)`**
   - Abre el formulario de producto
   - Pre-llena los campos disponibles con datos del especial
   - Genera una descripción automática
   - Muestra un mensaje de instrucción al usuario

4. **`updateEspecial(especialId, ...)`**
   - Actualiza un especial existente
   - Guarda los cambios en Firebase/localStorage
   - Re-renderiza la lista de especiales

#### Modificaciones a Funciones Existentes

1. **`renderEspeciales()`**
   - Se agregó el botón de editar a cada tarjeta
   - Se agregaron event listeners para el botón de editar

2. **Manejador del formulario de especiales**
   - Ahora detecta si está en modo agregar o editar
   - Llama a `addEspecial()` o `updateEspecial()` según corresponda

3. **Botón "Agregar Nuevo Especial"**
   - Ahora oculta el botón "AGREGAR AL CATÁLOGO" cuando abre el modal

## Uso de la Característica

### Para el Usuario Final

1. **Navegar a Especiales**
   - Ir a la sección "Especiales" en la aplicación

2. **Editar un Especial**
   - Hacer clic en el botón de editar (ícono de lápiz) en cualquier tarjeta de especial

3. **Agregar al Catálogo**
   - En el modal de edición, hacer clic en "AGREGAR AL CATÁLOGO"
   - La aplicación cambiará automáticamente a la vista de administración
   - El formulario de nuevo producto se abrirá con datos pre-llenados

4. **Completar Información Faltante**
   - Rellenar los campos que no estaban en el especial (Tamaño, Cantidad, etc.)
   - Revisar y ajustar los campos pre-llenados si es necesario

5. **Guardar Producto**
   - Hacer clic en "Guardar Producto"
   - El producto ahora aparecerá en el catálogo principal

## Beneficios

1. **Reduce la duplicación de datos**: Los usuarios no tienen que volver a escribir toda la información del producto
2. **Previene errores**: Al copiar automáticamente datos como UPC y nombre, se reducen los errores de entrada
3. **Ahorra tiempo**: El proceso es mucho más rápido que crear un producto desde cero
4. **Mantiene consistencia**: Asegura que los datos del especial y del catálogo sean consistentes

## Notas Técnicas

- Los especiales y productos son entidades separadas en la base de datos
- La función no crea automáticamente el producto, solo pre-llena el formulario
- El usuario debe completar y confirmar antes de que el producto se agregue al catálogo
- Los datos se copian, no se mueven (el especial permanece en su lugar)
- La función maneja correctamente el cambio de vista si el usuario no está en la vista de administración

## Seguridad

- Todos los datos se sanitizan antes de mostrarse (función `sanitizeInput`)
- Las URLs de imagen se validan para prevenir inyección de código
- Los números se validan antes de guardar
