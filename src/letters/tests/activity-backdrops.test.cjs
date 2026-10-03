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

function loadArt() {
  const ctx = { getImageData: () => ({ data: [] }), fillText() {}, clearRect() {}, measureText: () => ({ width: 0 }) };
  const window = { MiftahGame: {} };
  const sandbox = { window, document: { createElement: () => ({ getContext: () => ctx }) }, console, Math, Date };
  vm.runInNewContext(source("LettersArt.js"), sandbox);
  return window.MiftahGame.LettersArt;
}

test("each chapter land dresses the activity backdrop, by day and by night, on palette", () => {
  const Art = loadArt();
  const marks = { orchard: "art-fruit-tree", lagoon: "art-lagoon", night: "art-lantern", peaks: "art-peaks", river: "art-river" };
  for (const phase of ["morning", "day", "sunset", "night"]) {
    const meadow = Art.backdrop(phase, "meadow");
    for (const [biome, mark] of Object.entries(marks)) {
      const svg = Art.backdrop(phase, biome);
      assert.match(svg, new RegExp(`data-biome="${biome}"`));
      assert.match(svg, new RegExp(mark), `${biome} ${phase}`);
      assert.doesNotMatch(meadow, new RegExp(mark), "the meadow stays plain");
    }
  }
  // ramp() may generate the band colours (ART.md §2 generated colour); the hand-drawn land art may not.
  const art = source("LettersArt.js");
  const lands = art.slice(art.indexOf("  function biomeScenery("), art.indexOf("  function backdrop("));
  assert.deepEqual((lands.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()).filter(h => !palette.has(h)), []);
  assert.match(Art.backdrop("day", "volcano"), /data-biome="meadow"/, "unknown lands fall back to the meadow");
  assert.match(Art.backdrop(), /data-biome="meadow"/);
});

test("only activity screens take the chapter land; home, map and menus keep the meadow", () => {
  const game = source("LettersGame.js");
  assert.match(game, /const activityLand = \["lg-meet", "lg-play", "lg-stars", "lg-party"\]\.includes\(className\) \? this\.session\?\.world\?\.biome : undefined;/);
  assert.match(game, /Art\.backdrop\(undefined, activityLand\)/);
});

test("palette pass 2: fruit-world ramps exist and ribbons are the only free stroke widths", () => {
  const art = fs.readFileSync(path.join(root, "ART.md"), "utf8");
  assert.match(art, /\| Sage .*`#c4d39b` \| `#93ab6c` \| `#647d4e` \| `#3e5236` \|/);
  assert.match(art, /\| Lavender .*`#e6d6f0` \| `#b49fcf` \| `#8c74b0` \| `#5e4680` \|/);
  const checker = fs.readFileSync(path.join(root, "scripts", "check-palette.mjs"), "utf8");
  assert.match(checker, /tag\.includes\("data-ribbon"\)/);
  for (const line of source("LettersArt.js").split("\n").filter(l => /^\s{4}(olive|grapes|fig|snake|spider|crow|fish|bee|butterfly): `/.test(l))) {
    const off = (line.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()).filter(h => !palette.has(h));
    assert.deepEqual(off, [], line.slice(0, 20));
  }
});
