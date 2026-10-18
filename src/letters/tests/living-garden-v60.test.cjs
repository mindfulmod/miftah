const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..", "..", "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const palette = (() => { const art = read("ART.md"); return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase())); })();
const off = (t) => (t.match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase()).filter((h) => !palette.has(h));
const sg = read("src/letters/StoryGarden.js");

test("v60 Living Friends' Garden: up to six home friends play in a meadow, a different group each day", () => {
  assert.match(sg, /\$\{home\.size \? `<div class="sg-meadow" aria-label="Your friends at play">/);
  const body = sg.slice(sg.indexOf("    meadowFriends(home) {"), sg.indexOf("    wireMeadow(el) {"));
  const fn = new Function(`return { ${body.trim().replace(/,\s*$/, "")} }`)();
  const home = Array.from({ length: 12 }, (_, i) => "c" + i);
  const pick = fn.meadowFriends(home);
  assert.equal(pick.length, 6);
  assert.equal(new Set(pick).size, 6);
  assert.equal(JSON.stringify(fn.meadowFriends(["a", "b"])), '["a","b"]');
});

test("v60 meeting friends dance; letter siblings (same shape) share a heart; still under reduced motion", () => {
  assert.match(sg, /pop\(b, kin\(b\.dataset\.c, mate\.dataset\.c\) \? "heart" : "note"\);/);
  assert.match(sg, /const kin = \(a, b\) => !!P\?\.bodyKey && P\.bodyKey\(a\) && P\.bodyKey\(a\) === P\.bodyKey\(b\);/);
  assert.match(sg, /if \(still\(\) \|\| roamers\.length < 1\) return;/, "no strolling under reduced motion; taps still work");
  assert.deepEqual(off(sg.slice(sg.indexOf("// ---------- the living meadow"), sg.indexOf("// ---------- the Bismillah graduation"))), []);
  const css = read("styles/letters-friends.css");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.lg-friends-garden \.sg-roamer \{ transition: none; \}/);
  assert.match(css, /@media \(max-width: 500px\) \{ \.lg-friends-garden \.sg-roamer:nth-child\(n\+5\) \{ display: none; \} \}/);
});
