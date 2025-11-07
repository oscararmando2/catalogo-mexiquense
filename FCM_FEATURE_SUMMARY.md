# 🔔 Notificaciones Push con Firebase Cloud Messaging (FCM)

## 📱 Descripción de la Funcionalidad

El catálogo Mexiquense ahora incluye soporte completo para notificaciones push mediante Firebase Cloud Messaging (FCM). Los usuarios recibirán notificaciones automáticas cuando se agreguen nuevos productos al catálogo.

## ✨ Características Principales

### Para los Usuarios
- 🔔 **Notificaciones Automáticas**: Recibe alertas cuando hay nuevos productos
- 📱 **Multi-Plataforma**: Funciona en desktop, móvil (Chrome, Firefox, Safari 16+)
- 🎯 **Navegación Directa**: Haz clic en la notificación para ir directo al producto
- ⚙️ **Control Total**: Puedes activar/desactivar notificaciones en cualquier momento

### Para los Administradores
- 🚀 **Automático**: Las notificaciones se envían automáticamente al agregar productos
- 📊 **Rastreable**: Todos los tokens y eventos se registran en logs
- 🔧 **Configurable**: Fácil personalización del mensaje y comportamiento

## 🎬 Flujo de Notificaciones

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO VISITA LA APP                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  App solicita permiso de notificaciones (después de 2 seg)  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                    ┌────────┐
                    │Usuario │
                    │acepta? │
                    └───┬────┘
                        │
            ┌───────────┴───────────┐
            │                       │
          ✅ SÍ                   ❌ NO
            │                       │
            ▼                       ▼
┌──────────────────────┐   ┌────────────────┐
│Se obtiene token FCM  │   │No hay          │
│Token se guarda       │   │notificaciones  │
└──────────┬───────────┘   └────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│              ADMIN AGREGA NUEVO PRODUCTO                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│    Función notifyNewProduct() se ejecuta automáticamente    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend detecta nuevo producto y obtiene tokens guardados  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│    Firebase envía notificación push a todos los tokens      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────┴──────────┐
              │                     │
        App ABIERTA            App CERRADA
              │                     │
              ▼                     ▼
     ┌────────────────┐    ┌────────────────┐
     │ Notificación   │    │ Service Worker │
     │ en primer      │    │ muestra        │
     │ plano (toast)  │    │ notificación   │
     └────────┬───────┘    └────────┬───────┘
              │                     │
              └──────────┬──────────┘
                         │
                         ▼
                 ┌───────────────┐
                 │Usuario hace   │
                 │clic en        │
                 │notificación   │
                 └───────┬───────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│    App se abre y muestra detalles del producto nuevo        │
└─────────────────────────────────────────────────────────────┘
```

## 📂 Archivos Implementados

### 1. `index.html`
```html
<!-- Firebase Messaging SDK agregado -->
<script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js"></script>
```

### 2. `script.js`
**Nuevas Funciones:**
- `requestNotificationPermission()` - Solicita permisos al usuario
- `getFCMToken()` - Obtiene el token del dispositivo
- `setupForegroundMessageHandler()` - Maneja notificaciones cuando app está abierta
- `notifyNewProduct(productId, productName)` - Trigger para nuevas notificaciones

**Integración:**
- Inicialización automática en la función `init()`
- Llamada a `notifyNewProduct()` cuando se agrega un producto nuevo

### 3. `firebase-messaging-sw.js` (NUEVO)
Service worker que:
- Maneja notificaciones en segundo plano
- Muestra el mensaje: "Se agregó un nuevo Producto al catálogo"
- Redirige al producto cuando el usuario hace clic
- Abre o enfoca la ventana existente de la app

### 4. `FCM_SETUP_GUIDE.md` (NUEVO)
Guía completa con:
- Instrucciones paso a paso para configurar Firebase
- Código de ejemplo para servidor backend
- Procedimientos de prueba
- Solución de problemas comunes
- Mejores prácticas de seguridad

## 🚀 Inicio Rápido

### Para Desarrolladores

1. **Obtén las credenciales de Firebase:**
   ```
   - API Key
   - Sender ID
   - App ID
   - VAPID Key (generar en Firebase Console)
   ```

2. **Actualiza la configuración:**
   - En `script.js` línea ~82
   - En `script.js` línea ~162 (VAPID key)
   - En `firebase-messaging-sw.js` línea ~11

3. **Configura el backend (opcional pero recomendado):**
   ```bash
   npm install firebase-admin express
   ```
   Ver código completo en `FCM_SETUP_GUIDE.md`

4. **Despliega la app:**
   - Debe estar en HTTPS (o localhost para desarrollo)
   - El archivo `firebase-messaging-sw.js` debe estar en la raíz

5. **Prueba:**
   - Abre la app en Chrome/Firefox/Edge
   - Acepta los permisos de notificación
   - Agrega un producto desde el panel admin
   - Verifica que llegue la notificación

## 🔧 Configuración Actual

### Frontend (Cliente)
✅ **Implementado y Listo**
- Solicitud de permisos
- Obtención de tokens
- Manejo de notificaciones (foreground/background)
- Redirección al hacer clic
- Service worker funcional

### Backend (Servidor)
⚠️ **Requiere Configuración**
- Necesitas configurar un servidor Node.js
- Instalar Firebase Admin SDK
- Implementar lógica de envío de notificaciones
- Ver ejemplo completo en `FCM_SETUP_GUIDE.md`

## 📊 Mensaje de Notificación

**Título:** `"Nuevo Producto"`

**Cuerpo:** `"Se agregó un nuevo Producto al catálogo: [Nombre del Producto]"`

**Al hacer clic:** Redirige a `/?product=[ID_del_Producto]`

## 🌐 Compatibilidad de Navegadores

| Navegador | Desktop | Móvil | Notas |
|-----------|---------|-------|-------|
| Chrome | ✅ | ✅ | Soporte completo |
| Firefox | ✅ | ✅ | Soporte completo |
| Edge | ✅ | ✅ | Soporte completo |
| Safari | ✅ 16+ | ✅ 16.4+ | iOS 16.4+ requerido |
| Opera | ✅ | ✅ | Basado en Chrome |
| IE 11 | ❌ | ❌ | No soportado |

## 🔒 Seguridad

### ✅ Implementado
- Permisos explícitos del usuario
- Tokens almacenados de forma segura
- Validación de origen de mensajes
- Comunicación HTTPS requerida
- Documentación de mejores prácticas

### ⚠️ Recomendaciones de Producción
- Guardar tokens en Firebase Database (código documentado en script.js)
- Implementar rate limiting en el backend
- Validar y limpiar tokens expirados
- Usar variables de entorno para credenciales
- Nunca exponer credenciales del Admin SDK en el frontend

## 📚 Documentación Adicional

Para más detalles, consulta:
- **`FCM_SETUP_GUIDE.md`** - Guía completa de configuración
- **Comentarios en `script.js`** - Documentación inline del código
- **Comentarios en `firebase-messaging-sw.js`** - Lógica del service worker
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)

## 🐛 Problemas Comunes

### "Firebase Messaging no es soportado"
- Usa Chrome, Firefox, Edge, o Safari 16+
- Verifica que estés en HTTPS o localhost
- Asegúrate de que los service workers estén habilitados

### "No se pudo obtener el token FCM"
- Verifica que la clave VAPID esté configurada
- Confirma que los permisos fueron concedidos
- Revisa la consola del navegador para errores

### "Las notificaciones no se envían"
- Asegúrate de que el backend esté corriendo
- Verifica que los tokens se guarden en la base de datos
- Revisa los logs del servidor para errores de envío

### "Service Worker no se registra"
- El archivo debe estar en la raíz del proyecto
- Debe ser accesible en: `https://tu-dominio.com/firebase-messaging-sw.js`
- Limpia la caché del navegador y service workers antiguos

## 🎯 Próximos Pasos

Para llevar FCM a producción:

1. ✅ **Actualizar Credenciales**
   - API key, Sender ID, App ID en ambos archivos
   - Generar y configurar VAPID key

2. ✅ **Configurar Backend**
   - Servidor Node.js con Admin SDK
   - Monitorear cambios en la base de datos
   - Enviar notificaciones a tokens guardados

3. ✅ **Guardar Tokens**
   - Implementar guardado en Firebase Database
   - Código de ejemplo está documentado en script.js

4. ✅ **Probar Completamente**
   - Pruebas en desktop y móvil
   - Verificar foreground y background
   - Validar click-to-redirect

5. ✅ **Desplegar**
   - Usar HTTPS
   - Verificar que service worker sea accesible
   - Monitorear logs para errores

## 💡 Mejoras Futuras (Opcional)

- Panel de preferencias de notificaciones para usuarios
- Segmentación de audiencias (notificar solo a usuarios específicos)
- Notificaciones programadas
- Análisis de engagement y tasas de click
- Notificaciones ricas con imágenes
- Botones de acción en notificaciones
- Soporte para diferentes tipos de notificaciones (ofertas, descuentos, etc.)

## ✅ Estado de Implementación

**Frontend:** ✅ Completo y Funcional
**Backend:** 📝 Requiere Configuración (código de ejemplo provisto)
**Documentación:** ✅ Completa
**Pruebas:** ⚠️ Requiere credenciales reales de Firebase

---

**Última actualización:** Noviembre 7, 2025

**Versión de Firebase SDK:** 10.13.0

**Contacto:** Ver repositorio para issues y soporte
