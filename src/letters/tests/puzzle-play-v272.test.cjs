const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classList() {
  const values = new Set();
  return { add: (...xs) => xs.forEach(x => values.add(x)), remove: (...xs) => xs.forEach(x => values.delete(x)),
    contains: x => values.has(x), toggle(x, force) { const on = force === undefined ? !values.has(x) : force; on ? values.add(x) : values.delete(x); return on; } };
}
function node(cls = '', dataset = {}) {
  const listeners = {};
  return { className: cls, classList: classList(), dataset, style: {}, innerHTML: '', listeners,
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }, animate() {},
    insertAdjacentHTML(_where, html) { this.innerHTML += html; }, replaceChildren() { this.innerHTML = ''; },
    querySelector(selector) { return this.children?.[selector] || null; },
    getBoundingClientRect() { return { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 }; } };
}
class Root {
  set innerHTML(value) {
    this.html = value; this.nodes = {};
    for (const match of value.matchAll(/<(button|span|div)[^>]*class="([^"]+)"([^>]*)>/g)) {
      const [, , raw, attrs] = match, names = raw.split(/\s+/);
      const cls = names.find(x => ['pz-tile','pz-balloon','pz-car','pz-cars','pz-rails','pz-slot','pz-singers','pz-dot','pz-reveal','pz-train-model','pz-drive'].includes(x));
      if (!cls) continue;
      const data = Object.fromEntries([...attrs.matchAll(/data-([\w-]+)="([^"]+)"/g)].map(m => [m[1], m[2]]));
      const el = node(cls, data); el.classList.add(...names); (this.nodes[cls] ||= []).push(el);
    }
  }
  querySelectorAll(selector) { return this.nodes?.[selector.slice(1)] || []; }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}
function setup() {
  const timers = [], outcomes = [], chars = ['ا','ب','ت','ث','ج','ح','خ','د'];
  const ns = {
    LetterFriends: { FRIENDS: Object.fromEntries(chars.map(c => [c, {}])), art: c => `<svg class="lf">${c}</svg>` },
    LettersStrokes: { LETTERS: Object.fromEntries(chars.map((c, i) => [c, i < 3 ? ['shared'] : ['shape-' + c]])) },
    LETTERS_DATA: { packs: [{ letters: chars.map((char, i) => ({ char, arName: `name ${i}` })) }] },
    PracticeLearning: { profile: (_ctx, _it, skill) => ({ choiceCount: skill === 'alphabet-order' ? 3 : 2, promptMode: 'match' }), level: () => 0,
      orderChars: (_ctx, pool, _skill, count = pool.length) => pool.slice(0, count) },
    GardenPractice: { draggable(_el, options) { (setup.drags ||= []).push(options); return () => {}; }, inside(_el, x) { return x >= 0; } },
  };
  const context = { window: { MiftahGame: ns }, setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {},
    Math: Object.assign(Object.create(Math), { random: () => 0.2 }) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'PuzzleGames.js'), 'utf8'), context);
  const items = chars.map(display => ({ id: display, display, speak: display }));
  const ctx = { items, known: [], beginner: false, reducedMotion: () => true, stage: { innerHTML: '', get firstElementChild() { return root; } },
    reportOutcome: o => outcomes.push(o), beginRound() {}, say: () => true, sfx() {}, correct() {}, confettiAt() {}, done() {}, cancel() {}, pet: { cheer() {} } };
  const root = new Root();
  ctx.stage.firstElementChild = root;
  return { ns, ctx, root, outcomes, timers, chars };
}

test('puzzle pools exclude untaught, locked, unmet-prerequisite, and conflicting duplicate letters', () => {
  const { ns, ctx } = setup();
  ctx.items = [
    { id: 'a', display: 'ا' }, { id: 'b', display: 'ب' },
    { id: 'c', display: 'ت', taught: false }, { id: 'd', display: 'ث', locked: true },
    { id: 'e', display: 'ج', prerequisiteWorldIds: ['earlier'] },
    { id: 'b-conflict', display: 'ب', unlocked: false },
  ];
  ctx.completedWorldIds = [];
  const game = Object.create(ns.GardenPractice.EchoParade.prototype);
  game.ctx = ctx;
  // The constructor's pool setup is also used by both games through knownChars.
  const echo = new ns.GardenPractice.EchoParade({ ...ctx, stage: { innerHTML: '', get firstElementChild() { return new Root(); } }, prompt() {} });
  assert.deepEqual(Array.from(echo.pool), ['ا']);
  const syllables = [
    { id: 'ba-fatha', display: 'بَ' }, { id: 'ta-fatha', display: 'تَ' },
    { id: 'tha-fatha', display: 'ثَ' }, { id: 'ta-hidden', display: 'تَ', taught: false },
  ];
  const syllableEcho = new ns.GardenPractice.EchoParade({ ...ctx, items: syllables, known: [],
    stage: { innerHTML: '', get firstElementChild() { return new Root(); } }, prompt() {} });
  assert.equal(syllableEcho.syllables, true);
  assert.deepEqual(Array.from(syllableEcho.pool), ['بَ', 'ثَ']);
});

test('Echo converts rejected playback to visible matching and stale speech cannot unlock a later round', async () => {
  const { ns, ctx, root, timers } = setup();
  let starts = 0, calls = 0;
  ctx.say = () => { calls++; return calls === 1 ? Promise.reject(new Error('speech unavailable')) : calls === 2 ? false : undefined; };
  ctx.beginRound = () => starts++;
  const game = Object.create(ns.GardenPractice.EchoParade.prototype);
  Object.assign(game, { ctx, root, alive: true, timers: [], seq: ['ا','ب','ت'], syllables: false, byText: new Map(), promptMode: 'listen', promptSkill: 'letter-name',
    baseSkill: 'letter-name', sequenceId: 7, busy: true, wait: async () => {}, sayable: c => ({ display: c }) });
  root.innerHTML = '<span class="pz-singers is-hidden"></span>';
  await game.sing(7);
  assert.equal(game.promptReady, true);
  assert.equal(game.promptMode, 'match');
  assert.equal(game.heard, false);
  assert.equal(starts, 1);
  ctx.say = () => new Promise(() => {});
  const timedOut = game.sayWithin({ display: 'ا' }, 5);
  timers.find(timer => timer.ms === 5).fn();
  assert.equal(await timedOut, false, 'a speech promise that never settles times out safely');
  game.promptReady = false; game.sequenceId = 8;
  let release; ctx.say = () => new Promise(resolve => { release = resolve; });
  const stale = game.sing(8);
  game.sequenceId = 9;
  release(true); await stale;
  assert.equal(game.promptReady, false, 'an old sequence completion cannot enable answering');
});

test('Dots Last marks letter-form and eager guesses do not report mastery; stale dot callbacks are ignored', () => {
  const { ns, ctx, outcomes } = setup();
  const game = Object.create(ns.GardenPractice.DotsLast.prototype);
  const tile = node(), otherTile = node();
  Object.assign(game, { ctx, root: { querySelectorAll: selector => selector === ".pz-tile" ? [tile, otherTile] : [], querySelector: () => null }, alive: true, busy: false, phase: "printing",
    timers: [], offered: ['ب','ت'], target: 'ت', dotList: [[50, 65]], revealed: 0, roundToken: 4, missed: false, wobble() {} });
  game.tap(0, tile);
  assert.equal(outcomes.length, 0, 'an incomplete guess carries no learning evidence');
  const revealed = game.revealed;
  game.roundToken = 5;
  game.showDot(0, 4);
  assert.equal(game.revealed, revealed, 'a delayed callback from the prior round cannot reveal another dot');
  game.roundToken = 4; game.revealed = 1;
  game.settled = true;
  game.tap(1, otherTile);
  assert.equal(outcomes[0].skill, 'letter-form');
});

test('Letter Train pre-renders carriage slots and sizes a run by its least-ready letter', () => {
  const { ns, ctx, root } = setup();
  ctx.items = ['ا','ب','ت','ث'].map(display => ({ id: display, display }));
  ctx.beginner = true;
  ns.PracticeLearning.profile = (_ctx, item) => ({ choiceCount: item.display === 'ا' ? 4 : item.display === 'ب' ? 3 : item.display === 'ت' ? 2 : 4 });
  const game = new ns.GardenPractice.LetterTrain({ ...ctx, stage: { innerHTML: '', get firstElementChild() { return root; } }, prompt() {} });
  assert.equal(game.size, 2);
  assert.match(root.html, /class="pz-car is-next is-guide"/);
  assert.match(root.html, /class="pz-car is-guide"/);
  assert.match(root.html, /--car-count:2/);
  assert.match(root.html, /pz-car-letter/);
  assert.equal(game.rides, 2, 'four letters form two different rides');
  assert.deepEqual(Array.from(game.rideStarts), [0, 2]);
  game.ride = 1; game.next();
  assert.deepEqual(Array.from(game.order), ['ت','ث']);
});

test('dropping the wrong balloon on the train gives the same gentle miss as a tap', () => {
  const { ns, ctx, root } = setup();
  ctx.items = ['ا','ب'].map(display => ({ id: display, display }));
  const sounds = []; ctx.sfx = sound => sounds.push(sound);
  const game = Object.create(ns.GardenPractice.LetterTrain.prototype);
  Object.assign(game, { ctx, root, alive: true, timers: [], dragResets: [], run: ['ا','ب'], size: 2, rides: 1, ride: 0 });
  game.next();
  const balloons = root.querySelectorAll('.pz-balloon');
  const wrongIndex = balloons.findIndex(b => b.dataset.c !== game.order[0]);
  const wrongDrop = setup.drags.at(-balloons.length + wrongIndex);
  assert.equal(wrongDrop.drop(12, 12), false);
  assert.equal(game.missed, true);
  assert.ok(sounds.includes('boing'));
  ns.GardenPractice.inside = () => false;
  const before = game.missed;
  assert.equal(wrongDrop.drop(-1, -1), false);
  assert.equal(game.missed, before, 'outside drops do not count as answers');
});

test('Same Letter keeps two upright choices for beginners and holds saved difficulty through the visit', () => {
  const { ns, ctx, root } = setup();
  ctx.beginner = true;
  const game = new ns.GardenPractice.SameLetter({ ...ctx, stage: { innerHTML: '', get firstElementChild() { return root; } }, prompt() {} });
  assert.equal(root.querySelectorAll('.pz-tile').length, 2);
  assert.ok(game.tiles.every(tile => tile.rot === 0));
  game.level = 1;
  game.ctx.beginner = false;
  game.level = 1;
  assert.ok(game.tiles.every(tile => tile.rot === 0), 'current round keeps its starting orientation');
});

test('the train waits at the platform until the child presses drive', async () => {
  const { ns, ctx, root, timers } = setup();
  ctx.items = ['ا','ب'].map(display => ({ id: display, display }));
  const game = new ns.GardenPractice.LetterTrain({ ...ctx, stage: { innerHTML: '', get firstElementChild() { return root; } }, prompt() {} });
  for (const letter of game.order) game.pop(root.querySelectorAll('.pz-balloon').find(b => b.dataset.c === letter));
  for (let i = 0; i < 8; i += 1) { timers.forEach(t => t.fn()); await Promise.resolve(); await Promise.resolve(); }
  assert.equal(game.phase, 'ready');
  assert.equal(game.ride, 0);
  assert.equal(root.querySelector('.pz-rails').classList.contains('is-leaving'), false);
  timers.forEach(t => t.fn());
  assert.equal(game.ride, 0, 'the refrain never departs automatically');
  assert.equal(game.depart(), true);
  assert.equal(game.ride, 1);
});

test('Same Letter adds a choice before rotations and introduces mirrors on a later milestone', () => {
  const { ns, ctx, root } = setup();
  ns.PracticeLearning.profile = () => ({ choiceCount: 3 });
  ns.PracticeLearning.level = () => 1;
  const stage = { innerHTML: '', get firstElementChild() { return root; } };
  const upright = new ns.GardenPractice.SameLetter({ ...ctx, stage });
  assert.equal(upright.choiceCount, 3);
  assert.equal(upright.level, 0);
  assert.ok(upright.tiles.every(tile => tile.rot === 0));
  ns.PracticeLearning.level = () => 2;
  const turning = new ns.GardenPractice.SameLetter({ ...ctx, stage });
  assert.equal(turning.level, 1);
  assert.ok(turning.tiles.every(tile => !tile.flip));
  ctx.strength = { skillProfile: () => ({ matching: { r:12, streak:6, sessions:['a','b','c',null] } }) };
  assert.equal(new ns.GardenPractice.SameLetter({ ...ctx, stage }).level, 1, 'an absent session ID is not another visit');
  ctx.strength = { skillProfile: () => ({ matching: { r:12, streak:6, sessions:['a','b','c','d'] } }) };
  const mirrored = new ns.GardenPractice.SameLetter({ ...ctx, stage });
  assert.equal(mirrored.level, 2);
});

test('leaving during Echo releases its pending speech without unlocking answers', async () => {
  const { ns, ctx, root } = setup();
  let begun = 0;
  ctx.say = () => new Promise(() => {});
  ctx.beginRound = () => begun++;
  const game = Object.create(ns.GardenPractice.EchoParade.prototype);
  Object.assign(game, { ctx, root, alive: true, timers: [], dragResets: [], sequenceId: 1,
    seq: ['ا','ب'], syllables: false, promptMode: 'listen', promptReady: false, sayable: c => ({ display: c }) });
  root.innerHTML = '<span class="pz-singers is-hidden"></span>';
  const pending = game.sing(1);
  game.destroy();
  await pending;
  assert.equal(begun, 0);
  assert.equal(game.promptReady, false);
  assert.equal(game.speechWaits.size, 0);
});
