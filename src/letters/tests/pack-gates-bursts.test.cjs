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
const off = text => (text.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()).filter(h => !palette.has(h));

test("sticker stand (v5) replaced the blind pack: three face-up choices, pay on choosing, daily earns a visit", () => {
  const game = source("LettersGame.js");
  assert.doesNotMatch(game, /openPackCeremony|const win = unowned\[Math\.floor/, "no blind packet (spec 02 declined list)");
  const stand = game.slice(game.indexOf("    openStickerStand(el, offer) {"), game.indexOf("    landSticker(") > game.indexOf("    openStickerStand(") ? game.indexOf("    landSticker(") : undefined);
  assert.match(game, /const offer = unowned\.map\(s => s\.id\)\.sort\(\(\) => Math\.random\(\) - 0\.5\)\.slice\(0, 3\);/);
  assert.match(game, /if \(this\.stickers\.freeVisits\) this\.stickers\.freeVisits -= 1;\n        else if \(!this\.spendStars\(5\)\)/, "pay only when choosing");
  assert.match(game, /if \(firstToday && this\.stickers\) \{ this\.stickers\.freeVisits = Math\.min\(9, \(this\.stickers\.freeVisits \|\| 0\) \+ 1\);/);
  assert.match(game, /const leave = \(\) => \{ if \(chosen\) return;/, "leaving the stand costs nothing");
  assert.match(source("LettersState.js"), /if \(Number\.isInteger\(value\.freeVisits\) && value\.freeVisits > 0\) out\.freeVisits = Math\.min\(9, value\.freeVisits\);/);
  assert.match(game, /if\(justOpened\)\{const slot=el\.querySelector\(`\[data-sticker="\$\{justOpened\}"\]`\);if\(slot\)this\.landSticker\(slot,justOpened,from\);\}/);
  const room = source("LettersRoomArt.js");
  assert.deepEqual(off(room.slice(room.indexOf("function stand("), room.indexOf("const trick="))), []);
  assert.doesNotMatch(room, /packOpen|stickerBack/);
});

test("land gates: one per land boundary, rolled until reached, unfurled once on arrival and remembered", () => {
  const state = source("LettersState.js");
  assert.match(state, /if \(name === "lands-seen"\) return Array\.isArray\(value\)/);
  const window = { MiftahGame: {}, localStorage: { getItem: () => null, setItem() {} } };
  vm.runInNewContext(state, { window, localStorage: window.localStorage, console });
  const map = source("LettersMapArt.js");
  assert.match(map, /function gate\(biome='orchard',open=false,dir=1\)/);
  for (const land of ["orchard", "lagoon", "night", "peaks", "river"]) assert.match(map, new RegExp(`${land}:\``), `${land} sign`);
  assert.deepEqual(off(map.slice(map.indexOf("const LAND_SIGNS"), map.indexOf("ns.LettersMapArt={gate"))), []);
  const game = source("LettersGame.js");
  assert.match(game, /if \(!land \|\| land === worlds\[i\]\.biome\) continue;/);
  assert.match(game, /const open = reached && this\.landsSeen\.includes\(land\);/);
  assert.match(game, /this\.saveJSON\("quran-trainer:letters:lands-seen", this\.landsSeen\);/);
  assert.match(game, /this\.sound\.play\("biomeArrival"\);/);
  const style = css("letters-map-world.css");
  assert.match(style, /\.map-gate \.map-gate-banner\{transform-box:fill-box;transform-origin:50% 0;transform:scaleY\(0\)\}/);
  assert.match(style, /\.lg-reduce-motion \.map-gate \.map-gate-banner/);
});

test("material bursts: right answers answer in the activity's material; rewards keep the golden party", () => {
  const art = source("LettersArt.js");
  const bursts = art.slice(art.indexOf("  const BURSTS = {"), art.indexOf("  function confetti("));
  for (const m of ["petals", "water", "wood", "seeds", "glints"]) assert.match(bursts, new RegExp(`${m}: \\{ colors:`), m);
  assert.deepEqual(off(bursts), []);
  const game = source("LettersGame.js");
  assert.match(game, /golden \? null : this\.activityMaterial\(\)/);
  assert.match(game, /\{ garland: "petals", harvest: "seeds", jars: "glints", raft: "wood" \}\[journey\.kind\]/);
  assert.match(game, /pop: "water", catch: "seeds", feed: "seeds", build: "wood"/);
  assert.match(game, /const cue = \{ water: "ripple", wood: "dock", seeds: "thud", glints: "clink" \}\[this\.activityMaterial\(\)\];/);
  assert.match(game, /this\.currentActivity = className === "lg-play" \? activity : null;/);
  const style = css("letters.css");
  for (const shape of ["is-drop", "is-chip", "is-seed", "is-glint"]) assert.match(style, new RegExp(`\\.lg-confetti-layer i\\.${shape}`));
});
