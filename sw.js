const CACHE = 'english-lab-shell-v2';
const FILES = [
  './',
  './index.html',
  './css/app.css',
  './js/util.js',
  './js/checker.js',
  './js/srs.js',
  './js/lesson-data.js',
  './js/subtitles.js',
  './js/breakdown.js',
  './js/storage.js',
  './js/lookup.js',
  './js/drive.js',
  './js/lesson.js',
  './js/vocab.js',
  './js/cinema.js',
  './js/app.js',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.all(FILES.map(file => cache.add(file).catch(() => null)))));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match('./index.html'))));
});
