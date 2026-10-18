const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..", "..", "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const palette = (() => {
  const art = read("ART.md");
  return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()));
})();
const off = text => (text.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()).filter(h => !palette.has(h));
const game = read("src/letters/LettersGame.js");

test("v58 Not yet is never a dead end: locked stops and the closed practice garden answer a tap", () => {
  assert.match(game, /, locked'\}" \$\{status === "locked" \? 'aria-disabled="true"' : ""\}>/, "a locked stop is aria-disabled, so it still hears the finger");
  const locked = game.slice(game.indexOf('if (this.statusOf(world) === "locked") {'), game.indexOf("if (travel?.world === world"));
  assert.match(locked, /const open = el\.querySelector\("\.map-stop\.is-current"\);/);
  assert.match(locked, /open\.scrollIntoView\?\.\(\{ block: "center"/);
  assert.match(locked, /if \(Math\.abs\(y - last\) < 1 \|\| \(waited \+= 120\) > 2400\) return this\.feel\?\.point\?\.\(open\);/, "the hand waits for the scroll to settle");
  assert.match(game, /k=>k\.startsWith\('pack-boat:'\)\);/);
  assert.match(game, /\$\{open \? '' : 'aria-disabled="true"'\}>\$\{ns\.LettersGardenArt\.practicePicture\('DotGarden'\)\}/);
  assert.match(game, /if\(btn\.getAttribute\("aria-disabled"\)!=="true"\)return this\.renderPracticeGarden\(\);\n\s+btn\.classList\.remove\("is-soon"\);void btn\.offsetWidth;btn\.classList\.add\("is-soon"\);/);
  const css = read("styles/letters.css");
  assert.match(css, /\.map-practice-garden\[aria-disabled="true"\]\{opacity:\.62;cursor:default\}/);
  assert.doesNotMatch(css, /\.map-practice-garden:disabled/);
});

test("v58 Empty garden plots and missed drops: something always answers", () => {
  const deco = read("src/letters/DecoratingGarden.js");
  assert.match(deco, /if\(!id\)\{const hint=this\.catalog\.length\?this\.choices\.find\(c=>c\.getClientRects\(\)\.length\):stage\.querySelector\('\.decorate-earn'\);/);
  assert.doesNotMatch(deco, /button\.disabled=!this\.catalog\.length;/);
  assert.match(deco, /if\(ghost&&i<0&&!cancel&&button\.isConnected&&ghost\.animate/, "a decoration dropped on bare ground floats back to its shelf");
  const practice = read("src/letters/GardenPractice.js");
  assert.match(practice, /const took=enabled\(\)&&drop\(e\.clientX,e\.clientY,released\);if\(!took\)glideHome\(el,off\);/);
  assert.match(practice, /prefers-reduced-motion: reduce\)'\)\.matches\)return;el\.animate\(\[\{transform:off\},\{transform:'none'\}\]/, "reduced motion: no glide");
  assert.match(practice, /drop:\(x,y\)=>\{if\(!inside\(card,x,y\)\)return false;choose\(i\);return true;\}/, "a drop says whether it was taken");
});

test("v58 A muted game shows the speaker; a new child is shown sooner, and twice", () => {
  assert.match(game, /const muted = idle && !this\.sound\.enabled && \[\.\.\.this\.root\.querySelectorAll\("\.lg-sound"\)\]\.find\(visible\);\n\s+if \(muted\) return this\.feel\.point\(muted\);/);
  const idle = game.slice(game.indexOf("    idlePoint(screenEl"), game.indexOf("    watchIdlePrompt("));
  assert.match(idle, /if \(!this\.progress\?\.done\?\.length\) ms = Math\.min\(ms, 5000\);/);
  assert.match(idle, /if \(\+\+shown < 2\) arm\(ms \+ 5000\);/);
  assert.match(game, /if \(this\.stickers\.freeVisits && !allOwned\) this\.idlePoint\(el, 3500, "\.album-stand"\);/, "a waiting free visit is pointed at");
});

test("v58 Nothing counts zero at a child: no 0 stars, no 0 friends", () => {
  assert.match(game, /\$\{\(Art\.artIcon\|\|Art\.icon\)\("star", 30\)\}\$\{this\.starBalance\(\) \? `<b>\$\{this\.starBalance\(\)\}<\/b>` : ""\}/);
  assert.doesNotMatch(game, /<span class="lg-star-chip">\$\{Art\.icon\("star", 20\)\} <b>\$\{this\.starBalance\(\)\}<\/b><\/span>\n/, "every star chip is conditional");
  assert.equal((game.match(/\$\{this\.starBalance\(\) \? `<span class="lg-star-chip">/g) || []).length, 2);
  assert.match(read("src/letters/StoryGarden.js"), /\$\{this\.homeFriends\(\)\.length \? `<span class="sg-count"/);
});

test("v58 First looks: a waiting sky, free colours first, and the last stop clear of the header", () => {
  assert.match(game, /if \(st === "unseen"\) return `<g class="chart-sleep"[^`]*<circle r="28" fill="#23253f" fill-opacity="0"\/><g class="chart-sleeper"><g transform="scale\(1\.4\)"><path d="\$\{SLEEP_STAR\}" fill="#6064a0"/);
  const rooms = read("styles/letters-rooms.css");
  assert.match(rooms, /@media\(prefers-reduced-motion:reduce\)\{\.chart-sleep,\.chart-sleeper,\.chart-z\{animation:none!important\}\}/);
  assert.deepEqual(off(rooms), []);
  assert.match(game, /const tab=\['friends','outfits','colors','tricks'\]\.includes\(this\.wardrobeTab\)\?this\.wardrobeTab:canShop\?'outfits':'colors';/);
  assert.match(game, /const height = total \* GAP \+ 240 \+ \(window\.innerWidth < 600 \? 110 : 0\);/);
  assert.match(read("letters.html"), /\?v=20261009-v58/);
  assert.match(read("sw.js"), /const VERSION = "miftah-v227-letter-garden-v165-20261018";/);
});

test("v58 WordGap is winnable: the right piece matches even when NFC reorders shadda and vowel", () => {
  const vm = require("node:vm");
  const window = { MiftahGame: {} };
  vm.runInContext(read("src/letters/WordGames.js"), vm.createContext({ window, setTimeout, clearTimeout, Math, String, Set, Map }));
  const { clusters } = window.MiftahGame.WordGames;
  const Base = Object.getPrototypeOf(window.MiftahGame.GardenPractice.WordGap.prototype);
  // Exactly as stored in the word data (shadda before the vowel; alif + madda as two marks).
  for (const display of ["\u0625\u0650\u0646\u0651\u064e", "\u0644\u064e\u0627\u0653", "\u0645\u0651\u0650\u0646"]) {
    const rebuilt = clusters(display).join("");
    assert.notEqual(rebuilt, display, `${display} really is reordered by NFC (the trap)`);
    const got = Base.report.call({ missed: false, heard: true, constructor: { name: "WordGap" }, ctx: {} }, { display }, rebuilt, [rebuilt], "word-reading");
    assert.equal(got, true, `${display}: the right piece counts as right`);
  }
});

test("v58 iPad: nothing in reach is pushed off the screen", () => {
  const world = read("styles/letters-map-world.css");
  assert.match(world, /@media\(min-width:1000px\) and \(max-width:1279px\)\{\.lg-home \.map-play-places\{left:auto;right:118px;transform:none\}\}/, "1024 landscape: play places no longer run under the daily tray");
  const fit = game.slice(game.indexOf("    fitStage(stage){"), game.indexOf("    gardenReward("));
  assert.match(fit, /if\(\(parseFloat\(root\.style\.zoom\)\|\|1\)<1\)\{root\.style\.zoom='';root\.style\.width='';\}/, "shrunk games are measured at their natural layout (no flip-flop)");
  assert.match(fit, /if\(\(overY<=2&&overX<=2\)\|\|cur<=floor\)break;/);
  const css = read("styles/letters.css");
  assert.match(css, /\.studio \{ display: grid; grid-template-columns: minmax\(0, 1fr\); justify-items: center; gap: 10px; width: min\(100%, 620px, max\(220px, calc\(\(100dvh - 400px\) \* 4 \/ 3\)\)\);/, "the 4:3 studio canvas is capped by the height left over (and the grid column can shrink below the SVG's 300px default)");
  assert.ok(css.indexOf("@media (min-width: 900px) and (max-height: 900px) { .lab {") > css.indexOf(".lab-press { position: relative;"), "the landscape Sound Lab rule comes after the base rules it overrides");
  assert.deepEqual(off(world), []);
  assert.match(read("styles/letters-friends.css"), /@media \(min-width: 900px\) and \(max-height: 900px\) \{ \.lg-practice-garden \.practice-garden-hub \{ width: min\(1000px, 100%\); grid-template-columns: 1fr 1fr; align-items: start; \} \}/, "toy groups two by two on a landscape iPad");
});

test("v58 Lantern Hunt: a long search in the dark is helped; new glides honour the app's reduce-motion switch", () => {
  const sh = read("src/letters/ShadowGames.js");
  assert.match(sh, /this\.sweeps = found \? 0 : \(this\.sweeps \|\| 0\) \+ 1;\n\s+if \(this\.sweeps >= 6\) \{/);
  assert.match(sh, /if \(k >= 0\) \{ this\.missed = true; this\.later\(\(\) => \{ this\.moveTo\(this\.hidden\[k\]\.x, this\.hidden\[k\]\.y\);/, "the helped find is recorded as helped");
  assert.match(read("src/letters/GardenPractice.js"), /el\.closest\?\.\('\.lg-reduce-motion'\)\|\|window\.matchMedia/);
  assert.match(read("src/letters/DecoratingGarden.js"), /!this\.ctx\.reducedMotion\?\.\(\)&&!window\.matchMedia/);
  assert.match(read("styles/letters-friends.css"), /\.lg-app\.lg-reduce-motion \.is-soon, \.lg-app\.lg-reduce-motion \.is-soon \.pet-acc-cost \{ animation: none; \}/);
});

test("v58 Every guessing game ends in a hint: Busy Market and Letter Hunt now glow the answer after misses", () => {
  const bk = read("src/letters/BookGames.js");
  assert.match(bk, /if \(p\.char !== c && \+\+this\.misses >= 3\) \{/);
  assert.match(bk, /showLens\(\) \{\n\s+const c = this\.lenses\[this\.lens\];\n\s+this\.misses = 0;/, "a new lens starts fresh");
  const hunt = read("src/letters/LetterHunt.js");
  assert.match(hunt, /if \(\+\+this\.misses >= 2\) \{\n\s+const k = this\.letters\.findIndex/);
  const css = read("styles/letters.css");
  assert.match(css, /\.hunt-spot\.is-hint \.hunt-thing \{ filter: drop-shadow\(0 0 0 #f3c955\) drop-shadow\(0 0 8px #f3c955\); animation: hunt-hint/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.hunt-spot \.hunt-thing, \.hunt-found \{ animation: none !important; \} \}/, "the glow stays; the pulse stops");
});

test("v58 Chapter games too: Pairs glows the partner after two tries, Burst the right leaf after two misses", () => {
  const mini = read("src/letters/MiniGames.js");
  assert.match(mini, /if \(\(first\.tries = \(first\.tries \|\| 0\) \+ 1\) >= 2\) \{\n\s+const mate = this\.cards\.find\(\(c\) => c\.el !== first\.el && c\.id === first\.card\.id/);
  assert.match(mini, /if \(\+\+this\.misses >= 2\) \[\.\.\.this\.grid\.children\]\.forEach\(\(b\) => b\.classList\.toggle\("is-hint", b\.getAttribute\("aria-label"\) === this\.target\.display\)\);/);
  const art = read("styles/letters-art-pass.css");
  assert.match(art, /\.pairs-card\.is-hint\{box-shadow:0 0 0 5px #f3c955/);
  assert.match(art, /@media \(prefers-reduced-motion: reduce\)\{\.lg-app \.burst-tile\.is-hint\{animation:none\}\}/);
  assert.deepEqual(off(art.slice(art.indexOf("/* v58: after two tries"))), [], "the new hint rules stay in the palette");
});

test("v58 Letter Delivery: tapping the destination before choosing a packet makes the packets hop", () => {
  const d = read("src/letters/LetterDelivery.js");
  assert.match(d, /this\.destination\.onclick=\(\)=>\{if\(!this\.alive\|\|this\.busy\)return;if\(this\.selected\)return this\.offer\(this\.selected\);/);
  assert.match(d, /this\.packetButtons\.filter\(b=>!b\.disabled\)\.forEach\(\(b,k\)=>\{b\.classList\.remove\('is-soon'\);/);
  assert.match(read(".qa/autoplay.js"), /maxDry/, "the auto-player reports the longest run of taps without a success");
});

test("v58 On a roll: every third win in a row blooms into petals; nothing counts it on screen", () => {
  assert.match(game, /this\._hitRun = \(this\._hitRun \|\| 0\) \+ 1;\n\s+const bloom = !comeback && this\._hitRun % 3 === 0;/);
  assert.match(game, /this\._missStreak = \(this\._missStreak \|\| 0\) \+ 1;\n\s+this\._hitRun = 0;/, "a miss quietly starts the run again");
  const css = read("styles/letters-friends.css");
  assert.match(css, /@keyframes lg-bloom \{/);
  assert.match(css, /\.lg-hit-flash, \.lg-burst \{ display: none; \}/, "reduced motion: no burst of any kind");
  const petals = game.slice(game.indexOf('if (bloom) burst.innerHTML'), game.indexOf('else burst.innerHTML'));
  assert.deepEqual(off(petals), []);
});

test("v58 The skill flower never shrinks in front of a child: petals show the best check-up", () => {
  const vm = require("node:vm");
  assert.match(game, /best: Math\.max\(stars, was\?\.best \|\| 0, was\?\.score \|\| 0\)/, "the best is kept alongside the latest");
  const art = read("src/letters/LettersArt.js");
  assert.match(art, /const score = scores\[skill\.id\] \? Math\.max\(Number\(scores\[skill\.id\]\.score\) \|\| 0, Number\(scores\[skill\.id\]\.best\) \|\| 0\) : 0;/);
});

test("v58 What a child grew stays grown: map plants and bright stars are high-water marks", () => {
  const vm = require("node:vm");
  const body = game.slice(game.indexOf("    grownMark(kind, id, value) {"), game.indexOf("    masteryPlant(m) {"));
  const store = {};
  const fake = { loadJSON: (k, d) => store[k] ? JSON.parse(store[k]) : d, saveJSON: (k, v) => { store[k] = JSON.stringify(v); } };
  const fn = vm.runInNewContext(`({${body.trim()}})`, { Math, Number, JSON }).grownMark;
  assert.equal(fn.call(fake, "worlds", "w1", 0.8), 0.8);
  assert.equal(fn.call(fake, "worlds", "w1", 0.4), 0.8, "a miss later never shrinks the flower");
  assert.equal(fn.call(fake, "worlds", "w1", 0.9), 0.9, "but it still grows");
  assert.match(game, /return this\.grownMark\("worlds", world\?\.id, m\);/);
  assert.match(game, /pack\.letters\.filter\(l => this\.grownMark\("letters", l\.char, strength\.mastery\(l\.char\)\) >= 0\.6\)/, "a pet never forgets a trick");
});

test("v58 Tracing patience: each struggle widens the path; after five the stroke draws itself, counted as helped", () => {
  const st = read("src/letters/LettersStrokes.js");
  assert.match(st, /const ease = \(part\) => 1 \+ Math\.min\(part\.struggle \|\| 0, 3\) \* 0\.35;/);
  assert.match(st, /if \(part\.struggle < 5 \|\| !alive \|\| part\.done\) return;\n\s+onSnap\?\.\(\);/, "the self-drawn stroke is a helped stroke");
  assert.match(st, /if \(part && part === press\.part && !press\.moved && !part\.done && !svg\.classList\.contains\("is-demo"\)\) struggled\(part\);/, "a press that got nowhere counts as a try");
  assert.match(st, /dist\(pt, part\.samples\[j\]\) < TOL \* ease\(part\) && \(part\.at > 0 \|\| j < 4 \+ \(part\.struggle \|\| 0\)\)/, "the start gets easier to catch too");
});

test("v58 Coverage tracing has patience too: every three unfinished tries lower the bar", () => {
  const mini = read("src/letters/MiniGames.js");
  assert.match(mini, /const easy = Math\.min\(2, Math\.floor\(\(this\.tries \|\| 0\) \/ 3\)\);/);
  assert.match(mini, /if \(total >= \[0\.55, 0\.45, 0\.35\]\[easy\] && !missing\.length\) \{/);
  assert.match(mini, /this\.tries = 0; \/\/ pen-ups that didn't finish/);
});

test("v58 Water Garden is framed like every other play panel", () => {
  const css = read("styles/letters-water.css");
  assert.match(css, /\.water-garden::after \{ content:""; position:absolute; inset:0; border:3px solid #4a3620; border-radius:26px; pointer-events:none; \}/);
  assert.deepEqual(off(css), []);
});

test("v58 Hat Shop on a phone: the hats fit, so the progress stays on screen", () => {
  assert.match(read("styles/letters-friends.css"), /@media \(max-width: 420px\) \{ \.vh-shelf \{ gap: 10px; padding: 12px 10px; \} \.vh-choice \{ min-width: 74px; padding: 8px; \} \}/);
});

test("v58 Sound Lab on phones: every letter is reachable (the page can't scroll, so the trays swipe)", () => {
  const css = read("styles/letters.css");
  assert.match(css, /@media \(max-width: 600px\) and \(max-height: 900px\), \(max-height: 500px\) \{ \.lab-press \{ width: min\(100%, 190px\); \} \.lab-tray \{ flex-wrap: nowrap; justify-content: flex-start; overflow-x: auto;/);
  assert.ok(css.indexOf("(max-height: 500px) { .lab-press") > css.indexOf(".lab-tray { display: flex;"), "the phone rule comes after the base tray rule");
});

test("v58 Friends' Garden: all 28 friends can be reached on a phone (the bed scrolls inside the screen)", () => {
  const css = read("styles/letters-friends.css");
  assert.match(css, /\.lg-friends-garden \.sg-plots \{ max-height: calc\(100dvh - 170px\); overflow-y: auto; overscroll-behavior: contain; \}/);
  assert.match(css, /@media \(max-width: 600px\) \{ \.sg-plots \{ grid-template-columns: repeat\(auto-fill, minmax\(58px, 1fr\)\);/);
});

test("v58 Book shelf on a phone: all four books in reach (two to a row; the shelf scrolls as a fallback)", () => {
  const css = read("styles/letters-friends.css");
  assert.match(css, /\.lg-book-shelf \.lb-shelf \{ max-height: calc\(100dvh - 90px\); overflow-y: auto;/);
  assert.match(css, /@media \(max-width: 600px\) \{ \.lb-shelf \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
});

test("v58 iPhone SE (320×568): Sound Lab, Colour a Friend and Letter Studio fit", () => {
  assert.match(read("styles/letters.css"), /@media \(max-width: 600px\) and \(max-height: 620px\) \{ \.lab-press \{ width: min\(100%, 130px\); \} \.lab-slot \{ width: 60px; height: 70px; font-size: 32px; \} \}/);
  assert.match(read("styles/letters-toybox.css"), /\.tb-paper \{ width: min\(80vw, 300px, 34vh, max\(140px, calc\(100dvh - 410px\)\)\);/, "never negative on a landscape phone");
});

test("v58 Landscape phones use their width: Spot the Change, Delivery, Studio and Sound Lab fit without scrolling", () => {
  const css = read("styles/letters-landscape.css");
  const block = css.slice(css.indexOf("/* v58: landscape phones use their width."));
  assert.match(block, /@media \(orientation: landscape\) and \(max-height: 500px\) \{/);
  assert.match(block, /\.lk-spot \.lk-row \{ grid-template-columns: repeat\(var\(--n, 4\), minmax\(0, 1fr\)\);/);
  assert.match(block, /\.lg-play\[data-activity=delivery\] \.practice-stage, \.letter-delivery \{ min-height: 0; \}/);
  assert.match(block, /\.studio-canvas \{ grid-row: 1 \/ span 3; \}/);
  assert.match(block, /\.lab-letters \{ grid-column: 2; grid-row: 3; \}/);
  assert.deepEqual(off(block), []);
});

test("v58 Landscape phones: decorating puts the shelf beside the garden; the four books share one row", () => {
  const css = read("styles/letters-landscape.css");
  assert.match(css, /\.decorate-selection, \.decorate-shelf, \.decorate-tools \{ grid-column: 2; \}/);
  assert.match(css, /\.lb-shelf \{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/);
});

test("v58 Little Sprout: chapter games end a round sooner, never longer than the plan", () => {
  assert.match(game, /rounds: this\.sprout \? Math\.min\(3, planStep\?\.rounds \|\| 4\) : planStep\?\.rounds \|\| 4,/);
});

test("v58 First screens on a phone: the story card fills the middle; the place buttons fit a 300px screen", () => {
  const friends = read("styles/letters-friends.css");
  assert.match(friends, /@media \(orientation: portrait\) \{\n  \.lg-story \.sg-story \{ margin-block: auto; \}\n  \.lg-story \.sg-scene \{ aspect-ratio: 4 \/ 5; width: min\(100%, calc\(\(100dvh - 200px\) \* 4 \/ 5\)\); \}/, "every upright screen, phone or iPad");
  assert.match(friends, /\.sg-scene \{ container-type: inline-size; \}\n\.sg-friend svg \{ width: clamp\(56px, 13cqw, 116px\); height: auto; \}/, "friends are sized from the card");
  assert.match(friends, /@media \(orientation: landscape\) and \(min-height: 501px\) \{\n  \.lg-story \.sg-story \{ margin-block: auto; \}/, "a sideways iPad centres and grows the card");
  assert.match(friends, /\.sg-scene \{ max-width: none; width: auto; height: calc\(100dvh - 96px\); \}/, "a sideways phone keeps the card below the top bar");
  const map = read("styles/letters-map-world.css");
  assert.match(map, /@media\(max-width:340px\)\{\.lg-app \.lg-home \.map-play-places\{gap:8px\}/);
  assert.deepEqual(off(friends.slice(friends.indexOf("v58: on an upright screen"))), []);
});

test("v58 The proud pet smiles visibly: a filled beam and lifted brows, readable at phone size", () => {
  const art = read("src/letters/LettersArt.js");
  assert.match(art, /wide: `<path d="M-10 12 Q0 23 10 12 Q0 15\.8 -10 12 Z" fill="#8a3a2d"/);
  assert.match(art, /proud: +\{[^}]*browL: "M-19 -21 Q-12 -25 -5 -21\.5"/);
});

test("v58 The pet never side-eyes a choice: thinking looks up with a smile; listening smiles", () => {
  const art = read("src/letters/LettersArt.js");
  const faces = art.slice(art.indexOf("const FACE_STATES"), art.indexOf("const FACE_ALIAS"));
  assert.match(faces, /thinking: +\{ lid: null, +pd: \[-2\.6, -2\.4\], ps: 1\.06, mouth: "tiny"/);
  assert.match(faces, /listening: \{ lid: null, +pd: \[0, 0\], +ps: 1\.12, mouth: "hum"/);
  assert.doesNotMatch(faces, /halfL|"purse"/, "no half-lidded, pursed doubt face");
  assert.match(art, /hum: `<path d="M-5 13\.4 A 5 4\.4 0 0 0 5 13\.4 Z" fill="#8a3a2d"/);
});

test("v58 A miss gets a friendly 'hmm?': the curious face smiles, never an 'oh no' mouth", () => {
  const art = read("src/letters/LettersArt.js");
  const faces = art.slice(art.indexOf("const FACE_STATES"), art.indexOf("const FACE_ALIAS"));
  assert.match(faces, /curious: +\{ lid: null, +pd: \[2\.6, -1\.6\], +ps: 1, +mouth: "hmm"/);
  assert.match(art, /hmm: `<path d="M-3 13\.6 A 5\.2 4\.2 0 0 0 7\.4 13 Z" fill="#8a3a2d"/);
  assert.match(game, /wrong: "curious",/, "a wrong answer still maps to curious, never sad");
});

test("v58 One star never sits beside empty space: the star pill is centred and hugs its stars", () => {
  assert.match(read("styles/letters.css"), /\.stars-row, \.party-stars \{ display: flex; gap: 14px; justify-content: center; \}/);
  assert.match(read("styles/letters-journey.css"), /\.lg-boat-adventure :is\(\.stars-row,\.party-stars\) \{ grid-column:2; grid-row:2; justify-self:center; \}/);
});

test("v58 The chapter party celebrates the best moment, not the average; the map keeps the average", () => {
  assert.match(game, /s\.bestStars = Math\.max\(s\.bestStars \|\| 0, stars\);/);
  assert.match(game, /const partyStars = Math\.max\(worldStars, s\.bestStars \|\| 0\);/);
  assert.match(game, /this\.stars\[s\.world\.id\] = Math\.max\(this\.stars\[s\.world\.id\] \|\| 0, worldStars\);/, "the map plaque is still the honest average");
  assert.doesNotMatch(game, /renderParty\(worldStars/);
});

test("v58 Little Sprout's practice Feed is 3 rounds too, matching the chapter games", () => {
  assert.match(game, /garden:true,beginner:true,level:0,rounds:this\.sprout\?3:4,hue:150,/);
});

test("v58 Three answer tiles share one row on a 320px phone", () => {
  assert.match(read("styles/letters-friends.css"), /@media \(max-width: 360px\) \{ \.pz-board \{ gap: 8px; \} \.pz-tile \{ padding: 8px; \} \.pz-tile svg \{ width: min\(92px, 19vw\); \} \}/);
});

test("v58 A silent device never freezes a read-aloud sequence: unstarted speech gives up at 4.5s; the refrain caps each name", () => {
  const say = game.slice(game.indexOf("    sayForLearning(item) {"), game.indexOf("    prefersReducedMotion() {"));
  assert.match(say, /const silent = setTimeout\(\(\) => \{ if \(!started\) cancel\(\); \}, item\?\.audioPath \? 4500 : 2000\);/);
  assert.match(say, /utterance\.onstart = event => \{ started = true; clearTimeout\(silent\); start\?\.\(event\); \};/, "the original onstart still runs");
  assert.match(say, /clearTimeout\(timer\); clearTimeout\(silent\);/);
  assert.match(say, /const timer = setTimeout\(cancel, 6500\);/, "speech that started keeps its full time");
  assert.match(read("src/letters/BookGames.js"), /await Promise\.race\(\[this\.ctx\.say\?\.\(F\(\)\.item\(c\)\), new Promise\(\(ok\) => this\.later\(ok, 2000\)\)\]\);/);
});

test("v58 Enlarged games stay centred whichever way the engine scales a zoomed % width", () => {
  const fit = game.slice(game.indexOf("    fitStage(stage){"), game.indexOf("    gardenReward("));
  assert.match(fit, /if\(inner>0&&Math\.abs\(root\.getBoundingClientRect\(\)\.width-inner\)>4\)root\.style\.width='100%';/);
});

test("v58 A little sprout still gets confetti on the reward screens; a grown-up's own gentle choice keeps it off", () => {
  const conf = game.slice(game.indexOf("    confettiAt(el, golden) {"), game.indexOf("    activityMaterial() {"));
  assert.match(conf, /const calm = this\.gentle && !\(this\.sprout && !this\.loadJSON\("quran-trainer:letters:gentle", false\)\);/);
  assert.match(conf, /this\.prefersReducedMotion\(\) \|\| calm\) return;/, "reduced motion still wins");
});

test("v58 Dot Garden has no dead ends: exploring points the way on; three wrong checks place the dots", () => {
  const gp = read("src/letters/GardenPractice.js");
  assert.match(gp, /\.dot-explore-next'\)\?\.classList\.toggle\('is-hint',this\.exploreSeen\.size>=this\.exploreItems\.length\)/);
  assert.match(gp, /if\(\+\+this\.checkMisses>=3\)\{this\.above=targetSpec\.above\|\|0;this\.below=targetSpec\.below\|\|0;/);
  assert.match(gp, /this\.checkMisses=0;this\.history=\[\];/, "reset every round");
  const css = read("styles/letters-friends.css");
  assert.match(css, /\.lg-app \.dot-garden \.practice-tools \.practice-button\.is-hint \{ box-shadow: 0 4px 0 #b0501f, 0 0 0 5px #f3c955[^;]*!important;/);
  assert.match(css, /\.lg-app\.lg-reduce-motion \.dot-garden \.practice-tools \.practice-button\.is-hint \{ animation: none; \}/);
});

test("v58 The map's idle hand shows sooner for a newcomer and comes back once", () => {
  assert.match(game, /arm\(this\.progress\?\.done\?\.length \? 10000 : 5000, true\);/);
});

test("v58 A finished trace or a fed friend carries on when tapped again — never a dead pad", () => {
  const mg = read("src/letters/MiniGames.js");
  assert.match(mg, /this\.canvas\.parentElement\?\.addEventListener\?\.\("pointerdown", \(\) => \{ if \(this\.completionReady && Date\.now\(\) - \(this\.completedAt \|\| 0\) > 700\) this\.continueDrawing\(\); \}\);/);
  assert.match(mg, /e\.target\?\.closest\?\.\("\.feed-creature, \.feed-basket"\)\) this\.continueDelivery\(\);/);
});

test("v58 Today's Walk points a still child at the next stepping stone", () => {
  assert.match(game, /else if \(\/\\blg-walk\\b\/\.test\(className\)\) this\.idlePoint\(screenEl, 10000, "\.walk-stone\.is-next"\);/);
});

test("v58 Decorating points a still child at a decoration to pick up", () => {
  assert.match(game, /else if \(\/\\blg-my-garden\\b\/\.test\(className\)\) this\.idlePoint\(screenEl, 10000, "\.decorate-choice, \.decorate-earn"\);/);
});

test("v58 The wardrobe without a pet goes to hatching, never a broken room", () => {
  assert.match(game, /renderPet\(\) \{\n\s+\/\/ v58[^\n]*\n\s+if \(!this\.pet\) return this\.renderHatch\(\);/);
});

test("v58 An empty Friends' Garden plot is a waiting sprout, never a dark hole", () => {
  const sg = read("src/letters/StoryGarden.js");
  const burrow = sg.slice(sg.indexOf("const BURROW"), sg.indexOf("\n", sg.indexOf("const BURROW")));
  assert.match(burrow, /fill="#7fce54"/, "leaves");
  assert.doesNotMatch(burrow, /#2f5c46"\/>/, "no dark hole fill");
  assert.deepEqual(off(burrow), []);
});

test("v58 The book shelf sits in the middle of the screen", () => {
  assert.match(read("styles/letters-friends.css"), /\.lg-book-shelf \.lb-shelf \{ max-height: calc\(100dvh - 90px\); overflow-y: auto; overscroll-behavior: contain; margin-block: auto; \}/);
});

test("v58 Untried puzzles twinkle in the Puzzle Tree too (at most three)", () => {
  assert.match(game, /const fresh=kind=>!tried\.includes\(kind\)&&twinkles<3&&\+\+twinkles>0;/);
  assert.match(game, /\$\{fresh\(kind\)\?'<span class="pg-new" aria-hidden="true"><\/span>':''\}/);
});

test("v58 Untried books twinkle in the Book Corner (a read Living Book counts)", () => {
  assert.match(game, /const fresh=kind=>!tried\.includes\(kind\)&&!tried\.includes\(kind\.replace\(\/s\$\/,''\)\)&&twinkles<3&&\+\+twinkles>0;/);
});

test("v58 A few decorations sit centred in the tray (auto margins keep a full tray scrollable)", () => {
  assert.match(read("styles/letters-art-pass.css"), /\.decorate-tray>\.decorate-choice:first-child\{margin-inline-start:auto\}\.decorate-tray>\.decorate-choice:last-child\{margin-inline-end:auto\}/);
});

test("v58 The practice garden's group chips are never cropped by the scroll box", () => {
  assert.match(read("styles/letters-rooms.css"), /\.lg-app \.practice-garden-hub\{min-height:0;overflow-y:auto;padding:20px 4px 14px\}/);
});

test("v58 Bath Time's cover is a rounded cloud (bubble foam since 2026-10-13, was mud), not a striped square block", () => {
  const tb = read("src/letters/ToyBoxGames.js");
  assert.match(tb, /if \(\(\(x - 50\) \/ 66\) \*\* 2 \+ \(\(y - 49\) \/ 64\) \*\* 2 > 1\) continue;/);
  assert.match(tb, /fill="\$\{tint\}" stroke="#96ecff" stroke-width="1\.6"/);
  assert.match(tb, /const FOAM = \["#fffaf0", "#fffaf0", "#ccfbef", "#e6d6f0"\];/);
  assert.doesNotMatch(tb, /"#70501b" : "#a89478"/, "no brown mud");
  assert.match(tb, /aria-label="A friend hiding in the bubbles"/);
  assert.doesNotMatch(tb, /i % 5 \? "#a89478"/);
});

test("v58 Four peekaboo doors sit two-and-two, never three-and-one", () => {
  assert.match(read("styles/letters-friends.css"), /\.bk-hedge:has\(> :nth-child\(4\):last-child\) \{ display: grid; grid-template-columns: repeat\(2, auto\); justify-content: center; \}/);
});

test("v58 No peekaboo door looks like the odd one out", () => {
  const bk = read("src/letters/BookGames.js");
  assert.match(bk, /fill="\$\{\["#7fce54", "#b7e779"\]\[i % 2\]\}"/);
  assert.doesNotMatch(bk, /"#4e9677", "#7fce54"\]\[i % 4\]/);
});

test("v58 A short practice game sits in the middle of the stage (auto margins, never cropping a tall one)", () => {
  const css = read("styles/letters-friends.css");
  assert.match(css, /\.lg-app \.practice-stage:has\(> :is\(\.tb, \.pz, \.bk, \.sh, \.vh, \.ws, \.wd, \.ff\)\) \{ display: flex; flex-direction: column; \}/);
  assert.match(css, /\.lg-app \.practice-stage > :is\(\.tb, \.pz, \.bk, \.sh, \.vh, \.ws, \.wd, \.ff\) \{ margin-block: auto; flex-shrink: 0; \}/);
});

test("v58 Water Garden's three flowers are clearly different colours (no odd one out)", () => {
  const wg = read("src/letters/WaterGarden.js");
  assert.equal((wg.match(/\['#ee806f', '#f3c955', '#b49fcf'\]\[i\]/g) || []).length, 2);
  assert.doesNotMatch(wg, /'#ffa798'\]\[i\]/);
});

test("v58 Letter Hunt letters are 15% bigger on a landscape screen, except in snug hiding places", () => {
  const lh = read("src/letters/LetterHunt.js");
  assert.match(lh, /font-size="\$\{Math\.round\(t\.size \* \(t\.snug \? 1 : 1\.15\)\)\}"/);
  assert.match(lh, /label: \[0, 14\], size: 30, snug: true \}/, "the tree hollow");
  assert.match(lh, /label: \[0, 7\], size: 28, snug: true \}/, "the shell plate");
});

test("v58 The hatching egg is bigger on large screens", () => {
  assert.match(read("styles/letters-rooms.css"), /@media \(min-width: 700px\) and \(min-height: 620px\) \{ \.lg-app \.lg-hatch \.hatch-hero \{ zoom: 1\.3; \} \}/);
});

test("v58 The star chart's frame hugs its 2:3 sky; tall screens fit it, short ones scroll", () => {
  const css = read("styles/letters-rooms.css");
  assert.match(css, /\.star-chart\{width:min\(100%,520px\);aspect-ratio:2\/3;height:auto;flex-shrink:0;/);
  assert.match(css, /@media \(min-height: 600px\) \{ \.star-chart \{ width: min\(100%, 520px, calc\(\(100dvh - 190px\) \* 2 \/ 3\)\); \} \}/);
});

test("v58 At graduation the 28 friends gather below the Bismillah on big screens, bigger", () => {
  const css = read("styles/letters-friends.css");
  assert.match(css, /\.sg-grad \.sg-grad-friends \{ order: 3; \}/);
  assert.match(css, /\.sg-grad \.sg-grad-friends svg \{ width: 60px; height: auto; \}/);
});

test("v58 Star chart stars never touch: wider rings, more room for big families", () => {
  assert.match(game, /const span = Math\.PI \* \(1\.2 \+ big \* 0\.3\);/);
  assert.match(game, /const r = 92 \+ big \* 10 \+ \(\(i \* 37 \+ k \* 11\) % 23\);/);
});

test("v58 The wardrobe wears one thing per place: a new hat swaps the old one", () => {
  assert.match(read("src/letters/LettersAnimalArt.js"), /ns\.LettersAnimalArt=\{render:labPetMarkup,characters,catalog\};/);
  assert.match(game, /if \(slot\) for \(let i = wornList\.length - 1; i >= 0; i -= 1\) if \(slotOf\(wornList\[i\]\) === slot\) wornList\.splice\(i, 1\);/);
});

test("v58 A met letter's star is waking (a soft disc with its letter), never darker than an unmet one", () => {
  assert.match(game, /: `<circle r="22" fill="#e5dcc8" stroke="#a89478" stroke-width="1\.6"\/>\$\{\(\(\) => \{ const sh = Art\.inkShift \? Art\.inkShift\(l\.char, 30\)/);
  assert.doesNotMatch(game, /fill="#6064a0" stroke="#4a4d84" stroke-width="1\.6"\/>`\}<\/g>`/);
});

test("v58 Wardrobe previews show the pet delighted, readable at small size", () => {
  assert.match(game, /species: b\.id, stage: 1, size: 54, mood: 'open' \}\)/);
  assert.match(game, /worn: \[acc\.id\], size: 62, mood: 'open' \}\)/);
});

test("v58 On a sideways phone the map's place buttons never cover the daily strip", () => {
  const css = read("styles/letters-map-world.css");
  assert.match(css, /\.lg-app \.lg-screen\.lg-home \.map-play-places\{left:auto;right:112px\}/);
  assert.match(css, /@media\(min-width:540px\) and \(max-width:760px\) and \(max-height:500px\)\{\.lg-app \.lg-screen\.lg-home \.map-play-places\{gap:6px\}\.lg-app \.lg-screen\.lg-home \.map-play-places button\{width:64px\}\}/);
  assert.match(read("styles/letters-friends.css"), /\.lg-screen\.lg-home \.map-daily-row button \{ width: 56px !important;/, "the small-hands 56px minimum stays");
});

test("v58 After hatching on a sideways phone, the way into the garden is on screen", () => {
  const css = read("styles/letters-rooms.css");
  assert.match(css, /@media \(orientation: landscape\) and \(max-height: 500px\) \{\n  \.lg-app \.hatch-stage:has\(\.hatch-go\) \{ display: grid;/);
  assert.match(css, /\.hatch-stage:has\(\.hatch-go\) \.hatch-go \{ grid-column: 2;/);
});

test("v58 Friend shapes on a sideways phone: choices stay square and all three fit", () => {
  const css = read("styles/letters-landscape.css");
  assert.match(css, /\.bk-shapes \.bk-pieces \{ align-items: center; align-self: center; flex-wrap: wrap; \}/);
  assert.match(css, /\.bk-shapes \.bk-piece svg \{ width: min\(104px, 24vh, 10vw\); \}/);
});

test("v58 Letter Balloons: the letter is big in its balloon and auto-fitted to the disc", () => {
  const src = read("src/letters/LetterBalloons.js");
  assert.match(src, /<circle cx="50" cy="54" r="33" fill="#fffaf0" opacity="\.9"\/>/);
  assert.match(src, /<text data-fit-box="50,54,46,46,48" x="50" y="68" text-anchor="middle" font-family="'Amiri Quran', serif" font-size="48"/);
  assert.doesNotMatch(src, /font-size="34" fill="#4a3620"/);
});

test("v58 Letter Fishing: each fish owns a row no taller than itself, so fish never collide", () => {
  const css = read("styles/letters-toybox.css");
  assert.match(css, /\.tb-pond \{ container-type: size; \}/);
  assert.match(css, /\.tb-fish \{ --fh: min\(clamp\(64px, 17vw, 80px\), calc\(87cqh \/ var\(--n, 5\)\)\); --fw: calc\(var\(--fh\) \* 1\.65\);[^}]*top: calc\(11cqh \+ var\(--row, 0\) \* 87cqh \/ var\(--n, 5\)\);/);
  assert.match(css, /50% \{ left: calc\(98% - var\(--fw\)\); \}/);
  const toy = read("src/letters/ToyBoxGames.js");
  assert.match(toy, /<div class="tb-pond" style="--n:\$\{n\}">/);
  assert.match(toy, /style="--row:\$\{i\};--dur:/);
});

test("v58 Letter Balloons: lanes centred in thirds and balloons sized to them, so neighbours never overlap", () => {
  const css = read("styles/letters.css");
  assert.match(css, /\.balloons \{ container-type: size; \}\n\.balloon \{ --sw: min\(12px, 3cqw\); --bw: min\(96px, calc\(100cqw \/ 3 - 2 \* var\(--sw\) - 4px\)\);[^}]*width: var\(--bw\); height: calc\(var\(--bw\) \* 1\.4\);/);
  const src = read("src/letters/LetterBalloons.js");
  assert.match(src, /b\.style\.left = `calc\(\$\{\[16\.667, 50, 83\.333\]\[lane\]\}% - var\(--bw\) \/ 2\)`;/);
  assert.match(src, /"--sway", lane % 2 \? "var\(--sw\)" : "calc\(-1 \* var\(--sw\)\)"/);
});

test("v58 Letter Train balloons each own a share of the sky; Busy Market goods stay square", () => {
  const css = read("styles/letters-friends.css");
  assert.match(css, /\.pz-balloon \{ --bw: min\(80px, calc\(100% \/ var\(--n, 4\) - 8px\)\); position: absolute; left: calc\(\(var\(--i, 0\) \+ \.5\) \* 100% \/ var\(--n, 4\) - var\(--bw\) \/ 2\);/);
  assert.match(css, /\.pz-balloon-letter \{ position: absolute; left: 50%; top: 38%; width: 62%;/);
  assert.match(css, /\.pz-balloon \{ --bw: min\(clamp\(84px, 26vh, 110px\), calc\(100% \/ var\(--n, 4\) - 8px\)\); \}/);
  assert.doesNotMatch(css, /\.pz-balloon-letter svg \{ width: 60px; height: 60px; \}/);
  assert.match(read("src/letters/PuzzleGames.js"), /style="--i:\$\{i\};--n:\$\{balloons\.length\};--d:/);
  assert.match(css, /\.bk-good svg \{ display: block; width: 100%; height: 100%; \}/);
});

test("v58 Sideways phones: the market is visible, Home is clear of the letter pill, Delivery and Studio use the width", () => {
  const land = read("styles/letters-landscape.css");
  assert.match(land, /\.bk-scene \{ max-width: none; width: min\(100%, calc\(\(100vh - 40px\) \* 4 \/ 3\)\); aspect-ratio: 4 \/ 3; \}/);
  assert.match(land, /\.bk-market \{ grid-template-columns: 120px minmax\(0, 1fr\);/);
  assert.doesNotMatch(land, /height: calc\(100% - 120px\); aspect-ratio: 4 \/ 3/, "a % height of an unsized parent collapsed the market to 0×0");
  assert.match(read("styles/letters-drawing.css"), /> \.practice-heading \{\n    position: absolute;\n    top: 4px;\n    right: 64px;\n    left: 88px;/);
  assert.match(read("styles/letters-craft.css"), /\.practice-heading \{ position:absolute; top:4px; left:88px; right:64px;/);
  assert.match(land, /\.lg-app \.letter-delivery \{ display: grid; grid-template-columns: minmax\(0, 1fr\) auto;/);
  assert.match(land, /\.lg-app \.delivery-destination \{ width: min\(100%, 420px, calc\(\(100vh - 120px\) \* 1\.2\)\); \}/);
  assert.doesNotMatch(land, /\.delivery-scene \{ flex: 1 1 150px; min-height: 0; max-height: 190px; \}/);
  assert.match(land, /\.studio \{ grid-template-columns: minmax\(0, 1fr\) minmax\(0, 200px\);/);
});

test("v58 Garden Paths palette columns match the 52px reach minimum, so swatches never overlap", () => {
  const css = read("styles/letters-craft.css");
  assert.match(css, /drawing-palette \{ display:grid; grid-template-columns:repeat\(4,52px\);/);
  assert.match(css, /drawing-palette \{ grid-column:2; grid-row:1 \/ 4; display:grid; grid-template-columns:repeat\(2,52px\);/);
  assert.match(css, /\.lg-app \.garden-paths \{ grid-template-columns:minmax\(0,1fr\) 116px;/);
  assert.doesNotMatch(css, /drawing-palette \{[^}]*repeat\([24],44px\)/);
});

test("v58 Busy Market goes square on narrow portrait phones so shelf rows fit the 56px goods", () => {
  assert.match(read("styles/letters-friends.css"), /@media \(max-width: 480px\) and \(orientation: portrait\) \{ \.bk-scene \{ aspect-ratio: 1; \} \}/);
});

test("v58 Spot the Change always keeps a spare letter off the board, so it never ends at once", () => {
  const src = read("src/letters/LookGames.js");
  assert.match(src, /const n = Math\.min\(this\.ctx\.beginner \? 3 : this\.round < 2 \? 4 : 5, this\.known\.length - 1\);/);
});

test("v58 Asking to hear it again while muted points at the speaker at once", () => {
  assert.match(game, /if \(!e\.target\.closest\?\.\("\.practice-replay, \.play-bubble, \.delivery-listen, \[aria-label\^='Hear'\]"\)\) return;/);
  assert.match(game, /if \(!this\.prefersReducedMotion\(\)\) speaker\.animate\?\.\(/);
  assert.match(game, /this\.feel\.point\(speaker\);\n      \}\);/);
});

test("v58 A slow first visit shows the loading flower from the first paint, in palette pink", () => {
  const html = read("letters.html");
  assert.match(html, /<div id="letters-app" class="lg-app"><div class="lg-screen lg-loading" role="status" aria-label="Preparing your garden"><div class="loading-flower"><svg class="art-icon" viewBox="0 0 64 64"/);
  assert.match(read("styles/letters-art-pass.css"), /\.loading-flower\{[^}]*color:#ffa798\}/);
});

test("v58 A game that fails to build never strands a child on a half-made screen", () => {
  assert.match(game, /try \{ this\.game = new ns\.LettersMiniGames\[gameName\]\(ctx\); \}\n      catch \(error\) \{ console\.error\("Letter Garden: game failed to start", gameName, error\); this\.game = null; return ctx\.onDone\(0\); \}/);
  assert.match(game, /\}catch\(error\)\{console\.error\('Letter Garden: toy failed to start',kind,error\);this\.game=null;return \(onDone\|\|back\|\|\(\(\)=>this\.renderPracticeGarden\(\)\)\)\(\);\}/);
});

test("v58 Mid-game error safety net: two looks for a live touch, then carry the child on", () => {
  assert.match(game, /this\.initPlaytest\(\);\n      this\.initRescue\(\);/);
  assert.match(game, /if \(!second\) \{ pending = setTimeout\(\(\) => check\(true\), 3000\); return; \}/);
  assert.match(game, /window\.addEventListener\?\.\("unhandledrejection", onError\);/);
  assert.match(game, /this\.rescue = \{ stage, go: \(\) => ctx\.onDone\(0\) \};/);
  assert.match(game, /this\.rescue=\{stage:ctx\.stage,go:\(\)=>\(onDone\|\|back\|\|\(\(\)=>this\.renderPracticeGarden\(\)\)\)\(\)\};/);
});

test("v58 The wind story never shows an empty frame: the pet watches the gust", () => {
  assert.match(read("styles/letters-friends.css"), /\.sg-scene\.is-page-1 \.sg-pet, \.sg-scene\.is-page-2 \.sg-pet, \.sg-scene\.is-page-3 \.sg-pet \{ opacity: 1; \}/);
});

test("v58 Colour a Friend: colouring the letter itself is enough to hang the picture", () => {
  assert.match(read("src/letters/ToyBoxGames.js"), /if \(this\.named \|\| this\.coloured\.size >= Math\.min\(3, this\.parts\)\) this\.root\.querySelector\("\.tb-hang"\)\.hidden = false;/);
});

test("v58 Colour a Friend on a sideways phone: crayons in two rows of four, real finger targets", () => {
  assert.match(read("styles/letters-toybox.css"), /\.tb-colour \.tb-crayons \{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\); gap: 6px 10px; width: min\(100%, 300px\); justify-self: center; \}/);
});

test("v58 A finished chapter on the map always shows at least one earned star", () => {
  assert.match(read("src/letters/LettersArt.js"), /if \(status === "done" && !\(stars > 0\)\) stars = 1;\n    const shown = stars > 0 \? Math\.min\(3, stars\) : 3;/);
});

test("v58 A little sprout's nine toys fit one phone screen (no scroll for a toddler)", () => {
  assert.match(game, /this\.screen\(`lg-meet lg-practice-garden\$\{this\.sprout\?' is-sprout':''\}`/);
  const css = read("styles/letters-friends.css");
  assert.match(css, /\.lg-practice-garden\.is-sprout \.pg-group \.practice-garden-choices \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); gap: 8px; \}/);
  assert.match(css, /\.lg-practice-garden\.is-sprout \.pg-group:has\(\.practice-garden-choices > button:only-child\) \{ grid-column: auto; \}/);
});

test("v58 The Book Corner and Puzzle Tree keep all eight games on a phone screen", () => {
  assert.match(read("styles/letters-friends.css"), /\.lg-app :is\(\.lg-book-corner, \.lg-puzzle-tree\) \.practice-garden-choices \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); gap: 8px; \}/);
});

test("v58 Sideways phone: a sprout's toys and each hub's games all fit one screen", () => {
  const css = read("styles/letters-friends.css");
  assert.match(css, /\.lg-app :is\(\.lg-book-corner, \.lg-puzzle-tree\) \.practice-garden-choices \{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\); gap: 8px; width: min\(100%, 520px\); margin-inline: auto; \}/);
  assert.match(css, /\.lg-app \.lg-practice-garden\.is-sprout \.pg-group \.practice-garden-choices \{ display: grid; grid-auto-flow: column; grid-auto-columns: 84px;/);
});

test("v58 Upright iPad: a little sprout's nine toys fit one screen", () => {
  assert.match(read("styles/letters-friends.css"), /@media \(min-width: 481px\) and \(orientation: portrait\) \{\n  \.lg-app \.lg-practice-garden\.is-sprout \.practice-garden-hub \{ grid-template-columns: 1fr 1fr; gap: 12px; \}/);
});

test("v58 Siblings' unhatched eggs differ, and the egg a child picks is the one that hatches", () => {
  assert.match(read("src/letters/LettersArt.js"), /function egg\(\{ size = 150, cracks = 0, shell = \["#fffdf7", "#e5dcc8"\] \} = \{\}\)/);
  assert.match(game, /eggShell\(id = ns\.LettersState\?\.activeProfile\?\.\(\)\) \{/);
  assert.match(game, /Art\.egg\(\{ size: Math\.round\(size \* 0\.9\), shell: this\.eggShell\(id\) \}\)/);
  assert.match(game, /Art\.egg\(\{ size: 190, cracks, shell: this\.eggShell\(\) \}\)/);
  assert.match(game, /Art\.egg\(\{ size: 190, cracks: n, shell: this\.eggShell\(\) \}\)/);
});

test("v58 Feed on a short phone: seed packets big enough to read the word on them", () => {
  const css = read("styles/letters-picnic.css");
  assert.match(css, /\.feed-scene \{ grid-template-rows:minmax\(56px,1fr\) 70px 124px; gap:3px; padding:0 12px 12px; \}/);
  assert.match(css, /@media\(max-height:650px\) and \(orientation:portrait\) \{[\s\S]*?\.feed-food \{ width:auto; flex:1 1 66px; max-width:100px; \}/);
});

test("v58 Pairs on a short phone: two-pair boards get bigger cards, still clear of the pots", () => {
  const css = read("styles/letters-craft.css");
  assert.match(css, /\.pairs-grid\[data-pair-count="2"\] \{ inset:12px 14px 124px; \}/);
  assert.match(css, /\.pairs-grid\[data-pair-count="2"\] \.pairs-card \{ width:min\(100%,76px\); \}/);
});

test("v58 Word-workshop tiles carry a bigger letter, still fitted to the tile face", () => {
  assert.match(read("src/letters/MiniGames.js"), /function workshopTile\(display, material = "wood", maxSize = 54\) \{/);
});

test("v58 Answer-card words start bigger (gentler length scaling; ink fitting keeps them inside)", () => {
  assert.match(read("src/letters/MiniGames.js"), /len <= 2 \? maxSize \* 0\.95 : len <= 3 \? maxSize \* 0\.85 : maxSize \* 0\.78;/);
});

test("v58 Catch fruit carry a bigger letter on their plate", () => {
  assert.match(read("src/letters/MiniGames.js"), /\$\{glyphText\(display,\{maxSize:50,fill:'#4a3620'\}\)\}\n    <\/svg>`;/);
});

test("v58 Pictorial icons (map sun, flower, rewards star, album book) are drawn art, not one-colour glyphs", () => {
  const art = read("src/letters/LettersArt.js");
  assert.match(art, /function artIcon\(name, size = 30\)/);
  for (const n of ["sun", "flower", "star", "book", "paw", "calendar"]) assert.match(art, new RegExp(`\\n    ${n}: \``), n);
  assert.match(game, /class="map-daily\$\{stampedToday \? " is-stamped" : ""\}">\$\{\(Art\.artIcon\|\|Art\.icon\)\("sun", 38\)\}/);
  assert.match(game, /aria-label="Letter check-up">\$\{\(Art\.artIcon\|\|Art\.icon\)\("flower", 38\)\}/);
  assert.doesNotMatch(read("src/letters/LettersWorlds.js"), /📖|📗/, "chapter marks are drawn, never emoji");
});

test("v58 Art: every practice toy has its own picture; themed feed icons; keepsakes carry their chapter's tag", () => {
  const ga = read("src/letters/LettersGardenArt.js");
  assert.match(ga, /else if\(kind==='SpotChange'\)\{/);
  assert.match(ga, /else if\(kind==='FamilyBuses'\)\{/);
  const j = read("src/letters/LettersJourney.js");
  for (const k of ["jars: {", "parcel: {"]) assert.ok(j.includes(k), k);
  assert.match(j, /harvest: \{\n[\s\S]*?feed: '/);
  assert.match(j, /raft: \{\n      feed: '/);
  const dg = read("src/letters/DecoratingGarden.js");
  assert.match(dg, /if\(item\.kind==='keepsake'\)return keepsakeTag\(item,keepsakeArt\(item,size\)\);/);
  assert.match(read("src/letters/LettersWorlds.js"), /ns\.LettersWorldMarks = Object\.fromEntries\(this\.worlds\.map\(\(w\) => \[w\.id, w\.icon\]\)\);/);
});

test("v58 The pet's colours are drawn paint pots, coloured per hue", () => {
  assert.match(game, /pet-color-swatch is-pot\$\{this\.pet\.hue===h\?' is-picked':''\}" data-pet-hue="\$\{h\}"[^>]*>\$\{PAINT_POT\}<\/button>/);
  assert.match(read("styles/letters-rooms.css"), /\.pet-color-swatch\.is-pot\{[^}]*color:hsl\(var\(--h\) 72% 62%\)/);
});

test("v58 Today's Walk ends at a drawn nap bed, and the napping pet lies on it", () => {
  assert.match(game, /<span class="walk-end" style="left:\$\{nap\.x\}%;top:\$\{nap\.y\}%" aria-hidden="true">\$\{NAP_BED\}<\/span>/);
  assert.match(read("styles/letters-friends.css"), /\.walk-pet\.walk-nap \{ transform: translate\(-56%, -104%\); \}/);
});

test("v58 The Friends' Garden is a garden: a fence, grass in the bed, friends on their own mounds", () => {
  const sg = read("src/letters/StoryGarden.js");
  assert.match(sg, /<div class="sg-fence" aria-hidden="true"><\/div>\n        <div class="sg-plots">/);
  assert.match(sg, /class="sg-plot is-home" data-char="\$\{c\}" aria-label="\$\{F\(\)\.get\(c\)\.en\}"><span class="sg-mound" aria-hidden="true">\$\{MOUND\}<\/span>/);
  assert.match(read("styles/letters-friends.css"), /\.lg-friends-garden \.sg-fence \{/);
});

test("v58 The book shelf is a real bookcase: cabinet behind, a plank under every row", () => {
  const css = read("styles/letters-friends.css");
  assert.match(css, /\.lg-book-shelf \.lb-shelf \{ max-width: 760px;[^}]*background: #a89478;/);
  assert.match(css, /\.lg-book-shelf \.lb-spine::after \{ content: ""; position: absolute;[^}]*background: #c69434;/);
});

test("v58 The Puzzle Tree hub is a tree: canopy behind the games, a trunk below", () => {
  const css = read("styles/letters-friends.css");
  assert.match(css, /\.lg-puzzle-tree \.practice-garden-choices \{ position: relative; isolation: isolate;[^}]*background:/);
  assert.match(css, /\.lg-puzzle-tree \.practice-garden-choices::after \{ content: ""; position: absolute; left: 50%; bottom: -62px;/);
});

test("v58 The Book Corner hub sits on a giant open picture book with a ribbon", () => {
  const css = read("styles/letters-friends.css");
  assert.match(css, /\.lg-book-corner \.practice-garden-choices \{ position: relative; isolation: isolate;[^}]*background:/);
  assert.match(css, /\.lg-book-corner \.practice-garden-choices::after \{ content: ""; position: absolute; right: 22%;/);
});

test("v58 Word Workshop: chapters on a wooden workbench; the word chapters show the drawn book", () => {
  assert.match(game, /\(Art\.artIcon\|\|Art\.icon\)\(world\.icon==='art:books'\?'star':'book',54\)/);
  const css = read("styles/letters-friends.css");
  assert.match(css, /\.workshop-chapters \{ position: relative; isolation: isolate;[^}]*background:/);
  assert.match(css, /\.workshop-chapters::after \{ content: ""; position: absolute; left: 0; right: 0; bottom: -44px;/);
});

test("v58 Stamps: a played day grows a drawn flower in the calendar", () => {
  assert.match(game, /\$\{stamped\.has\(day\) \? \(Art\.artIcon\|\|Art\.icon\)\("flower", 30\) : `<i>\$\{day\}<\/i>`\}/);
  assert.match(read("styles/letters.css"), /\.stamp-cell\.is-stamped svg:not\(\.art-icon\) path \{/);
});

test("v58 The ayah rests on a drawn wooden rehal", () => {
  assert.match(read("styles/letters-rooms.css"), /\.lg-ayah-garden \.ayah-words::after \{ content: ""; position: absolute; left: 50%; bottom: -60px;[^}]*background: url\("data:image\/svg\+xml,/);
});

test("v58 The practice garden's toy groups are raised wooden beds with soil", () => {
  const css = read("styles/letters-friends.css");
  assert.match(css, /\.lg-practice-garden \.pg-group \{ border-radius: 22px; padding-bottom: 26px; box-shadow: inset 0 0 0 4px #c69434, inset 0 0 0 7px #4a3620/);
  assert.match(css, /\.lg-practice-garden \.pg-group::after \{ content: ""; position: absolute;[^}]*#a89478; pointer-events: none; \}/);
});

test("2026-10-13 first look: the hatched pet sits in its own shell", () => {
  const art = read("src/letters/LettersArt.js");
  assert.match(art, /function eggShells\(\{ shell = \["#fffdf7", "#e5dcc8"\] \} = \{\}\)/);
  assert.match(art, /pet, egg, eggShells, sticker,/);
  assert.deepEqual(off(art.slice(art.indexOf("function eggShells"), art.indexOf("// ---------- the skill flower"))), []);
  assert.match(game, /<div class="hatch-pet-spot\$\{this\.hatchWoke/);
  assert.match(game, /<span class="hatch-shell-cup" aria-hidden="true">\$\{Art\.eggShells\(\{ shell: this\.eggShell\(\) \}\)\.cup\}<\/span>/, "the shell is the child's own egg colour");
  assert.match(read("styles/letters-rooms.css"), /\.lg-app \.hatch-shell-cup, \.lg-app \.hatch-shell-cap, \.lg-app \.hatch-shell-flecks \{ position: absolute; pointer-events: none;/);
});

test("2026-10-13 first look: a free stand visit is a drawn present; the sky's sleeping stars have faces", () => {
  const art = read("src/letters/LettersArt.js");
  assert.match(art, /gift: `<ellipse cx="32" cy="59"/);
  assert.match(game, /<span class="stand-gift" aria-hidden="true">\$\{\(Art\.artIcon\|\|Art\.icon\)\("gift", 44\)\}<\/span>/);
  assert.match(game, /\$\{free \? \(Art\.artIcon\|\|Art\.icon\)\("gift", 30\) :/);
  assert.match(game, /<path class="chart-eyes-shut" d="M-7 2Q-4\.5 5-2 2M2 2Q4\.5 5 7 2"/);
  assert.match(game, /star\._doze = setTimeout\(\(\) => star\.classList\.remove\("is-twinkle"\), 1300\);/, "a peeking star dozes off again");
  assert.deepEqual(off(game.slice(game.indexOf("if (st === \"unseen\")"), game.indexOf("const idx = items.push"))), []);
});

test("2026-10-13 first look: a hatched child's garden starts with their own egg shell, and the pet sits in it", () => {
  const vm = require("node:vm");
  const window = { MiftahGame: {} };
  vm.runInContext(read("src/letters/LettersDecorations.js"), vm.createContext({ window }));
  const { catalog } = window.MiftahGame.LettersDecorations;
  assert.equal(JSON.stringify(catalog({}).map(i => i.id)), "[]", "no pet yet (still an egg): nothing");
  const items = catalog({ pet: { hue: 200 }, eggShell: () => ["#ffe49a", "#f3c955"] });
  assert.equal(JSON.stringify(items.map(i => i.id)), '["shell"]');
  assert.equal(JSON.stringify(items[0].shell), '["#ffe49a","#f3c955"]', "in the child's own egg colours");
  assert.equal(catalog({ pet: { hue: 200 }, eggShell: () => { throw new Error("x"); } })[0].id, "shell", "a broken colour lookup still gives the shell");
  const dg = read("src/letters/DecoratingGarden.js");
  assert.match(dg, /if\(item\.kind==='shell'\)\{\n\s+this\.ctx\.play\?\.\('crack'\);/);
  assert.match(dg, /front\.className='decorate-shell-front'/);
  assert.match(dg, /\.join\(''\)\+\(this\.catalog\.every\(item=>item\.kind==='shell'\)\?`<button type="button" class="decorate-earn"/, "with only the shell, the way to grow more still shows");
  assert.match(dg, /querySelectorAll\('\.decorate-drops,\.decorate-shell-front'\)\.forEach\(el=>el\.remove\(\)\)/, "the front leaves with the pet");
  assert.deepEqual(off(dg.slice(dg.indexOf("if(item.kind==='shell'){"), dg.indexOf("if(item.kind==='sticker')"))), []);
});

test("2026-10-13 a quiet map lets the pet doze; any touch wakes it with a stretch and a cheer", () => {
  const rig = read("src/letters/LettersPetRig.js");
  assert.match(rig, /doze\(\) \{ look = reach = null; walking = null; start\('doze', Infinity\); \},/);
  assert.match(rig, /else if \(act\?\.kind === 'doze'\) blink = 0\.08;/, "eyes shut while dozing");
  assert.match(rig, /g\.sq = still \? 1 : 0\.975/, "no breathing motion under reduced motion");
  assert.match(game, /if \(walker\.classList\.contains\("is-dozing"\)\) \{ walker\.classList\.remove\("is-dozing"\); mapRig\.wake\(\(\) => mapRig\.cheer\(\)\); \}/);
  assert.match(game, /\}, 40000\);/);
  const css = read("styles/letters-map-world.css");
  assert.match(css, /\.lg-home \.map-here\.is-dozing::after\{content:"z z";/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\{\.lg-home \.map-here\.is-dozing::after\{animation:none\}\}/);
  assert.deepEqual(off(css), []);
});

test("2026-10-13 a place not open yet is a seedling growing, in full colour — not a faded button", () => {
  assert.match(read("src/letters/LettersArt.js"), /sprout: `<ellipse cx="32" cy="59" rx="18"/);
  assert.match(game, /class="map-practice-garden\$\{open \? '' : ' is-growing'\}"/);
  assert.match(game, /\$\{open \? Art\.icon\('next',20\) : `<span class="mpg-sprout" aria-hidden="true">\$\{\(Art\.artIcon\|\|Art\.icon\)\('sprout',30\)\}<\/span>`\}/);
  assert.match(game, /if\(btn\.getAttribute\("aria-disabled"\)!=="true"\)return this\.renderPracticeGarden\(\);/, "still answers a tap with the hand");
  const css = read("styles/letters-map-world.css");
  assert.match(css, /\.lg-app \.map-practice-garden\.is-growing\{opacity:1;cursor:pointer;gap:6px\}/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\{\.lg-app \.map-practice-garden\.is-growing\.is-soon \.mpg-sprout\{animation:none\}\}/);
  assert.deepEqual(off(css), []);
  assert.deepEqual(off(read("src/letters/LettersArt.js").match(/sprout: `[\s\S]*?`,/)[0]), []);
});

test("2026-10-13 party friends are bigger on phones, sized so five always fit", () => {
  assert.match(read("styles/letters-friends.css"), /@media \(max-width: 440px\) \{ \.party-friends \{ flex-wrap: nowrap; gap: 2px; \} \.party-friend \{ width: min\(66px, calc\(\(100vw - 44px\) \/ 5\)\); height: min\(66px, calc\(\(100vw - 44px\) \/ 5\)\); \}/);
});

test("2026-10-13 the first hatch: the pet wears its shell top as a hat until it tumbles off (still under reduced motion)", () => {
  assert.match(game, /<div class="hatch-pet-spot\$\{this\.hatchWoke \? "" : " is-fresh"\}">/, "only the very first time");
  const css = read("styles/letters-rooms.css");
  assert.match(css, /\.lg-app \.hatch-pet-spot\.is-fresh \.hatch-shell-cap \{ z-index: 3; animation: hatch-cap-tumble 1\.9s/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.lg-app \.hatch-pet-spot\.is-fresh \.hatch-shell-cap, \.lg-app \.hatch-pet-spot\.is-fresh \.hatch-shell-cap ellipse \{ animation: none; \} \}/);
  assert.match(css, /\.lg-app\.lg-reduce-motion \.hatch-pet-spot\.is-fresh \.hatch-shell-cap, \.lg-app\.lg-reduce-motion \.hatch-pet-spot\.is-fresh \.hatch-shell-cap ellipse \{ animation: none; \}/);
  assert.deepEqual(off(css), []);
});

test("2026-10-13 tricks still growing are planted seeds in their family's colour; a tap wiggles one and the pet is curious", () => {
  const room = read("src/letters/LettersRoomArt.js");
  assert.match(room, /const trick=\(id,seedFill\)=>/);
  assert.deepEqual(off(room.match(/const plantedSeed=[^\n]*/)[0]), []);
  assert.match(game, /ns\.LettersRoomArt\.trick\(known\?tr\.id:'seed',SEED_TINT\[tr\.family\]\)/);
  assert.deepEqual(off(game.match(/const SEED_TINT = [^\n]*/)[0]), []);
  assert.match(game, /if \(button\.classList\.contains\("is-seed"\)\) \{ button\.classList\.remove\("is-soon"\); void button\.offsetWidth; button\.classList\.add\("is-soon"\); this\.sound\.play\("seed"\); rig\?\.ponder\?\.\(\); return; \}/);
  assert.match(read("styles/letters-rooms.css"), /\.pet-trick\.is-seed\{border-color:#a89478;background:#fffaf0;box-shadow:0 3px 0 #c9bda4\}/);
});

test("2026-10-13 Friends' Garden: each waiting plot has a wooden label with its friend's letter", () => {
  const sg = read("src/letters/StoryGarden.js");
  assert.match(sg, /aria-label="On the way home">\$\{BURROW\}<span class="sg-label" aria-hidden="true">\$\{plotLabel\(c\)\}<\/span><\/button>/);
  assert.deepEqual(off(sg.match(/const plotLabel = [^\n]*/)[0]), []);
  const css = read("styles/letters-friends.css");
  assert.match(css, /\.sg-plot \.sg-label \{ position: absolute;[^}]*pointer-events: none;/);
  assert.match(css, /0 0 \/ 180px 140px round, #b7e779; \}/, "the field pattern repeats whole, no half-cut flowers at the edge");
});

test("2026-10-13 a chapter left half-way shows a gold arc of how far the child got", () => {
  const art = read("src/letters/LettersArt.js");
  assert.match(art, /function mapStop\(\{ hue, label, status, stars = 0, latin = false, partway = 0 \}\)/);
  assert.match(art, /!locked && partway > 0 && partway < 1/);
  assert.match(game, /partway: status === "current" \? this\.partwayOf\(world\) : 0/);
  assert.match(game, /return n && place\.gameIndex > 0 && place\.gameIndex < n \? place\.gameIndex \/ n : 0;/);
  const vm = require("node:vm");
  const window = { MiftahGame: {} };
  const ctx = vm.createContext({ window, document: { createElement: () => ({ getContext: () => null }) }, Math, String, Number, Array, Object, JSON, Set, Map });
  vm.runInContext(art, ctx);
  const A = window.MiftahGame.LettersArt;
  {
    assert.match(A.mapStop({ hue: 200, label: "ب", status: "current", partway: 2 / 3 }), /stroke-dasharray="67 100"/);
    assert.doesNotMatch(A.mapStop({ hue: 200, label: "ب", status: "current" }), /map-stop-partway/);
    assert.doesNotMatch(A.mapStop({ hue: 200, label: "ب", status: "locked", partway: 0.5 }), /map-stop-partway/);
  }
});

test("2026-10-13 wardrobe prices show a gold bar filling toward them; a price in reach turns gold", () => {
  assert.equal((game.match(/\$\{owned \? "" : this\.costTag\((b|acc)\.cost\)\}/g) || []).length, 2);
  assert.match(game, /const fill = Math\.max\(0, Math\.min\(1, have \/ Math\.max\(1, cost\)\)\);/);
  assert.match(game, /\$\{ready \? "" : `<span class="pet-acc-fill" aria-hidden="true"><i style="width:\$\{Math\.round\(fill \* 100\)\}%"><\/i><\/span>`\}/);
  const css = read("styles/letters-rooms.css");
  assert.match(css, /\.pet-room \.pet-acc \.pet-acc-cost\.is-ready\{background:#ffe49a;/);
  assert.deepEqual(off(css), []);
});

test("2026-10-13 the reward screens' pet beams (open grin) after every game, not only the last", () => {
  assert.match(game, /pet: this\.petSVG\(150, 'delighted'\),/);
  assert.match(game, /reward-friend" aria-hidden="true">\$\{this\.petSVG\(150,'delighted'\)\}<\/div>/);
  assert.doesNotMatch(game, /completed === 3 \? 'delighted' : 'proud'/);
});

test("2026-10-13 sideways album: tabs and stall on the left, the collection fills the right and scrolls in place", () => {
  const css = read("styles/letters-rooms.css");
  const block = css.slice(css.indexOf("/* 2026-10-13: on a sideways phone the album stacked"));
  assert.match(block, /@media \(max-height: 450px\) and \(orientation: landscape\) \{/);
  assert.match(block, /\.lg-app \.lg-album \.album-stage \{ display: grid; grid-template-columns: auto minmax\(0, 1fr\);/);
  assert.match(block, /\.lg-app \.lg-album \.album-stage > :not\(\.album-tabs\):not\(\.album-supply\) \{ grid-column: 2; grid-row: 1 \/ 3; max-height: 100%; overflow-y: auto;/);
  assert.match(block, /\.album-grid \{ grid-auto-rows: max-content; align-content: start; \}/, "rows keep their size instead of squashing");
});

test("2026-10-13 empty garden spaces are dug-soil patches; the dashed ring shows only where something can go", () => {
  const dg = read("src/letters/DecoratingGarden.js");
  assert.match(dg, /const plus = '<svg class="decorate-soil" viewBox="0 0 100 100"/);
  assert.deepEqual(off(dg.match(/const plus = '[^\n]*/)[0]), []);
  const css = read("styles/letters-art-pass.css");
  assert.match(css, /\.decorate-slot:not\(\.is-filled\)\{border-color:transparent;background:none\}/);
  assert.match(css, /\.decorate-slot:not\(\.is-filled\)\.is-target\{border-color:#4e9677;/);
});

test("2026-10-13 who's playing: each pet stands on a sized floor spot, not an unsized grey block", () => {
  assert.match(read("styles/letters.css"), /\.who-pet \{[^}]*background: radial-gradient\(ellipse 34% 7% at 50% 90%, #c9bda4 0 96%, transparent 100%\), #fffaf0;/);
});

test("2026-10-13 sideways ayah garden: the play button and arrows stand beside the verse, on screen", () => {
  const css = read("styles/letters-rooms.css");
  const block = css.slice(css.indexOf("/* 2026-10-13: on a sideways phone the ayah's play button"));
  assert.match(block, /\.lg-ayah-garden \.ayah-controls \{ grid-column: 2; grid-row: 1 \/ 4; flex-direction: column;/);
  assert.match(block, /\.lg-ayah-garden \.ayah-words::after \{ display: none; \}/);
});

test("2026-10-13 graduation: the ending (keepsake + way back) appears on screen on phones, upright or sideways", () => {
  const css = read("styles/letters-friends.css");
  assert.match(css, /@media \(max-height: 760px\) \{\n  \.sg-grad:has\(\.sg-grad-end:not\(\[hidden\]\)\) \.sg-grad-pet \{ display: none; \}/);
  assert.match(css, /\.sg-grad \.sg-grad-end \{ grid-column: 2; grid-row: 2; \}/);
  assert.match(css, /@media \(max-width: 340px\) \{ \.sg-grad \.sg-grad-friends svg \{ width: 36px !important;/);
  assert.match(read("src/letters/StoryGarden.js"), /el\.querySelector\("\.sg-grad-end"\)\.scrollIntoView\?\.\(\{ block: "nearest"/);
});

test("2026-10-13 bigger tap targets: Letter Hunt spots get an invisible pad; the pet-room toys a wider tap ring", () => {
  const hunt = read("src/letters/LetterHunt.js");
  assert.match(hunt, /const pad = \(t\) => `<circle class="hunt-pad" cx="\$\{t\.label\[0\]\}" cy="\$\{t\.label\[1\]\}" r="60" fill="#fffaf0" fill-opacity="0"\/>`;/);
  assert.equal((hunt.match(/\$\{pad\(t\)\}<g class="hunt-thing">/g) || []).length, 2, "portrait and landscape pictures");
  // No two pads may overlap in any land: centres at least 120 units apart.
  const lands = [...hunt.matchAll(/spots: (\[\[[^\n]*?\]\]) \}/g)].map(m => JSON.parse(m[1].replace(/"/g, '"')));
  assert.ok(lands.length >= 6);
  for (const spots of lands) for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) assert.ok(Math.hypot(spots[i][0] - spots[j][0], spots[i][1] - spots[j][1]) >= 120);
  assert.match(read("styles/letters-rooms.css"), /\.lg-app \.pet-room \.room-toy::before\{content:"";position:absolute;inset:-8px;/);
});

test("2026-10-16 practice pays: each toy's first finish of the day earns one star, five a day at most", () => {
  assert.match(game, /if\(!Array\.isArray\(log\.kinds\)\|\|log\.kinds\.includes\(kind\)\|\|log\.kinds\.length>=5\)return false;/);
  assert.match(game, /this\.finishBloom\(el,go,friend,this\.payPractice\(kind\)\);/);
  assert.match(game, /\$\{paid\?`<span class="pg-bloom-star">/);
  // Behaviour, with a tiny fake game:
  const body = game.slice(game.indexOf("    payPractice(kind){"), game.indexOf("    finishBloom(el,go,friend,paid=false){"));
  const store = {}; let earned = 0;
  const fake = { loadJSON: (k, d) => store[k] ?? d, saveJSON: (k, v) => { store[k] = JSON.parse(JSON.stringify(v)); }, earnStars: (n) => { earned += n; } };
  const todayStr = () => "2026-10-16";
  const pay = new Function("todayStr", `return function(kind){${body.replace(/^ *payPractice\(kind\)\{/, "").replace(/\}\s*$/, "")}}`)(todayStr);
  assert.equal(pay.call(fake, "Feed"), true);
  assert.equal(pay.call(fake, "Feed"), false, "the same toy again today pays nothing");
  for (const k of ["A", "B", "C", "D"]) pay.call(fake, k);
  assert.equal(pay.call(fake, "E"), false, "five a day");
  assert.equal(earned, 5);
});

test("2026-10-16 daily treasures: one find waits on the map each new play day; tapping it fills the album's nature shelf", () => {
  const room = read("src/letters/LettersRoomArt.js");
  assert.match(room, /ns\.LettersRoomArt=\{[^}]*treasure,TREASURE_IDS,SPECIAL_IDS\};/);
  assert.deepEqual(off(room.slice(room.indexOf("const TREASURES={"), room.indexOf("const TREASURE_IDS="))), []);
  assert.match(game, /const FINDS_KEY = "quran-trainer:letters:finds";/);
  assert.match(game, /if \(!this\.pet \|\| !ids\.length \|\| f\.day === today\) return null;/, "one a day, only after hatching");
  assert.match(game, /class="map-find" data-find="\$\{find\}"/);
  assert.match(game, /f\.day = todayStr\(\); f\.pending = null;/);
  assert.match(game, /if \(!tabs \|\| !f\.owned\.length \|\|/, "the shelf tab appears only once something is found");
  assert.doesNotMatch(game.slice(game.indexOf("// ---------- Daily treasures"), game.indexOf("// 2026-10-13: a price a pre-reader")).replace(/\/\/[^\n]*/g, ""), /streak|missed|spendStars/i, "no streaks, no counting missed days, nothing to buy");
  const css = read("styles/letters-map-world.css");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\{\.lg-home \.map-find,\.lg-home \.map-find \.map-find-glint\{animation:none\}\}/);
});

test("2026-10-16 growing up: a chapter that grows the pet ends in a ceremony, once per stage (still under reduced motion)", () => {
  assert.match(game, /const STAGE_SEEN_KEY = "quran-trainer:letters:pet-stage-seen";/);
  assert.match(game, /if \(this\.petStage\(\) > this\.stageSeen\(\)\) return this\.renderGrowUp\(\);/);
  assert.match(game, /this\.saveJSON\(STAGE_SEEN_KEY, to\);/, "each stage is celebrated once");
  assert.match(game, /if \(still\) reveal\(\);/);
  const css = read("styles/letters-rooms.css");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.lg-app \.grow-old \{ display: none; \} \.lg-app \.grow-new, \.lg-app \.grow-spark \{ animation: none; \} \}/);
  assert.deepEqual(off(css), []);
});

test("2026-10-16 treasures: a full set gets gold trim and opens a golden set; the map pet is bigger and lives between taps", () => {
  assert.match(game, /return base\.every\(\(id\) => owned\.includes\(id\)\) \? \[\.\.\.base, \.\.\.base\.map\(\(id\) => `gold:\$\{id\}`\)\] : base;/);
  assert.match(game, /this\.sound\.play\(setDone \? "fanfare" : "chime"\);/);
  assert.match(read("src/letters/LettersRoomArt.js"), /const gold=String\(id\)\.startsWith\('gold:'\)/);
  assert.match(read("styles/letters-rooms.css"), /\.lg-app \.lg-finds \.finds-shelf\.is-complete\{border-color:#c69434;/);
  assert.match(game, /if \(!travel && !mapRig\.dozing && !walker\.classList\.contains\("is-dozing"\)\) \{/, "idle life never interrupts walking or a nap");
  assert.match(read("styles/letters-map-world.css"), /\.lg-home \.map-here \.art-pet, \.lg-home \.map-here > svg \{ width: 88px; height: auto; \}/);
});

test("2026-10-16 a met letter friend visits the latest finished stop each day; a tap dances it and says its name", () => {
  assert.match(game, /return \{ c: met\[day % met\.length\], i: Math\.max\(\.\.\.doneIdx\) \};/);
  assert.match(game, /class="map-visitor" data-c="\$\{visitor\.c\}"/);
  assert.match(game, /v\.addEventListener\("click", \(\) => \{ if \(!el\.isConnected\) return; dance\(\); this\.sound\.play\(F\.get\(c\)\.call\);/);
  assert.deepEqual(off(read("styles/letters-map-world.css")), []);
});

test("2026-10-16 focal colour: the next stop is the boldest on the map; the open album page is a gold tab", () => {
  assert.match(read("src/letters/LettersArt.js"), /status === "current" \? `hsl\(\$\{hue\} 68% 56%\)`/);
  assert.match(read("src/letters/LettersArt.js"), /const insetColor = status === "done" \? "#fffaf0" : status === "current" \? "#fffdf7"/);
  assert.match(read("styles/letters-rooms.css"), /\.album-tab\.is-on\{background:#ffe49a;/);
});

test("2026-10-16 focal colour: a keepsake waiting to be placed is a gold tile", () => {
  assert.match(read("styles/letters-art-pass.css"), /\.decorate-choice:not\(\.is-placed\):not\(\[aria-pressed="true"\]\)\{background:#ffe49a88;border-color:#f3c955\}/);
});

test("2026-10-16 tomorrow's bud: after today's find, a sleeping bud promises the next one (no count, no pressure)", () => {
  assert.match(game, /const bud = !find && this\.pet && \(\(\) => \{ const f = this\.findsState\(\); return f\.day === todayStr\(\) && this\.treasureIds\(\)\.some\(\(id\) => !f\.owned\.includes\(id\)\); \}\)\(\);/);
  assert.match(game, /class="map-bud" aria-label="Something is growing for tomorrow"/);
  assert.deepEqual(off(game.match(/const TOMORROW_BUD = `[^`]*`/)[0]), []);
  assert.match(read("styles/letters-map-world.css"), /@media \(prefers-reduced-motion: reduce\)\{\.lg-home \.map-bud svg path:last-child\{animation:none\}\}/);
});

test("2026-10-16 now and then a balloon brings a met friend across the map; nothing to collect; off under reduced motion", () => {
  assert.match(game, /if \(met\.length && !this\.prefersReducedMotion\(\) && Math\.random\(\) < 0\.25/);
  assert.match(game, /b\.className = "map-balloon";/);
  assert.deepEqual(off(game.match(/const BALLOON = `[^`]*`/)[0]), []);
  const css = read("styles/letters-map-world.css");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\{\.lg-home \.map-balloon\{display:none\}\}/);
  assert.match(css, /\.lg-home \.map-balloon\{position:absolute;z-index:6;top:230px;/, "below the header's buttons");
});

test("2026-10-16 treasures found can be placed in My garden", () => {
  const vm = require("node:vm");
  const window = { MiftahGame: {} };
  vm.runInContext(read("src/letters/LettersDecorations.js"), vm.createContext({ window }));
  const items = window.MiftahGame.LettersDecorations.catalog({ findsOwned: ["mushroom", "gold:shell"] });
  assert.equal(JSON.stringify(items.map(i => i.id)), '["find:mushroom","find:gold:shell"]');
  assert.match(read("src/letters/DecoratingGarden.js"), /if\(item\.kind==='treasure'\)return ns\.LettersRoomArt\?\.treasure\?\.\(item\.find,size\)\|\|'';/);
  assert.match(game, /findsOwned:this\.findsState\(\)\.owned\}\),/);
});

test("2026-10-16 My garden grows with the pet: 4, then 6, then 8 spaces; old 4-space layouts stay valid", () => {
  const vm = require("node:vm");
  const window = { MiftahGame: {} };
  vm.runInContext(read("src/letters/LettersDecorations.js"), vm.createContext({ window }));
  const D = window.MiftahGame.LettersDecorations;
  assert.equal(D.size, 4);
  assert.equal(D.normalize({ slots: ["a", "b"] }).slots.length, 4);
  D.setSize(8);
  assert.equal(D.normalize({ slots: ["a", "b", null, "c"] }).slots.length, 8, "an old layout keeps its things and gains spaces");
  assert.equal(D.normalize({ slots: ["a", "b", null, "c"] }).slots[3], "c");
  assert.notEqual(D.place({ slots: [] }, 7, "x", [{ id: "x" }]), null, "space 8 is usable");
  assert.equal(D.setSize(20), 8);
  D.setSize(4);
  assert.match(game, /ns\.LettersDecorations\.setSize\?\.\(2 \+ this\.petStage\(\) \* 2\);/);
  assert.match(read("styles/letters-art-pass.css"), /\.decorate-board\[data-spaces="8"\] \.decorate-slot\{width:clamp\(56px,18%,96px\)\}/);
});

test("2026-10-16 growing up shows the garden grew too, and leads straight to it", () => {
  assert.match(game, /<button type="button" class="grow-garden" aria-label="Your garden grew: two new spaces"/);
  assert.match(game, /el\.querySelector\("\.grow-garden"\)\.addEventListener\("click", \(\) => \{ if \(!el\.isConnected\) return; this\.sound\.play\("page"\); this\.renderDecoratingGarden\(\); \}\);/);
  assert.deepEqual(off(game.match(/const GROWN_GARDEN = [^\n]*\n[^\n]*/)[0]), []);
  assert.match(read("styles/letters-rooms.css"), /@media \(prefers-reduced-motion: reduce\) \{ \.lg-app \.grow-garden \{ animation: none; \} \}/);
});

test("2026-10-16 special-day finds: a fanous in Ramadan, a crescent on Eid; outside the daily pool; their own shelf", () => {
  const room = read("src/letters/LettersRoomArt.js");
  assert.match(room, /const SPECIAL_IDS=\['fanous','crescent'\];/);
  assert.match(room, /const TREASURE_IDS=Object\.keys\(TREASURES\)\.filter\(id=>!SPECIAL_IDS\.includes\(id\)\);/);
  assert.deepEqual(off(room.match(/TREASURES\.fanous=`[^`]*`/)[0] + room.match(/TREASURES\.crescent=`[^`]*`/)[0]), []);
  assert.match(game, /const special = \{ ramadan: "fanous", "eid-fitr": "crescent", "eid-adha": "crescent" \}\[Art\.season\?\.\(\)\];/);
  assert.match(game, /if \(special && !f\.owned\.includes\(special\)\) return special;/);
});
