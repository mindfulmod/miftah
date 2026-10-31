const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classes() {
  const values = new Set();
  return {
    add: (...names) => names.forEach(name => values.add(name)),
    remove: (...names) => names.forEach(name => values.delete(name)),
    contains: name => values.has(name),
    toggle: (name, force) => { const on = force === undefined ? !values.has(name) : force; on ? values.add(name) : values.delete(name); return on; },
  };
}

function element(className = '', dataset = {}) {
  const listeners = {};
  const child = () => element();
  return {
    className, classList: classes(), dataset, style: {}, listeners, disabled: false, isConnected: true, innerHTML: '',
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    setAttribute() {},
    querySelector(selector) { if (selector === '.pz-turned') return this.turned || null; if (selector === '.lk-seats') return this.seats || null; return null; },
    animate() {},
    insertAdjacentHTML(_where, html) { this.innerHTML += html; },
    getBoundingClientRect() { const left = Number(dataset.i || 0) * 120; return { left, top: 0, right: left + 100, bottom: 100, width: 100, height: 100 }; },
    turned: { style: {} }, seats: { insertAdjacentHTML() {} },
    child,
  };
}

class Root {
  constructor() { this.classList = classes(); this.nodes = {}; this.html = ''; }
  set innerHTML(html) {
    this.html = html; this.nodes = {};
    for (const match of html.matchAll(/<(button|span)[^>]*class="([^"]+)"([^>]*)>/g)) {
      const [, tag, rawClass, attrs] = match;
      const names = rawClass.split(/\s+/);
      const c = names.find(name => ['pz-tile', 'pz-balloon', 'lk-bus', 'lk-rider', 'pz-cars', 'pz-slot', 'pz-singers', 'sh-thing'].includes(name));
      if (!c) continue;
      const data = {};
      for (const attr of attrs.matchAll(/data-([\w-]+)="([^"]+)"/g)) data[attr[1] === 'i' ? 'i' : attr[1] === 'c' ? 'c' : attr[1]] = attr[2];
      const node = element(c, data); node.classList.add(...names);
      (this.nodes[c] ||= []).push(node);
    }
  }
  get innerHTML() { return this.html; }
  querySelectorAll(selector) { return this.nodes[selector.slice(1)] || []; }
  querySelector(selector) { return selector === '.sh-night' ? this.scene : this.querySelectorAll(selector)[0] || null; }
}

function runtime() {
  const outcomes = [], drags = [], timers = [];
  const chars = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د'];
  const ns = {
    LettersArt: { icon: () => '<svg/>', inkShift: () => ({ dx: 0, dy: 0 }) },
    LetterFriends: { FRIENDS: Object.fromEntries(chars.map(c => [c, {}])), art: () => '<svg class="lf"></svg>', get: () => ({ call: 'chime' }), item: c => ({ id: c, display: c }) },
    LettersStrokes: { LETTERS: Object.fromEntries(chars.map(c => [c, ['same']])) },
    LETTERS_DATA: { packs: [{ letters: chars.map((char, i) => ({ char, arName: `name ${i}` })) }] },
    PracticeLearning: {
      currentLevel: 0,
      choiceCount: 2,
      promptMode: null,
      profile: (_ctx, _item, skill) => ({ choiceCount: ns.PracticeLearning.choiceCount, promptMode: ns.PracticeLearning.promptMode || (skill === 'letter-name' ? 'listen' : 'match') }),
      level: () => ns.PracticeLearning.currentLevel,
      orderChars: (_ctx, pool, _skill, count = pool.length) => [...new Set(pool)].slice(0, count),
    },
    GardenPractice: {
      draggable(_el, options) { drags.push(options); return () => {}; },
      inside(_el, x, y) { return x >= 0 && y >= 0; },
    },
  };
  const context = {
    window: { MiftahGame: ns, matchMedia: () => ({ matches: true }), addEventListener() {}, removeEventListener() {} },
    document: { createElement: () => element() },
    performance: { now: () => 0 },
    setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length; },
    clearTimeout() {},
    Math: Object.assign(Object.create(Math), { random: () => 0.5 }),
  };
  for (const file of ['PuzzleGames.js', 'ShadowGames.js', 'LookGames.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  }
  return { ns, context, outcomes, drags, timers };
}

function gameContext(outcomes) {
  const items = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د'].map(display => ({ id: display, display, speak: display }));
  return {
    items, known: [], beginner: false, reducedMotion: () => true,
    reportOutcome: outcome => outcomes.push(outcome),
    beginRound() {}, say() { return true; }, sfx() {}, correct() {}, confettiAt() {}, done() {}, cancel() {},
    pet: { cheer() {} },
  };
}

test('Lantern Hunt visibly supplies the target whenever matching or unavailable speech prevents listening', () => {
  const { ns, outcomes, timers } = runtime();
  const ctx = gameContext(outcomes), root = new Root(), prompted = [];
  root.scene = element('sh-night');
  ns.PracticeLearning.promptMode = 'match';
  ctx.stage = { clientHeight: 400, clientWidth: 600 };
  ctx.prompt = target => prompted.push(target?.display || null);
  const game = Object.create(ns.GardenPractice.LanternHunt.prototype);
  Object.assign(game, { ctx, root, alive: true, timers: [], dragResets: [], known: ['ا', 'ب'], asks: ['ا'], round: 0, moveTo() {} });
  game.next();
  assert.deepEqual(prompted, ['ا'], 'match mode exposes the requested letter');
  assert.equal(game.heard, false);

  prompted.length = 0;
  ns.PracticeLearning.promptMode = 'listen';
  ctx.canListen = () => false;
  const unavailable = Object.create(ns.GardenPractice.LanternHunt.prototype);
  Object.assign(unavailable, { ctx, root: new Root(), alive: true, timers: [], dragResets: [], known: ['ا', 'ب'], asks: ['ب'], round: 0, moveTo() {} });
  unavailable.root.scene = element('sh-night');
  unavailable.next();
  assert.deepEqual(prompted, ['ب'], 'speech availability overrides a listening profile with a visible prompt');
  assert.equal(unavailable.heard, false);

  prompted.length = 0;
  ctx.canListen = () => true;
  ctx.say = () => false;
  const failedSpeech = Object.create(ns.GardenPractice.LanternHunt.prototype);
  Object.assign(failedSpeech, { ctx, root: new Root(), alive: true, timers: [], dragResets: [], known: ['ا', 'ب'], asks: ['ا'], round: 0, moveTo() {} });
  failedSpeech.root.scene = element('sh-night');
  failedSpeech.next();
  assert.deepEqual(prompted, [], 'a listening profile does not pre-show the target');
  timers.filter(timer => timer.ms === 300).at(-1).fn();
  assert.deepEqual(prompted, ['ا'], 'failed playback reveals the target instead of leaving an unsupported round');
  assert.equal(failedSpeech.heard, false);
});

test('Same Letter uses the learned profile and does not raise its level after a clean answer', () => {
  const { ns, outcomes } = runtime();
  const ctx = gameContext(outcomes), root = new Root();
  ns.PracticeLearning.choiceCount = 3;
  ns.PracticeLearning.currentLevel = 0;
  const game = Object.create(ns.GardenPractice.SameLetter.prototype);
  Object.assign(game, { ctx, root, alive: true, timers: [], known: ['ا', 'ب', 'ت', 'ث'], targets: ['ا'], rounds: 1, round: 0, level: 0 });
  game.next();
  assert.equal(root.querySelectorAll('.pz-tile').length, 3);
  assert.ok(game.tiles.every(tile => tile.rot === 0));
  const right = game.tiles.findIndex(tile => tile.right);
  game.tap(right, root.querySelectorAll('.pz-tile')[right]);
  assert.equal(game.level, 0, 'one in-session success does not increase visual difficulty');
  assert.equal(outcomes[0].evidence, 'supported_visible_matching');
});

test('Echo Parade only earns listening evidence when the learning profile permits listening and help was not used', () => {
  const { ns, outcomes } = runtime();
  const game = Object.create(ns.GardenPractice.EchoParade.prototype);
  game.ctx = gameContext(outcomes); game.alive = true; game.missed = false; game.heard = true;
  assert.equal(game.report('ب', 'ب', ['ب', 'ت'], { skill: 'letter-name', listening: true }), true);
  assert.equal(outcomes[0].evidence, 'independent_listening');
  game.missed = true;
  game.report('ب', 'ب', ['ب', 'ت'], { skill: 'letter-name', listening: true });
  assert.equal(outcomes[1].evidence, 'supported_visible_matching');
  assert.equal(outcomes[1].assisted, true);
});

test('Echo Parade shows a supported sequence and waits for playback before accepting an answer', async () => {
  const { ns, outcomes } = runtime();
  const ctx = gameContext(outcomes), root = new Root(), started = [];
  ns.PracticeLearning.promptMode = 'match';
  const game = Object.create(ns.GardenPractice.EchoParade.prototype);
  Object.assign(game, { ctx, root, alive: true, timers: [], dragResets: [], pool: ['ا', 'ب', 'ت'], len: 2, syllables: false, byText: new Map(), baseSkill: 'letter-name', round: 0, rounds: 4, wait: async () => {} });
  ctx.beginRound = (_item, skill) => started.push(skill);
  game.next();
  assert.match(root.html, /class="pz-singers"/, 'a match-mode learner sees the sequence');
  assert.doesNotMatch(root.html, /class="pz-singers is-hidden"/);
  game.busy = false;
  game.promptReady = false;
  game.tap(0, root.querySelectorAll('.pz-tile')[0]);
  assert.equal(outcomes.length, 0, 'an early response cannot claim listening evidence');
  await game.sing();
  assert.equal(game.promptReady, true);
  assert.equal(started.at(-1), 'matching-memory');
  const right = game.board.indexOf(game.seq[0]);
  game.tap(right, root.querySelectorAll('.pz-tile')[right]);
  assert.equal(outcomes[0].skill, 'matching-memory');
  assert.equal(outcomes[0].evidence, 'supported_visible_matching');
});

test('Letter Train drag only accepts the next balloon over the receiving carriage area', () => {
  const { ns, outcomes, drags } = runtime();
  const ctx = gameContext(outcomes), root = new Root();
  const game = Object.create(ns.GardenPractice.LetterTrain.prototype);
  Object.assign(game, { ctx, root, alive: true, timers: [], dragResets: [], run: ['ا', 'ب'], size: 2, rides: 1, ride: 0 });
  game.next();
  assert.equal(drags.length, 2);
  const wrong = root.querySelectorAll('.pz-balloon').find(balloon => balloon.dataset.c !== game.order[0]);
  const right = root.querySelectorAll('.pz-balloon').find(balloon => balloon.dataset.c === game.order[0]);
  assert.equal(drags.find((_, i) => root.querySelectorAll('.pz-balloon')[i] === wrong).drop(10, 10), false, 'out of order drag returns without an answer');
  assert.equal(drags.find((_, i) => root.querySelectorAll('.pz-balloon')[i] === right).drop(10, 10), true, 'accepted carriage placement returns true');
  assert.equal(outcomes.length, 0, 'partial train building is participation, not a strength answer');
  game.destroy();
  assert.equal(game.alive, false);
});

test('Family Buses rider drag accepts a bus and reports the visual family match', () => {
  const { ns, outcomes, drags } = runtime();
  const ctx = gameContext(outcomes), root = new Root();
  ns.LettersStrokes.LETTERS = Object.fromEntries(['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د'].map((c, i) => [c, [i < 3 ? 'family-a' : i < 6 ? 'family-b' : `family-${i}`]]));
  ctx.stage = { set innerHTML(value) { root.innerHTML = value; }, get firstElementChild() { return root; }, contains(node) { return node === root; } };
  const game = new ns.GardenPractice.FamilyBuses(ctx);
  assert.equal(drags.length, 1);
  const buses = root.querySelectorAll('.lk-bus');
  const correct = buses.findIndex(bus => game.buses[Number(bus.dataset.i)] === game.want);
  assert.equal(drags[0].drop(correct * 120 + 50, 50), true);
  assert.equal(outcomes[0].skill, 'letter-form');
  assert.equal(outcomes[0].evidence, 'supported_visible_matching');
  assert.equal(outcomes[0].itemId, game.riderItem.id);
  assert.equal(outcomes[0].affectsStrength, false);
  assert.ok(correct >= 0);
});
