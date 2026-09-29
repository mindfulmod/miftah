const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function svgNode(name) {
  const attrs = {};
  const node = {
    name, attrs, children: [], removed: false,
    setAttribute(key, value) { attrs[key] = String(value); },
    getAttribute(key) { return attrs[key] ?? null; },
    appendChild(child) { this.children.push(child); child.parentElement = this; return child; },
    remove() { this.removed = true; },
  };
  return node;
}

function fixture() {
  const timers = [], hints = [];
  const window = { MiftahGame: { LettersArt: {}, LettersGardenArt: {} }, addEventListener() {}, removeEventListener() {} };
  const document = { createElementNS: (_namespace, name) => svgNode(name) };
  const context = {
    window, document, setTimeout: callback => (timers.push(callback), timers.length), clearTimeout() {},
    requestAnimationFrame() {}, performance: { now: () => 0 },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'MiniGames.js'), 'utf8'), context);
  const parent = {
    appendChild(node) { hints.push(node); node.parentElement = this; },
    querySelectorAll(selector) { return selector === '.trace-hint' ? hints.filter(node => !node.removed) : []; },
    classList: { add() {}, remove() {} },
    parentElement: { classList: { add() {}, remove() {} }, querySelectorAll() { return []; } },
  };
  const canvas = {
    width: 400, height: 200, parentElement: parent,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 200 }),
    hasPointerCapture: () => false,
  };
  let completed = 0, pageSounds = 0;
  const game = Object.create(window.MiftahGame.LettersMiniGames.trace.prototype);
  const bodyPoints = Array.from({ length: 10 }, (_, i) => [i * 5, 100]);
  const body = bodyPoints.map(([x, y]) => `${x}|${y}`);
  const dotPoint = [315, 45];
  const dot = dotPoint.join('|');
  Object.assign(game, {
    alive: true, drawing: true, activePointer: 7, advancing: false, completionReady: false,
    canvas, brush: 26, guide: [...bodyPoints, dotPoint], clusters: [body, [dot]],
    paint: new Set(body.slice(0, 6)),
    ctx: { sfx(name) { if (name === 'page') pageSounds++; } },
    completeDrawing() { completed++; },
  });
  return { game, canvas, parent, hints, timers, body, dot, completed: () => completed, pageSounds: () => pageSounds };
}

test('Trace points at a missing dot in an SVG sharing the canvas object-fit frame', () => {
  const f = fixture();
  f.game.penUp({ pointerId: 7 });

  assert.equal(f.completed(), 0, 'the mostly traced body still cannot pass without its dot');
  assert.equal(f.pageSounds(), 1);
  assert.equal(f.hints.length, 1);
  const hint = f.hints[0], circle = hint.children[0];
  assert.equal(hint.name, 'svg');
  assert.equal(hint.parentElement, f.canvas.parentElement);
  assert.equal(hint.getAttribute('aria-hidden'), 'true');
  assert.equal(hint.getAttribute('viewBox'), '0 0 400 200');
  assert.equal(hint.getAttribute('preserveAspectRatio'), 'xMidYMid meet');
  assert.equal(hint.getAttribute('width'), null, 'CSS controls the overlay size');
  assert.equal(hint.getAttribute('height'), null, 'CSS controls the overlay size');
  assert.equal(circle.name, 'circle');
  assert.equal(circle.getAttribute('cx'), '315');
  assert.equal(circle.getAttribute('cy'), '45');
  assert.equal(circle.getAttribute('vector-effect'), 'non-scaling-stroke');
});

test('Trace replaces an outstanding hint and only completes after the missing cluster is painted', () => {
  const f = fixture();
  f.game.penUp({ pointerId: 7 });
  const first = f.hints[0];

  f.game.drawing = true; f.game.activePointer = 8;
  f.game.penUp({ pointerId: 8 });
  assert.equal(first.removed, true);
  assert.equal(f.parent.querySelectorAll('.trace-hint').length, 1);
  assert.equal(f.timers.length, 2, 'each temporary hint keeps its normal expiry callback');

  f.game.paint.add(f.dot);
  f.game.drawing = true; f.game.activePointer = 9;
  f.game.penUp({ pointerId: 9 });
  assert.equal(f.completed(), 1, 'painting the missing dot satisfies the existing cluster gate');
});
