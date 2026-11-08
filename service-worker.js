/**
 * Video Multitool - Service Worker (PWA)
 * Cacht die App-Shell für sofortiges Laden auf dem iPad.
 * Cacht NIEMALS API-Requests oder Videodateien!
 */

const CACHE_NAME = "vmt-shell-v1";
const STATIC_ASSETS = [
    "./",
    "./index.html",
    "./styles.css",
    "./config.js",
    "./storage.js",
    "./ui.js",
    "./api.js",
    "./app.js",
    "./manifest.webmanifest",
    "./icons/icon.svg"
];

// Install: Statische Assets cachen
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate: Veraltete Caches bereinigen
self.addEventListener("activate", (event) => {
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

// Fetch: App-Shell aus dem Cache laden, API- und Video-Downloads immer direkt über Netzwerk
self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Niemals API-Aufrufe, POST-Requests oder Datei-Downloads im Service Worker cachen
    if (request.method !== "GET" || url.pathname.includes("/api/") || url.pathname.endsWith(".mp4") || url.pathname.endsWith(".mp3")) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then((networkResponse) => {
                // Bei erfolgreicher Antwort Cache aktualisieren (Network-First für HTML/CSS)
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                }
                return networkResponse;
            })
            .catch(() => {
                // Fallback auf Cache falls offline
                return caches.match(request);
            })
    );
});
