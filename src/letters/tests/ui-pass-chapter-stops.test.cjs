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

test("Chapter friend stops: the newer games are on the main journey, before the party", () => {
  const bonus = game.slice(game.indexOf("    chapterBonus(world) {"), game.indexOf("    finishWorld() {"));
  for (const [id, kind] of [["pack-boat", "FriendFind"], ["pack-smile", "DotsLast"], ["pack-strong", "LetterShadows"], ["muqattaat", "EchoParade"], ["sukoon", "LanternHunt"]])
    assert.match(bonus, new RegExp(`"?${id}"?: "${kind}"`));
  assert.match(bonus, /if \(pick === "DotsLast" && !letters\.some\(sib\)\) return null;/, "Dots Last only where the chapter has look-alikes");
  const finish = game.slice(game.indexOf("    finishWorld() {"), game.indexOf("    renderParty("));
  assert.match(finish, /if \(!s\.checkup && !s\.daily && !s\.bonusDone\) \{/, "never in check-ups or the daily bouquet, and once per run");
  assert.match(finish, /const resume = \(\) => \{ this\.session = chapter; this\.finishWorld\(\); \};/, "leaving early still finishes the chapter");
  assert.match(finish, /return this\.startPractice\(bonus\.kind, resume, resume\);/);
});

test("UI pass: grouped practice garden, 56px controls, one press feel and focus ring", () => {
  assert.match(game, /const groups=\[\['play',/);
  for (const g of ["play", "read", "think", "write", "explore"]) assert.match(game, new RegExp(`${g}: \`<svg`));
  assert.deepEqual(off(game.slice(game.indexOf("const PG_CHIPS"), game.indexOf("const WALK_KEY"))), []);
  const css = fs.readFileSync(path.join(root, "styles", "letters-friends.css"), "utf8");
  assert.match(css, /\.lg-screen\.lg-home \.map-daily-row button \{ width: 56px !important; height: 56px !important;/);
  for (const rule of [/\.album-tab \{ width: 62px; height: 56px; \}/, /\.lb-word \{ min-width: 52px; min-height: 56px; \}/, /\.lab-tile \{ width: 56px; height: 62px; \}/, /\.studio-ink \{ width: 52px; height: 52px; \}/]) assert.match(css, rule);
  assert.match(css, /\.pg-group\[data-group="write"\]/);
  assert.match(source("PuzzleGames.js"), /const HEDGE = `<svg/, "a real hedge, not a stripe pattern");
  assert.deepEqual(off(css), []);
});
