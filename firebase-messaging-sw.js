// PPC Service Worker v3 — GitHub Pages PWA
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const CACHE_NAME = 'ppc-v3';

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

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(c =>
      c.addAll(['./ppc-idare-sistemi.html','./ppc-isci-portal.html']).catch(()=>{})
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  if (url.includes('firebase') || url.includes('googleapis') ||
      url.includes('gstatic') || url.includes('fonts.google')) return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r.ok) caches.open(CACHE_NAME).then(c => c.put(e.request, r.clone()));
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});

messaging.onBackgroundMessage(payload => {
  const d = payload.notification || payload.data || {};
  self.registration.showNotification(d.title || 'PPC Sistem', {
    body: d.body || 'Yeni bildiriş',
    icon: './ppc-icon-192.png',
    badge: './ppc-badge-72.png',
    vibrate: [200,100,200],
    tag: 'ppc-notif',
    renotify: true,
    data: { url: d.url || './ppc-isci-portal.html' }
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = e.notification.data?.url || './ppc-isci-portal.html';
  e.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(list => {
      for (const c of list) {
        if (c.url.includes('ppc') && 'focus' in c) {
          c.postMessage({type:'NAV', url:target});
          return c.focus();
        }
      }
      return clients.openWindow(target);
    })
  );
});
