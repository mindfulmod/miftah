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
  assert.match(src, /if \(this\.suppressClickTarget === b\) \{ this\.suppressClickTarget = null; return; \}/, "lighting something is its own tap, never an answer");
  assert.match(src, /if \(!this\.isLit\(b\)\) \{ this\.reveal\(b\);/, "a tap in the dark moves the lantern (no dragging needed)");
  assert.match(src, /this\.radius = 30;/, "the forgiving beam does not shrink while choice count increases");
  assert.match(src, /const right = expected \? c === expected && this\.left\.includes\(expected\) : this\.left\.includes\(c\);/, "shadows can be named in any order");
  assert.match(src, /this\.level = level\(ctx, this\.known, "letter-form"\);/, "shadow complexity uses the saved visual-learning level");
  assert.match(src, /const count = this\.level >= 2 && this\.known\.length >= 3 \? 2 : 1;/, "a later milestone adds the second shadow after choice count increases");
  assert.match(src, /const plain = this\.level >= 3;/, "the later level removes friend details after the count increase");
  assert.match(src, /const moving = false;/, "motion is never a required difficulty step");
  assert.doesNotMatch(src, /this\.level\s*=\s*Math\.max\([^\n]*this\.missed/, "one clean local round cannot raise shadow complexity");
  assert.doesNotMatch(src, /spendStars|earnStars|saveJSON|setInterval/);
  assert.deepEqual(off(src), []);
  const css = fs.readFileSync(path.join(root, "styles", "letters-friends.css"), "utf8");
  assert.match(css, /\.sh-dark \{[^}]*radial-gradient/);
  assert.match(css, /\.sh-shadow svg \{[^}]*filter: brightness\(0\)/);
  assert.match(source("LettersGame.js"), /\['LanternHunt',2,/);
  assert.match(source("GardenBrain.js"), /"LanternHunt", "LetterShadows"[,\]]/);
  assert.match(fs.readFileSync(path.join(root, "sw.js"), "utf8"), /"src\/letters\/ShadowGames\.js"/);
  assert.match(fs.readFileSync(path.join(root, "docs", "letter-garden", "RELEASES.md"), "utf8"), /## v32 /);
});
