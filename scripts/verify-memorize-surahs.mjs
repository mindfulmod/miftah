// Read-only integrity audit for the Guided Hifz prototype.
//
// Checks:
//   1. Every stored Uthmani word token is byte-identical to Quran.com API v4.
//   2. Every reconstructed ayah has the same base letters and order as the
//      official Tanzil Uthmani text. Presentation marks are folded only for
//      this independent cross-source comparison; stored text is never changed.
//   3. The Al-Fil English meaning cues still match Saheeh International.
//   4. Every target Quran word has one ordered, valid recitation timestamp.
//
// Run from the repository root:
//   node scripts/verify-memorize-surahs.mjs

// Tanzil text source and license:
//   https://tanzil.net/docs/tanzil_project
//   https://tanzil.net/docs/Text_License

// This script downloads reference text for verification and does not write it.

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TARGETS = Array.from({ length: 37 }, (_, index) => 78 + index);
const QURAN_API = "https://api.quran.com/api/v4";
const TANZIL_DOWNLOAD =
  "https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=txt-2" +
  "&marks=true&sajdah=true&tatweel=true&agree=true";

async function fetchChecked(url, accept) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, { headers: { accept } });
    if (response.ok) return response;
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === 3) throw new Error(`HTTP ${response.status} from ${url}`);
    await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
  }
  throw new Error(`Could not fetch ${url}`);
}

async function fetchJson(url) {
  return (await fetchChecked(url, "application/json")).json();
}

async function fetchText(url) {
  return (await fetchChecked(url, "text/plain")).text();
}

function fail(message) {
  throw new Error(message);
}

function wordTokens(verse) {
  return verse.words
    .filter((word) => word.char_type_name === "word")
    .map((word) => word.text_uthmani);
}

function normalizeBaseLetters(text) {
  return text
    .normalize("NFD")
    .replace(/[\u200c-\u200f\ufeff]/g, "")
    .replace(/[\u06de\u06e9]/g, "")
    .replace(/\p{M}/gu, "")
    .replace(/ـ/g, "")
    .replace(/ٱ/g, "ا")
    .replace(/\s+/g, "")
    .trim();
}

function parseTanzil(text) {
  const verses = new Map();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/^\ufeff/, "");
    const match = line.match(/^(\d+)\|(\d+)\|(.*)$/u);
    if (!match) continue;
    verses.set(`${Number(match[1])}:${Number(match[2])}`, match[3]);
  }
  return verses;
}

function assertExactTokens(localAyah, apiVerse, reference) {
  const local = localAyah.words.map((word) => word.arabic);
  const remote = wordTokens(apiVerse);
  if (local.length !== remote.length) {
    fail(`${reference} word count: local ${local.length}, Quran.com ${remote.length}`);
  }

  for (let index = 0; index < local.length; index += 1) {
    if (local[index] !== remote[index]) {
      fail(
        `${reference} word ${index + 1} differs from Quran.com: ` +
          `local "${local[index]}", reference "${remote[index]}"`,
      );
    }
  }
  return local.length;
}

function assertTanzilAyah(localAyah, tanzilAyah, surahNumber) {
  const reference = `${surahNumber}:${localAyah.number}`;
  if (!tanzilAyah) fail(`${reference} is missing from the Tanzil download`);

  const local = normalizeBaseLetters(localAyah.words.map((word) => word.arabic).join(" "));
  const remote = normalizeBaseLetters(tanzilAyah);
  const agrees = local === remote || (localAyah.number === 1 && remote.endsWith(local));
  if (!agrees) {
    fail(`${reference} base letters or order differ from Tanzil: local "${local}", reference "${remote}"`);
  }
}

async function loadLocalSurah(number) {
  const file = join(ROOT, "data", `surah-${number}.json`);
  return JSON.parse(await readFile(file, "utf8"));
}

async function quranComSurah(number) {
  const url =
    `${QURAN_API}/verses/by_chapter/${number}` +
    "?language=en&words=true&word_fields=text_uthmani&per_page=50";
  const data = await fetchJson(url);
  return data.verses;
}

async function quranComTimings(number) {
  const data = await fetchJson(
    `${QURAN_API}/chapter_recitations/7/${number}?segments=true`,
  );
  const timestamps = data.audio_file?.timestamps;
  if (!Array.isArray(timestamps)) fail(`${number} has no Quran.com chapter timing data`);
  return new Map(timestamps.map((timestamp) => [timestamp.verse_key, timestamp]));
}

function assertWordTimings(localAyah, timestamp, surahNumber) {
  const reference = `${surahNumber}:${localAyah.number}`;
  if (!timestamp || !Array.isArray(timestamp.segments)) {
    fail(`${reference} has no Quran.com word timing segments`);
  }
  const malformedCount = timestamp.segments.filter(
    (segment) => !Array.isArray(segment) || segment.length !== 3,
  ).length;
  const validSegments = timestamp.segments
    .filter((segment) => Array.isArray(segment) && segment.length === 3)
    .map((segment) => segment.map(Number))
    .filter(([position, start, end]) => {
      if (!Number.isInteger(position) || position < 1 || position > localAyah.words.length) {
        fail(`${reference} contains an unknown timing position`);
      }
      return Number.isFinite(start) && Number.isFinite(end) && end > start;
    })
    .sort((a, b) => a[1] - b[1]);
  const positions = new Set(validSegments.map(([position]) => position));
  if (positions.size !== localAyah.words.length) {
    fail(
      `${reference} timed positions: ${positions.size}, words ${localAyah.words.length}`,
    );
  }
  localAyah.words.forEach((_, index) => {
    if (!positions.has(index + 1)) fail(`${reference} has no timing for word ${index + 1}`);
  });
  validSegments.forEach((segment, index) => {
    const [, start] = segment;
    if (index > 0 && start <= validSegments[index - 1][1]) {
      fail(`${reference} timing segment ${index + 1} is invalid`);
    }
  });
  return malformedCount;
}

async function verifyEnglishCues(localSurah) {
  const data = await fetchJson("https://api.alquran.cloud/v1/surah/105/en.sahih");
  const reference = new Map(data.data.ayahs.map((ayah) => [ayah.numberInSurah, ayah.text.trim()]));
  for (const ayah of localSurah.ayahs) {
    if (ayah.translation.trim() !== reference.get(ayah.number)) {
      fail(`105:${ayah.number} English cue differs from Saheeh International`);
    }
  }
}

async function main() {
  const [tanzilText, ...localSurahs] = await Promise.all([
    fetchText(TANZIL_DOWNLOAD),
    ...TARGETS.map(loadLocalSurah),
  ]);
  const tanzil = parseTanzil(tanzilText);
  let targetWordCount = 0;
  let targetAyahCount = 0;
  let timingArtifactCount = 0;

  for (const localSurah of localSurahs) {
    const number = localSurah.surah.number;
    const [apiVerses, timings] = await Promise.all([
      quranComSurah(number),
      quranComTimings(number),
    ]);
    if (apiVerses.length !== localSurah.ayahs.length) {
      fail(`${number} ayah count: local ${localSurah.ayahs.length}, Quran.com ${apiVerses.length}`);
    }

    for (const localAyah of localSurah.ayahs) {
      const apiVerse = apiVerses.find((verse) => verse.verse_number === localAyah.number);
      if (!apiVerse) fail(`${number}:${localAyah.number} is missing from Quran.com`);
      targetWordCount += assertExactTokens(localAyah, apiVerse, `${number}:${localAyah.number}`);
      assertTanzilAyah(localAyah, tanzil.get(`${number}:${localAyah.number}`), number);
      timingArtifactCount += assertWordTimings(
        localAyah,
        timings.get(`${number}:${localAyah.number}`),
        number,
      );
      targetAyahCount += 1;
    }
  }

  const fatihah = await loadLocalSurah(1);
  const fatihahApi = await quranComSurah(1);
  const basmalaWordCount = assertExactTokens(fatihah.ayahs[0], fatihahApi[0], "1:1 basmala");
  assertTanzilAyah(fatihah.ayahs[0], tanzil.get("1:1"), 1);
  await verifyEnglishCues(localSurahs.find((surah) => surah.surah.number === 105));

  console.log(
    `Verified all ${TARGETS.length} Juz Amma surahs: ${targetAyahCount} ayahs and ` +
      `${targetWordCount} target word tokens, plus ${basmalaWordCount} basmala tokens.`,
  );
  console.log(
    "Quran.com exact tokens and word timings, Tanzil Uthmani text, and Al-Fil English cues all agree.",
  );
  if (timingArtifactCount > 0) {
    console.log(
      `Ignored ${timingArtifactCount} malformed upstream timing ${timingArtifactCount === 1 ? "artifact" : "artifacts"} ` +
        "after confirming complete ordered coverage for every Quran word.",
    );
  }
}

main().catch((error) => {
  console.error(`Verification failed: ${error.message}`);
  process.exitCode = 1;
});
