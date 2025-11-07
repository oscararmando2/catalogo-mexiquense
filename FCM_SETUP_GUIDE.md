# Firebase Cloud Messaging (FCM) - Guía de Configuración

Esta guía explica cómo configurar y usar las notificaciones push de Firebase Cloud Messaging en el catálogo Mexiquense.

## 📋 Tabla de Contenidos

1. [Resumen de la Implementación](#resumen-de-la-implementación)
2. [Archivos Modificados](#archivos-modificados)
3. [Configuración Inicial](#configuración-inicial)
4. [Configuración del Backend](#configuración-del-backend)
5. [Pruebas Locales](#pruebas-locales)
6. [Resolución de Problemas](#resolución-de-problemas)

## 🎯 Resumen de la Implementación

Se ha integrado Firebase Cloud Messaging para enviar notificaciones push cuando se agregan nuevos productos al catálogo. La implementación incluye:

- ✅ **Frontend completo**: Solicitud de permisos, gestión de tokens, y visualización de notificaciones
- ✅ **Service Worker**: Manejo de notificaciones en segundo plano
- ✅ **Documentación**: Comentarios detallados para integración con backend
- ✅ **Compatibilidad**: Chrome, Firefox, Edge, Safari 16+

## 📁 Archivos Modificados

### 1. `index.html`
Se agregó el SDK de Firebase Messaging:
```html
<script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js"></script>
```

### 2. `script.js`
- Inicialización de Firebase Messaging
- Funciones para solicitar permisos
- Gestión de tokens FCM
- Manejador de mensajes en primer plano
- Integración con la función de agregar productos

### 3. `firebase-messaging-sw.js` (NUEVO)
Service worker que:
- Maneja notificaciones en segundo plano
- Muestra notificaciones con el mensaje configurado
- Redirige al usuario al producto cuando hace clic

## ⚙️ Configuración Inicial

### Paso 1: Obtener Credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto "catalogomexiquense"
3. Ve a **Configuración del proyecto** (ícono de engranaje)
4. En la sección **Tus apps**, encontrarás:
   - `apiKey`
   - `authDomain`
   - `databaseURL`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### Paso 2: Generar Clave VAPID

1. En Firebase Console, ve a **Configuración del proyecto**
2. Selecciona la pestaña **Cloud Messaging**
3. Desplázate hasta **Certificados de notificaciones push web**
4. Haz clic en **Generar par de claves**
5. Copia la **Clave pública** (VAPID key)

### Paso 3: Actualizar Archivos

#### En `script.js` (línea ~82):
```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...",  // Tu API key
    authDomain: "catalogomexiquense.firebaseapp.com",
    databaseURL: "https://catalogomexiquense-default-rtdb.firebaseio.com",
    projectId: "catalogomexiquense",
    storageBucket: "catalogomexiquense.appspot.com",
    messagingSenderId: "123456789",  // Tu Sender ID
    appId: "1:123456789:web:abc123"  // Tu App ID
};
```

#### En la función `getFCMToken()` (línea ~162):
```javascript
const token = await messaging.getToken({
    vapidKey: 'BPG...'  // Tu clave VAPID pública
});
```

#### En `firebase-messaging-sw.js` (línea ~11):
```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...",  // Misma API key
    authDomain: "catalogomexiquense.firebaseapp.com",
    databaseURL: "https://catalogomexiquense-default-rtdb.firebaseio.com",
    projectId: "catalogomexiquense",
    storageBucket: "catalogomexiquense.appspot.com",
    messagingSenderId: "123456789",  // Mismo Sender ID
    appId: "1:123456789:web:abc123"  // Mismo App ID
};
```

## 🖥️ Configuración del Backend

Para enviar notificaciones reales, necesitas un servidor backend que use el Firebase Admin SDK.

### Paso 1: Configurar Servidor Node.js

```bash
# Crear directorio del servidor
mkdir fcm-server
cd fcm-server

# Inicializar proyecto Node.js
npm init -y

# Instalar dependencias
npm install firebase-admin express
```

### Paso 2: Obtener Credenciales del Admin SDK

1. En Firebase Console, ve a **Configuración del proyecto**
2. Ve a la pestaña **Cuentas de servicio**
3. Haz clic en **Generar nueva clave privada**
4. Guarda el archivo JSON (por ejemplo, `serviceAccountKey.json`)

### Paso 3: Crear Servidor (server.js)

```javascript
const admin = require('firebase-admin');
const express = require('express');
const serviceAccount = require('./serviceAccountKey.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://catalogomexiquense-default-rtdb.firebaseio.com"
});

const app = express();
app.use(express.json());

// Escuchar cambios en productos (nuevo producto agregado)
admin.database().ref('products').on('child_added', async (snapshot) => {
  const newProduct = snapshot.val();
  
  // Solo procesar productos realmente nuevos (agregados en los últimos 10 segundos)
  if (Date.now() - newProduct.dateAdded < 10000) {
    console.log('Nuevo producto detectado:', newProduct.nombre);
    
    // Obtener todos los tokens FCM guardados
    const tokensSnapshot = await admin.database().ref('fcmTokens').once('value');
    const tokens = [];
    
    tokensSnapshot.forEach(child => {
      tokens.push(child.val().token);
    });
    
    if (tokens.length === 0) {
      console.log('No hay tokens FCM registrados');
      return;
    }
    
    // Preparar mensaje de notificación
    const message = {
      notification: {
        title: 'Nuevo Producto',
        body: `Se agregó un nuevo Producto al catálogo: ${newProduct.nombre}`
      },
      data: {
        productId: newProduct.id,
        productUrl: `/?product=${newProduct.id}`,
        dateAdded: String(newProduct.dateAdded)
      },
      tokens: tokens
    };
    
    // Enviar notificación
    try {
      const response = await admin.messaging().sendMulticast(message);
      console.log(`Notificaciones enviadas: ${response.successCount} exitosas, ${response.failureCount} fallidas`);
      
      // Eliminar tokens inválidos
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Error al enviar a token ${idx}:`, resp.error);
          // TODO: Eliminar token inválido de la base de datos
        }
      });
    } catch (error) {
      console.error('Error al enviar notificaciones:', error);
    }
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor FCM escuchando en puerto ${PORT}`);
  console.log('Monitoreando nuevos productos...');
});
```

### Paso 4: Iniciar el Servidor

```bash
node server.js
```

## 🧪 Pruebas Locales

### 1. Preparar Entorno

1. Actualiza todas las credenciales en los archivos
2. Despliega la aplicación web (GitHub Pages, Firebase Hosting, etc.)
3. Inicia el servidor backend

### 2. Probar en el Navegador

1. Abre la aplicación en Chrome/Firefox/Edge
2. Espera 2 segundos (aparecerá solicitud de permisos)
3. Haz clic en **Permitir** para las notificaciones
4. Verifica en la consola que se obtuvo el token FCM
5. Ve al panel de administración (contraseña: `admin123`)
6. Agrega un nuevo producto
7. Deberías recibir una notificación push

### 3. Probar Notificación en Segundo Plano

1. Minimiza o cambia de pestaña
2. Desde el panel admin, agrega otro producto
3. Deberías ver la notificación del sistema operativo
4. Haz clic en la notificación
5. La app debería abrirse y mostrar el producto

### 4. Probar en Móvil

1. Abre la app en Chrome móvil o Safari (iOS 16.4+)
2. Repite los pasos anteriores
3. Las notificaciones deberían aparecer igual que en desktop

## 🔍 Resolución de Problemas

### Error: "Firebase Messaging no es soportado"

**Causa**: El navegador no soporta service workers o notificaciones.

**Solución**: 
- Usa Chrome, Firefox, Edge, o Safari 16+
- Asegúrate de estar usando HTTPS (o localhost)
- Verifica que los service workers estén habilitados

### Error: "No se pudo obtener el token FCM"

**Causa**: Falta la clave VAPID o está incorrecta.

**Solución**:
- Genera una nueva clave VAPID en Firebase Console
- Actualiza el valor en `getFCMToken()` en script.js

### No aparece la solicitud de permisos

**Causa**: Los permisos ya fueron denegados previamente.

**Solución**:
- En Chrome: Ve a Configuración > Privacidad > Configuración del sitio > Notificaciones
- Encuentra tu sitio y cambia el permiso a "Permitir"

### Las notificaciones no se envían

**Causa**: El backend no está corriendo o no tiene acceso a los tokens.

**Solución**:
- Verifica que el servidor backend esté corriendo
- Confirma que los tokens se están guardando en Firebase Database
- Revisa los logs del servidor para errores

### Service Worker no se registra

**Causa**: El archivo `firebase-messaging-sw.js` no está en la raíz.

**Solución**:
- Asegúrate de que el archivo esté en la raíz del proyecto
- El archivo debe ser accesible en: `https://tu-dominio.com/firebase-messaging-sw.js`

## 📝 Guardando Tokens en la Base de Datos

Actualmente, los tokens se guardan en localStorage. Para producción, deberías guardarlos en Firebase Database.

Descomenta y modifica el código en `getFCMToken()` (línea ~175):

```javascript
if (database) {
    const tokenRef = database.ref('fcmTokens').push();
    await tokenRef.set({
        token: token,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        lastUsed: Date.now()
    });
    console.log('Token FCM guardado en la base de datos');
}
```

## 🔒 Consideraciones de Seguridad

1. **Nunca expongas las credenciales del Admin SDK en el frontend**
   - El archivo `serviceAccountKey.json` debe estar solo en el servidor
   - Usa variables de entorno para las credenciales

2. **Valida los tokens antes de enviar notificaciones**
   - Elimina tokens inválidos o expirados
   - Implementa límites de tasa para prevenir spam

3. **Usa HTTPS**
   - Las notificaciones push solo funcionan en HTTPS
   - Localhost está permitido para desarrollo

4. **Respeta la privacidad del usuario**
   - No solicites permisos inmediatamente al cargar
   - Proporciona una forma de desactivar las notificaciones

## 📚 Recursos Adicionales

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications Guide](https://developers.google.com/web/fundamentals/push-notifications)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## 🆘 Soporte

Si tienes problemas con la implementación:
1. Revisa los logs de la consola del navegador
2. Verifica los logs del servidor backend
3. Consulta la documentación de Firebase
4. Revisa los comentarios en el código fuente

---

**Nota**: Esta es una implementación base. Para producción, considera agregar:
- Gestión de suscripciones de usuarios
- Segmentación de audiencias
- Análisis de engagement
- Personalización de mensajes
- Notificaciones programadas
