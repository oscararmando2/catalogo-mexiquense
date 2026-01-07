# Guía de Configuración de Reglas de Firebase

## Problema: PERMISSION_DENIED al guardar productos en "Especiales en Tienda"

Si estás viendo el siguiente error en la consola del navegador:

```
Firebase save error for especiales tienda, using localStorage as fallback 
Error: PERMISSION_DENIED: Permission denied
```

Esto significa que las reglas de seguridad de Firebase Realtime Database no permiten escritura en el nodo `especialesTienda`.

## Solución: Configurar Reglas de Firebase

### Opción 1: Reglas Abiertas (Solo para Desarrollo/Testing)

⚠️ **ADVERTENCIA**: Estas reglas permiten lectura y escritura completa. Solo úsalas para desarrollo o testing, NO en producción.

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto "catalogomexiquense"
3. En el menú lateral, ve a **Realtime Database**
4. Haz clic en la pestaña **Reglas** (Rules)
5. Reemplaza las reglas existentes con:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

6. Haz clic en **Publicar** (Publish)

### Opción 2: Reglas Seguras con Autenticación (Recomendado para Producción)

Estas reglas permiten lectura pública pero requieren autenticación para escritura:

```json
{
  "rules": {
    ".read": true,
    "products": {
      ".write": "auth != null"
    },
    "especiales": {
      ".write": "auth != null"
    },
    "especialesTienda": {
      ".write": "auth != null"
    },
    "credits": {
      ".write": "auth != null"
    },
    "fcmTokens": {
      ".write": "auth != null"
    }
  }
}
```

Con esta configuración:
- ✅ Cualquiera puede leer datos (público)
- ✅ Solo usuarios autenticados pueden escribir
- ✅ Protege contra modificaciones no autorizadas

### Opción 3: Reglas con Contraseña de Administrador (Alternativa)

Si prefieres usar una contraseña de administrador sin Firebase Authentication:

```json
{
  "rules": {
    ".read": true,
    "products": {
      ".write": true
    },
    "especiales": {
      ".write": true
    },
    "especialesTienda": {
      ".write": true
    },
    "credits": {
      ".write": true
    },
    "fcmTokens": {
      ".write": true
    },
    "adminPassword": {
      ".read": true,
      ".write": false
    }
  }
}
```

⚠️ **NOTA**: Esta opción permite escritura sin autenticación. Úsala solo si tienes validación de contraseña en el frontend (como la aplicación actual).

## Verificar que las Reglas Funcionan

Después de publicar las reglas:

1. Espera 10-30 segundos para que se apliquen
2. Refresca la aplicación en tu navegador (F5)
3. Ve a la sección "Especiales en Tienda"
4. Intenta agregar o guardar un producto
5. Abre la consola del navegador (F12)
6. Verifica que NO aparezca el error `PERMISSION_DENIED`
7. Deberías ver: `Especiales Tienda saved to Firebase successfully`

## Verificar en Firebase Console

Para confirmar que los datos se guardaron:

1. Ve a Firebase Console > Realtime Database
2. Mira el árbol de datos
3. Deberías ver un nodo `especialesTienda` con tus productos

## Estructura de Datos Esperada

```
catalogomexiquense-default-rtdb
├── products
│   ├── 0: {...}
│   ├── 1: {...}
│   └── ...
├── especiales
│   ├── 0: {...}
│   ├── 1: {...}
│   └── ...
├── especialesTienda
│   ├── 0: {...}
│   ├── 1: {...}
│   └── ...
├── credits
│   ├── 0: {...}
│   └── ...
└── fcmTokens
    └── ...
```

## Solución de Problemas

### El error persiste después de cambiar las reglas

1. **Espera más tiempo**: Las reglas pueden tardar hasta 1 minuto en aplicarse
2. **Limpia caché**: 
   - Cierra y reabre el navegador
   - O usa modo incógnito
3. **Verifica las reglas**: Revisa que no haya errores de sintaxis JSON
4. **Revisa la URL**: Asegúrate de que `databaseURL` en tu código coincida con tu proyecto

### El error solo ocurre en "Especiales en Tienda"

Esto indica que las reglas específicamente bloquean el nodo `especialesTienda`. Asegúrate de incluir:

```json
"especialesTienda": {
  ".write": true
}
```

### Funciona en desarrollo pero no en producción

Si estás usando Firebase Authentication (Opción 2):
1. Asegúrate de que los usuarios estén autenticados
2. Implementa Firebase Authentication en tu aplicación
3. Verifica que el token de autenticación sea válido

## Mejores Prácticas

### Para Desarrollo
- Usa reglas abiertas (Opción 1) temporalmente
- Prueba todas las funcionalidades
- Migra a reglas seguras antes de lanzar

### Para Producción
- SIEMPRE usa autenticación (Opción 2)
- Nunca dejes reglas completamente abiertas
- Monitorea el uso de tu base de datos
- Establece límites de cuota
- Habilita backups automáticos

## Configuración de Firebase Authentication (Opcional)

Si decides usar la Opción 2, necesitarás implementar Firebase Authentication:

### 1. Habilita un Método de Autenticación

1. Ve a Firebase Console > Authentication
2. Haz clic en "Get Started"
3. En la pestaña "Sign-in method", habilita un proveedor:
   - **Email/Password** (más común)
   - Google
   - Facebook
   - Anónima (para testing)

### 2. Modifica el Código

En `index.html` o `script.js`, agrega autenticación antes de operaciones de escritura:

```javascript
// Autenticación anónima (más simple para empezar)
firebase.auth().signInAnonymously()
    .then(() => {
        console.log('Usuario autenticado');
        // Ahora puedes guardar datos
        saveEspecialesTienda();
    })
    .catch((error) => {
        console.error('Error de autenticación:', error);
    });
```

O con email/password:

```javascript
firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
        console.log('Usuario autenticado:', userCredential.user.email);
        // Ahora puedes guardar datos
        saveEspecialesTienda();
    })
    .catch((error) => {
        console.error('Error de autenticación:', error);
    });
```

## Recursos Adicionales

- [Firebase Realtime Database Rules](https://firebase.google.com/docs/database/security)
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com/)

## Resumen

✅ **Solución Rápida** (Desarrollo): Usa Opción 1 (reglas abiertas)
✅ **Solución Segura** (Producción): Usa Opción 2 (con autenticación)
✅ **Solución Alternativa**: Usa Opción 3 (solo con validación frontend)

Después de aplicar las reglas, el error `PERMISSION_DENIED` desaparecerá y podrás guardar productos en "Especiales en Tienda" normalmente.
