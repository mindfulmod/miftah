const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..", "..", "..");
const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const palette = (() => {
  const art = fs.readFileSync(path.join(root, "ART.md"), "utf8");
  return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()));
})();
const off = text => (text.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()).filter(h => !palette.has(h));
const stickerIds = (() => {
  const art = source("LettersArt.js");
  const block = art.slice(art.indexOf("const STICKER_ART = {"), art.indexOf("ns.LETTERS_STICKERS"));
  return new Set([...block.matchAll(/^\s{4}([a-z]+):/gm)].map(m => m[1]));
})();

function load(files) {
  const window = { MiftahGame: {} };
  const ctx = vm.createContext({ window, console, Math, JSON, Map, Set, setTimeout, clearTimeout });
  for (const f of files) vm.runInContext(source(f), ctx, { filename: f });
  return window.MiftahGame;
}

test("v27 Picture Words: real sticker pictures, vowelled names, first letters right", () => {
  const { PictureWords: P } = load(["PictureWords.js"]);
  assert.ok(P.LIST.length >= 30);
  for (const p of P.LIST) {
    assert.ok(stickerIds.has(p.sticker), `${p.sticker} is a real sticker picture`);
    assert.match(p.word, /[َُِْ]/, `${p.en} is vowelled`);
    assert.equal(p.char, [...p.word][0]);
  }
  assert.equal(new Set(P.LIST.map(p => p.id)).size, P.LIST.length, "no duplicates");
  // Same thing, same name: a picture that is also a friend shares its word.
  const friends = load(["LettersStrokes.js", "LetterFriends.js"]).LetterFriends;
  for (const p of P.LIST) {
    const f = Object.values(friends.FRIENDS).find(fr => fr.id === p.sticker);
    if (f) assert.equal(p.word, f.word, `${p.sticker} has one name`);
  }
});

test("v27 picture-book games: honest evidence, nothing paid, free play reports nothing", () => {
  const src = source("BookGames.js");
  assert.match(src, /const independent = listening && !this\.missed && this\.heard;/);
  assert.match(src, /skill: "friend"/);
  assert.match(src, /begin\(target\) \{ this\.ctx\.beginRound\?\./, "every question is its own learning round");
  assert.doesNotMatch(src, /spendStars|earnStars|saveJSON/);
  const market = src.slice(src.indexOf("class BusyMarket"), src.indexOf("ns.GardenPractice = "));
  assert.doesNotMatch(market, /report\(|reportOutcome/, "Busy Market is free play");
  // Sound Sort never shows a friend that is the same thing as the card.
  assert.match(src, /filter\(\(p\) => this\.plain \|\| !friendWords\.has\(p\.word\)\)/);
  // Finished games ignore late taps.
  assert.match(src, /finish\(\) \{ this\.card = null; this\.busy = true;/);
  assert.deepEqual(off(src), []);
  assert.deepEqual(off(source("PictureWords.js")), []);
});

test("v27 Book Corner and walk: all games on one shelf; walks rotate association games", () => {
  const game = source("LettersGame.js");
  assert.match(game, /renderBookCorner\(\) \{/);
  for (const k of ["FriendBook", "FriendFind", "PeekFlaps", "SoundSort", "FriendShapes", "HoopoeTrip", "BusyMarket"]) assert.match(game, new RegExp(`\\['${k}',`));
  assert.match(game, /choices\.splice\(1,0,'BookCorner'\)/);
  assert.match(source("GardenBrain.js"), /pickOne\(\["FriendFind", "PeekFlaps", "SoundSort", "FriendShapes", "FillGap"\]\)/);
  assert.match(source("LettersState.js"), /FriendBook\|PeekFlaps\|SoundSort\|HoopoeTrip\|FriendShapes\|BusyMarket/);
  const html = fs.readFileSync(path.join(root, "letters.html"), "utf8");
  const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  for (const f of ["PictureWords.js", "BookGames.js"]) { assert.match(html, new RegExp(`src/letters/${f}\\?v=`)); assert.match(sw, new RegExp(`"src/letters/${f}"`)); }
  assert.match(fs.readFileSync(path.join(root, "docs", "letter-garden", "RELEASES.md"), "utf8"), /## v27 /);
});
