# Guía de Ajustes Post-Deployment para Zebra MC330M

## Propósito

Este documento proporciona ajustes opcionales que pueden ser necesarios después de probar el diseño FTSRetail en el dispositivo Zebra MC330M real.

## ⚠️ Áreas que Requieren Testing en Hardware Real

### 1. Tamaños de Fuente

**Valores Actuales (Inspirados en FTSRetail):**
```css
body { font-size: 9px; }
labels { font-size: 9px; }
inputs { font-size: 9px; }
buttons { font-size: 6px; }
helper-text { font-size: 6px; }
```

**Si las fuentes son demasiado pequeñas, ajustar a:**

#### Opción A: Ligeramente más grande (recomendado para WCAG)
```css
body { font-size: 10px !important; }
#creditosRegister label { font-size: 10px !important; }
#creditosRegister input,
#creditosRegister textarea,
#creditosRegister select { font-size: 10px !important; }
#creditosRegister button { font-size: 8px !important; }
#creditosRegister .text-xs,
#creditosRegister .text-sm { font-size: 8px !important; }
```

#### Opción B: Más grande (mejor accesibilidad)
```css
body { font-size: 12px !important; }
#creditosRegister label { font-size: 12px !important; }
#creditosRegister input,
#creditosRegister textarea,
#creditosRegister select { font-size: 12px !important; }
#creditosRegister button { font-size: 10px !important; }
#creditosRegister .text-xs,
#creditosRegister .text-sm { font-size: 10px !important; }
```

#### Opción C: WCAG Compliant (mínimo 12px texto)
```css
body { font-size: 12px !important; }
#creditosRegister label { font-size: 12px !important; }
#creditosRegister input,
#creditosRegister textarea,
#creditosRegister select { font-size: 12px !important; }
#creditosRegister button { font-size: 12px !important; }
#creditosRegister .text-xs,
#creditosRegister .text-sm { font-size: 11px !important; }
```

**Ubicación:** `styles.css`, líneas 200-370 (dentro de `@media (max-width: 480px)`)

---

### 2. Bordes (0.1px)

**Valor Actual:**
```css
border: 0.1px solid #d1d5db !important;
```

**Si 0.1px no renderiza correctamente, cambiar a:**

#### Opción A: Border transparente (recomendado)
```css
border: 1px solid rgba(209, 213, 219, 0.3) !important;
```

#### Opción B: Border gris claro
```css
border: 1px solid #e5e7eb !important;
```

#### Opción C: Border más oscuro
```css
border: 1px solid #d1d5db !important;
```

**Ubicación:** 
- `styles.css`, línea ~294 (inputs)
- `styles.css`, línea ~275 (product-field)

**Cambiar en estos selectores:**
```css
#creditosRegister input[type="text"],
#creditosRegister input[type="number"],
/* ... más selectores ... */

.product-field {
```

---

### 3. Padding de Inputs

**Valor Actual:**
```css
padding: 2px 3px !important;
```

**Si el padding es muy pequeño para uso con guantes, ajustar a:**

#### Opción A: Padding moderado
```css
padding: 4px 6px !important;
```

#### Opción B: Padding confortable
```css
padding: 6px 8px !important;
```

#### Opción C: Padding estándar (más espacio)
```css
padding: 8px 10px !important;
```

**Nota:** Al aumentar el padding, considerar reducir el max-width de 225px a 200px para mantener contenido visible.

**Ubicación:** `styles.css`, línea ~291 (inputs) y línea ~272 (product-field)

---

### 4. Ancho Máximo del Layout

**Valor Actual:**
```css
max-width: 225px !important;
```

**Si se necesita más espacio horizontal, ajustar a:**

#### Opción A: Un poco más ancho
```css
max-width: 250px !important;
```

#### Opción B: Moderadamente más ancho
```css
max-width: 300px !important;
```

#### Opción C: Casi full-width
```css
max-width: 400px !important;
```

#### Opción D: Full-width (eliminar restricción)
```css
max-width: 100% !important;
```

**Ubicación:** 
- `styles.css`, línea ~230 (#creditosRegister .bg-white)
- `styles.css`, línea ~450 (landscape mode)

---

### 5. Spacing Entre Elementos

**Valor Actual:**
```css
gap: 3px !important;
margin-top: 3px !important;
margin-bottom: 3px !important;
```

**Si se necesita más espacio entre elementos, ajustar a:**

#### Opción A: Spacing moderado
```css
gap: 6px !important;
margin-top: 6px !important;
margin-bottom: 6px !important;
```

#### Opción B: Spacing confortable
```css
gap: 8px !important;
margin-top: 8px !important;
margin-bottom: 8px !important;
```

#### Opción C: Spacing estándar
```css
gap: 12px !important;
margin-top: 12px !important;
margin-bottom: 12px !important;
```

**Ubicación:** Múltiples líneas en `styles.css` (buscar `gap:` y `margin-top:`)

---

### 6. Touch Targets (Altura de Botones)

**Valor Actual:**
```css
min-height: 44px !important;
```

**Si 44px es insuficiente para guantes industriales, ajustar a:**

#### Opción A: Ligeramente más alto
```css
min-height: 48px !important;
```

#### Opción B: Más alto
```css
min-height: 52px !important;
```

#### Opción C: Material Design XL (guantes gruesos)
```css
min-height: 56px !important;
```

**Nota:** Esto afectará la cantidad de contenido visible sin scroll.

**Ubicación:** Múltiples líneas en `styles.css` (buscar `min-height: 44px`)

---

## 🔧 Ajustes Rápidos Recomendados

### Escenario 1: "Todo es muy pequeño"
```css
/* En @media (max-width: 480px) */
body { font-size: 12px !important; }
#creditosRegister label { font-size: 12px !important; }
#creditosRegister input,
#creditosRegister textarea,
#creditosRegister select { font-size: 12px !important; padding: 6px 8px !important; }
#creditosRegister button { font-size: 12px !important; }
#creditosRegister .bg-white { max-width: 300px !important; }
```

### Escenario 2: "Bordes no se ven"
```css
/* Reemplazar todas las instancias de: */
border: 0.1px solid #d1d5db !important;
/* Con: */
border: 1px solid rgba(209, 213, 219, 0.3) !important;
```

### Escenario 3: "Necesito más espacio"
```css
/* En @media (max-width: 480px) */
#creditosRegister .bg-white { max-width: 350px !important; }
.product-field { padding: 6px !important; margin-bottom: 6px !important; }
```

### Escenario 4: "Difícil de tocar con guantes"
```css
/* Aumentar touch targets y padding */
#creditosRegister input,
#creditosRegister button { min-height: 52px !important; padding: 8px 10px !important; }
```

---

## 📝 Proceso de Ajuste

1. **Probar en dispositivo real** - No confíes solo en emuladores
2. **Ajustar un valor a la vez** - Facilita identificar el cambio correcto
3. **Probar con usuarios reales** - Operadores que usarán la app diariamente
4. **Probar en condiciones reales** - Iluminación del almacén, guantes, etc.
5. **Documentar cambios** - Mantén registro de qué funcionó

---

## 🎨 Plantilla de Prueba

Use esta tabla para documentar pruebas:

| Elemento | Valor Actual | Problema | Valor Probado | Resultado | Valor Final |
|----------|--------------|----------|---------------|-----------|-------------|
| Body font | 9px | Muy pequeño | 12px | ✅ Mejor | 12px |
| Button font | 6px | Ilegible | 10px | ✅ Legible | 10px |
| Border | 0.1px | No visible | 1px rgba | ✅ Se ve | 1px rgba |
| Input padding | 2-3px | Muy apretado | 6px 8px | ✅ Cómodo | 6px 8px |
| Max-width | 225px | Muy angosto | 300px | ✅ Mejor | 300px |
| Touch target | 44px | OK con dedos | - | ✅ OK | 44px |

---

## 🚨 Notas Importantes

1. **No cambiar en Desktop**: Los ajustes solo deben aplicarse dentro de `@media (max-width: 480px)`
2. **Mantener touch targets**: Nunca reducir `min-height` por debajo de 44px
3. **Testing iterativo**: Hacer cambios incrementales, no todos a la vez
4. **Backup**: Guardar una copia de `styles.css` antes de hacer cambios
5. **Versión control**: Commit cada cambio con descripción clara

---

## 📞 Soporte

Si necesitas ayuda con ajustes:
1. Documenta el problema específico
2. Toma screenshots del problema
3. Anota las condiciones (iluminación, guantes, etc.)
4. Comparte la tabla de pruebas completada

---

## ✅ Checklist de Deployment

- [ ] Probar fuentes en dispositivo real
- [ ] Verificar bordes son visibles
- [ ] Confirmar inputs son fáciles de tocar
- [ ] Validar layout centrado se ve bien
- [ ] Probar scanner de códigos UPC funciona
- [ ] Verificar fullscreen se activa
- [ ] Probar con guantes (si aplica)
- [ ] Probar bajo iluminación del almacén
- [ ] Validar con operadores reales
- [ ] Documentar ajustes finales

---

## 🎯 Meta Final

Encontrar el balance perfecto entre:
- ✅ Diseño compacto (más contenido visible)
- ✅ Legibilidad (texto claro y fácil de leer)
- ✅ Usabilidad (fácil de tocar y usar)
- ✅ Accesibilidad (cumple estándares básicos)

**No existe una solución única para todos. El testing en el dispositivo real es CRÍTICO.**
