// sw.js - Minimal pass-through for troubleshooting
self.addEventListener('fetch', (event) => {
  // This tells the Service Worker to skip the cache and go straight to the network.
  // Your app content will load exactly like a normal website.
  event.respondWith(fetch(event.request));
});
