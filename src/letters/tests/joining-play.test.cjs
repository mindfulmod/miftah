const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');

function el(cls=''){
 const classes=new Set(cls.split(/\s+/).filter(Boolean)),listeners={};let capture=null,releases=0;
 return {attrs:{},dataset:{},style:{setProperty(){}},disabled:false,hidden:false,innerHTML:'',isConnected:true,getBoundingClientRect(){return {left:0,top:0,width:20,height:20}},
  classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},
  setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){listeners[k]=f},dispatch(k,e={}){listeners[k]?.(e)},click(){this.onclick?.()},focus(){},setPointerCapture(id){capture=id},hasPointerCapture(id){return capture===id},releasePointerCapture(id){if(capture===id){capture=null;releases++}},get releaseCount(){return releases},querySelector(){return el('svg')}};
}
function runtime(reduced=false){
 const timers=[],ns={LettersArt:{icon:()=>'<svg/>',inkShift:()=>({dx:0,dy:0})}};
 const doc={createElement:()=>el()};
 const box={window:{MiftahGame:ns,addEventListener(){},removeEventListener(){}},document:doc,setTimeout:(f,ms)=>{timers.push({f,ms});return timers.length},setInterval:()=>1,clearTimeout(){},clearInterval(){},performance:{now:()=>0}};
 for(const file of ['GardenPractice','MiniGames'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file+'.js'),'utf8'),box);
 return {ns,timers};
}
function stage(){
 let nodes=[],html='';
 return {clientWidth:400,clientHeight:250,getBoundingClientRect(){return {left:0,top:0,width:400,height:250}},classList:el().classList,get html(){return html},set innerHTML(v){html=v;nodes=[];for(const m of v.matchAll(/<([a-z]+)\b([^>]*)>/g)){const attrs=m[2],c=(attrs.match(/class="([^"]+)/)||[])[1]||'';if(!c)continue;const b=el(c);b.hidden=/\bhidden(?:\s|$)/.test(attrs);for(const [,key,value] of attrs.matchAll(/(data-[\w-]+)="([^"]*)"/g))b.dataset[key.slice(5).replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=value;nodes.push(b);}},
  appendChild(n){nodes.push(n)},querySelector(s){return nodes.find(n=>s[0]==='.'&&n.classList.contains(s.slice(1)))||null},
  querySelectorAll(s){const c=s.startsWith('.')?s.slice(1):s;return nodes.filter(n=>n.classList.contains(c))},contains(n){return nodes.includes(n)}};
}
const part=(id,display=id)=>({id,display,speak:`name ${display}`});
function fixture({kind='blend',reduced=false,rounds=1,activity}={}){
 const {ns,timers}=runtime(reduced),s=stage(),outcomes=[],spoken=[],prompts=[],promptOptions=[],rewards=[];let done=0;
 const a=part('b','ب'),v=part('fatha','َ'),target={id:'ba',display:'بَ',speak:'baa',parts:[a,v]};
 const sameFirst={id:'bu',display:'بُ',parts:[a,part('damma','ُ')]},otherFirst={id:'ta',display:'تَ',parts:[part('t','ت'),part('fatha','َ')]};
 const ctx={items:[target,sameFirst,otherFirst],stage:s,extraItems:[],rounds,activity,setPrompt:(...args)=>{prompts.push(args);promptOptions.push(args[1])},say:x=>spoken.push(x),sfx(){},confettiAt(){},reportOutcome:e=>outcomes.push(e),onDone(){done++;},reducedMotion:()=>reduced};
 let game;
 if(kind==='blend'){
  game=Object.create(ns.LettersMiniGames.blend.prototype);Object.assign(game,{ctx,alive:true,roundIndex:0,rounds:Array.from({length:rounds},()=>({target})),slips:0,parts:[{part:a,kind:'letter',x:72,y:46},{part:v,kind:'vowel',x:26,y:46}],scene:s,els:[],stopHint(){}});
 }else{
  const ta=part('t','ت'),third=part('m','م');
  const pair={id:'bt',display:'بت',speak:'بَاءْ، تَاءْ',parts:[a,ta],join2:true};
  game=Object.create(ns.LettersMiniGames.chain.prototype);Object.assign(game,{ctx,alive:true,roundIndex:0,rounds:Array.from({length:rounds},()=>({pair,third})),slips:0,thirds:[{l:third,x:22,y:50}],chain:null,scene:s,base:el('chain-base'),busy:false,stopHint(){}});
 }
 const choice=(i)=>{const b=el();b.dataset.i=String(i);return b};
 if(kind==='blend')game.els=[choice(0),choice(1)];else ctx.stage.contains=()=>true;
 return {game,ctx,s,timers,outcomes,spoken,prompts,promptOptions,rewards,part:a,target,sameFirst,otherFirst,get done(){return done},choices:kind==='blend'?game.els:[choice(0)],kind};
}
function advanceTimers(t){while(t.timers.length)t.timers.shift().f();}

test('Blend success reveals once; exploration replay, split, variants and Next do not add outcomes',()=>{
 const t=fixture();t.game.tryBlend(...t.choices);assert.equal(t.outcomes.length,0);assert.equal(t.timers.length,1);advanceTimers(t);
 assert.equal(t.outcomes.length,1);assert.equal(t.game.ready,true);assert.equal(t.s.querySelector('.join-result')!==null,true);
 const whole=t.s.querySelector('.join-whole'),toggle=t.s.querySelector('.join-toggle');assert.ok(whole);assert.ok(toggle);
 assert.equal(t.s.querySelectorAll('.join-variant').length,2);
 whole.click();whole.click();toggle.click();assert.equal(t.s.querySelector('.join-parts').hidden,false);
 const pieces=t.s.querySelectorAll('.join-piece');assert.equal(pieces.length,2);assert.equal(t.s.querySelector('.join-parts').hidden,false);pieces.forEach(b=>b.click());t.s.querySelector('.join-toggle').click();
 t.s.querySelectorAll('.join-variant').forEach(b=>b.click());
 assert.ok(t.promptOptions.some(o=>o?.promptMode==='explore'&&o?.skill==='joining'));
 assert.equal(t.outcomes.length,1);assert.equal(t.game.roundIndex,0);
 const next=t.s.querySelector('.join-next');assert.ok(next);next.click();next.click();assert.equal(t.done,1);assert.equal(t.outcomes.length,1);
});

test('Blend offers only authored alternatives sharing the first part and caps variants at three',()=>{
 const t=fixture();t.ctx.items.push(...['ب1','ب2','ب3'].map((x,i)=>({id:`alt${i}`,display:x,parts:[t.part,part(`alt-part-${i}`,`v${i}`)]})),{id:'long',display:'بabc',parts:[t.part,part('x'),part('y')]});
 t.game.tryBlend(...t.choices);advanceTimers(t);const variants=t.s.querySelectorAll('.join-variant');assert.equal(variants.length,3);
 assert.deepEqual(Array.from(variants,b=>b.dataset.variant),['0','1','2']);
 assert.match(t.s.html,/Try بَ/);assert.match(t.s.html,/Try بُ/);assert.doesNotMatch(t.s.html,/Try تَ|Try بabc/);
});

test('Blend constructor excludes decoys that duplicate either visible target piece',()=>{
 const {ns}=runtime(),s=stage(),first=part('dad','ض'),targetVowel=part('alif','ا'),otherVowel=part('dad-mark','ض');
 const target={id:'da',display:'ضا',parts:[first,targetVowel]},other={id:'sad-dad',display:'صد',parts:[part('sad','ص'),otherVowel]};
 const game=new ns.LettersMiniGames.blend({items:[target,other],rounds:4,stage:s,setPrompt(){},say(){},sfx(){},confettiAt(){},reportOutcome(){},reducedMotion:()=>true});
 const repeatedTargetRounds=game.rounds.filter(r=>r.target.id==='da');assert.ok(repeatedTargetRounds.length>0);
 for(const round of repeatedTargetRounds)if(round.decoy)assert.ok(![round.target.parts[0].display,round.target.parts[1].display].includes(round.decoy.display));
 game.destroy();
});

test('Chain startRound builds three names and result replay preserves names for whole and parts',()=>{
 const t=fixture({kind:'chain'});t.game.rounds[0].third={id:'m',display:'م',speak:'مِيمْ'};t.game.thirds[0].l=t.game.rounds[0].third;
 t.game.startRound();assert.equal(t.game.chain.speak,'بَاءْ، تَاءْ، مِيمْ');assert.deepEqual(Array.from(t.game.chain.parts,p=>p.display),['بت','م']);
 t.game.scene=t.s;t.game.base=t.s.querySelector('.chain-base');t.timers.length=0;t.game.tryChain(t.choices[0]);assert.equal(t.timers.length,1);advanceTimers(t);
 assert.equal(t.outcomes.length,1);assert.equal(t.game.ready,true);
 t.s.querySelector('.join-whole').click();t.s.querySelector('.join-toggle').click();t.s.querySelectorAll('.join-piece').forEach(b=>b.click());
 assert.ok(t.spoken.some(x=>x?.speak==='بَاءْ، تَاءْ، مِيمْ'));
 assert.ok(t.spoken.some(x=>x?.speak==='بَاءْ، تَاءْ'));
 assert.ok(t.spoken.some(x=>x?.speak==='مِيمْ'));
 assert.ok(t.promptOptions.some(o=>o?.promptMode==='explore'&&o?.skill==='joining'));
 assert.equal(t.outcomes.length,1);t.s.querySelector('.join-next').click();assert.equal(t.done,1);
});

test('Fuse success has no vowel variants',()=>{
 const t=fixture({activity:'fuse'});t.game.tryBlend(...t.choices);advanceTimers(t);
 assert.equal(t.s.querySelectorAll('.join-variant').length,0);assert.equal(t.outcomes.length,1);
});

test('Next advances one round even when the retired result button is clicked again',()=>{
 const t=fixture({rounds:2});let starts=0;t.game.startRound=()=>{starts++};
 t.game.tryBlend(...t.choices);advanceTimers(t);const oldNext=t.s.querySelector('.join-next');oldNext.click();oldNext.click();
 assert.equal(t.game.roundIndex,1);assert.equal(starts,1);assert.equal(t.done,0);assert.equal(t.outcomes.length,1);
});

test('reduced motion reveals joining result immediately and retired callbacks are inert',()=>{
 const t=fixture({reduced:true});t.game.tryBlend(...t.choices);assert.equal(t.timers.length,0);
 assert.equal(t.game.ready,true);assert.equal(t.outcomes.length,1);const old=t.s.querySelector('.join-whole'),next=t.s.querySelector('.join-next');
 t.game.destroy();old?.click();next?.click();assert.equal(t.outcomes.length,1);assert.equal(t.done,0);
});

test('retired split and variant handlers cannot change a rerendered result',()=>{
 const t=fixture();t.game.tryBlend(...t.choices);advanceTimers(t);
 const staleToggle=t.s.querySelector('.join-toggle'),staleVariant=t.s.querySelectorAll('.join-variant')[1];
 staleToggle.click();assert.equal(t.s.querySelector('.join-parts').hidden,false);
 staleToggle.click();staleVariant.click();assert.match(t.s.html,/aria-label="Hear بَ"/);
 assert.equal(t.outcomes.length,1);
});

test('delayed Blend and Chain reveals are inert after destroy',()=>{
 for(const kind of ['blend','chain']){
  const t=fixture({kind});t.game.tryBlend?.(...t.choices);if(kind==='chain')t.game.tryChain(t.choices[0]);
  const pending=t.timers.splice(0);t.game.destroy();pending.forEach(x=>x.f());
  assert.equal(t.outcomes.length,0);assert.equal(t.game.ready,undefined);assert.equal(t.done,0);
 }
});

test('Blend and Chain hit-test pointer drops before entry animation can reclaim the tile',()=>{
 for(const kind of ['blend','chain'])for(const inside of [true,false]){
  const t=fixture({kind}),tile=el(kind==='blend'?'blend-part':'chain-third');tile.dataset.i='0';tile.offsetLeft=30;tile.offsetTop=40;tile.offsetWidth=30;tile.offsetHeight=30;
  let attempts=0;
  if(kind==='blend'){
   t.game.scene=t.s;t.game.els=[tile,el('blend-part')];t.game.parts=[{part:t.part,kind:'letter',x:30,y:40},{part:part('f','َ'),kind:'vowel',x:50,y:40}];
   t.game.hitOther=dragged=>inside&&dragged.classList.contains('is-held')?t.game.els[1]:null;
   t.game.tryBlend=(a,b)=>{assert.equal(a,tile);assert.equal(b,t.game.els[1]);attempts++};t.game.wireDrag(tile);
  }else{
   t.game.base.parentElement=t.s;t.game.thirds=[{l:part('m','م'),x:22,y:50}];
   t.game.hitsBase=dragged=>inside&&dragged.classList.contains('is-held');t.game.tryChain=dragged=>{assert.equal(dragged,tile);attempts++};t.game.wireDrag(tile);
  }
  const pointer={pointerId:7,button:0,isPrimary:true,clientX:30,clientY:40};
  tile.dispatch('pointerdown',pointer);tile.dispatch('pointermove',{...pointer,clientX:70,clientY:75});
  assert.equal(tile.classList.contains('is-held'),true);tile.dispatch('pointerup',{...pointer,clientX:70,clientY:75});
  assert.equal(attempts,inside?1:0,`${kind} inside=${inside}`);assert.equal(tile.hasPointerCapture(7),false);assert.equal(tile.releaseCount,1);
 }
});
