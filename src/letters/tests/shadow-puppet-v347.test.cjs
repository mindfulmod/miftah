const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function makeNode(tag, cls, attrs = '') {
  const listeners = {}, classes = new Set(cls.split(/\s+/).filter(Boolean));
  const dataset = Object.fromEntries([...attrs.matchAll(/data-([\w-]+)="([^"]+)"/g)].map(m => [m[1], m[2]]));
  const node = { tag, dataset, listeners, style: { left: '', top: '', setProperty() {} }, disabled: false, hidden: false,
    isConnected: true, attributes: {}, children: [], textContent: '',
    classList: { add: (...xs) => xs.forEach(x => classes.add(x)), remove: (...xs) => xs.forEach(x => classes.delete(x)), contains: x => classes.has(x), toggle(x, force) { const on = force === undefined ? !classes.has(x) : force; on ? classes.add(x) : classes.delete(x); return on; } },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    fire(type, event = {}) { for (const fn of listeners[type] || []) fn({ preventDefault() {}, stopPropagation() {}, ...event, type, target: event.target || this }); },
    matches(selector) { return selector === ':focus-visible' && this.focusVisible === true; },
    focus() { this.focused = true; }, setAttribute(k, v) { this.attributes[k] = String(v); }, getAttribute(k) { return this.attributes[k] ?? null; },
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
    querySelectorAll(selector) { return descendants(this).filter(n => matches(n, selector)); },
    animate() { this.animateCalls = (this.animateCalls || 0) + 1; return { cancel: () => { node.cancelCalls = (node.cancelCalls || 0) + 1; } }; },
    getBoundingClientRect() { return this.rect || { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 }; },
  };
  for (const m of attrs.matchAll(/\b(aria-[\w-]+)="([^"]*)"/g)) node.attributes[m[1]] = m[2];
  Object.defineProperty(node, 'innerHTML', { get() { return node._html || ''; }, set(html) { node._html = html; parseInto(node, html); } });
  node.className = cls;
  if (/\bhidden(?:\s|>)/.test(attrs)) node.hidden = true;
  return node;
}
function descendants(node) { return (node.children || []).flatMap(c => [c, ...descendants(c)]); }
function parseInto(parent, html) {
  parent.children = [];
  const stack = [parent];
  for (const m of html.matchAll(/<(button|span|div|i|svg)([^>]*)>|<\/(button|span|div|i|svg)>/g)) {
    if (m[3]) { if (stack.length > 1) stack.pop(); continue; }
    const tag = m[1], attrs = m[2], cls = attrs.match(/\bclass="([^"]+)"/)?.[1] || '';
    const node = makeNode(tag, cls, attrs); stack.at(-1).children.push(node);
    if (!['i', 'svg'].includes(tag)) stack.push(node);
  }
}
function matches(node, selector) {
  const cls = selector.match(/^\.([\w-]+)/)?.[1];
  const data = selector.match(/\[data-([\w-]+)="([^"]+)"\]/);
  return (!cls || node.classList.contains(cls)) && (!data || node.dataset[data[1]] === data[2]);
}
class Root {
  constructor() { this._html = ''; this.children = []; }
  set innerHTML(html) {
    this._html = html; parseInto(this, html);
  }
  get innerHTML() { return this._html; }
  querySelectorAll(selector) { return descendants(this).filter(n => matches(n, selector)); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}
function fixture({ level = 0, reduced = true, choiceCount } = {}) {
  const timers = [], outcomes = [], begins = [], dones = [], drags = [], chars = ['ا', 'ب', 'ت', 'ث'];
  const root = new Root();
  const ns = { LetterFriends: { FRIENDS: Object.fromEntries(chars.map(c => [c, {}])), art: c => `<svg class="lf">${c}</svg>`, item: c => ({ display: c }), get: () => ({ call: 'chime' }) },
    LETTERS_DATA: { packs: [{ letters: chars.map(char => ({ char, arName: char })) }] },
    PracticeLearning: { orderChars: (_ctx, pool) => pool.slice(), profile: () => ({ choiceCount: choiceCount || 2 }), level: () => level },
    GardenPractice: { draggable(node, options) { drags.push({ node, options }); return () => { node.resetCount = (node.resetCount || 0) + 1; }; } } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'ShadowGames.js'), 'utf8'), {
    window: { MiftahGame: ns }, setTimeout(fn, ms) { const timer = { fn, ms, cleared: false, fired: false }; timers.push(timer); return timer; },
    clearTimeout(timer) { if (timer) timer.cleared = true; }, Math: Object.assign(Object.create(Math), { random: () => 0.2 }),
  });
  const ctx = { items: chars.map(display => ({ id: display, display })), known: [], reducedMotion: () => reduced,
    stage: { clientWidth: 600, clientHeight: 400, set innerHTML(v) { this._html = v; this.firstElementChild = root; }, get innerHTML() { return this._html; } },
    reportOutcome: o => outcomes.push(o), beginRound: (...args) => begins.push(args), done: () => dones.push(true),
    say() { return true; }, sfx() {}, correct() {}, confettiAt() {}, prompt() {}, cancel() {}, pet: { cheer() {} } };
  const game = new ns.GardenPractice.LetterShadows(ctx);
  return { ns, ctx, game, root, timers, outcomes, begins, dones, drags };
}
function drain(f) { for (const t of f.timers) if (!t.cleared && !t.fired) { t.fired = true; t.fn(); } }
function matchTarget(f) {
  const g = f.game;
  for (const c of g.left.slice()) f.root.querySelectorAll('.pz-tile').find(b => g.offered[Number(b.dataset.i)] === c).fire('click');
}
function playRound(f) {
  matchTarget(f);
  assert.equal(f.game.phase, 'playing');
  f.root.querySelector('.sh-next').fire('click');
}

test('matching all targets opens a persistent puppet theatre and timed polish never advances it', () => {
  const f = fixture({ level: 2 }); matchTarget(f);
  assert.equal(f.game.phase, 'playing'); assert.equal(f.game.busy, true);
  assert.equal(f.root.querySelectorAll('.sh-puppet').length, 2);
  const round = f.game.round, reports = f.outcomes.length, begins = f.begins.length;
  drain(f);
  assert.equal(f.game.round, round); assert.equal(f.game.phase, 'playing');
  assert.equal(f.outcomes.length, reports); assert.equal(f.begins.length, begins);
  assert.equal(f.outcomes.filter(o => o.correct).length, 2);
});

test('puppet play, movement, and light changes are child-led play with familiar targets', () => {
  const f = fixture(); const targets = f.game.targets.slice(); matchTarget(f);
  const [puppet] = f.root.querySelectorAll('.sh-puppet'), button = f.root.querySelector('.sh-light-switch');
  const reports = f.outcomes.length, begins = f.begins.length;
  puppet.rect = { left: 0, top: 0, right: 20, bottom: 20, width: 20, height: 20 };
  f.root.querySelector('.sh-screen').rect = { left: 0, top: 0, right: 400, bottom: 300, width: 400, height: 300 };
  puppet.fire('click'); puppet.fire('keydown', { key: 'ArrowRight' }); button.fire('click');
  assert.deepEqual(f.game.targets, targets); assert.equal(f.outcomes.length, reports); assert.equal(f.begins.length, begins);
  assert.equal(f.game.poses[0].x, 56); assert.equal(button.getAttribute('aria-pressed'), 'true');
});

test('real puppet drags clamp to the theatre bounds and reject outside drops', () => {
  const f = fixture(); matchTarget(f);
  const screen = f.root.querySelector('.sh-screen'), puppet = f.root.querySelector('.sh-puppet');
  screen.rect = { left: 100, top: 50, right: 500, bottom: 350, width: 400, height: 300 };
  puppet.rect = { left: 0, top: 0, right: 40, bottom: 60, width: 40, height: 60 };
  const drag = f.drags.find(d => d.node === puppet).options;
  assert.equal(drag.drop(50, 40), false);
  assert.equal(drag.drop(900, 900), false);
  assert.equal(drag.drop(510, 340, { left: 850, top: 800, width: 40, height: 60 }), true);
  assert.ok(f.game.poses[0].x <= 81 && f.game.poses[0].x >= 19);
  assert.ok(f.game.poses[0].y <= 67 && f.game.poses[0].y >= 30);
});

test('puppet arrow keys prevent page movement and move the actual puppet through bounded poses', () => {
  const f = fixture(); matchTarget(f); const puppet = f.root.querySelector('.sh-puppet');
  puppet.rect = { left: 0, top: 0, right: 20, bottom: 20, width: 20, height: 20 };
  f.root.querySelector('.sh-screen').rect = { left: 0, top: 0, right: 400, bottom: 300, width: 400, height: 300 };
  let prevented = 0; puppet.fire('keydown', { key: 'ArrowLeft', preventDefault() { prevented++; } });
  assert.equal(prevented, 1); assert.equal(f.game.poses[0].x, 44); assert.equal(puppet.style.left, '44%');
  puppet.fire('keydown', { key: 'Enter', preventDefault() { prevented++; } }); assert.equal(prevented, 1);
});

test('the real light button updates pressed state and accessible name in both directions', () => {
  const f = fixture(); matchTarget(f); const button = f.root.querySelector('.sh-light-switch');
  assert.equal(button.getAttribute('aria-pressed'), 'false');
  button.fire('click'); assert.equal(button.getAttribute('aria-pressed'), 'true'); assert.equal(button.getAttribute('aria-label'), 'Light up the puppets');
  button.fire('click'); assert.equal(button.getAttribute('aria-pressed'), 'false'); assert.equal(button.getAttribute('aria-label'), 'Show puppet shadows');
});

test('wrong matching remains honest, right matches report form evidence, and level choice counts stay fixed', () => {
  const beginner = fixture({ level: 0 }), wrong = beginner.root.querySelectorAll('.pz-tile').find(b => beginner.game.offered[Number(b.dataset.i)] !== beginner.game.left[0]);
  wrong.fire('click'); assert.equal(beginner.outcomes[0].correct, false); assert.equal(beginner.outcomes[0].skill, 'letter-form');
  assert.equal(beginner.outcomes[0].evidence, 'supported_visible_matching'); assert.equal(beginner.game.missed, true);
  assert.equal(beginner.game.offered.length, 2); assert.equal(beginner.game.targets.length, 1);
  const advanced = fixture({ level: 2 }); assert.equal(advanced.game.offered.length, 3); assert.equal(advanced.game.targets.length, 2);
  matchTarget(advanced); assert.ok(advanced.outcomes.every(o => o.correct && o.evidence === 'supported_visible_matching'));
});

test('stale matching, puppet, and Next listeners cannot affect later rounds; final completion fires once', () => {
  const f = fixture(); const staleTile = f.root.querySelector('.pz-tile'); matchTarget(f);
  const oldPuppet = f.root.querySelector('.sh-puppet'), oldNext = f.root.querySelector('.sh-next'); oldNext.fire('click');
  const round = f.game.round, reports = f.outcomes.length, begins = f.begins.length;
  staleTile.listeners.click.forEach(fn => fn()); oldPuppet.listeners.click.forEach(fn => fn()); oldNext.listeners.click.forEach(fn => fn());
  assert.equal(f.game.round, round); assert.equal(f.outcomes.length, reports); assert.equal(f.begins.length, begins);
  while (f.game.round < f.game.rounds) playRound(f);
  assert.equal(f.game.phase, 'finished'); f.game.finish(); drain(f);
  assert.equal(f.dones.length, 1);
});

test('reduced motion skips puppet waves and destroy cancels waves, timers, and active drags', () => {
  const still = fixture({ reduced: true }); matchTarget(still); const puppet = still.root.querySelector('.sh-puppet');
  puppet.fire('click'); assert.equal(puppet.querySelector('.sh-puppet-art').animateCalls || 0, 0);
  const moving = fixture({ reduced: false }); matchTarget(moving); const movingPuppet = moving.root.querySelector('.sh-puppet');
  movingPuppet.fire('click'); const art = movingPuppet.querySelector('.sh-puppet-art'); assert.equal(art.animateCalls, 1);
  const drag = moving.drags.find(d => d.node === movingPuppet).options; drag.onDragStart();
  moving.game.destroy();
  assert.equal(art.cancelCalls, 1); assert.ok(movingPuppet.resetCount >= 1);
  assert.ok(moving.timers.every(t => t.cleared));
});
