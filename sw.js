"use strict";

// Miftah service worker: offline app shell + data + recitation audio.
// - Shell (HTML/CSS/JS/fonts): stale-while-revalidate, ignoring ?v= cache-busters.
// - data/*.json: network-first so rebuilt data lands promptly; cache fallback offline.
// - Remote recitation audio: cache-first (immutable files, opaque responses).
const VERSION = "miftah-v3";
const SHELL_CACHE = `shell-${VERSION}`;
const DATA_CACHE = `data-${VERSION}`;
const AUDIO_CACHE = "audio-v1"; // deliberately not versioned with the shell

const SHELL = [
  "surahs.html",
  "trainer.html",
  "glossary.html",
  "review.html",
  "styles.css",
  "review.css",
  "glossary.css",
  "app.js",
  "picker.js",
  "review.js",
  "glossary.js",
  "fsrs.js",
  "tabbar.js",
  "src/core/RecitationAudio.js",
  "favicon.svg",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
  "manifest.webmanifest",
  "vendor/fonts/fonts.css",
  "vendor/fonts/amiri-quran-400-arabic.woff2",
  "vendor/fonts/amiri-quran-400-latin.woff2",
  "vendor/fonts/inter-latin.woff2",
  "vendor/fonts/inter-latin-ext.woff2",
];

const AUDIO_HOSTS = new Set(["audio.qurancdn.com", "verses.quran.com"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, DATA_CACHE, AUDIO_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => !keep.has(n)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Recitation audio: immutable, cache-first, cached as it is played.
  if (AUDIO_HOSTS.has(url.hostname)) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok || res.type === "opaque") cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Surah/manifest data: network-first so fresh builds win, cache offline.
  if (url.pathname.includes("/data/")) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          const hit = await cache.match(req, { ignoreSearch: true });
          if (hit) return hit;
          throw new Error("offline and uncached: " + url.pathname);
        }
      })
    );
    return;
  }

  // App shell: stale-while-revalidate. Cache under the bare pathname so
  // ?v= busters and ?surah= navigations read AND write the same entry —
  // otherwise the revalidated copy lands under a new key and the stale
  // install-time entry keeps winning.
  const key = url.origin + url.pathname;
  event.respondWith(
    caches.open(SHELL_CACHE).then(async (cache) => {
      const hit = await cache.match(key);
      const refresh = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(key, res.clone());
          return res;
        })
        .catch(() => hit);
      return hit || refresh;
    })
  );
});
