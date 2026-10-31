const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const plain=v=>JSON.parse(JSON.stringify(v));
function runtime(){
  const window={MiftahGame:{GardenPractice:{}}};
  for(const f of ['WaterGarden.js','GardenAdventure.js','LettersState.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),{window,localStorage:{getItem(){return null;}},Date,Math});
  return window.MiftahGame;
}
const items=['ا','ب','ت'].map(id=>({id,display:id}));
test('adventure save validates bounded project, route and drawing data',()=>{
  const ns=runtime(),S=ns.GardenAdventureState;
  const value=S.normalize({active:{id:'safe',project:'bird',letters:['ب','ب',{},'ت'],step:90,help:['ب','ب']},projects:{bird:{water:{open:[true,1,'x'],away:[],bloomed:[true]},drawing:{letter:'ب',strokes:[{color:'url(evil)',points:[[3,4],[900,-50],[Infinity,4]]}]}}}});
  assert.equal(value.active.step,3);assert.deepEqual(plain(value.active.letters),['ب','ت']);
  assert.deepEqual(plain(value.projects.bird.water.open),[true,false,false]);
  assert.equal(value.projects.bird.drawing.strokes[0].color,'#3a8fc4');
  assert.deepEqual(plain(value.projects.bird.drawing.strokes[0].points),[[3,4],[800,0]]);
  assert.equal(S.normalize({active:{id:'<script>',project:'bird',letters:['ب']}}).active,null);
});
test('one route step advances once; stale callbacks cannot advance a later adventure',()=>{
  const S=runtime().GardenAdventureState;
  const start=S.begin(null,'bird',items,'one');
  const next=S.advance(start,'one',0);
  assert.equal(next.active.step,1);assert.equal(S.advance(next,'one',0),null);
  assert.equal(S.advance(next,'other',1),null);
  assert.equal(S.advance(next,'one',2),null);
  assert.deepEqual(plain(S.begin(next,'butterfly',items,'two')),plain(next),'unfinished route retained');
});
test('starting another project preserves completed places and their channels',()=>{
  const S=runtime().GardenAdventureState;
  let state=S.begin(null,'bird',items,'one');
  for(let i=0;i<3;i++)state=S.advance(state,'one',i);
  state.projects.bird.water.open[2]=true;
  const next=S.begin(state,'butterfly',items,'two');
  assert.equal(next.projects.bird.complete,true);assert.equal(next.projects.bird.water.open[2],true);
  assert.equal(next.active.step,0);assert.equal(next.active.project,'butterfly');
});
test('partial bloom saves retain the childs free-play channels',()=>{
  const ns=runtime();let saved=ns.GardenAdventureState.normalize(null);
  saved.projects.bird.water.open=[true,false,true];saved.projects.bird.water.away=[false,true,false];
  const g={loadJSON:()=>saved,saveJSON:(_,v)=>{saved=plain(v);return true;}};
  new ns.GardenAdventure(g).patchProject('bird',{water:{bloomed:[true,true,false]}});
  assert.deepEqual(saved.projects.bird.water.open,[true,false,true]);
  assert.deepEqual(saved.projects.bird.water.away,[false,true,false]);
  assert.deepEqual(saved.projects.bird.water.bloomed,[true,true,false]);
});
test('completion and repeated callbacks pay only once and stamp only at the finish',()=>{
  const ns=runtime();let saved=ns.GardenAdventureState.begin(null,'bird',items,'one'),paid=[],stamps=0;
  const g={loadJSON:()=>saved,saveJSON:(_,v)=>{saved=plain(v);return true;},payPractice:k=>paid.push(k),stampToday:()=>stamps++};
  const a=new ns.GardenAdventure(g);
  a.complete('one',0,false);a.complete('one',0,false);assert.equal(stamps,0);
  a.complete('one',1,false);a.complete('one',2,false);a.complete('one',2,false);
  assert.deepEqual(paid,['LetterDelivery','GardenPaths','WaterGarden']);assert.equal(stamps,1);
});
test('drawing geometry is bounded and preserves the existing pink and pet inks',()=>{
  const S=runtime().GardenAdventureState;
  const d=S.drawing({letter:'ب',strokes:Array.from({length:100},()=>({color:'hsl(320 62% 54%)',points:Array.from({length:1000},(_,i)=>[i,i])}))});
  assert.ok(d.strokes.length<=60);assert.ok(d.strokes.reduce((n,s)=>n+s.points.length,0)<=1800);
  assert.equal(d.strokes[0].color,'hsl(320 62% 54%)');
});
test('storage normalizer uses additive adventure schema without changing progress',()=>{
  const ns=runtime(),progress={done:['pack-boat'],skipped:false};
  assert.deepEqual(plain(ns.LettersState.normalize('quran-trainer:letters:progress',progress,{})),progress);
  assert.equal(ns.LettersState.normalize('quran-trainer:letters:garden-adventure',{active:null}).version,4);
});
test('all three activities share one session ID and use only currently taught items',()=>{
  const ns=runtime();let saved=ns.GardenAdventureState.begin(null,'bird',items,'session-one'),options=[];
  ns.LettersStrength={skillProfile:()=>({motor:{participation:0}})};
  ns.GardenLearning={support:(_,list)=>list.map(i=>({itemId:i.id,choiceCount:2,allowRecall:false}))};
  ns.LetterDelivery={icon:()=>''};ns.LettersGardenArt={practicePicture:()=>''};ns.LettersArt={icon:()=>''};
  const g={loadJSON:()=>saved,saveJSON:(_,v)=>{saved=plain(v);return true;},knownItems:()=>items.slice(0,2),worlds:{worlds:[{id:'pack-boat'}]},payPractice(){},stampToday(){},startPractice:(kind,back,done,opt)=>options.push({kind,session:g.session,opt})};
  const a=new ns.GardenAdventure(g);
  for(let i=0;i<3;i++){a.start('session-one',i);a.complete('session-one',i,false);}
  assert.deepEqual(options.map(x=>x.opt.learningSessionId),['session-one','session-one','session-one']);
  assert.ok(options.every(x=>x.session.items.every(i=>i.id!=='ت')));
  assert.equal(options[1].opt.context.allowPartial,false);
  assert.ok(options.every(x=>x.opt.context.choiceCount===2));
});
test('one-letter water free play can finish the route without claiming recall',()=>{
  const ns=runtime();let saved=ns.GardenAdventureState.begin(null,'bird',items.slice(0,1),'solo'),done;
  saved.active.step=2;
  ns.LettersStrength={skillProfile:()=>({})};ns.GardenLearning={support:()=>[{choiceCount:2,allowRecall:false}]};
  ns.LetterDelivery={icon:()=>''};ns.LettersGardenArt={practicePicture:()=>''};ns.LettersArt={icon:()=>''};
  const g={loadJSON:()=>saved,saveJSON:(_,v)=>{saved=plain(v);return true;},knownItems:()=>items.slice(0,1),worlds:{worlds:[{id:'pack-boat'}]},payPractice(){},stampToday(){},startPractice:(kind,back,onDone)=>done=onDone};
  const a=new ns.GardenAdventure(g);a.finish=()=>{};a.start('solo',2);done();done();
  assert.equal(saved.active.step,3);assert.equal(saved.projects.bird.complete,true);
});
