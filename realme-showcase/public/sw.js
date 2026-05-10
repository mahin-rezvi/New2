/**
 * Service Worker for Realme Showcase
 * Enables offline support, caching, and better performance
 */

const CACHE_VERSION = "v1.0.0";
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Cache strategies
const CACHE_STRATEGIES = {
  images: {
    name: IMAGE_CACHE,
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  api: {
    name: API_CACHE,
    ttl: 60 * 60 * 1000, // 1 hour
  },
  pages: {
    name: RUNTIME_CACHE,
    ttl: 24 * 60 * 60 * 1000, // 1 day
  },
};

// List of assets to cache on install
const CRITICAL_ASSETS = [
  "/",
  "/offline.html",
];

// Install event: cache critical assets
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installing...");
  
  event.waitUntil(
    caches.open(RUNTIME_CACHE).then((cache) => {
      console.log("[ServiceWorker] Caching critical assets");
      return cache.addAll(CRITICAL_ASSETS).catch(() => {
        console.log("[ServiceWorker] Some critical assets failed to cache");
      });
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// Activate event: clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activating...");
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== RUNTIME_CACHE &&
            cacheName !== IMAGE_CACHE &&
            cacheName !== API_CACHE &&
            cacheName.startsWith("runtime-") ||
            cacheName.startsWith("images-") ||
            cacheName.startsWith("api-")
          ) {
            console.log("[ServiceWorker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "CACHE_UPDATED" });
        });
      });
    })
  );
});

// Fetch event: implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome extensions and other non-http(s) protocols
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Handle image requests
  if (isImageRequest(request)) {
    event.respondWith(cacheImageStrategy(request));
    return;
  }

  // Handle API requests
  if (isApiRequest(request)) {
    event.respondWith(cacheApiStrategy(request));
    return;
  }

  // Handle page requests
  if (isPageRequest(request)) {
    event.respondWith(cachePageStrategy(request));
    return;
  }

  // Default: network first
  event.respondWith(networkFirst(request));
});

/**
 * Cache strategy for images: Cache first, fallback to network
 */
async function cacheImageStrategy(request) {
  const cache = await caches.open(CACHE_STRATEGIES.images.name);
  const cached = await cache.match(request);

  if (cached) {
    // Update cache in background
    fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      })
      .catch(() => {
        // Network error, use cached version
      });

    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return a fallback placeholder image
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
        <rect fill="#333" width="400" height="400"/>
        <text x="50%" y="50%" fill="#999" font-size="20" text-anchor="middle" dy=".3em">Image unavailable</text>
      </svg>`,
      {
        headers: { "Content-Type": "image/svg+xml" },
      }
    );
  }
}

/**
 * Cache strategy for API: Network first, fallback to cache
 */
async function cacheApiStrategy(request) {
  const cache = await caches.open(CACHE_STRATEGIES.api.name);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    return new Response(
      JSON.stringify({ error: "Offline - cached data unavailable" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Cache strategy for pages: Cache first, network fallback
 */
async function cachePageStrategy(request) {
  const cache = await caches.open(CACHE_STRATEGIES.pages.name);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return offline page if available
    const offlinePageUrl = "/offline.html";
    const offlinePage = await cache.match(offlinePageUrl);
    return offlinePage || new Response("Offline - page unavailable", { status: 503 });
  }
}

/**
 * Network first strategy: try network, fallback to cache
 */
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return cache.match(request) || new Response("Offline", { status: 503 });
  }
}

/**
 * Utility functions to determine request type
 */
function isImageRequest(request) {
  return /\.(jpg|jpeg|png|gif|svg|webp|avif)$/i.test(request.url) ||
         request.headers.get("accept")?.includes("image");
}

function isApiRequest(request) {
  return request.url.includes("/api/") || request.url.includes("/data/");
}

function isPageRequest(request) {
  return request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");
}

// Handle messages from clients
self.addEventListener("message", (event) => {
  if (event.data.type === "CACHE_CLEAR") {
    caches.keys().then((cacheNames) => {
      Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
        .then(() => {
          event.ports[0].postMessage({ success: true });
        });
    });
  }

  if (event.data.type === "GET_CACHE_SIZE") {
    estimateCacheSize().then((size) => {
      event.ports[0].postMessage({ cacheSize: size });
    });
  }
});

// Estimate cache size
async function estimateCacheSize() {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
}

console.log("[ServiceWorker] Loaded successfully");
