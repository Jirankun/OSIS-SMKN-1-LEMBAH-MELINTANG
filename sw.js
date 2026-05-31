// ================================================
// SERVICE WORKER - OSIS SMKN 1 LEMBAH MELINTANG
// Strategi: Stabil balance — cepat online, graceful offline
// Versi: 1.0.0
// ================================================

const SW_VERSION = 'v1';
const CACHE_NAME = 'osis-cache-' + SW_VERSION;
const STATIC_CACHE = 'osis-static-' + SW_VERSION;
const DYNAMIC_CACHE = 'osis-dynamic-' + SW_VERSION;

// ================================================
// PRECACHE LIST — File inti yang harus tersedia offline
// ================================================
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/config.js',
  '/style/global/style.css',
  '/style/home/style.css',
  '/script/utils/helpers.js',
  '/script/utils/theme.js',
  '/script/cookie-toast.js',
  '/script/analisis.js',
  '/img/asset/logo.webp',
  '/img/asset/icon.ico',
  '/img/asset/icon0.png',
  '/404.html'
];

// ================================================
// INSTALL — Precache core assets
// ================================================
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(function(cache) {
        // Precache semua file inti
        return cache.addAll(PRECACHE_URLS).catch(function(err) {
          // Jika salah satu file gagal, tetap lanjut (graceful)
          console.warn('[SW] Precache partial failure:', err);
        });
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

// ================================================
// ACTIVATE — Hapus cache lama, ambil alih halaman
// ================================================
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(name) {
          if (
            name !== STATIC_CACHE &&
            name !== DYNAMIC_CACHE &&
            name !== CACHE_NAME
          ) {
            return caches.delete(name);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ================================================
// FETCH — Strategi caching per tipe konten
// ================================================
self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);

  // === Skip non-GET requests (POST form, etc) — Cache API hanya support GET ===
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // === Hanya handle request sendiri (bukan CDN eksternal) ===
  // Biarin CDN resources (Font Awesome, Google Fonts, GA4, Cloudflare) pake cache browser aja
  if (url.origin !== self.location.origin) {
    // Untuk CDN Font Awesome, Google Fonts — cache-first (stabil)
    if (
      url.hostname.includes('cdnjs.cloudflare.com') ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com') ||
      url.hostname.includes('cdn.jsdelivr.net')
    ) {
      event.respondWith(
        caches.match(request).then(function(cached) {
          var fetchPromise = fetch(request).then(function(response) {
            if (response && response.ok) {
              var copy = response.clone();
              caches.open(DYNAMIC_CACHE).then(function(cache) {
                cache.put(request, copy);
              });
            }
            return response;
          }).catch(function() {
            return cached;
          });
          return cached || fetchPromise;
        })
      );
      return;
    }
    // CDN lainnya (analytics, dll) — network only
    return;
  }

  // === SKIP: Exam page & sensitive content (jangan pernah di-cache) ===
  if (
    url.pathname.includes('/page/exam/') ||
    url.pathname.includes('/page/exam') ||
    url.pathname.includes('ujian_tes.json')
  ) {
    event.respondWith(fetch(request).catch(function() {
      return new Response('', { status: 503, statusText: 'Offline' });
    }));
    return;
  }

  // === STRATEGI 1: HTML pages — Network First ===
  // Selalu ambil dari server, fallback ke cache kalo offline
  if (request.mode === 'navigate' || (request.headers.get('Accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(request).then(function(response) {
        if (response && response.ok) {
          var copy = response.clone();
          caches.open(DYNAMIC_CACHE).then(function(cache) {
            cache.put(request, copy);
          });
        }
        return response;
      }).catch(function() {
        // Offline — coba dari cache dulu
        return caches.match(request).then(function(cached) {
          if (cached) return cached;
          // Fallback ke offline page
          return caches.match('/offline.html');
        });
      })
    );
    return;
  }

  // === STRATEGI 2: Static assets (CSS, JS, images) — Cache First ===
  // Cepet banget, update di background
  if (
    url.pathname.match(/\.(css|js|mjs)$/) ||
    url.pathname.match(/\.(webp|png|jpg|jpeg|gif|svg|ico|avif)$/) ||
    url.pathname.match(/\.(woff2?|ttf|eot|otf)$/)
  ) {
    event.respondWith(
      caches.match(request).then(function(cached) {
        var fetchPromise = fetch(request).then(function(response) {
          if (response && response.ok) {
            var copy = response.clone();
            caches.open(STATIC_CACHE).then(function(cache) {
              cache.put(request, copy);
            });
          }
          return response;
        }).catch(function() {
          return cached;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // === STRATEGI 3: JSON content — Network First ===
  // Content berubah dari admin panel, tapi tetap ada fallback offline
  if (url.pathname.match(/\.json$/)) {
    event.respondWith(
      fetch(request).then(function(response) {
        if (response && response.ok) {
          var copy = response.clone();
          caches.open(DYNAMIC_CACHE).then(function(cache) {
            cache.put(request, copy);
          });
        }
        return response;
      }).catch(function() {
        return caches.match(request);
      })
    );
    return;
  }

  // === STRATEGI 4: Lainnya — Network First ===
  event.respondWith(
    fetch(request).then(function(response) {
      if (response && response.ok && response.type === 'basic') {
        var copy = response.clone();
        caches.open(DYNAMIC_CACHE).then(function(cache) {
          cache.put(request, copy);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(request);
    })
  );
});
