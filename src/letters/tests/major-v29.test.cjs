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

function load() {
  const window = { MiftahGame: {} };
  const ctx = vm.createContext({ window, console, Math, JSON, Map, Set, setTimeout, clearTimeout });
  for (const f of ["LettersStrokes.js", "LetterFriends.js", "LivingBooks.js"]) vm.runInContext(source(f), ctx, { filename: f });
  return window.MiftahGame;
}

test("v29 Living Books: four books from the child's own friends, grammar-checked demonstratives", () => {
  const ns = load();
  const { BOOKS, isFem, thisIs } = ns.LivingBooks;
  assert.deepEqual(BOOKS.map(b => b.id).join(","), "where,what,morning,night");
  assert.equal(BOOKS.find(b => b.id === "night").bedtime, true);
  // هٰذِهِ for feminine friends (ta marbuta, and the sun), هٰذَا otherwise.
  assert.equal(thisIs("ب"), "هٰذِهِ بَطَّة");
  assert.equal(thisIs("د"), "هٰذَا دُبّ");
  assert.ok(isFem("ش") && isFem("ق") && !isFem("ف"));
  const known = ["ا", "ب", "ت", "ث"];
  for (const b of BOOKS) {
    const pages = b.pages(known);
    assert.ok(pages.length >= 4, `${b.id} has pages`);
    for (const p of pages) {
      assert.match(p.text, /[َُِْ]/, "vowelled text");
      // A completion blank always points at a real word and a real friend.
      if (p.complete) { assert.ok(p.text.split(" ")[p.complete[0]]); assert.ok(ns.LetterFriends.FRIENDS[p.complete[1]]); }
    }
  }
  const where = BOOKS[0].pages(known);
  assert.equal(where[where.length - 1].art.flap, "ب", "Batta is found on the last page");
  assert.ok(where.slice(0, -1).every(p => p.art.flap !== "ب"));
});

test("v29 reading is presentation: no evidence, a decodability gate, completion that never fails", () => {
  const src = source("LivingBooks.js");
  assert.doesNotMatch(src, /reportOutcome|spendStars|earnStars/);
  assert.match(src, /this\.later\(ok, 6000\)/, "the book carries on by itself");
  assert.match(src, /if \(b\.classList\.contains\("is-decodable"\)\) \{/);
  assert.match(src, /lb-book-\$\{this\.book\.kind\}/, "container class never collides with .lb-flap");
  assert.deepEqual(off(src), []);
  const game = source("LettersGame.js");
  const can = game.slice(game.indexOf("    canDecode(word) {"), game.indexOf("    renderBookShelf() {"));
  assert.match(can, /letters\.every\(c=>known\.has\(c\)\)&&tags\.prerequisiteWorldIds\.every\(id=>done\.includes\(id\)\)/);
  assert.match(game, /const BOOKS_KEY = "quran-trainer:letters:books";/);
  assert.match(game, /bookId:stop\.kind==='LivingBook'\?'night':undefined/, "a walk ends on the goodnight book");
  assert.match(source("GardenBrain.js"), /pickOne\(\["FriendBook", "LivingBook"\]\)/);
  assert.match(source("LettersState.js"), /if \(name === "books"\)/);
  assert.match(fs.readFileSync(path.join(root, "sw.js"), "utf8"), /"src\/letters\/LivingBooks\.js"/);
  assert.match(fs.readFileSync(path.join(root, "docs", "letter-garden", "RELEASES.md"), "utf8"), /## v29 /);
});
