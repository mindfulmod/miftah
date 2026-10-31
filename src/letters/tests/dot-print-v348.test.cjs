const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function el(tag, cls = '', dataset = {}) {
  const classes = new Set(cls.split(/\s+/).filter(Boolean)), listeners = {};
  return { tag, dataset, listeners, style: {}, disabled: false, hidden: false, attrs: {}, innerHTML: '',
    classList: { add: (...xs) => xs.forEach(x => classes.add(x)), remove: (...xs) => xs.forEach(x => classes.delete(x)), contains: x => classes.has(x), toggle(x, force) { const yes = force === undefined ? !classes.has(x) : force; yes ? classes.add(x) : classes.delete(x); return yes; } },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }, click() { if (!this.disabled) (listeners.click || []).forEach(fn => fn({ currentTarget: this })); },
    setAttribute(k, v) { this.attrs[k] = v; }, focus() { this.focused = true; }, matches(sel) { return sel === ':focus-visible' && !!this.focused; }, animations:0, animate() { this.animations++; return { cancel: () => { this.cancelled = true; } }; } };
}
class Root {
  set innerHTML(html) {
    this.html = html; this.nodes = {};
    // Parse actual production markup, including nested spans and SVG circles.
    for (const m of html.matchAll(/<(button|span|div|i|circle|path)[^>]*class="([^"]+)"([^>]*)>/g)) {
      const [, tag, classes, attrs] = m;
      const data = Object.fromEntries([...attrs.matchAll(/data-([\w-]+)="([^"]+)"/g)].map(x => [x[1], x[2]]));
      const n = el(tag, classes, data); for (const [,k,v] of attrs.matchAll(/\b(cx|cy|r|aria-label)="([^"]*)"/g)) n[k] = v;
      for (const key of ['disabled','hidden']) if (new RegExp(`\\b${key}(?:\\s|>)`).test(m[0])) n[key] = true;
      for (const cls of classes.split(/\s+/)) (this.nodes[cls] ||= []).push(n);
    }
  }
  querySelectorAll(sel) {
    const m = sel.match(/^\.([\w-]+)(?:\[data-i="(\d+)"\])?$/); if (!m) return [];
    const all = this.nodes?.[m[1]] || []; return m[2] === undefined ? all : all.filter(n => Number(n.dataset.i) === Number(m[2]));
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}
function setup({ count = 2, demo = false, reduced = false } = {}) {
  const timers = [], outcomes = [], begins = [], cues = [], chars = ['ب','ت','ث'];
  const doc = { activeElement: null, body: {} }, root = new Root();
  const body = 'M84 46Q86 68 66 70L34 70Q14 68 16 46';
  const stroke = { ب: [body, {dot:[50,84]}], ت: [body, {dot:[58,32]}, {dot:[42,32]}], ث: [body, {dot:[50,22]}, {dot:[60,34]}, {dot:[40,34]}] };
  const ns = { LetterFriends: { FRIENDS: Object.fromEntries(chars.map(c => [c, {}])), art: c => `<svg>${c}</svg>` }, LettersStrokes: { LETTERS: stroke },
    LETTERS_DATA: { packs: [{ letters: chars.map(c => ({ char:c, arName:c })) }] }, PracticeLearning: { profile: () => ({ choiceCount:count }), orderChars: (_ctx,pool) => pool.slice(), level:()=>0 }, GardenPractice:{} };
  const context = { window:{ MiftahGame:ns }, document:doc, setTimeout(fn,ms) { const t={fn,ms,cleared:false,fired:false}; timers.push(t); return t; }, clearTimeout(t) { if(t)t.cleared=true; }, Math:Object.assign(Object.create(Math),{random:()=>0.2}) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','PuzzleGames.js'),'utf8'),context);
  const ctx = { items:chars.map(c=>({id:c,display:c,speak:c})), known:[], firstActionDemo:demo, reducedMotion:()=>reduced,
    stage:{set innerHTML(v){this._html=v;this.firstElementChild=root;},get innerHTML(){return this._html;}},
    reportOutcome:o=>outcomes.push(o), beginRound:(...a)=>begins.push(a), say:()=>true, sfx(){}, correct(){}, confettiAt(){}, done(){this.doneCount=(this.doneCount||0)+1;}, cancel(){this.cancelCount=(this.cancelCount||0)+1;}, pet:{cheer(){}},
    setupActionCue:o=>{const cue={...o,destroyed:false,destroy(){this.destroyed=true;}};cues.push(cue);return cue;} };
  const game=new ns.GardenPractice.DotsLast(ctx); return {game,root,timers,outcomes,begins,cues,ctx,stroke};
}
function stamp(f) { return f.root.querySelector('.pz-stamp'); }
function choose(f,c) { const i=f.game.offered.indexOf(c); assert.notEqual(i,-1); f.root.querySelectorAll('.pz-tile')[i].click(); }
function drain(f) { for(let i=0;i<100;i++){const t=f.timers.find(x=>!x.cleared&&!x.fired);if(!t)return;t.fired=true;t.fn();} assert.fail('timer drain exceeded bounded limit'); }
function dotCount(f) { return f.root.querySelectorAll('.pz-dot').filter(d=>d.classList.contains('is-on')).length; }

test('printing waits for the child: draining every timer never prints a dot',()=>{const f=setup();drain(f);assert.equal(f.game.revealed,0);assert.equal(dotCount(f),0);assert.equal(f.begins.length,0);});
test('real stamps reveal one mark at a time for two- and three-dot letters, with no surplus',()=>{const f=setup({count:3});for(const target of ['ب','ت','ث']){assert.equal(f.game.target,target);const n=f.game.dotList.length;for(let i=1;i<=n;i++){stamp(f).click();assert.equal(f.game.revealed,i);assert.equal(dotCount(f),i);}assert.equal(dotCount(f),n);const old=stamp(f);old.click();assert.equal(f.game.revealed,n);old.click();assert.equal(f.game.revealed,n);if(target!=='ث'){choose(f,target);stamp(f).click();}}});
test('before certainty, lucky and wrong choices each reveal one dot with no report or completion',()=>{for(const c of ['ب','ث']){const f=setup();choose(f,c);assert.equal(f.game.revealed,1);assert.equal(f.outcomes.length,0);assert.notEqual(f.game.phase,'complete');}});
test('a certain selection reports letter-form and a wrong answer marks assistance honestly',()=>{const f=setup();while(!f.game.determined())stamp(f).click();const wrong=f.game.offered.find(c=>c!==f.game.target);choose(f,wrong);assert.equal(f.outcomes.length,1);assert.equal(f.outcomes[0].skill,'letter-form');assert.equal(f.outcomes[0].correct,false);assert.equal(f.game.missed,true);choose(f,f.game.target);assert.equal(f.outcomes.at(-1).assisted,true);assert.equal(f.outcomes.at(-1).skill,'letter-form');});
test('the real question begins only after enough visible dots distinguish each letter',()=>{const f=setup({count:3});for(const target of ['ب','ت','ث']){assert.equal(f.game.target,target);const base=f.begins.length;while(!f.game.determined()){stamp(f).click();if(!f.game.determined())assert.equal(f.begins.length,base);}assert.equal(f.begins.length,base+1);assert.equal(f.begins.at(-1)[1],'letter-form');if(target!=='ث'){choose(f,target);stamp(f).click();}}});
test('a solved print holds until stamp-next; stale tile, stamp, and cue callbacks cannot affect the new round',()=>{const f=setup({count:3});const oldTile=f.root.querySelectorAll('.pz-tile')[f.game.offered.indexOf(f.game.target)], oldStamp=stamp(f), oldCue=f.cues.at(-1);while(!f.game.determined())oldStamp.click();choose(f,f.game.target);assert.equal(f.game.phase,'complete');assert.equal(dotCount(f),f.game.dotList.length);const reports=f.outcomes.length, round=f.game.round;drain(f);assert.equal(f.game.round,round);oldTile.listeners.click.forEach(fn=>fn());oldStamp.listeners.click.forEach(fn=>fn());oldStamp.listeners.click.forEach(fn=>fn());oldCue.onShow?.();assert.equal(f.game.round,round+1);assert.equal(f.outcomes.length,reports);assert.equal(f.game.missed,false);});
test('all three taught sibling rounds finish exactly once, even if finish is requested again',()=>{const f=setup({count:3});assert.equal(f.game.rounds,3);for(let r=0;r<3;r++){while(!f.game.determined())stamp(f).click();choose(f,f.game.target);assert.equal(dotCount(f),f.game.dotList.length);stamp(f).click();}assert.equal(f.game.phase,'finished');drain(f);f.game.finish();drain(f);assert.equal(f.ctx.doneCount,1);});
test('first cue teaches stamp tap automatically only on first visit; shown cue marks assistance',()=>{const f=setup({demo:true});const cue=f.cues[0];assert.equal(cue.source,stamp(f));assert.equal(cue.type,'tap');assert.equal(cue.automatic,true);cue.onShow();assert.equal(f.game.missed,true);while(!f.game.determined())stamp(f).click();choose(f,f.game.target);stamp(f).click();assert.equal(f.cues.at(-1).automatic,false);const next=f.cues.at(-1);next.onShow();assert.equal(f.game.missed,true);});
test('keyboard focus moves from last-dot stamp to first answer, then answer to next stamp',()=>{const f=setup();while(!f.game.determined()){const s=stamp(f);s.focused=true;s.click();if(s.disabled)assert.equal(f.root.querySelectorAll('.pz-tile')[0].focused,true);}const tile=f.root.querySelectorAll('.pz-tile')[f.game.offered.indexOf(f.game.target)];tile.focused=true;choose(f,f.game.target);assert.equal(stamp(f).focused,true);stamp(f).click();assert.equal(stamp(f).focused,true);});
test('reduced motion skips stamp animation; ordinary motion animates and destroy cancels it, cue, and timers',()=>{const f=setup({reduced:true});stamp(f).click();assert.equal(f.root.querySelector('.pz-stamp-art').animations,0);const g=setup();stamp(g).click();const art=g.root.querySelector('.pz-stamp-art');assert.equal(art.animations,1);const motion=g.game.stampMotion;assert.ok(motion);g.game.destroy();assert.equal(art.cancelled,true);assert.ok(g.cues.some(c=>c.destroyed));assert.equal(g.game.alive,false);assert.ok(g.timers.every(t=>t.cleared));});
