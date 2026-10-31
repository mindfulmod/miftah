const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classList() {
  const values = new Set();
  return { add: (...xs) => xs.forEach(x => values.add(x)), remove: (...xs) => xs.forEach(x => values.delete(x)),
    contains: x => values.has(x), toggle(x, force) { const on = force === undefined ? !values.has(x) : force; on ? values.add(x) : values.delete(x); return on; } };
}
function el(cls = '', dataset = {}, styleText = '') {
  const listeners = {};
  const style = { setProperty() {} };
  for (const match of styleText.matchAll(/([\w-]+):\s*([^;]+)/g)) style[match[1]] = match[2];
  const node = { className: cls, classList: classList(), dataset, style, listeners, innerHTML: '', disabled: false,
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    fire(type, event = {}) { for (const fn of listeners[type] || []) fn({ preventDefault() {}, stopPropagation() {}, ...event, type, target: event.target || this }); },
    closest(selector) { return selector.split(',').some(s => s.trim().slice(1).split('.').every(c => this.classList.contains(c))) ? this : null; },
    setPointerCapture() {}, hasPointerCapture() { return true; }, releasePointerCapture() {}, animate() {},
    insertAdjacentHTML(_where, html) { this.innerHTML += html; },
    getBoundingClientRect() { return { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 }; },
    querySelector(selector) { return selector === 'svg.lf' ? el('lf') : null; } };
  node.classList.add(...cls.split(/\s+/).filter(Boolean));
  return node;
}
class Root {
  set innerHTML(value) {
    this.html = value; this.nodes = {};
    for (const match of value.matchAll(/<([a-z]+)([^>]*)>/gi)) {
      const [, , attrs] = match, cls = attrs.match(/class="([^"]+)"/)?.[1];
      if (!cls) continue;
      const data = Object.fromEntries([...attrs.matchAll(/data-([\w-]+)="([^"]+)"/g)].map(m => [m[1], m[2]]));
      const style = attrs.match(/style="([^"]+)"/)?.[1] || '';
      const n = el(cls, data, style); (this.nodes ||= {});
      for (const c of cls.split(/\s+/)) (this.nodes[c] ||= []).push(n);
    }
  }
  querySelectorAll(selector) {
    const base = selector.split(/[:.]/).filter(Boolean)[0];
    let items = this.nodes?.[base] || [];
    if (selector.includes('.is-lit')) items = items.filter(n => n.classList.contains('is-lit'));
    if (selector.includes('.is-found')) items = items.filter(n => n.classList.contains('is-found'));
    if (selector.includes(':not(.is-found)')) items = items.filter(n => !n.classList.contains('is-found'));
    return items;
  }
  querySelector(selector) {
    const data = selector.match(/data-([\w-]+)="([^"]+)"/);
    const base = selector.match(/^\.([\w-]+)/)?.[1];
    return this.querySelectorAll(`.${base || ''}`).find(n => !data || n.dataset[data[1]] === data[2]) || null;
  }
}
function setup(overrides = {}) {
  const timers = [], outcomes = [], prompts = [], chars = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح'];
  const root = new Root();
  const ns = {
    LetterFriends: { FRIENDS: Object.fromEntries(chars.map(c => [c, {}])), art: (c, opts = {}) => `<svg class="lf" data-mode="${opts.mode || 'plain'}">${c}</svg>`, get: () => ({ call: 'chime' }), item: c => ({ id: c, display: c }) },
    LETTERS_DATA: { packs: [{ letters: chars.map((char, i) => ({ char, arName: `name ${i}` })) }] },
    PracticeLearning: { profile: (_ctx, _it, skill) => ({ choiceCount: 2, promptMode: skill === 'letter-name' ? 'listen' : 'match' }),
      level: () => 0, orderChars: (_ctx, pool, _skill, count = pool.length) => pool.slice(0, count) },
    GardenPractice: { draggable(_node, options) { (setup.drags ||= []).push(options); return () => {}; } },
  };
  const context = { window: { MiftahGame: ns }, setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {},
    Math: Object.assign(Object.create(Math), { random: () => 0.2 }) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'ShadowGames.js'), 'utf8'), context);
  const items = chars.map(display => ({ id: display, display, speak: display }));
  const ctx = { items, known: [], completedWorldIds: [], beginner: false, reducedMotion: () => true,
    stage: { clientWidth: 600, clientHeight: 400, innerHTML: '', get firstElementChild() { return root; } },
    reportOutcome: o => outcomes.push(o), beginRound() {}, say: () => true, sfx() {}, correct() {}, confettiAt() {}, done() {}, cancel() {},
    prompt: p => prompts.push(p?.display || null), canListen: () => true, pet: { cheer() {} }, ...overrides };
  return { ns, ctx, root, timers, outcomes, prompts, chars };
}
const run = (timers, ms) => timers.filter(t => t.ms === ms).forEach(t => t.fn());

test('shadow pools reject untaught, locked, prerequisite-blocked, and conflicting duplicate letters even without the helper', () => {
  const { ns, ctx, root } = setup({ items: [
    { id: 'a', display: 'ا' }, { id: 'b', display: 'ب' },
    { id: 'c', display: 'ت', taught: false }, { id: 'd', display: 'ث', locked: true },
    { id: 'e', display: 'ج', prerequisiteWorldIds: ['later'] }, { id: 'b-copy', display: 'ب', unlocked: false },
  ] });
  delete ns.PracticeLearning.orderChars;
  const game = new ns.GardenPractice.LetterShadows({ ...ctx, stage: { innerHTML: '', get firstElementChild() { return root; } }, prompt() {} });
  assert.deepEqual(Array.from(game.known), ['ا']);
  assert.equal(game.rounds, 1, 'the only offered target comes from the eligible pool');
});

test('beginner Lantern offers two unique taught choices even when choice helpers return extras', () => {
  const { ns, ctx } = setup();
  ns.PracticeLearning.orderChars = (_ctx, pool) => ['bad-letter', ...pool];
  ns.gardenBrain = { others: () => ['bad-letter', 'ث'] };
  const game = new ns.GardenPractice.LanternHunt(ctx);
  assert.ok(game.asks.every(c => game.known.includes(c)));
  assert.equal(new Set(game.hidden.map(h => h.c)).size, 2);
  assert.ok(game.hidden.every(h => game.known.includes(h.c)));
});

test('empty learning plans fall back to eligible letters instead of producing a blank visit', () => {
  const { ns, ctx } = setup();
  ns.PracticeLearning.orderChars = () => [];
  const lantern = new ns.GardenPractice.LanternHunt(ctx);
  const shadows = new ns.GardenPractice.LetterShadows(ctx);
  assert.equal(lantern.asks.length, 2);
  assert.equal(shadows.order.length, ctx.items.length);
  assert.ok([...lantern.asks, ...shadows.order].every(c => lantern.known.includes(c)));
});

test('Lantern playback failure and timeout reveal the prompt; an eager answer stays assisted and old speech is ignored', async () => {
  const { ns, ctx, root, timers, prompts, outcomes } = setup();
  let release;
  ctx.say = () => new Promise(resolve => { release = resolve; });
  const game = new ns.GardenPractice.LanternHunt(ctx);
  run(timers, 300);
  const pending = game.hidden.findIndex(h => h.c === game.target);
  const button = root.querySelector(`.sh-thing[data-i="${pending}"]`);
  game.moveTo(game.hidden[pending].x, game.hidden[pending].y);
  game.pick(pending, button);
  assert.equal(outcomes[0].evidence, 'supported_visible_matching', 'answering before playback is verified cannot earn listening evidence');
  assert.equal(outcomes[0].assisted, true);
  assert.equal(outcomes[0].affectsStrength, false, 'a guess before either verified sound or a shown reference cannot strengthen learning');
  const current = game.roundToken;
  game.roundToken += 1;
  release(true); await Promise.resolve();
  assert.equal(game.heard, false, 'speech from an old round cannot change listening state');
  game.roundToken = current;

  const failed = setup();
  failed.ctx.say = () => Promise.reject(new Error('unavailable'));
  const rejected = new failed.ns.GardenPractice.LanternHunt(failed.ctx);
  run(failed.timers, 300); await new Promise(resolve => setImmediate(resolve));
  assert.ok(failed.prompts.includes(rejected.target));
  assert.equal(rejected.heard, false);
  const waiting = setup(); waiting.ctx.say = () => new Promise(() => {});
  const timed = new waiting.ns.GardenPractice.LanternHunt(waiting.ctx);
  run(waiting.timers, 300);
  run(waiting.timers, 5000);
  assert.ok(waiting.prompts.includes(timed.target), 'a stalled speech service falls back to visible matching');
  assert.equal(timed.assisted, true);
});

test('Lantern pointer ownership makes a dark tap reveal, a second tap select, and duplicate awards impossible', () => {
  const { ns, ctx, root, outcomes } = setup();
  const game = new ns.GardenPractice.LanternHunt(ctx);
  const i = game.hidden.findIndex(h => h.c === game.target);
  const b = root.querySelector(`.sh-thing[data-i="${i}"]`);
  const h = game.hidden[i], r = game.scene.getBoundingClientRect();
  const e = { target: b, pointerId: 7, isPrimary: true, pointerType: 'touch', clientX: r.left + r.width * h.x / 100,
    clientY: r.top + r.height * h.y / 100, preventDefault() {} };
  game.pointerDown(e); game.pointerUp(e);
  assert.equal(game.isLit(b), true);
  const before = outcomes.length;
  b.fire('click');
  assert.equal(outcomes.length, before, 'the click following a dark tap is suppressed');
  game.pointerDown(e); b.fire('click');
  assert.equal(outcomes.length, before + 1, 'a second tap selects the revealed letter');
  assert.equal(game.pick(i, b), false, 'a found copy cannot award twice');
  game.pointerDown({ ...e, pointerId: 8, target: game.scene });
  game.pointerDown({ ...e, pointerId: 9, isPrimary: false });
  assert.equal(game.pointerOwner, 8, 'a second finger cannot steal a lantern sweep');
  game.pointerCancel({ pointerId: 8 });
  assert.equal(game.pointerOwner, null);
  assert.match(root.html, /<div class="sh-footer"><span class="sh-jar"/);
});

test('Letter Shadows holds visit difficulty and adds choices before another shadow and plain forms', () => {
  const { ns, ctx, root } = setup();
  ns.PracticeLearning.level = () => 1;
  const game = new ns.GardenPractice.LetterShadows(ctx);
  assert.equal(game.level, 1);
  assert.equal(game.targets.length, 1);
  assert.equal(game.offered.length, 3);
  game.level = 1; ns.PracticeLearning.level = () => 2; game.next();
  assert.equal(game.level, 1, 'difficulty is a visit snapshot');
  assert.equal(game.targets.length, 1);
  const advanced = new ns.GardenPractice.LetterShadows(ctx);
  advanced.level = 2; advanced.next();
  assert.equal(advanced.targets.length, 2);
  assert.equal(advanced.offered.length, 3);
  assert.match(root.html, /sh-shadow/);
  const plain = new ns.GardenPractice.LetterShadows(ctx);
  plain.level = 3; plain.next();
  assert.equal(plain.targets.length, 2);
  assert.match(root.html, /data-mode="plain"/);
});

test('Letter Shadows keeps tap matching and accepts only drops near a shadow', () => {
  setup.drags = [];
  const { ns, ctx, root, outcomes } = setup();
  ns.PracticeLearning.level = () => 2;
  const game = new ns.GardenPractice.LetterShadows(ctx);
  const drag = setup.drags.at(-game.offered.length);
  assert.equal(drag.drop(-50, -50), false, 'outside drops do not count');
  const [first, second] = root.querySelectorAll('.sh-shadow');
  first.getBoundingClientRect = () => ({ left: 100, top: 100, right: 200, bottom: 200, width: 100, height: 100 });
  second.getBoundingClientRect = () => ({ left: 250, top: 100, right: 350, bottom: 200, width: 100, height: 100 });
  const otherTargetIndex = game.offered.findIndex(c => c === second.dataset.c);
  const wrongTargetDrop = setup.drags.at(-game.offered.length + otherTargetIndex);
  assert.equal(wrongTargetDrop.drop(101, 101), true, 'an in-target wrong drop is handled with gentle feedback');
  assert.equal(game.missed, true);
  assert.equal(game.left.length, 2, 'a letter dropped on another target is not accepted');
  const firstIndex = game.offered.findIndex(c => c === first.dataset.c);
  const firstDrag = setup.drags.at(-game.offered.length + firstIndex);
  assert.equal(firstDrag.drop(101, 101), true, 'a correct nonfinal drop counts as handled');
  assert.deepEqual(Array.from(game.left), [second.dataset.c]);
  const secondIndex = game.offered.findIndex(c => c === second.dataset.c);
  const secondDrag = setup.drags.at(-game.offered.length + secondIndex);
  assert.equal(secondDrag.drop(251, 101), true, 'a matching letter can be dropped on its own shadow');
  assert.ok(outcomes.some(o => o.correct));
  const staleTile = root.querySelectorAll('.pz-tile')[0];
  game.next();
  const reportsBefore = outcomes.length;
  staleTile.fire('click');
  assert.equal(outcomes.length, reportsBefore, 'an old tile closure cannot answer in the next round');
  assert.match(root.html, /sh-theatre-art|sh-screen/);
});

test('Lantern hiding centers include the full minimum card inside a narrow scene', () => {
  const { ns, ctx } = setup();
  ctx.stage.clientWidth = 250; ctx.stage.clientHeight = 200;
  const game = new ns.GardenPractice.LanternHunt(ctx);
  const width = 250, height = 150, half = 31;
  assert.ok(game.hidden.every(({ x, y }) => x / 100 * width >= half && (100 - x) / 100 * width >= half
    && y / 100 * height >= half && (100 - y) / 100 * height >= half), 'each hiding card stays within the scene bounds');
});

test('Lantern lost capture and obsolete buttons cannot leave a stuck sweep or answer another round', () => {
  const { ns, ctx, root, outcomes } = setup();
  const game = new ns.GardenPractice.LanternHunt(ctx);
  const oldButton = root.querySelector('.sh-thing');
  game.pointerDown({ pointerId: 23, isPrimary: true, pointerType: 'touch', target: game.scene, clientX: 12, clientY: 12 });
  assert.equal(game.pointerOwner, 23);
  game.scene.fire('lostpointercapture', { pointerId: 23 });
  assert.equal(game.pointerOwner, null);
  game.next();
  oldButton.fire('click');
  assert.equal(outcomes.length, 0);
  game.pointerDown({ pointerId: 24, isPrimary: true, pointerType: 'touch', target: game.scene, clientX: 12, clientY: 12 });
  game.destroy();
  assert.equal(game.pointerOwner, null);
});

test('failed answer feedback is contained while its caller still receives the failed promise', async () => {
  const { ns, ctx } = setup();
  const failure = Promise.reject(new Error('missing feedback audio'));
  ctx.say = () => failure;
  const game = new ns.GardenPractice.LanternHunt(ctx);
  assert.equal(game.say({ display: 'ب' }), failure);
  await new Promise(resolve => setImmediate(resolve));
  game.destroy();
});
