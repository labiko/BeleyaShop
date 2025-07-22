const CACHE_NAME = 'beleyashop-v2';
const urlsToCache = [
  '/',
  '/home',
  '/tabs/home',
  '/tabs/catalog', 
  '/tabs/cart',
  '/assets/logo.png',
  '/assets/placeholder-product.jpg',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('googleapis.com') &&
      !event.request.url.includes('gstatic.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Clone the request because it can only be used once
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response because it can only be used once
          const responseToCache = response.clone();

          // Cache the fetched response
          caches.open(CACHE_NAME)
            .then((cache) => {
              // Only cache GET requests
              if (event.request.method === 'GET') {
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        }).catch(() => {
          // If network fails, try to return cached version
          return caches.match('/') || new Response('App is offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/html'
            })
          });
        });
      }
    )
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});