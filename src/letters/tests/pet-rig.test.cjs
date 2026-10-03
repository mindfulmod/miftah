const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

function art() {
  const window = { MiftahGame: {} };
  const context = { window, document: { body: { classList: { toggle() {} } }, createElement: () => ({ getContext: () => ({ measureText: () => ({ width: 0 }) }) }) }, setTimeout, clearTimeout };
  vm.runInNewContext(source("LettersAnimalArt.js"), context);
  vm.runInNewContext(source("LettersArt.js"), context);
  return window.MiftahGame;
}

// A minimal SVG/DOM stand-in: elements record the transform the rig writes.
function fakePet(species, parts = ["root", "head", "gaze", "blink", "armL", "armR", "earL", "earR", "browL", "browR", "mouth", "mouthO"]) {
  const els = parts.map(name => ({ dataset: { rig: name }, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } }));
  const svg = {
    dataset: { rigSpecies: species },
    querySelectorAll: () => els,
    // Identity mapping: client pixels are SVG units.
    getScreenCTM: () => ({ inverse: () => ({}) }),
  };
  const host = { isConnected: true, querySelector: () => svg };
  const part = name => els.find(el => el.dataset.rig === name);
  return { host, part };
}

function rigRuntime() {
  const frames = new Map(), timers = [];
  let id = 0, now = 0;
  const window = { MiftahGame: {} };
  const context = {
    window,
    performance: { now: () => now },
    requestAnimationFrame: cb => { frames.set(++id, cb); return id; },
    cancelAnimationFrame: key => frames.delete(key),
    DOMPoint: class { constructor(x, y) { this.x = x; this.y = y; } matrixTransform() { return { x: this.x, y: this.y }; } },
    Math: Object.assign(Object.create(Math), { random: () => 0.1 }),
    setTimeout: (fn, ms) => { timers.push(fn); return timers.length; },
    clearTimeout: () => {},
    innerWidth: 400, innerHeight: 800,
  };
  vm.runInNewContext(source("LettersPetRig.js"), context);
  const advance = ms => {
    for (let t = 0; t < ms; t += 16) {
      now += 16;
      const pending = [...frames.entries()];
      frames.clear();
      pending.forEach(([, cb]) => cb(now));
    }
  };
  return { Rig: window.MiftahGame.LettersPetRig, advance, pending: () => frames.size, naps: () => timers.length };
}

const element = (x, y) => ({ isConnected: true, getBoundingClientRect: () => ({ left: x - 10, top: y - 10, width: 20, height: 20 }) });

test("animal pets carry rig pivots, ink contour, and headwear that turns with the head", () => {
  const ns = art();
  for (const id of ["lumi", "mina", "rafi"]) {
    const markup = ns.LettersAnimalArt.render(id, { items: ["cap", "glasses", "scarf", "medal"] });
    assert.equal((markup.match(/<g[ >]/g) || []).length, (markup.match(/<\/g>/g) || []).length, `${id} groups balance`);
    assert.match(markup, new RegExp(`data-rig-species="${id}"`));
    for (const pivot of ["root", "head", "gaze", "blink", "armL", "armR"]) assert.match(markup, new RegExp(`data-rig="${pivot}"`), `${id} ${pivot}`);
    assert.ok((markup.match(/class="[^"]*\bink\b/g) || []).length >= 4, `${id} silhouette is inked`);
    const head = markup.slice(markup.indexOf('data-rig="head"'));
    assert.ok(head.indexOf('fitted-cap') > -1, `${id} cap sits inside the head pivot`);
    assert.ok(head.indexOf('data-accessory="glasses"') > -1, `${id} glasses sit inside the head pivot`);
    assert.ok(markup.indexOf('data-accessory="medal"') > markup.lastIndexOf('data-accessory="glasses"'), `${id} body items stay on the body`);
  }
  const mina = ns.LettersAnimalArt.render("mina", {});
  assert.match(mina, /data-rig="earL"/);
  assert.match(mina, /class="mammal-brow"/);
});

test("blob pets get gaze and head pivots without moving their ground shadow", () => {
  const ns = art();
  const markup = ns.LettersArt.pet({ species: "blob", hue: 200 });
  assert.match(markup, /data-rig-species="blob"/);
  assert.equal((markup.match(/data-rig="gaze"/g) || []).length, 2);
  assert.ok(markup.indexOf('<ellipse cy="66"') < markup.indexOf('data-rig="root"'), "shadow stays on the ground during a hop");
});

test("the rig follows a held object and cancels cleanly", () => {
  const { Rig, advance, pending } = rigRuntime();
  const { host, part } = fakePet("mina");
  const rig = Rig.attach(host);
  rig.watch(element(600, 186));
  advance(800);
  const [gx] = part("gaze").attrs.transform.match(/-?\d+\.\d+/g).map(Number);
  assert.ok(gx > 5, "pupils turn toward the packet on the right");
  rig.destroy();
  assert.equal(pending(), 0, "no frame survives destroy");
  assert.equal(rig.alive, false);
});

test("the rig stops when its screen is replaced, even without destroy", () => {
  const { Rig, advance, pending } = rigRuntime();
  const { host } = fakePet("rafi");
  Rig.attach(host);
  advance(50);
  host.isConnected = false;
  advance(50);
  assert.equal(pending(), 0);
});

test("reduced motion keeps the body still while poses still change", () => {
  const { Rig, advance } = rigRuntime();
  const { host, part } = fakePet("mina");
  const rig = Rig.attach(host, { reducedMotion: () => true });
  rig.cheer();
  advance(300);
  assert.match(part("root").attrs.transform, /^translate\(0 0\.00\) rotate\(0\.00 /, "no hop or lean");
  assert.match(part("root").attrs.transform, /scale\(1\.0000 1\.0000\)/, "no squash or breathing");
  assert.match(part("armL").attrs.transform, /rotate\(38\.00 /, "the arm pose still lands, instantly");
});

test("chained actions run in order and a wrong answer ends in a calm ponder", () => {
  const { Rig, advance } = rigRuntime();
  const { host, part } = fakePet("lumi");
  const rig = Rig.attach(host, { reducedMotion: () => true });
  const order = [];
  rig.inspect(element(100, 400), 450, () => { order.push("inspect"); rig.ponder(() => order.push("ponder")); });
  advance(2000);
  assert.deepEqual(order, ["inspect", "ponder"]);
  assert.ok(part("root").attrs.transform, "still animating after the chain");
});

test("games only point the pet at things the child touched, never at the answer", () => {
  const games = source("MiniGames.js");
  const calls = [...games.matchAll(/ctx\??\.pet\?\.(watch|reach|inspect)\((\(\) => this\.penClient|[^,)]*)/g)].map(m => m[2].trim());
  assert.ok(calls.length >= 8, "pet hooks exist in Pond, Trace and Feed");
  const allowed = ["el", "bubble.el", "this.found?.el", "this.delivered || this.basket", "this.canvas", "() => this.penClient", "null"];
  for (const arg of calls) assert.ok(allowed.includes(arg), `unexpected pet target: ${arg}`);
  assert.doesNotMatch(games, /pet\?\.\w+\([^)]*target/, "no pet call is given the round target");
});

test("every chapter's pet reacts only to the child's own touch, and Boat keeps its choreography", () => {
  const game = source("LettersGame.js");
  assert.doesNotMatch(game, /const petRig = \(\) => \{\s*if \(!adventure/, "the rig is no longer Boat-only");
  const react = game.slice(game.indexOf("const reactToOutcome"), game.indexOf("this.stopJourneyPose = () => {\n        clearTimeout(poseTimer); rig?.destroy()"));
  assert.match(react, /const pick = touched\?\.isConnected \? touched : null/);
  assert.doesNotMatch(react, /currentTarget|round\.target|outcome\.itemId/, "the reaction never looks up the answer");
  assert.match(game, /const ownChoreography = \['pop', 'trace', 'feed'\]\.includes\(gameName\)/);
  assert.match(game, /reportOutcome: \(outcome\) => \{\s*reactToOutcome\(outcome\);/);
  assert.match(game, /sceneRig\(el\.querySelector\('\.adventure-friend, \.reward-friend'\)\)/, "every chapter's stars screen gets the pet");
});

test("a pet scrolled off screen naps instead of animating", () => {
  const { Rig, advance, pending, naps } = rigRuntime();
  const { host, part } = fakePet("mina");
  host.getBoundingClientRect = () => ({ top: 2000, bottom: 2100, left: 0, right: 100, width: 100, height: 100 });
  Rig.attach(host).cheer();
  advance(100);
  assert.equal(pending(), 0, "no animation frames while off screen");
  assert.ok(naps() >= 1, "it checks back later");
  assert.equal(part("root").attrs.transform, undefined, "nothing was drawn");
});

test("each species celebrates in its own way", () => {
  const poses = {};
  for (const species of ["mina", "rafi", "lumi", "blob"]) {
    const { Rig, advance } = rigRuntime();
    const { host, part } = fakePet(species);
    Rig.attach(host).cheer();
    const trail = [];
    for (let i = 0; i < 50; i += 1) { advance(16); trail.push(part("root").attrs.transform); }
    poses[species] = trail.join("|");
  }
  const unique = new Set(Object.values(poses));
  assert.equal(unique.size, 4, "four distinct celebration curves");
});

test("hatching wakes the pet with closed eyes that open", () => {
  const { Rig, advance } = rigRuntime();
  const { host, part } = fakePet("mina");
  Rig.attach(host).wake();
  advance(160);
  assert.match(part("blink").attrs.transform, /scale\(1 0\.080\)/, "eyes start closed");
  advance(700);
  assert.match(part("blink").attrs.transform, /scale\(1 1\.000\)/, "eyes open");
});

test("hatch, wardrobe, map, meet and practice screens bring the pet to life", () => {
  const game = source("LettersGame.js");
  assert.match(game, /hatchling\?\.wake\(\(\) => hatchling\.wave\(\)\)/);
  assert.match(game, /const roomPet = this\.petLife\(el\.querySelector\("\.pet-big"\), el\)/);
  assert.match(game, /const mapRig = this\.petLife\(walker, el\)/);
  assert.match(game, /class="lg-round-btn meet-hear adventure-companion"/, "every chapter's meet screen has the companion");
  assert.match(game, /friend=this\.petLife\(/);
  assert.match(game, /kind!=='Feed'&&kind!=='Burst'\)friend\?\.react/, "timed Burst practice stays calm");
});

test("the map pet travels the trail and waits where the child last went", () => {
  const game = source("LettersGame.js");
  assert.match(game, /const petI = visitedI >= 0 && this\.statusOf\(worlds\[visitedI\]\) !== "locked" \? visitedI : currentI;/, "locked stops never hold the pet");
  assert.match(game, /if \(travel\?\.world === world \|\| \(!travel && Number\(walker\?\.dataset\.stop\) === i\)\) return enter\(world\);/, "repeat taps enter at once");
  assert.match(game, /this\.prefersReducedMotion\(\)\) return enter\(world\);/, "reduced motion skips the walk");
  assert.match(game, /if \(this\.statusOf\(world\) === "locked"\) \{ mapRig\?\.inspect\(btn, 500, \(\) => mapRig\.ponder\(\)\); return; \}/, "locked stops stay locked");
});

test("map toys are decorative buttons that reset and never touch progress", () => {
  const window = { MiftahGame: {} };
  vm.runInNewContext(source("LettersMapArt.js"), { window, setTimeout, clearTimeout });
  const art = window.MiftahGame.LettersMapArt;
  assert.equal(art.kind("orchard", 2), "orchard");
  assert.equal(art.kind("lagoon", 4), "reeds");
  assert.equal(art.kind("night", 6), "lantern");
  assert.equal(art.kind("meadow", 1), "basket");
  assert.match(art.landmark("orchard", 2), /class="lm-fruit"/);
  assert.match(art.landmark("lagoon", 4), /class="lm-leaf"[\s\S]*/);
  assert.match(art.landmark("night", 6), /class="lm-glow"/);
  const toySource = source("LettersMapArt.js");
  const play = toySource.slice(toySource.indexOf("function play("), toySource.indexOf("function landmark("));
  assert.doesNotMatch(play, /progress|stars|save|localStorage|reward/i, "toys cannot change saved state");
});

test("brooks link the habitats, each with a bridge, and the waterwheel is a reset-safe toy", () => {
  const window = { MiftahGame: {} };
  vm.runInNewContext(source("LettersMapArt.js"), { window, setTimeout, clearTimeout });
  const art = window.MiftahGame.LettersMapArt;
  const biomes = ["meadow","meadow","meadow","meadow","meadow","meadow","meadow","meadow","meadow","meadow","orchard","orchard","orchard","orchard","lagoon","lagoon","night","peaks","peaks","river","river","river"];
  const stops = biomes.map((biome, i) => ({ biome, y: 4000 - i * 170, left: i % 2 === 0 }));
  const at = art.brookIndices(stops);
  for (let i = 0; i < biomes.length - 1; i += 1) if (biomes[i] !== biomes[i + 1]) assert.ok(at.includes(i), `habitat change after ${i} gets a brook`);
  assert.ok(at[0] <= 2, "the first bridge arrives early");
  const brooks = art.brooks({ width: 375, pathWidth: 375, stops });
  assert.equal(brooks.length, at.length);
  for (const b of brooks) assert.ok(b.x1 > b.x0 && Number.isFinite(b.y2), "each brook runs from a spring to the river");
  assert.match(art.landscape({ width: 375, height: 4200, pathWidth: 375, stops }), /class="map-brook"/);
  assert.match(art.bridge(), /<rect/);
  assert.match(art.waterwheel(), /class="lm-spin"/);
  assert.equal(art.TOYS.waterwheel, "Turn the waterwheel");
  const game = source("LettersGame.js");
  assert.match(game, /class="map-bridge"/, "every brook gets a bridge on the trail");
  assert.match(game, /pathEl\.addEventListener\("click", \(event\) => \{\s*const toy = event\.target\?\.closest\?\.\("\.map-toy"\);/, "re-placed toys stay wired");
});
