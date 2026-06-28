// Generates a verified word-by-word dataset for the Quran trainer.
//
// Arabic correctness is non-negotiable, so the text is never hand-typed:
//   1. Word-by-word Uthmani text + English glosses come from the Quran.com API (v4).
//   2. The full ayah text is independently fetched from AlQuran.cloud (Tanzil Uthmani).
//   3. For every ayah we concatenate the per-word text and compare it, letter for
//      letter, against the Tanzil text. If a single ayah disagrees the build aborts.
//
// Run: node scripts/build-data.mjs [surahNumber]   (defaults to 1 = Al-Fatihah)

import { writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SURAH = Number(process.argv[2] || 1);
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "data");

async function getJSON(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// Normalize for cross-source comparison ONLY (the stored text is left untouched —
// users always see Quran.com's verbatim Uthmani text). Quran.com and Tanzil are
// both authoritative Uthmani sources but differ in a handful of representation-only
// ways that don't change a single actual letter. We fold exactly those so the
// letter-for-letter check doesn't false-alarm, while any real consonant/vowel
// discrepancy is still caught:
//   - hamza written as a combining mark (U+0654/U+0655) vs a spacing letter (U+0621)
//   - the "small high yeh" annotation (U+06E7) vs "small yeh" (U+06E6)
//   - byte-order mark and tatweel/kashida (never letters)
function normalize(s) {
  return s
    .normalize("NFC")
    .replace(/﻿/g, "") // BOM
    .replace(/ـ/g, "") // tatweel / kashida
    .replace(/[ءٕٔ]/g, "") // hamza letter + combining hamza above/below
    .replace(/ۧ/g, "ۦ") // small high yeh -> small yeh
    .replace(/\s+/g, "") // spaces between words
    .trim();
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

async function getText(url) {
  const res = await fetch(url, { headers: { accept: "*/*" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// Returns Map<word-position (number), root (string)> for the given surah, plus
// the corpus word count per ayah so the caller can sanity-check alignment.
async function fetchRoots(surah) {
  const txt = await getText(MORPHOLOGY_URL);
  const byWord = new Map(); // `${aya}:${word}` -> root
  const wordCount = new Map(); // aya -> highest word index seen
  for (const line of txt.split("\n")) {
    if (!line) continue;
    const [loc, , , features = ""] = line.split("\t");
    const [s, a, w] = loc.split(":").map(Number);
    if (s !== surah) continue;
    wordCount.set(a, Math.max(wordCount.get(a) || 0, w));
    const key = `${a}:${w}`;
    if (byWord.has(key)) continue;
    const root = features
      .split("|")
      .find((f) => f.startsWith("ROOT:"));
    if (root) byWord.set(key, root.slice(5));
  }
  return { byWord, wordCount };
}

async function main() {
  console.log(`Fetching surah ${SURAH} word-by-word from Quran.com ...`);
  const qc = await getJSON(
    `https://api.quran.com/api/v4/verses/by_chapter/${SURAH}` +
      `?words=true&word_fields=text_uthmani&fields=text_uthmani&per_page=300&language=en`
  );

  console.log(`Fetching word roots from Quranic Arabic Corpus ...`);
  const { byWord: rootByWord, wordCount: corpusWordCount } = await fetchRoots(SURAH);

  console.log(`Fetching surah ${SURAH} full text from AlQuran.cloud (Tanzil) ...`);
  const tanzil = await getJSON(
    `https://api.alquran.cloud/v1/surah/${SURAH}/quran-uthmani`
  );
  const tanzilByAyah = new Map(
    tanzil.data.ayahs.map((a) => [a.numberInSurah, a.text])
  );

  console.log(`Fetching English translation (Saheeh International) ...`);
  const sahih = await getJSON(`https://api.alquran.cloud/v1/surah/${SURAH}/en.sahih`);
  const translationByAyah = new Map(
    sahih.data.ayahs.map((a) => [a.numberInSurah, a.text.trim()])
  );

  const chapterMeta = await getJSON(
    `https://api.quran.com/api/v4/chapters/${SURAH}?language=en`
  );
  const ch = chapterMeta.chapter;

  const ayahs = [];
  let failures = 0;

  for (const verse of qc.verses) {
    const num = verse.verse_number;
    // Keep only actual words (drop the "end of ayah" symbol token).
    const words = verse.words
      .filter((w) => w.char_type_name === "word")
      .map((w) => ({
        position: w.position,
        arabic: w.text_uthmani,
        english: w.translation?.text?.trim() || "",
        translit: w.transliteration?.text?.trim() || "",
        root: "",
      }));

    // Attach roots only when the corpus agrees on how many words this ayah has,
    // so a segmentation mismatch leaves roots empty rather than misaligned.
    if (corpusWordCount.get(num) === words.length) {
      for (const w of words) {
        w.root = rootByWord.get(`${num}:${w.position}`) || "";
      }
    } else {
      console.warn(
        `  ⚠ root alignment skipped for ${SURAH}:${num} ` +
          `(quran.com ${words.length} words vs corpus ${corpusWordCount.get(num)})`
      );
    }

    // --- Integrity check: per-word text must reconstruct the Tanzil ayah ---
    const rebuilt = normalize(words.map((w) => w.arabic).join(""));
    const reference = normalize(tanzilByAyah.get(num) || "");
    const basmala = isBasmalaPrefixCase(SURAH, num, rebuilt, reference);
    const ok = rebuilt === reference || basmala;
    if (!ok) {
      failures++;
      console.error(`\n✗ MISMATCH on ${SURAH}:${num}`);
      console.error(`  quran.com : ${rebuilt}`);
      console.error(`  tanzil    : ${reference}`);
    } else if (basmala) {
      console.log(`✓ ${SURAH}:${num} verified (${words.length} words, Basmala prefix in Tanzil ignored)`);
    } else {
      console.log(`✓ ${SURAH}:${num} verified (${words.length} words)`);
    }

    // Every word must have a non-empty gloss, or the quiz can't be built.
    for (const w of words) {
      if (!w.english) {
        failures++;
        console.error(`✗ Missing English gloss for ${SURAH}:${num} word ${w.position} (${w.arabic})`);
      }
    }

    const translation = translationByAyah.get(num) || "";
    if (!translation) {
      failures++;
      console.error(`✗ Missing English translation for ${SURAH}:${num}`);
    }

    ayahs.push({ number: num, translation, words });
  }

  if (failures > 0) {
    console.error(`\nBuild aborted: ${failures} integrity problem(s). Data NOT written.`);
    process.exit(1);
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
      "Quran.com API v4 (word-by-word Uthmani + English glosses)",
      "AlQuran.cloud / Tanzil quran-uthmani (independent text verification)",
      "AlQuran.cloud / Saheeh International (flowing English translation)",
      "Quranic Arabic Corpus morphology (word roots)",
    ],
    generatedAt: new Date().toISOString(),
    ayahs,
  };

  const file = join(OUT_DIR, `surah-${SURAH}.json`);
  await writeFile(file, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`\nAll ${ayahs.length} ayahs verified. Wrote ${file}`);

  // Register this surah in the manifest the app uses to build the picker and
  // to decide the unlock order (surahs are listed in numerical order).
  const manifestPath = join(OUT_DIR, "surahs.json");
  let manifest = { surahs: [] };
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (!Array.isArray(manifest.surahs)) manifest.surahs = [];
  } catch {
    /* no manifest yet — start a fresh one */
  }
  const entry = {
    number: ch.id,
    name: ch.name_arabic,
    englishName: ch.name_simple,
    englishTranslation: ch.translated_name?.name || "",
    ayahCount: ch.verses_count,
    file: `data/surah-${ch.id}.json`,
  };
  manifest.surahs = manifest.surahs
    .filter((s) => s.number !== entry.number)
    .concat(entry)
    .sort((a, b) => a.number - b.number);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`Updated manifest ${manifestPath} (${manifest.surahs.length} surah(s)).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
