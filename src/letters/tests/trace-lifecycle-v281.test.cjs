const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function node(name) {
  const attrs = {}, classes = new Set();
  const el = {
    name, attrs, children: [], listeners: {}, style: {}, removed: false,
    classList: {
      add(...values) { values.forEach((v) => classes.add(v)); },
      remove(...values) { values.forEach((v) => classes.delete(v)); },
      contains(value) { return classes.has(value); },
    },
    setAttribute(k, v) { attrs[k] = String(v); },
    getAttribute(k) { return attrs[k] ?? null; },
    removeAttribute(k) { delete attrs[k]; },
    appendChild(child) { this.children.push(child); child.parentElement = this; return child; },
    replaceChildren(...children) { this.children = []; children.forEach((child) => this.appendChild(child)); },
    addEventListener(type, fn) { this.listeners[type] = fn; },
    remove() { this.removed = true; },
    setPointerCapture(id) { this.captured = id; },
    hasPointerCapture(id) { return this.captured === id; },
    releasePointerCapture(id) {
      if (this.captured !== id) return;
      this.captured = null;
      this.listeners.lostpointercapture?.({ pointerId: id });
    },
    getScreenCTM() { return { inverse() { return {}; } }; },
    createSVGPoint() { return { matrixTransform() { return { x: this.x, y: this.y }; } }; },
    getTotalLength() { return 80; },
    getPointAtLength(length) { return { x: 10 + length, y: 50 }; },
    dispatch(type, event) { this.listeners[type]?.(event); },
  };
  return el;
}

function fixture(strokes, reduced = true) {
  let nextTimer = 0;
  const timers = new Map();
  const document = { createElementNS: (_ns, name) => node(name) };
  const window = { MiftahGame: {} };
  const context = {
    document, window, Math,
    setTimeout(fn) { const id = ++nextTimer; timers.set(id, { fn, cancelled: false }); return id; },
    clearTimeout(id) { if (timers.has(id)) timers.get(id).cancelled = true; },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'LettersStrokes.js'), 'utf8'), context);
  const paper = node('paper');
  let done = 0, snaps = 0, strokesDone = 0, moveNull = 0;
  const guide = window.MiftahGame.LettersStrokes.guide(paper, strokes, {
    reduced,
    onDone() { done += 1; },
    onSnap() { snaps += 1; },
    onStroke() { strokesDone += 1; },
    onMove(value) { if (value === null) moveNull += 1; },
  });
  const fireTimers = () => {
    for (const timer of timers.values()) timer.fn();
  };
  const point = (x, y = 50) => ({ pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: y });
  return { guide, svg: guide.svg, timers, fireTimers, point, done: () => done, snaps: () => snaps, strokesDone: () => strokesDone, moveNull: () => moveNull };
}

test('pointercancel and lost capture clean up without counting failed attempts or losing progress', () => {
  const f = fixture([{ d: 'M10 50L90 50' }]);
  f.svg.dispatch('pointerdown', f.point(10));
  f.svg.dispatch('pointermove', f.point(20));
  const progress = f.svg.children[1].children[0].style.strokeDashoffset;
  f.svg.dispatch('pointercancel', f.point(20));
  assert.equal(f.svg.children[1].children[0].style.strokeDashoffset, progress);
  assert.equal(f.done(), 0);
  assert.equal(f.snaps(), 0);
  f.svg.dispatch('pointerdown', f.point(20));
  f.svg.dispatch('pointermove', f.point(30));
  const afterMove = f.svg.children[1].children[0].style.strokeDashoffset;
  f.svg.dispatch('lostpointercapture', f.point(20));
  assert.equal(f.svg.children[1].children[0].style.strokeDashoffset, afterMove);
  f.svg.dispatch('pointerdown', f.point(30));
  assert.equal(f.svg.captured, 1, 'lost capture clears the active pointer for the next press');
  assert.equal(f.moveNull(), 2);
});

test('pointercancel does not trigger the fifth-struggle assist', () => {
  const f = fixture([{ dot: [50, 50] }]);
  for (let i = 0; i < 4; i += 1) {
    f.svg.dispatch('pointerdown', f.point(5));
    f.svg.dispatch('pointerup', f.point(5));
  }
  f.svg.dispatch('pointerdown', f.point(5));
  f.svg.dispatch('pointercancel', f.point(5));
  assert.equal(f.done(), 0);
  assert.equal(f.snaps(), 0);
});

test('pointerup, reset, and destroy release capture safely', () => {
  const f = fixture([{ dot: [50, 50] }]);
  f.svg.dispatch('pointerdown', f.point(5));
  f.svg.dispatch('pointerup', f.point(5));
  assert.equal(f.svg.captured, null);
  f.svg.dispatch('pointerdown', f.point(5));
  f.guide.reset();
  assert.equal(f.svg.captured, null);
  f.svg.dispatch('pointerdown', f.point(5));
  f.guide.destroy();
  assert.equal(f.svg.captured, null);
  assert.equal(f.svg.removed, true);
});

test('reset cancels demo and snap timers, clears demo state, and accepts input immediately', () => {
  const f = fixture([{ d: 'M10 50L90 50' }], false);
  assert.equal(f.svg.classList.contains('is-demo'), true);
  f.guide.reset();
  assert.equal(f.svg.classList.contains('is-demo'), false);
  assert.equal(f.svg.classList.contains('is-done'), false);
  assert.equal(f.svg.children[2].children[0].name, 'path', 'reset rebuilds the start cue');
  f.svg.dispatch('pointerdown', f.point(10));
  f.svg.dispatch('pointermove', f.point(20));
  f.svg.dispatch('pointermove', f.point(30, 95));
  assert.equal(f.svg.children[1].children[0].classList.contains('is-snap'), true);
  f.guide.reset();
  assert.equal(f.svg.children[1].children[0].classList.contains('is-snap'), false, 'reset clears an active snap state');
  f.svg.dispatch('pointerdown', f.point(10));
  f.svg.dispatch('pointermove', f.point(20));
  const progress = f.svg.children[1].children[0].style.strokeDashoffset;
  f.fireTimers();
  assert.equal(f.svg.children[1].children[0].style.strokeDashoffset, progress, 'queued demo callbacks stay inert after reset');
  assert.equal(f.svg.classList.contains('is-demo'), false);
});

test('keyboard help remains available after reset and stale callbacks cannot undo completion', () => {
  const f = fixture([{ d: 'M10 50L90 50' }], false);
  f.guide.reset();
  f.svg.dispatch('keydown', { key: 'Enter', preventDefault() {} });
  assert.equal(f.done(), 1);
  f.fireTimers();
  assert.equal(f.done(), 1);
  assert.equal(f.svg.classList.contains('is-done'), true);
});

test('first pointer press interrupts the demonstration and stale demo frames cannot erase real ink', () => {
  const f = fixture([{ d: 'M10 50L90 50' }], false);
  assert.equal(f.svg.classList.contains('is-demo'), true);
  f.svg.dispatch('pointerdown', f.point(10));
  f.svg.dispatch('pointermove', f.point(20));
  assert.equal(f.svg.classList.contains('is-demo'), false);
  const progress = f.svg.children[1].children[0].style.strokeDashoffset;
  assert.ok(Number(progress) < 80, 'the first real movement writes immediately');
  f.fireTimers();
  assert.equal(f.svg.children[1].children[0].style.strokeDashoffset, progress);
  assert.equal(f.done(), 0); assert.equal(f.snaps(), 0);
  for (let x = 30; x <= 90; x += 10) f.svg.dispatch('pointermove', f.point(x));
  assert.equal(f.done(), 1, 'only actual tracing completes the letter');
});

test('keyboard can interrupt the demo, preserving its assisted stroke semantics', () => {
  const f = fixture([{ d: 'M10 50L90 50' }, { dot: [50, 20] }], false);
  f.svg.dispatch('keydown', { key: 'Enter', preventDefault() {} });
  assert.equal(f.svg.classList.contains('is-demo'), false);
  assert.equal(f.strokesDone(), 1); assert.equal(f.snaps(), 1); assert.equal(f.done(), 0);
  f.fireTimers(); assert.equal(f.strokesDone(), 1); assert.equal(f.done(), 0);
  f.svg.dispatch('keydown', { key: ' ', preventDefault() {} });
  assert.equal(f.done(), 1); assert.equal(f.snaps(), 2);
});
