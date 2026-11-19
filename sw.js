// Chopka's offline worker (docs/CHOPKA_GAUTH_SPEC.md G21, WP-PWA B item 4). Scope ./ (the page's own folder).
// It keeps the page, the manifest and the icons under a cache named for the page's SHA-256, so a new page means a new
// worker. Navigations go to the network first; the network's answer is used and never stored, and only when the network
// fails is the kept page served. Every other request passes through untouched: nothing to Supabase and no request made
// with cache "no-store" (the page fingerprint) is ever answered from or written to the cache. No push, no sync, no messages.
"use strict";
const PAGE_SHA256 = "45d220030d75df769f345a014bf5b151a140d22f00b434a0420828c88f235b74";
const CACHE = "chopka-" + PAGE_SHA256;
const PRECACHE = [
  "./",
  "manifest.webmanifest",
  "icons/apple-touch-icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || req.mode !== "navigate" || req.cache === "no-store") return;
  if (new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req).catch(() => caches.open(CACHE).then((c) => c.match("./")).then((page) => page || Response.error())),
  );
});
