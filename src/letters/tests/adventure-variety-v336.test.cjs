const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const plain=v=>JSON.parse(JSON.stringify(v));
function runtime(extra={}){
  const ns={GardenPractice:{},LettersArt:{icon:()=>'<svg/>'},LetterDelivery:{icon:()=>'<svg/>'},LettersGardenArt:{practicePicture:()=>'<svg/>'},...extra};
  const window={MiftahGame:ns};
  for(const f of ['WaterGarden.js','GardenAdventure.js','LettersState.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),{window,localStorage:{getItem(){return null;}},Date,Math});
  return ns;
}
const items=['ا','ب','ت'].map((id,i)=>({id,display:id}));
test('completed routes rotate through all choices and revisit the least recent route',()=>{
  const ns=runtime();ns.LetterFriends={FRIENDS:Object.fromEntries(items.map(i=>[i.display,{}]))};const S=ns.GardenAdventureState;let state=null;
  const chosen=[];
  for(let n=0;n<4;n++){
    state=S.begin(state,n%2?'butterfly':'bird',items,`v${n}`);
    chosen.push(state.active.route);
    for(let i=0;i<3;i++)state=S.advance(state,`v${n}`,i);
  }
  assert.deepEqual(chosen,['grow','picnic','pond','grow']);
  assert.deepEqual(plain(state.recentRoutes),['picnic','pond','grow']);
});
test('history keeps only valid recent route ids, is bounded, and legacy completion implies grow',()=>{
  const S=runtime().GardenAdventureState;
  const value=S.normalize({recentRoutes:['pond','bogus','picnic','grow','pond','grow']});
  assert.deepEqual(plain(value.recentRoutes),['grow','pond','grow']);
  assert.deepEqual(plain(S.normalize({projects:{bird:{complete:true}}}).recentRoutes),['grow']);
  assert.deepEqual(plain(S.normalize({active:{id:'old',project:'bird',letters:['ا'],step:3}}).recentRoutes),['grow']);
  assert.equal(S.nextRoute(value,items),'picnic');
});
test('old active saves migrate to grow and unfinished active route stays frozen',()=>{
  const S=runtime().GardenAdventureState;
  const old={active:{id:'old',project:'bird',letters:['ا','ب'],step:1},projects:{bird:{complete:true}}};
  const migrated=S.normalize(old);
  assert.equal(migrated.active.route,'grow');
  assert.deepEqual(plain(migrated.recentRoutes),['grow']);
  assert.deepEqual(plain(S.begin(migrated,'butterfly',items,'new')),plain(migrated));
  assert.equal(S.normalize({active:{id:'persist',project:'bird',route:'pond',letters:['ا'],step:1}}).active.route,'pond');
});
test('unfinished picnic route stays fixed across history changes and cancellation',()=>{
  const S=runtime().GardenAdventureState;
  let state=S.begin({recentRoutes:['grow','pond']},'bird',items,'resume');
  state.active.route='picnic';state.active.step=2;
  state.recentRoutes=['grow','picnic','pond'];
  const reloaded=S.normalize(plain(state));
  assert.equal(reloaded.active.route,'picnic');assert.equal(reloaded.active.step,2);
  assert.deepEqual(plain(S.begin(reloaded,'butterfly',items,'cancelled')),plain(reloaded));
  assert.equal(S.normalize(reloaded).active.route,'picnic');
});
test('single-letter and unsupported friend lists fall back to grow',()=>{
  const ns=runtime();const S=ns.GardenAdventureState;
  ns.LetterFriends={FRIENDS:{}};
  assert.equal(S.nextRoute({recentRoutes:['grow','picnic','pond']},items),'grow');
  ns.LetterFriends.FRIENDS={'ا':{},'ب':{},'ت':{}};
  assert.equal(S.nextRoute({recentRoutes:['grow','picnic','pond']},items.slice(0,1)),'grow');
});
test('guided water completion commits the actual final activity once',()=>{
  const ns=runtime();let saved=ns.GardenAdventureState.begin(null,'bird',items,'final'),options,paid=[],stamps=0;
  saved.active.route='pond';saved.active.step=2;
  ns.LettersStrength={skillProfile:()=>({motor:{participation:0}})};
  ns.GardenLearning={support:()=>[{choiceCount:3,allowRecall:true}]};
  ns.LettersArt={icon:()=>'<svg/>'};
  const g={root:{querySelector:()=>null},loadJSON:()=>saved,saveJSON:(_,v)=>{saved=plain(v);return true;},knownItems:()=>items,worlds:{worlds:[{id:'pack-boat'}]},payPractice:k=>paid.push(k),stampToday:()=>stamps++,startPractice:(kind,back,done,opt)=>options={kind,done,opt}};
  const a=new ns.GardenAdventure(g);a.finish=()=>{};a.start('final',2);
  assert.equal(options.kind,'WaterGarden');assert.equal(typeof options.opt.context.onGuidedDone,'function');
  options.opt.context.onGuidedDone();options.done();options.done();
  assert.equal(saved.active.step,3);assert.deepEqual(plain(saved.recentRoutes),['pond']);
  assert.deepEqual(paid,['WaterGarden']);assert.equal(stamps,1);
});
test('picnic final callback starts Feed and commits its reward and stamp once',()=>{
  const ns=runtime();let saved=ns.GardenAdventureState.begin(null,'bird',items,'feed-final'),options,paid=[],stamps=0;
  saved.active.route='picnic';saved.active.step=2;
  ns.LettersStrength={skillProfile:()=>({motor:{participation:0}})};
  ns.GardenLearning={support:()=>[{choiceCount:3,allowRecall:true}]};
  const g={loadJSON:()=>saved,saveJSON:(_,v)=>{saved=plain(v);return true;},knownItems:()=>items,worlds:{worlds:[{id:'pack-boat'}]},payPractice:k=>paid.push(k),stampToday:()=>stamps++,startPractice:(kind,back,done,opt)=>options={kind,done,opt}};
  const a=new ns.GardenAdventure(g);a.render=()=>{};a.start('feed-final',2);
  assert.equal(options.kind,'Feed');options.done();options.done();
  assert.equal(saved.active.step,3);assert.equal(saved.projects.bird.complete,true);
  assert.deepEqual(plain(saved.recentRoutes),['picnic']);assert.deepEqual(paid,['Feed']);assert.equal(stamps,1);
});
test('activity context is limited to adventure letters and carried help forces gentle support',()=>{
  const ns=runtime();let saved=ns.GardenAdventureState.begin(null,'bird',items,'ctx'),options;
  saved.active.help=['ب'];
  ns.LettersStrength={skillProfile:()=>({motor:{participation:4}})};
  ns.GardenLearning={support:()=>[{choiceCount:4,allowRecall:true}]};
  const g={loadJSON:()=>saved,saveJSON:(_,v)=>{saved=plain(v);return true;},knownItems:()=>[...items,{id:'ث',display:'ث'}],worlds:{worlds:[{id:'pack-boat'}]},payPractice(){},startPractice:(kind,back,done,opt)=>options=opt};
  new ns.GardenAdventure(g).start('ctx',0);
  assert.deepEqual(plain(options.context.known.map(i=>i.id)),['ا','ب','ت']);
  assert.equal(options.context.beginner,true);assert.equal(options.context.allowRecall,false);assert.equal(options.context.choiceCount,2);
  assert.deepEqual(plain(options.context.supportedItemIds),['ب']);
});
test('failed picnic final retries the saved commit without duplicate reward, history, or stamp',()=>{
  const ns=runtime();let saved=ns.GardenAdventureState.begin(null,'bird',items,'picnic'),failing=true,button,paid=[],stamps=0;
  saved.active.route='picnic';saved.active.step=2;
  const g={petSVG:()=>'<svg/>',loadJSON:()=>saved,saveJSON:(_,v)=>{if(failing)return false;saved=plain(v);return true;},payPractice:k=>paid.push(k),stampToday:()=>stamps++};
  const a=new ns.GardenAdventure(g);a.render=()=>{};
  a.shell=()=>({isConnected:true,querySelector:()=>button={disabled:false,focus(){}}});
  assert.equal(a.complete('picnic',2,false),false);
  assert.equal(saved.active.step,2);assert.deepEqual(paid,[]);assert.equal(stamps,0);
  failing=false;button.onclick();button.onclick();
  assert.equal(saved.active.step,3);assert.deepEqual(plain(saved.recentRoutes),['picnic']);
  assert.deepEqual(paid,['Feed']);assert.equal(stamps,1);
});
