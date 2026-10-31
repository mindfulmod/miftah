const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classes() { const s = new Set(); return { add: (...x) => x.forEach(v => s.add(v)), remove: (...x) => x.forEach(v => s.delete(v)), contains: x => s.has(x), toggle(x, force) { const on = force === undefined ? !s.has(x) : force; on ? s.add(x) : s.delete(x); return on; } }; }
function node(index = 0, anim = () => null) {
  const events = new Map();
  let html = ''; const el = { dataset: { i: String(index) }, classList: classes(), style: {}, hidden: false, disabled: false, isConnected: true, focused: false,
    focus() { this.focused = true; }, addEventListener(type, fn) { const a = events.get(type) || []; a.push(fn); events.set(type, a); },
    dispatch(type, event = {}) { if (this.disabled) return; for (const fn of events.get(type) || []) fn(event); this[`on${type}`]?.(event); },
    animate(...args) { return anim(...args); }, getBoundingClientRect() { return { left: 10, top: 20, right: 70, bottom: 80, width: 60, height: 60 }; },
    setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture() { return false; }, setAttribute() {}, removeAttribute() {},
    querySelector(selector) { return selector === '.wd-whole' ? this.whole || null : null; } };
  Object.defineProperty(el, 'innerHTML', { get() { return html; }, set(value) { html = value; if (value.includes('class="wd-whole"')) this.whole = node(0, anim); } });
  return el;
}
function runtime({ reduced = false, animate = () => null } = {}) {
  const timers = new Map(); let tid = 0; const calls = [], spoken = [];
  const friends = { FRIENDS: Object.fromEntries([...'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'].map(c => [c, true])), art: () => '<svg></svg>' };
  const ns = { LetterFriends: friends, LettersArt: { icon: () => '<svg></svg>' }, PracticeLearning: { profile: () => ({ choiceCount: 2 }), level: () => 0, plan: (_c, items) => items.slice(0, 2) } };
  const root = { refs: {}, groups: {}, classList: classes(), innerHTML: '',
    querySelector(s) { return this.refs[s] || null; },
    querySelectorAll(s) { if (s === '.wd-card, .wd-piece') return this.groups['.wd-piece'] || []; return this.groups[s] || []; },
    contains(el) { return Object.values(this.refs).includes(el) || Object.values(this.groups).some(a => a.includes(el)) || Object.values(this.refs).some(a => a?.whole === el); } };
  const stage = { firstElementChild: root, set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html; } };
  // Materialize the actual controls emitted by WordGap's template. Their handlers are attached by production code.
  Object.defineProperty(root, 'innerHTML', { get() { return this._html; }, set(html) {
    this._html = html; this.refs = {}; this.groups = {}; this.children = [];
    for (const cls of ['.wd-ear', '.wd-reference', '.wd-hole', '.wd-gapword', '.wd-next']) this.refs[cls] = node(0, animate);
    this.refs['.wd-next'].hidden = true;
    const count = (html.match(/class="wd-piece"/g) || []).length;
    this.groups['.wd-piece'] = Array.from({ length: count }, (_, i) => node(i, animate));
    this.groups['.pz-progress i'] = [];
  } });
  const cueCalls = [];
  const context = { window: { MiftahGame: ns, matchMedia: () => ({ matches: reduced }) }, setTimeout(fn, ms = 0) { const id = ++tid; timers.set(id, { fn, ms }); return id; }, clearTimeout(id) { timers.delete(id); }, performance: { now: () => 10 }, Math, document: { createElement: () => node() } };
  for (const f of ['GardenPractice.js', 'WordGames.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), context, { filename: f });
  const item = (id, display) => ({ id, display, audioPath: `${id}.mp3` });
  const game = new ns.GardenPractice.WordGap({ stage, items: [item('one', 'بَتَ'), item('two', 'تَبَ')], say: x => { spoken.push(x); return true; }, reportOutcome: x => calls.push(x), cancel() {}, reducedMotion: () => reduced,
    setupActionCue: options => { cueCalls.push(options); return { destroy() {} }; } });
  const fire = ms => { const due = [...timers].filter(([, t]) => t.ms === ms); for (const [id, t] of due) { timers.delete(id); t.fn(); } };
  const answerIndex = () => game.choiceRecords.findIndex(option => option.sourceItemId === game.target.id && !Object.hasOwn(option, 'marks'));
  const clickAnswer = rect => {
    const btn = game.root.querySelectorAll('.wd-piece')[answerIndex()];
    if (rect) game.pick(answerIndex(), btn, game.roundToken, game.offered, rect);
    else btn.dispatch('click');
  };
  return { ns, game, root, calls, spoken, timers, fire, answerIndex, clickAnswer, cueCalls };
}

test('correct click uses released rectangle for a 300ms flight and settles only on arrival', () => {
  const rect = { left: 1, top: 2, width: 3, height: 4 }; let args;
  const f = runtime({ animate: (...a) => { args = a; return { cancel() {} }; } });
  f.clickAnswer(rect);
  assert.equal(f.calls.length, 1); assert.equal(f.calls[0].correct, true);
  assert.equal(f.game.round, 0); assert.equal(f.game.awaitingContinue, false);
  assert.equal(args?.[1]?.duration, 300); assert.equal(f.game.fitFlight != null, true);
  assert.equal(args[0][0].transform, 'translate(-9px, -18px)');
  assert.equal(f.root.querySelector('.wd-next').hidden, true);
  f.fire(300);
  assert.equal(f.game.awaitingContinue, true);
  assert.equal(f.root.querySelector('.wd-next').hidden, false);
  f.game.destroy();
});

test('repeated choice input during flight cannot report twice or complete early', () => {
  const f = runtime({ animate: () => ({ cancel() {} }) }); f.clickAnswer();
  const count = f.calls.length; f.clickAnswer();
  assert.equal(count, 1); assert.equal(f.calls.length, 1); assert.equal(f.game.awaitingContinue, false); f.game.destroy();
});

test('reduced motion and browsers without animation settle immediately', () => {
  for (const options of [{ reduced: true, animate: () => ({}) }, { animate: () => null }]) {
    const f = runtime(options); f.clickAnswer({ left: 1, top: 1, width: 4, height: 4 });
    assert.equal(f.game.awaitingContinue, true); assert.equal(f.game.round, 1); f.game.destroy();
  }
});

test('stale flight completion after advancing or destroying cannot alter the next state', () => {
  let cancellations=0; const f=runtime({animate:()=>({cancel(){cancellations++;}})});
  f.clickAnswer();const lateTimer=[...f.timers.values()].find(t=>t.ms===300)?.fn;assert.equal(typeof lateTimer,'function');
  const token=f.game.roundToken;f.game.next();const after=f.game.roundToken,rounds=f.game.round,html=f.root.innerHTML;
  assert.equal(cancellations,1);lateTimer();assert.ok(after>token);assert.equal(f.game.round,rounds);assert.equal(f.game.awaitingContinue,false);assert.equal(f.root.innerHTML,html);
  f.clickAnswer();const n=f.calls.length,late=[...f.timers.values()].find(t=>t.ms===300)?.fn;assert.equal(typeof late,'function');f.game.destroy();late();assert.equal(cancellations,2);assert.equal(f.calls.length,n);assert.equal(f.game.round,rounds);
});

test('completed word replay and action cue never create an outcome; stale cue is inert', () => {
  const f = runtime(); const g = f.game; const cue = f.cueCalls[0];
  assert.equal(typeof cue.onShow, 'function'); cue.onShow(); assert.equal(g.missed, true); assert.equal(f.calls.length, 0);
  f.clickAnswer(); assert.equal(f.calls.length, 1); assert.equal(f.calls[0].assisted, true);
  f.fire(300);
  const whole = g.root.querySelector('.wd-gapword').querySelector('.wd-whole');
  assert.equal(typeof whole.onclick, 'function'); const voice=f.spoken.length;whole.dispatch('click');assert.equal(f.spoken.length,voice+1);assert.equal(f.spoken.at(-1).id,g.target.id);assert.equal(f.calls.length,1);
  g.next(); const voiceAfter=f.spoken.length;whole.dispatch('click');assert.equal(f.spoken.length,voiceAfter);cue.onShow(); assert.equal(g.missed, false); assert.equal(f.calls.length, 1); g.destroy();
});
