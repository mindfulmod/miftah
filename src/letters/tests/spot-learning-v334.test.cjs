const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classes() {
  const set = new Set();
  return { add: (...xs) => xs.forEach(x => set.add(x)), remove: (...xs) => xs.forEach(x => set.delete(x)), contains: x => set.has(x), toggle(x, force) { const on = force === undefined ? !set.has(x) : force; on ? set.add(x) : set.delete(x); return on; } };
}
function el(cls, data = {}) {
  const listeners = {};
  return { className: cls, classList: classes(), dataset: data, listeners, attrs: {}, disabled: false, hidden: false, isConnected: true, innerHTML: '',
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }, fire(type = 'click') { for (const fn of listeners[type] || []) fn({ target: this, preventDefault() {} }); },
    setAttribute(k, v) { this.attrs[k] = String(v); }, querySelector(sel) { return this.children?.[sel] || null; }, animate() {} };
}
class Root {
  constructor() { this.isConnected = true; this.nodes = {}; this.html = ''; }
  set innerHTML(html) {
    this.html = html; this.nodes = {};
    for (const m of html.matchAll(/<([a-z]+)[^>]*class="([^"]+)"([^>]*)>/gi)) {
      const [, tag, raw, attrs] = m;
      for (const cls of raw.split(/\s+/)) {
        if (!cls.startsWith('lk-')) continue;
        const data = {}; for (const a of attrs.matchAll(/data-([\w-]+)="([^"]+)"/g)) data[a[1]] = a[2];
        const n = el(cls, data); n.tagName = tag.toUpperCase();
        for (const a of attrs.matchAll(/aria-label="([^"]*)"/g)) n.setAttribute('aria-label', a[1]);
        if (/\bhidden\b/.test(attrs)) n.hidden = true;
        if (/\bdisabled\b/.test(attrs)) n.disabled = true;
        if (cls === 'lk-stone') n.children = { '.lk-letter': el('lk-letter') };
        (this.nodes[cls] ||= []).push(n);
      }
    }
  }
  get innerHTML() { return this.html; }
  querySelectorAll(sel) {
    const [name, attr] = sel.slice(1).split('['); let list = this.nodes[name] || [];
    if (attr) { const [key, raw] = attr.replace(']', '').split('='); const value = raw?.replaceAll('"', ''); list = list.filter(n => String(n.dataset[key.replace('data-', '')]) === value); }
    return list;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}
function setup(level = 0, random = 0.37) {
  const chars = ['ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ'];
  const paths = Object.fromEntries(chars.map((c, i) => [c, [i < 3 ? 'a' : i < 6 ? 'b' : 'c']]));
  const timers = [], outcomes = [], root = new Root();
  const ctx = { items: chars.map((display, i) => ({ id: `item-${i}`, display })), known: [], stage: { set innerHTML(s) { root.innerHTML = s; }, get firstElementChild() { return root; }, contains: x => x === root },
    reducedMotion: () => true, reportOutcome: o => outcomes.push(o), beginRound() {}, say() {}, sfx() {}, correct() {}, confettiAt() {}, done() {}, cancel() {}, pet: { cheer() {}, watch() {} } };
  const ns = { LetterFriends: { FRIENDS: Object.fromEntries(chars.map(c => [c, {}])), art: c => `<svg>${c}</svg>`, get: () => ({ call: 'call' }) }, LettersStrokes: { LETTERS: paths },
    LETTERS_DATA: { packs: [{ letters: chars.map((char, i) => ({ char, arName: `name ${i}` })) }] }, PracticeLearning: { plan: (_ctx, pool, _skill, n) => pool.slice(0, n), level: () => level, profile: () => ({ choiceCount: 2 }) } };
  const math = Object.create(Math); math.random = () => random;
  const context = { window: { MiftahGame: ns }, Math: math, setTimeout(fn, ms) { const t = { fn, ms, cleared: false, ran: false }; timers.push(t); return t; }, clearTimeout(t) { if (t) t.cleared = true; } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'LookGames.js'), 'utf8'), context);
  return { ns, ctx, root, timers, outcomes };
}
function run(timer) { if (!timer || timer.cleared || timer.ran) return false; timer.ran = true; timer.fn(); return true; }
function timerAt(timers, ms) { return timers.find(t => t.ms === ms && !t.ran && !t.cleared); }

test('beginner and advanced choose an eligible changed position for their difficulty', () => {
  for (const level of [0, 1]) for (const seed of [0.01, 0.19, 0.37, 0.63, 0.91]) {
    const { ns, ctx } = setup(level, seed);
    const game = new ns.GardenPractice.SpotChange(ctx);
    assert.equal(level ? game.level : game.level, level);
    assert.notEqual(game.wasItem, game.intoItem);
    const key = c => ns.LettersStrokes.LETTERS[c].join('|');
    const unused = game.known.filter(i => !game.beforeItems.includes(i));
    const siblings = unused.filter(i => key(i.display) === key(game.was));
    const differentBodies = unused.filter(i => key(i.display) !== key(game.was));
    if (!level && differentBodies.length) assert.ok(differentBodies.some(i => key(i.display) === key(game.into)), `beginner chose a different-body replacement, seed=${seed}`);
    if (level && siblings.length) assert.ok(siblings.some(i => i.id === game.intoItem.id), `advanced kept the same-body replacement preference, seed=${seed}`);
  }
});

test('replay returns to an assisted look and only explicit blink restores finding', () => {
  const { ns, ctx, root, timers, outcomes } = setup(); const game = new ns.GardenPractice.SpotChange(ctx);
  const stones = root.querySelectorAll('.lk-stone');
  assert.equal(game.phase, 'look'); assert.ok(stones.every(s => s.disabled));
  assert.equal(timerAt(timers, 1500), undefined);
  root.querySelector('.lk-eye').fire(); run(timerAt(timers, 900));
  assert.equal(game.phase, 'find'); assert.ok(stones.every(s => !s.disabled));
  root.querySelector('.lk-eye').fire();
  assert.equal(game.phase, 'look'); assert.equal(game.missed, true); assert.ok(stones.every(s => s.disabled));
  assert.equal(timerAt(timers, 1500), undefined);
  assert.equal(game.pick(game.at, stones[game.at]), false);
  root.querySelector('.lk-eye').fire(); run(timerAt(timers, 900));
  assert.equal(game.phase, 'find'); assert.ok(stones.every(s => !s.disabled));
  const wrong = (game.at + 1) % stones.length; game.pick(wrong, stones[wrong]); run(timerAt(timers, 650));
  game.pick(game.at, stones[game.at]);
  assert.equal(outcomes.length, 2); assert.equal(outcomes[0].assisted, true); assert.equal(outcomes[0].affectsStrength, false);
  assert.equal(outcomes[1].assisted, true); assert.equal(outcomes[1].affectsStrength, false);
});

test('correct comparison waits for continue, shows the changed pair, and advances once', () => {
  const { ns, ctx, root, timers } = setup(); const game = new ns.GardenPractice.SpotChange(ctx);
  root.querySelector('.lk-eye').fire(); run(timerAt(timers, 900));
  const oldToken = game.roundToken, stone = root.querySelectorAll('.lk-stone')[game.at];
  game.pick(game.at, stone);
  assert.equal(game.phase, 'compare'); assert.equal(game.busy, true); assert.equal(root.querySelector('.lk-row').hidden, true);
  const pair = root.querySelector('.lk-change-pair');
  assert.equal(pair.hidden, false); assert.match(pair.dataset.change, /^(body|dots)$/);
  assert.match(root.html, new RegExp(`Before: ${game.was}`)); assert.match(root.html, new RegExp(`After: ${game.into}`));
  assert.equal(game.continue(), false); run(timerAt(timers, 320));
  assert.equal(game.busy, false); assert.equal(game.phase, 'compare');
  assert.equal(game.continue(), true); assert.equal(game.roundToken, oldToken + 1); assert.equal(game.phase, 'look');
  assert.equal(game.continue(oldToken, root), false);
});

test('duplicate actions, stale callbacks, and destroyed timers cannot change a later board', () => {
  const { ns, ctx, root, timers, outcomes } = setup(); const game = new ns.GardenPractice.SpotChange(ctx);
  const firstToken = game.roundToken, oldRoot = root;
  assert.equal(game.replayPrompt(firstToken, oldRoot), false);
  game.blink(firstToken, oldRoot); assert.equal(game.blink(firstToken, oldRoot), false);
  const pending = timerAt(timers, 900); game.destroy(); assert.equal(run(pending), false);
  assert.equal(game.replayPrompt(firstToken, oldRoot), false); assert.equal(game.continue(firstToken, oldRoot), false);
  assert.equal(outcomes.length, 0);
});
