const CACHE_NAME = 'notes-cache-v2';
const DYNAMIC_CACHE_NAME = 'dynamic-content-v1';

const ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/icons/icon-48x48.png',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        fetch(event.request)
            .then(networkRes => {
                const resClone = networkRes.clone();
                caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                    cache.put(event.request, resClone);
                });
                return networkRes;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

self.addEventListener('push', (event) => {
    console.log('[SW] Получено push-сообщение');
    
    let data = {
        title: 'Новое уведомление',
        body: '',
        reminderId: null,
        reminderText: null
    };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }
    
    const options = {
        body: data.body,
        icon: '/icons/icon-152x152.png',
        badge: '/icons/icon-48x48.png',
        vibrate: [200, 100, 200],
        data: {
            reminderId: data.reminderId,
            reminderText: data.reminderText,
            url: '/'
        }
    };
    
    if (data.reminderId) {
        options.actions = [
            {
                action: 'snooze',
                title: 'Отложить на 5 минут'
            }
        ];
    }
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;
    
    if (action === 'snooze') {
        const reminderId = notification.data.reminderId;
        const reminderText = notification.data.reminderText;
        
        console.log('[SW] Откладывание напоминания', reminderId);
        
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then(clientsList => {
                    if (clientsList.length > 0) {
                        clientsList[0].postMessage({
                            type: 'SNOOZE_REMINDER',
                            reminderId: reminderId,
                            reminderText: reminderText
                        });
                    }
                    notification.close();
                })
        );
    } else {
        notification.close();
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});