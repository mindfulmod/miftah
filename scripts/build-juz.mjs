// Generates data/juz.json — the 30 juz boundaries used for the badge system.
// Source: Quran.com API v4 /juzs (the endpoint returns duplicate entries;
// we dedupe by juz_number). The build aborts unless the 30 juz cover exactly
// the canonical 6236 ayahs with no overlaps.
//
// Run: node scripts/build-juz.mjs

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "juz.json");

const res = await fetch("https://api.quran.com/api/v4/juzs", {
  headers: { accept: "application/json" },
});
if (!res.ok) throw new Error(`HTTP ${res.status} fetching juzs`);
const { juzs } = await res.json();

const byNumber = new Map();
for (const j of juzs) {
  if (!byNumber.has(j.juz_number)) byNumber.set(j.juz_number, j);
}
if (byNumber.size !== 30) throw new Error(`Expected 30 juz, got ${byNumber.size}`);

// Verify full, non-overlapping coverage of all 6236 ayahs.
const seen = new Set();
let total = 0;
for (const j of byNumber.values()) {
  for (const [surah, range] of Object.entries(j.verse_mapping)) {
    const [a, b] = range.split("-").map(Number);
    for (let n = a; n <= b; n++) {
      const key = `${surah}:${n}`;
      if (seen.has(key)) throw new Error(`Overlap at ${key}`);
      seen.add(key);
      total++;
    }
  }
}
if (total !== 6236) throw new Error(`Coverage is ${total} ayahs, expected 6236`);

const out = {
  source: "Quran.com API v4 /juzs",
  generatedAt: new Date().toISOString(),
  juzs: [...byNumber.values()]
    .sort((a, b) => a.juz_number - b.juz_number)
    .map((j) => ({
      juz: j.juz_number,
      ayahCount: j.verses_count,
      // surah number (string) -> "first-last" ayah range within that surah
      mapping: j.verse_mapping,
    })),
};

await writeFile(OUT, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(`Wrote ${OUT}: 30 juz, ${total} ayahs verified.`);
