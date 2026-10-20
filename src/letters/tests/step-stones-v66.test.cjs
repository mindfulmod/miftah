const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..", "..", "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const palette = (() => { const art = read("ART.md"); return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase())); })();
const off = (t) => (t.match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase()).filter((h) => !palette.has(h));

const art = () => { const window = { MiftahGame: {} }; const ctx = vm.createContext({ window, document: { createElement: () => ({ getContext: () => null }) }, Math, String, Number, Array, Object, JSON, Set, Map }); vm.runInContext(read("src/letters/LettersArt.js"), ctx); return window.MiftahGame.LettersArt; };

test("v66 step tiles: paper in wood, gold when done, the current step lifted, a dotted sand trail — palette only", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v66"), css.indexOf("/* v67"));
  assert.ok(block.length > 100);
  assert.deepEqual(off(block), []);
  assert.match(block, /\.lg-app :is\(\.journey-stop,\.adventure-stop\)\.is-done \{/);
  assert.match(block, /\.lg-app :is\(\.journey-stop\.is-now,\.adventure-stop\[aria-current\]\) \{/);
  assert.match(block, /prefers-reduced-motion: reduce\) \{ \.lg-app :is\(\.journey-stop\.is-now,\.adventure-stop\[aria-current\]\) \{ transform: none; \} \}/);
  assert.doesNotMatch(block, /stop(?![^{]*::after)[^{]*\{[^}]*\b(width|height):/, "tile sizes are unchanged");
});

test("v66 the plain chapter row marks the step you're on now", () => {
  const g = read("src/letters/LettersGame.js");
  assert.match(g, /class="journey-stop \$\{i < completed \? 'is-done' : i === completed \? 'is-now' : ''\}" role="listitem" \$\{i === completed \? 'aria-current="step" ' : ''\}aria-label/);
});

test("v66 map stops: lit carved coin, recessed paper face, a wooden star board; locked stops stay flat", () => {
  const A = art();
  const cur = A.mapStop({ hue: 200, label: "ب", status: "current" });
  const done = A.mapStop({ hue: 200, label: "ب", status: "done", stars: 2 });
  const locked = A.mapStop({ hue: 200, label: "ب", status: "locked" });
  for (const s of [cur, done]) {
    assert.match(s, /class="map-stop-light"/);
    assert.match(s, /class="map-stop-inset-shade"/);
    assert.match(s, /<g class="map-star-plaque"><rect x="-39" y="31" width="78" height="29" rx="10" fill="#70501b"\/><rect x="-39" y="29" width="78" height="29" rx="10" fill="#c69434"/);
    assert.match(s, /class="map-stop-shadow"/);
  }
  assert.match(done, /stroke="#ffe49a"/);
  assert.match(cur, /hsl\(200 78% 74%\)/);
  assert.doesNotMatch(locked, /map-stop-light|map-stop-inset-shade|map-star-plaque/);
  assert.match(locked, /map-stop-seed/);
  assert.equal((done.match(/map-star-on/g) || []).length, 2, "only earned stars, never empty slots");
  assert.equal((A.mapStop({ hue: 1, label: "ب", status: "done" }).match(/map-star-on/g) || []).length, 1, "a finished chapter shows at least one star");
});

test("v67 second look: a magnifying glass between two equal cards, the wanted letter lit gold — palette only", () => {
  const g = read("src/letters/LettersGame.js");
  assert.match(g, /arrow\.className='learning-look';arrow\.innerHTML=LOOK_GLASS;/);
  assert.doesNotMatch(g, /arrow\.innerHTML=Art\.icon\('next',24\)/, "no correction arrow");
  const glass = g.match(/const LOOK_GLASS = `([^`]*)`/)[1];
  assert.deepEqual(off(glass), []);
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v67"));
  assert.deepEqual(off(block), []);
  assert.match(block, /\.lg-app \.learning-compare\.is-target \{\n\s+border-bottom: 0;/);
  assert.doesNotMatch(block, /learning-compare:not\(\.is-target\)[^}]*(opacity|grayscale|line-through)/, "the child's pick is never faded or struck");
  assert.match(block, /prefers-reduced-motion: reduce\) \{ \.lg-app \.learning-compare\.is-target \{ animation: none; \} \}/);
});

test("v68 a wrong pick settles to rest in its own colours, never a grey husk", () => {
  const css = read("styles/letters.css");
  const rule = css.slice(css.indexOf(".is-scaffolded {"), css.indexOf("}", css.indexOf(".is-scaffolded {")));
  assert.doesNotMatch(rule, /saturate|grayscale/);
  assert.match(rule, /opacity: 0\.3 !important;/);
  assert.match(rule, /scale: 0\.86;\n\s+translate: 0 6px;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.is-scaffolded \{ scale: none; translate: none;/);
});

test("v69 progress grows: pale seeds, a glowing gold seed for now, leaves for every finished round — palette only", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v69"));
  assert.deepEqual(off(block), []);
  assert.match(block, /\.lg-app :is\(\.play-dots,\.meet-dots,\.bk-progress,\.ayah-dots,\.delivery-progress,\.tb-progress,\.dot-progress,\.path-progress,\.ff-progress,\.sand-progress,\.pz-progress,\.wg-progress,\.rt-dots\) i \{\n\s+border-radius: 50% 50% 50% 50% \/ 62% 62% 38% 38%;/);
  assert.match(block, /\.lg-app :is\(\.play-dots,\.bk-progress,\.ayah-dots,\.delivery-progress,\.tb-progress,\.ff-progress,\.sand-progress,\.pz-progress,\.wg-progress,\.rt-dots\) i\.is-done, \.lg-app :is\(\.dot-progress,\.path-progress\) i\.is-on \{\n\s+border-radius: 0 100%;/);
  assert.match(block, /\.lg-app \.lg-play \.play-dots i \{ width: 10px; height: 13px; \}/, "bigger than the old 9px dots");
});

test("v70 the sticker stand's savings sit in carved hollows on a wooden board, never grey outlines — palette only", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v70"));
  assert.deepEqual(off(block), []);
  assert.match(block, /\.lg-app \.stand-pips \{[^}]*background: linear-gradient\(180deg, var\(--wood-lit\) 0 2px, var\(--wood\) 2px 100%\);/);
  assert.match(block, /\.lg-app \.stand-pips i \{ color: #70501b; \}/);
});

test("v70 party friends are paper coins in wood rims, not translucent app circles", () => {
  const css = read("styles/letters-materials.css");
  assert.match(css, /\.lg-app \.party-friend \{\n\s+background: radial-gradient\(circle at 35% 30%, #fffdf7 0 40%, #fffaf0 65%, #e5dcc8 100%\);/);
  assert.deepEqual(off(css.slice(css.indexOf("/* v70"))), []);
});

test("v71 the album is a colouring book: missing stickers are tan line drawings on white, not beige blobs", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v71"));
  assert.deepEqual(off(block), []);
  assert.match(block, /\.lg-app \.art-sticker-ghost \* \{ stroke: #a89478; \}/);
  assert.match(block, /\.lg-app \.art-sticker-ghost \[fill\]:not\(\[fill="none"\]\) \{ fill: #fffdf7; \}/);
});

test("v72 wardrobe: plank tabs, a wooden star plaque, wooden arrows; a spent arrow rests as paper, never a 40% ghost", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v72"));
  assert.deepEqual(off(block), []);
  assert.match(block, /\.lg-app \.wardrobe-tabs button\[aria-selected=true\] \{/);
  assert.match(block, /\.lg-app \.lg-star-chip \{/);
  assert.match(block, /:disabled \{\n\s+opacity: 1;/);
  assert.match(block, /prefers-reduced-motion: reduce\) \{ \.lg-app \.wardrobe-tabs button\[aria-selected=true\] \{ transform: none; \} \}/);
});

test("v73 disabled buttons rest as paper at full opacity; garden tool icons are centred; ayah dots join the seed row", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v73"));
  assert.deepEqual(off(block), []);
  assert.match(block, /\.lg-app :is\(\.decorate-prev,\.decorate-more,\.ayah-controls button,\.delivery-support button,\.map-play-places button,\.practice-button,\.fb-nav button,\.lb-nav button\):disabled \{\n\s+opacity: 1;/);
  assert.match(block, /\.lg-app \.decorate-tools \.practice-button \{ display: grid; place-items: center; \}/);
  assert.match(css, /:is\(\.play-dots,\.meet-dots,\.bk-progress,\.ayah-dots,\.delivery-progress,\.tb-progress,\.dot-progress,\.path-progress,\.ff-progress,\.sand-progress,\.pz-progress,\.wg-progress,\.rt-dots\) i \{/);
});

test("v74 the bubble's hear-again speaker is full ink on a gold disc, not switched-off grey", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v74"));
  assert.match(block, /\.lg-app \.play-bubble-icon \{\n\s+color: var\(--ink\);/);
  assert.deepEqual(off(block), []);
});

test("v74 the village gate's medallion is a lit coin like the map stops", () => {
  const v = read("src/letters/VillageArt.js");
  assert.match(v, /<g class="vg-medal"><circle cy="66" r="34" fill="#70501b"\/>/);
  assert.match(v, /stroke="hsl\(\$\{hue\} 78% 76%\)"/);
  assert.match(v, /<path d="M-21\.7 58\.2A22 22 0 0 1 3\.8 40\.3" fill="none" stroke="#e5dcc8"/);
});

test("v75 today's walk: wooden coin stones on a sand trail", () => {
  const g = read("src/letters/LettersGame.js");
  assert.match(g, /<path d="\$\{d\}" fill="none" stroke="#e5dcc8" stroke-width="24"[^>]*data-ribbon\/>/);
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v75"));
  assert.deepEqual(off(block), []);
  assert.match(block, /\.lg-app \.walk-stone \{/);
  assert.match(block, /\.lg-app \.walk-stone\.is-next \{/);
});

test("v76 the practice 'hear it' card is framed paper with a gold speaker badge — palette only", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v76"));
  assert.deepEqual(off(block.replace(/%23([0-9a-f]{6})/gi, "#$1")), []);
  assert.match(block, /\.lg-app \.practice-replay::after \{/);
  assert.match(block, /\.lg-app \.practice-replay\[hidden\]::after \{ display: none; \}/);
});

test("v76 every progress row grows seeds and leaves (delivery, toy box, dot garden, paths, discoveries)", () => {
  const css = read("styles/letters-materials.css");
  assert.match(css, /\.lg-app \.dot-discoveries i\.is-found \{[^}]*border-radius: 0 100%;/);
  assert.match(css, /:is\(\.dot-progress,\.path-progress\) i\.is-on \{/);
  assert.deepEqual(off(css.slice(css.indexOf("/* v76"))), []);
});

test("v78 the first choice: paints on a wooden painter's tray, the picked paint in a paper ring", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v78"));
  assert.deepEqual(off(block), []);
  assert.match(block, /\.lg-app \.hatch-hues \{\n\s+border: 3px solid var\(--ink\);/);
  assert.match(block, /\.lg-app \.hatch-hue\.is-picked \{ outline: 4px solid #fffdf7;/);
  assert.match(block, /prefers-reduced-motion: reduce\) \{ \.lg-app \.hatch-hue\.is-picked \{ transform: none; \} \}/);
});

test("v79 an unplayed chapter's star spots are carved hollows, not grey '0 of 3' stars", () => {
  const css = read("styles/letters-materials.css");
  assert.match(css, /\.map-star-off path \{ fill: #70501b; stroke: #c69434; stroke-width: 5; \}/);
});

test("v80 the boat chapter's meet seed row sits on a wooden board", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v80"));
  assert.deepEqual(off(block), []);
  assert.match(block, /\.lg-boat-chapter \.meet-dots \{\n\s+background: linear-gradient/);
});

test("v81 practice group chips are paper coins in wood rims", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v81"));
  assert.deepEqual(off(block), []);
  assert.match(block, /\.lg-app \.pg-chip \{/);
});

test("v81 no double speaker on icon cards; Family Buses fits a 667px phone", () => {
  const css = read("styles/letters-materials.css");
  assert.match(css, /\.lg-app \.practice-replay:has\(> svg\):not\(:has\(text\)\)::after \{ display: none; \}/);
  assert.match(read("styles/letters-toybox.css"), /\.lk-bus \{ max-width: min\(220px, 22vh\); \}/);
});

test("v83 Build Letter's pieces fit one row on a short phone", () => {
  assert.match(read("styles/letters-friends.css"), /@media \(max-height: 700px\) and \(orientation: portrait\) \{ \.ws-piece svg \{ width: min\(64px, 16vw\); \}/);
});

test("v84 the pet stays in the sideways rail: the practice heading is not pinned to 72px there", () => {
  const css = read("styles/letters-materials.css");
  assert.match(css, /@media \(orientation: landscape\) and \(max-height: 500px\) \{\n\s+\.lg-app \.lg-play \.practice-heading \{ height: auto; \}/);
});

test("v85 big screens get a bigger friend and readable seeds", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v85"));
  assert.match(block, /@media \(min-width: 700px\) and \(min-height: 700px\) \{/);
  assert.match(block, /\.practice-heading > \.lg-animal \{ width: 104px !important; height: 116px !important; \}/);
  assert.deepEqual(off(block), []);
});

test("v86 the chapter games' prompt row grows on big screens too", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v85"));
  assert.match(block, /\.lg-app \.lg-play \.play-pet \{ width: 124px; height: 140px; \}/);
  assert.match(block, /\.lg-app \.lg-play \.play-bubble-glyph \{ font-size: 60px; \}/);
});

test("v87 chapter step tiles scale up on big screens", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v85"));
  assert.match(block, /\.lg-app \.journey-stop \{ width: 52px; height: 46px; \}/);
  assert.match(block, /\.lg-play \.adventure-stop \{ width: 46px; height: 42px; \}/);
});

test("v88 the village sky follows the four day phases", () => {
  const v = read("src/letters/VillageArt.js");
  assert.match(v, /function backdrop\(W, H, \{ night = false, horizon = 0\.34, phase = night \? "night" : "day" \} = \{\}\)/);
  assert.match(v, /sunset \? \["#ffa798", "#ffe49a"\] : morning \? \["#ffe49a", "#ccfbef"\]/);
  assert.match(read("src/letters/LettersGame.js"), /V\.backdrop\(L\.W, L\.H, \{ night, horizon: L\.hz, phase: Art\.dayPhase\?\.\(\) \}\)/);
});

test("v89 the map gets a soft morning/sunset wash, untappable, between the map (z1) and the top bar (z5)", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v89"));
  assert.match(block, /\.lg-home::after \{\n\s+content: ''; position: absolute; inset: 0; z-index: 2; pointer-events: none;/);
  assert.doesNotMatch(block, /map-scroll \{ position: relative/, "never re-position the map scroller");
  assert.deepEqual(off(block), []);
});

test("v90 room tabs and the star chip scale up on big screens", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v85"));
  assert.match(block, /\.lg-app \.album-tab \{ width: 78px; height: 68px; \}/);
  assert.match(block, /\.lg-app \.wardrobe-tabs button \{ width: 84px; min-height: 64px; \}/);
});

test("v91 the didn't-load screen: bar at the top, the pet waits beside a wooden flower coin", () => {
  const g = read("src/letters/LettersGame.js");
  assert.match(g, /<div class="loading-wait">\$\{this\.petSVG\?\.\(108\)\|\|''\}<div class="loading-flower">/);
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v91"));
  assert.match(block, /\.lg-app \.lg-screen\.lg-loading > \.lg-topbar \{ position: absolute; top: 12px;/);
  assert.deepEqual(off(block), []);
});

test("v92 a cozy night: moonlit pond water and the land takes the night ramp", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v92"));
  assert.deepEqual(off(block), []);
  assert.match(block, /linear-gradient\(165deg, #4a4d84, #3a8fc4 55%, #34375f\)/);
  const ga = read("src/letters/LettersGardenArt.js");
  assert.match(ga, /const nightLand = \(svg\) => ns\.LettersArt\?\.dayPhase\?\.\(\) === "night"/);
  const map = ga.match(/const NIGHT_LAND = (\{[^}]*\})/)[1];
  assert.deepEqual(off(map), []);
});

test("v93 the shore reeds and the boat's island join the night", () => {
  const ga = read("src/letters/LettersGardenArt.js");
  assert.match(ga, /\$\{nightLand\(`<svg class="garden-reeds"/);
  assert.match(ga, /<div class="garden-shore-boat">\$\{nightLand\(boat\(\{stage\}\)\)\}<\/div>/);
});

test("v94 the friends' garden at night: indigo sky strip with stars, beds one step down the ramp, frame kept", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v94"));
  assert.deepEqual(off(block), []);
  assert.match(block, /\.lg-friends-garden \.sg-plots \{ background-color: #7fce54; box-shadow: inset 0 -10px 0 #4e9677, 0 0 0 4px #4a3620; \}/);
});

test("v95 pale seeds on the meet board get a dark-wood outline and paper fill", () => {
  const css = read("styles/letters-materials.css");
  assert.match(css, /\.meet-dots i:not\(\.is-on\):not\(\.is-done\) \{ border-color: #70501b; background: #fffaf0; \}/);
});

test("v96 village landmarks get invisible tap pads of at least 52 screen px, measured per landmark", () => {
  const g = read("src/letters/LettersGame.js");
  assert.match(g, /const m = inner\.getScreenCTM\?\.\(\), k = m \? Math\.hypot\(m\.a, m\.b\) \|\| 1 : 1, min = 52 \/ k;/);
  assert.match(g, /class: "vg-pad"[^}]*fill: "#fffaf0", "fill-opacity": 0/);
  assert.match(g, /requestAnimationFrame\(padSpots\);/);
});

test("v97 the ambient creatures follow the day/night phase within a session", () => {
  const g = read("src/letters/LettersGame.js");
  assert.match(g, /this\._ambientNight = night;/);
  assert.match(g, /if \(this\._ambientNight !== undefined && nightNow !== this\._ambientNight\) this\.initAmbient\(\);/);
});

test("v98 the village pet yawns sleepily at night (rig 'yawn', reduced motion skips it)", () => {
  const rig = read("src/letters/LettersPetRig.js");
  assert.match(rig, /yawn\(next\) \{ look = reach = null; start\('yawn', 1400, null, next\); \},/);
  assert.match(rig, /act\?\.kind === 'yawn'\) blink = /);
  const g = read("src/letters/LettersGame.js");
  assert.match(g, /if \(night && !this\.prefersReducedMotion\(\)\) \{\n\s+const yawnLoop/);
});

test("v99 the album supply row fits phones upright and sideways; the ready tag is gold on wood", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v99"));
  assert.deepEqual(off(block), []);
  assert.match(block, /@media \(max-width: 520px\) \{\n\s+\.lg-app \.lg-album \.album-supply \{ flex-wrap: nowrap; gap: 8px;/);
  assert.match(block, /\.album-supply > :is\(\.album-stand,\.album-complete\) \{ order: 3; grid-column: 1 \/ -1; \}/);
  assert.match(block, /\.lg-app \.lg-album \.album-stand \.pet-acc-cost \{/);
});

test("v100 a full sticker album earns a gold rosette trophy — palette only, reduced motion stills it", () => {
  const g = read("src/letters/LettersGame.js");
  assert.match(g, /aria-label="All stickers collected">\$\{ALBUM_ROSETTE\}<\/div>/);
  assert.deepEqual(off(g.match(/const ALBUM_ROSETTE = `([\s\S]*?)`;\n/)[1]), []);
  const css = read("styles/letters-materials.css");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.lg-app \.album-complete > svg \{ animation: none; \} \}/);
});

test("v101 village tap pads are nudged back inside the scene", () => {
  const g = read("src/letters/LettersGame.js");
  assert.match(g, /\/\/ Keep the pad on screen: nudge it back inside the scene's edges\./);
  assert.match(g, /r\.setAttribute\("y", String\(\+r\.getAttribute\("y"\) \+ dy \/ k\)\);/);
});

test("v102 every outline meets in a round join (style-independent geometry step 1)", () => {
  assert.match(read("styles/letters-materials.css"), /\.lg-app svg :is\(path, polygon, polyline, rect, line\) \{ stroke-linejoin: round; \}/);
});

test("v103 village landmarks in the pet's language; the classic art stays for A/B", () => {
  const v = read("src/letters/VillageArt.js");
  for (const fn of ["gate", "cottage", "friendsBed", "toyChest"]) assert.match(v, new RegExp(`function ${fn}Classic\\(`));
  assert.match(v, /classic: \{ gate: gateClassic, cottage: cottageClassic, friendsBed: friendsBedClassic, toyChest: toyChestClassic[,} ]/);
  assert.match(v, /function stall\(\) \{/);
  const block = v.slice(v.indexOf("// ---------- v103"), v.indexOf("ns.VillageArt ="));
  assert.doesNotMatch(block, /linearGradient|radialGradient/, "flat colour + one shine, no gradients");
  assert.doesNotMatch(block, /<rect (?![^>]*rx=)/, "every rectangle is rounded");
  assert.match(read("src/letters/LettersGame.js"), /V\.stall \? `<svg viewBox="-72 -74 144 150" overflow="visible">\$\{V\.stall\(\)\}<\/svg>` : ns\.LettersRoomArt\.stand\(sw\)/);
});

test("v104 map landmarks in the pet's language with rich detail; toy hooks kept; classic kept", () => {
  const m = read("src/letters/LettersMapArt.js");
  assert.match(m, /classic:\{orchard:orchardClassic,reeds:reedsClassic,lantern:lanternClassic,peaks:peaksClassic,wildflowers:wildflowersClassic,landing:landingClassic,bridge:bridgeClassic,waterwheel:waterwheelClassic\}/);
  const block = m.slice(m.indexOf("// v104b"), m.indexOf("// Touch toys on the home map."));
  for (const hook of ["lm-canopy", 'lm-fruit" data-y', "lm-reeds", "lm-leaf", "lm-bug", "lm-glow", "lm-fly", "lm-hive", "lm-spin", "lm-wheel", "lm-drop"]) assert.ok(block.includes(hook), hook);
  assert.deepEqual(off(block), []);
  const widths = new Set((block.match(/stroke-width="([0-9.]+)"/g) || []).map((x) => x.match(/"([0-9.]+)"/)[1]));
  for (const w of widths) assert.ok(["1.6", "2.4", "3", "4", "6", "8"].includes(w), `stroke ${w}`);
});

test("v105 the small village landmarks join the detailed pet language; tap pads and classic kept", () => {
  const v = read("src/letters/VillageArt.js");
  for (const fn of ["yard", "stones", "sundial", "flowerBed"]) assert.match(v, new RegExp(`function ${fn}Classic\\(`));
  const block = v.slice(v.indexOf("// v105"), v.indexOf("ns.VillageArt ="));
  assert.equal((block.match(/class="vg-hit"/g) || []).length, 2, "stones and flower bed keep their tap pads");
  assert.deepEqual(off(block), []);
});

test("v106 one sticker stall everywhere: the album and stand dialog use the village stall", () => {
  const g = read("src/letters/LettersGame.js");
  assert.match(g, /standArt\(size\) \{/);
  assert.doesNotMatch(g, /ns\.LettersRoomArt\.stand\((118|90)\)/);
});

test("v107 land gates and the seed basket in the pet language; banner/roll hooks kept", () => {
  const m = read("src/letters/LettersMapArt.js");
  const g = m.slice(m.indexOf("function gate(biome='orchard'"), m.indexOf("ns.LettersMapArt={gate"));
  assert.match(g, /class="map-gate-banner"/); assert.match(g, /class="map-gate-roll"/);
  assert.deepEqual(off(g), []);
  const b = read("src/letters/LettersGardenArt.js");
  assert.match(b, /\/\/ v107: the seed basket in the pet language/);
  assert.match(b, /data-ribbon\/>/);
});

test("v108 the pond-corner reeds in the pet language, still night-mapped", () => {
  const b = read("src/letters/LettersGardenArt.js");
  assert.match(b, /v108: the corner reeds in the pet language/);
  assert.match(b, /\$\{nightLand\(`<svg class="garden-reeds"/);
});

test("v109 UI touches: grain + shine on wooden pills, stitched card insets; never re-position the pond cards", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v109"));
  assert.deepEqual(off(block), []);
  assert.doesNotMatch(block, /\.pop-bubble[^{]*\{ position: relative/, "pop bubbles are absolutely placed; relative breaks the pond");
  assert.match(block, /border: 2px dashed #e5dcc8;/);
});

test("v110 the pond jetty in the pet language (rounded posts, lit deck, plank seams, grain)", () => {
  const g = read("src/letters/MiniGames.js");
  assert.match(g, /<rect x="4" y="8" width="292" height="36" rx="16" fill="#c69434" stroke="#4a3620" stroke-width="3"\/>/);
  assert.match(read("styles/letters-materials.css"), /\.lg-app \.pond-dock-slot:not\(\.is-full\) \{ border-radius: 16px;/);
});

test("v111–v112 friends' fence capsule pickets; the decorate island in the pet language, classic kept", () => {
  const css = read("styles/letters-materials.css");
  assert.match(css, /\/\* v111 — the friends' garden fence in the pet language/);
  const dg = read("src/letters/DecoratingGarden.js");
  assert.match(dg, /const landscapeClassic = \(\) => `<svg class="decorate-land"/);
  const block = dg.slice(dg.indexOf("const landscape = () =>"), dg.indexOf("// 2026-10-13: an empty space"));
  assert.doesNotMatch(block, /Gradient/);
  assert.deepEqual(off(block), []);
});

test("v113 map edge scenery is round bushes in the pet language", () => {
  const m = read("src/letters/LettersMapArt.js");
  assert.match(m, /\/\/ v113: the pet language — a round chunky bush/);
  assert.match(m, /fill="#7fce54" stroke="#4a3620" stroke-width="2\.4" stroke-linejoin="round"\/>\n\s+<path d="M-2 8Q0 2 4 0/, "v126: leaf green day and night");
});

test("v114 practice picture tiles lose their boxy/sharp shapes (fishing pond, feed basket, costume dome, market, pots)", () => {
  const g = read("src/letters/LettersGardenArt.js");
  assert.doesNotMatch(g, /<path d="M10 40Q60 32 100 40T190 40V112H10Z" fill="#62cdf4"\/>/, "fishing pond no longer a square");
  assert.doesNotMatch(g, /<path d="M102 80H177L167 116H112Z"/, "feed basket no longer a trapezoid");
  assert.doesNotMatch(g, /<path d="M48 112V54L100 20L152 54V112Z"/, "costume house no longer a sharp gable");
  assert.doesNotMatch(g, /<path d="M24 66H90L82 110H32Z"/, "sorting pots rounded");
});

test("v115 the map's per-land scenery in the pet language (hay rolls, inked rocks, round reed blades)", () => {
  const m = read("src/letters/LettersMapArt.js");
  assert.match(m, /\/\/ v115: land scenery in the pet language/);
  assert.doesNotMatch(m, /stroke-dasharray="6 6"/, "no dashed orchard furrows");
});

test("v116 the feed/catch basket matches the pet-language seed basket", () => {
  const g = read("src/letters/MiniGames.js");
  assert.match(g, /\/\/ v116: the feed basket in the pet language/);
  assert.doesNotMatch(g, /<path d="M18 53L30 91Q90 110 150 91L162 53Q90 76 18 53Z"/);
});

test("v117 the pairs cards keep their own clean frame (no stitched inset)", () => {
  const css = read("styles/letters-materials.css");
  assert.doesNotMatch(css, /:is\([^)]*\.pairs-card[^)]*\)::after/);
});

test("v118 the garden island steps down the green ramp at night; treasures stay bright", () => {
  const dg = read("src/letters/DecoratingGarden.js");
  assert.match(dg, /\$\{nightIsland\(landscape\(\)\)\}/);
  assert.deepEqual(off(dg.match(/const NIGHT_ISLAND = (\{[^}]*\})/)[1]), []);
});

test("v119 village trees and bushes in the pet language", () => {
  const v = read("src/letters/VillageArt.js");
  assert.match(v, /\/\/ v119: trees and bushes in the pet language/);
  assert.deepEqual(off(v), []);
});

test("v120 today's village treasure sits in a gold sparkle spot, not a faded disc", () => {
  const g = read("src/letters/LettersGame.js");
  assert.doesNotMatch(g, /<circle r="19" fill="#fffaf0" opacity="\.55"\/>/);
  assert.match(g, /<circle r="21" fill="#ffe49a" opacity="\.45"\/>/);
});

test("v121 puffy village clouds (day and sunset)", () => {
  const v = read("src/letters/VillageArt.js");
  assert.match(v, /const puff = \(x, y, k, warm = false\) =>/);
  assert.doesNotMatch(v, /q6-16 24-12q10-14 28-6/);
  assert.deepEqual(off(v), []);
});

test("v122 the village sun has soft rounded rays and a shine", () => {
  const v = read("src/letters/VillageArt.js");
  assert.match(v, /<ellipse cy="-33" rx="5" ry="8"/);
  assert.deepEqual(off(v), []);
});

test("v123 the night village: a rimmed moon with a shine and twinkle stars", () => {
  const v = read("src/letters/VillageArt.js");
  assert.match(v, /fill="#ffe49a" stroke="#f3c955" stroke-width="2\.4" stroke-linejoin="round"\/>/);
  assert.match(v, /d="M0 -8Q1 -1 8 0Q1 1 0 8Q-1 1 -8 0Q-1 -1 0 -8Z" fill="#fffaf0"/);
  assert.deepEqual(off(v), []);
});

test("v124 tomorrow's bud in the pet language, still sleepy (z kept)", () => {
  const g = read("src/letters/LettersGame.js");
  const bud = g.match(/const TOMORROW_BUD = `([^`]*)`/)[1];
  assert.match(bud, /M45 8H51L45 14H51/, "the sleepy z stays");
  assert.match(bud, /<circle cx="32" cy="30" r="22" fill="#ffe49a" opacity="\.35"\/>/);
  assert.deepEqual(off(bud), []);
});

test("v125 the balloon basket is rounded and woven", () => {
  const g = read("src/letters/LettersGame.js");
  assert.doesNotMatch(g, /<path d="M26 84H54L50 104H30Z"/);
  assert.match(g, /<path d="M26 86H54Q54 104 46 104H34Q26 104 26 86Z"/);
});

test("v127 the meet screen's pencil and eraser are rounded", () => {
  const r = read("src/letters/LettersRoomArt.js");
  assert.doesNotMatch(r, /<path d="M482 353L503 322L533 340L512 372Z"/);
  assert.doesNotMatch(r, /<path d="M63 351L108 306L120 318L77 364Z"/);
});

test("v128 the map sapling mound is round with a furrow, pebble and tufts", () => {
  const g = read("src/letters/LettersGame.js");
  assert.match(g, /\/\/ v128: a rounder soil mound/);
  assert.doesNotMatch(g, /<path d="M11 46Q13 38 24 38Q35 38 37 46Z"/);
});

test("v129 the letter flower bed is a rounded wooden planter", () => {
  const j = read("src/letters/LettersJourney.js");
  assert.doesNotMatch(j, /<path d="M96 182H324L314 212Q210 222 106 212Z"/);
  assert.match(j, /<path d="M96 184H324Q324 214 300 216H120Q96 214 96 184Z"/);
});

test("v130 the seed bed's watering can is rounded", () => {
  assert.doesNotMatch(read("src/letters/LettersJourney.js"), /<path d="M52 184H86L90 206Q70 213 54 206Z"/);
});

test("v131 the harvest keepsake's basket is rounded", () => {
  assert.doesNotMatch(read("src/letters/LettersJourney.js"), /<path d="M82 186H144L136 208Q113 215 90 208Z"/);
});

test("v132 the harvest tree has a chunky capsule trunk", () => {
  assert.doesNotMatch(read("src/letters/LettersJourney.js"), /<path d="M172 201Q177 166 174 136H188Q185 166 192 201Z"/);
});

test("v133 the jars keepsake shelf is chunky and rounded", () => {
  const j = read("src/letters/LettersJourney.js");
  assert.doesNotMatch(j, /<rect x="100" y="168" width="10" height="38" rx="3"/);
  assert.match(j, /<rect x="82" y="156" width="216" height="15" rx="7\.5"/);
});

test("v134 the garland keepsake has chunky capsule posts", () => {
  assert.doesNotMatch(read("src/letters/LettersJourney.js"), /<path d="M71 202V104M289 202V104" stroke="#a89478" stroke-width="8"/);
});

test("v135 the Word Tree: inked limbs and shiny wooden seed coins", () => {
  const css = read("styles/letters-materials.css");
  const block = css.slice(css.indexOf("/* v135"));
  assert.match(block, /\.lg-app \.wt-branch::before \{/);
  assert.match(block, /\.lg-app \.wt-seed \{/);
  assert.deepEqual(off(block), []);
});

test("v136 Leaf Home branches are chunky inked limbs", () => {
  const w = read("src/letters/WordTree.js");
  assert.match(w, /stroke="#4a3620" stroke-width="14" stroke-linecap="round"\/><path d="M4 52Q40 44 60 30Q80 16 116 12" fill="none" stroke="#c69434" stroke-width="8"/);
  assert.deepEqual(off(w.match(/const BRANCH = `([^`]*)`/)[1]), []);
});

test("v137 sticker-scene backdrops lose their sharp gables, wedge hull and thin pickets", () => {
  const s = read("src/letters/StickerScenes.js");
  assert.doesNotMatch(s, /<path d="M0 70V10L50-26L100 10V70Z"/);
  assert.doesNotMatch(s, /<path d="M0 40H90L76 60H14Z"/);
  assert.doesNotMatch(s, /<path d="M-8 4L35-30L78 4"/);
  assert.deepEqual(off(s), []);
});

test("v138 sticker-scene trees: inked trunks and fronds", () => {
  const s = read("src/letters/StickerScenes.js");
  assert.doesNotMatch(s, /<path d="M0 70V20" stroke="#70501b" stroke-width="8"/);
  assert.doesNotMatch(s, /fill="none" stroke="#4e9677" stroke-width="8" stroke-linecap="round"\/>/);
});

test("v139 sticker-scene clouds are puffy like the village", () => {
  assert.match(read("src/letters/StickerScenes.js"), /\/\/ v139: puffy, like the village/);
});

test("v140 sticker-scene suns have soft rounded rays", () => {
  const s = read("src/letters/StickerScenes.js");
  assert.match(s, /\$\{sun\(540, 80, 40\)\}/);
  assert.deepEqual(off(s), []);
});

test("v141 the night sticker scene's moon has a shine", () => {
  assert.match(read("src/letters/StickerScenes.js"), /<ellipse cx="476" cy="78" rx="4" ry="10" fill="#fffdf7"/);
});

test("v142 Costume House hub pictures fill their cards", () => {
  assert.match(read("styles/letters-materials.css"), /\.lg-app \.lg-costume-house \.practice-garden-choices button > svg \{ width: 100%; height: 96px;/);
});

test("v143 who-is-playing cards are paper in wood frames", () => {
  assert.match(read("styles/letters-materials.css"), /\.lg-app \.who-pet \{\n\s+border: 4px solid var\(--wood\);/);
});

test("v144 DetailKit: constructed trees, palms, houses, barn and boat — palette only, allowed strokes, loaded and cached", () => {
  const k = read("src/letters/DetailKit.js");
  assert.deepEqual(off(k), []);
  const widths = new Set((k.match(/stroke-width="([0-9.]+)"/g) || []).map((m) => m.match(/"([0-9.]+)"/)[1]));
  for (const w of widths) assert.ok(["1.6", "2.4", "3", "4", "6", "8"].includes(w), `stroke ${w}`);
  assert.match(k, /ns\.DetailKit = \{ tree, palm, house, barn, boat, INK \}/);
  assert.match(read("letters.html"), /src\/letters\/DetailKit\.js/);
  assert.match(read("sw.js"), /"src\/letters\/DetailKit\.js",/);
  const s = read("src/letters/StickerScenes.js");
  for (const p of ["D.barn()", "D.tree(", "D.boat()", "D.palm(", "D.house("]) assert.ok(s.includes(p), p);
});

test("v145 village trees come from the DetailKit; the cottage gains chimney, frame, window, lantern, stones", () => {
  const v = read("src/letters/VillageArt.js");
  assert.match(v, /ns\.DetailKit \? `<g class="vg-deco"/);
  assert.match(v, /<rect x="30" y="-62" width="20" height="38" rx="5" fill="#e5dcc8"/);
  assert.deepEqual(off(v), []);
});

test("v146 the map orchard tree is the DetailKit tree with the shake-toy hooks kept", () => {
  const vm = require("node:vm");
  const window = { MiftahGame: { LettersGardenArt: { seedBasket: () => "" } } };
  vm.runInNewContext(read("src/letters/DetailKit.js") + read("src/letters/LettersMapArt.js"), { window, Math, setTimeout, clearTimeout });
  const art = window.MiftahGame.LettersMapArt.landmark("orchard", 2);
  assert.match(art, /<g class="lm-canopy">/);
  assert.equal((art.match(/class="lm-fruit" data-y="\d+"/g) || []).length, 3);
});

test("v147 the meadow hive is a stacked straw skep on a stand (lm-hive kept)", () => {
  const m = read("src/letters/LettersMapArt.js");
  assert.match(m, /<g class="lm-hive"><rect x="98" y="124" width="58" height="8"/);
  assert.match(m, /stroke-dasharray="3 4"/);
});

test("v148 the footbridge has posts, sagging rope rails and nailed planks", () => {
  const m = read("src/letters/LettersMapArt.js");
  assert.match(m, /M-40 -18Q-20 -10 0 -18Q20 -10 40 -18/);
});

test("v149 treasure egg, clover and butterfly gain construction detail", () => {
  const r = read("src/letters/LettersRoomArt.js");
  assert.match(r, /M15 36L20 31L25 36L30 31/);
  assert.match(r, /\[\[32,14\],\[19,27\],\[45,27\],\[32,40\]\]/);
  assert.match(r, /<rect x="29" y="17" width="6" height="30" rx="3" fill="#70501b"/);
});

test("v150 the sticker stall shows goods: sticker sheets, a shelf star, crates beside it", () => {
  const v = read("src/letters/VillageArt.js");
  assert.match(v, /<g transform="translate\(0 54\)">\$\{\[\[-80, "#ee806f"\], \[80, "#62cdf4"\]\]/);
  assert.deepEqual(off(v), []);
});

test("v151 the meet board stands on a real easel with a chalk tray", () => {
  const a = read("src/letters/LettersArt.js");
  assert.match(a, /M100 20L62 266M150 20L188 266/);
  assert.match(a, /<rect x="26" y="218" width="198" height="14" rx="7" fill="#c69434"/);
});

test("v152 the pet's nook is furnished: wallpaper sprigs, two shelves with clothes, a hat, a button jar and a plant", () => {
  const r = read("src/letters/LettersRoomArt.js");
  assert.match(r, /a cosy nook, not a bare arch/);
  assert.doesNotMatch(r, /<path d="M107 212H174M426 212H493"/);
});

test("v153 living-book pages are little scenes; the cover gets a vine frame", () => {
  const b = read("src/letters/LivingBooks.js");
  assert.match(b, /const SIDE_TREE = /);
  assert.match(b, /lb-cover-frame/);
  assert.deepEqual(off(b), []);
});

test("v154 storybook side trees use the DetailKit tree; the kit loads before LettersArt", () => {
  assert.match(read("src/letters/LivingBooks.js"), /const SIDE_TREE = \(leaf, dark\) => ns\.DetailKit \?/);
  const h = read("letters.html");
  assert.ok(h.indexOf("DetailKit.js") < h.indexOf("LettersArt.js"));
});

test("v155 backdrop orchard trees use the DetailKit; the harvest tree canopy is clumped", () => {
  assert.match(read("src/letters/LettersArt.js"), /const fruit = \(x, y, k\) => ns\.DetailKit \?/);
  const j = read("src/letters/LettersJourney.js");
  assert.match(j, /<g class="craft-canopy">\$\{\(\(\) => \{ const C = /);
  assert.doesNotMatch(j, /<path class="craft-canopy" d="M134 134Q116 110/);
});

test("v156 catch framing trees: constructed, with blossoms (never decoy apples)", () => {
  const a = read("src/letters/LettersActivityArt.js");
  assert.match(a, /Blossoms, not apples/);
  assert.deepEqual(off(a.slice(a.indexOf("function orchardTree"), a.indexOf("function orchardTree") + 3000)), []);
});

test("v157 Family Buses: a constructed bus (rack, framed windows, stripe, bumpers, lights, hubcaps)", () => {
  const g = read("src/letters/LookGames.js");
  const bus = g.match(/const BUS = \(color\) => `([\s\S]*?)`;/)[1];
  assert.match(bus, /<rect x="24" y="0" width="104" height="6" rx="3" fill="#c69434"/);
  assert.match(bus, /\$\{\[20, 56\]\.map/, "seat windows keep their positions");
  assert.deepEqual(off(bus), []);
});

test("v158 Letter Fishing's bucket is a coral pail that stands out from the water", () => {
  const t = read("src/letters/ToyBoxGames.js");
  const b = t.match(/const BUCKET = `([^`]*)`/)[1];
  assert.match(b, /fill="#ee806f"/);
  assert.deepEqual(off(b), []);
});

test("v159 Bath Time's tub is a clawfoot tub with a tap", () => {
  const t = read("src/letters/ToyBoxGames.js");
  const tub = t.match(/const TUB = `([\s\S]*?)`;\n/)[1];
  assert.match(tub, /<rect x="-10" y="92" width="120" height="8" rx="4" fill="#fffdf7"/);
  assert.deepEqual(off(tub), []);
});

test("v160 the toy chest, friends' bench and flower beds are built from parts; v103 versions kept", () => {
  const v = read("src/letters/VillageArt.js");
  for (const fn of ["toyChestV103", "friendsBedV103"]) assert.match(v, new RegExp(`function ${fn}\\(`));
  const chest = v.match(/function toyChest\(open = true\) \{([\s\S]*?)\n  \}\n/)[1];
  assert.match(chest, /const strap = /);
  assert.match(chest, /const lidOpen = /);
  assert.match(chest, /const lidShut = /);
  const bench = v.match(/function friendsBed\(chars, friendArt\) \{([\s\S]*?)\n  \}\n/)[1];
  assert.match(bench, /const cushion = /);
  assert.match(bench, /chars\.length \? "" : `\$\{cushion/);
  assert.match(v, /const bedBox = /);
  assert.match(v, /\$\{bedBox\(44, 6\)\}/);
  assert.match(v, /\$\{bedBox\(36, 8, 18\)\}/);
  for (const part of [chest, bench]) assert.deepEqual(off(part), []);
  assert.deepEqual(off(v.match(/const bedSoil[\s\S]*?\n  function yard/)[0]), []);
});

test("v161 the sunflower stands in a stone birdbath (plinth steps, fluted column, water bowl)", () => {
  const v = read("src/letters/VillageArt.js");
  const sd = v.match(/function sundial\(stamped = false\) \{([\s\S]*?)\n  \}\n/)[1];
  assert.match(sd, /<path d="M-10 8Q-12 18 -10 28H10Q12 18 10 8Z"/);
  assert.match(sd, /<ellipse cy="2" rx="18" ry="4.5" fill="#96ecff"/);
  assert.deepEqual(off(sd), []);
});

test("v162 the paper boat floats in a puddle with a crayon heart and a mast flag", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const b = g.match(/function boat\(\{[\s\S]*?\n  \}\n/)[0];
  assert.match(b, /<ellipse cx="122" cy="148" rx="78" ry="13" fill="#96ecff"/);
  assert.match(b, /<path d="M131 30L151 35L131 41Z" fill="#f3c955"/);
  assert.match(b, /stroke="#ee806f" stroke-width="2.4"/);
  assert.deepEqual(off(b), []);
});

test("v163 the mountain landmark: tiered pines, rock ledges, a trail up to a summit flag; v104 kept", () => {
  const m = read("src/letters/LettersMapArt.js");
  assert.match(m, /function peaksV104\(\)\{/);
  const p = m.match(/function peaks\(\)\{[\s\S]*?\n  function wildflowers/)[0];
  assert.match(p, /stroke-dasharray="1 7"/);
  assert.match(p, /<path d="M71 58L86 63L71 68Z" fill="#ee806f"/);
  assert.match(p, /\[\[0,13\],\[-9,10\],\[-18,7\]\]/);
  assert.deepEqual(off(p), []);
});

test("v164 the waterwheel is fed by a flume on a trestle post; the stream stays still for reduced motion", () => {
  const m = read("src/letters/LettersMapArt.js");
  const w = m.match(/function waterwheel\(\)\{[\s\S]*?\n  \}\n/)[0];
  assert.match(w, /<path d="M0 9H46Q49 9 49 12V17Q49 20 46 20H0Z" fill="#c69434"/);
  assert.match(w, /<path d="M44 14Q52 15 54 23Q55 28 52 33" fill="none" stroke="#62cdf4"/);
  assert.match(w, /<rect x="6" y="18" width="9" height="94"/);
  assert.deepEqual(off(w), []);
});

test("v165 the mushroom find has gills, a skirt ring, moss and a baby mushroom", () => {
  const r = read("src/letters/LettersRoomArt.js");
  const m = r.match(/mushroom:`([\s\S]*?)`,\n/)[1];
  assert.match(m, /<ellipse cx="32" cy="34" rx="22" ry="5" fill="#e5dcc8"/);
  assert.match(m, /<path d="M42 46Q42 38 50 38Q58 38 58 46Q50 44 42 46Z" fill="#ee806f"/);
  assert.deepEqual(off(m), []);
});

test("v166 Beat Drum tile gets a second stick and a rhythm thread; Odd Sound pictures sit on choice cards", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='BeatDrum'\|\|kind==='SameStart'\|\|kind==='OddSound'\)\{[\s\S]*?void ear;/)[0];
  assert.match(e, /\$\{stick\(36,80,82,60\)\}/);
  assert.match(e, /stroke-dasharray="1 5"/);
  assert.match(e, /const card=\(x,y\)=>/);
  assert.match(e, /rotate\(12 159 66\)/);
  assert.deepEqual(off(e), []);
});

test("v167 Same Start tile: both pictures on tilted cards joined by a gold arc", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='SameStart'\)\{[\s\S]*?\}\n/)[0];
  assert.match(e, /<path d="M66 34Q100 6 134 34"/);
  assert.match(e, /\$\{card\(22,38,-6\)\}/);
  assert.deepEqual(off(e), []);
});

test("v168 the Puzzle Tree tile uses the constructed DetailKit tree with hanging puzzle pieces; old tree is the fallback", () => {
  const g = read("src/letters/LettersGardenArt.js");
  assert.match(g, /if\(kind==='PuzzleTree'&&ns\.DetailKit\)\{/);
  assert.match(g, /ns\.DetailKit\.tree\(\{kind:'round',seed:5\}\)/);
  assert.match(g, /else if\(kind==='PuzzleTree'\)scene=/);
  const e = g.match(/if\(kind==='PuzzleTree'&&ns\.DetailKit\)\{[\s\S]*?\n      else if/)[0];
  assert.deepEqual(off(e), []);
});

test("v169 the Letter Studio tile stands on an easel with a tray and clamp; the crayon has a wrapper and tip", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='LetterStudio'\)scene=`[\s\S]*?`;\n/)[0];
  assert.match(e, /<rect x="34" y="98" width="132" height="10" rx="5" fill="#c69434"/);
  assert.match(e, /<rect x="88" y="8" width="24" height="14" rx="5" fill="#c69434"/);
  assert.match(e, /translate\(170 78\) rotate\(32\)/);
  assert.deepEqual(off(e), []);
});

test("v170 the Dot Garden tile: a raised bed, the letter as a furrow, the dot as a seed with a path to its ring", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='DotGarden'\)scene=`[\s\S]*?`;\n/)[0];
  assert.match(e, /<rect x="28" y="34" width="124" height="60" rx="12" fill="#70501b"/);
  assert.match(e, /<circle cx="91" cy="86" r="6.5" fill="none" stroke="#e5dcc8"/);
  assert.match(e, /translate\(180 56\) rotate\(-18\)/);
  assert.deepEqual(off(e), []);
});

test("v171 the Sand Table tile stands on legs with ripples, a scallop, a pebble and a drawing stick", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='SandTable'\)scene=`[\s\S]*?`;\n/)[0];
  assert.match(e, /<path d="M48 90V114M152 90V114" stroke="#4a3620" stroke-width="8"/);
  assert.match(e, /<path d="M0 6L-9 -3Q-6 -10 0 -10Q6 -10 9 -3Z" fill="#ffa798"/);
  assert.match(e, /<path d="M156 10L128 48" stroke="#c69434"/);
  assert.deepEqual(off(e), []);
});

test("v172 the Burst tile is a built stopwatch with sparkles, not a flat play triangle", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='Burst'\)scene=`[\s\S]*?`;\n/)[0];
  assert.doesNotMatch(e, /<path d="M41 82L62 98 41 114Z"/);
  assert.match(e, /rotate\(45 134 29\.5\)/);
  assert.match(e, /Array\.from\(\{length:12\}/);
  assert.match(e, /d="M0 -12Q2 -2 12 0Q2 2 0 12Q-2 2 -12 0Q-2 -2 0 -12Z" fill="#f3c955"/);
  assert.deepEqual(off(e), []);
});

test("v173 the picnic blanket is true gingham (filled bands that darken where they cross) with a folded corner", () => {
  const a = read("src/letters/LettersActivityArt.js");
  const p = a.match(/function picnic\(\) \{[\s\S]*?\n  \}\n/)[0];
  assert.doesNotMatch(p, /stroke-width="24"/);
  assert.match(p, /H\$\{c-12\}Z" opacity="\.3"/);
  assert.match(p, /<path d="M101 183L176 178Q150 214 112 244Z" fill="#e5dcc8"/);
  assert.deepEqual(off(p), []);
});

test("v174 the stale cache stamps are refreshed", () => {
  const html = read("letters.html");
  for (const f of ["styles/letters.css", "src/letters/LettersGame.js", "src/letters/LettersArt.js", "src/letters/ToyBoxGames.js", "src/letters/StickerScenes.js"]) assert.match(html, new RegExp(`${f.replace(/[./]/g, (c) => "\\" + c)}\\?v=(?!20261009)2026[0-9]{4}-v[0-9]+`));
});

test("v175 the star plaque has nail heads and coral ribbon tails; still only earned stars are shown", () => {
  const c = read("styles/letters-materials.css");
  const b = c.slice(c.indexOf("/* v175:"));
  assert.match(b, /\.lg-stars \.stars-row::before \{ left: -30px; \}/);
  assert.match(b, /fill='%23ee806f'/);
  assert.match(b, /radial-gradient\(circle at 13px 50%, #70501b/);
  assert.deepEqual(off(b.replace(/%23/g, "#")), []);
  assert.match(read("src/letters/LettersGame.js"), /\$\{this\.earnedStars\(stars, 64, 240\)\}/);
});

test("v176 the album is bound (rings, bookmark) and its page and the word bookcase are no longer see-through", () => {
  const c = read("styles/letters-materials.css");
  assert.match(c, /\.lg-app\.lg-app \.lg-album \.album-grid\.lg-panel\.lg-panel\.lg-panel \{\n  background: var\(--paper-grain\), linear-gradient/);
  assert.match(c, /\.lg-app\.lg-app \.shelf-case\.lg-panel\.lg-panel\.lg-panel \{ background: linear-gradient\(#a89478, #70501b\); \}/);
  assert.match(c, /\.lg-album \.album-grid::after \{\n  top: -28px;/);
  const b = c.slice(c.indexOf("/* v176:"));
  assert.deepEqual(off(b.replace(/%23/g, "#")), []);
});

test("v177 the stamp calendar hangs from a nail with binder rings; missed days stay plain numbers", () => {
  const c = read("styles/letters-materials.css");
  const b = c.slice(c.indexOf("/* v177:"));
  assert.match(b, /\.lg-app \.stamps-grid::before \{\n  top: -15px; width: 74%;/);
  assert.match(b, /\.lg-app \.stamps-grid::after \{\n  top: -40px;/);
  assert.deepEqual(off(b.replace(/%23/g, "#")), []);
});

test("v178 the jetty landmark: planks with nails, posts in water, a mooring rope and a tied rowboat; v115 kept", () => {
  const m = read("src/letters/LettersMapArt.js");
  assert.match(m, /function landingV115\(\)\{/);
  const l = m.match(/function landing\(\)\{[\s\S]*?\n  function bridge/)[0];
  assert.match(l, /\[66,118\]\.map/);
  assert.match(l, /<path d="M128 140H172Q168 156 150 157H140Q130 154 128 140Z" fill="#ee806f"/);
  assert.match(l, /rope\('M158 94Q172 114 162 140'\)/);
  assert.deepEqual(off(l), []);
});

test("v179 each Word Tree branch ends in a twig and leaf, at the left tip on phones", () => {
  const c = read("styles/letters-materials.css");
  const b = c.slice(c.indexOf("/* v179:"));
  assert.match(b, /\.lg-app \.wt-branch::after \{\n  content: ""; position: absolute;/);
  assert.match(b, /@media \(max-width: 520px\) \{ \.lg-app \.wt-branch::after, \.lg-app \.wt-branch\.is-left::after \{ left: -2px;/);
  assert.deepEqual(off(b.replace(/%23/g, "#")), []);
});

test("v180 the pond bank has cattails, pebbles and tufts, kept to the edges", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const p = g.match(/function pond\(\) \{[\s\S]*?\n  \}\n/)[0];
  assert.match(p, /\[\[34,350,0\],\[52,356,1\],\[566,338,0\],\[548,346,1\]\]/);
  assert.match(p, /fill="#c9bda4" stroke="#a89478" stroke-width="2.4"/);
  assert.deepEqual(off(p), []);
});

test("v181 the friends' garden field has mowing stripes and grass flecks (visible day and night)", () => {
  const c = read("styles/letters-materials.css");
  const b = c.slice(c.indexOf("/* v181:"));
  assert.match(b, /repeating-linear-gradient\(135deg, #4e967726 0 30px, #4e967700 30px 60px\)/);
  assert.deepEqual(off(b), []);
});

test("v182 the Shape Train tile has a real engine (cab, roof, stack, puffs, lamp, wheels) and fits its frame", () => {
  const g = read("src/letters/LettersGardenArt.js");
  assert.match(g, /else scene=`<g transform="translate\(-6 6\) scale\(\.95\)">/);
  assert.match(g, /<rect x="169" y="30" width="32" height="9" rx="4" fill="#c25a49"/);
  assert.doesNotMatch(g, /<rect x="174" y="40" width="22" height="46" rx="6" fill="#ee806f"/);
  const e = g.slice(g.indexOf("v182: the engine") - 400, g.indexOf("v182: the engine") + 1400);
  assert.deepEqual(off(e), []);
});

test("v183 Costume Rail tile hangs tunics on hangers; Disguise tile has a clear-lens magnifying glass", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='Disguise'\)scene=`[\s\S]*?\n      else if\(kind==='CostumeRail'\)scene=`[\s\S]*?`;\n/)[0];
  assert.match(e, /<path d="M115 77L134 98" stroke="#c69434"/);
  assert.match(e, /<circle cx="104" cy="66" r="15" fill="none" stroke="#4a3620" stroke-width="6"\/>/);
  assert.match(e, /\$\{T\(x,78,t,20\)\}/);
  assert.deepEqual(off(e), []);
});

test("v184 the Costume House tile has shingles, a doorknob, a step and flower pots", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/if\(kind==='CostumeHouse'\)scene=`[\s\S]*?`;\n/)[0];
  assert.match(e, /stroke="#8c74b0" stroke-width="2\.4"/);
  assert.match(e, /<rect x="80" y="109" width="40" height="7" rx="3\.5" fill="#c9bda4"/);
  assert.match(e, /\[\[40,'#ee806f'\],\[160,'#62cdf4'\]\]/);
  assert.deepEqual(off(e), []);
});

test("v185 the Water Garden tile is a watering rig: gutter on posts, spouts, drops into the bloomed middle pot", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='WaterGarden'\)scene=`[\s\S]*?`;\n/)[0];
  assert.match(e, /<rect x="16" y="22" width="168" height="16" rx="8" fill="#c69434"/);
  assert.match(e, /<path d="M100 47Q97 52 100 54Q103 52 100 47Z" fill="#62cdf4"/);
  assert.doesNotMatch(e, /slice\(0,1\)/);
  assert.deepEqual(off(e), []);
});

test("v186 the Garden Paths tile: the letter as stepping stones, a ladybug walking it, a flag at the end", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const i = g.indexOf("// v186: Garden Paths"); const e = g.slice(i, g.indexOf("`;", i));
  assert.match(e, /i<5\?`<ellipse/);
  assert.match(e, /<path d="M140 30L152 34L140 38Z" fill="#ee806f"/);
  assert.match(e, /translate\(95 76\) rotate\(4\)/);
  assert.deepEqual(off(e), []);
});

test("v187 the Letter Delivery icon is an envelope flying into a garden mailbox with its flag up", () => {
  const d = read("src/letters/LetterDelivery.js");
  const icon = d.match(/const icon=\(size=86\)=>\{[\s\S]*?\n  \};/)[0];
  assert.match(icon, /<path d="M118 70V50Q118 32 141 32H164Q186 32 186 50V70Z" fill="#ee806f"/);
  assert.match(icon, /<path d="M176 56V16"/);
  assert.match(icon, /stroke-dasharray="2 9"/);
  assert.deepEqual(off(icon), []);
});

test("v188 Letter Balloons tile: knots, shines, strings gathered into a bow on a stake", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='LetterBalloons'\)scene=`[\s\S]*?`;\n/)[0];
  assert.match(e, /<rect x="97" y="96" width="6" height="18" rx="3" fill="#70501b"/);
  assert.match(e, /<path d="M100 98Q90 92 90 99Q90 104 100 99Q110 104 110 99Q110 92 100 98Z" fill="#ee806f"/);
  assert.deepEqual(off(e), []);
});

test("v189 Friend Jigsaw tile: a real jigsaw piece beside the board's gap", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='FriendJigsaw'\)\{[\s\S]*?\n    \}/)[0];
  assert.match(e, /translate\(174 72\) rotate\(12\)/);
  assert.match(e, /<path d="M101\.5 57\.5H142\.5V90Q142\.5 98\.5 134 98\.5H101\.5Z" fill="#e5dcc8"/);
  assert.doesNotMatch(e, /<rect x="148" y="54" width="34" height="34"/);
  assert.deepEqual(off(e), []);
});

test("v190 Spot the Change tile: friends sit on a plank bench; the eye has lashes and a lid line", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='SpotChange'\)\{[\s\S]*?\n    \}/)[0];
  assert.match(e, /<rect x="14" y="102" width="172" height="10" rx="5" fill="#c69434"/);
  assert.match(e, /<path d="M76 12L72 6M100 7V1M124 12L128 6"/);
  assert.deepEqual(off(e), []);
});

test("v191 Family Buses tile: roof rack, bumpers, headlamp, tail light and bolted hubcaps", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='FamilyBuses'\)\{[\s\S]*?\n    \}/)[0];
  assert.match(e, /<rect x="42" y="18" width="116" height="8" rx="4" fill="#c69434"/);
  assert.match(e, /<rect x="172" y="84" width="16" height="9" rx="4\.5" fill="#c9bda4"/);
  assert.match(e, /\[0,120,240\]\.map/);
  assert.deepEqual(off(e), []);
});

test("v192 Letter Fishing tile: a rod with a reel, a float at the water line, a fin and a lily flower", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='LetterFishing'\)\{[\s\S]*?\n    \}/)[0];
  assert.match(e, /<path d="M198 40Q172 8 128 5" fill="none" stroke="#c69434"/);
  assert.match(e, /<path d="M123 38A5 5 0 0 1 133 38Z" fill="#ee806f"/);
  assert.deepEqual(off(e), []);
});

test("v193 Garden Together tile: two friends tending one potted sprout with a heart above", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='GardenTogether'\)scene=`[\s\S]*?`;\n/)[0];
  assert.match(e, /<path d="M86 88H114L110 110H90Z" fill="#c69434"/);
  assert.match(e, /<path d="M100 40Q94 32 90 36Q86 42 100 50Q114 42 110 36Q106 32 100 40Z" fill="#ee806f"/);
  assert.deepEqual(off(e), []);
});

test("v194 Sound Lab tile: grille, dial ticks, lights, a lever, notes rising, and the letter back in its window", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='SoundLab'\)scene=`[\s\S]*?`;\n/)[0];
  assert.match(e, /<circle cx="68" cy="98" r="10" fill="#3a8fc4"/);
  assert.match(e, /<circle cx="167" cy="78" r="5" fill="#ee806f"/);
  assert.match(e, /<text x="100" y="76" text-anchor="middle"/);
  assert.deepEqual(off(e), []);
});

test("v195 Lantern Hunt has a built lantern and beam; Letter Shadows is a shadow theatre", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const lh = g.match(/else if\(kind==='LanternHunt'\)scene=`[\s\S]*?`;\n/)[0];
  assert.match(lh, /<path d="M120 50L72 46L74 86L124 62Z" fill="#ffe49a" opacity="\.45"\/>/);
  assert.match(lh, /<path d="M136 52Q131 47 136 40Q141 47 136 52Z" fill="#ffa06e"/);
  const ls = g.match(/else if\(kind==='LetterShadows'\)\{[\s\S]*?\n    \}/)[0];
  assert.match(ls, /<path d="M32 18Q58 44 46 104H32Z" fill="#ee806f"/);
  assert.match(ls, /<rect x="24" y="102" width="152" height="12" rx="6" fill="#c69434"/);
  assert.deepEqual(off(lh + ls), []);
});

test("v196 Echo Parade tile: bunting overhead, marchers standing on the grass, echo arcs kept", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='EchoParade'\)scene=`[\s\S]*?`;\n/)[0];
  assert.match(e, /<path d="M4 10Q100 34 196 10"/);
  assert.match(e, /\$\{at\('ت',74,54,52\)\}/);
  assert.deepEqual(off(e), []);
});

test("v197 Hoopoe Trip tile: an arrow-shaped wooden signpost with a paper panel, nails and tufts", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='HoopoeTrip'\)scene=`[\s\S]*?`;\n/)[0];
  assert.match(e, /<path d="M8 28H58L70 47L58 66H8Q4 66 4 62V32Q4 28 8 28Z" fill="#c69434"/);
  assert.match(e, /<rect x="12" y="33" width="42" height="28" rx="5" fill="#fffaf0"/);
  assert.deepEqual(off(e), []);
});

test("v198 Build Letter tile: a pinned framed board, a 3D wooden dot block, and a dotted path to the slots", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='BuildLetter'\)scene=`[\s\S]*?`;\n/)[0];
  assert.match(e, /<rect x="54" y="6" width="92" height="92" rx="16" fill="#c69434"/);
  assert.match(e, /<path d="M182 76L190 68V98L182 106Z" fill="#c69434"/);
  assert.match(e, /stroke-dasharray="1 6"/);
  assert.deepEqual(off(e), []);
});

test("v199 Twin Crown tile: twins on velvet cushions under a jewelled crown; Colour Friend has a real crayon", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const tc = g.match(/else if\(kind==='TwinCrown'\)\{[\s\S]*?\n    \}/)[0];
  assert.match(tc, /<rect x="76" y="30" width="48" height="9" rx="4\.5" fill="#c69434"/);
  assert.match(tc, /\$\{at\('د',24,44,62\)\}/);
  const cf = g.match(/else if\(kind==='ColourFriend'\)\{[\s\S]*?\n    \}/)[0];
  assert.match(cf, /<path d="M151 30Q156 16 160 12Q164 16 169 30Z" fill="#c25a49"/);
  assert.deepEqual(off(tc + cf), []);
});

test("v200 Friend Shapes picture hangs in a wooden frame; Hat Shop shelf has brackets", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const fs = g.match(/else if\(kind==='FriendShapes'\)scene=`[\s\S]*?`;\n/)[0];
  assert.match(fs, /<rect x="104" y="28" width="80" height="78" rx="10" fill="#c69434"/);
  const hs = g.match(/else if\(kind==='HatShop'\)\{[\s\S]*?\n    \}/)[0];
  assert.match(hs, /<rect x="110" y="66" width="78" height="9" rx="4\.5" fill="#c69434"/);
  assert.deepEqual(off(fs + hs), []);
});

test("v201 Dots Last is a chalk slate; Letter Train is a train on a track with balloons tied on", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const dl = g.match(/else if\(kind==='DotsLast'\)scene=`[\s\S]*?`;\n/)[0];
  assert.match(dl, /<rect x="58" y="18" width="84" height="76" rx="8" fill="#2f5c46"/);
  const lt = g.match(/else if\(kind==='LetterTrain'\)scene=`[\s\S]*?`;\n/)[0];
  assert.match(lt, /<rect x="120" y="70" width="52" height="26" rx="6" fill="#62cdf4"/);
  assert.match(lt, /\[16,40,64,88,112,136,160,184\]/);
  assert.deepEqual(off(dl + lt), []);
});

test("v202 Living Books tile: banded spines on a wooden shelf with a potted-plant bookend", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='LivingBooks'\)\{[\s\S]*?\n    \}/)[0];
  assert.match(e, /<rect x="12" y="102" width="176" height="10" rx="5" fill="#c69434"/);
  assert.match(e, /<path d="M166 80H188L185 102H169Z" fill="#ee806f"/);
  assert.deepEqual(off(e), []);
});

test("v203 open books get covers, page edges and ribbons; the Fill Gap egg sits in a nest clear of the vowel marks", () => {
  const g = read("src/letters/LettersGardenArt.js");
  assert.match(g, /<path d="M16 28Q60 16 100 30Q140 16 184 28V118Q140 108 100 120Q60 108 16 118Z" fill="#ee806f"/);
  assert.match(g, /<path d="M20 30Q62 18 100 32Q138 18 180 30V116Q138 106 100 118Q62 106 20 116Z" fill="#62cdf4"/);
  const fg = g.match(/else if\(kind==='FillGap'\)\{[\s\S]*?\n    \}/)[0];
  assert.match(fg, /<text x="118" y="108"/);
  assert.match(fg, /<path d="M64 52Q66 70 100 70Q134 70 136 52Z" fill="#c69434"/);
  assert.deepEqual(off(fg), []);
});

test("v204 Peek Flaps tile: the flap is a door leaf swung open on its hinge, not a pole through the elephant", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/if\(kind==='PeekFlaps'\)scene=`[\s\S]*?`;\n/)[0];
  assert.doesNotMatch(e, /M60 112V58Q60 40 84 40/);
  assert.match(e, /<path d="M100 112V44Q96 30 84 30L76 36V108Z" fill="#b7e779"/);
  assert.match(e, /pic\('elephant',4,36,66\)/);
  assert.deepEqual(off(e), []);
});

test("v205 the build game's joinery table: stretcher bar, shaped feet, apron seams and a drawer with a gold pull", () => {
  const a = read("src/letters/LettersActivityArt.js");
  const j = a.match(/function joinery\(\)\{[\s\S]*?\n  \}\n/)[0];
  assert.match(j, /<path d="M128 504H590" stroke="#a89478"/);
  assert.match(j, /<rect x="290" y="447" width="140" height="22" rx="6" fill="#c9bda4"/);
  assert.match(j, /<rect x="346" y="453" width="28" height="10" rx="5" fill="#f3c955"/);
  assert.deepEqual(off(j), []);
  assert.doesNotMatch(a, /v205: the bench front is built/);
});

test("v206 the pinecone find has overlapping rows of golden scales, a stem and a leaf", () => {
  const r = read("src/letters/LettersRoomArt.js");
  const m = r.match(/pinecone:`([\s\S]*?)`,\n/)[1];
  assert.match(m, /\[\[32,16,7\],\[26,26,8\]/);
  assert.match(m, /fill="#c69434"/);
  assert.deepEqual(off(m), []);
});

test("v207 the meadow gets edge scenery (tufts with small flowers) without a tint band", () => {
  const m = read("src/letters/LettersMapArt.js");
  assert.match(m, /const tint=LAND\[run\.biome\];if\(!tint&&run\.biome!=='meadow'\)return;/);
  assert.match(m, /if\(tint\)bands\.push\(/);
  const b = m.slice(m.indexOf("else if(run.biome==='meadow')scenery.push("), m.indexOf("else if(run.biome==='lagoon')scenery.push("));
  assert.match(b, /translate\(\$\{\(x\+34\)\.toFixed\(0\)\}/);
  assert.deepEqual(off(b), []);
});

test("v208 the land-gate pole has a climbing vine with leaves and a flower, a crossbar knob and a foot peg", () => {
  const m = read("src/letters/LettersMapArt.js");
  const g = m.match(/function gate\(biome='orchard',open=false,dir=1\)\{[\s\S]*?\n  \}\n/)[0];
  assert.match(g, /<path d="M-6 -6Q8 -16 -6 -28Q8 -40 -6 -52Q6 -60 0 -66"/);
  assert.match(g, /<circle cx="\$\{d\*44\}" cy="-73\.5" r="4" fill="#f3c955"/);
  assert.deepEqual(off(g), []);
});

test("v209 each orchard stop grows its own tree (seed and size from the landmark variant)", () => {
  const m = read("src/letters/LettersMapArt.js");
  assert.match(m, /function orchard\(variant=0\)\{/);
  assert.match(m, /seed:3\+\(variant%5\)\*2,hooks:true/);
  assert.match(m, /const content=biome==='orchard'\?orchard\(variant\):/);
});

test("v210 wildflower stops vary: flower colours and heights rotate and the bees shift per stop", () => {
  const m = read("src/letters/LettersMapArt.js");
  assert.match(m, /function wildflowers\(variant=0\)\{/);
  assert.match(m, /wildflowers\(Math\.floor\(variant\/2\)\)/);
  const w = m.slice(m.indexOf("function wildflowers(variant=0)"), m.indexOf("function landingV115"));
  assert.deepEqual(off(w), []);
});

test("v211 reed stops vary (cattail heights, lily flower colour); toy hooks kept", () => {
  const m = read("src/letters/LettersMapArt.js");
  const r = m.match(/function reeds\(variant=0\)\{[\s\S]*?`;\}/)[0];
  assert.match(r, /class="lm-reeds"/);
  assert.match(r, /class="lm-leaf"/);
  assert.match(r, /\]\[variant%3\]\.map/);
  assert.match(m, /biome==='lagoon'\?reeds\(variant\)/);
  assert.deepEqual(off(r), []);
});

test("v212 alternate mountain stops are mirrored so the peaks vary", () => {
  const m = read("src/letters/LettersMapArt.js");
  assert.match(m, /biome==='peaks'\?\(variant%2\?`<g transform="translate\(176 0\) scale\(-1 1\)">\$\{peaks\(\)\}<\/g>`:peaks\(\)\)/);
});

test("v213 the Bath Time tile matches the game's clawfoot tub (rolled rim, tap, claw feet)", () => {
  const g = read("src/letters/LettersGardenArt.js");
  const e = g.match(/else if\(kind==='BathTime'\)\{[\s\S]*?\n    \}/)[0];
  assert.match(e, /<rect x="32" y="71" width="136" height="9" rx="4\.5" fill="#fffdf7"/);
  assert.match(e, /\[60,140\]\.map/);
  assert.deepEqual(off(e), []);
});

test("v214 the village lawn gets quiet grass tufts and tiny flowers under everything", () => {
  const v = read("src/letters/VillageArt.js");
  const b = v.match(/function backdrop\([\s\S]*?\n  \}\n/)[0];
  assert.match(b, /<g opacity="\$\{night \? 0\.4 : 0\.6\}">/);
  assert.match(b, /\[0\.08, 0\.5\], \[0\.3, 0\.46\]/);
  assert.deepEqual(off(b), []);
});

test("v215 the pairs game's waiting pots have a rolled rim, soil and a dotted band; the sprout hook is kept", () => {
  const m = read("src/letters/MiniGames.js");
  const f = m.match(/function matchingSprout\(\) \{[\s\S]*?\n  \}\n/)[0];
  assert.match(f, /class="pairs-sprout"/);
  assert.match(f, /<rect x="12" y="50" width="48" height="9" rx="4\.5" fill="#ee806f"/);
  assert.match(f, /<ellipse cx="36" cy="51\.5" rx="19" ry="2\.6" fill="#70501b"\/>/);
  assert.deepEqual(off(f), []);
});

test("v216 the graduation Bismillah card is a certificate with a gold border and a rosette", () => {
  const c = read("styles/letters-materials.css");
  const b = c.slice(c.indexOf("/* v216:"));
  assert.match(b, /inset 0 0 0 11px #f3c955/);
  assert.match(b, /\.lg-app \.sg-grad \.sg-rehal::after \{/);
  assert.deepEqual(off(b.replace(/%23/g, "#")), []);
});

test("v217 the pet-colour choices get a glossy shine; no drip", () => {
  const c = read("styles/letters-materials.css");
  assert.match(c, /\.lg-app \.hatch-hue::before \{ content: ""; position: absolute;/);
  assert.doesNotMatch(c, /\.hatch-hue::after/);
});

test("v218 Living Books night pages without their own moon get a crescent with its shine on the body", () => {
  const l = read("src/letters/LivingBooks.js");
  assert.match(l, /const NIGHT_MOON = `/);
  assert.match(l, /a\.night \? NIGHT_SKY \+ NIGHT_MOON : SUN_SKY/);
  assert.match(l, /<ellipse cx="50" cy="30" rx="2" ry="4\.5"/);
  assert.deepEqual(off(l.match(/const NIGHT_MOON = `[\s\S]*?`;/)[0]), []);
});

test("v219 the raft keepsake is two lashed logs with ringed ends; letters sit on the top log", () => {
  const j = read("src/letters/LettersJourney.js");
  const r = j.match(/function raftArt\([\s\S]*?\n  \}\n/)[0];
  assert.match(r, /tag\(x \+ dx, y \+ 7, 38, 22/);
  assert.match(r, /width="6" height="36" rx="3" fill="#e5dcc8"/);
  assert.deepEqual(off(r), []);
});

test("v220 the village stepping stones have a crack line and a moss tuft on the rim", () => {
  const v = read("src/letters/VillageArt.js");
  const f = v.match(/function stones\(done = 0, total = 3\) \{[\s\S]*?\n  \}\n/)[0];
  assert.match(f, /fill="#7fce54" stroke="#4e9677" stroke-width="1\.6"/);
  assert.match(f, /done \? "#c69434" : "#c9bda4", 1\.6/);
  assert.deepEqual(off(f), []);
});

test("v221 the sticker stand's savings row shows only earned stars plus a sprout, never empty slots", () => {
  const g = read("src/letters/LettersGame.js");
  assert.match(g, /Array\.from\(\{ length: Math\.min\(5, this\.starBalance\(\)\) \}, \(\) => `<i class="is-on">/);
  assert.match(g, /this\.starBalance\(\) < 5 \? `<i class="is-grow">/);
  assert.doesNotMatch(g, /i < this\.starBalance\(\) \? "is-on" : ""/);
  const c = read("styles/letters-materials.css");
  assert.match(c, /\.lg-app \.stand-pips i\.is-grow \{ color: #7fce54; \}/);
});

test("v222 on phones the shore boat steps aside on the meet screen (upright and sideways); tablets keep it", () => {
  const c = read("styles/letters-materials.css");
  assert.match(c, /@media \(orientation: landscape\) and \(max-height: 500px\), \(max-width: 520px\) \{\n  \.lg-app\.lg-boat-chapter:has\(\.lg-meet\) \.garden-shore-boat \{ visibility: hidden; \}/);
});

test("v223 sideways phones: the shore boat steps aside on game screens too", () => {
  const c = read("styles/letters-materials.css");
  assert.match(c, /\.lg-app\.lg-boat-chapter:has\(\.lg-play\) \.garden-shore-boat \{ visibility: hidden; \}/);
});

test("v224 the cloud sticker has a happy face (eyes, smile, rosy cheeks) like the sun", () => {
  const a = read("src/letters/LettersArt.js");
  const c = a.match(/    cloud: `([\s\S]*?)`,\n/)[1];
  assert.match(c, /<path d="M-2 5Q1 8 4 5"/);
  assert.match(c, /fill="#ffa798" opacity="\.7"/);
  assert.deepEqual(off(c), []);
});

test("v225 ambient village life: butterflies by day, fireflies at night; untappable and still under reduced motion", () => {
  const v = read("src/letters/VillageArt.js");
  assert.match(v, /function ambient\(W, H, night = false\) \{/);
  assert.match(v, /ns\.VillageArt = \{ backdrop, ambient,/);
  const a = v.match(/function ambient\([\s\S]*?\n  \}\n/)[0];
  assert.match(a, /pointer-events="none"/);
  assert.deepEqual(off(a), []);
  assert.match(read("src/letters/LettersGame.js"), /\$\{V\.ambient \? V\.ambient\(L\.W, L\.H, night\) : ""\}/);
  const c = read("styles/letters-materials.css");
  assert.match(c, /@media \(prefers-reduced-motion: reduce\) \{ \.lg-app \.vg-butterfly, \.lg-app \.vg-firefly \{ animation: none; \} \}/);
  assert.match(c, /\.lg-reduce-motion \.vg-butterfly, \.lg-reduce-motion \.vg-firefly \{ animation: none; \}/);
});

test("v226 the map's edge margin gets a butterfly every third stop (firefly at night), untappable", () => {
  const m = read("src/letters/LettersMapArt.js");
  assert.match(m, /const ambient=ordered\.filter\(\(_,i\)=>i%3===1\)/);
  assert.match(m, /\$\{scenery\.join\(''\)\}\$\{undergrowth\}\$\{ambient\}/);
  const a = m.slice(m.indexOf("const ambient=ordered"), m.indexOf("// v65 (art system)"));
  assert.match(a, /pointer-events="none"/);
  assert.deepEqual(off(a), []);
});

test("v227 the cottage chimney smoke drifts (still under reduced motion)", () => {
  assert.match(read("src/letters/VillageArt.js"), /<circle class="vg-smoke" style="--d:\$\{i \* 0\.9\}s"/);
  const c = read("styles/letters-materials.css");
  assert.match(c, /@media \(prefers-reduced-motion: reduce\) \{ \.lg-app \.vg-smoke \{ animation: none; \} \}/);
});

test("v228 the birdbath sunflower sways from its stem (still under reduced motion)", () => {
  assert.match(read("src/letters/VillageArt.js"), /<g class="vg-sway">/);
  const c = read("styles/letters-materials.css");
  assert.match(c, /\.lg-app \.vg-sway \{ animation: vg-sway 3\.4s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; \}/);
  assert.match(c, /@media \(prefers-reduced-motion: reduce\) \{ \.lg-app \.vg-sway \{ animation: none; \} \}/);
});

test("v229 the toy chest balloon bobs on its string (still under reduced motion)", () => {
  assert.match(read("src/letters/VillageArt.js"), /<g class="vg-bob"><path d="M36 -24V-58"/);
  assert.match(read("styles/letters-materials.css"), /@media \(prefers-reduced-motion: reduce\) \{ \.lg-app \.vg-bob \{ animation: none; \} \}/);
});

test("v230 empty decorating spots twinkle softly (still under reduced motion)", () => {
  const d = read("src/letters/DecoratingGarden.js");
  assert.match(d, /<path class="decorate-twinkle" d="M50 30Q52 37 59 39/);
  assert.match(read("styles/letters-materials.css"), /@media \(prefers-reduced-motion: reduce\) \{ \.lg-app \.decorate-twinkle \{ animation: none; \} \}/);
});

test("v231 village clouds drift left and back only (clear of the sound button); still under reduced motion", () => {
  assert.match(read("src/letters/VillageArt.js"), /const puff = \(x, y, k, warm = false\) => `<g class="vg-cloud"/);
  const c = read("styles/letters-materials.css");
  assert.match(c, /@keyframes vg-cloud \{ 0%, 100% \{ transform: translateX\(0\); \} 50% \{ transform: translateX\(-18px\); \} \}/);
  assert.match(c, /@media \(prefers-reduced-motion: reduce\) \{ \.lg-app \.vg-cloud \{ animation: none; \} \}/);
});

test("v232 village bushes vary by position (flower colour and mirror)", () => {
  const v = read("src/letters/VillageArt.js");
  assert.match(v, /const bush = \(x, y, s\) => \{ const k = Math\.round\(x \+ y\) % 3, flip = Math\.round\(x\) % 2 \? -1 : 1/);
  assert.match(v, /scale\(\$\{s \* flip\} \$\{s\}\)/);
});

test("v233 the cottage windows glow warm at night", () => {
  const v = read("src/letters/VillageArt.js");
  assert.equal((v.match(/<circle class="vg-win"/g) || []).length, 2);
  assert.match(read("styles/letters-materials.css"), /\.lg-app\[data-garden-phase="night"\] \.vg-win \{ fill: #ffe49a; \}/);
});

test("v234 the birdbath sunflower dozes at night (closed eyes and a z)", () => {
  assert.match(read("src/letters/VillageArt.js"), /<g class="vg-asleep"><path d="M-7 -19Q-5 -17 -3 -19/);
  const c = read("styles/letters-materials.css");
  assert.match(c, /\.lg-app\[data-garden-phase="night"\] \.vg-awake \{ display: none; \}/);
  assert.match(c, /\.lg-app \.vg-asleep \{ display: none; \}/);
});

test("v235 village night stars twinkle (still under reduced motion)", () => {
  assert.match(read("src/letters/VillageArt.js"), /<path class="vg-twinkle" style="--d:/);
  assert.match(read("styles/letters-materials.css"), /@media \(prefers-reduced-motion: reduce\) \{ \.lg-app \.vg-twinkle \{ animation: none; \} \}/);
});

test("v236 two birds fly home across the village sunset sky", () => {
  assert.match(read("src/letters/VillageArt.js"), /\[\[0\.3, 0\.1, 1\.4\], \[0\.4, 0\.065, 1\.05\]\]\.map/);
});

test("v237 morning dew glints on the village lawn tufts", () => {
  assert.match(read("src/letters/VillageArt.js"), /\$\{morning && i % 3 === 0 \? `<path d="M\$\{x - -2\} \$\{y - 20\}l2 4\.6/);
});

test("v238 a butterfly flutters over the friends' garden fence (untappable, still under reduced motion)", () => {
  const c = read("styles/letters-materials.css");
  const b = c.slice(c.indexOf("/* v238:"));
  assert.match(b, /pointer-events: none;/);
  assert.match(b, /@media \(prefers-reduced-motion: reduce\) \{ \.lg-app \.lg-friends-garden \.sg-fence::after \{ animation: none; \} \}/);
  assert.deepEqual(off(b.replace(/%23/g, "#")), []);
});

test("v239 a butterfly flutters over the decorating island, clear of the controls", () => {
  const c = read("styles/letters-materials.css");
  const b = c.slice(c.indexOf("/* v239:"));
  assert.match(b, /left: 6%; top: 7%;/);
  assert.match(b, /pointer-events: none;/);
  assert.match(b, /@media \(prefers-reduced-motion: reduce\) \{ \.lg-app \.decorate-board::after \{ animation: none; \} \}/);
  assert.deepEqual(off(b.replace(/%23/g, "#")), []);
});

test("v240 the sticker stall hangs a glowing lantern at night only", () => {
  const v = read("src/letters/VillageArt.js");
  const st = v.match(/function stall\(\) \{[\s\S]*?\n  \}\n/)[0];
  assert.match(st, /<g class="vg-night-only">/);
  assert.match(st, /<path d="M58 -32V-14"/);
  assert.deepEqual(off(st), []);
  const c = read("styles/letters-materials.css");
  assert.match(c, /\.lg-app \.vg-night-only \{ display: none; \}/);
  assert.match(c, /\.lg-app\[data-garden-phase="night"\] \.vg-night-only \{ display: inline; \}/);
});

test("v241 at night the friends' garden and island butterflies become fireflies", () => {
  const c = read("styles/letters-materials.css");
  assert.match(c, /\.lg-app\[data-garden-phase="night"\] :is\(\.lg-friends-garden \.sg-fence, \.decorate-board\)::after \{\n  width: 22px; height: 22px;/);
  assert.match(c, /@media \(prefers-reduced-motion: reduce\) \{ \.lg-app\[data-garden-phase="night"\] :is\(\.lg-friends-garden \.sg-fence, \.decorate-board\)::after \{ animation: none; \} \}/);
});

test("v242 gold sparkles around the unhatched egg cue a tap without motion", () => {
  const c = read("styles/letters-materials.css");
  const b = c.slice(c.indexOf("/* v242:"));
  assert.match(b, /\.lg-app \.hatch-egg::after \{\n  display: block;/);
  assert.match(b, /width: 230px; height: 150px;/);
  assert.match(b, /pointer-events: none;/);
  assert.deepEqual(off(b.replace(/%23/g, "#")), []);
});

test("v243 a heart plaque hangs above the cottage door", () => {
  const v = read("src/letters/VillageArt.js");
  const c = v.match(/function cottage\(\) \{[\s\S]*?\n  \}\n/)[0];
  assert.match(c, /<g transform="translate\(1 12\)"><rect x="-9" y="-6" width="18" height="12" rx="4" fill="#c69434"/);
  assert.deepEqual(off(c), []);
});

test("v250 the map's hot-air balloon is removed (no position stayed clear of landmarks and controls at every width)", () => {
  assert.doesNotMatch(read("src/letters/LettersMapArt.js"), /const balloon=/);
  assert.doesNotMatch(read("styles/letters-materials.css"), /\.vg-balloon/);
});

test("v245 today's weather shows in the village above the scene (untappable); the rainbow stays clear of the gate", () => {
  const c = read("styles/letters-materials.css");
  assert.match(c, /\.lg-app \.lg-village > \.lg-weather \{ position: absolute; inset: 0; z-index: 2; pointer-events: none; overflow: hidden; \}/);
  assert.match(c, /\.lg-app \.lg-village > \.lg-weather \.wx-rainbow \{ left: auto; right: -10%; top: 16%;/);
});

test("v246 Ramadan lanterns and Eid bunting show in the village sky (above the scene, untappable)", () => {
  const c = read("styles/letters-materials.css");
  assert.match(c, /\.lg-app \.lg-village > \.lg-season \{ z-index: 2; top: env\(safe-area-inset-top, 0px\); height: 92px; \}/);
  assert.match(read("styles/letters.css"), /\.lg-season \{[^}]*pointer-events: none;/);
});

test("v247 the season string runs along the top edge on the friends' garden and decorating island", () => {
  assert.match(read("styles/letters-materials.css"), /\.lg-app \.lg-screen:not\(\.lg-village\) > \.lg-season \{ top: env\(safe-area-inset-top, 0px\); height: 64px; \}/);
});

test("v249 the toy chest plate shows a star, never a keyhole", () => {
  const v = read("src/letters/VillageArt.js");
  const f = v.match(/function toyChest\(open = true\) \{[\s\S]*?\n  \}\n/)[0];
  assert.doesNotMatch(f, /<circle cy="20" r="3\.5" fill="#70501b"\/>/);
  assert.match(f, /<path d="M0 15\.5L2\.4 20\.5/);
  assert.deepEqual(off(f), []);
});

test("v251 the gate medal draws a gold star when there is no next letter", () => {
  const v = read("src/letters/VillageArt.js");
  const g = v.match(/  function gate\(letter, hue = 268, latin = false\) \{[\s\S]*?\n  \}\n/)[0];
  assert.match(g, /letter === "★" \? `<path transform="translate\(0 43\)"/);
  assert.match(g, /fill="#f3c955"/);
  assert.deepEqual(off(g), []);
});

test("v252 stickers placed in a scene are die-cut (white shape border), coloured copy layered on top", () => {
  const s = read("src/letters/StickerScenes.js");
  assert.match(s, /cutArt\(id\) \{/);
  assert.match(s, /<span class="ss-cut" aria-hidden="true">\$\{art\}<\/span>\$\{art\}/);
  const c = read("styles/letters-materials.css");
  assert.match(c, /\.lg-app \.ss-sticker > svg \{ filter: none; position: relative; z-index: 1; \}/);
});

test("v253 stickers on the decorating island are die-cut too", () => {
  assert.match(read("src/letters/DecoratingGarden.js"), /<svg class="decorate-sticker" viewBox="0 0 100 100"/);
  assert.match(read("styles/letters-materials.css"), /\.lg-app \.decorate-sticker \.ss-cut-g \* \{ fill: #fffdf7 !important;/);
});

test("v254 stamped days get flowers in three palette colours by date", () => {
  assert.match(read("src/letters/LettersGame.js"), /\.replaceAll\('fill="#ffa798"', `fill="\$\{\["#ffa798", "#ffe49a", "#e6d6f0"\]\[day % 3\]\}"`\)/);
});

test("v255 the stamp calendar header shows a moon at night, the sun by day", () => {
  assert.match(read("src/letters/LettersGame.js"), /Art\.dayPhase\?\.\(\) === "night" && Art\.stickerMotif \? Art\.stickerMotif\("moon", 48\) : \(Art\.artIcon\|\|Art\.icon\)\("sun", 48\)/);
});

test("v256 the sprout stage of the mastery plant has two leaves (never fewer than the seed stage)", () => {
  assert.match(read("src/letters/LettersGame.js"), /top = `\$\{stem\(22\)\}\$\{leaf\(34, -1\)\}\$\{leaf\(29, 1\)\}/);
});

test("v257 Bath Time foam has varied bubble sizes (minimum unchanged so the friend stays hidden)", () => {
  assert.match(read("src/letters/ToyBoxGames.js"), /8\.6 \+ Math\.random\(\) \*\* 2 \* 5\.4, FOAM/);
});

test("v258 Letter Hunt's tree is a built tree (clumped canopy), the letter hollow kept", () => {
  const h = read("src/letters/LetterHunt.js");
  assert.match(h, /const CL = \[\[0,-80,40\]/);
  assert.doesNotMatch(h, /<circle cy="-70" r="58" fill="#4e9677"\/>/);
  assert.match(h, /<ellipse cy="14" rx="15" ry="20" fill="#e5dcc8"/);
  const t = h.slice(h.indexOf("trunk: { art:"), h.indexOf("label: [0, 14]"));
  assert.deepEqual(off(t), []);
});

test("v259 the Sound Lab machine has a grille, lights, rivets and a lever; gear kept", () => {
  const s = read("src/letters/SoundLab.js");
  const m = s.match(/const machine = `[\s\S]*?<\/svg>`;/)[0];
  assert.match(m, /class="lab-gear"/);
  assert.match(m, /<circle cx="90" cy="158" r="22" fill="#3a8fc4"/);
  assert.match(m, /<circle cx="296" cy="104" r="9" fill="#ee806f"/);
  assert.deepEqual(off(m), []);
});

test("v260 Garden Together never prints 'undefined': a buddy pet fills the second seat", () => {
  const t = read("src/letters/GardenTogether.js");
  assert.match(t, /\$\{ctx\.petB \|\| ns\.LettersArt\?\.pet\?\.\(\{ hue: 320, species: "blob", stage: 1, size: 96 \}\) \|\| ""\}/);
  assert.match(t, /\$\{ctx\.petA \|\| ""\}/);
});

test("v261 Garden Together card backs carry a leaf emblem", () => {
  const c = read("styles/letters-materials.css");
  const b = c.slice(c.indexOf("/* v261:"));
  assert.match(b, /\.lg-app \.together-back::after \{/);
  assert.deepEqual(off(b.replace(/%23/g, "#")), []);
});

test("v262 on phones the shore boat steps aside on the joinery table games", () => {
  assert.match(read("styles/letters-materials.css"), /\.lg-app\.lg-boat-chapter:has\(\.lg-play:is\(\[data-activity="build"\]/);
});
