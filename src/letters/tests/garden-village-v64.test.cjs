const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..", "..", "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const palette = (() => { const art = read("ART.md"); return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase())); })();
const off = (t) => (t.match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase()).filter((h) => !palette.has(h));
const game = read("src/letters/LettersGame.js");

test("v64 village art kit: palette only; contours only at allowed widths (the trail is a mass, drawn as a wide stroke)", () => {
  const v = read("src/letters/VillageArt.js");
  assert.deepEqual(off(v), []);
  const widths = new Set((v.match(/stroke-width="([0-9.]+)"/g) || []).map((m) => m.match(/"([0-9.]+)"/)[1]));
  for (const w of widths) assert.ok(["1.6", "2.4", "3", "4", "6", "8", "18", "34"].includes(w), `stroke ${w}`);
  assert.match(v, /stroke="#e5dcc8" stroke-width="34"/, "18 and 34 belong only to the trail mass");
});

test("v64 the village is home: boot and hatching open it; landmarks route to every destination", () => {
  assert.match(game, /this\.pet \? this\.renderVillage\(\) : this\.renderHatch\(\);/);
  for (const go of ["journey", "pet", "decorate", "album", "friends", "practice"]) assert.match(game, new RegExp(`spot\\("${go}"`));
  assert.match(game, /journey: \(\) => this\.renderHome\(\),/);
  assert.match(game, /\$\{walk \? spot\("walk"/);
  assert.match(game, /\$\{daily \? spot\("daily"/);
});

test("v64 Home goes to the map only from inside a chapter; everywhere else to the village", () => {
  assert.match(game, /const inChapter = \/\\blg-\(play\|meet\|stars\|party\)\\b\/\.test\(el\.className\) && Number\.isInteger\(this\.session\?\.gameIndex\) && !this\.session\?\.chapterBonus;/);
  assert.match(game, /onHome \? onHome\(\) : inChapter \? this\.renderHome\(\) : this\.renderVillage\(\);/);
  assert.match(game, /el\.classList\.add\("has-village"\);/);
  assert.match(read("styles/letters-map-world.css"), /\.lg-home\.has-village \.map-daily-row, \.lg-home\.has-village \.map-play-places \{ display: none !important; \}/);
});

test("v64 today's treasure lives in the village; the map keeps the visitor and balloon", () => {
  assert.match(game, /const find = ns\.VillageArt \? null : this\.todaysFind\?\.\(\);/);
  assert.match(game, /\$\{find \? `<g class="vg-find" data-find="\$\{find\}"/);
  assert.match(read("styles/letters-map-world.css"), /@media \(prefers-reduced-motion: reduce\) \{ \.lg-app \.vg-spot\[data-go="journey"\] \.vg-medal, \.lg-app \.vg-pool, \.lg-app \.vg-find-in \{ animation: none; \} \}/);
});
