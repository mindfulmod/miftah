const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function makeNode(cls = '', dataset = {}) {
  const classes = new Set(cls.split(/\s+/).filter(Boolean)), listeners = {};
  return { dataset, style: {}, listeners, classes, disabled: false, hidden: false, attrs: {}, focused: false,
    classList: { add: (...xs) => xs.forEach(x => classes.add(x)), remove: (...xs) => xs.forEach(x => classes.delete(x)), contains: x => classes.has(x), toggle(x, force) { const yes = force === undefined ? !classes.has(x) : force; yes ? classes.add(x) : classes.delete(x); return yes; } },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }, click() { if (!this.disabled) (listeners.click || []).forEach(fn => fn({ currentTarget: this })); },
    setAttribute(k, v) { this.attrs[k] = v; }, focus() { this.focused = true; }, matches(sel) { return sel === ':focus-visible' && this.focused; },
    querySelector(sel) { return this.children?.[sel] || null; }, animate() { return { cancel() {} }; } };
}
class Root {
  set innerHTML(html) {
    this.html = html; this.nodes = {};
    const lists = {};
    for (const m of html.matchAll(/<(button|span|div)[^>]*class="([^"]+)"([^>]*)>/g)) {
      const [, tag, cls, attrs] = m, ds = Object.fromEntries([...attrs.matchAll(/data-([\w-]+)="([^"]+)"/g)].map(x => [x[1], x[2]]));
      const n = makeNode(cls, ds); n.tag = tag;
      for (const prop of ['hidden','disabled']) if (new RegExp(`\\b${prop}(?:\\s|>)`).test(m[0])) n[prop] = true;
      const style = attrs.match(/style="([^"]*)"/); if (style) n.style.transform = style[1].match(/transform:([^;]+)/)?.[1] || '';
      for (const c of cls.split(/\s+/)) (this.nodes[c] ||= []).push(n);
      if (ds.i !== undefined) (lists[tag + ':' + ds.i] ||= []).push(n);
    }
    const tiles = this.nodes['pz-tile'] || [], turned = this.nodes['pz-turned'] || [], turns = this.nodes['pz-turn'] || [];
    tiles.forEach((n, i) => { n.children = { '.pz-turned': turned[i] }; });
    turns.forEach((n, i) => { n.styleForTest = true; });
    this.nodes['.'] = [];
  }
  querySelectorAll(sel) { const m = sel.match(/^\.([\w-]+)$/); return m ? this.nodes?.[m[1]] || [] : []; }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}
function setup({ beginner = false, level = 0, count = 2, chars = ['ب','ت','ج'], say = () => true, established = false } = {}) {
  const root = new Root(), outcomes = [], timers = [], done = [], speech = [];
  const providers = { level, count };
  const body = 'same';
  const ns = { LetterFriends: { FRIENDS: Object.fromEntries(chars.map(c => [c, {}])), art: c => `<svg class="lf">${c}</svg>` },
    LettersStrokes: { LETTERS: Object.fromEntries(chars.map(c => [c, [body]])) },
    LETTERS_DATA: { packs: [{ letters: chars.map(char => ({ char, arName: char })) }] },
    PracticeLearning: { profile: () => ({ choiceCount: providers.count }), level: () => providers.level, orderChars: (_ctx, pool) => pool.slice() }, GardenPractice: {} };
  const context = { window: { MiftahGame: ns }, setTimeout(fn, ms) { const t = { fn, ms, cleared: false }; timers.push(t); return t; }, clearTimeout(t) { if (t) t.cleared = true; }, Math: Object.assign(Object.create(Math), { random: () => .25 }) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'PuzzleGames.js'), 'utf8'), context);
  const ctx = { items: chars.map(display => ({ id: display, display, speak: display })), beginner, stage: { innerHTML: '', get firstElementChild() { return root; } },
    say: x => { speech.push(x); return say(x); }, reportOutcome: o => outcomes.push(o), done: () => done.push(1), sfx() {}, correct() {}, confettiAt() {}, prompt() {}, reducedMotion: () => true };
  if (established) ctx.strength = { skillProfile: () => ({ matching: { r: 12, streak: 6, sessions: ['a','b','c','d'] } }) };
  const game = new ns.GardenPractice.SameLetter(ctx);
  return { ns, ctx, root, game, outcomes, timers, done, speech, providers };
}
function rightIndex(f) { return f.game.tiles.findIndex(t => t.right); }
function choose(f, i = rightIndex(f)) { f.root.querySelectorAll('.pz-tile')[i].click(); }

test('beginner stays at two upright choices and cannot turn before matching', () => {
  const f = setup({ beginner: true, level: 2, count: 3 });
  assert.equal(f.game.level, 0); assert.equal(f.game.choiceCount, 2); assert.equal(f.game.tiles.length, 2);
  assert.ok(f.game.tiles.every(t => t.rot === 0));
  const i = rightIndex(f); f.root.querySelectorAll('.pz-turn')[i]?.click();
  assert.equal(f.game.tiles[i].rot, 0);
});

test('experienced level one choices rotate and turn adds a quarter turn each press without evidence', () => {
  const f = setup({ level: 2 });
  assert.equal(f.game.level, 1); assert.equal(f.game.tiles.length, 2); assert.ok(f.game.tiles.every(t => t.rot !== 0 && !t.flip));
  const i = rightIndex(f), before = f.game.tiles[i].rot;
  f.root.querySelectorAll('.pz-turn')[i].click(); f.root.querySelectorAll('.pz-turn')[i].click();
  assert.equal(f.game.tiles[i].rot, before + 180); assert.equal(f.outcomes.length, 0);
});

test('mirror trap remains mirrored through rotations', () => {
  const f = setup({ level: 2, chars: ['ج','ب','د'], established: true });
  assert.equal(f.game.level, 2);
  const i = f.game.tiles.findIndex(t => t.flip); assert.notEqual(i, -1);
  for (let n = 0; n < 4; n++) f.game.turn(i);
  assert.equal(f.game.tiles[i].flip, true);
  assert.match(f.root.querySelectorAll('.pz-turned')[i].style.transform, /scaleX\(-1\)/);
});

test('a correct match stays in play until explicit Next and timers cannot advance or reward it', () => {
  const f = setup({ level: 1 }); choose(f);
  assert.equal(f.game.phase, 'play'); assert.equal(f.game.round, 0);
  assert.equal(f.root.querySelector('.pz-same-next').hidden, false);
  for (const t of f.timers) if (!t.cleared) t.fn();
  assert.equal(f.game.round, 0); assert.equal(f.outcomes.length, 1); assert.equal(f.done.length, 0);
  for (const t of f.timers) if (!t.cleared) t.fn();
  assert.equal(f.game.round, 0); assert.equal(f.outcomes.length, 1); assert.equal(f.done.length, 0);
  assert.equal(f.game.continueMatch(), true); assert.equal(f.game.round, 1);
});

test('during play only the right tile can turn or replay, and free play adds no evidence', async () => {
  let release; const f = setup({ level: 1, say: () => new Promise(resolve => { release = resolve; }) });
  const good = rightIndex(f), bad = (good + 1) % f.game.tiles.length;
  choose(f, good); const reports = f.outcomes.length, before = f.game.tiles[good].rot;
  const beforeBad = f.game.tiles[bad].rot;
  assert.equal(f.game.turn(bad), false); f.game.turn(good);
  assert.equal(f.game.tiles[bad].rot, beforeBad); assert.equal(f.game.tiles[good].rot, before + 90);
  f.root.querySelectorAll('.pz-tile')[bad].click();
  assert.equal(f.speech.length, 1, 'wrong tile does not replay');
  release(true);
  for (let i = 0; i < 8 && f.game.replaying; i++) await Promise.resolve();
  assert.equal(f.game.replaying, false, 'speech completion releases the replay guard');
  f.root.querySelectorAll('.pz-tile')[good].click();
  assert.equal(f.speech.length, 2); assert.equal(f.outcomes.length, reports);
  release(true); await Promise.resolve();
});

test('wrong choice reports once, blocks repeated taps, and correction is assisted', () => {
  const f = setup({ level: 1 }); const bad = f.game.tiles.findIndex(t => !t.right), tile = f.root.querySelectorAll('.pz-tile')[bad];
  tile.click(); tile.click(); assert.equal(f.outcomes.length, 1); assert.equal(f.game.missed, true);
  assert.equal(f.outcomes[0].correct, false); choose(f);
  assert.equal(f.outcomes.length, 2); assert.equal(f.outcomes[1].correct, true); assert.equal(f.outcomes[1].assisted, true);
});

test('choice count and rotation level stay fixed for the visit after advancing to another round', () => {
  const f = setup({ level: 2, count: 3 });
  assert.equal(f.game.level, 1); assert.equal(f.game.choiceCount, 3); assert.equal(f.game.tiles.length, 3);
  choose(f); f.providers.count = 2; f.providers.level = 0;
  assert.equal(f.game.continueMatch(), true);
  assert.equal(f.game.choiceCount, 3); assert.equal(f.game.level, 1); assert.equal(f.game.tiles.length, 3);
});

test('stale turn and continue handlers are ignored; destroy blocks turns, continue, and late speech', async () => {
  let release; const f = setup({ level: 1, say: () => new Promise(resolve => { release = resolve; }) });
  const oldTurn = f.root.querySelectorAll('.pz-turn')[0], oldNext = f.root.querySelector('.pz-same-next');
  choose(f); f.game.continueMatch(); const round = f.game.round, phase = f.game.phase;
  const newRotations = f.game.tiles.map(t => t.rot);
  oldTurn.listeners.click.forEach(fn => fn()); oldNext.listeners.click.forEach(fn => fn());
  assert.equal(f.game.round, round); assert.equal(f.game.phase, phase);
  assert.deepEqual(f.game.tiles.map(t => t.rot), newRotations);
  choose(f); f.game.destroy(); const prior = f.game.tiles[0].rot;
  assert.equal(f.game.turn(0), false); assert.equal(f.game.continueMatch(), false);
  release(true); await Promise.resolve(); assert.equal(f.game.tiles[0].rot, prior);
});

test('keyboard matching focuses Next, Next focuses first new tile, and final completion fires once', () => {
  const f = setup({ level: 1, chars: ['ب','ت'] });
  const target = f.root.querySelectorAll('.pz-tile')[rightIndex(f)]; target.focus(); target.click();
  const next = f.root.querySelector('.pz-same-next'); assert.equal(next.focused, true);
  next.focus(); next.click(); assert.equal(f.root.querySelectorAll('.pz-tile')[0].focused, true);
  const current = f.root.querySelectorAll('.pz-tile')[rightIndex(f)]; current.click();
  f.game.continueMatch(); assert.equal(f.game.phase, 'finished'); f.game.finish(); assert.equal(f.done.length, 1);
});
