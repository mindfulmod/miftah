const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

function classes(){const values=new Set();return {add:x=>values.add(x),remove:x=>values.delete(x),toggle:(x,on)=>on?values.add(x):values.delete(x),contains:x=>values.has(x)};}
function el(){return {style:{},classList:classes(),attrs:{},disabled:false,innerHTML:'',setAttribute(k,v){this.attrs[k]=v;},addEventListener(){},querySelector(){return {innerHTML:''};},focus(){}};}
function load(){
  const timers=[];
  const window={MiftahGame:{LettersArt:{icon:name=>`<${name}>`,inkShift:()=>({dx:0,dy:0})}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','GardenPractice.js'),'utf8'),{window,performance:{now:()=>100},setTimeout:fn=>{timers.push(fn);return fn;}});
  return {api:window.MiftahGame.GardenPractice,timers};
}
function recognitionStage(){
  let answers=[];const listen=el(),help=el();
  return {set innerHTML(html){this.html=html;const answerHtml=html.split('<div class="dot-answers">')[1]||'';answers=Array.from(answerHtml.matchAll(/aria-label="([^"]+)" class="practice-button /g),match=>({...el(),label:match[1]}));},get innerHTML(){return this.html;},querySelector(selector){return selector==='.dot-listen'?listen:selector==='.dot-help'?help:null;},querySelectorAll(selector){return selector==='.dot-answers button'?answers:[];},get answers(){return answers;},listen,help};
}

test('repair content defines explicit families, including valid zero-dot targets',()=>{
  const {api}=load();
  assert.deepEqual(Array.from(api.repairFamilies,f=>f.id),['boat','bowl','door','curve','teeth']);
  for(const [letter,above,below] of [['ج',0,1],['ح',0,0],['خ',1,0],['د',0,0],['ذ',1,0],['ر',0,0],['ز',1,0],['س',0,0],['ش',3,0]])assert.equal(api.validDots(letter,above,below),true,letter);
  assert.equal(api.validDots('ا',0,0),false);
  assert.equal(api.validDots('ح',1,0),false);
});

test('repair plans use provided taught items only and stay within six rounds',()=>{
  const {api}=load(),items=['ب','ت','ث','ج','ح','خ','د','ذ'].map(display=>({id:display,display}));
  const plan=api.repairPlan(items),ids=new Set(items.map(x=>x.id));
  assert.ok(plan.length<=6);assert.equal(plan[0].mode,'guided');
  assert.ok(plan.some(round=>round.mode==='repair'));assert.ok(plan.some(round=>round.kind==='recognition'));
  assert.ok(plan.every(round=>ids.has(round.target.id)&&(!round.source||ids.has(round.source.id))));
  const repair=plan.find(round=>round.mode==='repair'),a=api.dotSpec(repair.target.display),b=api.dotSpec(repair.source.display);
  assert.equal(Math.abs(a.above-b.above)+Math.abs(a.below-b.below),1);
});

async function recognition(say,canListen=true){
  const {api,timers}=load(),stage=recognitionStage(),target={id:'kha',display:'خ'},friend={id:'ha',display:'ح'},calls={prompts:[],outcomes:[],correct:0};
  const game=Object.create(api.DotGarden.prototype);
  Object.assign(game,{alive:true,index:0,busy:false,plan:[{kind:'recognition',target,choices:[target,friend]}],ctx:{stage,canListen:()=>canListen,say,prompt:item=>calls.prompts.push(item&&item.id),reportOutcome:o=>calls.outcomes.push(o),correct:()=>calls.correct++}});
  game.show();await Promise.resolve();
  return {game,stage,calls,timers};
}

test('muted or unconfirmed recall remains visibly supported and reports matching evidence',async()=>{
  for(const setup of [{canListen:false,say:()=>{throw Error('must not speak');}},{canListen:true,say:()=>undefined},{canListen:true,say:()=>Promise.resolve(false)}]){
    const r=await recognition(setup.say,setup.canListen),correct=r.stage.answers.find(answer=>answer.label==='خ');
    assert.equal(r.calls.prompts.at(-1),'kha');assert.equal(correct.classList.contains('is-help'),true);
    correct.onclick();
    assert.equal(r.calls.outcomes[0].evidence,'supported_visible_matching');assert.equal(r.calls.outcomes[0].assisted,true);
    assert.equal(r.calls.outcomes[0].skill,'letter-name');
    assert.deepEqual(Array.from(r.calls.outcomes[0].choiceIds).sort(),['ha','kha']);
  }
});

test('recall hides its prompt only after speech confirms playback',async()=>{
  const r=await recognition(()=>Promise.resolve(true));
  assert.deepEqual(r.calls.prompts,[null]);
  r.stage.answers.find(answer=>answer.label==='خ').onclick();
  assert.equal(r.calls.outcomes[0].evidence,'independent_listening');assert.equal(r.calls.outcomes[0].assisted,false);
});

test('pending speech never leaks the visible target and muting reveals it promptly',async()=>{
  let settle;const pending=new Promise(resolve=>{settle=resolve;}),r=await recognition(()=>pending);
  assert.deepEqual(r.calls.prompts,[null]);assert.equal(r.stage.answers.some(answer=>answer.classList.contains('is-help')),false);
  r.game.ctx.canListen=()=>false;r.game.onSoundChange();assert.equal(r.calls.prompts.at(-1),'kha');assert.equal(r.stage.answers.find(answer=>answer.label==='خ').classList.contains('is-help'),true);
  settle(true);await Promise.resolve();r.stage.answers.find(answer=>answer.label==='خ').onclick();assert.equal(r.calls.outcomes[0].evidence,'supported_visible_matching');
});

test('replaying a pending prompt ignores the canceled earlier speech result',async()=>{
  let first,second,count=0;
  const a=new Promise(resolve=>first=resolve),b=new Promise(resolve=>second=resolve);
  const r=await recognition(()=>++count===1?a:b);
  r.stage.listen.onclick();first(false);await Promise.resolve();
  assert.deepEqual(r.calls.prompts,[null]);
  second(true);await Promise.resolve();
  r.stage.answers.find(answer=>answer.label==='خ').onclick();
  assert.equal(r.calls.outcomes[0].evidence,'independent_listening');
});

function pathStage(){
  let captured=null;
  const g={clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}};
  const canvas={getContext:()=>g,getBoundingClientRect:()=>({left:0,top:0,width:800,height:500}),setPointerCapture:id=>captured=id,hasPointerCapture:id=>captured===id,releasePointerCapture:()=>captured=null};
  const nodes={'canvas':canvas,'.path-guide':el(),'.path-next':el(),'.path-continue':el(),'.path-clear':el(),'.path-guide-toggle':el()};
  return {innerHTML:'',querySelector:s=>nodes[s],nodes,canvas};
}

test('Garden Paths caps and rotates taught isolated letters, then reports drawing participation',()=>{
  const {api}=load(),items=['ا','ب','ت','ث','ج'].map(display=>({id:display,display})),outcomes=[];
  const firstStage=pathStage(),ctx={stage:firstStage,items,prompt(){},say(){},correct(){},reportOutcome:o=>outcomes.push(o),done(){}};
  const first=new api.GardenPaths(ctx);assert.deepEqual(Array.from(first.targets,x=>x.id),['ا','ب','ت']);
  assert.deepEqual(Array.from(first.rounds.slice(0,2),round=>round.mode),['guided','partial']);assert.equal(first.rounds[0].target,first.rounds[1].target);
  firstStage.canvas.onpointerdown({pointerId:1,button:0,clientX:10,clientY:10});firstStage.canvas.onpointerup({pointerId:1});firstStage.nodes['.path-next'].onclick();assert.equal(outcomes.length,0);firstStage.nodes['.path-continue'].onclick();
  assert.equal(outcomes[0].evidence,'motor_assembly_participation');assert.equal(outcomes[0].skill,'drawing');assert.equal(outcomes[0].affectsStrength,false);first.destroy();
  const second=new api.GardenPaths({...ctx,stage:pathStage()});assert.deepEqual(Array.from(second.targets,x=>x.id),['ث','ج','ا']);second.destroy();
});
