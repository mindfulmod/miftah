const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..", "..", "..");
const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const css = file => fs.readFileSync(path.join(root, "styles", file), "utf8");

test("undo has its own U-turn picture everywhere; replay keeps the circle", () => {
  assert.match(source("LettersArt.js"), /undo: `<path d="M22 20H38A13 13 0 0 1 38 46H24"/);
  const practice = source("GardenPractice.js");
  assert.match(practice, /button\('Undo dot change',tool\('undo'\)/);
  assert.match(practice, /button\('Remove last dot',tool\('undo'\)/);
  assert.match(practice, /const pathUndo=\(\)=>tool\('undo'\);/);
  assert.match(source("DecoratingGarden.js"), /aria-label="Undo garden change" disabled>\$\{ns\.LettersArt\.icon\('undo',30\)\}/);
  assert.match(source("LettersGame.js"), /aria-label="Play again">\$\{Art\.icon\("replay", 34\)\}/);
});

test("effects: gentle try-again wobble, petal confetti, sparks obey the in-app motion switch", () => {
  const style = css("letters.css");
  const shake = style.slice(style.indexOf("@keyframes lg-shake"), style.indexOf("}\n", style.indexOf("@keyframes lg-shake") + 30) + 2);
  for (const px of shake.matchAll(/translateX\((-?\d+)px\)/g)) assert.ok(Math.abs(Number(px[1])) <= 4, shake);
  assert.match(style, /\.lg-reduce-motion \.is-shake \{ animation: none; \}/);
  assert.match(style, /border-radius: 70% 0 70% 0;/);
  assert.match(source("LettersGame.js"), /if \(this\.prefersReducedMotion\(\) \|\| this\.gentle\) return; \/\/ the in-app switch/);
});

test("album: uncollected stickers show their own silhouette, not a wall of question marks", () => {
  const art = source("LettersArt.js");
  const fn = art.slice(art.indexOf("  function sticker({"), art.indexOf("  function stickerPack("));
  assert.match(fn, /class="art-sticker-ghost" data-sticker-ghost="\$\{id\}"/);
  assert.doesNotMatch(fn, /M-7 -7Q-7 -17 3 -15/);
  assert.match(css("letters.css"), /\.art-sticker-ghost \[fill\]:not\(\[fill="none"\]\) \{ fill: #c9bda4; \}/);
  assert.doesNotMatch(css("letters-rooms.css"), /span\.album-slot \.art-sticker\{opacity/);
});

test("stamps: today keeps its gold once stamped; future days recede without opacity; no missed-day mark", () => {
  const pass = css("letters-art-pass.css");
  assert.match(pass, /\.stamp-cell\.is-today\.is-stamped\{background:#ffe49a\}/);
  assert.match(pass, /\.stamp-cell\.is-future\{opacity:1;background:transparent;border-style:dashed/);
  assert.doesNotMatch(source("LettersGame.js"), /is-missed/);
});
