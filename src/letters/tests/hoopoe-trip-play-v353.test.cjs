const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classes() { const s=new Set(); return {add:(...x)=>x.forEach(v=>s.add(v)),remove:(...x)=>x.forEach(v=>s.delete(v)),contains:x=>s.has(x),toggle:(x,f)=>{const v=f===undefined?!s.has(x):f;v?s.add(x):s.delete(x);return v;}}; }
function element(dataset={}, rect={left:0,top:0,right:100,bottom:100,width:100,height:100}) {
  const listeners=new Map(), attrs={}; return {dataset,classList:classes(),style:{},hidden:false,isConnected:true,disabled:false,offsetWidth:100,
    addEventListener(n,f){listeners.set(n,[...(listeners.get(n)||[]),f]);},dispatch(n,e={}){for(const f of listeners.get(n)||[])f(e);},setAttribute(k,v){attrs[k]=v;},getAttribute(k){return attrs[k];},matches(s){return s===':focus-visible'&&this.focusVisible===true;},focus(){this.focused=true;},getBoundingClientRect(){return rect;},animate(frames,options){this.animations??=[];this.animations.push({frames,options});return {cancel(){}};},querySelector(){return null;},querySelectorAll(){return [];},insertAdjacentHTML(_p,h){this.innerHTML=(this.innerHTML||'')+h;}};
}
function rig({count=2,reduced=false,say=()=>true}={}) {
  const timers=[],spoken=[],outcomes=[]; let done=0, game;
  const chars=['ب','ت','ث','ج'];
  const ns={LetterFriends:{FRIENDS:Object.fromEntries([...chars,'ه'].map(c=>[c,true])),art:()=>'<svg/>',item:c=>({id:c,display:c}),get:c=>({en:`friend-${c}`,call:`call-${c}`})},
    PictureWords:{byChar:()=>[],item:x=>x,art:()=>''},PracticeLearning:{profile:()=>({choiceCount:count}),orderChars:(_ctx,cs,_skill,n)=>cs.slice(0,n)}};
  const root=element(), stage={innerHTML:'',get firstElementChild(){return root;}};
  let walkers=[],friends=[],chorus,next,parade,waiting,actions,place,progress;
  function setParade(html) {
    walkers=[...html.matchAll(/class="bk-walker" data-friend="([^"]+)"/g)].map(m=>element({friend:m[1]}));
    parade=element({}, {left:0,top:0,right:240,bottom:100,width:240,height:100});
    Object.defineProperty(parade,'outerHTML',{get(){return html;},set(v){html=v;setParade(v);}});
  }
  function parse() {
    const html=root._html||'';
    if(html.includes('class="bk-parade"'))setParade(html.match(/<div class="bk-parade"[\s\S]*?<\/div>/)?.[0]||html);else parade=null;
    place=html.includes('class="bk-trip-place"')?element({}, {left:110,top:0,right:160,bottom:60,width:50,height:60}):null;
    friends=[...html.matchAll(/class="bk-friend" data-i="(\d+)"/g)].map(m=>{const b=element({i:m[1]},{left:300,top:200,right:396,bottom:296,width:96,height:96});b.drag=null;return b;});
    chorus=html.includes('class="bk-trip-chorus"')?element():null; next=html.includes('class="bk-trip-next"')?element():null;
    waiting=html.includes('class="bk-waiting"')?element():null; actions=html.includes('class="bk-trip-actions"')?element():null;
    if(waiting)waiting.hidden=/class="bk-waiting"[^>]* hidden/.test(html);
    if(actions)actions.hidden=/class="bk-trip-actions" hidden/.test(html);
    progress=html.includes('class="bk-progress"')?element():null;
  }
  Object.defineProperty(root,'innerHTML',{get(){return this._html||'';},set(v){this._html=v;parse();}});
  Object.defineProperty(root,'outerHTML',{get(){return this.innerHTML;},set(v){this.innerHTML=v;}});
  root.querySelector=s=>s==='.bk-walker:last-child'?walkers.at(-1)||null:s==='.bk-friend'?friends[0]||null:({'.bk-parade':parade,'.bk-trip-place':place,'.bk-waiting':waiting,'.bk-trip-actions':actions,'.bk-trip-chorus':chorus,'.bk-trip-next':next,'.bk-progress':progress}[s]||null);
  root.querySelectorAll=s=>s==='.bk-walker'?walkers:s==='.bk-friend'?friends:[];
  ns.GardenPractice={draggable:(b,o)=>{b.drag=o;return ()=>{b.dragReset=true;};}};
  const fixedMath=Object.create(Math);fixedMath.random=()=>0.37;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','BookGames.js'),'utf8'),{window:{MiftahGame:ns},Math:fixedMath,setTimeout:(fn,ms)=>{const t={fn,ms,cleared:false};timers.push(t);return t;},clearTimeout:t=>{if(t)t.cleared=true;},document:{}},{filename:'BookGames.js'});
  const items=[...chars.map(display=>({display,taught:true})),{display:'ه',taught:true},{display:'خ',taught:false}];
  game=new ns.GardenPractice.HoopoeTrip({stage,items,known:[{display:'ق',taught:true}],reducedMotion:()=>reduced,say:x=>{spoken.push(x);return say(x);},stopSpeech(){},reportOutcome:x=>outcomes.push(x),done:()=>done++,beginRound(){},setupActionCue:()=>({destroy(){this.destroyed=true;}}),cancel(){}});
  function fire(ms){const t=timers.find(x=>!x.cleared&&x.ms===ms);assert.ok(t,`expected pending ${ms}ms timer`);t.cleared=true;t.fn();}
  function choose(c){const b=friends.find(x=>game.offered[Number(x.dataset.i)]===c);assert.ok(b,`offered ${c}`);b.dispatch('click');return b;}
  function correct(){return choose(game.stops[game.page]);}
  function pickCorrectDrag(){const c=game.stops[game.page],b=friends.find(x=>game.offered[Number(x.dataset.i)]===c);assert.ok(b);assert.equal(b.drag.drop(120,50,{left:345,top:245,width:40,height:40}),true);return b;}
  return {game,root,timers,spoken,outcomes,fire,choose,correct,pickCorrectDrag,get walkers(){return walkers;},get friends(){return friends;},get chorus(){return chorus;},get next(){return next;},get parade(){return parade;},get done(){return done;}};
}
function advanceArrival(r){r.fire(420);}

test('choice counts retain taught choices, exclude forbidden letters, and outside drags do nothing',()=>{
  for(const count of [2,3]){const r=rig({count}),g=r.game;assert.equal(g.offered.length,count);assert.ok(g.offered.includes(g.stops[0]));assert.ok(g.offered.every(c=>['ب','ت','ث','ج'].includes(c)));assert.ok(!g.offered.includes('ه')&&!g.offered.includes('خ')&&!g.offered.includes('ق'));
    const b=r.friends[0];assert.equal(b.drag.drop(500,500,{left:500,top:500}),false);assert.equal(g.phase,'finding');assert.equal(r.outcomes.length,0);g.destroy();}
});
test('wrong selections report once per choice; correct tap joins and holds in gathered phase',()=>{
 const r=rig(),g=r.game,target=g.stops[0],wrong=g.offered.find(c=>c!==target);r.choose(wrong);assert.equal(r.outcomes.length,1);assert.equal(r.outcomes[0].correct,false);r.choose(wrong);assert.equal(r.outcomes.length,1);
 const before=r.outcomes.length;r.correct();assert.equal(r.outcomes.length,before+1);assert.equal(r.outcomes.at(-1).correct,true);advanceArrival(r);assert.equal(g.phase,'gathered');assert.equal(JSON.stringify(g.parade),JSON.stringify(['ه',target]));assert.equal(r.walkers.length,2);const joinedFriend=r.walkers.at(-1);joinedFriend.dispatch('click');assert.equal(r.spoken.at(-1).id,target,'the rendered joined friend replays its own name');const p=g.parade.length;g.destroy();assert.equal(p,2);
});
test('released-position drag uses the 420ms flight and one arrival outcome',()=>{const r=rig(),g=r.game;const b=r.pickCorrectDrag();assert.equal(g.phase,'joining');assert.equal(b.animations[0].options.duration,420);assert.match(b.animations[0].keyframes?.[0]?.transform||b.animations[0].frames[0].transform,/translate\(46\.875px, 46\.875px\)/);assert.equal(r.outcomes.length,1);advanceArrival(r);assert.equal(g.phase,'gathered');assert.equal(r.outcomes.length,1);assert.equal(g.parade.length,2);g.destroy();});
test('gathered friend and refrain controls do not teach; Next works with unresolved speech',async()=>{for(const say of [()=>false,()=>Promise.reject(Error('voice'))]){const r=rig({say}),g=r.game;r.correct();advanceArrival(r);const reportN=r.outcomes.length,spokenN=r.spoken.length;r.walkers[0].dispatch('click');r.chorus.dispatch('click');assert.equal(r.outcomes.length,reportN);assert.equal(r.spoken.length,spokenN+2);r.next.dispatch('click');assert.equal(g.phase,'walking');r.fire(420);assert.equal(g.phase,'finding');assert.equal(r.outcomes.length,reportN);g.destroy();await Promise.resolve();}});
test('stale refrain, old-page buttons and destroyed arrivals are inert',async()=>{
 const resolvers=[];const r=rig({say:()=>new Promise(resolve=>resolvers.push(resolve))}),g=r.game;const oldFriend=r.friends[0],oldNext=r.next;
 r.correct();advanceArrival(r);r.chorus.dispatch('click');const refrainResolve=resolvers.at(-1),count=r.spoken.length;
 r.next.dispatch('click');r.fire(420);assert.equal(g.phase,'finding');assert.equal(r.spoken.length,count+1,'new page says its prompt');
 const reportCount=r.outcomes.length,page=g.page,target=g.stops[page];oldFriend.dispatch('click');oldNext.dispatch('click');assert.equal(g.page,page);assert.equal(r.outcomes.length,reportCount);assert.equal(g.phase,'finding');
 refrainResolve(true);await Promise.resolve();await Promise.resolve();assert.equal(r.spoken.length,count+1,'resolving old refrain adds no names after Next');
 const arrivalGame=rig(),h=arrivalGame.game;arrivalGame.correct();const arrival=arrivalGame.timers.find(t=>t.ms===420&&!t.cleared);assert.ok(arrival);const paradeSize=h.parade.length,voiceCount=arrivalGame.spoken.length;h.destroy();arrival.fn();assert.equal(h.parade.length,paradeSize);assert.equal(arrivalGame.spoken.length,voiceCount);assert.equal(arrivalGame.outcomes.length,1);
 g.destroy();
});
test('walk every stop to home without auto finishing; Finish calls done once',()=>{const r=rig(),g=r.game;let guard=0;while(g.phase!=='home'&&guard++<10){r.correct();advanceArrival(r);assert.equal(g.phase,'gathered');r.next.dispatch('click');assert.equal(g.phase,'walking');r.fire(420);}assert.equal(g.phase,'home');assert.equal(r.done,0);assert.equal(r.outcomes.filter(x=>x.correct).length,g.stops.length);r.next.dispatch('click');assert.equal(g.phase,'finished');assert.equal(r.done,1);r.next?.dispatch('click');assert.equal(r.done,1);g.destroy();});
test('reduced-motion arrivals and keyboard focus advance from joined friend to Next',()=>{
 const r=rig({reduced:true}),g=r.game,choice=r.friends.find(b=>g.offered[Number(b.dataset.i)]===g.stops[0]);choice.focusVisible=true;choice.dispatch('click');assert.equal(g.phase,'joining');r.fire(0);assert.equal(g.phase,'gathered');assert.equal(r.next.focused,true);
 r.next.focusVisible=true;r.next.dispatch('click');assert.equal(g.phase,'walking');r.fire(0);assert.equal(g.phase,'finding');assert.equal(r.root.querySelector('.bk-friend').focused,true);g.destroy();
});

test('question replay speaks the current letter and is inert during a join',()=>{
 const r=rig(),g=r.game,n=r.spoken.length;
 g.replayPrompt(); assert.equal(r.spoken.length,n+1);assert.equal(r.spoken.at(-1).id,g.stops[g.page]);assert.equal(r.outcomes.length,0);
 r.correct();const after=r.spoken.length;g.replayPrompt();assert.equal(r.spoken.length,after);g.destroy();
});
