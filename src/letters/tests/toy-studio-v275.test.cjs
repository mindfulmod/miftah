const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classes() {
  const values = new Set();
  return { add: (...xs) => xs.forEach(x => values.add(x)), remove: (...xs) => xs.forEach(x => values.delete(x)),
    contains: x => values.has(x), toggle(x, force) { const on = force === undefined ? !values.has(x) : force; on ? values.add(x) : values.delete(x); return on; } };
}
function element(rect = { left: 100, top: 100, width: 40, height: 40 }, connected = true) {
  return { classList: classes(), dataset: {}, style: {}, rect, isConnected: connected, disabled: false,
    getBoundingClientRect() { return { ...this.rect, right: this.rect.left + this.rect.width, bottom: this.rect.top + this.rect.height }; },
    setAttribute() {}, insertAdjacentHTML() {}, animate() {}, removeAttribute() {} };
}
function setup({ plan, imageMode = 'load' } = {}) {
  let image;
  const saved = [], outcomes = [], timers = [];
  const ns = { LetterFriends: { FRIENDS: { 'ب': {}, 'ت': {}, 'ث': {}, 'ج': {} }, art: c => `<svg>${c}</svg>`, item: c => ({ id: `friend-${c}`, display: c }), get: c => ({ en: c, call: c }) },
    LettersStrokes: { LETTERS: { 'ب': [{ dot: [50, 20] }], 'ت': [{ dot: [50, 20] }, { dot: [70, 20] }], 'ث': [{ dot: [50, 20] }, { dot: [70, 20] }, { dot: [30, 20] }], 'ج': [] } },
    PracticeLearning: { profile: () => ({ choiceCount: 3, promptMode: 'match' }), level: () => 0,
      plan: plan || ((_ctx, items) => items.slice()) },
    LettersStrength: { skillProfile: () => ({ matching: { sessions: [] } }) },
    DrawingPalette: { startForPet: hue => hue === 320 ? 'pink' : 'blue', colors: [{ value: 'pink', name: 'Pink' }, { value: 'coral', name: 'Coral' }] },
  };
  const context = { window: { MiftahGame: ns }, Math, Date,
    setTimeout(fn, ms) { const timer = { fn, ms, cleared: false }; timers.push(timer); return timer; }, clearTimeout(t) { if (t) t.cleared = true; },
    document: { createElement(tag) { if (tag === 'canvas') return { width: 0, height: 0, getContext: () => ({ fillRect() {}, drawImage() {}, set fillStyle(_) {} }), toDataURL: () => 'data:image/png;base64,page' }; return {}; } },
    Image: class { constructor() { image = this; this.width = imageMode === 'blank' ? 0 : 160; this.height = imageMode === 'blank' ? 0 : 160; }
      set src(value) { this.source = value; if (imageMode === 'load') queueMicrotask(() => this.onload?.()); if (imageMode === 'error') queueMicrotask(() => this.onerror?.()); } },
    Promise, performance: { now: () => 1 }, getComputedStyle: () => ({ left: '0px' }) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'ToyBoxGames.js'), 'utf8'), context, { filename: 'ToyBoxGames.js' });
  return { ns, context, timers, saved, outcomes, get image() { return image; } };
}

test('toy pools enforce taught and unlock policy, NFC uniqueness, blocked aliases, and real planned IDs', () => {
  const { ns } = setup({ plan: (_ctx, pool) => {
    assert.deepEqual(Array.from(pool, i => i.id), ['real-ta'], 'invalid and duplicate displays are removed before planning');
    return [pool.find(i => i.id === 'real-ta'), { id: 'unknown', display: 'ث' }, { id: 'locked', display: 'ج' }];
  } });
  const ctx = { completedWorldIds: [], worldId: 'now', items: [
    { id: 'real-ba', display: 'ب' }, { id: 'ba-alias', display: 'ب', locked: true },
    { id: 'real-ta', display: 'ت' }, { id: 'not-taught', display: 'ث', taught: false },
    { id: 'not-introduced', display: 'ج', isTaught: false }, { id: 'locked-later', display: 'ج', unlocked: false },
    { id: 'future', display: 'ث', prerequisiteWorldIds: ['later'] },
  ] };
  assert.deepEqual(Array.from(ns.ToyBoxGames.knownItems(ctx), i => i.id), ['real-ta']);
  assert.deepEqual(Array.from(ns.ToyBoxGames.practiceItems(ctx, ['ب', 'ت', 'ث', 'ج'], 'letter-form', 4), i => i.id), ['real-ta']);
  const empty = setup({ plan: () => [] });
  assert.deepEqual(Array.from(empty.ns.ToyBoxGames.practiceItems(ctx, ['ت'], 'letter-form', 2)), [], 'an explicit empty plan stays empty');
});

test('pair-board size stays at two or three until four separate practice visits', () => {
  const { ns } = setup();
  assert.equal(ns.ToyBoxGames.pairsAt(0, 12), 2, 'novice remains at two pairs');
  assert.equal(ns.ToyBoxGames.pairsAt(1, 12), 3);
  assert.equal(ns.ToyBoxGames.pairsAt(2, 3), 3, 'later profile does not jump early');
  assert.equal(ns.ToyBoxGames.pairsAt(2, 4), 4, 'four pairs unlock only after four distinct visits');
});

test('DotNests takes both where targets from the plan and cancels an explicit empty plan', () => {
  const { ns } = setup({ plan: () => [] });
  ns.LettersStrokes.LETTERS['ج'] = [{ dot: [50, 90] }];
  assert.deepEqual(Array.from(ns.ToyBoxGames.whereChars(['ب', 'ج'])), ['ب', 'ج']);
  assert.deepEqual(Array.from(ns.ToyBoxGames.whereChars(['ب'])), [], 'unplanned below-dot friends cannot be added');
  const root = {};
  const game = new ns.GardenPractice.DotNests({ items: [{ id: 'ba', display: 'ب' }, { id: 'ta', display: 'ت' }],
    completedWorldIds: [], worldId: 'now', stage: { innerHTML: '', get firstElementChild() { return root; } }, prompt() {}, cancel() {} });
  assert.equal(game.queue, undefined, 'an explicit empty order is not refilled with the known pool');
  assert.equal(game.busy, true, 'the unavailable screen exits through the established gentle path');
});

test('toy screens expose discrete receivers and keep decorative art separate from letter targets', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'ToyBoxGames.js'), 'utf8');
  assert.match(source, /class="ts-easel"[\s\S]*?class="ts-easel-art"[\s\S]*?class="tb-paper"/);
  assert.match(source, /querySelector\("\.tb-paper svg"\)/, 'only the drawing SVG is recolourable');
  assert.match(source, /class="ts-puzzle"[\s\S]*?class="ts-puzzle-art"[\s\S]*?class="tb-board/);
  assert.match(source, /class="tb-board[\s\S]*?<\/div><\/div>\s*<div class="tb-tray"/, 'piece tray is a sibling of the framed puzzle');
  assert.match(source, /class="ts-perch-art"/);
  assert.match(source, /ns\.ToyStudioArt\?\.dotTree\?\./);
});

test('a handled wrong nest choice returns true and records the original target item ID', () => {
  const { ns, outcomes } = setup();
  const button = element();
  const root = { contains: node => node === button, querySelectorAll: () => [] };
  const game = Object.create(ns.GardenPractice.DotNests.prototype);
  Object.assign(game, { alive: true, busy: false, q: { c: 'ب' }, want: 1, offered: [0, 1], roundToken: 4,
    root, currentNodes: [button], ctx: { items: [{ id: 'real-ba', display: 'ب' }], reportOutcome: o => outcomes.push(o), sfx() {}, reducedMotion: () => true }, wobble() {} });
  assert.equal(game.pick(0, button, 4, true), true, 'the pointer drop was received even though it was the wrong nest');
  assert.equal(game.pick(0, button, 4), false, 'a wrong tap remains a wrong answer');
  assert.equal(outcomes[0].itemId, 'real-ba');
  assert.equal(outcomes[0].correct, false);
  assert.equal(game.pick(1, button, 3), false, 'an old round token cannot answer');
});

test('pair and puzzle handlers reject stale board and step callbacks', () => {
  const { ns } = setup();
  const card = element(), piece = element();
  const root = { contains: node => node === card || node === piece, querySelectorAll: () => [piece] };
  const pairs = Object.create(ns.GardenPractice.FriendPairs.prototype);
  Object.assign(pairs, { alive: true, busy: false, boardToken: 8, root, cards: [{ c: 'ب', face: 'letter' }], open: [], card() { throw new Error('stale card was queried'); } });
  assert.equal(pairs.flip(0, card, 7), false);
  const puzzle = Object.create(ns.GardenPractice.FriendJigsaw.prototype);
  Object.assign(puzzle, { alive: true, busy: false, stepToken: 3, root, todo: [0] });
  assert.equal(puzzle.pick(0, piece, 2), false);
});

test('jigsaw completion records construction as motor participation, not a recall verdict', () => {
  const { ns, outcomes } = setup();
  const game = Object.create(ns.GardenPractice.FriendJigsaw.prototype);
  Object.assign(game, { ctx: { items: [{ id: 'real-ba', display: 'ب' }], beginRound() {}, reportOutcome: o => outcomes.push(o) } });
  game.participated('ب', 'construction');
  assert.equal(outcomes[0].itemId, 'real-ba');
  assert.equal(outcomes[0].skill, 'construction');
  assert.equal(outcomes[0].evidence, 'motor_assembly_participation');
  assert.equal(Object.hasOwn(outcomes[0], 'correct'), false);
  assert.equal(outcomes[0].affectsStrength, false);
  const practice = setup();
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'PracticeLearning.js'), 'utf8'), practice.context);
  const strength = { skillProfile: (_id, skill) => skill === 'construction' ? { motor: { r: 3, streak: 2, sessions: ['visit-1', 'visit-2'] } } : {} };
  const ctx = { beginner: false, strength, completedWorldIds: [], worldId: 'now' };
  assert.equal(practice.ns.PracticeLearning.level(ctx, [{ id: 'real-ba', display: 'ب' }], 'construction'), 1);
  assert.equal(practice.ns.PracticeLearning.level(ctx, [{ id: 'real-ba', display: 'ب' }], 'matching-memory'), 0,
    'puzzle practice does not leak into memory or recall evidence');
  const source = fs.readFileSync(path.join(__dirname, '..', 'ToyBoxGames.js'), 'utf8');
  assert.match(source, /this\.level = practiceLevel\(ctx, this\.known, "construction"\)/);
  assert.match(source, /this\.order = practiceOrder\(ctx, this\.known, "construction"/);
});

test('jigsaw advances after the last of multiple pieces using the round token, and records construction evidence', () => {
  const { ns, timers, outcomes } = setup();
  const panel = element(), board = element(), tray = element(), slot0 = element(), slot1 = element();
  let currentPiece = element();
  const slots = [slot0, slot1], nodes = new Set([panel, board, tray, slot0, slot1, currentPiece]);
  const root = { contains: node => nodes.has(node),
    querySelector(selector) {
      if (selector === '.tb-tray') return tray;
      if (selector === '.tb-board') return board;
      const match = selector.match(/\.tb-slot\[data-r="(\d+)"\]/); return match ? slots[Number(match[1])] : null;
    },
    querySelectorAll(selector) { return selector === '.tb-piece' ? [currentPiece] : []; } };
  const game = Object.create(ns.GardenPractice.FriendJigsaw.prototype);
  Object.assign(game, { alive: true, busy: false, round: 0, roundToken: 9, stepToken: 20, c: 'ب', n: 2,
    todo: [0, 1], pieces: [{ c: 'ب', r: 0 }], root, roundRoot: panel, dragResets: [], timers: [],
    order: ['ب', 'ت'], ctx: { items: [{ id: 'real-ba', display: 'ب' }], reportOutcome: o => outcomes.push(o), beginRound() {}, sfx() {} },
    piece: () => '<svg/>', scene: () => '<svg/>', cheer() {}, ask() { this.stepToken += 1; currentPiece = element(); nodes.add(currentPiece); this.pieces = [{ c: 'ب', r: 1 }]; },
    next() { this.advanced = (this.advanced || 0) + 1; },
    later(fn, ms) { timers.push({ fn, ms }); return {}; } });
  assert.equal(game.pick(0, currentPiece, 20), true);
  assert.deepEqual(Array.from(game.todo), [1]);
  assert.equal(game.pick(0, currentPiece, 21), true);
  assert.equal(game.round, 1);
  assert.equal(outcomes[0].skill, 'construction');
  assert.equal(outcomes[0].evidence, 'motor_assembly_participation');
  timers.find(timer => timer.ms === 3400).fn();
  assert.equal(game.advanced, 1, 'completion callback uses the captured board token, not the final step token');
});

test('colour export snapshots a page and failure or stale completion cannot save or finish it', async () => {
  const runtime = setup({ imageMode: 'manual' });
  const { ns, context } = runtime;
  const svg = element(); svg.outerHTML = '<svg width="280" height="280"></svg>';
  const paper = element(); paper.classList.add('paper');
  const hangButton = element(), nextButton = element();
  const root = { contains: node => node === svg || node === paper || node === hangButton,
    querySelector(selector) { return selector === '.tb-paper' ? paper : selector === '.tb-hang' ? hangButton : null; },
    querySelectorAll(selector) { return selector === '.tb-next-page, .tb-hang' ? [nextButton, hangButton] : []; } };
  const game = Object.create(ns.GardenPractice.ColourFriend.prototype);
  let finished = 0;
  Object.assign(game, { alive: true, busy: false, saving: false, pageToken: 1, svg, root, ctx: { saveDrawing: url => runtime.saved.push(url), done: () => finished++ }, timers: [], cheer() {}, finish() { finished++; } });
  let pending = game.hang();
  await Promise.resolve();
  assert.match(decodeURIComponent(runtime.image.source), /width="160" height="160"/);
  assert.equal(nextButton.disabled, true, 'page navigation is frozen during export');
  assert.equal(hangButton.disabled, true, 'duplicate exports are disabled');
  assert.equal(await game.hang(), false);
  svg.outerHTML = '<svg width="280" height="280" fill="changed-after-snapshot"></svg>';
  assert.doesNotMatch(decodeURIComponent(runtime.image.source), /changed-after-snapshot/);
  game.pageToken += 1;
  runtime.image.onload();
  assert.equal(await pending, false);
  assert.equal(runtime.saved.length, 0, 'the prior page is not saved after its token changes');
  assert.equal(finished, 0);

  const failed = setup({ imageMode: 'error' });
  const brokenSvg = element(); brokenSvg.outerHTML = '<svg width="280" height="280"></svg>';
  const failedHang = element(), failedNext = element();
  const failedRoot = { contains: node => node === brokenSvg, querySelector: () => failedHang,
    querySelectorAll: selector => selector === '.tb-next-page, .tb-hang' ? [failedNext, failedHang] : [] };
  const failedGame = Object.create(failed.ns.GardenPractice.ColourFriend.prototype);
  Object.assign(failedGame, { alive: true, busy: false, saving: false, pageToken: 1, svg: brokenSvg, root: failedRoot,
    ctx: { saveDrawing: url => failed.saved.push(url), done() {} }, timers: [], finish() { throw new Error('failed export finished'); } });
  pending = failedGame.hang();
  assert.equal(await pending, false);
  assert.equal(failed.saved.length, 0);
  assert.equal(failedGame.busy, false, 'failed export can be retried');
  assert.equal(failedHang.disabled, false, 'failure re-enables the hang action');
  assert.equal(failedNext.disabled, false, 'failure re-enables page navigation');
});

test('drawing drafts retain paint state by page and rejected optional speech is swallowed', async () => {
  const { ns } = setup();
  const game = Object.create(ns.GardenPractice.ColourFriend.prototype);
  const part = { dataset: { part: '2' }, fill: 'pink', stroke: null,
    getAttribute(name) { return this[name]; } };
  const body = { dataset: { part: '4' }, fill: null, stroke: 'blue', getAttribute(name) { return this[name]; } };
  Object.assign(game, { svg: { querySelectorAll: () => [part, body] }, coloured: new Set(['2', '4']), named: true, drafts: new Map() });
  game.saveDraft('ب');
  assert.deepEqual(JSON.parse(JSON.stringify(game.drafts.get('ب'))), {
    colors: [{ index: '2', fill: 'pink', stroke: null }, { index: '4', fill: null, stroke: 'blue' }], coloured: ['2', '4'], named: true,
  });

  const friend = Object.create(ns.GardenPractice.FriendPairs.prototype);
  friend.ctx = { say: () => Promise.reject(new Error('optional clip unavailable')) };
  assert.equal(await friend.say({ id: 'b' }), false);
});
