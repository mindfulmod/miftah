const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..", "..", "..");
const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const css = file => fs.readFileSync(path.join(root, "styles", file), "utf8");

function loadArt() {
  const ctx = { getImageData: () => ({ data: [] }), fillText() {}, clearRect() {}, measureText: () => ({ width: 0 }) };
  const window = { MiftahGame: {} };
  vm.runInNewContext(source("LettersArt.js"), { window, document: { createElement: () => ({ getContext: () => ctx }) }, console, Math, Date });
  return window.MiftahGame.LettersArt;
}

test("sky: the palette reaches the screen — no scenery hue filter", () => {
  assert.match(css("letters.css"), /\.art-scenery-tint \{ filter: none; \}/);
  assert.doesNotMatch(css("letters.css"), /saturate\(1\.28\)/);
});

test("sky: sun and moon glow instead of casting ink shadows; stars never look like reward stars; clouds have no contour", () => {
  const Art = loadArt();
  const day = Art.backdrop("day"), night = Art.backdrop("night"), sunset = Art.backdrop("sunset");
  assert.match(day, /r="76" fill="#ffe49a" opacity="0\.28"/, "soft sun light");
  assert.match(night, /r="62" fill="#6064a0"/, "moon halo");
  assert.doesNotMatch(day + night, /fill="#4a3620" opacity="0\.1[68]"/, "no dark offset shadow behind the sky lights");
  const stars = night.slice(night.indexOf('class="art-stars"'), night.indexOf("</g>", night.indexOf('class="art-stars"')));
  assert.match(stars, /<path d="M/, "four-point glints");
  assert.doesNotMatch(stars, /#f3c955/, "never gold");
  const clouds = day.slice(day.indexOf('class="art-clouds"'), day.indexOf("</g>\n      </g>", day.indexOf('class="art-clouds"')));
  assert.doesNotMatch(clouds, /stroke=/, "far-layer masses carry no contour");
  assert.match(clouds, /fill="#e5dcc8"/, "shaded underside");
  assert.match(sunset, /fill="#ffa798"/, "sunset clouds take a warm underside");
});

test("icons: one grid, round joins, two weights by role, and a wordless muted state", () => {
  const art = source("LettersArt.js");
  const icons = art.slice(art.indexOf("  const ICONS = {"), art.indexOf("\n  };\n", art.indexOf("  const ICONS = {")));
  const widths = [...icons.matchAll(/stroke-width="([\d.]+)"/g)].map(m => m[1]);
  assert.ok(widths.every(w => ["6", "8"].includes(w)), `icon line weights ${widths}`);
  assert.doesNotMatch(icons, /stroke-width="4"[^/]*fill="none"/);
  for (const name of ["next", "check", "arrow"]) assert.match(icons, new RegExp(`${name}: \`[^\`]*stroke-width="8"`), name);
  for (const name of ["play", "home", "star"]) assert.match(icons, new RegExp(`${name}: \`[^\`]*stroke-linejoin="round"|${name}: \`[^\`]*\\$\\{SOLID\\}`), `${name} corners are round`);
  assert.match(icons, /class="icon-muted" display="none"/);
  const pass = css("letters-art-pass.css");
  assert.match(pass, /\.lg-sound\.is-off \.icon-muted\{display:inline\}/);
  assert.match(pass, /\.lg-sound\.is-off \.icon-waves\{display:none\}/);
});

test("controls: Home has its own class and filled style, independent of the map screen", () => {
  const game = source("LettersGame.js");
  assert.match(game, /class="lg-round-btn lg-home-btn" aria-label="Home"/);
  assert.match(game, /el\.querySelector\("\.lg-home-btn"\)/);
  assert.doesNotMatch(game, /class="lg-round-btn lg-home"/);
  assert.match(css("letters-art-pass.css"), /\.lg-round-btn\.lg-home-btn\{background:#4e9677;color:#fffdf7/);
});

test("map: locked stops recede by size and colour, never opacity; plants grow through four readable stages", () => {
  for (const file of ["letters.css", "letters-map-world.css", "letters-art-pass.css"]) {
    for (const rule of css(file).match(/[^}]*is-locked[^{]*\{[^}]*\}/g) || []) {
      assert.doesNotMatch(rule, /opacity:\s*0?\.\d/, `${file}: ${rule.trim()}`);
    }
  }
  const art = source("LettersArt.js");
  assert.match(art, /stroke-width="\$\{locked \? 3 : 6\}"/);
  const game = source("LettersGame.js");
  const plant = game.slice(game.indexOf("    masteryPlant(m) {"), game.indexOf("    renderHome() {"));
  assert.doesNotMatch(plant, /#23253f/, "no cold navy ink");
  assert.match(plant, /data-plant-stage="\$\{m < 0\.15 \? "seed" : m < 0\.42 \? "sprout" : m < 0\.72 \? "bud" : "flower"\}"/, "thresholds unchanged");
  assert.match(css("letters-map-world.css"), /\.lg-home \.map-plant\{z-index:2;width:46px\}/);
});
