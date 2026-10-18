const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..", "..", "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const palette = (() => { const art = read("ART.md"); return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase())); })();
const off = (t) => (t.match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase()).filter((h) => !palette.has(h));

test("v65 journey map: no grass/soil/grass stripes, soft terraces, the sand trail, varied landmarks, contoured toys", () => {
  const m = read("src/letters/LettersMapArt.js");
  assert.match(m, /<linearGradient id="\$\{id\}-ground" x1="0" x2="1" y1="0" y2="0"><stop stop-color="\$\{grass\}"\/><stop offset="1" stop-color="\$\{grass\}"\/><\/linearGradient>/);
  assert.match(m, /const terraces=ordered\.map/);
  assert.match(m, /class="lm-canopy"><path d="[^"]*" fill="#4e9677" stroke="\$\{ink\}" stroke-width="3"/);
  const g = read("src/letters/LettersGame.js");
  assert.match(g, /<path d="\$\{d\}" fill="none" stroke="#e5dcc8" stroke-width="34" stroke-linecap="round" data-ribbon\/>/);
  assert.match(g, /--lm-s:\$\{\[1, 0\.86, 1\.1\]\[i % 3\]\}; --lm-f:\$\{i % 4 < 2 \? 1 : -1\}/);
  assert.match(read("styles/letters.css"), /\.lg-home > \.lg-weather \.wx-rainbow \{ display: none; \}/);
});

test("v65 UI material pass: paper in wood frames, plank tabs, a wooden star plaque, framed play boards — palette only", () => {
  const css = read("styles/letters-materials.css");
  assert.deepEqual(off(css), []);
  assert.match(css, /\.lg-app \.practice-garden-choices button \{\n\s+border: 4px solid var\(--wood\);/);
  assert.match(css, /\.lg-app \.album-tab \{\n\s+border: 3px solid var\(--ink\);/);
  assert.match(css, /\.lg-app \.lg-party \.party-stars, \.lg-app \.lg-stars \.stars-row \{/);
  assert.match(css, /box-shadow: 0 0 0 3px var\(--ink\), inset 0 0 0 5px var\(--wood\)/, "the board frame is shadows only: no layout space");
  assert.match(css, /@media \(max-height: 600px\), \(max-width: 360px\) \{/);
  assert.match(read("letters.html"), /styles\/letters-materials\.css\?v=2026[0-9]{4}-v(6[5-9]|[7-9][0-9]|[1-9][0-9]{2})/);
  assert.match(read("sw.js"), /"styles\/letters-materials\.css",/);
});
