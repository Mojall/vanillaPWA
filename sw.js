importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js');
importScripts('./config.js')

firebase.initializeApp(FIREBASE_CONFIG);
const messaging = firebase.messaging();

// Событие установки сервис-воркера\
self.addEventListener('install', event => {
    event.waitUntil(
        // Открываем кэш и добавляем в него необходимые файлы
        caches.open('my-cache').then(cache => {
            return cache.addAll([
                '/index.html',
                '/styles.css',
                '/scripts/formHandler.js',
                '/scripts/navigation.js',
                '/icons/android-chrome-192x192.png',
                '/icons/android-chrome-512x512.png'
            ]);
        })
    );
    self.skipWaiting(); // Пропускаем этап ожидания и сразу активируем новый воркер
});

// Событие активации сервис-воркера
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Удаляем старые кэши, оставляя только актуальные
                    if (cacheName !== 'my-cache') {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Захватываем управление клиентами
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            // Если запрашиваемый ресурс есть в кэше, возвращаем его, иначе выполняем сетевой запрос
            return response || fetch(event.request);
        })
    );
});

//Черновики

// onMessage(messaging, (payload) => {
//     if (document.visibilityState === 'visible') {
//         console.log('Message received. ', payload);
//         const notificationTitle = payload.notification.title;
//         const notificationOptions = {
//             body: payload.notification.body,
//             icon: '/icons/android-chrome-512x512.png'
//         };
//
//         new Notification(notificationTitle, notificationOptions);
//     }
// });

// self.addEventListener('push', event => {
//     const payload = event.data.json();
//     const notificationTitle = payload.notification.title;
//     const notificationOptions = {
//         body: payload.notification.body,
//         icon: '/icons/android-chrome-512x512.png'
//     };
//
//     event.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions));
// });