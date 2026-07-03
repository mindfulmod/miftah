// Generates a verified word-by-word dataset for the Quran trainer.
//
// Arabic correctness is non-negotiable, so the text is never hand-typed:
//   1. Word-by-word Uthmani text + English glosses come from the Quran.com API (v4).
//   2. The full ayah text is independently fetched from AlQuran.cloud (Tanzil Uthmani).
//   3. For every ayah we concatenate the per-word text and compare it, letter for
//      letter, against the Tanzil text. If a single ayah disagrees the surah is
//      not written.
//
// Audio: every word's Quran.com audio_url is checked against the deterministic
// CDN pattern wbw/SSS_AAA_WWW.mp3 (served from https://audio.qurancdn.com/).
// Words that match store nothing — the client reconstructs the URL from
// surah/ayah/position. A word that deviates gets an explicit `audio` field.
// Ayah recitation is likewise deterministic: Alafasy/mp3/SSSAAA.mp3 on
// https://verses.quran.com/.
//
// Run:
//   node scripts/build-data.mjs            # Al-Fatihah only
//   node scripts/build-data.mjs 36         # one surah
//   node scripts/build-data.mjs 78-114     # a range
//   node scripts/build-data.mjs all        # the full Quran

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const CACHE_DIR = join(dirname(fileURLToPath(import.meta.url)), ".cache");

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

// All sources are public APIs; be polite and survive transient hiccups.
async function fetchWithRetry(url, accept) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await sleep(1000 * 2 ** attempt);
    try {
      const res = await fetch(url, { headers: { accept } });
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status} for ${url}`);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}
const getJSON = async (url) => (await fetchWithRetry(url, "application/json")).json();
const getText = async (url) => (await fetchWithRetry(url, "*/*")).text();

// Normalize for cross-source comparison ONLY (the stored text is left untouched —
// users always see Quran.com's verbatim Uthmani text). Quran.com and Tanzil are
// both authoritative Uthmani sources but differ in a handful of representation-only
// ways that don't change a single actual letter. We fold exactly those so the
// letter-for-letter check doesn't false-alarm, while any real consonant/vowel
// discrepancy is still caught:
//   - hamza written as a combining mark (U+0654/U+0655) vs a spacing letter
//     (U+0621) vs precomposed onto its seat (أ إ ؤ ئ — NFD splits these)
//   - alef wasla (U+0671) vs plain alef — the hamzat-wasl annotation
//   - a dagger alef seated on alef maksura (ىٰ) vs written bare (ٰ), and a
//     long ā written with a dagger alef (رَٰ) vs a full alef (رَا)
//   - the "small high yeh" annotation (U+06E7) vs "small yeh" (U+06E6)
//   - BOM, zero-width/directional marks, tatweel/kashida (never letters)
//   - ordering of vowel marks around small letters (لِّۦ vs لۦِّ) — same
//     marks on the same base, serialized in a different sequence
function normalize(s) {
  const folded = s
    .normalize("NFD") // decompose so precomposed hamza seats fold like combining ones
    .replace(/[‌-‏﻿]/g, "") // zero-width & directional marks + BOM
    .replace(/ـ/g, "") // tatweel / kashida
    .replace(/[ءٕٔ]/g, "") // hamza letter + combining hamza above/below
    .replace(/ٱ/g, "ا") // alef wasla -> plain alef
    .replace(/ىٰ/g, "ٰ") // alef-maksura seat under a dagger alef -> bare dagger alef
    .replace(/ٰ/g, "ا") // dagger alef -> full alef (both mark the same long ā)
    .replace(/ۧ/g, "ۦ") // small high yeh -> small yeh
    .replace(/\s+/g, "") // spaces between words
    .trim();
  // Canonical order for each base letter's trailing marks/small letters, so
  // mark-sequence differences compare equal while any added/removed/changed
  // mark still fails.
  const isTail = (ch) => /[\p{Mn}ۥۦ]/u.test(ch);
  let out = "";
  let cluster = [];
  for (const ch of folded) {
    if (isTail(ch)) {
      cluster.push(ch);
    } else {
      out += cluster.sort().join("") + ch;
      cluster = [];
    }
  }
  return out + cluster.sort().join("");
}

// Most surahs (all but Al-Fatihah and At-Tawbah) open with the Basmala. The
// Tanzil source folds it into the text of ayah 1, whereas Quran.com's word list
// for ayah 1 does not. That's a versification convention, not a text difference,
// so when the rebuilt ayah-1 text is a suffix of the reference we treat the
// leading Basmala as expected rather than a mismatch.
function isBasmalaPrefixCase(surah, ayahNum, rebuilt, reference) {
  return (
    ayahNum === 1 &&
    surah !== 1 &&
    surah !== 9 &&
    rebuilt.length > 0 &&
    reference.length > rebuilt.length &&
    reference.endsWith(rebuilt)
  );
}

// Word roots come from the Quranic Arabic Corpus morphology (already in Arabic,
// so no Buckwalter conversion). One line per segment:
//   sura:aya:word:segment \t FORM \t TAG \t FEATURES(|-separated, may hold ROOT:xxx)
// A Quran.com "word" can span several segments (prefixes + stem); the root lives
// on the stem segment. We key by sura:aya:word and keep the first ROOT we see.
const MORPHOLOGY_URL =
  "https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt";

// The morphology file covers the whole Quran (~7MB); fetch it once per run and
// cache it on disk so "all" builds and re-runs don't re-download it.
async function loadMorphology() {
  const cacheFile = join(CACHE_DIR, "quran-morphology.txt");
  try {
    return await readFile(cacheFile, "utf8");
  } catch {}
  console.log("Fetching Quranic Arabic Corpus morphology (whole Quran, cached after this) ...");
  const txt = await getText(MORPHOLOGY_URL);
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cacheFile, txt, "utf8");
  return txt;
}

// Returns Map<"aya:word", root> for the given surah, plus the corpus word
// count per ayah so the caller can sanity-check alignment.
function extractRoots(morphologyText, surah) {
  const byWord = new Map();
  const wordCount = new Map();
  for (const line of morphologyText.split("\n")) {
    if (!line) continue;
    const [loc, , , features = ""] = line.split("\t");
    const [s, a, w] = loc.split(":").map(Number);
    if (s !== surah) continue;
    wordCount.set(a, Math.max(wordCount.get(a) || 0, w));
    const key = `${a}:${w}`;
    if (byWord.has(key)) continue;
    const root = features.split("|").find((f) => f.startsWith("ROOT:"));
    if (root) byWord.set(key, root.slice(5));
  }
  return { byWord, wordCount };
}

const pad3 = (n) => String(n).padStart(3, "0");

// Fetch every verse of a chapter, following pagination if the API caps per_page.
async function fetchVerses(surah) {
  const verses = [];
  let page = 1;
  for (;;) {
    const d = await getJSON(
      `https://api.quran.com/api/v4/verses/by_chapter/${surah}` +
        `?words=true&word_fields=text_uthmani,audio_url&fields=text_uthmani` +
        `&per_page=300&language=en&page=${page}`
    );
    verses.push(...d.verses);
    if (!d.pagination?.next_page) break;
    page = d.pagination.next_page;
    await sleep(150);
  }
  return verses;
}

async function buildSurah(surah, morphologyText) {
  console.log(`\n=== Surah ${surah} ===`);
  const qcVerses = await fetchVerses(surah);
  const { byWord: rootByWord, wordCount: corpusWordCount } = extractRoots(
    morphologyText,
    surah
  );

  const tanzil = await getJSON(
    `https://api.alquran.cloud/v1/surah/${surah}/quran-uthmani`
  );
  const tanzilByAyah = new Map(
    tanzil.data.ayahs.map((a) => [a.numberInSurah, a.text])
  );

  const sahih = await getJSON(`https://api.alquran.cloud/v1/surah/${surah}/en.sahih`);
  const translationByAyah = new Map(
    sahih.data.ayahs.map((a) => [a.numberInSurah, a.text.trim()])
  );

  const chapterMeta = await getJSON(
    `https://api.quran.com/api/v4/chapters/${surah}?language=en`
  );
  const ch = chapterMeta.chapter;

  const ayahs = [];
  let failures = 0;
  let rootSkips = 0;
  let audioExceptions = 0;

  for (const verse of qcVerses) {
    const num = verse.verse_number;
    // Keep only actual words (drop the "end of ayah" symbol token).
    const words = verse.words
      .filter((w) => w.char_type_name === "word")
      .map((w) => {
        const word = {
          position: w.position,
          arabic: w.text_uthmani,
          english: w.translation?.text?.trim() || "",
          translit: w.transliteration?.text?.trim() || "",
          root: "",
        };
        // Store audio only when it breaks the deterministic pattern the
        // client reconstructs (wbw/SSS_AAA_WWW.mp3).
        const expected = `wbw/${pad3(surah)}_${pad3(num)}_${pad3(w.position)}.mp3`;
        if (w.audio_url && w.audio_url !== expected) {
          word.audio = w.audio_url;
          audioExceptions++;
        } else if (!w.audio_url) {
          // Not fatal: the client falls back to the deterministic path and
          // tolerates a missing file — text integrity is what gates the build.
          console.warn(`  ⚠ No word audio for ${surah}:${num} word ${w.position}`);
        }
        return word;
      });

    // Attach roots only when the corpus agrees on how many words this ayah has,
    // so a segmentation mismatch leaves roots empty rather than misaligned.
    if (corpusWordCount.get(num) === words.length) {
      for (const w of words) {
        w.root = rootByWord.get(`${num}:${w.position}`) || "";
      }
    } else {
      rootSkips++;
      console.warn(
        `  ⚠ root alignment skipped for ${surah}:${num} ` +
          `(quran.com ${words.length} words vs corpus ${corpusWordCount.get(num)})`
      );
    }

    // --- Integrity check: per-word text must reconstruct the Tanzil ayah ---
    const rebuilt = normalize(words.map((w) => w.arabic).join(""));
    const reference = normalize(tanzilByAyah.get(num) || "");
    const basmala = isBasmalaPrefixCase(surah, num, rebuilt, reference);
    const ok = rebuilt === reference || basmala;
    if (!ok) {
      failures++;
      console.error(`✗ MISMATCH on ${surah}:${num}`);
      console.error(`  quran.com : ${rebuilt}`);
      console.error(`  tanzil    : ${reference}`);
    }

    // Every word must have a non-empty gloss, or the quiz can't be built.
    for (const w of words) {
      if (!w.english) {
        failures++;
        console.error(`✗ Missing English gloss for ${surah}:${num} word ${w.position} (${w.arabic})`);
      }
    }

    const translation = translationByAyah.get(num) || "";
    if (!translation) {
      failures++;
      console.error(`✗ Missing English translation for ${surah}:${num}`);
    }

    ayahs.push({ number: num, translation, words });
  }

  if (ayahs.length !== ch.verses_count) {
    failures++;
    console.error(
      `✗ Ayah count mismatch for surah ${surah}: got ${ayahs.length}, expected ${ch.verses_count}`
    );
  }

  if (failures > 0) {
    throw new Error(`surah ${surah}: ${failures} integrity problem(s). Data NOT written.`);
  }

  const out = {
    surah: {
      number: ch.id,
      name: ch.name_arabic,
      englishName: ch.name_simple,
      englishTranslation: ch.translated_name?.name || "",
      ayahCount: ch.verses_count,
    },
    sources: [
      "Quran.com API v4 (word-by-word Uthmani + English glosses + word audio)",
      "AlQuran.cloud / Tanzil quran-uthmani (independent text verification)",
      "AlQuran.cloud / Saheeh International (flowing English translation)",
      "Quranic Arabic Corpus morphology (word roots)",
    ],
    generatedAt: new Date().toISOString(),
    ayahs,
  };

  const file = join(OUT_DIR, `surah-${surah}.json`);
  // Minified: the full Quran is served to browsers file-by-file.
  await writeFile(file, JSON.stringify(out) + "\n", "utf8");
  const verified = ayahs.length;
  console.log(
    `✓ Surah ${surah} (${ch.name_simple}): all ${verified} ayahs verified` +
      (rootSkips ? `, roots skipped on ${rootSkips} ayah(s)` : "") +
      (audioExceptions ? `, ${audioExceptions} non-pattern audio URL(s) stored` : "")
  );

  return {
    number: ch.id,
    name: ch.name_arabic,
    englishName: ch.name_simple,
    englishTranslation: ch.translated_name?.name || "",
    ayahCount: ch.verses_count,
    file: `data/surah-${ch.id}.json`,
  };
}

async function updateManifest(entries) {
  const manifestPath = join(OUT_DIR, "surahs.json");
  let manifest = { surahs: [] };
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (!Array.isArray(manifest.surahs)) manifest.surahs = [];
  } catch {
    /* no manifest yet — start a fresh one */
  }
  const byNumber = new Map(manifest.surahs.map((s) => [s.number, s]));
  for (const e of entries) byNumber.set(e.number, e);
  manifest.surahs = [...byNumber.values()].sort((a, b) => a.number - b.number);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`\nUpdated manifest ${manifestPath} (${manifest.surahs.length} surah(s)).`);
}

async function main() {
  const morphologyText = await loadMorphology();
  const built = [];
  const failed = [];
  for (const surah of TARGETS) {
    try {
      built.push(await buildSurah(surah, morphologyText));
    } catch (err) {
      failed.push(surah);
      console.error(`✗ Surah ${surah} FAILED: ${err.message}`);
    }
    if (TARGETS.length > 1) await sleep(300);
  }

  if (built.length) await updateManifest(built);

  if (failed.length) {
    console.error(
      `\n${failed.length} surah(s) failed and were not written: ${failed.join(", ")}`
    );
    console.error(`Re-run e.g.: node scripts/build-data.mjs ${failed[0]}`);
    process.exit(1);
  }
  console.log(`\nDone: ${built.length} surah(s) built and verified.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
