const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const rootDir = path.join(__dirname, '..', '..', '..');
const read = f => fs.readFileSync(path.join(rootDir, f), 'utf8');

function classes() {
  const set = new Set();
  return { add: (...xs) => xs.forEach(x => set.add(x)), remove: (...xs) => xs.forEach(x => set.delete(x)), contains: x => set.has(x), toggle(x, force) { const yes = force === undefined ? !set.has(x) : force; yes ? set.add(x) : set.delete(x); return yes; } };
}
function el(className = '', dataset = {}) {
  const listeners = {};
  return { className, classList: classes(), dataset, listeners, disabled: false, isConnected: true, attrs: {}, innerHTML: '', textContent: '',
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }, fire(type = 'click') { for (const fn of listeners[type] || []) fn({ target: this, preventDefault() {} }); },
    setAttribute(k, v) { this.attrs[k] = String(v); }, animate() {}, getBoundingClientRect() { return { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 }; },
    querySelector(sel) { if (sel === '.ch-car-seat') return this.seat || null; return null; },
  };
}
class Root {
  constructor() { this.nodes = {}; this.html = ''; this.isConnected = true; }
  set innerHTML(html) {
    this.html = html; this.nodes = {};
    for (const m of html.matchAll(/<([a-z]+)[^>]*class="([^"]+)"([^>]*)>/gi)) {
      const [, tag, raw, attrs] = m, names = raw.split(/\s+/), cs = names.filter(n => /^ch-/.test(n)); if (!cs.length) continue;
      const data = {}; for (const a of attrs.matchAll(/data-([\w-]+)="([^"]+)"/g)) data[a[1]] = a[2];
      const n = el(cs[0], data); n.tagName = tag.toUpperCase(); n.classList.add(...names);
      for (const a of attrs.matchAll(/aria-label="([^"]*)"/g)) n.setAttribute('aria-label', a[1]);
      if (cs.includes('ch-car')) { n.seat = el('ch-car-seat'); this.nodes['ch-car-seat'] ||= []; this.nodes['ch-car-seat'].push(n.seat); }
      cs.forEach(c => (this.nodes[c] ||= []).push(n));
    }
  }
  get innerHTML() { return this.html; }
  querySelectorAll(sel) {
    const classes=[...sel.matchAll(/\.([\w-]+)/g)], last=classes.at(-1)?.[1]; if (!last) return [];
    const dm=sel.match(/\[data-([\w-]+)="([^"]+)"\]/);
    let nodes=(this.nodes[last] || []).filter(n => !dm || String(n.dataset[dm[1]]) === dm[2]);
    if(sel.includes('.ch-choice-tray'))nodes=nodes.filter(n=>n.tagName==='BUTTON');
    return nodes;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}
const chars = [...'ابتثجحخدذرزسشصضطظعغفقكلمنهويءة'];
function setup({ level = 0, beginner = false, items = null, words = undefined, plan = null, random = 0.31 } = {}) {
  const root = new Root(), timers = [], outcomes = [], drags = [], resets = [], speech = [], calls = { done: 0, cancel: 0 };
  const records = items || chars.map((display, i) => ({ id: `item-${i}`, display }));
  const ns = {
    LetterFriends: { FRIENDS: Object.fromEntries(chars.map(c => [c, {}])), art: c => `<svg class="lf">${c}</svg>`, get: c => ({ en: `letter ${c}` }), item: c => ({ id: `item-${chars.indexOf(c)}`, display: c }) },
    PracticeLearning: { level: () => level, plan: plan || ((_ctx, pool, _skill, n) => pool.slice(0, n)) },
    PictureWords: { LIST: [{ id: 'word-byt', word: 'بَيْت', sticker: 'home', en: 'house' }, { id: 'word-tyn', word: 'تِين', sticker: 'fig', en: 'fig' }, { id: 'word-byd', word: 'بَيْضَة', sticker: 'egg', en: 'egg' }], item: p => ({ id: p.id, display: p.word }), art: () => '<svg></svg>' },
    FormPlayArt: { wordStand: () => '<svg aria-hidden="true"></svg>', costumeRail: () => '<svg></svg>', trainEngine: () => '<svg></svg>', trainCar: () => '<svg></svg>' },
    GardenPractice: { draggable(_node, opts) { drags.push(opts); return () => {}; } },
  };
  const ctx = { items: records, beginner, stage: { set innerHTML(_html) { root.innerHTML = _html; }, get firstElementChild() { return root; }, contains: n => n === root },
    ...(words === undefined ? {} : { words }), reportOutcome: o => outcomes.push(o), say: it => { speech.push(it); return Promise.reject(new Error('speech unavailable')); },
    sfx() {}, correct() {}, confettiAt() {}, reducedMotion: () => true, done() { calls.done += 1; }, cancel() { calls.cancel += 1; }, pet: { cheer() {} } };
  ns.GardenPractice = { draggable(_node, opts) { drags.push(opts); return () => resets.push(true); } };
  const context = { window: { MiftahGame: ns }, setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {}, Math: Object.assign(Object.create(Math), { random: () => random }) };
  vm.runInNewContext(read('src/letters/CostumeHouse.js'), context);
  return { ns, ctx, root, timers, outcomes, drags, resets, records, speech, calls };
}
function flush(timers, ms = Infinity) { let rounds=0; while(rounds++<1000){const due=timers.find(t=>!t.done&&t.ms<=ms);if(!due)break;due.done=true;due.fn();} }

test('eligibility blocks aliases before planning, preserves real IDs, and explicit empty plans stay empty', () => {
  const locked = { id: 'locked-b', display: 'ب', locked: true }, open = { id: 'real-b', display: 'ب' };
  const { ns, ctx } = setup({ items: [locked, open, { id: 'real-t', display: 'ت' }, { id: 'no', display: 'ث', isTaught: false }] });
  let observed;
  ns.PracticeLearning.plan = (_ctx, pool, _skill, n) => { observed = pool.map(i => i.id); return pool.slice(0, n); };
  const game = new ns.GardenPractice.Disguise(ctx);
  assert.ok(!observed.includes('locked-b') && !observed.includes('real-b'), 'an explicitly blocked display alias blocks its duplicate');
  assert.ok(game.known.every(i => i.id !== 'no'));
  game.destroy();
  const prerequisite = setup({ items: [open, { id: 'prereq', display: 'ت', prerequisiteWorldIds: ['future-world'] }, { id: 'valid-th', display: 'ث' }] });
  prerequisite.ctx.completedWorldIds = [];
  prerequisite.ns.PracticeLearning.plan = (_ctx, pool) => [{ id: 'fabricated', display: 'ب' }, { id: 'prereq', display: 'ت' }, ...pool];
  const filtered = new prerequisite.ns.GardenPractice.ShapeTrain(prerequisite.ctx);
  assert.ok(filtered.known.every(i => i.id !== 'fabricated' && i.id !== 'prereq'), 'planner results resolve only to eligible pool records');
  assert.ok(filtered.known.every(i => ['real-b', 'valid-th'].includes(i.id)));
  filtered.destroy();
  ns.PracticeLearning.plan = () => [];
  const empty = new ns.GardenPractice.ShapeTrain(ctx);
  assert.deepEqual([...empty.known], []);
});

test('word questions use only fully taught letter forms; explicit empty word list cannot fall back', () => {
  const letters = ['ب', 'ي', 'ت'];
  const items = letters.map(c => ({ id: `letter:${c}`, display: c }));
  const { ns, ctx } = setup({ items, words: [{ id: 'bait', word: 'بَيْت' }, { id: 'bad', word: 'بَيْضَة' }] });
  const disguise = new ns.GardenPractice.Disguise(ctx);
  assert.ok(disguise.qs.length === 1 && disguise.qs[0].p.id === 'bait');
  assert.ok(disguise.known.every(i => items.some(j => j.id === i.id)));
  disguise.destroy();
  const empty = setup({ items, words: [] });
  const noWords = new empty.ns.GardenPractice.Disguise(empty.ctx);
  assert.equal(noWords.qs.length, 0);
  const live = setup({ items, words: [{ id: 'bait', word: 'بَيْت' }, { id: 'tin', word: 'تِين' }] });
  live.ctx.words = undefined;
  assert.ok(new live.ns.GardenPractice.Disguise(live.ctx).qs.length > 0, 'undefined live words use the built-in taught-word candidates');
});

test('novice and later support levels are frozen for the visit', () => {
  const early = setup({ level: 0 }), earlyGame = new early.ns.GardenPractice.ShapeTrain(early.ctx);
  assert.equal(earlyGame.forms.length, 2); assert.equal(earlyGame.rounds, 3);
  early.ns.PracticeLearning.level = () => 2;
  earlyGame.next(); assert.equal(earlyGame.forms.length, 2, 'later level changes do not mutate this visit');
  const later = setup({ level: 1 }), laterGame = new later.ns.GardenPractice.ShapeTrain(later.ctx);
  assert.equal(laterGame.forms.length, 3); assert.equal(laterGame.rounds, 4);
  const beginner = setup({ level: 2, beginner: true }), beginnerGame = new beginner.ns.GardenPractice.ShapeTrain(beginner.ctx);
  assert.equal(beginnerGame.visitLevel, 0); assert.equal(beginnerGame.forms.length, 2); assert.equal(beginnerGame.rounds, 3);
});

test('empty lesson pools cancel cleanly in each game without completing or paying', () => {
  for (const Kind of ['Disguise', 'CostumeRail']) {
    const s=setup({words:[]}), game=new s.ns.GardenPractice[Kind](s.ctx); flush(s.timers);
    assert.equal(s.calls.cancel,1,`${Kind} cancels`); assert.equal(s.calls.done,0,`${Kind} does not finish/reward`); game.destroy();
  }
  const s=setup({plan:()=>[]}), game=new s.ns.GardenPractice.ShapeTrain(s.ctx); flush(s.timers);
  assert.equal(s.calls.cancel,1,'ShapeTrain cancels'); assert.equal(s.calls.done,0,'ShapeTrain does not finish/reward'); game.destroy();
});

test('Disguise correct region is shuffled among distinct word letters', () => {
  const indices=[];
  for (const random of [0.01,0.99,0.48]) {
    const s=setup({random,words:[{id:'bait',word:'بَيْت'},{id:'tin',word:'تِين'}]}), game=new s.ns.GardenPractice.Disguise(s.ctx);
    indices.push(game.choices.findIndex(c=>c.base===game.q.letter));
  }
  assert.ok(new Set(indices).size > 1, `correct position should vary across seeds; got ${indices}`);
});

test('Disguise uses noninteractive joined word plus native answer buttons, stale answer ignored, reports matching only', async () => {
  const { ns, ctx, root, outcomes } = setup({ words: [{ id: 'bait', word: 'بَيْت' }, { id: 'tin', word: 'تِين' }] });
  const game = new ns.GardenPractice.Disguise(ctx), token = game.roundToken;
  assert.match(root.html, /class="ch-lesson-prop"/); assert.match(root.html, /class="ch-choice-tray"/);
  assert.doesNotMatch(root.html, /ch-word is-tappable/);
  const buttons = root.querySelectorAll('.ch-choice-tray .ch-piece');
  assert.ok(buttons.length > 0 && buttons.every(b => b.tagName === 'BUTTON'));
  assert.ok(game.choices.length >= 2 && game.choices.some(c => c.base !== game.q.letter), 'answer row includes real distractor regions from this taught word');
  const choice = buttons.find((_, i) => game.choices[i].base === game.q.letter);
  const k = buttons.indexOf(choice);
  assert.equal(game.pick(k, choice, token - 1, root), false);
  assert.equal(game.pick(k, choice, token, root), true);
  assert.equal(outcomes.at(-1).itemId, game.known.find(i => i.display === game.q.letter).id);
  assert.equal(outcomes.at(-1).affectsStrength, false); assert.equal(outcomes.at(-1).evidence, 'supported_visible_matching');
  assert.equal(await game.sayWord(game.q.p), false, 'rejected speech promises are consumed safely');
});

test('replaced prompt and answer nodes cannot speak or answer for the new round', () => {
  const s=setup({words:[{id:'bait',word:'بَيْت'},{id:'tin',word:'تِين'}]}), game=new s.ns.GardenPractice.Disguise(s.ctx);
  const oldToken=game.roundToken, oldAnswer=s.root.querySelector('.ch-choice-tray .ch-piece'), oldPic=s.root.querySelector('.ch-pic');
  game.round=1;game.next();const before=s.speech.length;
  oldPic.onclick();oldAnswer.fire();
  assert.equal(s.speech.length,before);assert.equal(s.outcomes.length,0);
  assert.equal(game.pick(0,oldAnswer,oldToken,s.root),false);
});

test('CostumeRail wrong choice locks briefly, correct fills the gap, drag accepts nearby targets and rejects outside', () => {
  const { ns, ctx, root, outcomes, drags, timers } = setup({ words: [{ id: 'bait', word: 'بَيْت' }, { id: 'tin', word: 'تِين' }] });
  const game = new ns.GardenPractice.CostumeRail(ctx), token = game.roundToken;
  assert.ok(game.options.length <= 2); assert.match(root.html, /ch-choice-tray/);
  const wrong = game.options.findIndex(f => f !== game.q.form), wrongBtn = root.querySelectorAll('.ch-costume')[wrong];
  assert.equal(game.pick(wrong, wrongBtn, token, root), false); assert.equal(game.busy, true); assert.equal(wrongBtn.disabled, true);
  flush(timers, 650); assert.equal(game.busy, false);
  const right = game.options.indexOf(game.q.form), rightBtn = root.querySelectorAll('.ch-costume')[right];
  assert.equal(drags[right].drop(125, 50), true, '28px margin supports a drop close to the gap');
  assert.equal(root.querySelector('.ch-gap').innerHTML, game.pieces[game.q.i].text, 'the joined word returns with its vowel marks');
  assert.equal(outcomes.at(-1).affectsStrength, false);
  assert.equal(game.pick(right, rightBtn, token, root), false, 'already answered current round cannot score twice');
  const separate = setup({ words: [{ id: 'bait', word: 'بَيْت' }, { id: 'tin', word: 'تِين' }] }); new separate.ns.GardenPractice.CostumeRail(separate.ctx); assert.equal(separate.drags[0].drop(500, 500), false);
  const stale=setup({words:[{id:'bait',word:'بَيْت'},{id:'tin',word:'تِين'}]}), g=new stale.ns.GardenPractice.CostumeRail(stale.ctx), firstRoundDrags=stale.drags.length;
  const k=g.options.indexOf(g.q.form);g.pick(k,stale.root.querySelectorAll('.ch-costume')[k],g.roundToken,stale.root);flush(stale.timers,1100);
  assert.ok(stale.resets.length>=firstRoundDrags,'old drag handlers are reset when the next word arrives');
  const oldToken=g.roundToken, oldPic=stale.root.querySelector('.ch-pic'), oldChoice=stale.root.querySelectorAll('.ch-costume')[0], outcomeCount=stale.outcomes.length;
  g.next();const speechCount=stale.speech.length;oldPic.onclick();oldChoice.fire();
  assert.equal(stale.speech.length,speechCount);assert.equal(stale.outcomes.length,outcomeCount);assert.equal(g.pick(0,oldChoice,oldToken,stale.root),false);
});

test('ShapeTrain builds all cars once, tap placement completes round, stale callbacks cannot place', () => {
  const { ns, ctx, root, outcomes, timers, speech } = setup({ level: 1 });
  const game = new ns.GardenPractice.ShapeTrain(ctx), token = game.roundToken;
  assert.equal(root.querySelectorAll('.ch-car').length, 3);
  const firstForm = game.cards[0], wrongCar = root.querySelectorAll('.ch-car').find(c => c.dataset.form !== firstForm);
  root.querySelectorAll('.ch-costume')[0].fire();
  assert.equal(game.drop(wrongCar, token, root), false); assert.equal(game.busy, true, 'wrong placement receives finite busy feedback');
  assert.ok(root.querySelectorAll('.ch-car').find(c => c.dataset.form === firstForm).classList.contains('is-hint'), 'cue marks the matching car');
  flush(timers, 650);
  root.querySelectorAll('.ch-costume')[0].fire();
  assert.equal(game.drop(root.querySelectorAll('.ch-car').find(c => c.dataset.form === firstForm), token, root), true);
  for (const f of game.forms) {
    if (f === firstForm) continue;
    const idx = game.cards.indexOf(f), card = root.querySelectorAll('.ch-costume')[idx];
    card.fire(); const car = root.querySelectorAll('.ch-car').find(c => c.dataset.form === f);
    assert.equal(game.drop(car, token, root), true);
  }
  assert.equal(game.placed, 3); assert.equal(outcomes.length, 2); assert.equal(outcomes.filter(o => o.correct).length, 1); assert.ok(outcomes.every(o => o.affectsStrength === false));
  const oldCar = root.querySelectorAll('.ch-car')[0], oldChoice=root.querySelectorAll('.ch-costume')[0], oldFriend=root.querySelector('.ch-friend');
  const outcomesBeforeReplacement=outcomes.length, speechBeforeReplacement = speech.length;
  game.next(); oldChoice.fire(); oldFriend.onclick();
  assert.equal(game.drop(oldCar, token, root), false); assert.equal(outcomes.length,outcomesBeforeReplacement,'replaced train controls cannot add stale outcomes');
  assert.equal(speech.length,speechBeforeReplacement,'replaced friend prompt cannot speak after rerender');
});

test('all three games complete once after the whole activity', () => {
  const words=[{id:'bait',word:'بَيْت'},{id:'tin',word:'تِين'},{id:'egg',word:'بَيْضَة'}];
  const disguise=setup({words}), d=new disguise.ns.GardenPractice.Disguise(disguise.ctx);
  while(d.round<d.rounds){const token=d.roundToken,root=disguise.root,k=d.choices.findIndex(c=>c.base===d.q.letter);assert.ok(k>=0);assert.equal(d.pick(k,root.querySelectorAll('.ch-choice-tray .ch-piece')[k],token,root),true);flush(disguise.timers,1100);}
  flush(disguise.timers);assert.equal(disguise.calls.done,1);flush(disguise.timers);assert.equal(disguise.calls.done,1);

  const rail=setup({words}),r=new rail.ns.GardenPractice.CostumeRail(rail.ctx);
  while(r.round<r.rounds){const token=r.roundToken,root=rail.root,k=r.options.indexOf(r.q.form);assert.ok(k>=0);assert.equal(r.pick(k,root.querySelectorAll('.ch-costume')[k],token,root),true);flush(rail.timers,1100);}
  flush(rail.timers);assert.equal(rail.calls.done,1);flush(rail.timers);assert.equal(rail.calls.done,1);

  const train=setup({level:1}),t=new train.ns.GardenPractice.ShapeTrain(train.ctx);
  while(t.round<t.rounds){const token=t.roundToken,root=train.root;for(const f of t.forms){const k=t.cards.indexOf(f);root.querySelectorAll('.ch-costume')[k].fire();assert.equal(t.drop(root.querySelectorAll('.ch-car').find(c=>c.dataset.form===f),token,root),true);}flush(train.timers,1000);}
  flush(train.timers);assert.equal(train.calls.done,1);flush(train.timers);assert.equal(train.calls.done,1);
});
