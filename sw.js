self.addEventListener('fetch', (event) => {
  // If the request is for a navigation (the page itself), 
  // skip the service worker and go straight to the network.
  if (event.request.mode === 'navigate') {
    return;
  }
  
  // For other requests (like assets or API calls), use the network.
  event.respondWith(fetch(event.request).catch(() => {
    // Optional: Add basic error handling here if a fetch fails
    console.error('Fetch failed for:', event.request.url);
  }));
});
