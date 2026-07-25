#!/usr/bin/env node
// Palette validator for the Letter Garden art bible (ART.md §2).
//
// A locked palette that nobody checks is a suggestion. This scans the art layer
// for hex literals and stroke widths that ART.md doesn't allow, so drift fails
// loudly instead of accumulating — the exact way the game ended up with 109
// loose colours and 19 stroke widths.
//
//   node scripts/check-palette.mjs            # report
//   node scripts/check-palette.mjs --strict   # exit 1 on any violation
//
// The allow-list is parsed FROM ART.md, so the bible stays the single source of
// truth: add a colour there and the validator accepts it, not the other way round.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const STRICT = process.argv.includes("--strict");

// Files that draw. Data and vendor code are not art.
const TARGETS = ["src/letters", "styles/letters.css"];
const EXT = /\.(js|css)$/;

const ALLOWED_WIDTHS = new Set(["1.6", "2.4", "3", "4", "6", "8"]);

function walk(p, out = []) {
  const s = statSync(p);
  if (s.isDirectory()) for (const f of readdirSync(p)) walk(join(p, f), out);
  else if (EXT.test(p)) out.push(p);
  return out;
}

// Pull every hex out of the ART.md ramp tables + HSL band section.
function bibleHexes() {
  const art = readFileSync(join(ROOT, "ART.md"), "utf8");
  const table = art.slice(art.indexOf("## 2."), art.indexOf("## 3."));
  return new Set(
    (table.match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase()),
  );
}

const allowed = bibleHexes();
if (allowed.size === 0) {
  console.error("could not parse any hexes from ART.md §2 — has the table moved?");
  process.exit(2);
}

const files = TARGETS.flatMap((t) => walk(join(ROOT, t)));
const badHex = new Map(); // hex -> [locations]
const badWidth = new Map();

for (const file of files) {
  const src = readFileSync(file, "utf8");
  src.split("\n").forEach((line, i) => {
    // Comments are prose, not paint.
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
    // Opt-out for pixels that are computed, not displayed (ink measurement).
    if (line.includes("art-exempt")) return;
    const where = `${relative(ROOT, file)}:${i + 1}`;

    for (const raw of line.match(/#[0-9a-fA-F]{3,6}\b/g) || []) {
      let hex = raw.toLowerCase();
      if (hex.length === 4) {
        hex = "#" + [...hex.slice(1)].map((c) => c + c).join(""); // #fff -> #ffffff
      }
      if (hex.length !== 7) continue;
      if (allowed.has(hex)) continue;
      if (!badHex.has(raw)) badHex.set(raw, []);
      badHex.get(raw).push(where);
    }

    for (const m of line.matchAll(/stroke-width="([0-9.]+)"/g)) {
      if (ALLOWED_WIDTHS.has(m[1])) continue;
      if (!badWidth.has(m[1])) badWidth.set(m[1], []);
      badWidth.get(m[1]).push(where);
    }
  });
}

const totalHex = [...badHex.values()].reduce((n, a) => n + a.length, 0);
const totalW = [...badWidth.values()].reduce((n, a) => n + a.length, 0);

console.log(`Palette check — ${files.length} art files, ${allowed.size} bible colours\n`);

if (badHex.size) {
  console.log(`OFF-PALETTE HEXES: ${badHex.size} distinct, ${totalHex} uses`);
  [...badHex.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 25)
    .forEach(([hex, at]) =>
      console.log(`  ${hex.padEnd(9)} ${String(at.length).padStart(3)}x  e.g. ${at[0]}`),
    );
  if (badHex.size > 25) console.log(`  …and ${badHex.size - 25} more`);
  console.log();
}

if (badWidth.size) {
  console.log(`OFF-SCALE STROKE WIDTHS: ${badWidth.size} distinct, ${totalW} uses`);
  [...badWidth.entries()].forEach(([w, at]) =>
    console.log(`  ${w.padEnd(9)} ${String(at.length).padStart(3)}x  e.g. ${at[0]}`),
  );
  console.log();
}

if (!badHex.size && !badWidth.size) {
  console.log("clean — everything on palette and on the stroke scale.");
  process.exit(0);
}

// Known debt is recorded in ART.md §9. Non-strict mode reports without blocking so
// the bible can land before the migration that satisfies it.
console.log(
  STRICT
    ? "FAIL (--strict): fix these or amend ART.md §2 first."
    : "Reported only. Run with --strict in CI once ART.md §9 debt is cleared.",
);
process.exit(STRICT ? 1 : 0);
