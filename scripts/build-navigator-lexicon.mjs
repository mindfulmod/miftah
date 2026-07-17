// Builds the small Quran-wide lexical lookup used by The Star Navigator's
// first-correct celebration. Lemma and root assignments come from the bundled
// Quranic Arabic Corpus morphology cache; display words/glosses come from the
// already-verified trainer data.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MORPHOLOGY = join(ROOT, "scripts", ".cache", "quran-morphology.txt");
const OUT = join(ROOT, "data", "navigator-lexicon.json");
const MORPHOLOGY_URL =
  "https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt";

async function loadMorphology() {
  try {
    return await readFile(MORPHOLOGY, "utf8");
  } catch {}
  const response = await fetch(MORPHOLOGY_URL);
  if (!response.ok) throw new Error(`Morphology download failed: HTTP ${response.status}`);
  const text = await response.text();
  await mkdir(dirname(MORPHOLOGY), { recursive: true });
  await writeFile(MORPHOLOGY, text);
  return text;
}

const morphology = await loadMorphology();
const morphologyByLocation = new Map();

for (const line of morphology.split("\n")) {
  if (!line) continue;
  const [location, , , features = ""] = line.split("\t");
  const [surah, ayah, word] = location.split(":");
  if (!surah || !ayah || !word) continue;
  const key = `${Number(surah)}:${Number(ayah)}:${Number(word)}`;
  const record = morphologyByLocation.get(key) || { lemma: "", root: "" };
  const featureList = features.split("|");
  const lemma = featureList.find((feature) => feature.startsWith("LEM:"))?.slice(4) || "";
  const root = featureList.find((feature) => feature.startsWith("ROOT:"))?.slice(5) || "";
  if (root) {
    // The lexical stem carries the root; bind its lemma at the same time so a
    // leading conjunction/article (و, ب, ال…) never becomes the counted word.
    record.root = root;
    if (lemma) record.lemma = lemma;
  } else if (!record.root && lemma && !featureList.includes("PREF") && !featureList.includes("SUFF")) {
    record.lemma = lemma;
  }
  morphologyByLocation.set(key, record);
}

const lemmaCounts = new Map();
const rootCounts = new Map();
for (const record of morphologyByLocation.values()) {
  if (record.lemma) lemmaCounts.set(record.lemma, (lemmaCounts.get(record.lemma) || 0) + 1);
  if (record.root) rootCounts.set(record.root, (rootCounts.get(record.root) || 0) + 1);
}

const candidatesByKey = new Map();
const candidatesByArabic = new Map();
let aligned = 0;
let missing = 0;

function addCandidate(map, key, record) {
  if (!map.has(key)) map.set(key, new Map());
  const signature = `${record.lemma}\u0000${record.root}`;
  map.get(key).set(signature, record);
}

for (let surah = 1; surah <= 114; surah += 1) {
  const data = JSON.parse(await readFile(join(ROOT, "data", `surah-${surah}.json`), "utf8"));
  for (const ayah of data.ayahs || []) {
    for (const word of ayah.words || []) {
      const morphologyRecord = morphologyByLocation.get(`${surah}:${ayah.number}:${word.position}`);
      const lemma = morphologyRecord?.lemma || "";
      const root = morphologyRecord?.root || word.root || "";
      if (morphologyRecord) aligned += 1;
      else missing += 1;
      const record = {
        lemma,
        lemmaCount: lemma ? lemmaCounts.get(lemma) || 0 : 0,
        root,
        rootCount: root ? rootCounts.get(root) || 0 : 0,
      };
      addCandidate(candidatesByKey, `${word.arabic}|||${word.english}`, record);
      addCandidate(candidatesByArabic, word.arabic, record);
    }
  }
}

const lemmas = [...lemmaCounts].sort(([a], [b]) => a.localeCompare(b, "ar"));
const roots = [...rootCounts].sort(([a], [b]) => a.localeCompare(b, "ar"));
const lemmaIndex = new Map(lemmas.map(([lemma], index) => [lemma, index]));
const rootIndex = new Map(roots.map(([root], index) => [root, index]));
const compact = (record) => [
  record.lemma ? lemmaIndex.get(record.lemma) : -1,
  record.root ? rootIndex.get(record.root) : -1,
];

const ambiguousArabic = new Set();
const byArabic = {};
for (const [arabic, choices] of candidatesByArabic) {
  const records = [...choices.values()];
  if (records.length !== 1) {
    ambiguousArabic.add(arabic);
    continue;
  }
  byArabic[arabic] = compact(records[0]);
}

// Only the handful of script forms that can represent more than one lemma
// need the longer word+gloss key. Everything else takes the compact Arabic
// path, keeping the shipped lookup roughly a fifth of the naive size.
const byKey = {};
for (const [key, choices] of candidatesByKey) {
  const arabic = key.slice(0, key.indexOf("|||"));
  if (!ambiguousArabic.has(arabic)) continue;
  const records = [...choices.values()];
  records.sort((a, b) => b.lemmaCount - a.lemmaCount || b.rootCount - a.rootCount);
  byKey[key] = compact(records[0]);
}

const payload = {
  version: 1,
  source: "Quranic Arabic Corpus morphology",
  lemmas,
  roots,
  byArabic,
  byKey,
};

await writeFile(OUT, JSON.stringify(payload));
const bytes = (await readFile(OUT)).byteLength;
console.log(
  `Wrote ${OUT}\n` +
  `${lemmas.length} lemmas, ${roots.length} roots, ` +
  `${Object.keys(payload.byArabic).length} unambiguous Arabic forms, ` +
  `${Object.keys(payload.byKey).length} ambiguous word/gloss fallbacks.\n` +
  `${aligned} morphology-aligned tokens, ${missing} missing; ${(bytes / 1024).toFixed(1)} KiB.`
);
