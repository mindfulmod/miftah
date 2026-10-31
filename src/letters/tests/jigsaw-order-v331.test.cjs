const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classes() {
  const values = new Set();
  return { add: (...xs) => xs.forEach(x => values.add(x)), remove: (...xs) => xs.forEach(x => values.delete(x)),
    toggle(x, force) { const on = force === undefined ? !values.has(x) : force; on ? values.add(x) : values.delete(x); return on; } };
}
function element(rect = { left: 0, top: 0, width: 50, height: 50 }) {
  return { classList: classes(), dataset: {}, style: {}, rect, isConnected: true, disabled: false, innerHTML: '',
    getBoundingClientRect() { return { ...this.rect, right: this.rect.left + this.rect.width, bottom: this.rect.top + this.rect.height }; },
    addEventListener(type, fn) { this['on' + type] = fn; }, insertAdjacentHTML() {}, removeAttribute() {} };
}
function load() {
  const ns = { LetterFriends: { FRIENDS: { 'ب': {} }, art: c => `<svg>${c}</svg>`, item: c => ({ id: `friend-${c}`, display: c }) },
    LettersStrokes: { LETTERS: {} }, PracticeLearning: { profile: () => ({}), level: () => 0, plan: (_ctx, items) => items },
    LettersStrength: {}, DrawingPalette: {}, GardenPractice: {} };
  const context = { window: { MiftahGame: ns }, Math, Date, setTimeout() { return {}; }, clearTimeout() {}, Promise,
    document: { createElement: () => ({}) }, getComputedStyle: () => ({ left: '0px' }) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'ToyBoxGames.js'), 'utf8'), context, { filename: 'ToyBoxGames.js' });
  return ns;
}
function gameFixture(ns, n) {
  const slots = Array.from({ length: n }, (_, i) => element({ left: i * 70, top: 0, width: 50, height: 50 }));
  const board = element(), tray = element(), panel = element();
  let pieces = [];
  let pieceButtons = [];
  const root = { contains: node => [board, tray, panel, ...slots, ...pieceButtons].includes(node),
    querySelector(selector) {
      if (selector === '.tb-tray') return tray;
      if (selector === '.tb-board') return board;
      const m = selector.match(/\.tb-slot\[data-r="(\d+)"\]/); return m ? slots[Number(m[1])] : null;
    },
    querySelectorAll(selector) {
      if (selector === '.tb-slot') return slots;
      if (selector === '.tb-piece') return pieceButtons;
      return [];
    } };
  const outcomes = [];
  const game = Object.create(ns.GardenPractice.FriendJigsaw.prototype);
  Object.assign(game, { alive: true, busy: false, round: 0, roundToken: 5, stepToken: 0, c: 'ب', n,
    todo: Array.from({ length: n }, (_, i) => i), root, roundRoot: panel, dragResets: [], timers: [],
    pieces: [], ctx: { items: [{ id: 'friend-ba', display: 'ب' }], reportOutcome: o => outcomes.push(o), sfx() {}, beginRound() {} },
    piece: () => '<svg/>', scene: () => '<svg/>', cheer() {}, wobble() {}, say() {}, later(fn, ms) { this.timers.push({ fn, ms }); return {}; },
    participated: ns.GardenPractice.FriendJigsaw.prototype.participated,
    ask() {
      this.stepToken = (this.stepToken || 0) + 1;
      this.pieces = this.todo.map(r => ({ c: this.c, r }));
      pieces = this.pieces;
      pieceButtons = pieces.map((_, i) => { const b = element(); b.dataset.i = String(i); return b; });
    } });
  game.ask();
  return { game, slots, outcomes, get pieces() { return pieces; }, get pieceButtons() { return pieceButtons; } };
}
function permutations(xs) {
  if (xs.length < 2) return [xs];
  return xs.flatMap((x, i) => permutations(xs.filter((_, j) => j !== i)).map(rest => [x, ...rest]));
}

test('jigsaw accepts every remaining gap in any order and records one construction participation', () => {
  const ns = load();
  for (const n of [2, 3, 4]) for (const order of permutations(Array.from({ length: n }, (_, i) => i))) {
    const fixture = gameFixture(ns, n);
    const { game, slots, outcomes } = fixture;
    for (let k = 0; k < order.length; k++) {
      const region = order[k];
      const slot = game.receivingSlot(region * 70 + 20, 20, region, game.stepToken);
      assert.equal(slot, slots[region], `${n} pieces, order ${order}, region ${region} should be a live receiver`);
      const index = fixture.pieces.findIndex(p => p.r === region);
      assert.equal(game.pick(index, fixture.pieceButtons[index], game.stepToken), true, `${n} pieces, order ${order}, region ${region}`);
      assert.equal(game.todo.includes(region), false);
    }
    assert.equal(game.round, 1);
    assert.equal(outcomes.length, 1);
    assert.equal(outcomes[0].skill, 'construction');
    assert.equal(outcomes[0].evidence, 'motor_assembly_participation');
    assert.equal(Object.hasOwn(outcomes[0], 'correct'), false);
  }
});

test('jigsaw rejects wrong gaps, stale receiver tokens, and duplicate handlers', () => {
  const ns = load();
  const fixture = gameFixture(ns, 3);
  const { game, slots } = fixture;
  assert.equal(game.receivingSlot(160, 20, 2, game.stepToken), slots[2], 'hinted gap is not mandatory');
  assert.equal(game.receivingSlot(20, 20, 2, game.stepToken), null, 'coordinates must land near the requested gap');
  assert.equal(game.receivingSlot(160, 20, 2, game.stepToken - 1), null, 'old callbacks cannot highlight a gap');
  const index = fixture.pieces.findIndex(p => p.r === 2);
  const oldButton = fixture.pieceButtons[index];
  assert.equal(game.pick(index, oldButton, game.stepToken), true);
  const newToken = game.stepToken;
  assert.equal(game.pick(index, oldButton, newToken - 1), false, 'the old handler cannot place again');
  assert.equal(game.todo.includes(2), false);
  assert.equal(game.round, 0, 'duplicate callback cannot finish the board');
});

test('jigsaw ask wires each drag callback to its piece region and disables stale handlers', () => {
  const ns = load();
  const slots = [0, 1].map(r => { const el = element({ left: r * 80, top: 0, width: 50, height: 50 }); el.dataset.r = String(r); return el; });
  const board = element(), panel = element();
  let game, pieceButtons = [];
  const tray = { set innerHTML(_html) {
    pieceButtons = game.pieces.map((_, i) => { const b = element(); b.dataset.i = String(i); return b; });
  } };
  const root = { contains: node => [board, panel, ...slots, ...pieceButtons].includes(node),
    querySelector(selector) {
      if (selector === '.tb-tray') return tray;
      if (selector === '.tb-board') return board;
      const match = selector.match(/\.tb-slot\[data-r="(\d+)"\]/); return match ? slots[Number(match[1])] : null;
    },
    querySelectorAll(selector) { return selector === '.tb-slot' ? slots : selector === '.tb-piece' ? pieceButtons : []; } };
  const wired = new Map();
  ns.GardenPractice.draggable = (button, options) => { wired.set(button, options); return () => {}; };
  game = Object.create(ns.GardenPractice.FriendJigsaw.prototype);
  Object.assign(game, { alive: true, busy: false, c: 'ب', n: 2, todo: [0, 1], stepToken: 10, root,
    pieces: [{ c: 'ب', r: 0 }, { c: 'ب', r: 1 }], dragResets: [], piece: () => '<svg/>', dots: () => '',
    showReceivingSlot(el) { this.highlighted = el; }, pick(i, button, token) { this.picked = { i, button, token }; return true; } });
  const receivingSlot = game.receivingSlot.bind(game), calls = [];
  game.receivingSlot = (...args) => { calls.push(args); return receivingSlot(...args); };
  game.ask();
  const button = pieceButtons.find(b => game.pieces[Number(b.dataset.i)].r === 1);
  const callbacks = wired.get(button);
  assert.ok(callbacks, 'ask installs draggable callbacks for the piece');
  assert.equal(callbacks.enabled(), true, 'a non-hinted remaining piece can be dragged');
  callbacks.onDragMove(100, 25);
  assert.equal(calls.at(-1)[2], 1, 'drag movement asks for the dragged piece region');
  assert.equal(game.highlighted, slots[1]);
  assert.equal(callbacks.drop(100, 25), true);
  assert.equal(calls.at(-1)[2], 1, 'drop asks for the dragged piece region');
  assert.equal(game.picked.button, button);
  assert.equal(game.picked.token, 11);
  game.stepToken += 1;
  assert.equal(callbacks.enabled(), false, 'callbacks from an earlier ask are disabled');
  callbacks.onDragMove(100, 25);
  assert.equal(calls.at(-1)[3], 11, 'stale callbacks retain their captured token');
  assert.equal(game.highlighted, null, 'stale callbacks cannot highlight a receiver');
});
