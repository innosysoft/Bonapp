// Service Worker עבור PWA
const CACHE_NAME = 'school-meals-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

// התקנה - Cache קבצים סטטיים
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch - טען מ-Cache או מהרשת
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // מצא ב-Cache - החזר
        if (response) {
          return response;
        }
        
        // לא מצא - טען מהרשת
        return fetch(event.request).then((response) => {
          // בדוק אם התגובה תקינה
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // שמור בCache לפעם הבאה
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Activate - נקה Cache ישן
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push Notifications (אופציונלי לעתיד)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'התראה חדשה',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('ארוחות בית ספר', options)
  );
});
