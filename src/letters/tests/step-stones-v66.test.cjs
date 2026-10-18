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
