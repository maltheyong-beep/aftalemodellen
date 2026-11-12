/* Offlinecache for denne version af tavlemodellen. Kun eget scope berøres. */
"use strict";

const PREFIX = "aftalemodellen:" + new URL(self.registration.scope).pathname + ":";
const CACHE_NAME = PREFIX + "tavle-2026-11-12-v4";
const CORE = ["./", "./index.html", "./style.css", "./script.js", "./manifest.json", "./README.md"];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Friske filer ved opdatering. En ufuldstændig installation aktiveres ikke.
    await cache.addAll(CORE.map(path => new Request(new URL(path, self.registration.scope), {
      cache: "reload"
    })));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (response.ok && response.type === "basic") await cache.put(request, response.clone());
      return response;
    } catch {
      const saved = await cache.match(request, {
        ignoreSearch: true
      });
      if (saved) return saved;
      if (request.mode === "navigate") {
        const page = await cache.match(new URL("./index.html", self.registration.scope));
        if (page) return page;
      }
      return Response.error();
    }
  })());
});
