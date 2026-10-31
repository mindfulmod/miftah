const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function makeNode(tag, cls = '', dataset = {}) {
  const classes = new Set(cls.split(/\s+/).filter(Boolean)), listeners = {};
  return { tag, dataset, style: { setProperty(k, v) { this[k] = v; } }, listeners, classes, attrs: {}, hidden: false, disabled: false, focused: false,
    classList: { add: (...xs) => xs.forEach(x => classes.add(x)), remove: (...xs) => xs.forEach(x => classes.delete(x)), contains: x => classes.has(x), toggle(x, force) { const on = force === undefined ? !classes.has(x) : force; on ? classes.add(x) : classes.delete(x); return on; } },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }, removeEventListener(type, fn) { listeners[type] = (listeners[type] || []).filter(x => x !== fn); },
    dispatch(type, e = {}) { const ev = { type, currentTarget: this, target: this, pointerId: 1, isPrimary: true, clientX: 0, clientY: 0, detail: 1, preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...e }; for (const fn of [...(listeners[type] || [])]) fn(ev); return ev; },
    click(detail = 1) { if (!this.disabled) this.dispatch('click', { detail }); }, setAttribute(k, v) { this.attrs[k] = v; }, focus() { this.focused = true; }, matches(sel) { return sel === ':focus-visible' && this.focused; },
    querySelector(sel) { return this.children?.[sel] || null; }, getBoundingClientRect() { return { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 }; }, hasPointerCapture() { return false; }, setPointerCapture() {}, releasePointerCapture() {} };
}
class Root {
  set innerHTML(html) {
    this.html = html; this.nodes = {}; this.all = [];
    for (const m of html.matchAll(/<(button|span|div)[^>]*class="([^"]+)"([^>]*)>/g)) {
      const [, tag, cls, attrs] = m, dataset = Object.fromEntries([...attrs.matchAll(/data-([\w-]+)="([^"]+)"/g)].map(x => [x[1], x[2]])), n = makeNode(tag, cls, dataset);
      n.hidden = /\bhidden(?:\s|>)/.test(m[0]);
      const label = attrs.match(/aria-label="([^"]*)"/); if (label) n.attrs['aria-label'] = label[1];
      for (const c of cls.split(/\s+/)) (this.nodes[c] ||= []).push(n); this.all.push(n);
    }
    this.nodes['bk-door']?.forEach((n, i) => { this.nodes['bk-flap'][i].children = { '.bk-door': n }; });
  }
  querySelectorAll(sel) { const m = sel.match(/^\.([\w-]+)$/); return m ? this.nodes?.[m[1]] || [] : []; }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}
function setup({ letters = ['ب','ت','ث'], taught = true, exclude = [], plan, promptMode = 'match', say = () => true, displayedAmount } = {}) {
  const root = new Root(), timers = [], reports = [], done = [], speech = [], begun = [];
  const items = letters.map(display => ({ id: display, display, taught: taught && !exclude.includes(display) }));
  const ns = { LetterFriends: { FRIENDS: Object.fromEntries(letters.map(c => [c, {}])), item: c => ({ id: c, display: c, speak: c }), art: c => `<svg>${c}</svg>` },
    PictureWords: { byChar: c => [{ id: `${c}-pic`, char: c, word: `${c} word` }], item: p => p, art: p => `<svg>${p.id}</svg>` },
    PracticeLearning: { profile: () => ({ choiceCount: 2, promptMode }), level: () => 0, plan: (_ctx, pool, _skill, count) => plan || pool.slice(0, count), orderChars: (_ctx, pool, _skill, count) => pool.slice(0, count) } };
  let now = 1000;
  const context = { window: { MiftahGame: ns }, setTimeout(fn, ms) { const t = { fn, ms, cleared: false }; timers.push(t); return t; }, clearTimeout(t) { if (t) t.cleared = true; }, Math: Object.assign(Object.create(Math), { random: () => .2 }), Date: { now: () => now } };
  if(displayedAmount!==undefined){context.window.DOMMatrixReadOnly=class{constructor(){this.m13=Math.sin(displayedAmount*105*Math.PI/180);this.m11=Math.cos(displayedAmount*105*Math.PI/180);}};context.getComputedStyle=()=>({transform:'matrix3d(test)'});}
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'BookGames.js'), 'utf8'), context, { filename: 'BookGames.js' });
  const ctx = { items, stage: { innerHTML: '', get firstElementChild() { return root; } }, say: x => { speech.push(x); return say(x); }, reportOutcome: x => reports.push(x), done: () => done.push(1), beginRound: x => begun.push(x), canListen: () => true, reducedMotion: () => true, sfx() {}, correct() {}, confettiAt() {} };
  const game = new ns.GardenPractice.PeekFlaps(ctx);
  return { ns, root, game, timers, reports, done, speech, begun, items, advance(ms) { now += ms; } };
}
function fire(f, ms) { f.timers.filter(t => !t.cleared && t.ms === ms).forEach(t => { t.cleared = true; t.fn(); }); }
function fireAll(f) { for (let i = 0; i < f.timers.length; i++) { const t = f.timers[i]; if (!t.cleared) { t.cleared = true; t.fn(); } } }
function flap(f, i) { return f.root.querySelectorAll('.bk-flap')[i]; }
function answerIndex(f) { return f.game.offered.findIndex(x => x.display === f.game.target); }
function drag(f, i, dx, dy = 0) {
  const b = flap(f, i); b.dispatch('pointerdown', { pointerId: 7, clientX: 50, clientY: 50, pointerType: 'touch' });
  b.dispatch('pointermove', { pointerId: 7, clientX: 50 + dx, clientY: 50 + dy });
  b.dispatch('pointerup', { pointerId: 7 }); return b;
}

test('drag travel uses 60px per 100px flap: below halfway stays shut and above halfway opens', () => {
  const f = setup(); drag(f, 0, -10); assert.equal(f.game.opened.size, 0); assert.equal(f.reports.length, 0);
  drag(f, 0, -40); assert.equal(f.game.opened.has(0), true); assert.equal(f.reports.length, 1);
  assert.equal(f.reports[0].correct, f.game.offered[0].display === f.game.target);
});

test('a partial peek reveals the reference but reports nothing; later tap is assisted', () => {
  const f = setup(); drag(f, answerIndex(f), -10);
  assert.equal(f.reports.length, 0); assert.equal(f.game.missed, true); assert.equal(f.root.querySelector('.bk-ask').hidden, false);
  f.advance(501);
  flap(f, answerIndex(f)).click(); assert.equal(f.reports.length, 1); assert.equal(f.reports[0].assisted, true);
});

test('cancel, capture loss, vertical intent, and a second pointer do not submit answers', () => {
  const f = setup(), b = flap(f, answerIndex(f));
  b.dispatch('pointerdown', { pointerId: 1, clientX: 30, clientY: 30 }); b.dispatch('pointermove', { pointerId: 1, clientX: 60, clientY: 70 });
  assert.equal(f.reports.length, 0);
  b.dispatch('pointercancel', { pointerId: 1 });
  b.dispatch('pointerdown', { pointerId: 3, clientX: 30, clientY: 30 });
  b.dispatch('pointermove', { pointerId: 3, clientX: 0, clientY: 30 }); b.dispatch('lostpointercapture', { pointerId: 3 });
  const owner = flap(f, answerIndex(f)), second = flap(f, (answerIndex(f) + 1) % f.game.offered.length);
  owner.dispatch('pointerdown', { pointerId: 4, clientX: 30, clientY: 30 }); owner.dispatch('pointermove', { pointerId: 4, clientX: 20, clientY: 30 });
  second.dispatch('pointerdown', { pointerId: 5, isPrimary: false, clientX: 30, clientY: 30 }); second.dispatch('pointermove', { pointerId: 5, isPrimary: false, clientX: 0, clientY: 30 }); second.dispatch('pointerup', { pointerId: 5 });
  assert.equal(f.game.activeFlapPointer, owner); assert.equal(f.game.opened.size, 0); owner.dispatch('pointercancel', { pointerId: 4 }); owner.click(1);
  assert.equal(f.reports.length, 0, 'a cancellation follow-up click cannot answer'); assert.equal(f.game.opened.size, 0);
});

test('lost capture and vertical-intent follow-up clicks cannot answer the canceled gesture', () => {
  const f = setup(), b = flap(f, answerIndex(f));
  b.dispatch('pointerdown', { pointerId: 11, clientX: 30, clientY: 30 }); b.dispatch('pointermove', { pointerId: 11, clientX: 0, clientY: 30 });
  b.dispatch('lostpointercapture', { pointerId: 11 }); b.click(1);
  assert.equal(f.reports.length, 0, 'lost-capture click is suppressed');
  const g = setup(), vertical = flap(g, answerIndex(g));
  vertical.dispatch('pointerdown', { pointerId: 12, clientX: 30, clientY: 30 }); vertical.dispatch('pointermove', { pointerId: 12, clientX: 32, clientY: 50 });
  vertical.dispatch('pointerup', { pointerId: 12 }); vertical.click(1);
  assert.equal(g.reports.length, 0, 'vertical intent must not turn its generated click into an answer');
});

test('post-drag synthetic click is suppressed while a keyboard click remains available', () => {
  const f = setup(), right = answerIndex(f), b = drag(f, right, -10);
  assert.equal(f.reports.length, 0); b.click(1); assert.equal(f.reports.length, 0);
  b.click(0); assert.equal(f.reports.length, 1); assert.equal(f.reports[0].correct, true);
});

test('immediate fresh tap after partial drag clears synthetic-click suppression and answers once', () => {
  const f = setup(), wrong = (answerIndex(f) + 1) % f.game.offered.length, b = drag(f, wrong, -10);
  assert.equal(f.reports.length, 0); assert.equal(f.game.opened.size, 0);
  b.click(1); assert.equal(f.reports.length, 0, 'the drag-generated click remains suppressed');
  b.dispatch('pointerdown', { pointerId: 9, clientX: 50, clientY: 50, pointerType: 'touch' });
  b.dispatch('pointerup', { pointerId: 9 }); b.click(1);
  assert.equal(f.reports.length, 1); assert.equal(f.reports[0].correct, false); assert.equal(f.game.opened.has(wrong), true);
});

test('wrong discovery stays open through timers; closing and reopening it does not repeat its miss report', () => {
  const f = setup(), wrong = (answerIndex(f) + 1) % f.game.offered.length;
  flap(f, wrong).click(); assert.equal(f.reports.length, 1); assert.equal(f.reports[0].correct, false); assert.equal(f.game.opened.has(wrong), true);
  fireAll(f); assert.equal(f.game.round, 0); assert.equal(f.game.phase, 'finding'); assert.equal(f.game.opened.has(wrong), true); assert.equal(f.reports.length, 1); assert.equal(f.done.length, 0);
  f.root.querySelector('.bk-close-doors').click(); assert.equal(f.game.opened.size, 0);
  flap(f, wrong).click(); assert.equal(f.reports.length, 1); assert.equal(f.game.missed, true);
});

test('correct discovery enters free exploration; repeated openings and close-all add no outcomes', () => {
  const f = setup(), right = answerIndex(f); flap(f, right).click();
  assert.equal(f.game.phase, 'exploring'); assert.equal(f.reports.length, 1);
  const other = (right + 1) % f.game.offered.length; flap(f, other).click(); flap(f, other).click();
  f.root.querySelector('.bk-close-doors').click(); flap(f, right).click();
  fireAll(f);
  assert.equal(f.reports.length, 1); assert.equal(f.game.phase, 'exploring');
  assert.equal(f.game.round, 0); assert.equal(f.done.length, 0); assert.equal(f.game.opened.has(right), true);
});

test('Next advances pages and final completion calls done once', () => {
  const f = setup({ letters: ['ب','ت'] });
  flap(f, answerIndex(f)).click(); f.root.querySelector('.bk-peek-next').click();
  assert.equal(f.game.round, 1); assert.equal(f.game.phase, 'finding');
  flap(f, answerIndex(f)).click(); f.root.querySelector('.bk-peek-next').click(); f.game.finish();
  assert.equal(f.game.phase, 'finished'); assert.equal(f.done.length, 1); assert.equal(f.reports.length, 2);
});

test('old page flap and Next handlers cannot report, open, or advance twice', () => {
  const f = setup({ letters: ['ب','ت'] }), old = flap(f, answerIndex(f)), oldClick = [...old.listeners.click][0], oldNext = f.root.querySelector('.bk-peek-next'), oldNextClick = [...oldNext.listeners.click][0];
  oldClick({ detail: 0 }); assert.equal(f.reports.length, 1); oldNext.click();
  assert.equal(f.game.round, 1); assert.equal(f.game.opened.size, 0);
  oldClick({ detail: 0 }); oldNextClick({ detail: 0 });
  assert.equal(f.reports.length, 1); assert.equal(f.game.round, 1); assert.equal(f.game.opened.size, 0);
});

test('destroy clears pending gesture work and late speech cannot change discovery state', async () => {
  let settle; const f = setup({ promptMode: 'listen', say: () => new Promise(resolve => { settle = resolve; }) });
  fire(f, 300); const b = flap(f, answerIndex(f)); b.dispatch('pointerdown', { pointerId: 1, clientX: 40, clientY: 40 }); b.dispatch('pointermove', { pointerId: 1, clientX: 0, clientY: 40 });
  const missed = f.game.missed, askHidden = f.root.querySelector('.bk-ask').hidden;
  f.game.destroy(); assert.equal(f.game.activeFlapPointer, null); b.dispatch('pointerup', { pointerId: 1 }); settle(false); await Promise.resolve(); await Promise.resolve();
  assert.equal(f.game.missed, missed); assert.equal(f.root.querySelector('.bk-ask').hidden, askHidden); assert.equal(f.reports.length, 0); assert.equal(f.game.activeFlapPointer, null);
});

test('heard prompt supports an independent tap; peeking first makes the later correct tap assisted', () => {
  const heard = setup({ promptMode: 'listen' }); fire(heard, 300); flap(heard, answerIndex(heard)).click();
  assert.equal(heard.reports[0].evidence, 'independent_listening'); assert.equal(heard.reports[0].assisted, false);
  const peeked = setup({ promptMode: 'listen' }); fire(peeked, 300); drag(peeked, answerIndex(peeked), -10); peeked.advance(501); flap(peeked, answerIndex(peeked)).click();
  assert.equal(peeked.reports[0].correct, true); assert.equal(peeked.reports[0].evidence, 'supported_visible_matching'); assert.equal(peeked.reports[0].assisted, true);
});

test('keyboard answer focuses Next and keyboard Next focuses the first flap on the new page', () => {
  const f = setup({ letters: ['ب','ت'] }), right = answerIndex(f), b = flap(f, right); b.focus(); b.click(0);
  assert.equal(f.root.querySelector('.bk-peek-next').focused, true);
  f.root.querySelector('.bk-peek-next').click(0); assert.equal(f.root.querySelectorAll('.bk-flap')[0].focused, true);
});

test('only taught letters feed choices and readiness count remains the planned count', () => {
  const f = setup({ letters: ['ب','ت','ث'], plan: ['ب','ت'], exclude: ['ث'] });
  assert.deepEqual(Array.from(f.game.letters, x => x.display), ['ب','ت']); assert.equal(f.game.rounds, 2); assert.equal(f.game.offered.length, 2);
});


test('re-grabbing a settling door starts from the displayed angle, including a closing reversal', () => {
  const opening=setup({displayedAmount:.4});
  drag(opening,answerIndex(opening),-10);
  assert.equal(opening.game.opened.has(answerIndex(opening)),true,'40% shown + one sixth travel crosses halfway');
  const closing=setup({displayedAmount:.6}); const right=answerIndex(closing);
  flap(closing,right).click(); assert.equal(closing.game.opened.has(right),true);
  drag(closing,right,20);
  assert.equal(closing.game.opened.has(right),false,'60% shown minus one third travel closes');
  assert.equal(closing.game.phase,'exploring'); assert.equal(closing.reports.length,1);
});
