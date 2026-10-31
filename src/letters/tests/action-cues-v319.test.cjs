const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function fixture() {
  let serial = 0, shown = 0;
  const timers = new Map(), oldTimers = [], animations = [];
  const node = (rect = { left: 100, top: 200, width: 80, height: 80 }) => ({
    isConnected: true, disabled: false, hidden: false, style: {}, dataset: {}, children: [], attrs: {}, listeners: {}, className: '', innerHTML: '<svg/>',
    getClientRects() { return this.hidden ? [] : [rect]; }, getBoundingClientRect() { return rect; },
    setAttribute(k, v) { this.attrs[k] = v; }, appendChild(el) { this.children.push(el); el.parent = this; },
    remove() { this.isConnected = false; if (this.parent) this.parent.children = this.parent.children.filter(el => el !== this); },
    addEventListener(type, fn) { (this.listeners[type] ||= new Set()).add(fn); },
    removeEventListener(type, fn) { this.listeners[type]?.delete(fn); },
    emit(type) { for (const fn of this.listeners[type] || []) fn({ type }); },
    animate(frames, options) { const a = { frames, options, cancelled: false, cancel() { this.cancelled = true; } }; animations.push(a); return a; },
  });
  const document = node(); document.body = node(); document.createElement = () => node(); document.createElementNS = () => node();
  const window = node(); window.MiftahGame = {};
  const context = { document, window,
    setTimeout(fn, ms) { const id = ++serial; timers.set(id, { fn, ms }); oldTimers.push(fn); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'LettersActionCue.js'), 'utf8'), context);
  const host = node(), source = node(), destination = node({ left: 300, top: 50, width: 150, height: 130 }), control = node();
  const mount = (opts = {}) => window.MiftahGame.LettersActionCue.mount({ host, source, destination, control, onShow() { shown++; }, ...opts });
  const advanceAuto = () => { for (const [id, t] of [...timers]) if (t.ms === 1100) { timers.delete(id); t.fn(); } };
  return { document, window, host, source, destination, control, mount, timers, oldTimers, animations, advanceAuto, shown: () => shown };
}

test('first example is delayed, replayable, and shows help without clicking the answer', () => {
  const f = fixture(); f.source.emit = () => { throw Error('a cue must never answer'); };
  const cue = f.mount({ automatic: true });
  assert.equal(f.shown(), 0); assert.equal(f.control.hidden, false);
  f.advanceAuto(); assert.equal(f.shown(), 1); assert.equal(f.document.body.children.length, 1);
  assert.equal(f.document.body.children[0].attrs['aria-hidden'], 'true');
  f.document.emit('pointerdown'); assert.equal(f.document.body.children.length, 0);
  f.control.emit('click'); assert.equal(f.shown(), 2);
  cue.destroy(); assert.equal(f.control.hidden, true); assert.equal(f.document.body.children.length, 0);
});

test('early input cancels automatic help; pointer and keyboard always remove shown cues', () => {
  for (const type of ['pointerdown', 'keydown']) {
    const f = fixture(); const cue = f.mount({ automatic: true });
    f.document.emit(type); f.advanceAuto(); assert.equal(f.shown(), 0);
    cue.show(); f.document.emit(type);
    assert.equal(f.document.body.children.length, 0);
    assert.ok(f.animations.every(a => a.cancelled)); cue.destroy();
  }
});

test('drag example uses the real receiver; reduced motion keeps a static route without a moving copy', () => {
  for (const still of [false, true]) {
    const f = fixture(), cue = f.mount({ type: 'drag', reducedMotion: () => still }); cue.show();
    const layer = f.document.body.children[0];
    assert.ok(layer.children.some(el => el.className === 'lg-action-route' || el.attrs.class === 'lg-action-route'));
    assert.equal(layer.children.some(el => el.className === 'lg-action-ghost'), !still);
    assert.equal(f.animations.length > 0, !still);
    assert.equal(layer.className.includes('is-still'), still);
    cue.destroy();
  }
});

test('round replacement, resize and destroyed callbacks cannot leave guidance behind', () => {
  const f = fixture(), old = f.mount({ automatic: true }); old.destroy();
  f.oldTimers.forEach(fn => fn()); assert.equal(f.shown(), 0);
  const next = f.mount(); f.control.emit('click'); assert.equal(f.shown(), 1);
  f.window.emit('resize'); assert.equal(f.document.body.children.length, 0);
  next.destroy();
  assert.equal(f.document.listeners.pointerdown.size, 0); assert.equal(f.document.listeners.keydown.size, 0);
  assert.equal(f.window.listeners.resize.size, 0); assert.equal(f.control.listeners.click.size, 0);
});

test('hidden, disabled or detached targets cannot create help evidence', () => {
  for (const change of [f => f.source.hidden = true, f => f.source.disabled = true, f => f.source.isConnected = false, f => f.host.isConnected = false, f => f.destination.hidden = true]) {
    const f = fixture(); change(f); const cue = f.mount({ type: 'drag' });
    assert.equal(cue.show(), false); assert.equal(f.shown(), 0); assert.equal(f.document.body.children.length, 0); cue.destroy();
  }
});


test('replay resolves the current pet art after a pose replaces the previous SVG', () => {
  const f = fixture(); let receiver = f.destination;
  const cue = f.mount({ type: 'drag', destination: () => receiver });
  assert.equal(cue.show(), true);
  f.destination.isConnected = false;
  receiver = f.source;
  assert.equal(cue.show(), true, 'the new receiver is measured instead of using a detached SVG');
  assert.equal(f.shown(), 2); cue.destroy();
});

test('pair demonstration shows two separate taps with no drag route or moving card', () => {
  for (const still of [false, true]) {
    const f = fixture(), cue = f.mount({ type: 'pair', reducedMotion: () => still });
    cue.show();
    const children = f.document.body.children[0].children;
    assert.equal(children.filter(el => el.className === 'lg-action-hand').length, 2);
    assert.equal(children.filter(el => el.className === 'lg-action-ring').length, 2);
    assert.ok(children.every(el => !['lg-action-route', 'lg-action-ghost'].includes(el.className)));
    if (still) assert.equal(f.animations.length, 0);
    else assert.deepEqual(f.animations.map(a => a.options.delay), [0, 0, 1750, 1750]);
    f.document.emit('pointerdown');
    assert.equal(f.document.body.children.length, 0);
    assert.ok(f.animations.every(a => a.cancelled));
    cue.destroy();
  }
});

test('construction can anchor a drag at the slot center without changing the pet default', () => {
  const f=fixture(), cue=f.mount({type:'drag',destinationY:.5,reducedMotion:()=>true});
  cue.show();
  const route=f.document.body.children[0].children.find(n=>n.attrs.class==='lg-action-route');
  assert.match(route.innerHTML,/Q144 115 375 115/);
  cue.destroy();
});


test('drag demonstration holds its destination and remains instantly interruptible', () => {
  const f=fixture(), cue=f.mount({type:'drag'}); cue.show();
  const hand=f.animations.find(a=>a.frames.length===5);
  assert.equal(hand.options.duration,2600);
  assert.equal(hand.frames.at(-2).offset,.85);
  assert.equal(hand.frames.at(-2).transform,hand.frames.at(-1).transform);
  assert.ok([...f.timers.values()].some(t=>t.ms===2900));
  f.document.emit('pointerdown');
  assert.equal(f.document.body.children.length,0);
  assert.ok(f.animations.every(a=>a.cancelled)); cue.destroy();
});
