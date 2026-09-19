"use strict";

// Miftah service worker: offline app shell + data.
// - Shell (HTML/CSS/JS/fonts): stale-while-revalidate, ignoring ?v= cache-busters.
// - data/*.json: network-first so rebuilt data lands promptly; cache fallback offline.
// - Remote recitation audio: deliberately NOT intercepted — see AUDIO_HOSTS below.
const VERSION = "miftah-v48-letter-garden-boat-adventure-20260918";
const SHELL_CACHE = `shell-${VERSION}`;
const DATA_CACHE = `data-${VERSION}`;

const SHELL = [
  // BEGIN MARIN CURRICULUM AUDIO
  "assets/audio/letters/marin-curriculum-v1/lg-0f4c7785aba9.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-9398dd2463eb.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-cf74c943ec31.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-94eee3c61cac.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-cb624b7d0ef4.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-9e233c3067bd.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-6f7ddec18d79.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-7af96a47a4b6.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-73d38b2d5bed.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-f9b77a966b34.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-98c207c85669.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-3062586698e2.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-41a5ef4bf942.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-2f846091a5f9.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-7242f6a466e3.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-ccd65ecf3ee7.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-5e79a2002dd0.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-f26ead2a68a3.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-07f25640a2b9.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-a92c18c9f482.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-f663e61203ed.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-c7d727cb3393.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-628d855112ee.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-c8846e99d100.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-50fede0b75aa.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-07324b4a3020.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-94d3b4fa6e7f.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-de88736412f6.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-81d4f87ac87d.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-cfc53afaefe5.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-1b42fe0a2f60.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-ce78ac63493c.wav",
  // END MARIN CURRICULUM AUDIO
  "src/letters/LetterVoiceClips.js",
  "src/letters/LettersVoice.js",
  "assets/audio/letters/marin-v1/alif.wav",
  "assets/audio/letters/marin-v1/ba.wav",
  "assets/audio/letters/marin-v1/ta.wav",
  "assets/audio/letters/marin-v1/tha.wav",
  "assets/audio/letters/marin-v1/jeem.wav",
  "assets/audio/letters/marin-v1/haa.wav",
  "assets/audio/letters/marin-v1/khaa.wav",
  "assets/audio/letters/marin-v1/dal.wav",
  "assets/audio/letters/marin-v1/dhal.wav",
  "assets/audio/letters/marin-v1/ra.wav",
  "assets/audio/letters/marin-v1/zay.wav",
  "assets/audio/letters/marin-v1/sheen.wav",
  "assets/audio/letters/marin-v1/saad.wav",
  "assets/audio/letters/marin-v1/daad.wav",
  "assets/audio/letters/marin-v1/taa.wav",
  "assets/audio/letters/marin-v1/zaa.wav",
  "assets/audio/letters/marin-v1/ayn.wav",
  "assets/audio/letters/marin-v1/ghayn.wav",
  "assets/audio/letters/marin-v1/fa.wav",
  "assets/audio/letters/marin-v1/qaf.wav",
  "assets/audio/letters/marin-v1/kaf.wav",
  "assets/audio/letters/marin-v1/lam.wav",
  "assets/audio/letters/marin-v1/meem.wav",
  "assets/audio/letters/marin-v1/noon.wav",
  "assets/audio/letters/marin-v1/ha.wav",

  "letters.html",
  "styles/letters-rooms.css",
  "styles/letters-composition.css",
  "styles/letters-journey.css",
  "styles/letters-delivery.css",
  "styles/letters-motion.css",
  "styles/letters-learning.css",
  "styles/letters-drawing.css",
  "src/letters/LettersRoomArt.js",
  "src/letters/LettersLearning.js",
  "src/letters/LettersSound.js",
  "src/letters/LetterDelivery.js",
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
  "src/letters/LettersJourney.js",
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
