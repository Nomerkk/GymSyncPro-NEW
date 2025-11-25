self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Notifikasi Baru';
  const options = {
    body: data.message || data.body || 'Anda memiliki notifikasi baru',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: {
      url: data.url || '/',
      notificationId: data.notificationId,
    },
    tag: data.tag || 'notification',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('pushsubscriptionchange', function(event) {
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: self.vapidPublicKey
    }).then(function(subscription) {
      return fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });
    })
  );
});

// -----------------------------------------
// Basic asset caching (Workbox-like minimal)
// -----------------------------------------
// Cache versioning to allow upgrades
const STATIC_CACHE = 'static-v4'; // bumped to clear old entries with POST requests
const RUNTIME_CACHE = 'runtime-v4';
// List of core assets to pre-cache (add icons, manifest, critical CSS if self-hosted)
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/og-image.png'
];

// Runtime cache buckets & limits
const IMAGE_CACHE = 'images-v1';
const FONT_CACHE = 'fonts-v1';
const MAX_IMAGE_ENTRIES = 60;
const MAX_FONT_ENTRIES = 10;
const MAX_IMAGE_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7d
const MAX_FONT_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30d

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (![STATIC_CACHE, RUNTIME_CACHE].includes(key)) {
          return caches.delete(key);
        }
      })
    ))
  );
  self.clients.claim();
});

// Strategy helpers
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const resp = await fetch(request);
    if (request.method === 'GET' && resp && resp.ok) {
      try { await cache.put(request, resp.clone()); } catch (_) { /* ignore */ }
    }
    return resp;
  } catch (e) {
    return cached || Promise.reject(e);
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  if (request.method !== 'GET') {
    // Never attempt to cache non-GET (avoids Cache.put POST error)
    return fetch(request).catch(() => cached || new Response('Offline', { status: 503 }));
  }
  const networkPromise = fetch(request).then((resp) => {
    if (resp && resp.ok) {
      try { cache.put(request, resp.clone()); } catch (_) { /* ignore */ }
    }
    return resp;
  }).catch(() => cached);
  return cached || networkPromise;
}

// Trim cache helper
async function trimCache(cacheName, maxEntries, maxAgeMs) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const now = Date.now();
  const entries = [];
  for (const request of keys) {
    const response = await cache.match(request);
    if (!response) continue;
    const dateHeader = response.headers.get('date');
    const time = dateHeader ? new Date(dateHeader).getTime() : now;
    entries.push({ request, time });
  }
  // Sort oldest first
  entries.sort((a,b) => a.time - b.time);
  // Remove aged-out
  for (const entry of entries) {
    if (now - entry.time > maxAgeMs) {
      await cache.delete(entry.request);
    }
  }
  // Remove overflow
  const refreshedKeys = await cache.keys();
  if (refreshedKeys.length > maxEntries) {
    const overflow = refreshedKeys.length - maxEntries;
    for (let i = 0; i < overflow; i++) {
      await cache.delete(entries[i].request);
    }
  }
}

// Fetch handler: different strategies by request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip all non-GET requests: let them hit network directly to avoid Cache PUT errors
  if (request.method !== 'GET') return;

  // Bypass for API auth endpoints to avoid stale auth state
  if (/\/api\/auth\//.test(url.pathname)) return; // always network

  // Fonts: cache-first with long expiration
  if (/\.(?:woff2?|ttf|otf)$/.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(FONT_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const resp = await fetch(request);
      if (resp.ok) {
        await cache.put(request, resp.clone());
        trimCache(FONT_CACHE, MAX_FONT_ENTRIES, MAX_FONT_AGE_MS);
      }
      return resp;
    })());
    return;
  }

  // Images: cache-first with moderate expiration
  if (/\.(?:png|jpg|jpeg|webp|avif|svg)$/.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(IMAGE_CACHE);
      const cached = await cache.match(request);
      if (cached) {
        // Stale cleanup in background
        trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES, MAX_IMAGE_AGE_MS);
        return cached;
      }
      const resp = await fetch(request);
      if (resp.ok) {
        await cache.put(request, resp.clone());
        trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES, MAX_IMAGE_AGE_MS);
      }
      return resp;
    })());
    return;
  }

  // Static JS/CSS -> existing cacheFirst strategy
  if (/\.(?:js|css)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Pages (HTML) & SPA navigation with offline fallback
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith((async () => {
      try {
        return await staleWhileRevalidate(request);
      } catch (e) {
        // Network failed; attempt offline fallback
        const cache = await caches.open(STATIC_CACHE);
        const cachedIndex = await cache.match('/index.html');
        return cachedIndex || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' }});
      }
    })());
    return;
  }

  // Fallback runtime strategy (GET only by earlier guard)
  event.respondWith(staleWhileRevalidate(request));
});
