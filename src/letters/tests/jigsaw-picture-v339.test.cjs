const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadPicture() {
  const items = { FRIENDS: { 'ب': {}, 'ت': {}, 'ث': {} }, art: c => `<svg data-friend="${c}" viewBox="0 0 100 100"></svg>`,
    get: c => ({ en: `friend ${c}` }) };
  const ns = { LetterFriends: items, LettersArt: { icon: () => '<i/>' }, LettersGardenArt: { practicePicture: () => '<i/>' },
    GardenPractice: { draggable: () => () => {}, inside: () => false } };
  const context = { window: { MiftahGame: ns }, Promise };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'JigsawPicture.js'), 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'ToyBoxGames.js'), 'utf8'), context);
  return ns;
}

function item(id, display) { return { id, display }; }

test('picture plan filters unknown friends, deduplicates ids, and caps the choice list', () => {
  const Plan = loadPicture().JigsawPicture.Plan;
  const plan = new Plan([item('a','ب'), item('a','ت'), item('b','ت'), item('c','ث'), item('d','ب'), item('e','ت'), item('f','ب'), item('bad','x')]);
  assert.deepEqual(Array.from(plan.items, x => x.id), ['a','b','c','d']);
  assert.equal(plan.select('bad'), false);
  assert.equal(plan.ready(), false);
});

test('picture plan places two friends, swaps occupied slots, and never duplicates a friend', () => {
  const Plan = loadPicture().JigsawPicture.Plan, plan = new Plan([item('b','ب'), item('t','ت')]);
  assert.equal(plan.select('b'), true); assert.equal(plan.place(0), true);
  assert.equal(plan.select('t'), true); assert.equal(plan.place(1), true);
  assert.equal(plan.select('b'), true); assert.equal(plan.place(1), true);
  assert.deepEqual(Array.from(plan.snapshot(), x => x?.id), ['t','b']);
  assert.equal(new Set(plan.snapshot().filter(Boolean)).size, 2);
  assert.equal(plan.place(0), false);
});

test('picture plan removes a placed friend and snapshots do not share the mutable layout', () => {
  const Plan = loadPicture().JigsawPicture.Plan, plan = new Plan([item('b','ب')], [item('b','ب')]);
  const saved = plan.snapshot();
  assert.equal(plan.clear(0), true); assert.equal(plan.clear(0), false);
  assert.equal(plan.ready(), false);
  assert.equal(saved[0].id, 'b');
  assert.equal(plan.select('b'), true);
  const before = plan.snapshot();
  assert.equal(plan.place(2), false);
  assert.equal(plan.place(-1), false);
  assert.deepEqual(Array.from(plan.snapshot()), Array.from(before));
});

test('picture SVG places left and right friend artwork at their intended coordinates', () => {
  const svg = loadPicture().JigsawPicture.picture([item('b','ب'), item('t','ت')], 180);
  assert.match(svg, /<svg x="-2" y="25" data-friend="ب"/);
  assert.match(svg, /<svg x="52" y="25" data-friend="ت"/);
  assert.match(svg, /width="180" height="180"/);
});

function fakeElement() {
  return { dataset: {}, style: {}, classList: { toggle() {} }, isConnected: true, setAttribute() {}, focus() {} };
}

test('editor builds once, rejects stale build callbacks, and resets its drags on destroy', () => {
  const ns = loadPicture(), listeners = {}, resets = [];
  const friend = fakeElement(); friend.dataset.item = '0';
  const place = fakeElement(); place.dataset.place = '0';
  const build = fakeElement(), back = fakeElement(), panel = fakeElement();
  const root = { contains: n => n === panel || n === friend || n === place || n === build || n === back,
    set innerHTML(_) {},
    querySelector: s => ({ '.jp-editor': panel, '.jp-build': build, '.jp-back': back }[s]),
    querySelectorAll: s => s === '.jp-friend' ? [friend] : s === '.jp-place' ? [place] : [], };
  ns.GardenPractice.draggable = (_button, opts) => { listeners.drag = opts; return () => resets.push('reset'); };
  const built = [];
  const editor = new ns.JigsawPicture({ say() {}, sfx() {} }, root, [item('b','ب')], [], layout => built.push(layout), () => {});
  const oldBuild = build.onclick, oldFriendClick = friend.onclick, oldDrag = listeners.drag;
  friend.onclick(); place.onclick(); // place rerenders while the editor remains active
  assert.equal(editor.alive, true);
  assert.equal(editor.plan.layout[0].id, 'b');
  oldBuild();
  oldFriendClick();
  oldDrag.onDragStart();
  assert.equal(editor.plan.selected, null, "old drag start cannot select a friend after rerender");
  assert.equal(oldDrag.drop(10, 10), false, 'old drag drop cannot act after rerender');
  assert.equal(built.length, 0);
  assert.equal(editor.plan.layout[0].id, 'b', 'stale callbacks leave the new layout intact');
  build.onclick(); build.onclick();
  assert.equal(built.length, 1);
  assert.equal(built[0][0].id, 'b');
  assert.ok(resets.length >= 1);
  assert.equal(listeners.drag.enabled(), false, 'destroyed editor disables its captured drag');
});

test('completed custom pictures record one participation and wait for the child to finish', () => {
  const ns = loadPicture();
  const counters = { participation: 0, done: 0, complete: 0 };
  const tray = { set innerHTML(_) {} }, edit = fakeElement(), done = fakeElement();
  let attached = true;
  const root = { contains: n => attached && (n === done || n === edit), querySelector: s => s === '.tb-tray' ? tray : s === '.jp-edit' ? edit : done };
  const game = Object.create(ns.GardenPractice.FriendJigsaw.prototype);
  Object.assign(game, { alive: true, root, c: 'ب', roundToken: 3, customRecorded: false,
    participated() { counters.participation++; }, finish() { counters.done++; } });
  game.pictureComplete();
  const oldDone = done.onclick, oldEdit = edit.onclick;
  game.roundToken++;
  oldDone(); oldEdit();
  assert.equal(counters.done, 0, 'old completion controls cannot act in a later round');
  assert.equal(counters.participation, 1);
  game.pictureComplete(); game.pictureComplete();
  assert.equal(counters.participation, 1);
  assert.equal(counters.done, 0, 'completion itself does not advance the child');
  done.onclick(); done.onclick();
  assert.equal(counters.done, 1, 'the explicit finish control is one-shot');
  game.roundToken++;
  game.pictureComplete();
  const detachedDone = done.onclick, detachedEdit = edit.onclick;
  done.disabled = false;
  attached = false;
  detachedDone(); detachedEdit();
  assert.equal(counters.done, 1, 'detached completion controls cannot affect the game');
  assert.equal(counters.participation, 1);
});

test('custom puzzle scene renders the authored picture', () => {
  const ns = loadPicture(), game = Object.create(ns.GardenPractice.FriendJigsaw.prototype);
  game.customPicture = [item('b','ب'), null];
  assert.match(game.scene('ت', 120), /data-friend="ب"/);
  assert.doesNotMatch(game.scene('ت', 120), /data-friend="ت"/);
});
