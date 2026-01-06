# Configuración del Botón WhatsApp "Let's Chat"

## Descripción
Este documento explica cómo configurar el número de WhatsApp para el botón "Let's Chat" en el catálogo.

## Ubicación del Código
El número de WhatsApp se configura en el archivo `script.js`, línea 1090.

## Cómo Configurar

1. Abre el archivo `script.js`
2. Busca la línea que contiene:
   ```javascript
   const phoneNumber = '523197000000'; // Update this with the actual phone number
   ```
3. Reemplaza `'523197000000'` con tu número de WhatsApp Business

## Formato del Número
El número debe estar en formato internacional sin espacios ni caracteres especiales:
- **Código de país**: Para México es `52`
- **Número completo**: Sin el `+` ni espacios

### Ejemplos:
- México: `521234567890` (52 + 10 dígitos)
- Estados Unidos: `11234567890` (1 + 10 dígitos)
- España: `34612345678` (34 + 9 dígitos)

## Prueba
Para probar que el botón funciona correctamente:
1. Abre el catálogo en tu navegador
2. Haz clic en "Ver detalles" de cualquier producto
3. Haz clic en el botón verde "Let's Chat"
4. Deberías ser redirigido a WhatsApp con un mensaje pre-llenado

## Mensaje Pre-llenado
El mensaje que se envía incluye automáticamente:
- Nombre del producto
- UPC del producto
- Precio del producto
- Un texto de introducción: "Hola! Estoy interesado en este producto:"

## Personalización del Mensaje
Si deseas personalizar el mensaje, edita las líneas 1083-1087 en `script.js`:
```javascript
const message = `Hola! Estoy interesado en este producto:\n\n` +
    `Nombre: ${product.nombre || 'N/A'}\n` +
    `UPC: ${product.upc || 'N/A'}\n` +
    `Precio: ${formatCurrency(product.costo || 0)}\n\n` +
    `¿Podrías darme más información?`;
```

## Animación del Botón
El botón incluye una animación que muestra:
1. Primero "Let's" (0 segundos)
2. Después "Chat" (0.5 segundos)
3. Finalmente el ícono de WhatsApp (1 segundo)

Esta animación se ejecuta automáticamente cada vez que se abre el modal de detalles del producto.
