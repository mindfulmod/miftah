const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..", "..", "..");
const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const palette = (() => {
  const art = fs.readFileSync(path.join(root, "ART.md"), "utf8");
  return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()));
})();
const off = text => (text.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()).filter(h => !palette.has(h));
function mapArt() {
  const window = { MiftahGame: { LettersGardenArt: { seedBasket: () => "<basket/>" } } };
  vm.runInNewContext(source("LettersMapArt.js"), { window, Math, console });
  return window.MiftahGame.LettersMapArt;
}

test("overworld: each land keeps its own landmarks — fruit trees only in the orchard", () => {
  const M = mapArt();
  for (let i = 0; i < 10; i += 1) {
    if (i !== 1) assert.notEqual(M.kind("meadow", i), "orchard", `meadow ${i}`);
    assert.notEqual(M.kind("river", i), "orchard", `river ${i}`);
  }
  assert.equal(M.kind("orchard", 3), "orchard");
  assert.doesNotMatch(M.landmark("meadow", 2), /lm-canopy/, "no fruit tree in the meadow");
  assert.match(M.landmark("meadow", 2), /lm-hive/, "the meadow has its wildflowers and hive");
});

test("overworld: each land's stretch of the map gets its own feathered ground band and edge scenery", () => {
  const M = mapArt();
  const biomes = ["meadow", "meadow", "orchard", "orchard", "lagoon", "night", "peaks", "peaks", "river", "river"];
  const stops = biomes.map((biome, i) => ({ y: 2000 - i * 200, biome, left: i % 2 === 0 }));
  const svg = M.landscape({ width: 400, height: 2200, pathWidth: 400, stops });
  for (const land of ["orchard", "lagoon", "night", "peaks", "river"]) assert.match(svg, new RegExp(`class="map-land-band" data-land="${land}"`), land);
  assert.doesNotMatch(svg, /data-land="meadow"/, "the meadow keeps the base ground");
  assert.deepEqual(off(svg), []);
});

test("reach: a near-miss tap goes to the one nearby target only; never to navigation or drawing surfaces", () => {
  const game = source("LettersGame.js");
  const reach = game.slice(game.indexOf("    initReach() {"), game.indexOf("    initTouchFeedback() {"));
  assert.match(reach, /if \(near\.length !== 1\) return;/, "ambiguous misses do nothing (never a wrong answer)");
  assert.match(reach, /const reach = this\.sprout \? 52 : this\.gentle \? 44 : 32;/);
  assert.match(reach, /\.lg-topbar, \.lg-grownup-dot, canvas, \.trace-guided, \.studio-canvas/);
  assert.match(reach, /if \(!e\.isTrusted \|\| e\.detail === 0/, "keyboard and scripted clicks untouched");
  assert.match(game, /this\.initTouchFeedback\(\);\n      this\.initReach\(\);/);
});

test("reach: generous drops, merges and tracing for small hands", () => {
  assert.match(source("GardenPractice.js"), /const DROP_SLACK=28;/);
  assert.match(source("MiniGames.js"), /< r\.width \* 0\.95\) \{/);
  assert.match(source("LettersStrokes.js"), /const TOL = 13, STRAY = 32, DOT_TOL = 16;/);
  const craft = fs.readFileSync(path.join(root, "styles", "letters-craft.css"), "utf8");
  assert.match(craft, /\.drawing-color \{ min-width: 52px; min-height: 52px; \}/);
});
