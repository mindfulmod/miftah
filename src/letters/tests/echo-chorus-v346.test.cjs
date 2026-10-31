const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function el(cls = '', dataset = {}) {
  const classes = new Set(cls.split(/\s+/).filter(Boolean)), listeners = {};
  return { dataset, style: {}, listeners, disabled: false, hidden: false, innerHTML: '',
    classList: { add: (...xs) => xs.forEach(x => classes.add(x)), remove: (...xs) => xs.forEach(x => classes.delete(x)), contains: x => classes.has(x), toggle(x, force) { const yes = force === undefined ? !classes.has(x) : force; yes ? classes.add(x) : classes.delete(x); return yes; } },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }, click() { if (!this.disabled) (listeners.click || []).forEach(fn => fn()); },
    matches: () => false, focus() {}, animate() {} };
}
class Root {
  set innerHTML(html) {
    this.html = html; this.nodes = {};
    for (const m of html.matchAll(/<(button|span|div|i)[^>]*class="([^"]+)"([^>]*)>/g)) {
      const [, , classes, attrs] = m, data = Object.fromEntries([...attrs.matchAll(/data-([\w-]+)="([^"]+)"/g)].map(x => [x[1], x[2]]));
      const n = el(classes, data); n.classList.add(...classes.split(/\s+/));
      for (const key of ['hidden']) if (new RegExp(`\\b${key}(?:\\s|>)`).test(m[0])) n[key] = true;
      const tag = m[1], primary = classes.split(/\s+/).find(c => ['pz-tile','pz-slot','pz-singer','pz-singers','pz-echo-actions','pz-board','pz-echo-replay','pz-echo-next'].includes(c));
      if (primary) (this.nodes[primary] ||= []).push(n);
    }
  }
  querySelectorAll(s) { return this.nodes?.[s.slice(1)] || []; }
  querySelector(s) { return this.querySelectorAll(s)[0] || null; }
}
function setup(config = {}) {
  const timers = [], outcomes = [], begins = [], chars = ['ا','ب','ت','ث'];
  const doc = { activeElement: null, body: {} };
  const ns = { LetterFriends: { FRIENDS: Object.fromEntries(chars.map(c => [c, {}])), art: c => `<svg>${c}</svg>` },
    LettersStrokes: { LETTERS: Object.fromEntries(chars.map(c => [c, []])) },
    LETTERS_DATA: { packs: [{ letters: chars.map(c => ({ char: c, arName: c })) }] },
    PracticeLearning: { profile: (_ctx, _item, _skill) => ({ choiceCount: config.choiceCount || 2, promptMode: config.mode || 'match' }), level: () => 0, orderChars: (_ctx, pool) => pool.slice() },
    GardenPractice: {} };
  const context = { window: { MiftahGame: ns }, document: doc, setTimeout(fn, ms) { const t = { fn, ms, cleared: false, fired: false }; timers.push(t); return t; }, clearTimeout(t) { if (t) t.cleared = true; }, Math: Object.assign(Object.create(Math), { random: () => 0.2 }) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'PuzzleGames.js'), 'utf8'), context);
  const root = new Root();
  const ctx = { items: chars.map(c => ({ id: c, display: c, speak: c })), known: [], stage: { set innerHTML(v) { this._html = v; this.firstElementChild = root; }, get innerHTML() { return this._html; } },
    reportOutcome: o => outcomes.push(o), beginRound: (...a) => begins.push(a), say: () => true, canListen: () => true, sfx() {}, correct() {}, confettiAt() {}, done() { config.done = (config.done || 0) + 1; }, cancel() {}, pet: { cheer() {} } };
  const game = new ns.GardenPractice.EchoParade(ctx);
  return { game, root, timers, outcomes, begins, ctx, config };
}
async function micro(n = 12) { for (let i = 0; i < n; i++) await Promise.resolve(); }
async function fire(f, predicate = () => true) {
  const t = f.timers.find(x => !x.cleared && !x.fired && predicate(x));
  assert.ok(t, 'expected active timer'); t.fired = true; t.fn(); await micro();
}
async function drainLive(f) {
  for (let i = 0; i < 40; i++) {
    const t = f.timers.find(x => !x.cleared && !x.fired);
    if (!t) return;
    t.fired = true; t.fn(); await micro();
  }
  assert.fail('timer drain exceeded its bounded limit');
}
async function ready(f) { await fire(f, t => t.ms === 500); for (let i = 0; i < 3 && f.game.busy; i++) { await micro(); const t = f.timers.find(x => !x.cleared && !x.fired && x.ms === 260); if (t) { t.fired = true; t.fn(); await micro(); } } assert.equal(f.game.phase, 'answering'); }
function answer(f) { const g = f.game, tile = f.root.querySelectorAll('.pz-tile').find(b => Number(b.dataset.i) === g.board.indexOf(g.seq[g.at])); assert.ok(tile); tile.click(); }
async function chorus(f) { await ready(f); for (let i = 0; i < f.game.seq.length; i++) answer(f); }
async function clickNext(f) { f.root.querySelector('.pz-echo-next').click(); await micro(); }

test('completed chorus stays indefinitely until the real Next handler is clicked', async () => {
  const f = setup(); await chorus(f); assert.equal(f.game.phase, 'complete');
  assert.equal(f.root.querySelector('.pz-board').hidden, true); assert.equal(f.outcomes.length, f.game.len);
  await drainLive(f); assert.equal(f.game.round, 0); assert.equal(f.game.phase, 'complete');
  await clickNext(f); assert.equal(f.game.round, 1); assert.equal(f.game.phase, 'listening');
});

test('encore speech reports nothing and cannot begin another question', async () => {
  const f = setup(); await chorus(f); const reports = f.outcomes.length, begins = f.begins.length;
  f.root.querySelector('.pz-echo-replay').click(); await readyEncore(f);
  assert.equal(f.game.phase, 'complete'); assert.equal(f.outcomes.length, reports); assert.equal(f.begins.length, begins);
});
async function readyEncore(f) { await micro(); for (let i = 0; i < 3; i++) { const t = f.timers.find(x => !x.cleared && !x.fired && x.ms === 260); if (!t) break; t.fired = true; t.fn(); await micro(); } }

test('Next during pending encore cancels late speech and stale encore resolution', async () => {
  const f = setup(); await chorus(f); let resolve; f.ctx.say = () => new Promise(r => { resolve = r; });
  f.root.querySelector('.pz-echo-replay').click(); await micro(); assert.equal(f.game.phase, 'encore');
  await clickNext(f); assert.equal(f.game.round, 1); resolve?.(true); await micro(20);
  assert.equal(f.game.round, 1); assert.equal(f.game.phase, 'listening');
});

test('a miss after a correct prefix reveals the line and changes reports to supported matching-memory', async () => {
  const f = setup({ mode: 'listen', choiceCount: 2 }); await ready(f);
  answer(f); const prefix = f.game.at; const wrong = f.root.querySelectorAll('.pz-tile').find(b => f.game.board[Number(b.dataset.i)] !== f.game.seq[f.game.at]); wrong.click();
  assert.equal(f.game.at, prefix); assert.equal(f.game.missed, true); assert.equal(f.game.promptSkill, 'matching-memory');
  assert.equal(f.outcomes.at(-1).evidence, 'independent_listening');
  assert.equal(f.root.querySelector('.pz-singers').classList.contains('is-hidden'), false);
  answer(f); assert.equal(f.outcomes.at(-1).evidence, 'supported_visible_matching'); assert.equal(f.outcomes.at(-1).assisted, true);
  assert.equal(f.outcomes.at(-1).skill, 'matching-memory');
});

test('supported replay retains accepted slots and current answer position', async () => {
  const f = setup(); await ready(f); answer(f); const accepted = f.game.at;
  f.game.replayPrompt(); await micro();
  for (let i = 0; i < 3 && f.game.busy; i++) { const t = f.timers.find(x => !x.cleared && !x.fired && x.ms === 260); if (t) { t.fired = true; t.fn(); await micro(); } }
  assert.equal(f.game.phase, 'answering');
  assert.equal(f.game.at, accepted); assert.ok(f.root.querySelectorAll('.pz-slot')[0].classList.contains('is-full'));
  assert.equal(f.game.missed, true); assert.equal(f.game.promptSkill, 'matching-memory');
  assert.equal(f.root.querySelectorAll('.pz-singer')[0].classList.contains('is-accepted'), true);
  assert.equal(f.root.querySelectorAll('.pz-singer')[accepted].classList.contains('is-current'), true);
});

test('clean listen answers report independent evidence until assistance is needed', async () => {
  const f = setup({ mode: 'listen' }); await ready(f); answer(f);
  assert.equal(f.outcomes[0].evidence, 'independent_listening'); assert.equal(f.outcomes[0].assisted, false);
  assert.equal(f.begins.at(-1)[1], f.game.baseSkill);
});

test('adjacent rounds keep target set and length while changing sequence order', async () => {
  const f = setup(); await chorus(f); const first = f.game.seq.slice(), board = f.game.board.slice();
  await clickNext(f); await ready(f);
  assert.equal(f.game.seq.length, first.length); assert.deepEqual([...f.game.seq].sort(), [...first].sort());
  assert.notDeepEqual(f.game.seq, first); assert.equal(f.game.board.length, board.length);
});

test('old tile, replay, and Next handlers are ignored after a new round renders', async () => {
  const f = setup(); await chorus(f); const oldTile = f.root.querySelectorAll('.pz-tile')[0], replay = f.root.querySelector('.pz-echo-replay'), next = f.root.querySelector('.pz-echo-next');
  await clickNext(f); await ready(f); const at = f.game.at, reports = f.outcomes.length, round = f.game.round;
  oldTile.listeners.click.forEach(fn => fn()); replay.click(); next.click();
  assert.equal(f.game.round, round); assert.equal(f.game.at, at); assert.equal(f.outcomes.length, reports);
});

test('four real rounds finish once even if finish is requested again', async () => {
  const f = setup();
  for (let r = 0; r < 4; r++) { await chorus(f); await clickNext(f); }
  assert.equal(f.game.phase, 'finished'); await fire(f, t => t.ms === 800); assert.equal(f.config.done, 1);
  f.game.finish(); await drainLive(f); assert.equal(f.config.done, 1);
});

test('destroying during deferred encore speech prevents late unlock, reports, or completion', async () => {
  const f = setup(); await chorus(f); let resolve; f.ctx.say = () => new Promise(r => { resolve = r; });
  f.root.querySelector('.pz-echo-replay').click(); await micro(); assert.equal(f.game.phase, 'encore');
  const reports = f.outcomes.length; f.game.destroy(); resolve(true); await micro(); await drainLive(f);
  assert.equal(f.game.alive, false); assert.equal(f.game.phase, 'encore');
  assert.equal(f.outcomes.length, reports); assert.equal(f.config.done, undefined);
});

test('rejected and unavailable speech falls back to visible matching', async () => {
  const rejected = setup(); rejected.ctx.say = () => Promise.reject(Error('speech unavailable')); await ready(rejected);
  assert.equal(rejected.game.phase, 'answering'); assert.equal(rejected.game.heard, false); assert.equal(rejected.game.promptSkill, 'matching-memory');
  const missing = setup(); missing.ctx.canListen = () => false; await ready(missing);
  assert.equal(missing.game.phase, 'answering'); assert.equal(missing.game.heard, false); assert.equal(missing.game.promptMode, 'match');
});
