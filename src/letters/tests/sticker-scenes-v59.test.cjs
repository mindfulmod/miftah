const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..", "..", "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const palette = (() => { const art = read("ART.md"); return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase())); })();
const off = (t) => (t.match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase()).filter((h) => !palette.has(h));

test("v59 Sticker Scenes: four drawn scenes, palette-only, allowed stroke widths", () => {
  const src = read("src/letters/StickerScenes.js");
  assert.deepEqual(off(src), []);
  const widths = new Set((src.match(/stroke-width="([0-9.]+)"/g) || []).map((m) => m.match(/"([0-9.]+)"/)[1]));
  for (const w of widths) assert.ok(["1.6", "2.4", "3", "4", "6", "8"].includes(w), `stroke ${w}`);
  const window = { MiftahGame: {} };
  vm.runInContext(src, vm.createContext({ window, document: {}, Math, Number, Array, Object, JSON, Set }));
  const S = window.MiftahGame.StickerScenes;
  assert.equal(JSON.stringify(S.SCENE_IDS), '["meadow","sea","night","oasis"]');
});

test("v59 Sticker Scenes: saved arrangements keep only owned stickers, inside the picture, at most 24", () => {
  const window = { MiftahGame: {} };
  vm.runInContext(read("src/letters/StickerScenes.js"), vm.createContext({ window, document: {}, Math, Number, Array, Object, JSON, Set }));
  const { clean, MAX } = window.MiftahGame.StickerScenes;
  const out = clean([{ id: "sun", x: 150, y: -20 }, { id: "notmine", x: 50, y: 50 }, { id: "dove", x: 40, y: 60 }, null], ["sun", "dove"]);
  assert.equal(JSON.stringify(out), JSON.stringify([{ id: "sun", x: 96, y: 6 }, { id: "dove", x: 40, y: 60 }]));
  assert.equal(clean(Array.from({ length: 40 }, () => ({ id: "sun", x: 50, y: 50 })), ["sun"]).length, MAX);
});

test("v59 Sticker Scenes: reached from the album when stickers are owned; tap places, drag moves, drag off removes", () => {
  const game = read("src/letters/LettersGame.js");
  assert.match(game, /\$\{owned\.size && ns\.StickerScenes \? `<button type="button" class="album-scenes"/);
  assert.match(game, /const SCENES_KEY = "quran-trainer:letters:sticker-scenes";/);
  const src = read("src/letters/StickerScenes.js");
  assert.match(src, /if \(!d\.moved\) \{\n\s+\/\/ Tap: somewhere in the middle of the picture/);
  assert.match(src, /if \(!p\.inside\) \{ list\.splice\(i, 1\); this\.ctx\.sound\?\.\("pop"\); \}/);
  assert.match(read("letters.html"), /src\/letters\/StickerScenes\.js\?v=2026[0-9]{4}-v[0-9]+/);
  assert.match(read("sw.js"), /"src\/letters\/StickerScenes\.js",/);
  assert.match(read("styles/letters-rooms.css"), /@media \(prefers-reduced-motion: reduce\)\{\.ss-sticker\.is-new svg\{animation:none\}/);
});
