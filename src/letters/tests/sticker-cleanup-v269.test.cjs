const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..', '..', '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const colours = text => text.match(/#[0-9a-fA-F]{6}/g) || [];
const allowed = (() => {
  const art = read('ART.md');
  return new Set(colours(art.slice(art.indexOf('## 2.'), art.indexOf('## 3.'))).map(c => c.toLowerCase()));
})();

function fixture() {
  const ghosts = [];
  const document = {
    createElement() {
      return { style: {}, className: '', innerHTML: '', remove() { this.removed = true; } };
    },
    body: { appendChild(el) { ghosts.push(el); } },
  };
  const window = { MiftahGame: {} };
  vm.runInNewContext(read('src/letters/StickerScenes.js'), vm.createContext({
    window, document, Math, Number, Array, Object, JSON, Set,
  }));
  return { Scene: window.MiftahGame.StickerScenes.StickerScene, ghosts };
}

function classes() {
  const set = new Set();
  return {
    add: (...names) => names.forEach(name => set.add(name)),
    remove: (...names) => names.forEach(name => set.delete(name)),
    toggle(name, force) {
      const enabled = force === undefined ? !set.has(name) : force;
      enabled ? set.add(name) : set.delete(name);
      return enabled;
    },
    contains: name => set.has(name),
  };
}

function element(rect = { left: 0, top: 0, width: 500, height: 500 }) {
  const attrs = {};
  const r = { ...rect, right: rect.right ?? rect.left + rect.width, bottom: rect.bottom ?? rect.top + rect.height };
  return {
    classList: classes(), dataset: {}, style: {}, listeners: {}, attrs,
    addEventListener(type, fn) { this.listeners[type] = fn; },
    setAttribute(name, value) { attrs[name] = String(value); },
    getAttribute(name) { return attrs[name]; },
    getBoundingClientRect() { return r; },
    setPointerCapture(id) { this.capture = id; },
    hasPointerCapture(id) { return this.capture === id; },
    releasePointerCapture(id) { if (this.capture === id) { this.capture = null; this.released = id; } },
    querySelector() { return { animate() {} }; },
    querySelectorAll() { return []; },
    innerHTML: '',
  };
}

function liveScene(Scene) {
  const owned = ['star'];
  const saveCalls = [];
  const scene = Object.create(Scene.prototype);
  Object.assign(scene, {
    alive: true, scene: 'meadow', ghosts: new Set(), activeGesture: null,
    ctx: { owned, stickerArt: () => '<svg/>', save: all => saveCalls.push(JSON.stringify(all)), sound() {} },
    all: { meadow: [{ id: 'star', x: 24, y: 34 }] }, selectedIndex: null,
    layer: { innerHTML: '', querySelectorAll: () => [], querySelector: () => null },
    board: element(), bin: element({ left: 400, top: 400, width: 100, height: 100 }),
  });
  scene.wireBin();
  const sticker = element();
  sticker.dataset.i = '0'; sticker.style.left = '24%'; sticker.style.top = '34%';
  scene.layer.querySelectorAll = () => [sticker];
  scene.wirePlaced(sticker);
  return { scene, sticker, owned, saveCalls };
}

test('sticker cleanup art and controls use the established palette and have wordless visible cues', () => {
  const src = read('src/letters/StickerScenes.js');
  const css = read('styles/letters-sticker-cleanup.css');
  for (const c of [...colours(src), ...colours(css)]) assert.ok(allowed.has(c.toLowerCase()), `${c} is in ART.md`);
  assert.match(src, /class="ss-bin" aria-label="Sticker bin"/);
  assert.match(src, /is-selected/);
  assert.match(css, /\.ss-bin\.is-target/);
  assert.match(css, /\.ss-sticker\.is-selected/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('tapping a placed sticker selects it, then tapping the bin removes only that placement', () => {
  const { Scene } = fixture(), { scene, sticker, owned, saveCalls } = liveScene(Scene);
  sticker.listeners.pointerdown({ pointerId: 1, button: 0, clientX: 100, clientY: 100 });
  sticker.listeners.pointerup({ pointerId: 1, clientX: 100, clientY: 100 });
  assert.equal(scene.selectedIndex, 0);
  assert.equal(sticker.classList.contains('is-selected'), true);
  assert.equal(sticker.getAttribute('aria-pressed'), 'true');
  assert.match(scene.bin.getAttribute('aria-label'), /Remove selected/);

  scene.bin.listeners.click();
  assert.equal(scene.all.meadow.length, 0);
  assert.deepEqual(owned, ['star'], 'cleanup does not revoke sticker ownership');
  assert.equal(saveCalls.length, 1, 'the scene arrangement is saved after removal');
  assert.equal(scene.selectedIndex, null);
});

test('dragging a placed sticker onto the generous bin target removes it and saves', () => {
  const { Scene } = fixture(), { scene, sticker, saveCalls } = liveScene(Scene);
  sticker.listeners.pointerdown({ pointerId: 2, button: 0, clientX: 120, clientY: 120 });
  sticker.listeners.pointermove({ pointerId: 2, clientX: 390, clientY: 440 });
  assert.equal(scene.overBin({ clientX: 390, clientY: 440 }), true, '24px target padding makes the bin forgiving');
  sticker.listeners.pointerup({ pointerId: 2, clientX: 390, clientY: 440 });
  assert.equal(scene.all.meadow.length, 0);
  assert.equal(saveCalls.length, 1);
});

test('a tray drag released over the bin does not place a sticker behind the bin', () => {
  const { Scene } = fixture(), scene = Object.create(Scene.prototype);
  let adds = 0;
  Object.assign(scene, {
    alive: true, scene: 'meadow', renderVersion: 1, activeGesture: null, ghosts: new Set(),
    ctx: { stickerArt: () => '<svg/>' }, board: element(),
    bin: element({ left: 400, top: 400, width: 100, height: 100 }),
    add() { adds += 1; },
  });
  const pick = element(); pick.dataset.sticker = 'star';
  scene.wirePick(pick, 1);
  pick.listeners.pointerdown({ pointerId: 6, button: 0, clientX: 300, clientY: 300 });
  pick.listeners.pointermove({ pointerId: 6, clientX: 450, clientY: 450 });
  pick.listeners.pointerup({ pointerId: 6, clientX: 450, clientY: 450 });
  assert.equal(adds, 0);
});

test('outside drops and cancelled drags return to the saved placement without deleting', () => {
  const { Scene } = fixture(), { scene, sticker, saveCalls } = liveScene(Scene);
  sticker.listeners.pointerdown({ pointerId: 3, button: 0, clientX: 120, clientY: 120 });
  sticker.listeners.pointermove({ pointerId: 3, clientX: -40, clientY: -40 });
  sticker.listeners.pointerup({ pointerId: 3, clientX: -40, clientY: -40 });
  assert.equal(scene.all.meadow.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(scene.all.meadow[0])), { id: 'star', x: 24, y: 34 });
  assert.equal(saveCalls.length, 0, 'a cancelled outside drop does not rewrite the arrangement');

  sticker.listeners.pointerdown({ pointerId: 4, button: 0, clientX: 120, clientY: 120 });
  sticker.listeners.pointermove({ pointerId: 4, clientX: 200, clientY: 200 });
  sticker.listeners.pointercancel({ pointerId: 4 });
  assert.equal(scene.all.meadow.length, 1);
  assert.equal(scene.activeGesture, null);
});

test('gesture cancellation clears the bin cue and releases capture; destroyed methods are inert', () => {
  const { Scene } = fixture(), { scene, sticker, saveCalls } = liveScene(Scene);
  sticker.listeners.pointerdown({ pointerId: 7, button: 0, clientX: 120, clientY: 120 });
  sticker.listeners.pointermove({ pointerId: 7, clientX: 450, clientY: 450 });
  assert.equal(scene.bin.classList.contains('is-target'), true);
  scene.cancelGesture();
  assert.equal(scene.bin.classList.contains('is-target'), false);
  assert.equal(sticker.released, 7);
  assert.equal(scene.all.meadow.length, 1);
  scene.alive = false;
  assert.equal(scene.add('star', 50, 50), false);
  assert.equal(scene.removeAt(0), false);
  scene.select(0);
  assert.equal(scene.selectedIndex, null);
  assert.equal(saveCalls.length, 0);
});

test('zero-sized bins cannot accept drops and stale keyboard handlers cannot select', () => {
  const { Scene } = fixture(), { scene, sticker } = liveScene(Scene);
  scene.bin = element({ left: 400, top: 400, width: 0, height: 0 });
  assert.equal(scene.overBin({ clientX: 400, clientY: 400 }), false);
  sticker.listeners.pointerdown({ pointerId: 8, button: 0, clientX: 120, clientY: 120 });
  scene.renderVersion = 2;
  const newerGesture = { element: element(), pointerId: 9, cancel() { this.cancelled = true; } };
  scene.activeGesture = newerGesture;
  sticker.listeners.pointerup({ pointerId: 8, clientX: 120, clientY: 120 });
  assert.equal(scene.activeGesture, newerGesture, 'an old DOM callback cannot cancel the new scene gesture');
  let prevented = false;
  sticker.listeners.keydown({ key: 'Enter', preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
  assert.equal(scene.selectedIndex, null);
});

test('destroying a scene during a tray drag removes only its own ghost', () => {
  const { Scene, ghosts } = fixture(), scene = Object.create(Scene.prototype);
  Object.assign(scene, { alive: true, activeGesture: null, ghosts: new Set(), ctx: { stickerArt: () => '<svg/>' } });
  const pick = element(); pick.dataset.sticker = 'star';
  scene.wirePick(pick);
  pick.listeners.pointerdown({ pointerId: 5, button: 0, clientX: 10, clientY: 10 });
  pick.listeners.pointermove({ pointerId: 5, clientX: 40, clientY: 40 });
  assert.equal(ghosts.length, 1);
  assert.equal(scene.ghosts.size, 1);
  scene.destroy();
  assert.equal(ghosts[0].removed, true);
  assert.equal(scene.ghosts.size, 0);
  assert.equal(scene.activeGesture, null);
});

test('destroying during a placed drag releases its pointer and cannot finish the bin drop', () => {
  const { Scene } = fixture(), { scene, sticker } = liveScene(Scene);
  sticker.listeners.pointerdown({ pointerId: 10, button: 0, clientX: 120, clientY: 120 });
  sticker.listeners.pointermove({ pointerId: 10, clientX: 450, clientY: 450 });
  assert.equal(scene.bin.classList.contains('is-target'), true);
  scene.destroy();
  assert.equal(sticker.released, 10);
  assert.equal(scene.bin.classList.contains('is-target'), false);
  assert.equal(scene.all.meadow.length, 1, 'a pending destructive drop is cancelled on teardown');
});


test('undo restores the exact removed placement and saves without changing ownership', () => {
  const { Scene } = fixture(), { scene, owned, saveCalls } = liveScene(Scene);
  scene.undoButton = element();
  scene.removeAt(0);
  assert.equal(scene.undoButton.disabled, false);
  assert.equal(scene.undoRemoval(), true);
  assert.deepEqual(JSON.parse(JSON.stringify(scene.all.meadow)), [{ id: 'star', x: 24, y: 34 }]);
  assert.deepEqual(owned, ['star']);
  assert.equal(saveCalls.length, 2);
  assert.equal(scene.undoButton.disabled, true);
  assert.equal(scene.undoRemoval(), false, 'repeated activation cannot duplicate the sticker');
});

test('removal history is separate for each picture and unwinds in order', () => {
  const { Scene } = fixture(), { scene } = liveScene(Scene);
  scene.all.meadow.push({ id: 'star', x: 60, y: 70 });
  scene.removeAt(0);
  scene.removeAt(0);
  scene.scene = 'sea'; scene.all.sea = [];
  assert.equal(scene.undoRemoval(), false, 'a meadow sticker cannot be restored into the sea');
  scene.scene = 'meadow';
  scene.undoRemoval(); scene.undoRemoval();
  assert.deepEqual(JSON.parse(JSON.stringify(scene.all.meadow)), [
    { id: 'star', x: 24, y: 34 }, { id: 'star', x: 60, y: 70 },
  ]);
});

test('undo retains later additions, respects the scene limit and is inert after leaving', () => {
  const { Scene } = fixture(), { scene } = liveScene(Scene);
  scene.removeAt(0);
  scene.all.meadow = Array.from({ length: 24 }, (_, i) => ({ id: 'star', x: 40, y: 40 + i }));
  assert.equal(scene.undoRemoval(), false, 'undo cannot evict a later placement from a full scene');
  assert.equal(scene.removals.meadow.length, 1);
  scene.all.meadow.pop();
  assert.equal(scene.undoRemoval(), true);
  assert.equal(scene.all.meadow.length, 24);
  assert.equal(scene.all.meadow[0].x, 24);
  scene.removeAt(0);
  scene.destroy();
  assert.equal(scene.undoRemoval(), false);
  assert.equal(scene.all.meadow.length, 23);
});
