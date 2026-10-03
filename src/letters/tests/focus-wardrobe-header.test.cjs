const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..", "..", "..");
const styles = fs.readdirSync(path.join(root, "styles")).filter(f => /^letters.*\.css$/.test(f));
const css = file => fs.readFileSync(path.join(root, "styles", file), "utf8");

test("focus: every Letter Garden focus ring uses one of the two focus tokens at 4px", () => {
  assert.match(css("letters.css"), /--lg-focus: #e8743c;/);
  assert.match(css("letters.css"), /--lg-focus-on-dark: #ffe49a;/);
  for (const file of styles) {
    for (const rule of css(file).match(/[^{}]*:focus-visible[^{}]*\{[^{}]*\}/g) || []) {
      for (const outline of rule.match(/outline\s*:[^;}]*/g) || []) {
        assert.match(outline, /^outline\s*:\s*4px solid var\(--lg-focus(-on-dark)?\)$/, `${file}: ${rule.trim().slice(0, 90)}`);
      }
    }
  }
});

test("wardrobe: unowned items keep their colour and the cards are large enough to read", () => {
  assert.match(css("letters.css"), /\.pet-acc:not\(\.is-owned\) \.pet-acc-art \{ opacity: 1; filter: none; \}/);
  assert.doesNotMatch(css("letters.css"), /pet-acc[^{]*\{[^}]*grayscale/);
  const rooms = css("letters-rooms.css");
  assert.match(rooms, /\.lg-app \.pet-room \.pet-acc\{width:104px;min-height:126px;/);
  assert.match(rooms, /\.pet-room \.pet-acc-art>svg,\.pet-room \.pet-acc-art>\.lg-animal\{height:90px!important;width:90px!important/);
  assert.match(rooms, /\.pet-color-options\{gap:12px;padding:10px 12px\}/);
});

test("map header: on phone portrait the tray joins the top bar; narrow phones keep their own row", () => {
  const map = css("letters-map-world.css");
  assert.match(map, /@media\(min-width:360px\) and \(max-width:600px\) and \(min-height:501px\)\{\n \.lg-screen\.lg-home \.map-daily-row\{position:absolute;left:10px;top:max\(10px,env\(safe-area-inset-top\)\)/);
  assert.match(map, /\.map-daily-row button\{width:44px;height:44px;min-width:44px/);
});
