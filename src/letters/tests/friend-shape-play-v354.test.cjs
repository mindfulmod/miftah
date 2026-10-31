const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classes() {
  const set = new Set();
  return { add: (...xs) => xs.forEach(x => set.add(x)), remove: (...xs) => xs.forEach(x => set.delete(x)),
    contains: x => set.has(x), toggle: (x, force) => { const on = force === undefined ? !set.has(x) : force; on ? set.add(x) : set.delete(x); return on; } };
}
function el(dataset = {}, rect = {left:0,top:0,right:100,bottom:100,width:100,height:100}) {
  const listeners = new Map();
  return { dataset, classList: classes(), style:{}, hidden:false, isConnected:true, offsetWidth:100,
    addEventListener(n, fn) { listeners.set(n, [...(listeners.get(n)||[]), fn]); },
    dispatch(n, event={}) { for (const fn of listeners.get(n)||[]) fn(event); },
    getBoundingClientRect(){return rect;}, matches(s){return s===':focus-visible'&&this.focusVisible===true;},
    focus(){this.focused=true;}, setAttribute(){}, animate(frames, options){this.animations??=[];this.animations.push({frames,options});return {cancel(){}};},
    querySelector(){return null;}, querySelectorAll(){return [];},
  };
}
function rig({count=2,reduced=false}={}) {
  const timers=[], outcomes=[], spoken=[], sfx=[]; let game, done=0;
  const chars=['ب','ت','ث','ج'];
  const ns={LetterFriends:{FRIENDS:Object.fromEntries([...chars,'ه'].map(c=>[c,true])),art:(_c,opts={})=>opts.mode==='plain'?'<svg/>':'<svg class="lf"/>',item:c=>({id:c,display:c}),get:c=>({call:`call-${c}`})},
    PictureWords:{byChar:()=>[],item:x=>x,art:()=>''},PracticeLearning:{profile:()=>({choiceCount:count}),orderChars:(_ctx,cs,_skill,n)=>cs.slice(0,n)}};
  const root=el(), stage={innerHTML:'',get firstElementChild(){return root;}};
  let pieces=[], hole, friendSvg, friendLf, lift, toys, unbuild, rebuild, next, progress;
  const selectorMap={'.bk-missing':()=>hole,'.bk-missing-friend > svg':()=>friendSvg,'.bk-missing-friend > .lf':()=>friendLf,
    '.bk-piece':()=>pieces[0],'.bk-missing-friend':()=>friendSvg,'.bk-pieces':()=>piecesContainer,'.bk-shape-toys':()=>toys,'.bk-shape-lift':()=>lift,'.bk-shape-unbuild':()=>unbuild,
    '.bk-shape-rebuild':()=>rebuild,'.bk-shape-next':()=>next,'.bk-progress':()=>progress};
  const piecesContainer=el();
  function render(html) {
    pieces=[...html.matchAll(/<button type="button" class="bk-piece" data-i="(\d+)"/g)].map(m=>el({i:m[1]}, {left:300,top:200,right:396,bottom:296,width:96,height:96}));
    hole=html.includes('class="bk-missing"')?el({}, {left:100,top:40,right:220,bottom:160,width:120,height:120}):null;
    friendSvg=html.includes('class="bk-missing-friend"')?el({}, {left:110,top:50,right:210,bottom:150,width:100,height:100}):null;
    friendLf=friendSvg?el():null;
    lift=html.includes('class="bk-shape-lift"')?el():null; toys=html.includes('class="bk-shape-toys"')?el():null;
    unbuild=html.includes('class="bk-shape-unbuild"')?el():null; rebuild=html.includes('class="bk-shape-rebuild"')?el():null;
    next=html.includes('class="bk-shape-next"')?el():null; progress=html.includes('class="bk-progress"')?el():null;
    if(progress)Object.defineProperty(progress,'outerHTML',{configurable:true,get(){return this._outerHTML||'<div class="bk-progress"></div>';},set(v){this._outerHTML=v;}});
    if(toys)toys.hidden=/class="bk-shape-toys" hidden/.test(html);
    if(lift)lift.hidden=/class="bk-shape-lift" hidden/.test(html);
    if(unbuild)unbuild.hidden=/class="bk-shape-unbuild"[^>]* hidden/.test(html);
    if(rebuild)rebuild.hidden=/class="bk-shape-rebuild"[^>]* hidden/.test(html);
    piecesContainer.hidden=false;
  }
  Object.defineProperty(root,'innerHTML',{get(){return this._html||'';},set(v){this._html=v;render(v);}});
  root.classList=classes();
  root.querySelector=s=>selectorMap[s]?.()||null;
  root.querySelectorAll=s=>s==='.bk-piece'?pieces:[];
  let cue;
  ns.GardenPractice={draggable:(button,opts)=>{button.drag=opts;return ()=>{button.dragReset=true;};}};
  const fixedMath=Object.create(Math);fixedMath.random=()=>0.37;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','BookGames.js'),'utf8'),{window:{MiftahGame:ns},Math:fixedMath,
    setTimeout:(fn,ms)=>{const t={fn,ms};timers.push(t);return t;},clearTimeout:()=>{},document:{}},{filename:'BookGames.js'});
  game=new ns.GardenPractice.FriendShapes({stage,items:chars.map(display=>({display,taught:true})).concat([{display:'ه',taught:false}]),
    reducedMotion:()=>reduced,say:x=>{spoken.push(x);return true;},sfx:x=>sfx.push(x),reportOutcome:x=>outcomes.push(x),done:()=>done++,
    setupActionCue:options=>{cue={options,destroy(){this.destroyed=true;}};return cue;},cancel(){}});
  function fire(ms) { const t=timers.find(x=>!x.fired&&x.ms===ms);assert.ok(t,`expected pending ${ms}ms callback`);t.fired=true;t.fn(); }
  function piece(char=game.target) {const b=pieces.find(x=>game.offered[Number(x.dataset.i)]===char);assert.ok(b,`offered ${char}`);return b;}
  function correctTap(){const b=piece();b.dispatch('click');return b;}
  function correctDrag(){const b=piece();assert.equal(b.drag.drop(150,100,{left:340,top:240,width:40,height:40}),true);return b;}
  function assemble(b){fire(reduced?0:340);assert.equal(game.phase,'playing');assert.equal(game.assembled,true);assert.equal(piecesContainer.hidden,true);assert.equal(toys.hidden,false);}
  return {game,root,timers,outcomes,spoken,sfx,fire,piece,correctTap,correctDrag,assemble,get pieces(){return pieces;},get piecesHidden(){return piecesContainer.hidden;},get friendLf(){return friendLf;},get hole(){return hole;},get lift(){return lift;},get toys(){return toys;},get unbuild(){return unbuild;},get rebuild(){return rebuild;},get next(){return next;},get cue(){return cue;},get done(){return done;}};
}

test('choice bounds include the target and only taught friends',()=>{
  for(const count of [2,3]){const r=rig({count});assert.equal(r.game.offered.length,count);assert.ok(r.game.offered.includes(r.game.target));assert.ok(r.game.offered.every(c=>['ب','ت','ث','ج'].includes(c)));assert.ok(!r.game.offered.includes('ه'));r.game.destroy();}
});
test('wrong choices deduplicate; a miss makes the correct response assisted',()=>{
  const r=rig(), wrong=r.game.offered.find(c=>c!==r.game.target);r.piece(wrong).dispatch('click');assert.equal(r.outcomes.length,1);assert.equal(r.outcomes[0].correct,false);r.piece(wrong).dispatch('click');assert.equal(r.outcomes.length,1);
  r.correctTap();assert.equal(r.outcomes.length,2);assert.equal(r.outcomes[1].correct,true);assert.equal(r.outcomes[1].assisted,true);r.assemble();r.game.destroy();
});
test('outside drops do nothing; correct released drag animates once and duplicate release is guarded',()=>{
  const r=rig(),b=r.piece();assert.equal(b.drag.drop(500,500,{left:500,top:500,width:20,height:20}),false);assert.equal(r.outcomes.length,0);assert.equal(b.drag.drop(150,100,{left:340,top:240,width:40,height:40}),true);assert.equal(r.outcomes.length,1);assert.equal(b.animations[0].options.duration,340);assert.match(b.animations[0].frames[0].transform,/translate\(41\.666/);assert.equal(b.drag.drop(150,100,{left:340,top:240,width:40,height:40}),false);r.assemble();assert.equal(r.outcomes.length,1);r.game.destroy();
});
test('assembled play waits for the child and take-apart/rebuild do not add outcomes',()=>{
  const r=rig();r.correctTap();r.assemble();const n=r.outcomes.length;assert.equal(r.game.round,0);assert.equal(r.root.classList.contains('is-apart'),false);assert.equal(r.lift.hidden,false);assert.equal(r.toys.hidden,false);assert.equal(r.piecesHidden,true);r.unbuild.dispatch('click');assert.equal(r.game.assembled,false);assert.equal(r.game.phase,'playing');assert.equal(r.rebuild.hidden,false);assert.equal(r.root.classList.contains('is-apart'),true);assert.equal(r.lift.hidden,true);
  assert.equal(r.lift.drag.drop(500,500,{left:500,top:500}),false);assert.equal(r.game.assembled,false);assert.equal(r.rebuild.drag.drop(150,100,{left:340,top:240,width:30,height:30}),true);assert.equal(r.game.phase,'assembling');r.fire(340);assert.equal(r.game.assembled,true);assert.equal(r.root.classList.contains('is-apart'),false);assert.equal(r.friendLf.classList.contains('is-whole'),true);assert.equal(r.rebuild.hidden,true);assert.equal(r.lift.hidden,false);assert.equal(r.outcomes.length,n);assert.equal(r.game.round,0);
  assert.equal(r.lift.drag.drop(500,500,{left:500,top:500}),true);assert.equal(r.game.assembled,false);assert.equal(r.root.classList.contains('is-apart'),true);assert.equal(r.outcomes.length,n);r.game.destroy();
});
test('Next while apart advances and detached controls are inert',()=>{
  const r=rig();r.correctTap();r.assemble();r.unbuild.dispatch('click');const oldNext=r.next, oldPiece=r.pieces[0], oldRound=r.game.round;r.next.dispatch('click');assert.equal(r.game.round,oldRound+1);assert.equal(r.game.phase,'matching');const now=r.outcomes.length;oldNext.dispatch('click');oldPiece.dispatch('click');assert.equal(r.game.round,oldRound+1);assert.equal(r.game.phase,'matching');assert.equal(r.outcomes.length,now);r.game.destroy();
});
test('destroyed captured arrival cannot alter page or speak',()=>{
  const r=rig();r.correctTap();const arrival=r.timers.find(t=>t.ms===340);assert.ok(arrival);const html=r.root.innerHTML, voice=r.spoken.length, outcomes=r.outcomes.length;r.game.destroy();arrival.fn();assert.equal(r.root.innerHTML,html);assert.equal(r.spoken.length,voice);assert.equal(r.outcomes.length,outcomes);
});
test('reduced motion preserves keyboard focus and completes full session once',()=>{
  const r=rig({reduced:true});let guard=0;
  while(r.game.phase!=='finished'&&guard++<5){const b=r.piece();b.focusVisible=true;b.dispatch('click');r.assemble();if(guard===1)assert.equal(r.next.focused,true);if(r.game.round+1<r.game.rounds){r.next.focusVisible=true;r.next.dispatch('click');}else r.next.dispatch('click');}
  assert.equal(r.game.phase,'finished');assert.equal(r.done,1);r.next?.dispatch('click');assert.equal(r.done,1);assert.equal(r.outcomes.filter(x=>x.correct).length,r.game.rounds);r.game.destroy();
});

test('hand help marks matching assisted, while toy help and replay add no learning',()=>{
 const r=rig();r.cue.options.onShow();r.correctTap();assert.equal(r.outcomes[0].assisted,true);r.assemble();
 const n=r.outcomes.length,voice=r.spoken.length;r.cue.options.onShow();r.lift.dispatch('click');
 assert.equal(r.spoken.length,voice+1);assert.equal(r.spoken.at(-1).id,r.game.target);assert.equal(r.outcomes.length,n);r.game.destroy();
});
test('an inside lift release preserves the assembled friend and Next cannot cut a rebuild short',()=>{
 const r=rig();r.correctTap();r.assemble();const n=r.outcomes.length;
 assert.equal(r.lift.drag.drop(150,100),false);assert.equal(r.game.assembled,true);
 r.unbuild.dispatch('click');r.rebuild.dispatch('click');const round=r.game.round;r.next.dispatch('click');
 assert.equal(r.game.phase,'assembling');assert.equal(r.game.round,round);r.fire(340);assert.equal(r.game.assembled,true);assert.equal(r.outcomes.length,n);r.game.destroy();
});
