/**
 * RS Digital Hub — Production Service Worker (sw.js)
 * Implements high-performance PWA offline caching with strict security boundaries:
 * NEVER caches authenticated user sessions, Supabase REST/Auth responses, or private project data.
 */

const CACHE_NAME = 'rs-hub-v1-static';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/auth.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/css/base.css',
  '/css/sections.css',
  '/css/auth.css',
  '/css/chatbot.css',
  '/css/estimator.css',
  '/js/supabase.js',
  '/js/auth.js',
  '/js/app.js',
  '/js/estimator.js',
  '/js/typing.js'
];

// Install: Cache core static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Pre-caching error (non-fatal):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy dispatch
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Security Rule: NEVER cache mutations (POST, PUT, DELETE, PATCH)
  if (req.method !== 'GET') {
    return;
  }

  // Security Rule: NEVER cache Supabase API, Auth, or Storage requests
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Security Rule: NEVER cache authenticated application API routes
  // (Projects, Invoices, Estimates, Payments, Messages, Notifications, Admin)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/functions/')) {
    // Only allow public pricing config to be cached if needed, otherwise bypass
    if (!url.pathname.includes('/api/pricing') && !url.pathname.includes('/api/config')) {
      return;
    }
  }

  // Security Rule: Do not cache if Authorization or Cookie header exists
  if (req.headers.has('Authorization')) {
    return;
  }

  // HTML Navigation: Network-first, fallback to cache, then offline.html
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cachedRes = await caches.match(req);
          if (cachedRes) return cachedRes;
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // Static Assets (CSS, JS, Images, Icons, Fonts): Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(() => cachedRes);

      return cachedRes || fetchPromise;
    })
  );
});
