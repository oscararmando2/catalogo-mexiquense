# Cambios para Zebra MC330M

## Resumen de Optimizaciones

Este documento detalla las modificaciones realizadas para adaptar el sitio web al dispositivo Zebra MC330M (pantalla de 4 pulgadas, resolución 480x800 en portrait).

## Archivos Modificados

### 1. index.html
- **Viewport meta tag actualizado**: Configurado con `maximum-scale=1.0` y `user-scalable=no` para evitar zoom no deseado
- **CSS externo**: Vinculado a `styles.css` para mejor organización
- **JavaScript externo**: Vinculado a `script.js` para mejor mantenimiento

### 2. styles.css (NUEVO)
Contiene todos los estilos con optimizaciones específicas para MC330M:

#### Estilos Base
- Todos los estilos originales del sitio preservados
- Colores mexicanos mantenidos (#006847 verde, #CE1126 rojo)
- Estilos de tarjetas, menú móvil, y fotos preservados

#### Media Query Portrait (480px)
```css
@media screen and (max-width: 480px) {
    /* Optimizaciones principales */
}
```

**Características:**
- **Box-sizing**: `box-sizing: border-box` en todos los elementos
- **Tamaño de fuente**: 14px base, 16px en inputs (previene zoom iOS)
- **Campos de entrada**:
  - Ancho completo (100%)
  - Altura mínima: 44px (estándar táctil de Apple)
  - Padding: 10px (0.625rem)
  - Font-size: 14-16px (legible en 4 pulgadas)
  - Bordes redondeados: 0.375rem

- **Botones**:
  - Altura mínima: 44px (táctil)
  - Ancho completo en formularios
  - Font-size: 14px
  - Padding táctil adecuado

- **Sección "Registrar Nuevo Crédito"**:
  - Padding reducido (0.75rem)
  - Espaciado optimizado entre elementos
  - Flexbox para mejor distribución
  - Labels legibles (13px)
  - Helper text pequeño pero legible (12px)

- **Estados de enfoque**:
  - Outline verde visible (2px solid #006847)
  - Mejor visibilidad para navegación táctil

#### Media Query Landscape (800px)
```css
@media screen and (max-width: 800px) and (orientation: landscape)
```

**Características:**
- Layout de 2 columnas para campos en paisaje
- Altura máxima con scroll (90vh)
- Campos importantes span full width

### 3. script.js (NUEVO)
JavaScript con funcionalidades mejoradas para MC330M:

#### Modo Fullscreen
```javascript
function enableFullscreen() { ... }
function isChromeBrowser() { ... }
function initFullscreenMode() { ... }
```

**Funcionalidad:**
- Detecta Chrome browser
- Activa fullscreen en primera interacción del usuario
- Maximiza espacio disponible en pantalla de 4 pulgadas
- Compatible con diferentes APIs de fullscreen (Chrome, Safari, IE11)

#### Auto-focus para Scanner
```javascript
function focusFirstUPCInput() { ... }
```

**Funcionalidad:**
- Enfoca automáticamente el primer campo UPC al abrir "Registrar Nuevo Crédito"
- Permite escaneo inmediato con pistola Zebra
- Timeout de 100ms para asegurar DOM está listo

#### Inicialización
```javascript
function init() {
    // ... código original ...
    initFullscreenMode(); // NUEVO
    console.log('Mexiquense catalog initialized with Zebra MC330M optimizations');
}
```

## Características Preservadas

✅ Toda la funcionalidad existente del sitio se mantiene
✅ Escaneo de UPC completo (12-13 dígitos)
✅ Auto-llenado de productos desde catálogo
✅ Sistema de créditos completo
✅ Firebase y localStorage
✅ Importar/Exportar funcionalidad
✅ Vista pública y administrativa
✅ Menú móvil hamburguesa

## Mejoras Específicas para MC330M

1. **Viewport Optimizado**: Previene zoom automático y ajusta escala correctamente
2. **Inputs Táctiles**: Tamaño mínimo 44x44px para toques precisos
3. **Font-size 16px**: Previene zoom en iOS al enfocar inputs
4. **Fullscreen Chrome**: Maximiza área visible en pantalla de 4"
5. **Auto-focus UPC**: Scanner listo inmediatamente al abrir formulario
6. **Espaciado Reducido**: Más contenido visible sin scroll excesivo
7. **Botones Grandes**: Fácil toque en pantalla pequeña
8. **Media Queries**: Adaptación perfecta a 480px (portrait) y 800px (landscape)

## Uso en Zebra MC330M

1. Abrir Chrome en el dispositivo MC330M
2. Navegar a la URL del sitio
3. El navegador solicitará permiso para fullscreen en primera interacción
4. Aceptar fullscreen para mejor experiencia
5. Ir a "Créditos" > "Registrar Nuevo Crédito"
6. El campo UPC se enfoca automáticamente
7. Usar pistola Zebra para escanear códigos de barras
8. Los productos se auto-llenan si existen en el catálogo

## Notas Técnicas

- **Prevención de zoom**: Font-size mínimo 16px en inputs evita zoom en iOS
- **Box-sizing**: Asegura que padding no rompa el ancho 100%
- **Flexbox**: Mejor distribución vertical de elementos en espacio limitado
- **Touch targets**: 44px mínimo según guías de accesibilidad móvil
- **Fullscreen API**: Requiere gesto del usuario (click/touch) para activarse

## Compatibilidad

✅ Chrome (con fullscreen)
✅ Safari (sin fullscreen)
✅ Firefox mobile
✅ Navegadores basados en Chromium
✅ iOS devices (con font-size 16px anti-zoom)
✅ Android devices

## Testing Recomendado

1. Probar en Zebra MC330M en portrait (480x800)
2. Probar en Zebra MC330M en landscape (800x480)
3. Verificar escaneo de códigos UPC con pistola
4. Confirmar que fullscreen se activa correctamente
5. Validar que inputs no causan zoom no deseado
6. Probar navegación con dedos en pantalla táctil
7. Verificar legibilidad de texto en 4 pulgadas
