"use strict";

// Miftah service worker: offline app shell + data.
// - Shell (HTML/CSS/JS/fonts): stale-while-revalidate, ignoring ?v= cache-busters.
// - data/*.json: network-first so rebuilt data lands promptly; cache fallback offline.
// - Remote recitation audio: deliberately NOT intercepted — see AUDIO_HOSTS below.
const VERSION = "miftah-v39-letter-garden-major-candidate-20260915";
const SHELL_CACHE = `shell-${VERSION}`;
const DATA_CACHE = `data-${VERSION}`;

const SHELL = [
  "letters.html",
  "styles/letters.css",
  "styles/letters-animals.css",
  "styles/letters-art-pass.css",
  "styles/letters-map-world.css",
  "styles/letters-activities.css",
  "src/data/letters.js",
  "src/data/animals.js",
  "src/core/SoundSystem.js",
  "src/core/Haptics.js",
  "src/systems/ProgressionSystem.js",
  "src/letters/LettersAnimalArt.js",
  "src/letters/LettersArt.js",
  "src/letters/LettersDecorations.js",
  "src/letters/LettersState.js",
  "src/letters/LettersBoot.js",
  "src/letters/LettersStrength.js",
  "src/letters/LettersWorlds.js",
  "src/letters/GardenPractice.js",
  "src/letters/MiniGames.js",
  "src/letters/LettersGardenArt.js",
  "src/letters/LettersMapArt.js",
  "src/letters/LettersActivityArt.js",
  "src/letters/DecoratingGarden.js",
  "src/letters/LettersGame.js",
  "today.html",
  "today.js",
  "progress.html",
  "progress.js",
  "lessons.html",
  "lessons.js",
  "surahs.html",
  "trainer.html",
  "memorize.html",
  "memorize.js",
  "memorize.css",
  "memorize-entry.js",
  "memorize-entry.css",
  "glossary.html",
  "review.html",
  "follow.html",
  "follow.js",
  "styles.css",
  "review.css",
  "glossary.css",
  "app.js",
  "picker.js",
  "review.js",
  "glossary.js",
  "fsrs.js",
  "i18n.js",
  "strength.js",
  "tabbar.js",
  "src/core/RecitationAudio.js",
  "favicon.svg",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
  "manifest.webmanifest",
  "vendor/fonts/fonts.css",
  "vendor/fonts/uthmanic-hafs-v22.ttf",
  "vendor/fonts/amiri-quran-400-arabic.woff2",
  "vendor/fonts/amiri-quran-400-latin.woff2",
  "vendor/fonts/inter-latin.woff2",
  "vendor/fonts/noto-nastaliq-urdu-400.woff2",
  "vendor/fonts/inter-latin-ext.woff2",
];

const DATA = [
  "data/surah-1.json",
  "data/surah-105.json",
  "data/surah-106.json",
  "data/surah-107.json",
  "data/surah-108.json",
  "data/surah-109.json",
  "data/surah-110.json",
  "data/surah-111.json",
  "data/surah-112.json",
  "data/surah-113.json",
  "data/surah-114.json",
];

const AUDIO_HOSTS = new Set(["audio.qurancdn.com", "verses.quran.com"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)),
      caches.open(DATA_CACHE).then((cache) => cache.addAll(DATA)),
    ])
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, DATA_CACHE]);
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

  // Recitation audio: hands-off. Caching it here previously broke playback —
  // <audio> loads these cross-origin with no `crossOrigin` attribute, so the
  // request is no-cors/opaque, and the element issues byte-Range requests
  // (WebKit/Safari far more aggressively than Chromium). The Cache Storage
  // API throws on any attempt to store a 206 Partial Content response — even
  // an opaque one wrapping a 206 underneath — and that unawaited throw broke
  // recitation in production. Recitation is "a gift, never a blocker"
  // (see RecitationAudio.js) — it isn't worth re-fighting this for offline
  // replay of a few clips. Let the browser fetch it exactly as it always did.
  if (AUDIO_HOSTS.has(url.hostname)) return;

  if (url.origin !== location.origin) return;

  // Surah/manifest data: network-first so fresh builds win, cache offline.
  if (url.pathname.includes("/data/")) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        try {
          const res = await fetch(req);
          if (res.ok) await cache.put(url.origin + url.pathname, res.clone());
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
