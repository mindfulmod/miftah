const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..", "..", "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const palette = (() => { const art = read("ART.md"); return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase())); })();
const off = (t) => (t.match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase()).filter((h) => !palette.has(h));
const load = () => { const window = { MiftahGame: {} }; const ctx = vm.createContext({ window, Math, String, Number, Array, Object, JSON, Set, Map, setTimeout, clearTimeout }); vm.runInContext(read("src/letters/PictureWords.js"), ctx); vm.runInContext(read("src/letters/CostumeHouse.js"), ctx); return window.MiftahGame; };

test("v62 positional forms: each letter's place in a word (start, middle, end, alone), non-joiners respected", () => {
  const { CostumeHouse: C } = load();
  const f = (w) => C.forms(w).map((p) => p.base + ":" + p.form).join(" ");
  assert.equal(f("نَخْلَة"), "ن:start خ:middle ل:middle ة:end");
  assert.equal(f("فَرَاشَة"), "ف:start ر:end ا:alone ش:start ة:end", "ر and ا never join forward");
  assert.equal(f("فِيل"), "ف:start ي:middle ل:end");
  assert.equal(f("عُشّ"), "ع:start ش:end");
  // Marks stay with their letter; joiners force the shape.
  const n = C.forms("نَخْلَة");
  assert.equal(n[0].text, "نَ‍");
  assert.equal(n[1].text, "‍خْ‍");
  assert.equal(n[3].text, "‍ة");
});

test("v62 costumes: a visible joining tail per place; non-joiners have only two", () => {
  const { CostumeHouse: C } = load();
  assert.equal(C.costume("ب", "start"), "بـ");
  assert.equal(C.costume("ب", "middle"), "ـبـ");
  assert.equal(C.costume("ب", "end"), "ـب");
  assert.equal(C.canStart("ر"), false);
  assert.equal(C.canStart("ب"), true);
});

test("v62 the Costume House: three games, opened after the joining chapter, words drawn right-to-left", () => {
  const src = read("src/letters/CostumeHouse.js");
  assert.deepEqual(off(src), []);
  const game = read("src/letters/LettersGame.js");
  assert.match(game, /if\(ns\.CostumeHouse&&\(this\.progress\.done\|\|\[\]\)\.includes\('join-1'\)&&this\.petKnowledge\(\)\.length>=3\)choices\.push\('CostumeHouse'\);/);
  assert.match(game, /\['read',\['BookCorner','CostumeHouse','ListenFind','WordGap'\]\]/);
  assert.match(game, /\.\.\.\(ns\.CostumeHouse\?\.KINDS\|\|\[\]\),/);
  const css = read("styles/letters-friends.css");
  assert.match(css, /\.ch-word \{ display: flex; flex-direction: row; justify-content: center;/, "dir=rtl does the ordering; row-reverse would flip words backwards");
  assert.match(read("letters.html"), /src\/letters\/CostumeHouse\.js\?v=20261016-v62/);
});
