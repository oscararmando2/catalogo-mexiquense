// Firebase Cloud Messaging Service Worker
// Este archivo debe estar en la raíz del proyecto (no en subdirectorios)
// Se ejecuta en segundo plano para manejar notificaciones push

// Importar Firebase Messaging para service workers
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Configuración de Firebase (debe coincidir con la del archivo principal)
// IMPORTANTE: Reemplazar con tus credenciales reales de Firebase
const firebaseConfig = {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "catalogomexiquense.firebaseapp.com",
    databaseURL: "https://catalogomexiquense-default-rtdb.firebaseio.com",
    projectId: "catalogomexiquense",
    storageBucket: "catalogomexiquense.appspot.com",
    messagingSenderId: "TU_SENDER_ID_AQUI",
    appId: "TU_APP_ID_AQUI"
};

// Inicializar Firebase en el service worker
firebase.initializeApp(firebaseConfig);

// Obtener instancia de Firebase Messaging
const messaging = firebase.messaging();

// Manejar notificaciones en segundo plano (cuando la aplicación no está en primer plano)
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Notificación en segundo plano recibida:', payload);
    
    // Extraer información del payload
    const notificationTitle = payload.notification?.title || 'Nuevo Producto';
    const notificationOptions = {
        body: payload.notification?.body || 'Se agregó un nuevo Producto al catálogo',
        icon: payload.notification?.icon || '/apple-touch-icon-180x180.png',
        badge: '/apple-touch-icon.png',
        tag: 'new-product', // Agrupar notificaciones similares
        requireInteraction: false, // La notificación se cierra automáticamente
        data: {
            productId: payload.data?.productId,
            productUrl: payload.data?.productUrl || '/',
            dateAdded: payload.data?.dateAdded || Date.now()
        }
    };
    
    // Mostrar la notificación
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar el clic en la notificación
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notificación clickeada:', event.notification);
    
    // Cerrar la notificación
    event.notification.close();
    
    // Obtener la URL del producto desde los datos de la notificación
    const productUrl = event.notification.data?.productUrl || '/';
    const productId = event.notification.data?.productId;
    
    // Construir URL completa para el producto
    // Si hay un productId, añadirlo como parámetro de consulta para que la app pueda mostrarlo
    const targetUrl = productId 
        ? `${self.location.origin}/?product=${productId}` 
        : `${self.location.origin}${productUrl}`;
    
    // Abrir o enfocar la ventana de la aplicación
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Buscar si ya hay una ventana abierta con la aplicación
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    // Si encontramos una ventana abierta en el mismo origen, enfocarla y navegar
                    if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                        client.focus();
                        return client.navigate(targetUrl);
                    }
                }
                // Si no hay ventana abierta, abrir una nueva
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
    );
});

// Manejar errores del service worker
self.addEventListener('error', (event) => {
    console.error('[firebase-messaging-sw.js] Error en service worker:', event.error);
});

console.log('[firebase-messaging-sw.js] Service worker de Firebase Messaging cargado correctamente');
