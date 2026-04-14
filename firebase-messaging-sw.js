// PPC Rəqəmsal İdarəetmə Sistemi — Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD-m3D563Lf4sx3bpe0MxdbiZqHRP_0ATw",
  authDomain: "business-iddare-etme-sistemi.firebaseapp.com",
  databaseURL: "https://business-iddare-etme-sistemi-default-rtdb.firebaseio.com",
  projectId: "business-iddare-etme-sistemi",
  storageBucket: "business-iddare-etme-sistemi.firebasestorage.app",
  messagingSenderId: "286854322385",
  appId: "1:286854322385:web:dba379035c15cb38e2cdf0"
});

const messaging = firebase.messaging();

// Arxa planda gələn bildirişlər
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Background message:', payload);

  const { title, body, icon, badge, data } = payload.notification || {};
  const notifData = payload.data || {};

  const options = {
    body: body || notifData.body || 'Yeni bildiriş',
    icon: icon || '/ppc-icon-192.png',
    badge: badge || '/ppc-badge-72.png',
    vibrate: [200, 100, 200],
    tag: notifData.tag || 'ppc-notification',
    renotify: true,
    data: {
      url: notifData.url || '/',
      ...notifData
    },
    actions: notifData.actions ? JSON.parse(notifData.actions) : [
      { action: 'open',    title: 'Aç'      },
      { action: 'dismiss', title: 'Bağla'   }
    ]
  };

  self.registration.showNotification(
    title || notifData.title || 'PPC Sistem',
    options
  );
});

// Bildirişə klik
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('ppc') && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', url });
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// PWA offline cache
const CACHE_NAME = 'ppc-cache-v2';
const CACHE_URLS = [
  '/ppc-idare-sistemi.html',
  '/ppc-isci-portal.html',
  '/ppc-icon-192.png',
  '/ppc-icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_URLS.filter(u => u.endsWith('.png') === false));
    }).catch(() => {})
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
