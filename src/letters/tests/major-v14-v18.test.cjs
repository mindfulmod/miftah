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
const slice = (from, to) => game.slice(game.indexOf(from), game.indexOf(to));

test("v14 Real Recitation: Quran words recite, fall back on the same job, and the clip is never cached", () => {
  const recite = slice("    recite(item, onEnd) {", "    canSpeak(item) {");
  assert.match(recite, /const fallback = \(\) => \{/);
  assert.match(recite, /this\.voice\?\.play\(text, job, \(\) => this\.startNativeSpeech\(text, job\)\)/, "fallback keeps the caller's hooks");
  assert.match(recite, /setTimeout\(\(\) => \{ if \(!started\) fallback\(\); \}, 2500\);/);
  assert.match(game, /try \{ this\.recitation\?\.stop\(\); \} catch \{\}/, "stopSpeech also stops recitation");
  assert.match(fs.readFileSync(path.join(root, "sw.js"), "utf8"), /if \(AUDIO_HOSTS\.has\(url\.hostname\)\) return;/, "recitation stays uncached (it broke playback before)");
});

test("v15 Ayah Garden: whole short surahs kept, opened after the first word chapter, read right to left", () => {
  assert.match(source("LettersWorlds.js"), /\(this\.surahs \|\|= new Map\(\)\)\.set\(n,/);
  assert.match(game, /ayahGardenOpen\(\) \{ return \(this\.progress\?\.done \|\| \[\]\)\.includes\("words-2"\)/);
  const ayah = slice("    renderAyahGarden(number, ayahIndex = 0) {", "    loadStamps()");
  assert.match(ayah, /dir="rtl" lang="ar"/);
  assert.doesNotMatch(ayah, /reportOutcome|spendStars/);
  assert.match(fs.readFileSync(path.join(root, "styles", "letters-rooms.css"), "utf8"), /\.ayah-controls\{display:flex;align-items:center;gap:16px;direction:rtl\}/);
});

test("v16 Letter Constellations: seven families, bright/dim/unseen from mastery, gold lines only when strong, on palette", () => {
  const chart = slice("    renderStarChart() {", "    // Ayah Garden (v15, 2026-10-02):");
  assert.match(chart, /return !seen \? "unseen" : strength\.mastery\(l\.char\) >= 0\.7 \? "bright" : "dim";/);
  assert.match(chart, /strong\.has\(pack\.id\) \? "#f3c955" : "#6064a0"/);
  assert.deepEqual(off(chart), []);
  assert.doesNotMatch(chart, /saveJSON|spendStars/);
});

test("v17 Gentle mode: per child; calms senses, hides the timed challenge, repeats the prompt after a pause", () => {
  const state = source("LettersState.js");
  assert.match(state, /if \(name === "gentle"\)/);
  assert.doesNotMatch(state.match(/const SHARED = new Set\(\[[^\]]*\]\)/)[0], /gentle/, "gentle belongs to one child");
  assert.match(game, /if \(this\.gentle\) this\.landBed = null;/);
  assert.match(game, /if\(this\.worlds\.dailySession\(this\.progress\.done\)&&!this\.gentle\)choices\.push\('Burst'\);/);
  assert.match(game, /if \(!el\?\.isConnected \|\| this\.prefersReducedMotion\(\) \|\| this\.gentle\) return;/);
  const idle = slice("    watchIdlePrompt(screenEl) {", "    topBar({ home = true } = {}) {");
  assert.match(idle, /if \(repeats >= 2\) return;/);
  assert.match(idle, /}, 8000\);/);
});

test("v18 Sibling Play Dates: other children's hatched pets visit, read-only", () => {
  const sib = slice("    addSiblingPets(board) {", "    // Sound Lab (v11):");
  assert.match(sib, /S\.profiles\(\)\.filter\(p => p\.id !== me\)\.map\(p => S\.readAs\(p\.id, "quran-trainer:letters:pet", null\)\)\.filter\(Boolean\)\.slice\(0, 2\)/);
  assert.doesNotMatch(sib, /saveJSON|write\(/, "a visit never changes a sibling's data");
  const notes = fs.readFileSync(path.join(root, "docs", "letter-garden", "RELEASES.md"), "utf8");
  for (const v of ["v14", "v15", "v16", "v17", "v18"]) assert.match(notes, new RegExp(`## ${v} `));
});

test("free friends (Lumi the owl-like garden bird, Mina, Rafi the bear) can be chosen without stars", () => {
  assert.match(game, /if \(!bodies\.includes\(id\) && body\.cost === 0\) bodies\.push\(id\);\n          if \(!bodies\.includes\(id\)\) \{\n            if \(!this\.spendStars\(body\.cost\)\)/);
  assert.match(game, /if\(!Number\.isSafeInteger\(n\)\|\|n<=0\)return false;/, "spendStars still refuses zero — so free friends must bypass it");
  const rig = source("LettersPetRig.js");
  for (const id of ["lumi", "mina", "rafi"]) assert.match(rig, new RegExp(`${id}: \\{ \\.\\.\\.ANIMAL`), `${id} is rigged`);
});
