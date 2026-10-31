const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classList() {
  const names = new Set();
  return { add: (...xs) => xs.forEach(x => names.add(x)), remove: (...xs) => xs.forEach(x => names.delete(x)), contains: x => names.has(x), toggle(x, force) { const on = force === undefined ? !names.has(x) : force; on ? names.add(x) : names.delete(x); return on; } };
}
function node(cls = '', data = {}) {
  const listeners = {};
  return {
    className: cls, classList: classList(), dataset: data, listeners, disabled: false, isConnected: true, innerHTML: '', attrs: {}, hidden: false,
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    fire(type = 'click') { for (const fn of listeners[type] || []) fn({ target: this, preventDefault() {} }); },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    querySelector(sel) { if (sel === '.lk-seats') return this.seats || null; return null; },
    insertAdjacentHTML(_where, html) { this.innerHTML += html; }, animate() {},
    getBoundingClientRect() { return { left: Number(data.i || 0) * 120, top: 0, right: Number(data.i || 0) * 120 + 100, bottom: 100 }; },
  };
}
class Root {
  constructor() { this.isConnected = true; this.classList = classList(); this.nodes = {}; this.html = ''; }
  set innerHTML(html) {
    this.html = html; this.nodes = {};
    for (const m of html.matchAll(/<([a-z]+)[^>]*class="([^"]+)"([^>]*)>/gi)) {
      const [, tag, raw, attrs] = m, names = raw.split(/\s+/), cls = names.find(x => /^lk-/.test(x));
      if (!cls) continue;
      const data = {}; for (const a of attrs.matchAll(/data-([\w-]+)="([^"]+)"/g)) data[a[1]] = a[2];
      const el = node(cls, data); el.tagName = tag.toUpperCase(); el.classList.add(...names);
      const label = attrs.match(/aria-label="([^"]*)"/); if (label) el.setAttribute('aria-label', label[1]);
      if (/\shidden(?:\s|>|$)/.test(attrs)) el.hidden = true;
      if (cls === 'lk-bus') el.seats = node('lk-seats');
      (this.nodes[cls] ||= []).push(el);
    }
  }
  get innerHTML() { return this.html; }
  querySelectorAll(sel) { const cls = sel.slice(1).split('[')[0]; return this.nodes[cls] || []; }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}
function setup(reducedMotion = false) {
  const chars = ['ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ'];
  const friends = Object.fromEntries(chars.map(c => [c, {}]));
  const paths = Object.fromEntries(chars.map((c, i) => [c, [i < 3 ? 'family-a' : i < 6 ? 'family-b' : 'family-c']]));
  const timers = [], outcomes = [];
  const ns = {
    LetterFriends: { FRIENDS: friends, art: c => `<svg>${c}</svg>`, get: c => ({ call: `call-${c}` }) },
    LettersStrokes: { LETTERS: paths }, LETTERS_DATA: { packs: [{ letters: chars.map((char, i) => ({ char, arName: `name ${i}` })) }] },
    PracticeLearning: { plan(_ctx, pool, _skill, n) { return pool.slice(0, n); }, level() { return 0; }, profile() { return { choiceCount: 2, promptMode: 'match' }; } },
    GardenPractice: {},
  };
  const root = new Root();
  const ctx = { items: chars.map((display, i) => ({ id: `real-${i}`, display, speak: `name ${i}` })), known: [], stage: { set innerHTML(h) { root.innerHTML = h; }, get firstElementChild() { return root; }, contains(el) { return el === root; } }, reducedMotion: () => reducedMotion, reportOutcome: o => outcomes.push(o), beginRound() {}, say() { return true; }, sfx() {}, correct() {}, confettiAt() {}, done() {}, cancel() {}, pet: { cheer() {}, watch() {} } };
  const context = { window: { MiftahGame: ns }, setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {}, Math: Object.assign(Object.create(Math), { random: () => 0.37 }) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'LookGames.js'), 'utf8'), context);
  return { ns, ctx, root, timers, outcomes };
}
function busFor(game, root, letter) { const i = game.buses.indexOf(letter); return { i, bus: root.querySelectorAll('.lk-bus')[i] }; }
function timer(timers, ms) { const t = timers.find(x => x.ms === ms); assert.ok(t, `expected a ${ms}ms timer`); return t; }

test('FamilyBuses help reveals shared shape and marks the next answer assisted', () => {
  const { ns, ctx, root, outcomes } = setup(); const game = new ns.GardenPractice.FamilyBuses(ctx);
  root.querySelector('.lk-family-help').fire();
  assert.equal(root.querySelector('.lk-family-peer').hidden, false);
  assert.equal(root.classList.contains('is-comparing'), true);
  assert.equal(root.querySelectorAll('.lk-bus').find(b => b.dataset.i === String(game.buses.indexOf(game.want))).classList.contains('is-family'), true);
  assert.equal(game.missed, true);
  game.pick(...Object.values(busFor(game, root, game.want)));
  assert.equal(outcomes[0].assisted, true);
  assert.equal(game.busy, true);
  assert.equal(game.round, 0, 'a correct answer does not advance the round');
});

test('correct answer shows evidence without marking it assisted and waits for the learner to depart', () => {
  const { ns, ctx, root, timers, outcomes } = setup(); const game = new ns.GardenPractice.FamilyBuses(ctx);
  const { i, bus } = busFor(game, root, game.want);
  game.pick(i, bus);
  assert.equal(outcomes[0].assisted, false);
  assert.equal(root.querySelector('.lk-family-peer').hidden, false);
  assert.equal(game.readyToLeave, false);
  assert.equal(timers.some(t => t.ms === 2200), false, 'no automatic next-round timer is scheduled');
  timer(timers, 320).fn();
  assert.equal(game.readyToLeave, true);
  assert.equal(bus.disabled, false);
  assert.equal(bus.classList.contains('is-ready'), true);
  assert.equal(bus.attrs['aria-label'], 'Send this bus on its way');
});

test('wrong answer reveals the comparison, then permits recovery with assisted evidence', () => {
  const { ns, ctx, root, timers, outcomes } = setup(); const game = new ns.GardenPractice.FamilyBuses(ctx);
  const wrong = game.buses.findIndex(x => x !== game.want);
  assert.equal(game.pick(wrong, root.querySelectorAll('.lk-bus')[wrong]), true);
  assert.equal(game.missed, true);
  assert.equal(root.classList.contains('is-comparing'), true);
  assert.equal(root.querySelector('.lk-family-peer').hidden, false);
  timer(timers, 650).fn();
  assert.equal(game.busy, false);
  const right = busFor(game, root, game.want);
  game.pick(right.i, right.bus);
  assert.equal(outcomes[0].correct, false);
  assert.equal(outcomes[1].correct, true);
  assert.equal(outcomes[1].assisted, true);
});

test('depart is explicit, guarded against repeats and stale callbacks, and starts a clean next round', () => {
  const { ns, ctx, root, timers } = setup(); const game = new ns.GardenPractice.FamilyBuses(ctx);
  const token = game.roundToken, { i, bus } = busFor(game, root, game.want);
  game.pick(i, bus); timer(timers, 320).fn();
  bus.fire();
  assert.equal(game.readyToLeave, false);
  assert.equal(game.round, 1);
  assert.equal(game.depart(token, root), false, 'duplicate departure is ignored');
  const nextTimer = timer(timers, 2200);
  assert.equal(game.roundToken, token);
  nextTimer.fn();
  assert.notEqual(game.roundToken, token);
  assert.equal(game.root.classList.contains('is-comparing'), false);
  assert.equal(game.readyToLeave, false);
  assert.equal(game.boardedBus, null);
  assert.equal(game.depart(token, root), false, 'stale departure callbacks cannot affect the new board');
  assert.equal(game.showFamily(token, root), false, 'stale help callbacks cannot change the new board');
});

test('reduced motion shortens the explicit departure delay', () => {
  const { ns, ctx, root, timers } = setup(true); const game = new ns.GardenPractice.FamilyBuses(ctx);
  const { i, bus } = busFor(game, root, game.want);
  game.pick(i, bus); timer(timers, 320).fn(); bus.fire();
  assert.ok(timers.some(t => t.ms === 220));
  assert.equal(timers.some(t => t.ms === 2200), false);
});
