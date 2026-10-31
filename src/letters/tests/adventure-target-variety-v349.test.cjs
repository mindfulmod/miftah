const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const plain=v=>JSON.parse(JSON.stringify(v));
function runtime(extra={}){
  const ns={GardenPractice:{},LettersArt:{icon:()=>'<svg/>'},LetterDelivery:{icon:()=>'<svg/>'},LettersGardenArt:{practicePicture:()=>'<svg/>'},...extra};
  const window={MiftahGame:ns};
  for(const f of ['GardenLearning.js','WaterGarden.js','GardenAdventure.js','LettersState.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),{window,localStorage:{getItem(){return null;}},Date,Math});
  return ns;
}
const letters='ابتثجحخدذرزسشصضطظعغفقكلمنهوي'.split('').map(id=>({id,display:id}));
const strength={skillProfile:()=>({})};

test('eight known novice letters rotate in third place while baseline opener and review stay fixed',()=>{
  const ns=runtime(), L=letters.slice(0,8), chosen=[], visited=new Set(); let state=null;
  for(let n=0;n<8;n++){
    const plan=ns.GardenLearning.plan(strength,L,{now:1,limit:3,recentIds:state?.recentLetters||[]});
    assert.deepEqual(plain(plan.slice(0,2).map(x=>x.id)),['ا','ب']);
    chosen.push(plan[2].id);
    plan.forEach(item=>visited.add(item.id));
    state=ns.GardenAdventureState.begin(state,'bird',plan,`v${n}`);
    for(let step=0;step<3;step++)state=ns.GardenAdventureState.advance(state,`v${n}`,step);
  }
  assert.equal(new Set(chosen).size,6); // Third place reaches every non-anchor letter.
  assert.equal(visited.size,8); // Count all three selected letters per completed visit.
  assert.deepEqual(plain(state.recentLetters.slice(-3)),plain(['ا','ب',chosen.at(-1)]));
});

test('28-item least-recent history cannot starve any eligible letter over 30 completed visits',()=>{
  const ns=runtime(),S=ns.GardenAdventureState,L=letters.slice(0,28);let state={recentLetters:L.slice(0,28).map(x=>x.id)},seen=new Set();
  for(let n=0;n<30;n++){
    const plan=ns.GardenLearning.plan(strength,L,{now:1,recentIds:state.recentLetters});
    plan.forEach(x=>seen.add(x.id));
    state=S.begin(state,'bird',plan,`v${n}`);
    for(let step=0;step<3;step++)state=S.advance(state,`v${n}`,step);
    assert.ok(state.recentLetters.length<=28);
    assert.equal(new Set(state.recentLetters).size,state.recentLetters.length);
  }
  assert.equal(seen.size,28);
});

test('locked and untaught entries never become rotated targets',()=>{
  const ns=runtime(),list=[...letters.slice(0,5),{id:'LOCK',display:'ق',locked:true},{id:'NO',display:'ك',taught:false}];
  for(let n=0;n<8;n++){
    const p=ns.GardenLearning.plan(strength,list,{now:0,recentIds:['ا','ب','ت','ث','ج','ح','خ','د']});
    assert.equal(p.length,3);assert.ok(p.every(x=>!['LOCK','NO'].includes(x.id)));
  }
});

test('one, two, or three known letters retain the established plan',()=>{
  const ns=runtime();
  for(let n=1;n<=3;n++){
    const set=letters.slice(0,n),baseline=ns.GardenLearning.plan(strength,set,{now:0});
    const withHistory=ns.GardenLearning.plan(strength,set,{now:0,recentIds:letters.slice(8).map(x=>x.id)});
    assert.deepEqual(plain(withHistory),plain(baseline));
  }
});

test('no-history and mixed due/known callers preserve baseline first two targets',()=>{
  const ns=runtime(),L=letters.slice(0,8),profile=id=>id==='ت'?{listening:{r:2,w:0,streak:2,last:1}}:{};
  const s={skillProfile:profile},baseline=ns.GardenLearning.plan(s,L,{now:2,limit:3});
  const history=ns.GardenLearning.plan(s,L,{now:2,limit:3,recentIds:['ا','ب','ت','ث']});
  assert.deepEqual(plain(history.slice(0,2)),plain(baseline.slice(0,2)));
  assert.deepEqual(plain(ns.GardenLearning.plan(s,L,{now:2,limit:3})),plain(baseline));
});

test('begin, partial advance, reload, and resume do not consume letter history',()=>{
  const S=runtime().GardenAdventureState,plan=letters.slice(0,3),initial={recentLetters:['ا','ب','ت']};
  const begun=S.begin(initial,'bird',plan,'active');assert.deepEqual(plain(begun.recentLetters),initial.recentLetters);
  const partial=S.advance(begun,'active',0),reloaded=S.normalize(plain(partial));
  assert.deepEqual(plain(reloaded.recentLetters),initial.recentLetters);
  assert.deepEqual(plain(S.begin(reloaded,'butterfly',plan,'ignored')),plain(reloaded));
  assert.deepEqual(plain(S.advance(reloaded,'active',1).recentLetters),initial.recentLetters);
});

test('legacy completion seeds its active letters and invalid history is bounded and unique',()=>{
  const S=runtime().GardenAdventureState;
  const legacy=S.normalize({active:{id:'old',project:'bird',letters:['ا','ب','ا'],step:3}});
  assert.deepEqual(plain(legacy.recentLetters),['ا','ب']);
  const messy=S.normalize({recentLetters:['BAD',...letters.slice(0,28).map(x=>x.id),'ا','ب','ت','غ','too-long-id']});
  assert.ok(messy.recentLetters.length<=28);assert.equal(new Set(messy.recentLetters).size,messy.recentLetters.length);
  assert.ok(!messy.recentLetters.includes('BAD'));assert.ok(!messy.recentLetters.includes('too-long-id'));
  assert.deepEqual(plain(messy.recentLetters.slice(-3)),['ب','ت','غ']);
});

test('failed final save leaves history and reward unchanged until retry commits once',()=>{
  const ns=runtime();let saved=ns.GardenAdventureState.begin(null,'bird',letters.slice(0,3),'final'),fail=true,button,paid=[];
  saved.active.step=2;
  const g={petSVG:()=>'<svg/>',loadJSON:()=>saved,saveJSON:(_,v)=>{if(fail)return false;saved=plain(v);return true;},payPractice:k=>paid.push(k)};
  const a=new ns.GardenAdventure(g);a.render=()=>{};a.shell=()=>({isConnected:true,querySelector:()=>button={disabled:false,focus(){}}});
  assert.equal(a.complete('final',2,false),false);assert.deepEqual(plain(saved.recentLetters),[]);assert.deepEqual(paid,[]);
  fail=false;button.onclick();button.onclick();
  assert.deepEqual(plain(saved.recentLetters),['ا','ب','ت']);assert.deepEqual(paid,['WaterGarden']);
});

test('chooser passes remembered IDs into planning and chosen rotated third target becomes active',()=>{
  const ns=runtime();let saved={recentLetters:['ا','ب','ت']},captured;const button={dataset:{project:'bird'}};
  const realPlan=ns.GardenLearning.plan;
  ns.GardenLearning.plan=(s,items,options)=>{captured=options.recentIds;return realPlan(s,items,{...options,now:0});};
  const g={loadJSON:()=>saved,saveJSON:(_,v)=>{saved=plain(v);return true;},knownItems:()=>letters.slice(0,8),todaysWalk:()=>null,petSVG:()=>'<svg/>',sound:{play(){}},screen:()=>({}),topBar:()=>'',wireTopBar(){},};
  const a=new ns.GardenAdventure(g);a.available=()=>letters.slice(0,8);a.render=()=>{};a.shell=()=>({isConnected:true,querySelectorAll:selector=>selector==='[data-project]'?[button]:[],querySelector:()=>null});
  a.choose();
  assert.deepEqual(plain(captured),['ا','ب','ت']);
  button.onclick();
  assert.deepEqual(plain(saved.active.letters),['ا','ب','ث']);
  assert.deepEqual(plain(saved.recentLetters),['ا','ب','ت']);
});

test('rotated taught letter remains supported as matching with two visible choices',()=>{
  const ns=runtime(),target=letters[7];
  const rows=ns.GardenLearning.support({skillProfile:()=>({})},[target],{beginner:true});
  assert.equal(rows[0].choiceCount,2);assert.equal(rows[0].allowRecall,false);
  assert.equal(rows[0].beginner,true);
});
