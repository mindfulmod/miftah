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
const game = source("LettersGame.js");

test("Chapter friend game is an optional, wordless party action", () => {
  const party = game.slice(game.indexOf("    renderParty(stars"), game.indexOf("    renderGrowUp()"));
  assert.match(party, /class="party-bonus" aria-label="Play an extra friend game"/);
  assert.match(party, /practicePicture\(bonus\.kind\)/);
  assert.match(party, /friendStop\.onclick = \(\) => this\.playChapterFriend\(el, chapter, bonus, stars\)/);
  const finish = game.slice(game.indexOf("    finishWorld() {"), game.indexOf("    playChapterFriend("));
  assert.match(finish, /this\.renderParty\(partyStars, newlyDone\);/);
  assert.doesNotMatch(finish, /startPractice\(/, "chapter completion does not launch the optional game");
});

test("UI pass: 56px controls, one press feel and focus ring", () => {
  const css = fs.readFileSync(path.join(root, "styles", "letters-friends.css"), "utf8");
  assert.match(css, /\.lg-screen\.lg-home \.map-daily-row button \{ width: 56px !important; height: 56px !important;/);
  for (const rule of [/\.album-tab \{ width: 62px; height: 56px; \}/, /\.lb-word \{ min-width: 52px; min-height: 56px; \}/, /\.lab-tile \{ width: 56px; height: 62px; \}/, /\.studio-ink \{ width: 52px; height: 52px; \}/]) assert.match(css, rule);
  assert.match(source("PuzzleGames.js"), /const HEDGE = `<svg/, "a real hedge, not a stripe pattern");
  assert.deepEqual(off(css), []);
});
