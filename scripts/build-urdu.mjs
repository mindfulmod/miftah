// Builds the Urdu word-by-word layer (spec: specs/01-trainer-v2.md).
//
// The Urdu data lives in PARALLEL files — data/urdu/surah-N.json — so the
// verified English surah files are never touched and English-only users never
// download a byte of it. Alignment with the English files is verified the
// same uncompromising way build-data.mjs verifies Arabic:
//
//   1. Word-by-word Urdu glosses come from the Quran.com API v4 (the same
//      source and the same word segmentation as the English set).
//   2. For every ayah, the word COUNT must match data/surah-N.json, and every
//      word's Uthmani text must be byte-identical to the stored Arabic at the
//      same position. One mismatch and the surah is not written.
//   3. Every ayah must have a non-empty flowing tarjuma (Muhammad Junagarhi
//      via AlQuran.cloud — the most literal of the widely-used Urdu
//      translations, so it sits closest to the word-by-word layer; swap
//      EDITION below if the family prefers Maududi or another voice).
//      Word glosses MAY be empty (~0.36% Quran-wide, merged-phrase cases) —
//      those are counted in `gaps` and the client shows English there.
//
// Output shape (compact — glosses as a position-aligned array):
//   { surah, edition, generatedAt, ayahs: [{ number, translation, words: [gloss…] }] }
//
// Run:
//   node scripts/build-urdu.mjs            # Al-Fatihah only
//   node scripts/build-urdu.mjs 36         # one surah
//   node scripts/build-urdu.mjs 78-114     # a range
//   node scripts/build-urdu.mjs all        # the full Quran

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(ROOT, "data");
const OUT_DIR = join(DATA_DIR, "urdu");
const CACHE_DIR = join(dirname(fileURLToPath(import.meta.url)), ".cache");

const EDITION = "ur.junagarhi"; // flowing tarjuma edition (AlQuran.cloud id)

function parseTargets(arg) {
  if (!arg) return [1];
  if (arg === "all") return Array.from({ length: 114 }, (_, i) => i + 1);
  const range = arg.match(/^(\d+)-(\d+)$/);
  if (range) {
    const [a, b] = [Number(range[1]), Number(range[2])];
    if (a >= 1 && b <= 114 && a <= b)
      return Array.from({ length: b - a + 1 }, (_, i) => a + i);
  }
  const n = Number(arg);
  if (Number.isInteger(n) && n >= 1 && n <= 114) return [n];
  throw new Error(`Unusable surah argument: ${arg} (expected 1-114, N-M, or "all")`);
}
const TARGETS = parseTargets(process.argv[2]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await sleep(1000 * 2 ** attempt);
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status} for ${url}`);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res.json();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

// Disk-cached JSON fetch: full-Quran runs and re-runs stay polite and fast.
async function getCached(name, url) {
  const file = join(CACHE_DIR, name);
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {}
  const data = await fetchWithRetry(url);
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(file, JSON.stringify(data), "utf8");
  return data;
}

// Fetch every verse of a chapter with Urdu word translations, following
// pagination if the API caps per_page.
async function fetchUrduVerses(surah) {
  const cacheName = `urdu-verses-${surah}.json`;
  const file = join(CACHE_DIR, cacheName);
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {}
  const verses = [];
  let page = 1;
  for (;;) {
    const d = await fetchWithRetry(
      `https://api.quran.com/api/v4/verses/by_chapter/${surah}` +
        `?words=true&word_fields=text_uthmani&per_page=300&language=ur&page=${page}`
    );
    verses.push(...d.verses);
    if (!d.pagination?.next_page) break;
    page = d.pagination.next_page;
    await sleep(150);
  }
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(file, JSON.stringify(verses), "utf8");
  return verses;
}

async function buildSurah(surah) {
  console.log(`\n=== Surah ${surah} (Urdu) ===`);

  // The verified English file is the alignment reference — no reference,
  // no build.
  let english;
  try {
    english = JSON.parse(await readFile(join(DATA_DIR, `surah-${surah}.json`), "utf8"));
  } catch {
    console.error(`✗ data/surah-${surah}.json missing — run build-data.mjs first`);
    return false;
  }
  const refByAyah = new Map(english.ayahs.map((a) => [a.number, a.words]));

  const verses = await fetchUrduVerses(surah);
  const tarjuma = await getCached(
    `${EDITION}-${surah}.json`,
    `https://api.alquran.cloud/v1/surah/${surah}/${EDITION}`
  );
  const tarjumaByAyah = new Map(
    tarjuma.data.ayahs.map((a) => [a.numberInSurah, a.text.trim()])
  );

  const ayahs = [];
  let failures = 0;
  let gaps = 0;

  for (const verse of verses) {
    const num = verse.verse_number;
    const ref = refByAyah.get(num);
    if (!ref) {
      failures++;
      console.error(`✗ ${surah}:${num} not present in the English file`);
      continue;
    }

    const words = verse.words.filter((w) => w.char_type_name === "word");

    // --- Alignment gate 1: same word count as the verified English file ---
    if (words.length !== ref.length) {
      failures++;
      console.error(
        `✗ ${surah}:${num} word count differs (urdu ${words.length} vs english ${ref.length})`
      );
      continue;
    }

    // --- Alignment gate 2: byte-identical Arabic at every position ---
    // (both sets come verbatim from Quran.com, so anything but equality
    // means the segmentation shifted between fetches — refuse to guess.)
    let aligned = true;
    for (let i = 0; i < words.length; i++) {
      if (words[i].text_uthmani !== ref[i].arabic) {
        failures++;
        aligned = false;
        console.error(
          `✗ ${surah}:${num} word ${i + 1} Arabic mismatch: ` +
            `"${words[i].text_uthmani}" vs stored "${ref[i].arabic}"`
        );
        break;
      }
    }
    if (!aligned) continue;

    // ~0.36% of words Quran-wide carry an empty Urdu gloss — the corpus
    // attaches a merged phrase's meaning to its FIRST word (مِن بَعْدِ gets
    // one gloss "بعد") and leaves the follower blank. That's linguistics,
    // not corruption: store "" and let the client fall back to the English
    // gloss for exactly those words. Counted in the file's `gaps` field.
    const glosses = words.map((w) => (w.translation?.text || "").trim());
    gaps += glosses.filter((g) => !g).length;

    const translation = tarjumaByAyah.get(num) || "";
    if (!translation) {
      failures++;
      console.error(`✗ Missing Urdu tarjuma for ${surah}:${num}`);
    }

    ayahs.push({ number: num, translation, words: glosses });
  }

  if (ayahs.length !== english.ayahs.length) {
    failures++;
    console.error(
      `✗ ayah count differs (urdu ${ayahs.length} vs english ${english.ayahs.length})`
    );
  }

  if (failures > 0) {
    console.error(`✗ Surah ${surah} NOT written (${failures} failure${failures === 1 ? "" : "s"})`);
    return false;
  }

  const out = {
    surah,
    edition: EDITION,
    generatedAt: new Date().toISOString(),
    gaps, // words whose Urdu gloss is empty (client shows English there)
    ayahs,
  };
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, `surah-${surah}.json`), JSON.stringify(out), "utf8");
  console.log(`✓ Surah ${surah}: ${ayahs.length} ayahs aligned${gaps ? ` (${gaps} merged-phrase gap${gaps === 1 ? "" : "s"} → English fallback)` : ""}`);
  return true;
}

let ok = 0;
let failed = [];
for (const n of TARGETS) {
  try {
    if (await buildSurah(n)) ok++;
    else failed.push(n);
  } catch (err) {
    failed.push(n);
    console.error(`✗ Surah ${n} errored:`, err.message);
  }
  await sleep(200);
}
console.log(`\nDone: ${ok}/${TARGETS.length} surahs written.`);
if (failed.length) {
  console.error(`Failed: ${failed.join(", ")}`);
  process.exitCode = 1;
}
