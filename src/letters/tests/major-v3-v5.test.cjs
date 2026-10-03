const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..", "..", "..");
const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const css = file => fs.readFileSync(path.join(root, "styles", file), "utf8");
function loadStrokes() {
  const window = { MiftahGame: {} };
  vm.runInNewContext(source("LettersStrokes.js"), { window, console, Math });
  return window.MiftahGame.LettersStrokes;
}

test("v3 Writing Garden: every isolated letter has a stroke model; harakat add their strokes after the letter", () => {
  const S = loadStrokes();
  const alphabet = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي";
  for (const ch of alphabet) {
    const strokes = S.forItem({ display: ch });
    assert.ok(strokes && strokes.length, ch);
    assert.ok(strokes.some(s => s.d), `${ch} has a body stroke`);
    for (const s of strokes) {
      if (s.dot) assert.ok(s.dot.every(v => v >= 0 && v <= 100), `${ch} dot in the box`);
      else for (const n of s.d.match(/-?\d+(\.\d+)?/g)) assert.ok(Number(n) >= -1 && Number(n) <= 101, `${ch} path in the box`);
    }
    // Body strokes are drawn before dots.
    const firstDot = strokes.findIndex(s => s.dot);
    if (firstDot >= 0) assert.ok(strokes.slice(0, firstDot).some(s => s.d), `${ch}: body before dots`);
  }
  assert.equal(S.forItem({ display: "بَ" }).length, S.forItem({ display: "ب" }).length + 1, "fatha adds one stroke");
  assert.equal(S.forItem({ display: "بًّ" }).length, S.forItem({ display: "ب" }).length + 3, "shadda + tanween add three");
  assert.equal(S.forItem({ display: "بت" }), null, "joined words keep the coverage trace");
  assert.equal(S.forItem({ display: "ba" }), null);
  // ط/ظ: loop first, stem after.
  const tah = S.LETTERS["ط"];
  assert.match(tah[1], /^M40 18L40 62$/);
});

test("v3 Writing Garden: the trace engine never fails and owns no scoring; the game reports as before", () => {
  const strokes = source("LettersStrokes.js");
  assert.match(strokes, /rubber-band back to the last quarter-mark/);
  assert.doesNotMatch(strokes, /reportOutcome|reportAssembly|sfx\(\s*["']wrong/);
  const games = source("MiniGames.js");
  assert.match(games, /const strokes = ns\.LettersStrokes\?\.forItem\?\.\(target\);/);
  assert.match(games, /onDone: \(\) => \{\n            if \(!this\.alive \|\| this\.advancing\) return;\n            this\.guided\.paint\(this\.canvas, this\.inkColor \|\| DrawingPalette\.current\(\)\);\n            this\.completeDrawing\(\);/);
  assert.match(games, /reportAssembly\(this\.ctx,target,true\);/, "completion still reports exactly as before");
  assert.match(source("LettersArt.js"), /class="sign-strokes"/);
  assert.match(css("letters.css"), /\.meet-card\.is-born \.art-sign \.sign-strokes path \{ stroke-dasharray: 100 100;/);
  assert.match(fs.readFileSync(path.join(root, "letters.html"), "utf8"), /src\/letters\/LettersStrokes\.js/);
  assert.match(fs.readFileSync(path.join(root, "sw.js"), "utf8"), /"src\/letters\/LettersStrokes\.js",/);
});

test("v4 Growing Friend: one trick per letter family, earned by mastery, with milestone gifts and a once-only show-off", () => {
  const game = source("LettersGame.js");
  const tricks = game.slice(game.indexOf("const PET_TRICKS = ["), game.indexOf("const TRICK_GIFTS"));
  for (const fam of ["boat", "smile", "little", "wave", "tall", "strong", "round"]) assert.match(tricks, new RegExp(`family: "${fam}"`));
  assert.match(game, /const TRICK_GIFTS = \[\[2, "sprout"\], \[4, "medal"\], \[7, "crown"\]\];/);
  assert.match(game, /return strong >= Math\.ceil\(pack\.letters\.length \* 0\.75\);/);
  const system = game.slice(game.indexOf("    strongFamilies() {"), game.indexOf("    // Playroom (2026-10-01):"));
  assert.doesNotMatch(system, /spendStars/, "tricks are learned, never bought");
  assert.match(system, /if \(n >= at && !owned\.includes\(id\)\) \{ owned\.push\(id\); gave = true; \}/, "gifts only add");
  assert.match(source("LettersState.js"), /if \(name === "tricks-seen"\)/);
  assert.match(game, /\['friends','outfits','colors','tricks'\]\.map/);
  assert.match(css("letters-rooms.css"), /\.lg-app \.pet-room \.pet-big\.does-spin>:is\(svg,\.lg-animal\)\{/, "tricks animate the drawing, never the centring transform");
});

test("v5 Sticker Stand: the release notes and stand art exist; the blind ceremony styles are gone", () => {
  assert.doesNotMatch(css("letters-rooms.css"), /\.pack-ceremony|\.pack-stage/);
  assert.match(css("letters-rooms.css"), /\.sticker-stand\{/);
  const notes = fs.readFileSync(path.join(root, "docs", "letter-garden", "RELEASES.md"), "utf8");
  for (const v of ["v3", "v4", "v5"]) assert.match(notes, new RegExp(`## ${v} `));
});
