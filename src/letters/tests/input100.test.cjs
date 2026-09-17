const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function runtime() {
  const removed = [];
  const window = { MiftahGame: { LettersArt: {}, LettersGardenArt: { pond: () => '' } }, addEventListener() {}, removeEventListener(...args) { removed.push(args); } };
  const document = { createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, setAttribute() {}, addEventListener() {} }) };
  const context = { window, document, performance: { now: () => 0 }, requestAnimationFrame() {}, setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'MiniGames.js'), 'utf8'), context);
  return { ns: window.MiftahGame, removed };
}

test('round builder and empty Pop/Catch/Feed inputs finish cleanly', () => {
  const { ns } = runtime();
  assert.equal(ns.LettersRoundBuilder({ items: [], rounds: 4 }).length, 0);
  for (const key of ['pop', 'catch', 'feed']) {
    let paid = 0;
    const ctx = { items: [], rounds: 4, stage: { innerHTML: '', removeEventListener() {} }, onDone: (n) => { paid += n + 1; } };
    new ns.LettersMiniGames[key](ctx).destroy();
    assert.equal(paid, 1, `${key} calls onDone once`);
  }
});

test('mini-game eligibility mirrors filtered constructor pools', () => {
  const { ns } = runtime();
  const can = ns.LettersMiniGameCanStart;
  const plain = { id: 'a', display: 'a' };
  const one = { id: 'a-', display: 'a-', parts: [plain] };
  const pair = { id: 'ab', display: 'ab', parts: [{ display: 'a' }, { display: 'b' }] };
  assert.equal(can('trace', [plain], []), true, 'Trace retains its constructor fallback');
  assert.equal(can('build', [plain, one], []), false);
  assert.equal(can('build', [pair], []), true);
  for (const game of ['blend', 'fuse', 'unfuse']) {
    assert.equal(can(game, [one], []), false, game);
    assert.equal(can(game, [pair], []), true, game);
  }
  assert.equal(can('chain', [{ ...pair, join2: true }], [{ display: 'a' }]), false);
  assert.equal(can('chain', [{ ...pair, join2: true }], [{ display: 't' }]), true);
  assert.equal(can('parade', [{ ...plain, parts: [] }], []), false);
  assert.equal(can('parade', [plain], [{ display: 't', joins: true }]), true);
});

test('Trace maps rendered coordinates and rejects outside or zero geometry', () => {
  const { ns } = runtime();
  const trace = Object.create(ns.LettersMiniGames.trace.prototype);
  trace.canvas = { width: 100, height: 80, getBoundingClientRect: () => ({ left: 10, top: 20, width: 50, height: 40 }) };
  assert.equal(trace.pos({ clientX: -100, clientY: 1000 }), null);
  trace.canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 0, height: 0 });
  assert.equal(trace.pos({ clientX: 1, clientY: 1 }), null);
});

test('Blend and Chain own one pointer across pieces and release on exit', () => {
  const {ns}=runtime();
  for(const key of ['blend','chain']){
    const a=dragNode(),b=dragNode();b.dataset.i='1';
    const scene={clientWidth:100,clientHeight:100,getBoundingClientRect:()=>({width:100,height:100})};
    const base=dragNode();base.parentElement=scene;
    const game=Object.create(ns.LettersMiniGames[key].prototype);
    Object.assign(game,{alive:true,els:[a,b],scene,base,parts:[0,1].map(()=>({x:50,y:50,part:{display:'a'}})),thirds:[0,1].map(()=>({x:50,y:50,l:{display:'a'}})),ctx:{say(){},stage:{querySelector:()=>null}}});
    game.wireDrag(a);game.wireDrag(b);
    a.events.pointerdown({button:0,pointerId:1,isPrimary:false,clientX:0,clientY:0});assert.equal(a.__lgPointer,undefined);
    a.events.pointerdown({button:0,pointerId:1,isPrimary:true,clientX:0,clientY:0});
    b.events.pointerdown({button:0,pointerId:2,isPrimary:true,clientX:0,clientY:0});assert.equal(b.__lgPointer,undefined);
    a.events.pointermove({pointerId:2,clientX:70,clientY:70});assert.equal(a.style.left,undefined);
    a.events.pointerup({pointerId:2});a.events.pointercancel({pointerId:2});assert.equal(a.hasPointerCapture(1),true);
    game.destroy();assert.equal(a.hasPointerCapture(1),false);assert.equal(game.activeDrag,null);
  }
});

test('Trace restart clears old hints and resets clear readiness even on collapsed paper', () => {
  const {ns}=runtime();let removed=0;
  const trace=Object.create(ns.LettersMiniGames.trace.prototype);
  Object.assign(trace,{alive:true,roundIndex:0,targets:[{display:'a'}],clearBtn:{disabled:false},finishEl:{hidden:true},nextBtn:{disabled:true,addEventListener(){},setAttribute(){},focus(){}},ctx:{setPrompt(){},say(){}},canvas:{parentElement:{classList:{remove(){}},clientWidth:0,clientHeight:0,parentElement:{classList:{remove(){}},querySelectorAll:()=>[]},querySelectorAll:()=>[{remove:()=>removed++}]}}});
  trace.startRound();assert.equal(removed,1);assert.equal(trace.clearBtn.disabled,true);assert.equal(trace.g,null);
});

test('Pop removes its resize listener and emits completion only once', () => {
  const {ns,removed}=runtime();let done=0;
  const pop=Object.create(ns.LettersMiniGames.pop.prototype);
  Object.assign(pop,{alive:true,slips:2,onResize(){},ctx:{onDone:n=>{assert.equal(n,2);done++;}}});
  pop.finish();pop.finish();assert.equal(done,1);assert.equal(removed[0][0],'resize');assert.equal(removed[0][1],pop.onResize);
});

function dragNode() {
  const events = {}; let owner = null;
  const flags = new Set();
  return { dataset: { i: '0' }, offsetLeft: 10, offsetTop: 10, offsetWidth: 20, offsetHeight: 20,
    clientWidth: 100, clientHeight: 100, style: {}, events,
    classList: { add: (x) => flags.add(x), remove: (x) => flags.delete(x), contains: (x) => flags.has(x), toggle() {} },
    addEventListener: (n, f) => { events[n] = f; }, setAttribute() {}, setPointerCapture: (id) => { owner = id; },
    hasPointerCapture: (id) => owner === id, releasePointerCapture: (id) => { if (owner === id) owner = null; },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 20, height: 20 }) };
}

test('Blend and Chain reject collapsed geometry and release capture on normal up', () => {
  const { ns } = runtime();
  for (const key of ['blend', 'chain']) {
    const el = dragNode(); const scene = { clientWidth: 100, clientHeight: 100, getBoundingClientRect: () => ({ width: 0, height: 100 }) };
    const base = dragNode(); base.parentElement = scene;
    const game = Object.create(ns.LettersMiniGames[key].prototype);
    Object.assign(game, { alive: true, merging: false, retrying: false, busy: false, els: [el], parts: [{ x: 50, y: 50, part: { display: 'a' } }], thirds: [{ x: 50, y: 50, l: { display: 'a' } }], scene, base, ctx: { say() {} }, tryChain() {} });
    game.wireDrag(el); el.events.pointerdown({ button: 0, pointerId: 4, clientX: 0, clientY: 0 });
    assert.equal(el.__lgPointer, undefined, `${key} ignores collapsed start geometry`);
    scene.getBoundingClientRect = () => ({ width: 100, height: 100 });
    el.events.pointerdown({ button: 0, pointerId: 4, clientX: 0, clientY: 0 });
    el.events.pointerup({ pointerId: 4 });
    assert.equal(el.hasPointerCapture(4), false, `${key} releases capture on normal up`);
  }
});

test('Blend ignores stale lost-capture events and Unfuse ignores collapsed drags', () => {
  const { ns } = runtime();
  const el = dragNode(); const scene = { clientWidth: 100, clientHeight: 100, getBoundingClientRect: () => ({ width: 100, height: 100 }) };
  const game = Object.create(ns.LettersMiniGames.blend.prototype);
  Object.assign(game, { alive: true, merging: false, retrying: false, els: [el], parts: [{ x: 50, y: 50, part: { display: 'a' } }], scene, ctx: { say() {} } });
  game.wireDrag(el); el.events.pointerdown({ button: 0, pointerId: 1, clientX: 0, clientY: 0 });
  el.events.lostpointercapture({ pointerId: 2 });
  assert.equal(el.__lgPointer, 1);
  const whole = dragNode(); whole.getBoundingClientRect = () => ({ width: 0, height: 0 });
  const unfuse = Object.create(ns.LettersMiniGames.unfuse.prototype);
  Object.assign(unfuse, { alive: true, busy: false, targets: [{ parts: [{ display: 'a' }, { display: 'b' }] }], ctx: { say() {} } });
  assert.equal(unfuse.canStartDrag(whole), false, 'Unfuse ignores collapsed rendered bounds');
});

test('Unfuse split releases a held pointer before hiding its tile',()=>{
 const {ns}=runtime(),whole=dragNode();whole.style.setProperty=()=>{};whole.__lgPointer=5;whole.setPointerCapture(5);
 const pull={hidden:false},halves={hidden:true};const game=Object.create(ns.LettersMiniGames.unfuse.prototype);
 Object.assign(game,{alive:true,busy:false,whole,roundIndex:0,targets:[{parts:[{display:'a'},{display:'b'}]}],ctx:{stage:{querySelector:s=>s==='.unfuse-pull'?pull:halves},sfx(){},confettiAt(){},say(){}}});
 game.split();assert.equal(whole.hasPointerCapture(5),false);assert.equal(whole.__lgPointer,null);assert.equal(pull.hidden,true);assert.equal(halves.hidden,false);
});
