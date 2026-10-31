const CACHE_NAME = 'student-app-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients ? self.clients.claim() : Promise.resolve());
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through for now, just to satisfy PWA requirements
  event.respondWith(fetch(event.request));
});
