const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function runtime(){
  const timers=[];const frames=[];
  const window={MiftahGame:{LettersArt:{}},removeEventListener(){}};
  const context={window,setTimeout:f=>timers.push(f),clearInterval(){},requestAnimationFrame:f=>frames.push(f)};
  for(const file of ['MiniGames.js','LettersGardenArt.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
  return {ns:window.MiftahGame,timers,frames};
}
test('garden rewards derive from existing activity bests and old completed saves',()=>{
  const {ns}=runtime(); const g=ns.LettersGardenArt.growth;
  assert.equal(g({done:[]},{}),0);
  assert.equal(g({done:[]},{'pack-boat:pop':1}),1);
  assert.equal(g({done:[]},{'pack-boat:pop':3}),1);
  assert.equal(g({done:[]},{'pack-boat:pop':3,'pack-boat:trace':3,'pack-boat:feed':1}),3);
  assert.equal(g({done:['pack-boat']},{}),3);
  assert.equal(g({done:['pack-smile']},{'pack-smile:pop':3}),0);
});
function successfulTrace(){
  const {ns,timers}=runtime(); const trace=Object.create(ns.LettersMiniGames.trace.prototype);
  let advances=0;
  Object.assign(trace,{alive:true,drawing:true,roundIndex:0,guide:[[0,0]],paint:new Set(['0|0']),clusters:[['0|0']],targets:[{}, {}, {}],ctx:{sfx(){},say(){},confettiAt(){}},startRound(){advances++;}});
  return {trace,timers,advances:()=>advances};
}
test('additional strokes during trace success cannot skip the next letter',()=>{
  const {trace,timers,advances}=successfulTrace();
  trace.penUp(); trace.penDown({}); trace.penUp();
  assert.equal(timers.length,1);
  timers[0](); assert.equal(trace.roundIndex,1); assert.equal(advances(),1);
});
test('leaving a successful trace invalidates the pending advance',()=>{
  const {trace,timers,advances}=successfulTrace(); trace.penUp(); trace.destroy(); timers[0]();
  assert.equal(trace.roundIndex,0); assert.equal(advances(),0);
});
test('a completed activity cannot pay twice if a late callback arrives',()=>{
  const {ns}=runtime(); let paid=0;
  const game=Object.create(ns.LettersMiniGames.feed.prototype);
  Object.assign(game,{alive:false,feeding:false,roundIndex:0,rounds:[{target:{id:'a'}}],ctx:{onDone(){paid++;}}});
  game.offer({id:'a'},{classList:{contains(){return false;}}}); assert.equal(paid,0);
});

test('Boat beginners see two introduced choices; activity mastery gates four',()=>{
  const {ns}=runtime();
  const items=['a','b','t','th'].map(id=>({id,display:id}));
  const ctx={items,extraItems:[{id:'unintroduced'}],rounds:4,garden:true};
  const beginner=ns.LettersRoundBuilder({...ctx,beginner:true,level:3});
  assert.equal(beginner.length,4);
  assert.ok(beginner.every(r=>r.options.length===2 && r.options.every(i=>i.id!=='unintroduced')));
  assert.ok(ns.LettersRoundBuilder({...ctx,level:2}).every(r=>r.options.length===3));
  assert.ok(ns.LettersRoundBuilder({...ctx,level:3}).every(r=>r.options.length===4));
  for(const round of beginner) assert.equal(round.options.filter(i=>i.id===round.target.id).length,1);
});
test('animal render preserves every worn item and keeps renderer calls isolated',()=>{
  const window={MiftahGame:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','LettersAnimalArt.js'),'utf8'),{window});
  const art=window.MiftahGame.LettersAnimalArt;
  for(const id of ['lumi','mina','rafi']){
    for (const accessory of ['cap','taqiyah','bow','glasses','scarf','flower','balloon','crown','wand','cape','medal','kite','sprout','moonpin']) assert.ok(art.render(id,{items:[accessory]}).includes('data-accessory="'+accessory+'"'),id+': '+accessory);
    const dressed=art.render(id,{items:['cap','scarf','glasses'],mood:'open'});
    for(const item of ['cap','scarf','glasses']) assert.ok(dressed.includes('data-accessory="'+item+'"'));
    assert.ok(dressed.includes('data-state="success"'));
    assert.ok(!art.render(id).includes('data-accessory="cap"'));
  }
});

test('celebration and proud legacy faces expose pupils without eyelid masks',()=>{
  const window={MiftahGame:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','LettersArt.js'),'utf8'),{window,document:{createElement(){return {getContext(){return {}}}}}});
  for(const mood of ['open','delighted','proud']) {
    const svg=window.MiftahGame.LettersArt.pet({mood});
    assert.equal((svg.match(/class="art-pupil"/g)||[]).length,2);
    assert.ok(!svg.includes('class="art-lid'));
  }
});
test('loaded-font ink fitting handles tall descenders and wide strings',()=>{
  for(const [left,right,up,down] of [[24,24,25,85],[100,80,50,10],[18,12,15,25]]){
    const ctx={font:'',measureText(){const ratio=parseFloat(this.font)/64;return {actualBoundingBoxLeft:left*ratio,actualBoundingBoxRight:right*ratio,actualBoundingBoxAscent:up*ratio,actualBoundingBoxDescent:down*ratio};}};
    const window={MiftahGame:{}};
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','LettersArt.js'),'utf8'),{window,document:{createElement(){return {getContext(){return ctx;}}}}});
    const attr={};const el={isConnected:true,textContent:'خ',dataset:{fitBox:'125,202,108,62,64'},getAttribute:()=> 'serif',setAttribute:(k,v)=>attr[k]=Number(v)};
    window.MiftahGame.LettersArt.fitGlyphs({querySelectorAll:()=>[el]});const r=attr['font-size']/64;
    assert.ok((left+right)*r<=108.01&&(up+down)*r<=62.01);
    assert.ok(Math.abs(attr.x+(right-left)*r/2-125)<.01);assert.ok(Math.abs(attr.y+(down-up)*r/2-202)<.01);
  }
});

test('garden Pop preserves distinct resting rows with and without reduced motion',()=>{
  for(const reduced of [true,false]){
    const {ns}=runtime();const pop=Object.create(ns.LettersMiniGames.pop.prototype);
    Object.assign(pop,{alive:true,lastTime:0,skyH:300,ctx:{garden:true,reducedMotion:()=>reduced},heat:{factor:()=>1},bubbles:[.18,.58].map(restY=>({restY,y:restY,speed:.1,el:{classList:{contains:()=>false},style:{}}}))});
    pop.tick(16);pop.tick(32);
    assert.equal(pop.bubbles[0].y,.18);assert.equal(pop.bubbles[1].y,.58);
    assert.notEqual(pop.bubbles[0].el.style.transform,pop.bubbles[1].el.style.transform);
  }
});

test('Pop pond follows the activity across chapters and clears when leaving it',()=>{
  const classes=new Map();
  const art={dayPhase:()=> 'day',backdrop:()=>'<world-sky>'};
  const window={MiftahGame:{LettersArt:art,LettersGardenArt:{growth:()=>1,backdrop:()=>'<riverbank>'}}};
  const document={body:{classList:{toggle(){}}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','LettersGame.js'),'utf8'),{window,document});
  const game=Object.create(window.MiftahGame.LettersGame.prototype);
  game.stopSpeech=()=>{};game.root={classList:{toggle:(k,v)=>classes.set(k,v)},dataset:{},querySelector:()=>({})};
  game.progress={done:[]};game.bests={};
  for(const id of ['pack-boat','pack-smile']){
    game.session={world:{id,games:['pop','pairs']},gameIndex:0};
    game.screen('lg-play','');
    assert.equal(classes.get('lg-pond-activity'),true);
    assert.ok(game.root.innerHTML.includes('<riverbank>'));
    game.screen('lg-stars','');assert.equal(classes.get('lg-pond-activity'),true);
    game.session.gameIndex=1;game.screen('lg-play','');assert.equal(classes.get('lg-pond-activity'),false);
    game.screen('lg-home','');assert.equal(classes.get('lg-pond-activity'),false);
  }
});

test('seed delivery targets the basket and locks repeated input until completion',()=>{
  const {ns,timers}=runtime();let paid=0,correct=0;
  const classes={contains(){return false},add(){},remove(){}};
  const node=rect=>({classList:classes,setAttribute(){},getBoundingClientRect:()=>rect});
  const basket=node({left:100,top:100,width:180,height:112});
  const creature=node({left:0,top:0,width:100,height:100});
  const offsets={};const packet={...node({left:100,top:300,width:100,height:100}),style:{setProperty:(k,v)=>offsets[k]=v}};
  const game=Object.create(ns.LettersMiniGames.feed.prototype);
  Object.assign(game,{alive:true,roundIndex:0,rounds:[{target:{id:'a'}}],basket,creatureEl:creature,ctx:{sfx(){correct++},say(){},confettiAt(){},onDone(){paid++}}});
  game.offer({id:'a'},packet);game.offer({id:'a'},packet);
  assert.equal(offsets['--fly-x'],'40px');assert.equal(offsets['--fly-y'],'-196.24px');
  assert.equal(correct,1);assert.equal(timers.length,2);
  timers.forEach(f=>f());game.offer({id:'a'},packet);assert.equal(paid,1);
});

test('Trace maps pointer positions into its actual canvas when the board is scaled',()=>{
 const {ns}=runtime();const trace=Object.create(ns.LettersMiniGames.trace.prototype);
 trace.canvas={width:400,height:300,getBoundingClientRect:()=>({left:20,top:30,width:200,height:150})};
 assert.deepEqual(Array.from(trace.pos({clientX:120,clientY:105})),[200,150]);
});

test('leaving Pairs invalidates its pending final-board completion',()=>{
 const {ns}=runtime();let paid=0;const game=Object.create(ns.LettersMiniGames.pairs.prototype);
 Object.assign(game,{alive:true,boardIndex:1,boards:2,ctx:{onDone(){paid++}}});
 game.destroy();game.nextBoard();assert.equal(paid,0);assert.equal(game.boardIndex,1);
});
test('leaving Build during success prevents speech, reveal and payout',()=>{
 const {ns,timers}=runtime();let effects=0;
 const classes={contains(){return false},add(){},remove(){}};
 const btn={dataset:{i:'0'},classList:classes};const slot={classList:classes};
 const part={display:'a'};const game=Object.create(ns.LettersMiniGames.build.prototype);
 Object.assign(game,{alive:true,targets:[{display:'a',parts:[part]}],roundIndex:0,placed:[],tray:[part],slots:[slot],ctx:{hue:100,say(){effects++},sfx(){},confettiAt(){},stage:{querySelector(){return {}}},onDone(){effects++}}});
 ns.LettersArt.inkShift=()=>({dx:0,dy:0});
 game.place(btn);assert.equal(effects,1);game.destroy();timers.forEach(f=>f());assert.equal(effects,1);assert.equal(game.roundIndex,0);
});
test('leaving Blend prevents a pending merge from revealing or paying',()=>{
 const {ns,timers}=runtime();let paid=0;
 const el=i=>({dataset:{i:String(i)},classList:{add(){}},style:{}});
 const game=Object.create(ns.LettersMiniGames.blend.prototype);
 Object.assign(game,{alive:true,roundIndex:0,rounds:[{target:{parts:[{display:'a'},{display:'b'}]}}],parts:[{kind:'letter',part:{display:'a'}},{kind:'vowel',part:{display:'b'}}],scene:{getBoundingClientRect(){return {}}},ctx:{onDone(){paid++}}});
 game.tryBlend(el(0),el(1));assert.equal(timers.length,2);game.destroy();timers.forEach(f=>f());assert.equal(paid,0);assert.equal(game.roundIndex,0);
});

test('Blend ignores repeated choices during an incorrect-pair retry',()=>{
 const {ns,timers}=runtime();let wrong=0;
 const el=i=>({dataset:{i:String(i)},classList:{add(){},remove(){}},style:{}});
 const game=Object.create(ns.LettersMiniGames.blend.prototype);
 Object.assign(game,{alive:true,slips:0,roundIndex:0,rounds:[{target:{parts:[{display:'a'},{display:'b'}]}}],parts:[{kind:'letter',part:{display:'a'},x:72,y:46},{kind:'vowel',part:{display:'c'},x:26,y:66}],ctx:{sfx(){wrong++},say(){}}});
 const a=el(0),b=el(1);game.tryBlend(a,b);game.tryBlend(a,b);
 assert.equal(wrong,1);assert.equal(game.slips,1);assert.equal(timers.length,1);
 timers[0]();assert.equal(game.retrying,false);
});

test('Unfuse splits only once and exiting cancels delayed quiz and speech',()=>{
 const {ns,timers}=runtime();let effects=0;const game=Object.create(ns.LettersMiniGames.unfuse.prototype);
 Object.assign(game,{alive:true,roundIndex:0,targets:[{parts:[{display:'a'},{display:'b'}]}],ctx:{stage:{querySelector(){return {}}},sfx(){effects++},say(){effects++},confettiAt(){}}});
 game.split();game.split();assert.equal(effects,2);assert.equal(timers.length,2);
 game.destroy();timers.forEach(f=>f());assert.equal(effects,2);
});
test('Chain accepts one addition during success and cannot advance after exit',()=>{
 const {ns,timers}=runtime();const game=Object.create(ns.LettersMiniGames.chain.prototype);
 const el={dataset:{i:'0'},style:{},classList:{contains(){return false},add(){}}};
 Object.assign(game,{alive:true,roundIndex:0,rounds:[{third:{display:'a'}}],thirds:[{l:{display:'a'}}],ctx:{}});
 game.tryChain(el);game.tryChain(el);assert.equal(timers.length,2);
 game.destroy();timers.forEach(f=>f());assert.equal(game.roundIndex,0);
});
test('Parade reveals each form once and cancels pending completion on exit',()=>{
 const {ns,timers}=runtime();ns.LettersArt.inkShift=()=>({dx:0,dy:0});let seeds=0,paid=0;
 const spots=Array.from({length:3},()=>{const form={hidden:true},mystery={hidden:false};return {classList:{add(){}},querySelector:s=>s==='.parade-form'?form:mystery,addEventListener(name,fn){this.click=fn}}});
 const game=Object.create(ns.LettersMiniGames.parade.prototype);
 Object.assign(game,{alive:true,roundIndex:0,letters:[{display:'a'}],formsOf:()=>['a','b','c'],ctx:{say(){},sfx(){seeds++},confettiAt(){},onDone(){paid++},stage:{querySelectorAll:()=>spots,querySelector:()=>({})}}});
 game.startRound();spots.forEach(s=>{s.click();s.click()});assert.equal(seeds,3);assert.equal(timers.length,1);
 game.destroy();timers[0]();assert.equal(paid,0);
});

test('Burst fallback timer does not multiply animation loops and completes once',()=>{
 const {ns,frames}=runtime();let paid=0;const game=Object.create(ns.LettersMiniGames.burst.prototype);
 Object.assign(game,{alive:true,endsAt:30000,duration:30000,count:6,ringEl:{style:{}},ctx:{onDone(){paid++}}});
 game.tick(500,false);game.tick(1000,false);assert.equal(frames.length,0);
 game.tick(1500);assert.equal(frames.length,1);
 game.tick(30000,false);game.tick(30500,false);assert.equal(paid,1);
});
