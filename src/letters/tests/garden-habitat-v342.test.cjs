const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

function classes(){const s=new Set();return{add(...x){x.forEach(v=>s.add(v));},remove(...x){x.forEach(v=>s.delete(v));},contains(x){return s.has(x);},toggle(x,on){on??=!s.has(x);on?s.add(x):s.delete(x);return on;}};}
function runtime(){
  const window={MiftahGame:{}};
  for(const f of ['GardenHabitat.js','WaterGarden.js','GardenAdventure.js','LettersState.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),{window,localStorage:{getItem(){return null;}},Date,Math,JSON});
  return window.MiftahGame;
}
function habitat(options={}){
  const ns=runtime(),log={react:0,play:[],animations:0,learning:0,reward:0};
  const visitor={style:{},classList:classes(),querySelector:()=>art,animate(){log.animations++;return flight();},setPointerCapture(){},hasPointerCapture:()=>false};
  const art={getAnimations:()=>[],animate(){log.animations++;return flight();}};
  const effect={style:{},dataset:{},classList:classes(),getAnimations:()=>[],animate(){log.animations++;return flight();}};
  const status={textContent:''};
  const buttons=Array.from({length:3},()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;}}));
  const root={dataset:{},classList:classes(),insertAdjacentHTML(){},querySelectorAll:()=>buttons,querySelector:s=>({'.gh-visitor':visitor,'.gh-response':effect,'.gh-status':status}[s]),getBoundingClientRect:()=>({left:0,top:0,width:560,height:320})};
  visitor.getBoundingClientRect=()=>({left:parseFloat(visitor.style.left||'0')*5.6,top:parseFloat(visitor.style.top||'0')*3.2,width:0,height:0});
  const h=new ns.GardenHabitat({root,project:options.project||'bird',art:'art',reducedMotion:()=>!!options.reduced,react:()=>log.react++,play:x=>log.play.push(x),reportOutcome:()=>log.learning++,onDone:()=>log.learning++,save:()=>log.reward++,pay:()=>log.reward++});
  return{ns,h,log,visitor,art,effect,status,buttons};
}
function flight(){return{cancel(){},onfinish:null};}
test('earned habitat places an ephemeral visitor and a place tap moves it with no learning or reward callbacks',()=>{
  const f=habitat({reduced:true});
  assert.equal(f.h.index,0);assert.match(f.visitor.style.left,/^17\.857/);
  f.buttons[1].onclick();assert.equal(f.h.index,1);assert.equal(f.buttons[1].attrs['aria-pressed'],'true');
  assert.match(f.status.textContent,/sunflower/);assert.deepEqual(f.log.play,['rustle']);assert.equal(f.log.react,1);
  assert.equal(f.log.learning,0);assert.equal(f.log.reward,0);
});
test('visitor click and keyboard-generated click advance the visit',()=>{
  const f=habitat({reduced:true});f.visitor.onclick({detail:1});assert.equal(f.h.index,1);f.visitor.onclick({detail:0});assert.equal(f.h.index,2);
});
test('a drag drop always snaps to the nearest habitat place',()=>{
  const f=habitat({reduced:true});
  f.visitor.onpointerdown({button:0,isPrimary:true,pointerId:7,clientX:100,clientY:140});
  f.visitor.onpointermove({pointerId:7,clientX:500,clientY:246});
  f.visitor.onpointerup({pointerId:7,clientX:500,clientY:246});
  assert.equal(f.h.index,2);assert.equal(f.buttons[2].attrs['aria-pressed'],'true');
});
test('pointer cancellation returns the visitor to its current place and suppresses synthetic click',()=>{
  const f=habitat({reduced:true});f.buttons[1].onclick();
  f.visitor.onpointerdown({button:0,isPrimary:true,pointerId:3,clientX:286,clientY:112});
  f.visitor.onpointermove({pointerId:3,clientX:450,clientY:210});
  f.visitor.onpointercancel({pointerId:3});f.visitor.onclick({detail:1});
  assert.equal(f.h.index,1);assert.equal(f.h.pointer,null);f.visitor.onclick({detail:0});assert.equal(f.h.index,2);
});
test('retargeting invalidates an old flight finish callback',()=>{
  const f=habitat();f.buttons[0].onclick();const old=f.h.flight;f.buttons[1].onclick();const current=f.h.flight;old.onfinish();
  assert.equal(f.h.index,1);assert.equal(f.effect.dataset.effect,undefined);current.onfinish();assert.equal(f.effect.dataset.effect,'seeds');
});
test('destroy makes delayed flight callbacks and all input inert',()=>{
  const f=habitat();f.buttons[0].onclick();const old=f.h.flight,reacts=f.log.react;f.h.destroy();old.onfinish();
  assert.equal(f.buttons[2].onclick,null);assert.equal(f.h.alive,false);assert.equal(f.log.react,reacts);assert.equal(f.visitor.onclick,null);
});
test('reduced motion skips flight, arrival and response animations',()=>{
  const f=habitat({reduced:true});f.buttons[1].onclick();f.buttons[2].onclick();
  assert.equal(f.log.animations,0);
});
test('visit routes earned and unfinished projects correctly',()=>{
  const ns=runtime(),saved=ns.GardenAdventureState.normalize(null);saved.projects.bird.complete=true;
  let rendered=0;const g={loadJSON:()=>saved,knownItems:()=>[{id:'ب',display:'ب'}],worlds:{worlds:[]}};
  const adventure=new ns.GardenAdventure(g);adventure.render=()=>rendered++;let habitatProject=null,waterProject=null;
  adventure.habitat=p=>{habitatProject=p;};adventure.water=p=>{waterProject=p;};
  adventure.visit('bird');adventure.visit('butterfly');
  assert.equal(habitatProject,'bird');assert.equal(waterProject,null);
  rendered=0;saved.projects.bird.complete=false;adventure.visit('bird');assert.equal(habitatProject,'bird');assert.equal(rendered,1,'unfinished project is guarded by render');
});
test('free-play water saves only its project and back returns with another route intact',()=>{
  const ns=runtime(),S=ns.GardenAdventureState;let saved=S.begin(null,'butterfly',[{id:'ب'},{id:'ت'}],'active-other');saved.active.step=1;saved.projects.bird.complete=true;saved.projects.bird.water.open[1]=true;
  const before=JSON.parse(JSON.stringify(saved));let practice,visited=null,paid=0,stamped=0,saves=0;
  const g={loadJSON:()=>saved,saveJSON:(_,v)=>{saves++;saved=JSON.parse(JSON.stringify(v));return true;},payPractice:()=>paid++,stampToday:()=>stamped++,knownItems:()=>[{id:'ب',display:'ب'},{id:'ت',display:'ت'}],worlds:{worlds:[{id:'pack-boat'}]},startPractice:(kind,back,done,opts)=>practice={kind,back,done,opts}};
  const adventure=new ns.GardenAdventure(g);adventure.habitat=p=>{visited=p;};
  adventure.visit('bird');adventure.water('bird');assert.equal(practice.kind,'WaterGarden');assert.equal(practice.opts.context.freePlay,true);
  assert.deepEqual(JSON.parse(JSON.stringify(practice.opts.context.waterState.open)),[false,true,false]);
  practice.opts.context.saveWaterState({open:[true,true,false]});practice.back();assert.equal(visited,'bird');
  assert.deepEqual(saved.projects.bird.water.open,[true,true,false]);assert.deepEqual(saved.projects.butterfly.water,before.projects.butterfly.water);
  assert.equal(saved.active.id,'active-other');assert.equal(saved.active.project,'butterfly');assert.equal(saved.active.step,1);
  const expected=JSON.parse(JSON.stringify(before));expected.projects.bird.water.open=[true,true,false];assert.deepEqual(saved,expected);
  assert.equal(paid,0);assert.equal(stamped,0);assert.equal(saves,1);
  let returned=0;adventure.returnToGarden=()=>returned++;delete ns.GardenHabitat;
  practice.back();assert.equal(returned,1,'missing habitat module retains the original garden return');
});
