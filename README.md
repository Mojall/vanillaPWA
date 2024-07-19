# Как создать PWA сайт и интегрировать Firebase
Этот гайд описывает процесс создания Progressive Web App (PWA) с интеграцией Firebase для пуш-уведомлений, а также процесс билда приложения через PWA Builder.

## Шаг 1: Настройка вашего проекта
Создайте базовый HTML файл (index.html) и добавьте необходимые метатеги и ссылки:

```html 
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PWA</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="manifest" href="manifest.json">
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
        import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging.js";
        import { VAPID_KEY, FIREBASE_CONFIG } from './config.js'
        
        const app = initializeApp(FIREBASE_CONFIG);
        const messaging = getMessaging(app);

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(function(registration) {
                    console.log('Service Worker registered with scope:', registration.scope);
                    
                    Notification.requestPermission()
                        .then(function(permission) {
                            if (permission === 'granted') {
                                console.log('Notification permission granted.');
                                
                                getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
                                    .then((currentToken) => {
                                        if (currentToken) {
                                            console.log('FCM Token:', currentToken);
                                            document.getElementById('fcm-token-display').textContent = currentToken;
                                        } else {
                                            console.log('No registration token available.');
                                        }
                                    })
                                    .catch((err) => {
                                        console.log('An error occurred while retrieving token.', err);
                                    });
                            } else {
                                console.error('Unable to get permission to notify.');
                            }
                        })
                        .catch(function(err) {
                            console.error('Error during permission request.', err);
                        });
                })
                .catch(function(err) {
                    console.error('Service Worker registration failed:', err);
                });
        }
    </script>
</head>
<body>
    <!-- Content goes here -->
</body>
</html>
```

## Шаг 2: Создание manifest.json
Создайте manifest.json в корневом каталоге проекта:

```json
{
  "name": "vanilapwa.ru",
  "short_name": "vanilapwa",
  "start_url": "/",
  "display": "fullscreen",
  "background_color": "#dc2f2f",
  "theme_color": "#dc2f2f",
  "orientation": "natural",
  "scope": "/",
  "lang": "ru",
  "icons": [
    {
      "src": "icons/android-chrome-512x512.png",
      "sizes": "36x36",
      "type": "image/png",
      "density": "0.75"
    },
    {
      "src": "icons/android-chrome-512x512.png",
      "sizes": "48x48",
      "type": "image/png",
      "density": "1.00"
    },
    {
      "src": "icons/android-chrome-512x512.png",
      "sizes": "72x72",
      "type": "image/png",
      "density": "1.50"
    },
    {
      "src": "icons/android-chrome-512x512.png",
      "sizes": "96x96",
      "type": "image/png",
      "density": "2.00"
    },
    {
      "src": "icons/android-chrome-512x512.png",
      "sizes": "144x144",
      "type": "image/png",
      "density": "3.00"
    },
    {
      "src": "icons/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "density": "5.00"
    }
  ],
  "id": "vanilapwa.ru",
  "description": "vanilapwa"
}
```

## Шаг 3: Настройка Firebase
Создайте файл config.js и добавьте в него свои данные из Firebase:
```js
export const VAPID_KEY = 'YOUR_VAPID_KEY';
export const FIREBASE_CONFIG = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```
## Шаг 4: Создание Service Worker (sw.js)
Создайте файл sw.js в корневом каталоге и добавьте следующий код:
```js
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js');
importScripts('./config.js')

firebase.initializeApp(FIREBASE_CONFIG);
const messaging = firebase.messaging();

// Событие установки сервис-воркера
self.addEventListener('install', event => {
    event.waitUntil(
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
    self.skipWaiting();
});

// Событие активации сервис-воркера
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== 'my-cache') {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Событие обработки запросов на ресурсы
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});

// Событие получения push-уведомлений
self.addEventListener('push', event => {
    const payload = event.data.json();
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icons/android-chrome-512x512.png'
    };

    event.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions));
});
```
Объяснение кода sw.js:

- Импорт библиотек Firebase:
Используем importScripts для загрузки Firebase библиотек для работы с Service Worker.

- Инициализация Firebase:
Инициализируем Firebase с использованием конфигурации из config.js.

- Установка Service Worker:
При установке Service Worker, мы кэшируем необходимые файлы для оффлайн-доступа.

- Активация Service Worker:
При активации удаляем старые кэши и захватываем управление клиентами.

- Обработка запросов:
При каждом запросе проверяем наличие ресурса в кэше. Если ресурс найден в кэше, возвращаем его, иначе делаем сетевой запрос.

- Обработка push-уведомлений:
При получении push-уведомления показываем его пользователю.

## Шаг 5: Билд приложения через PWA Builder
1. Перейдите на сайт PWA Builder.
2. Введите URL вашего сайта и нажмите "Start".
3. Следуйте инструкциям для создания PWA.
4. Чтобы убрать адресную строку и загрузить приложение в Google Play, добавьте файл assetlinks.json в папку .well-known.

## Заключение
Теперь у вас есть базовая настройка PWA с интеграцией Firebase и возможность билдить приложение через PWA Builder. Не забудьте настроить свои данные Firebase и проверить работоспособность приложения на всех этапах.#   v a n i l l a P W A  
 