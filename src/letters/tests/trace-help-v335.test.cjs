const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function node(name) {
  const attrs = {}, classes = new Set();
  return {
    name, attrs, children: [], listeners: {}, style: {}, removed: false,
    classList: {
      add(...values) { values.forEach((v) => classes.add(v)); },
      remove(...values) { values.forEach((v) => classes.delete(v)); },
      contains(value) { return classes.has(value); },
    },
    setAttribute(k, v) {
      attrs[k] = String(v);
      if (k === 'class') { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach((name) => classes.add(name)); }
    },
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
}

function fixture(strokes, reduced = true) {
  let nextTimer = 0, done = 0, strokeDone = 0, moveNull = 0;
  const timers = new Map();
  const document = { createElementNS: (_ns, name) => node(name) };
  const window = { MiftahGame: {} };
  const context = {
    document, window, Math,
    setTimeout(fn) { const id = ++nextTimer; timers.set(id, { fn, cancelled: false }); return id; },
    clearTimeout(id) { if (timers.has(id)) timers.get(id).cancelled = true; },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'LettersStrokes.js'), 'utf8'), context);
  const guide = window.MiftahGame.LettersStrokes.guide(node('paper'), strokes, {
    reduced,
    onDone() { done += 1; },
    onStroke() { strokeDone += 1; },
    onMove(value) { if (value === null) moveNull += 1; },
  });
  const fireTimers = () => { for (const timer of timers.values()) timer.fn(); };
  const point = (x, y = 50) => ({ pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: y });
  return { guide, svg: guide.svg, timers, fireTimers, point, done: () => done, strokeDone: () => strokeDone, moveNull: () => moveNull };
}

function completeCurrentLine(f) {
  f.svg.dispatch('pointerdown', f.point(10));
  for (let x = 20; x <= 90; x += 10) f.svg.dispatch('pointermove', f.point(x));
  f.svg.dispatch('pointerup', f.point(90));
}

test('help at a dot preserves completed ink and progress without completing the letter', () => {
  const f = fixture([{ d: 'M10 50L90 50' }, { dot: [50, 20] }]);
  completeCurrentLine(f);
  const path = f.svg.children[1].children[0];
  const finishedOffset = path.style.strokeDashoffset;
  assert.equal(f.strokeDone(), 1);
  assert.equal(f.done(), 0);

  assert.equal(f.guide.demonstrate({ reduced: true }), true);
  assert.equal(f.svg.children[2].children[0].name, 'circle');
  assert.equal(f.svg.children[2].children[0].classList.contains('is-dot'), true);
  assert.equal(path.style.strokeDashoffset, finishedOffset);
  assert.equal(f.strokeDone(), 1);
  assert.equal(f.done(), 0);
});

test('help shows a moving cue from partial progress and pointer input resumes there', () => {
  const f = fixture([{ d: 'M10 50L90 50' }]);
  f.svg.dispatch('pointerdown', f.point(10));
  f.svg.dispatch('pointermove', f.point(30));
  const path = f.svg.children[1].children[0];
  const progress = path.style.strokeDashoffset;
  assert.ok(Number(progress) < 80);

  f.guide.demonstrate();
  assert.equal(f.svg.classList.contains('is-demo'), true);
  assert.equal(f.svg.children[2].children[0].classList.contains('tg-pen'), true);
  assert.equal(f.svg.captured, null, 'help releases an in-progress pointer capture');
  assert.equal(f.moveNull(), 1);
  f.fireTimers();
  assert.equal(path.style.strokeDashoffset, progress, 'help never replaces the child\'s ink with demo ink');

  f.guide.demonstrate();
  f.svg.dispatch('pointerdown', f.point(30));
  assert.equal(f.svg.classList.contains('is-demo'), false, 'a new touch interrupts help');
  assert.equal(path.style.strokeDashoffset, progress);
  f.svg.dispatch('pointermove', f.point(40));
  const resumedProgress = path.style.strokeDashoffset;
  assert.ok(Number(resumedProgress) < Number(progress), 'tracing continues beyond the saved position');
  f.fireTimers();
  assert.equal(path.style.strokeDashoffset, resumedProgress, 'stale help frames do not repaint real tracing');
  assert.equal(f.done(), 0);
});

test('repeated help and reset or destroy make queued help callbacks inert', () => {
  const f = fixture([{ d: 'M10 50L90 50' }]);
  f.guide.demonstrate();
  f.guide.demonstrate();
  const path = f.svg.children[1].children[0];
  f.svg.dispatch('pointerdown', f.point(10));
  f.svg.dispatch('pointermove', f.point(20));
  const progress = path.style.strokeDashoffset;
  f.fireTimers();
  assert.equal(path.style.strokeDashoffset, progress);
  assert.equal(f.done(), 0);

  f.guide.demonstrate();
  f.guide.reset();
  assert.equal(f.svg.classList.contains('is-demo'), false);
  f.fireTimers();
  assert.equal(path.style.strokeDashoffset, '80');
  assert.equal(f.done(), 0);

  f.guide.demonstrate();
  f.guide.destroy();
  f.fireTimers();
  assert.equal(f.svg.removed, true);
  assert.equal(f.done(), 0);
});

test('reduced motion help is a static cue and schedules no help timers', () => {
  const f = fixture([{ d: 'M10 50L90 50' }]);
  assert.equal(f.guide.demonstrate({ reduced: true }), true);
  assert.equal(f.timers.size, 0);
  assert.equal(f.svg.classList.contains('is-demo'), false);
  assert.equal(f.svg.children[2].children[1].classList.contains('tg-start'), true);
});
