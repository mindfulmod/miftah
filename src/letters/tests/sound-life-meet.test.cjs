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

function loadSound() {
  const window = { MiftahGame: {} };
  vm.runInNewContext(source("LettersSound.js"), { window, setTimeout, clearTimeout, performance: { now: () => 0 }, Math });
  return window.MiftahGame.LettersSound;
}
function loadArt() {
  const ctx = { getImageData: () => ({ data: [] }), fillText() {}, clearRect() {}, measureText: () => ({ width: 0 }) };
  const window = { MiftahGame: {} };
  vm.runInNewContext(source("LettersArt.js"), { window, document: { createElement: () => ({ getContext: () => ctx }) }, console, Math, Date });
  return window.MiftahGame.LettersArt;
}

test("sound world: material cues and pet voices are built from tone/noise, quiet, and never reward cues", () => {
  const Sound = loadSound();
  const calls = [];
  const base = { enabled: true, unlock() {}, tone: (f, o) => calls.push(["tone", f, o]), noise: o => calls.push(["noise", o]), play: n => calls.push(["named", n]) };
  const s = new Sound(base);
  for (const name of Object.keys(Sound.CUES)) { calls.length = 0; s.play(name); assert.ok(calls.length > 0, name); assert.ok(calls.every(([k]) => k !== "named"), `${name} is synthesized`); }
  for (const steps of [...Object.values(Sound.CUES), ...Object.values(Sound.VOICES)]) {
    for (const [, , a, b] of steps) { const o = b || a; assert.ok((o.gain ?? 0) <= 0.07, `gain ${o.gain}`); }
  }
  calls.length = 0; s.voice("dragon"); assert.ok(calls.length >= 2);
  calls.length = 0; s.voice("unknown-species"); assert.equal(calls.length, Sound.VOICES.blob.length, "unknown species fall back to blob");
  base.enabled = false; calls.length = 0; s.play("splash"); s.voice("cat"); assert.equal(calls.length, 0, "muted is silent");
  for (const n of ["correct", "wrong", "star1", "sticker"]) assert.ok(!Sound.CUES[n], `${n} keeps its original meaning`);
});

test("sound world: land beds follow activity screens, stop when hidden, and every land has one", () => {
  const Sound = loadSound();
  assert.deepEqual(Object.keys(Sound.LANDS).sort(), ["lagoon", "meadow", "night", "orchard", "peaks", "river"]);
  for (const spec of Object.values(Sound.LANDS)) assert.ok(spec.gain <= 0.015, "beds stay under speech");
  const game = source("LettersGame.js");
  assert.match(game, /this\.landBed = activityLand \|\| \(className === "lg-my-garden" \? "river"/);
  assert.match(game, /this\._landVisibility = \(\) => this\.sound\.setLand\?\.\(document\.hidden \? null : this\.landBed\)/);
  const s = new Sound({ enabled: true, unlock() {} });
  s.setLand("lagoon"); assert.equal(s.land, "lagoon"); s.setLand("volcano"); assert.equal(s.land, null);
});

test("sound world: toys, crafts and the pet are wired to their materials", () => {
  const deco = source("DecoratingGarden.js");
  for (const cue of ["rustle", "splash", "creak", "clink", "pour"]) assert.match(deco, new RegExp(`play\\?\\.\\('${cue}'\\)`), cue);
  assert.match(source("MiniGames.js"), /this\.docked\.push\(art\);\n      this\.ctx\.sfx\?\.\('dock'\);/);
  assert.match(source("WaterGarden.js"), /this\.ctx\.sfx\?\.\('turn'\)/);
  const game = source("LettersGame.js");
  assert.match(game, /\{ garland: "thread", harvest: "thud", jars: "clink", raft: "dock" \}/);
  assert.match(game, /this\.sound\.voice\?\.\(this\.pet\?\.species\)/);
  assert.match(game, /this\.sound\.play\(n >= 3 \? "hatch" : "crack"\)/);
});

test("living lands: every land has creatures by day and by night, on palette, gone under reduced motion", () => {
  const Art = loadArt();
  for (const biome of ["meadow", "orchard", "lagoon", "night", "peaks", "river"]) {
    for (const night of [false, true]) {
      const life = Art.landLife(biome, night, "#a89478");
      assert.match(life, /class="art-life"/, `${biome} ${night ? "night" : "day"}`);
      const off = (life.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()).filter(h => !palette.has(h));
      assert.deepEqual(off, [], `${biome} colours`);
    }
  }
  assert.match(Art.backdrop("day", "lagoon"), /data-life="lagoon"/);
  assert.match(source("LettersGardenArt.js"), /class="garden-life"/);
  const style = css("letters.css");
  assert.match(style, /\.lg-reduce-motion \.art-life \{ display: none; \}/);
  assert.match(style, /@media \(prefers-reduced-motion: reduce\) \{ \.art-life \{ display: none; \} \}/);
  assert.match(style, /\.art-life \{ pointer-events: none; \}/);
});

test("meet: the letter is the hero on a sign that inks in writing direction; trail shows only letters already met", () => {
  const Art = loadArt();
  const ar = Art.letterSign({ label: "ج", hue: 150 }), la = Art.letterSign({ label: "ba", latin: true });
  assert.match(ar, /data-dir="rtl"/); assert.match(la, /data-dir="ltr"/);
  assert.match(ar, /font-size="118"/, "a single letter fills the sign");
  assert.match(ar, /clip-path="url\(#/);
  const style = css("letters.css");
  assert.match(style, /\.meet-card \.art-sign \.sign-wipe \{ transform-box: fill-box; transform-origin: 100% 50%; \}/);
  assert.match(style, /\.lg-reduce-motion \.meet-card \.art-sign \.sign-wipe/);
  assert.doesNotMatch(style, /content: "🗣"/, "no platform emoji for the your-turn cue");
  const game = source("LettersGame.js");
  assert.match(game, /const bigCard = \(Art\.letterSign \|\| Art\.blobCard\)/);
  assert.match(game, /s\.world\.meet\.map\(\(m, i\) => i < s\.meetIndex/, "only letters already met appear");
  assert.match(game, /class="lg-round-btn meet-hear adventure-companion"/);
});
