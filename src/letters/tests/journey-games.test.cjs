const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function runtime(extra = {}) {
  const frames = [];
  const window = { MiftahGame: { LettersArt: { inkShift: () => ({ dx: 0, dy: 0 }) } }, addEventListener() {}, removeEventListener() {} };
  const context = { window, performance: { now: () => 0 }, requestAnimationFrame: f => frames.push(f), setTimeout() {}, clearTimeout() {}, ...extra };
  for (const file of ['MiniGames.js', 'LettersGardenArt.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  }
  return { ns: window.MiftahGame, frames };
}

const items = ['a', 'b', 't', 'th'].map(id => ({ id, display: id }));

test('journey games report one-based progress with their actual totals', () => {
  const { ns } = runtime();
  const calls = [];
  const game = Object.create(ns.LettersMiniGames.feed.prototype);
  Object.assign(game, {
    alive: true, roundIndex: 1, rounds: [{ target: items[0], options: [] }, { target: items[1], options: [] }],
    dragResets: [], selected: null, ctx: { setRoundProgress: (...args) => calls.push(args), setPrompt() {}, say() {} },
    tray: { innerHTML: '', appendChild() {}, querySelectorAll: () => [] },
  });
  game.startRound();
  assert.deepEqual(calls, [[2, 2]]);

  const trace = Object.create(ns.LettersMiniGames.trace.prototype);
  Object.assign(trace, { alive: true, advancing: false, roundIndex: 0, targets: items.slice(0, 3), ctx: { setRoundProgress: (...args) => calls.push(args), setPrompt() {}, say() {} }, canvas: { parentElement: { clientWidth: 1, clientHeight: 1 }, getContext() { return { }; } } });
  // The callback is emitted before canvas setup, so a minimal trace stub is enough.
  trace.startRound = ns.LettersMiniGames.trace.prototype.startRound;
  trace.g = null;
  assert.throws(() => trace.startRound(), /clearRect|Cannot/);
  assert.deepEqual(calls.at(-1), [1, 3]);
});

function pairStage() {
  const grid = { appendChild() {} };
  return { innerHTML: '', querySelector: () => grid };
}

test('Pairs beginner boards cover four familiar items as two disjoint pairs', () => {
  const makeElement = () => ({ className: '', classList: { add() {}, remove() {} }, setAttribute() {}, addEventListener() {}, appendChild() {}, style: {} });
  const { ns } = runtime({ document: { createElement: makeElement } });
  const progress = [];
  const ctx = { beginner: true, items, stage: pairStage(), setRoundProgress: (...args) => progress.push(args), setPrompt() {}, say() {} };
  const game = Object.create(ns.LettersMiniGames.pairs.prototype);
  Object.assign(game, { ctx, alive: true, boardIndex: 0, boards: 2, slips: 0, beginnerPairs: items.slice() });
  game.buildBoard();
  assert.equal(game.pairCount, 2);
  assert.equal(game.cards.length, 4);
  assert.deepEqual([...new Set(game.cards.map(card => card.id))].sort(), ['a', 'b']);
  assert.deepEqual(progress, [[1, 2]]);
  game.boardIndex = 1;
  game.buildBoard();
  assert.equal(game.pairCount, 2);
  assert.equal(game.cards.length, 4);
  assert.deepEqual([...new Set(game.cards.map(card => card.id))].sort(), ['t', 'th']);
  assert.deepEqual(progress.at(-1), [2, 2]);
});

test('Pairs replay keeps three-pair boards', () => {
  const makeElement = () => ({ className: '', classList: { add() {}, remove() {} }, setAttribute() {}, addEventListener() {}, appendChild() {}, style: {} });
  const { ns } = runtime({ document: { createElement: makeElement } });
  const ctx = { beginner: false, items, stage: pairStage(), setPrompt() {}, say() {} };
  const game = Object.create(ns.LettersMiniGames.pairs.prototype);
  Object.assign(game, { ctx, alive: true, boardIndex: 0, boards: 2, slips: 0 });
  game.buildBoard();
  assert.equal(game.pairCount, 3);
  assert.equal(game.cards.length, 6);
});

test('pack-smile reference Pop starts choices in the scene and keeps them near their lane', () => {
  const makeElement = () => ({ style: {}, classList: { contains: () => false, add() {} }, setAttribute() {}, addEventListener() {}, remove() {}, innerHTML: '' });
  const { ns } = runtime({ document: { createElement: makeElement } });
  const appended = [];
  const game = Object.create(ns.LettersMiniGames.pop.prototype);
  Object.assign(game, { ctx: { referenceJourney: true, garden: false, hue: 20, level: 0 }, sky: { appendChild: el => appended.push(el) }, skyH: 100, laneCount: 3, bubbles: [] });
  game.spawn(items[0], 0, 0);
  assert.equal(game.bubbles[0].y, 0.18);
  assert.equal(appended[0].style.width, '26%');
  assert.match(appended[0].style.transform, /translate3d\(-50%/);
  assert.match(appended[0].style.transform, /18px/);
});

test('non-reference reduced-motion Pop keeps legacy choices in the visible band', () => {
  const { ns } = runtime();
  const style = {};
  const game = Object.create(ns.LettersMiniGames.pop.prototype);
  Object.assign(game, {
    alive: true, lastTime: 0, skyH: 100, bubbles: [{ y: 1.15, restY: 1.15, el: { classList: { contains: () => false }, style } }],
    ctx: { beginner: false, garden: false, referenceJourney: false, reducedMotion: () => true }, heat: { factor: () => 1 },
  });
  game.tick(16);
  assert.equal(game.bubbles[0].y, 0.35);
  assert.match(style.transform, /35px/);
});
