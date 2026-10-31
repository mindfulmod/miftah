const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

function classes(){
 const set=new Set();
 return {add:(...xs)=>xs.forEach(x=>set.add(x)),remove:(...xs)=>xs.forEach(x=>set.delete(x)),contains:x=>set.has(x),toggle:(x,on)=>on?set.add(x):set.delete(x)};
}
function button({left=0,top=0,width=64,height=64,cls=''}={}){
 const listeners={},attrs={};let captured=null;
 return {style:{transform:'',setProperty(){}},classList:classes(),listeners,attrs,dataset:{},disabled:false,isConnected:true,innerHTML:'',
  addEventListener(type,fn){(listeners[type] ||= []).push(fn)},dispatch(type,event={}){for(const fn of listeners[type]||[])fn(event)},
  setAttribute(k,v){attrs[k]=v},getAttribute(k){return attrs[k]},setPointerCapture(id){captured=id},hasPointerCapture(id){return captured===id},releasePointerCapture(id){if(captured===id)captured=null},
  getBoundingClientRect(){return {left,top,right:left+width,bottom:top+height,width,height}},focus(){},remove(){this.isConnected=false},
  className:cls,
 };
}
function runtime(){
 const timers=[],outcomes=[],spoken=[];
 const ns={LettersArt:{icon:()=>'<svg/>',inkShift:()=>({dx:0,dy:0})}};
 const window={MiftahGame:ns,matchMedia:()=>({matches:true}),addEventListener(){},removeEventListener(){}};
 const document={createElement:()=>button()};
 const context={window,document,performance:{now:()=>0},setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length},clearTimeout(){},clearInterval(){},setInterval(){return 1},requestAnimationFrame(){},cancelAnimationFrame(){},Math:Object.assign(Object.create(Math),{random:()=>.5})};
 for(const file of ['GardenPractice.js','MiniGames.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
 return {ns,timers,outcomes,spoken,context};
}
function buildFixture(){
 const rt=runtime();
 const part=(id)=>({id,display:id,speak:`name ${id}`});
 const a=part('ب'),b=part('ت'),x=part('ث');
 const target={id:'بت',display:'بت',parts:[a,b]};
 const slots=[button({left:100,top:100,width:72,height:64}),button({left:190,top:100,width:72,height:64})];
 const tiles=[a,b,x].map((p,i)=>{const el=button({left:20+i*72,top:210,width:64,height:64});el.dataset.i=String(i);return el;});
 const scene=button(),finish=button();finish.hidden=true;
 const stage={contains:n=>slots.includes(n)||tiles.includes(n),querySelectorAll(sel){return sel==='.build-slot'?slots:sel==='.build-tile'?tiles:[]},querySelector(sel){return sel==='.build-scene'?scene:sel==='.build-finish'?finish:null}};
 const ctx={items:[target],stage,rounds:1,beginner:true,say:item=>rt.spoken.push(item.id||item.display),reportOutcome:o=>rt.outcomes.push(o),sfx(){},confettiAt(){},onDone(){},reducedMotion:()=>true};
 const game=Object.create(rt.ns.LettersMiniGames.build.prototype);
 Object.assign(game,{ctx,alive:true,ready:false,roundIndex:0,targets:[target],tray:[a,b,x],fixedCount:0,placed:[],slots,dragResets:[],slips:0,stopHint(){}});
 game.markNextSlot();
 tiles.forEach(btn=>{
  btn.addEventListener('click',()=>game.place(btn));
  const reset=rt.ns.GardenPractice.draggable(btn,{enabled:()=>game.alive&&!game.ready&&!btn.disabled&&!btn.classList.contains('is-used'),onDragMove:(px,py)=>game.showReceivingSlot(game.receivingSlot(px,py)),onDragEnd:()=>game.showReceivingSlot(null),drop:(px,py)=>game.receivingSlot(px,py)?game.place(btn):false});
  game.dragResets.push(reset);
 });
 return {...rt,game,slots,tiles,target};
}
const pointer=(id,x,y)=>({pointerId:id,pointerType:'touch',button:0,isPrimary:true,clientX:x,clientY:y});

test('Build receives only the next open slot and marks it until a tile is accepted',()=>{
 const {game,slots}=buildFixture();
 assert.equal(game.receivingSlot(75,100),null,'outside the 24px receive margin');
 assert.equal(game.receivingSlot(80,100),slots[0],'the early 24px margin accepts a young child release');
 assert.equal(game.receivingSlot(200,110),null,'later slots cannot receive out of sequence');
 assert.equal(slots[0].classList.contains('is-next'),true);assert.equal(slots[1].classList.contains('is-next'),false);
 game.placed.push({part:{display:'ب'},slot:slots[0]});game.markNextSlot();
 assert.equal(slots[0].classList.contains('is-next'),false);assert.equal(slots[1].classList.contains('is-next'),true);
 game.ready=true;assert.equal(game.receivingSlot(200,110),null);
});

test('Build accepted drag places once, advances the cue, and synthesized click cannot duplicate it',()=>{
 const {game,tiles,slots,outcomes}=buildFixture(),tile=tiles[0];
 tile.dispatch('pointerdown',pointer(7,30,220));
 tile.dispatch('pointermove',pointer(7,110,110));
 assert.equal(slots[0].classList.contains('is-near'),true,'receiving slot lights before release');
 tile.dispatch('pointerup',pointer(7,110,110));
 assert.equal(game.placed.length,1);assert.equal(game.placed[0].part.display,'ب');
 assert.equal(tile.disabled,true);assert.equal(slots[0].classList.contains('is-near'),false);
 assert.equal(slots[1].classList.contains('is-next'),true);assert.equal(outcomes.length,0,'a partial construction is not an answer');
 let stopped=0;tile.dispatch('click',{preventDefault(){stopped++},stopImmediatePropagation(){stopped++}});
 assert.equal(stopped,2);assert.equal(game.placed.length,1);
});

test('Build cancelled or missed drags clear receiving feedback without placement or answer evidence',()=>{
 for(const ending of ['pointercancel','lostpointercapture','miss']){
  const {game,tiles,slots,outcomes}=buildFixture(),tile=tiles[0];
  tile.dispatch('pointerdown',pointer(9,30,220));tile.dispatch('pointermove',pointer(9,110,110));
  assert.equal(slots[0].classList.contains('is-near'),true);
  if(ending==='miss')tile.dispatch('pointerup',pointer(9,350,350));
  else tile.dispatch(ending,pointer(9,110,110));
  assert.equal(slots[0].classList.contains('is-near'),false,ending);
  assert.equal(game.placed.length,0,ending);assert.equal(game.slips,0,ending);assert.equal(outcomes.length,0,ending);
 }
});

test('Moving Catch fall speed is independent of stars and heat',()=>{
 const speeds=[];
 for(const [level,heat] of [[0,0],[12,8]]){
  const {ns}=runtime(),target={id:'a',display:'a'},el=button();
  const game=Object.create(ns.LettersMiniGames.catch.prototype);
  Object.assign(game,{ctx:{level},roundIndex:0,rounds:[{target,options:[target]}],spawnFlip:false,field:{appendChild(){}},fieldH:500,fallers:[],heat:{value:()=>heat,factor:()=>1+heat*.5}});
  game.spawn();speeds.push(game.fallers[0].speed);
 }
 assert.ok(Math.abs(speeds[0]-.15)<1e-12);assert.equal(speeds[0],speeds[1]);
});

test('Repeated wrong stationary Catch touches report once while feedback timer is pending',()=>{
 const {ns,timers,outcomes}=runtime(),target={id:'a',display:'a'},wrong={id:'b',display:'b'};
 const game=Object.create(ns.LettersMiniGames.catch.prototype),el=button();
 const f={item:wrong,el};let hintCount=0,sfxCount=0;
 Object.assign(game,{alive:true,settling:false,roundIndex:0,rounds:[{target,options:[target,wrong]}],fallers:[f],timers:new Set(),slips:0,heat:{down(){}},ctx:{reducedMotion:()=>false,reportOutcome:o=>outcomes.push(o),showLearningHint(){hintCount++},say(){},sfx(){sfxCount++}}});
 assert.equal(game.catchStationary(f),false);
 assert.equal(game.catchStationary(f),false,'disabled still-fruit ignores a second activation');
 assert.equal(outcomes.length,1);assert.equal(outcomes[0].correct,false);assert.equal(game.slips,1);assert.equal(hintCount,1);assert.equal(sfxCount,1);
 assert.equal(timers.length,1);assert.equal(timers[0].ms,360);
 timers[0].fn();assert.equal(game.fallers.length,0);
 assert.equal(game.catchStationary(f),false,'retired fruit cannot report again');assert.equal(outcomes.length,1);
});
