const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..", "..", "..");
const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const palette = (() => {
  const art = fs.readFileSync(path.join(root, "ART.md"), "utf8");
  return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()));
})();
const off = text => (text.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()).filter(h => !palette.has(h));

test("v32 Lantern Hunt and Letter Shadows: fair search, any-order shadows, honest evidence", () => {
  const src = source("ShadowGames.js");
  assert.match(src, /if \(this\.justLit === b\) \{ this\.justLit = null; return; \}/, "lighting something is its own tap");
  assert.match(src, /if \(!this\.isLit\(b\)\) \{ const h = this\.hidden\[i\]; this\.moveTo\(h\.x, h\.y\);/, "a tap in the dark moves the lantern (no dragging needed)");
  assert.match(src, /this\.radius = ctx\.beginner \? 30 : 21;/, "a sprout's lantern is bigger");
  assert.match(src, /const right = this\.left\.includes\(c\);/, "shadows can be named in any order");
  assert.match(src, /this\.max = ctx\.beginner \? 0 : 2;/, "a sprout keeps one still friend's shadow");
  assert.doesNotMatch(src, /spendStars|earnStars|saveJSON|setInterval/);
  assert.deepEqual(off(src), []);
  const css = fs.readFileSync(path.join(root, "styles", "letters-friends.css"), "utf8");
  assert.match(css, /\.sh-dark \{[^}]*radial-gradient/);
  assert.match(css, /\.sh-shadow svg \{[^}]*filter: brightness\(0\)/);
  assert.match(source("LettersGame.js"), /\['LanternHunt',2,/);
  assert.match(source("GardenBrain.js"), /"LanternHunt", "LetterShadows"\]/);
  assert.match(fs.readFileSync(path.join(root, "sw.js"), "utf8"), /"src\/letters\/ShadowGames\.js"/);
  assert.match(fs.readFileSync(path.join(root, "docs", "letter-garden", "RELEASES.md"), "utf8"), /## v32 /);
});
