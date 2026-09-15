const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const plain = (value) => JSON.parse(JSON.stringify(value));
function classList() { const set = new Set(); return { add: (x) => set.add(x), remove: (x) => set.delete(x), contains: (x) => set.has(x), toggle: (x, on) => on ? set.add(x) : set.delete(x) }; }
function node(dataset = {}) {
  const events = {}, attrs = {}; let captured = null;
  return { dataset, events, attrs, style: {}, innerHTML: '', disabled: false, scrollLeft: 0, clientWidth: 300, scrollWidth: 300,
    classList: classList(), setAttribute: (k, v) => { attrs[k] = v; },
    addEventListener: (k, fn) => { (events[k] ||= []).push(fn); }, removeEventListener() {},
    dispatch: (k, e = {}) => (events[k] || []).forEach((fn) => fn(e)),
    setPointerCapture: (id) => { captured = id; }, hasPointerCapture: (id) => captured === id,
    releasePointerCapture: () => { captured = null; }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 40, height: 40 }),
    scrollBy() {}, remove() { this.removed = true; }, focus() {}, hit: (x, y) => x >= 100 && x <= 150 && y >= 100 && y <= 150 };
}
function runtime(layout, catalog) {
  const slots = Array.from({ length: 4 }, (_, i) => { const slot = node({ slot: String(i) }); slot.hit = (x, y) => i === 3 && x >= 100 && x <= 150 && y >= 100 && y <= 150; return slot; });
  const choices = catalog.map((item) => node({ decoration: item.id }));
  const tray = node();
  const controls = { '.decorate-tray': tray, '.decorate-prev': node(), '.decorate-more': node(), '.decorate-undo': node(), '.decorate-remove': node(), '.decorate-done': node(), '.decorate-pet': node() };
  const stage = { html: '', nodes: [], events: {}, querySelector: (selector) => controls[selector], querySelectorAll: (selector) => selector === '.decorate-slot' ? slots : selector === '.decorate-choice' ? choices : [],
    addEventListener: (k, fn) => { (stage.events[k] ||= []).push(fn); }, removeEventListener() {},
    set innerHTML(value) { stage.html = value; } };
  const ghosts = []; const document = { body: { appendChild: (el) => ghosts.push(el) }, createElement: () => node() };
  const window = { MiftahGame: {
    LettersArt: { sticker: () => '<sticker>', icon: () => '<icon>' }, LettersGardenArt: { boat: () => '<boat>', flowerBed: () => '<flower>', practicePicture: () => '<picture>' },
    GardenPractice: { inside: (slot, x, y) => slot.hit(x, y) },
  } };
  const context = { window, document, performance: { now: () => 100 }, clearTimeout, setTimeout, console };
  for (const file of ['LettersDecorations.js', 'DecoratingGarden.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  let changes = 0;
  const ctx = { stage, layout, catalog, petArt: () => '<pet>', onChange: () => { changes++; }, play() {}, reducedMotion: () => true };
  const garden = new window.MiftahGame.DecoratingGarden(ctx);
  return { garden, slots, choices, controls, ghosts, changes: () => changes, stage };
}
const cat = [{ id: 'flower:1', label: 'Flower 1', kind: 'flower', count: 1 }, { id: 'sticker:star', label: 'Star', kind: 'sticker', stickerId: 'star' }];
const empty = { version: 1, slots: [null, null, null, null] };

test('select then place changes layout once and keeps four slots', () => {
  const r = runtime(empty, cat); r.choices[0].onclick(); r.slots[2].onclick();
  assert.deepEqual(plain(r.garden.layout), { version: 1, slots: [null, null, 'flower:1', null] }); assert.equal(r.changes(), 1);
});

test('click moving is unique; replacement can be undone', () => {
  const r = runtime({ version: 1, slots: ['flower:1', 'sticker:star', null, null] }, cat);
  r.slots[0].onclick(); r.slots[3].onclick(); assert.deepEqual(plain(r.garden.layout.slots), [null, 'sticker:star', null, 'flower:1']);
  r.choices[1].onclick(); r.slots[3].onclick(); assert.deepEqual(plain(r.garden.layout.slots), [null, null, null, 'sticker:star']);
  r.controls['.decorate-undo'].onclick(); assert.deepEqual(plain(r.garden.layout.slots), [null, 'sticker:star', null, 'flower:1']); assert.equal(r.changes(), 3);
});

test('remove then undo restores the selected decoration', () => {
  const r = runtime({ version: 1, slots: ['flower:1', null, null, null] }, cat); r.slots[0].onclick(); r.controls['.decorate-remove'].onclick();
  assert.deepEqual(plain(r.garden.layout.slots), [null, null, null, null]); r.controls['.decorate-undo'].onclick(); assert.deepEqual(plain(r.garden.layout.slots), ['flower:1', null, null, null]);
});

test('empty catalog disables inert slots and stale callbacks after destroy do nothing', () => {
  const r = runtime(empty, []); assert.ok(r.slots.every((slot) => slot.disabled)); const old = r.slots[0].onclick; r.garden.destroy(); old(); assert.equal(r.changes(), 0);
});

test('cancel, wrong pointer, and destroy clean up drag without saving', () => {
  const r = runtime(empty, cat); const choice = r.choices[0]; choice.dispatch('pointerdown', { pointerId: 1, button: 0, isPrimary: true, clientX: 10, clientY: 10 });
  choice.dispatch('pointermove', { pointerId: 1, clientX: 30, clientY: 10 }); assert.equal(r.ghosts.length, 1); choice.dispatch('pointerup', { pointerId: 2, clientX: 120, clientY: 120 }); assert.equal(r.changes(), 0); choice.dispatch('pointercancel', { pointerId: 1 }); assert.equal(r.changes(), 0); assert.equal(r.ghosts[0].removed, true);
  choice.dispatch('pointerdown', { pointerId: 3, button: 0, isPrimary: true, clientX: 10, clientY: 10 }); choice.dispatch('pointermove', { pointerId: 3, clientX: 30, clientY: 10 }); r.garden.destroy(); assert.equal(r.ghosts.at(-1).removed, true); choice.dispatch('pointerup', { pointerId: 3, clientX: 120, clientY: 120 }); assert.equal(r.changes(), 0);
});

test('valid drag between stationary slot targets saves and removes ghost', () => {
  const r = runtime({ version: 1, slots: ['flower:1', null, null, null] }, cat); const slot = r.slots[0];
  slot.dispatch('pointerdown', { pointerId: 7, button: 0, isPrimary: true, clientX: 10, clientY: 10 }); slot.dispatch('pointermove', { pointerId: 7, clientX: 30, clientY: 10 });
  slot.dispatch('pointerup', { pointerId: 7, clientX: 120, clientY: 120 }); assert.deepEqual(plain(r.garden.layout.slots), [null, null, null, 'flower:1']); assert.equal(r.changes(), 1); assert.equal(r.ghosts[0].removed, true);
});
