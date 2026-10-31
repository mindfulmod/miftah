const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classList() {
  const names = new Set();
  return { add: (...v) => v.forEach(x => names.add(x)), remove: (...v) => v.forEach(x => names.delete(x)), contains: x => names.has(x), toggle(x, force) { const on = force === undefined ? !names.has(x) : force; on ? names.add(x) : names.delete(x); return on; } };
}
function node(cls = '', data = {}, rect = null) {
  const listeners = {};
  return {
    className: cls, classList: classList(), dataset: data, listeners, disabled: false, isConnected: true, innerHTML: '', attrs: {},
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    fire(type = 'click') { for (const fn of listeners[type] || []) fn({ target: this, preventDefault() {} }); },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    querySelector(sel) { if (sel === '.lk-letter') return this.letter || null; if (sel === '.lk-seats') return this.seats || null; return null; },
    insertAdjacentHTML(_where, html) { this.innerHTML += html; }, animate() {},
    getBoundingClientRect() { return rect || { left: Number(data.i || 0) * 120, top: 0, right: Number(data.i || 0) * 120 + 100, bottom: 100 }; },
  };
}
class Root {
  constructor(nodeListLike = false) { this.classList = classList(); this.isConnected = true; this.nodes = {}; this.html = ''; this.nodeListLike = nodeListLike; }
  set innerHTML(html) {
    this.html = html; this.nodes = {};
    for (const m of html.matchAll(/<([a-z]+)[^>]*class="([^"]+)"([^>]*)>/gi)) {
      const [, tag, raw, attrs] = m, names = raw.split(/\s+/), cls = names.find(x => /^lk-/.test(x));
      if (!cls) continue;
      const data = {};
      for (const a of attrs.matchAll(/data-([\w-]+)="([^"]+)"/g)) data[a[1] === 'i' ? 'i' : a[1]] = a[2];
      const el = node(cls, data); el.tagName = tag.toUpperCase(); el.classList.add(...names);
      for (const a of attrs.matchAll(/aria-label="([^"]*)"/g)) el.setAttribute('aria-label', a[1]);
      if (cls === 'lk-stone') el.letter = node('lk-letter');
      if (cls === 'lk-bus') el.seats = node('lk-seats');
      (this.nodes[cls] ||= []).push(el);
    }
  }
  get innerHTML() { return this.html; }
  querySelectorAll(sel) {
    const [cls, attr] = sel.slice(1).split('['); let list = this.nodes[cls] || [];
    if (attr) { const [key, raw] = attr.replace(']', '').split('='); const val = raw?.replaceAll('"', ''); list = list.filter(n => String(n.dataset[key.replace('data-', '')]) === val); }
    if (!this.nodeListLike) return list;
    const fixture = { length: list.length, forEach(fn) { list.forEach(fn); }, [Symbol.iterator]: function* () { yield* list; } };
    list.forEach((n, i) => { fixture[i] = n; });
    return fixture;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}
function setup({ level = 0, count = 8, items = null, nodeListLike = false } = {}) {
  const chars = ['ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ'];
  const friends = Object.fromEntries(chars.map(c => [c, {}]));
  const itemsIn = items || chars.slice(0, count).map((display, i) => ({ id: `real-${i}`, display, speak: `name ${i}` }));
  const timers = [], outcomes = [], drags = [], dragResets = [];
  const paths = Object.fromEntries(chars.map((c, i) => [c, [i < 3 ? 'family-a' : i < 6 ? 'family-b' : 'family-c']]));
  const ns = {
    LetterFriends: { FRIENDS: friends, art: c => `<svg>${c}</svg>`, get: c => ({ call: `call-${c}` }) },
    LettersStrokes: { LETTERS: paths },
    LETTERS_DATA: { packs: [{ letters: chars.map((char, i) => ({ char, arName: `name ${i}` })) }] },
    PracticeLearning: {
      plan(_ctx, pool, _skill, n) { return pool.slice(0, n); },
      level() { return level; },
      profile() { return { choiceCount: level ? 3 : 2, promptMode: 'match' }; },
    },
    GardenPractice: {
      draggable(_el, options) { drags.push(options); return () => dragResets.push(true); },
    },
  };
  const root = new Root(nodeListLike);
  const ctx = {
    items: itemsIn, known: [], stage: { set innerHTML(_html) { root.innerHTML = _html; }, get firstElementChild() { return root; }, contains(el) { return el === root; } },
    reducedMotion: () => true, reportOutcome: o => outcomes.push(o), beginRound() {}, say() { return true; }, sfx() {}, correct() {}, confettiAt() {}, done() {}, cancel() {}, pet: { cheer() {}, watch() {} },
  };
  const context = { window: { MiftahGame: ns }, setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {}, Math: Object.assign(Object.create(Math), { random: () => 0.37 }) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'LookGames.js'), 'utf8'), context);
  return { ns, ctx, root, timers, outcomes, drags, dragResets };
}

test('SpotChange validates a once-planned visit and freezes novice choices and rounds', () => {
  const blocked = { id: 'locked-b', display: 'ب', locked: true };
  const all = [blocked, { id: 'open-b', display: 'ب' }, { id: 't', display: 'ت' }, { id: 'th', display: 'ث' }, { id: 'j', display: 'ج' }, { id: 'h', display: 'ح' }];
  const { ns, ctx, root } = setup({ items: all });
  let plans = 0;
  ns.PracticeLearning.plan = (_ctx, pool, _skill, n) => { plans++; assert.ok(pool.every(i => i.id !== 'locked-b')); return pool.slice(0, n); };
  const game = new ns.GardenPractice.SpotChange(ctx);
  assert.equal(plans, 1);
  assert.equal(game.choiceCount, 2);
  assert.equal(game.rounds, 3);
  assert.equal(root.querySelectorAll('.lk-stone').length, 2);
  assert.ok(game.known.every(i => all.some(x => x.id === i.id)), 'planner retains real item records');
});

test('SpotChange is self-paced, reference replay assists, invalid and stale answers are ignored', () => {
  const { ns, ctx, root, timers, outcomes } = setup();
  const game = new ns.GardenPractice.SpotChange(ctx);
  const firstToken = game.roundToken;
  const firstStone = root.querySelectorAll('.lk-stone')[0];
  assert.equal(game.phase, 'look');
  firstStone.fire();
  assert.equal(outcomes.length, 0, 'guess before observing cannot score');
  const eye = root.querySelector('.lk-eye');
  assert.match(eye.attrs['aria-label'], /Ready to spot/);
  eye.fire();
  assert.equal(game.phase, 'blink');
  timers.find(t => t.ms === 900).fn();
  assert.equal(game.phase, 'find');
  const currentEye = root.querySelector('.lk-eye');
  assert.equal(currentEye.attrs['aria-label'], 'Look again');
  currentEye.fire();
  assert.equal(game.phase, 'look');
  assert.equal(game.busy, false);
  assert.equal(game.missed, true);
  assert.ok(root.querySelectorAll('.lk-stone').every ? root.querySelectorAll('.lk-stone').every(stone => stone.disabled) : [...root.querySelectorAll('.lk-stone')].every(stone => stone.disabled), 'reference replay disables answer stones');
  assert.equal(timers.some(t => t.ms === 1500), false, 'the child can keep studying the reference');
  currentEye.fire();
  assert.equal(game.phase, 'blink');
  timers.filter(t => t.ms === 900).at(-1).fn();
  assert.equal(game.busy, false);
  assert.ok([...root.querySelectorAll('.lk-stone')].every(stone => !stone.disabled));
  assert.equal(game.pick(-1, firstStone), false);
  const wrong = 1 - game.at;
  assert.equal(game.pick(wrong, root.querySelectorAll('.lk-stone')[wrong]), true, 'a handled wrong tap is still a handled action');
  assert.equal(game.busy, true, 'feedback briefly locks duplicate answers');
  assert.equal(root.querySelector('.lk-eye').disabled, true, 'reference replay stays disabled during feedback');
  timers.find(t => t.ms === 650).fn();
  assert.equal(game.busy, false);
  const changed = game.at;
  assert.equal(game.pick(changed, root.querySelectorAll('.lk-stone')[changed]), true);
  assert.equal(outcomes[0].correct, false);
  assert.equal(outcomes[0].itemId, game.intoItem.id);
  assert.equal(outcomes[0].affectsStrength, false);
  assert.equal(outcomes[0].assisted, true);
  assert.equal(outcomes[1].correct, true);
  assert.equal(game.phase, 'compare');
  assert.equal(timers.some(t => t.ms === 1800), false, 'the explanation waits for the child');
  timers.find(t => t.ms === 320).fn();
  assert.equal(game.continue(), true);
  assert.notEqual(game.roundToken, firstToken);
  const before = outcomes.length;
  assert.equal(game.pick(changed, firstStone, firstToken, root), false);
  assert.equal(outcomes.length, before, 'an old DOM callback cannot report after round replacement');
});

test('SpotChange remains frozen at three choices and advances only through explicit observe action', () => {
  const { ns, ctx, root, timers } = setup({ level: 1 });
  const game = new ns.GardenPractice.SpotChange(ctx);
  assert.equal(game.choiceCount, 3);
  assert.equal(game.rounds, 4);
  const round = game.roundToken;
  assert.equal(game.phase, 'look');
  assert.equal(timers.some(t => t.ms > 900), false, 'there is no automatic look countdown');
  root.querySelector('.lk-eye').fire();
  assert.equal(game.roundToken, round);
});

test('SpotChange clamps a later board to its planned pool and keeps the visit difficulty fixed', () => {
  const { ns, ctx, root } = setup({ level: 1 });
  ns.PracticeLearning.plan = (_ctx, pool, _skill, n) => pool.slice(0, Math.min(3, n));
  const game = new ns.GardenPractice.SpotChange(ctx);
  assert.equal(game.rounds, 4);
  assert.equal(game.boardSize, 2, 'one planned letter remains available as the changed-in choice');
  assert.equal(root.querySelectorAll('.lk-stone').length, 2);
});

test('FamilyBuses uses distinct planned families, same-body different-letter drivers, and retains real IDs', () => {
  const { ns, ctx, root, outcomes } = setup();
  const game = new ns.GardenPractice.FamilyBuses(ctx);
  assert.equal(game.choiceCount, 2);
  assert.equal(game.queue.length, 3);
  assert.notEqual(game.want, game.c);
  assert.equal(game.famOf(game.want).includes(game.c), true);
  assert.match(root.html, /role="img" aria-label="Waiting letter /);
  const right = game.buses.indexOf(game.want);
  assert.equal(game.pick(right, root.querySelectorAll('.lk-bus')[right]), true);
  assert.equal(outcomes[0].itemId, game.riderItem.id);
  assert.equal(outcomes[0].selectedId, game.wantItem.id);
  assert.equal(outcomes[0].affectsStrength, false);
  assert.match(root.querySelectorAll('.lk-bus')[right].querySelector('.lk-seats').innerHTML, /lk-passenger/);
});

test('FamilyBuses clamps later choices to the planned families that actually exist', () => {
  const { ns, ctx, root } = setup({ level: 1, count: 6 });
  const game = new ns.GardenPractice.FamilyBuses(ctx);
  assert.equal(game.level, 1);
  assert.equal(game.fams.length, 2);
  assert.equal(game.choiceCount, 2);
  assert.equal(root.querySelectorAll('.lk-bus').length, 2);
});

test('FamilyBuses handles NodeList drops, one receiving cue, outside drops and stale drag callbacks', () => {
  const { ns, ctx, root, drags, outcomes, timers, dragResets } = setup({ nodeListLike: true });
  const game = new ns.GardenPractice.FamilyBuses(ctx);
  const drag = drags[0], token = game.roundToken, buses = root.querySelectorAll('.lk-bus');
  assert.equal(typeof buses.map, 'undefined');
  assert.equal(typeof buses.includes, 'undefined');
  assert.equal(drag.drop(-100, -100), false);
  const wrong = game.buses.findIndex(d => d !== game.want);
  const wrongBus = buses[wrong], r = wrongBus.getBoundingClientRect();
  drag.onDragMove((r.left + r.right) / 2, (r.top + r.bottom) / 2);
  assert.equal([...buses].filter(bus => bus.classList.contains('is-receiving')).length, 1);
  assert.equal(wrongBus.classList.contains('is-receiving'), true);
  drag.onDragEnd();
  assert.equal(drag.drop((r.left + r.right) / 2, (r.top + r.bottom) / 2), true);
  assert.equal(outcomes[0].correct, false);
  assert.equal(game.missed, true);
  const right = game.buses.indexOf(game.want), rb = buses[right], rr = rb.getBoundingClientRect();
  timers.find(t => t.ms === 650).fn();
  assert.equal(drag.drop(rr.right + 20, (rr.top + rr.bottom) / 2), true, '28px forgiving margin accepts a nearby drop');
  assert.equal(outcomes[1].correct, true);
  assert.equal(game.readyToLeave, false);
  timers.find(t => t.ms === 320).fn();
  assert.equal(game.depart(), true);
  timers.find(t => t.ms === 220).fn();
  assert.notEqual(game.roundToken, token);
  assert.equal(dragResets.length, 1, 'the prior round drag is reset as the next one begins');
  const n = outcomes.length;
  assert.equal(drag.drop(1, 1), false);
  assert.equal(outcomes.length, n, 'old drag callbacks cannot target the next board');
});

test('Look games keep an explicit empty plan empty and cancel without a practice round', () => {
  const { ns, ctx, timers } = setup();
  ns.PracticeLearning.plan = () => [];
  let cancelled = 0, begun = 0;
  ctx.cancel = () => { cancelled++; };
  ctx.beginRound = () => { begun++; };
  new ns.GardenPractice.SpotChange(ctx);
  timers.find(t => t.ms === 300).fn();
  assert.equal(cancelled, 1);
  assert.equal(begun, 0);
});

test('Look item planning blocks prerequisite aliases and collapses NFC displays before planning', () => {
  const { ns, ctx } = setup({ items: [
    { id: 'a', display: 'ب' }, { id: 't', display: 'ت' }, { id: 'th', display: 'ث' },
    { id: 'j', display: 'ج' }, { id: 'h', display: 'ح' }, { id: 'kh', display: 'خ' },
    { id: 'locked-d', display: 'د', locked: true }, { id: 'open-d-alias', display: 'د' },
    { id: 'prereq', display: 'ذ', prerequisiteWorldIds: ['earlier'] },
    { id: 'alif-hamza', display: 'أ' }, { id: 'alif-hamza-alias', display: 'ا\u0654' },
  ] });
  ns.LetterFriends.FRIENDS['أ'] = {};
  ns.LettersStrokes.LETTERS['أ'] = ['family-alif'];
  ctx.completedWorldIds = [];
  ctx.worldId = 'current';
  let offered;
  ns.PracticeLearning.plan = (_ctx, pool, _skill, n) => { offered = pool.slice(); return [{ id: 'prereq', display: 'ذ' }, { id: 'locked-d', display: 'د' }, ...pool].slice(0, n); };
  const game = new ns.GardenPractice.SpotChange(ctx);
  assert.equal(offered.some(i => ['prereq', 'locked-d', 'open-d-alias'].includes(i.id)), false);
  assert.equal(offered.filter(i => i.display === 'أ').length, 1, 'canonical display appears once');
  assert.equal(offered.find(i => i.display === 'أ').id, 'alif-hamza', 'the first real record retains its ID');
  assert.equal(game.planned.some(i => ['prereq', 'locked-d', 'open-d-alias'].includes(i.id)), false, 'planner cannot re-add filtered records');
});

test('Look game speech rejection is consumed without changing board state', async () => {
  const { ns, ctx, root, timers } = setup();
  ctx.say = () => Promise.reject(new Error('audio unavailable'));
  const game = new ns.GardenPractice.FamilyBuses(ctx);
  timers.filter(t => t.ms === 300)[0]?.fn();
  await Promise.resolve();
  assert.ok(root.querySelectorAll('.lk-bus').length > 0);
  assert.equal(game.busy, false);
});
