const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classes() {
  const values = new Set();
  return { add: (...xs) => xs.forEach(x => values.add(x)), remove: (...xs) => xs.forEach(x => values.delete(x)), contains: x => values.has(x),
    toggle(x, force) { const on = force === undefined ? !values.has(x) : force; on ? values.add(x) : values.delete(x); return on; } };
}
function node() {
  return { classList: classes(), dataset: {}, style: {}, hidden: false, disabled: false, innerHTML: '',
    setAttribute() {}, addEventListener(type, fn) { this['on' + type] = fn; }, replaceChildren() {}, remove() {},
    querySelectorAll() { return []; } };
}
function load() {
  const ns = { LetterFriends: { FRIENDS: { 'ب': {}, 'ت': {} }, art: c => `<svg>${c}</svg>`, item: c => ({ id: c, display: c }),
      get: c => ({ call: c }), }, LettersStrokes: { LETTERS: {} }, PracticeLearning: { profile: () => ({ choiceCount: 2 }) },
    LettersStrength: {}, DrawingPalette: {}, GardenPractice: {} };
  const context = { window: { MiftahGame: ns }, Math, Date, Promise, performance: { now: () => 1 },
    setTimeout: () => 1, clearTimeout() {}, cancelAnimationFrame() {}, requestAnimationFrame: () => 1,
    document: { createElement: () => ({}) }, getComputedStyle: () => ({ left: '0px' }) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'ToyBoxGames.js'), 'utf8'), context, { filename: 'ToyBoxGames.js' });
  return ns;
}
function bath(ns, extra = {}) {
  const elements = { '.tb-guess': node(), '.tb-wash-tools': node(), '.tb-bath-next': node(), '.tb-bath-friend': node(), '.tb-foam-shine': node() };
  const root = { classList: classes(), contains: () => true, querySelector: s => elements[s] || null,
    querySelectorAll: () => [], ...extra.root };
  const outcomes = [], timers = [];
  const game = Object.create(ns.GardenPractice.BathTime.prototype);
  Object.assign(game, { alive: true, busy: false, clean: false, answered: false, guessing: false, missed: false,
    round: 0, roundToken: 4, c: 'ب', tool: 'sponge', order: ['ب', 'ت'], root, svg: node(), mud: { children: [] }, total: 10,
    bubbles: { children: [], insertAdjacentHTML() {} }, cursor: node(), ctx: { items: [{ id: 'friend-ba', display: 'ب' }, { id: 'friend-ta', display: 'ت' }], reportOutcome: o => outcomes.push(o), sfx() {}, say() {},
      beginRound() {} }, timers, later(fn, ms) { timers.push({ fn, ms }); return timers.length; },
    endScrub() {}, still: () => true, cheer() {}, say() {}, wobble() {},
    participated: ns.GardenPractice.BathTime.prototype.participated, ...extra });
  return { game, root, elements, outcomes, timers };
}

test('sponge and rinse use distinct tap and drag radii without evidence on selection', () => {
  const ns = load(), f = bath(ns), calls = [];
  const mud = [{ getAttribute: k => k === 'cx' ? '12' : '18' }];
  f.game.mud = { children: mud };
  f.game.updateTool = () => {};
  f.game.scrubAt = (...args) => calls.push(args);
  assert.equal(f.game.useTool('sponge'), true);
  assert.equal(f.game.useTool('rinse'), true);
  assert.deepEqual(calls.map(c => c[2]), [22, 34]);
  calls.length = 0;
  f.game.mud.children = [];
  f.game.scrubAt = (...args) => calls.push(args);
  f.game.tool = 'sponge'; f.game.lastScrub = null; f.game.toBox = e => e.point; f.game.follow = () => {};
  f.game.scrubMove({ point: { x: 1, y: 1 } });
  f.game.tool = 'rinse'; f.game.lastScrub = null;
  f.game.scrubMove({ point: { x: 1, y: 1 } });
  assert.deepEqual(calls.map(c => c[2]), [16, 26]);
  assert.equal(f.outcomes.length, 0, 'choosing a washing tool does not record a letter answer');
});

test('invalid, stale, clean, and empty-bath tool uses do nothing', () => {
  const ns = load(), f = bath(ns), calls = [];
  f.game.mud = { children: [{ getAttribute: () => '1' }] };
  f.game.scrubAt = (...args) => calls.push(args); f.game.updateTool = () => {};
  assert.equal(f.game.useTool('brush'), false);
  f.game.alive = false; assert.equal(f.game.useTool('rinse'), false);
  f.game.alive = true; f.game.clean = true; assert.equal(f.game.useTool('sponge'), false);
  f.game.clean = false; f.game.mud.children = []; assert.equal(f.game.useTool('rinse'), false);
  assert.deepEqual(calls, []);
});

test('a wrong guess reveals the reference and a later correct answer is assisted', () => {
  const ns = load(), f = bath(ns);
  const ref = node(); ref.hidden = true; f.root.querySelector = s => s === '.tb-bath-reference' ? ref : f.elements[s] || null;
  const buttons = [node(), node()]; buttons.forEach((b, i) => { b.dataset.i = String(i); });
  f.game.ask = true; f.game.mud.children = Array.from({ length: 5 }, () => node());
  f.game.offered = ['ت', 'ب']; f.game.guessing = true;
  f.root.querySelectorAll = s => s === '.tb-guess-letter' ? buttons : [];
  assert.equal(f.game.missed, false);
  assert.equal(f.game.guess(0, buttons[0], f.game.roundToken), false);
  assert.equal(f.game.missed, true);
  assert.equal(ref.hidden, false);
  assert.equal(buttons[1].classList.contains('is-hint'), true);
  assert.equal(f.game.guess(1, buttons[1], f.game.roundToken), true);
  assert.equal(f.outcomes.length, 2);
  assert.equal(f.outcomes[1].correct, true);
  assert.equal(f.outcomes[1].evidence, 'supported_visible_matching');
  assert.equal(f.outcomes[1].selectedId, 'friend-ba');
  assert.equal(f.outcomes[1].assisted, true);
});

test('wash completion records motor play synchronously once and waits for explicit next', () => {
  const ns = load(), f = bath(ns); let advances = 0;
  f.game.next = () => { advances++; };
  f.game.washAll();
  f.game.washAll();
  assert.equal(f.outcomes.length, 1);
  assert.equal(f.outcomes[0].skill, 'scrubbing');
  assert.equal(f.outcomes[0].evidence, 'motor_assembly_participation');
  assert.equal(f.game.completionReady, true);
  assert.equal(advances, 0, 'wash completion does not automatically advance');
  assert.equal(f.game.continueBath(f.game.roundToken), true);
  assert.equal(advances, 1);
  assert.equal(f.game.continueBath(f.game.roundToken - 1), false);
  assert.equal(advances, 1);
});

test('a later wash callback from a retired round cannot touch its replacement', () => {
  const ns = load(), f = bath(ns); let calls = 0;
  f.game.svg = node();
  f.game.laterForBath(() => calls++, 650);
  const old = f.timers[0].fn;
  old();
  assert.equal(calls, 1, 'the callback still runs while its original round is active');
  f.game.roundToken++; f.game.svg = node();
  old();
  assert.equal(calls, 1);
});

test('guess handlers require the live token and exact live button', () => {
  const ns = load(), f = bath(ns), buttons = [node(), node()];
  f.game.ask = true; f.game.mud.children = Array.from({ length: 5 }, () => node());
  f.game.offered = ['ب', 'ت']; f.game.guessing = true;
  f.root.querySelectorAll = s => s === '.tb-guess-letter' ? buttons : [];
  assert.equal(f.game.guess(0, buttons[0], f.game.roundToken - 1), false);
  assert.equal(f.game.guess(0, node(), f.game.roundToken), false);
  assert.equal(f.outcomes.length, 0);
  assert.equal(f.game.guess(0, buttons[0], f.game.roundToken), true);
  assert.equal(f.outcomes.length, 1);
  assert.equal(f.outcomes[0].evidence, 'supported_visible_matching');
  assert.equal(f.outcomes[0].selectedId, 'friend-ba');
  assert.equal(f.outcomes[0].assisted, false);
  assert.equal(f.game.guess(0, buttons[0], f.game.roundToken), false);
  assert.equal(f.outcomes.length, 1, 'an old click cannot report a second answer');
});

