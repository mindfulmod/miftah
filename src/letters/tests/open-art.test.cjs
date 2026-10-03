const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const root = path.join(__dirname, "..", "..", "..");
const palette = (() => {
  const art = fs.readFileSync(path.join(root, "ART.md"), "utf8");
  return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()));
})();
const offPalette = text => (text.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()).filter(h => !palette.has(h));

test("the redrawn sticker animals use only the locked palette and scale strokes", () => {
  const art = source("LettersArt.js");
  for (const id of ["camel", "hoopoe", "elephant", "whale", "turtle", "ant"]) {
    const line = art.split("\n").find(l => l.startsWith(`    ${id}: \``));
    assert.ok(line, id);
    assert.deepEqual(offPalette(line), [], `${id} colours`);
    const widths = [...line.matchAll(/stroke-width="([\d.]+)"/g)].map(m => m[1]);
    assert.ok(widths.every(w => ["1.6", "2.4", "3", "4", "6", "8"].includes(w)), `${id} stroke widths ${widths}`);
  }
});

test("the hatch egg is flat with an ink contour, sits in its nest, and only the shell wobbles", () => {
  const art = source("LettersArt.js");
  const egg = art.slice(art.indexOf("  function egg({"), art.indexOf("\n  }\n", art.indexOf("  function egg({")));
  assert.doesNotMatch(egg, /Gradient/, "no shaded gradient (the flat cast was chosen over 3D)");
  assert.deepEqual(offPalette(egg), []);
  assert.ok(egg.indexOf('class="art-egg-tap"') < egg.indexOf('class="art-egg-nest"'), "the nest front is drawn over the egg");
  assert.match(egg, /cracks >= 2 \? `<path d="M12 -12/, "the second tap opens a chip");
  assert.match(egg, /art-egg-peek/, "the pet peeks out before hatching");
  const css = fs.readFileSync(path.join(root, "styles", "letters.css"), "utf8");
  assert.match(css, /\.art-egg\.is-wobble \.art-egg-tap \{ animation: lg-egg-wobble/);
});

test("a reward with no growth still shows seedlings, and later regions reuse their map landmark", () => {
  const garden = source("LettersGardenArt.js");
  assert.match(garden, /\$\{!stage \? seedlings\(\) : ''\}/);
  const game = source("LettersGame.js");
  assert.match(game, /const mark = ns\.LettersMapArt\?\.landmark\?\.\(biome, 0\)/);
  const rooms = fs.readFileSync(path.join(root, "styles", "letters-rooms.css"), "utf8");
  assert.match(rooms, /width:min\(100%,400px,calc\(\(100vh - 64px\) \* 600 \/ 430\)\)/, "short landscape gives the reward scene its column");
});
