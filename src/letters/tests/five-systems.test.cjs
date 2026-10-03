const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..", "..", "..");
const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const css = file => fs.readFileSync(path.join(root, "styles", file), "utf8");
const palette = (() => {
  const art = fs.readFileSync(path.join(root, "ART.md"), "utf8");
  return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()));
})();
const off = text => (text.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()).filter(h => !palette.has(h));
function loadArt() {
  const ctx = { getImageData: () => ({ data: [] }), fillText() {}, clearRect() {}, measureText: () => ({ width: 0 }) };
  const window = { MiftahGame: {} };
  vm.runInNewContext(source("LettersArt.js"), { window, document: { createElement: () => ({ getContext: () => ctx }) }, console, Math, Date });
  return window.MiftahGame.LettersArt;
}

test("back on the map: a newly finished chapter plays keepsake, plant, next stop and walk, then any land arrival", () => {
  const game = source("LettersGame.js");
  assert.match(game, /this\.saveProgress\(\);\n        this\.mapWelcome = \{ world: s\.world\.id \};/);
  assert.match(game, /const welcome = this\.mapWelcome;\n      this\.mapWelcome = null;/, "plays once");
  assert.match(game, /then: \(\) => this\.arriveInLand\(el, scroll, mapRig\)/);
  assert.match(game, /walkTo\(worlds\[nextI\], nextI, \{ stay: true \}\)/);
  assert.match(game, /if \(!stay\) return enter\(world\);/, "a welcome walk never enters the chapter");
  assert.match(game, /data-plant-world="\$\{world\.id\}"/);
  assert.doesNotMatch(game, /✨/, "the capstone sparkles are drawn, not emoji");
  assert.match(css("letters-map-world.css"), /\.lg-reduce-motion \.lg-home \.is-landing/);
});

test("weather: one per day from the date, rainbow never at night, behind content and under controls", () => {
  const Art = loadArt();
  assert.equal(Art.weatherFor("2026-10-07", "day"), Art.weatherFor("2026-10-07", "day"), "stable for a day");
  const seen = new Set();
  for (let d = 1; d <= 60; d += 1) seen.add(Art.weatherFor(`2026-11-${d}`, "day"));
  assert.deepEqual([...seen].sort(), ["breezy", "clear", "drizzle", "rainbow"]);
  for (let d = 1; d <= 60; d += 1) assert.notEqual(Art.weatherFor(`2026-12-${d}`, "night"), "rainbow");
  for (const w of ["breezy", "drizzle", "rainbow"]) assert.deepEqual(off(Art.weatherLayer(w, "day")), [], w);
  assert.equal(Art.weatherLayer("clear", "day"), "");
  const style = css("letters.css");
  assert.match(style, /\.lg-screen \{ isolation: isolate; \}/);
  assert.match(style, /\.lg-weather \{ position: absolute; inset: 0; z-index: -1; pointer-events: none;/);
  assert.match(style, /\.lg-reduce-motion \.wx-rain, \.lg-reduce-motion \.wx-leaf \{ display: none; \}/);
  assert.match(source("LettersSound.js"), /setRain\(on\)/);
});

test("my letters: only met chapters show letters; unreached lands are unopened packets; tap speaks", () => {
  const game = source("LettersGame.js");
  const book = game.slice(game.indexOf("    renderLetterBook() {"), game.indexOf("    loadStamps()"));
  assert.match(book, /const met = group\.worlds\.filter\(w => this\.statusOf\(w\) !== "locked"\);/);
  assert.match(book, /if \(!met\.length\) return `<section class="book-land is-unopened"/);
  assert.match(book, /this\.say\(card\);/);
  assert.doesNotMatch(book, /reportOutcome|spendStars|saveJSON/, "the book is read-only");
  assert.match(game, /class="album-tab" data-book="letters" aria-label="My letters"/);
});

test("playroom: three toys play with the pet and never touch stars or saved state", () => {
  const game = source("LettersGame.js");
  const room = game.slice(game.indexOf("    wirePlayroom(el, rig) {"), game.indexOf("    // My letters"));
  for (const toy of ["room-ball", "room-drum", "room-wand"]) assert.match(game, new RegExp(`class="room-toy ${toy}"`));
  assert.doesNotMatch(room, /spendStars|saveJSON|reportOutcome|stars/i);
  assert.match(room, /if \(beats\.length >= 3\)/);
  const art = source("LettersRoomArt.js");
  assert.deepEqual(off(art.slice(art.indexOf("const toys={"), art.indexOf("ns.LettersRoomArt="))), []);
  assert.match(source("LettersSound.js"), /drum: \[T\(0, 110/);
  assert.match(css("letters-rooms.css"), /\.lg-app \.pet-room \.room-ball\{[^}]*min-width:48px\}/);
});

test("land boards: shared boards read --lg-board; each land sets an on-palette material; meadow keeps green", () => {
  for (const [file, n] of [["letters-drawing.css", 1], ["letters-craft.css", 3]]) {
    assert.equal((css(file).match(/background:var\(--lg-board,linear-gradient\(110deg,#7fce54 -20%,#4e9677 36%,#2f5c46 70%\)\)/g) || []).length, n, file);
  }
  const style = css("letters.css");
  for (const land of ["orchard", "lagoon", "night", "peaks", "river"]) {
    const rule = style.match(new RegExp(`\\.lg-app\\[data-land="${land}"\\] \\{[^}]*\\}`))?.[0];
    assert.ok(rule, land);
    assert.deepEqual(off(rule), [], `${land} colours`);
  }
  assert.match(source("LettersGame.js"), /if \(activityLand && activityLand !== "meadow"\) this\.root\.dataset\.land = activityLand; else delete this\.root\.dataset\.land;/);
});
