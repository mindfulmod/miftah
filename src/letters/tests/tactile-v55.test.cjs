const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..", "..", "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const palette = (() => {
  const art = read("ART.md");
  return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()));
})();
const off = text => (text.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()).filter(h => !palette.has(h));

// Load Haptics.js against a fake browser.
function haptics({ ua, vibrate = false, now = () => 1000, later = (fn) => fn() }) {
  const made = [];
  const document = {
    createElement: (tag) => { const el = { tag, attrs: {}, style: {}, children: [], setAttribute(k, v) { this.attrs[k] = v; }, appendChild(c) { this.children.push(c); }, click() { made.push(this); }, remove() {} }; return el; },
    head: { appendChild() {} },
  };
  const navigator = { userAgent: ua, platform: "iPhone", maxTouchPoints: 5 };
  if (vibrate) navigator.vibrate = () => true;
  const window = { MiftahGame: {} };
  const ctx = vm.createContext({ window, document, navigator, localStorage: { getItem: () => null, setItem() {} }, setTimeout: later, Date: { now } });
  vm.runInContext(read("src/core/Haptics.js"), ctx);
  return { H: window.MiftahGame.Haptics, made };
}

test("v55 iPhone ticks: a hidden system switch is toggled by a label click, rate-limited", () => {
  let t = 1000;
  // Scheduled ticks run at once, but the clock moves on by their delay.
  const queue = [];
  const { H, made } = haptics({ ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", now: () => t, later: (fn, ms) => queue.push([ms, fn]) });
  const flush = () => { const base = t; queue.splice(0).sort((a, b) => a[0] - b[0]).forEach(([ms, fn]) => { t = base + ms; fn(); }); };
  assert.equal(H.ios, true);
  assert.equal(H.felt, true, "an iPhone can be felt");
  assert.equal(H.supported, false, "but it still has no Vibration API");
  assert.equal(H.pulse("press"), true);
  const label = made[0];
  assert.equal(label.tag, "label");
  assert.equal(label.style.display, "none");
  assert.equal(label.children[0].type, "checkbox");
  assert.equal(label.children[0].attrs.switch, "", "the switch attribute is what makes iOS tick");
  assert.equal(H.pulse("press"), false, "two ticks within 45ms are one");
  t += 50; assert.equal(H.pulse("press"), true);
  t += 50; assert.equal(H.pulse("sand"), false, "sand grain ticks at most every 120ms");
  t += 130; assert.equal(H.pulse("sand"), true);
  t += 200; const before = made.length; H.pulse("correct"); flush(); assert.equal(made.length - before, 2, "a right answer is a double tick");
  assert.equal(H.pulse("not-a-cue"), false);
});

test("v55 Android keeps the Vibration API; desktops feel nothing and don't pretend", () => {
  const android = haptics({ ua: "Mozilla/5.0 (Linux; Android 14)", vibrate: true });
  assert.equal(android.H.ios, false);
  assert.equal(android.H.pulse("press"), true);
  assert.equal(android.made.length, 0, "no switch trick where a real buzz exists");
});

test("v55 Press feel: sink while held, lip squashes, spring on release, ripple at the fingertip", () => {
  const game = read("src/letters/LettersGame.js");
  const touch = game.slice(game.indexOf("    initTouchFeedback() {"), game.indexOf("    // Ambient life"));
  assert.match(touch, /el\.classList\.add\("is-pressed"\);/);
  assert.match(touch, /window\.addEventListener\("pointerup", up, \{ passive: true \}\);/, "release is heard wherever the finger lifts");
  assert.match(touch, /if \(this\.prefersReducedMotion\(\) \|\| getComputedStyle\(el\)\.animationName !== "none"\) return;/, "no spring over something already moving");
  assert.match(touch, /if \(e\.target\.closest\?\.\("\.trace-guided, \.tb-tub"\)\) return;/, "drawing is not pressing");
  assert.match(touch, /el instanceof SVGElement && !\(el instanceof SVGSVGElement\)/, "SVG parts never sink");
  assert.match(touch, /bloom\(e\.clientX, e\.clientY, true\); return;/, "empty ground answers with a quiet ripple");
  assert.match(touch, /this\._lastTapSound = performance\.now\(\);\n\s+try \{ this\.sound\.press\(sizeOf\(el\)\); \} catch \{\}\n\s+ns\.Haptics\.pulse\("press"\);/);
  const css = read("styles/letters-friends.css");
  assert.match(css, /\.lg-app \.is-pressed \{ translate: 0 3px; scale: \.95;/, "separate properties never clobber a game's own transform");
  assert.match(css, /@keyframes lg-spring \{ 0% \{ translate: 0 3px; scale: \.95; \} 40% \{ translate: 0 -2px; scale: 1\.04; \}/, "springs past level, then settles");
  assert.match(css, /\.pz-tile, \.vh-choice, \.ws-piece, \.wd-card, \.wd-piece\)\.is-pressed \{ translate: 0 4px; box-shadow: 0 1px 0 #c9bda4/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\n\s+\.lg-app \.is-pressed \{ translate: none; scale: none; transition: none; filter: brightness\(\.92\); \}/, "reduced motion: a darken, no movement");
  assert.doesNotMatch(css, /\.pz-tile:active/, "the old per-game :active presses are gone (no double press)");
  assert.deepEqual(off(css), []);
  const sound = read("src/letters/LettersSound.js");
  assert.match(sound, /const base = \(size > 1\.7 \? 290 : size > 1\.1 \? 370 : 460\) \* wobble;/, "bigger things sound deeper");
  assert.match(read("letters.html"), /src\/core\/Haptics\.js\?v=2026\d{4}-v\d+/);
});
