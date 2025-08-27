/**
 * Service Worker für BuildWise - Intelligentes Caching
 * Verhindert STRG+R-Probleme durch strategisches Asset-Caching
 */

const CACHE_NAME = 'buildwise-v1';
const RUNTIME_CACHE = 'buildwise-runtime-v1';

// Assets die gecacht werden sollen
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Vite generiert diese zur Laufzeit, daher dynamisch
];

// Assets die NICHT gecacht werden sollen
const NO_CACHE_PATTERNS = [
  /\/api\//,           // API-Calls
  /\/_vite\//,         // Vite HMR
  /\.hot-update\./,    // Hot updates
  /sockjs-node/,       // WebSocket
  /\?.*_cb=/,          // Cache-busting Parameter
];

// Cache-Strategien für verschiedene Asset-Typen
const CACHE_STRATEGIES = {
  // Statische Assets - Cache First mit Fallback
  static: {
    pattern: /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
    strategy: 'CacheFirst',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Tage
  },
  // HTML - Network First für aktuelle Inhalte
  html: {
    pattern: /\.html$/,
    strategy: 'NetworkFirst',
    maxAge: 24 * 60 * 60 * 1000, // 1 Tag
  },
  // API - Network Only (kein Cache)
  api: {
    pattern: /\/api\//,
    strategy: 'NetworkOnly',
    maxAge: 0,
  }
};

/**
 * Installation - Cache initialisieren
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Sofort aktivieren
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

/**
 * Aktivierung - Alte Caches löschen
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Sofort Kontrolle übernehmen
        return self.clients.claim();
      })
  );
});

/**
 * Fetch - Intelligente Cache-Strategien
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignoriere nicht-GET Requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignoriere Cross-Origin Requests (außer APIs)
  if (url.origin !== location.origin && !url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Prüfe ob Request gecacht werden soll
  if (shouldNotCache(request.url)) {
    console.log('[SW] Not caching:', request.url);
    return;
  }
  
  // Bestimme Cache-Strategie
  const strategy = getCacheStrategy(request.url);
  
  event.respondWith(
    handleRequest(request, strategy)
      .catch((error) => {
        console.error('[SW] Fetch failed:', error);
        return new Response('Network error', { status: 503 });
      })
  );
});

/**
 * Prüft ob eine URL nicht gecacht werden soll
 */
function shouldNotCache(url) {
  return NO_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Bestimmt die Cache-Strategie für eine URL
 */
function getCacheStrategy(url) {
  for (const [name, config] of Object.entries(CACHE_STRATEGIES)) {
    if (config.pattern.test(url)) {
      return config;
    }
  }
  
  // Standard: Network First
  return {
    strategy: 'NetworkFirst',
    maxAge: 60 * 60 * 1000 // 1 Stunde
  };
}

/**
 * Behandelt Request basierend auf Strategie
 */
async function handleRequest(request, strategy) {
  switch (strategy.strategy) {
    case 'CacheFirst':
      return cacheFirst(request, strategy);
    case 'NetworkFirst':
      return networkFirst(request, strategy);
    case 'NetworkOnly':
      return fetch(request);
    default:
      return networkFirst(request, strategy);
  }
}

/**
 * Cache First Strategie
 */
async function cacheFirst(request, strategy) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    // Prüfe Alter des Cache-Eintrags
    const cacheDate = cached.headers.get('sw-cached-date');
    if (cacheDate) {
      const age = Date.now() - parseInt(cacheDate);
      if (age < strategy.maxAge) {
        console.log('[SW] Cache hit:', request.url);
        return cached;
      }
    }
  }
  
  // Lade von Netzwerk und cache
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseToCache = response.clone();
      // Füge Cache-Datum hinzu
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', Date.now().toString());
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
      console.log('[SW] Cached:', request.url);
    }
    return response;
  } catch (error) {
    // Fallback zu Cache bei Netzwerk-Fehler
    if (cached) {
      console.log('[SW] Network failed, using cache:', request.url);
      return cached;
    }
    throw error;
  }
}

/**
 * Network First Strategie
 */
async function networkFirst(request, strategy) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache erfolgreiche Antworten
      const cache = await caches.open(RUNTIME_CACHE);
      const responseToCache = response.clone();
      
      // Füge Cache-Datum hinzu
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', Date.now().toString());
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
      console.log('[SW] Network success, cached:', request.url);
    }
    
    return response;
  } catch (error) {
    // Fallback zu Cache
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('[SW] Network failed, using cache:', request.url);
      return cached;
    }
    
    throw error;
  }
}

/**
 * Message Handler für Cache-Kontrolle
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'CLEAR_CACHE':
      clearAllCaches()
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;
      
    case 'GET_CACHE_STATS':
      getCacheStats()
        .then((stats) => {
          event.ports[0].postMessage({ success: true, data: stats });
        })
        .catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;
      
    case 'INVALIDATE_CACHE':
      invalidateCache(payload.pattern)
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;
  }
});

/**
 * Löscht alle Caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('[SW] All caches cleared');
}

/**
 * Ermittelt Cache-Statistiken
 */
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = keys.length;
  }
  
  return stats;
}

/**
 * Invalidiert Cache-Einträge basierend auf Pattern
 */
async function invalidateCache(pattern) {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    for (const request of keys) {
      if (new RegExp(pattern).test(request.url)) {
        await cache.delete(request);
        console.log('[SW] Invalidated cache for:', request.url);
      }
    }
  }
}

console.log('[SW] Service Worker loaded');
