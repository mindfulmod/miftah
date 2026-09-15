const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const STRENGTH_KEY='quran-trainer:letters:strength';
const REVIEW_KEY='quran-trainer:letters:review';
const source=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));

function runtime(seed={}){
  const storage=new Map(Object.entries(seed).map(([key,value])=>[key,typeof value==='string'?value:JSON.stringify(value)]));
  const window={MiftahGame:{}};
  const localStorage={getItem:key=>storage.has(key)?storage.get(key):null,setItem:(key,value)=>storage.set(key,String(value))};
  const context={window,localStorage,performance:{now:()=>0}};
  vm.runInNewContext(source('LettersLearning.js'),context);
  vm.runInNewContext(source('LettersStrength.js'),context);
  return {ns:window.MiftahGame,storage,reload(){return runtime(Object.fromEntries(storage));}};
}

const letter=(id,extra={})=>({id,display:id,...extra});
const fixed=()=>0;
function skillState({matching,matchingStreak=matching,listening,listeningStreak=listening,sessions=[]}={}){
  return {r:99,w:0,streak:99,fast:99,slow:0,last:Date.now(),skills:{'letter-name':{
    ...(matching===undefined?{}:{matching:{r:matching,w:0,streak:matchingStreak,participation:0,last:Date.now(),sessions:[]}}),
    ...(listening===undefined?{}:{listening:{r:listening,w:0,streak:listeningStreak,participation:0,last:Date.now(),sessions}})
  }}};
}

test('fresh play stays at two-choice visible matching and still despite unrelated difficulty inputs',()=>{
  const {ns}=runtime(),target=letter('ب');
  const profile=ns.LettersLearning.profile(target,{activity:'pop',strength:ns.LettersStrength,level:999,stars:999,chapter:999});
  assert.deepEqual(plain({promptMode:profile.promptMode,choiceCount:profile.choiceCount,movement:profile.movement,tier:profile.tier}),{promptMode:'match',choiceCount:2,movement:'still',tier:0});
});

test('a beginner first attempt caps an established skill at match two and still',()=>{
  const target=letter('ب'),r=runtime({[STRENGTH_KEY]:{'ب':skillState({matching:6,listening:12,listeningStreak:8,sessions:['a','b','c']})}});
  const profile=r.ns.LettersLearning.profile(target,{activity:'pop',strength:r.ns.LettersStrength,beginner:true,challenge:true});
  assert.deepEqual(plain({promptMode:profile.promptMode,choiceCount:profile.choiceCount,movement:profile.movement,tier:profile.tier}),{promptMode:'match',choiceCount:4,movement:'still',tier:0});
});

test('three matching successes unlock listen two without movement',()=>{
  const target=letter('ب'),r=runtime({[STRENGTH_KEY]:{'ب':skillState({matching:3,matchingStreak:3})}}),profile=r.ns.LettersLearning.profile(target,{activity:'pop',strength:r.ns.LettersStrength});
  assert.deepEqual(plain({promptMode:profile.promptMode,choiceCount:profile.choiceCount,movement:profile.movement,tier:profile.tier}),{promptMode:'listen',choiceCount:2,movement:'still',tier:1});
});

test('four independent successes across two sessions unlock listen three but remain still',()=>{
  const target=letter('ب'),r=runtime({[STRENGTH_KEY]:{'ب':skillState({matching:3,listening:4,listeningStreak:4,sessions:['visit-a','visit-b']})}}),profile=r.ns.LettersLearning.profile(target,{activity:'pop',strength:r.ns.LettersStrength});
  assert.deepEqual(plain({promptMode:profile.promptMode,choiceCount:profile.choiceCount,movement:profile.movement,tier:profile.tier}),{promptMode:'listen',choiceCount:3,movement:'still',tier:2});
});

test('eight independent successes across three sessions unlock gentle listen three',()=>{
  const target=letter('ب'),r=runtime({[STRENGTH_KEY]:{'ب':skillState({matching:3,listening:8,listeningStreak:8,sessions:['visit-a','visit-b','visit-c']})}}),profile=r.ns.LettersLearning.profile(target,{activity:'pop',strength:r.ns.LettersStrength});
  assert.deepEqual(plain({promptMode:profile.promptMode,choiceCount:profile.choiceCount,movement:profile.movement,tier:profile.tier}),{promptMode:'listen',choiceCount:3,movement:'gentle',tier:3});
});

test('one visit cannot jump the session-gated listening tiers',()=>{
  const target=letter('ب'),r=runtime({[STRENGTH_KEY]:{'ب':skillState({matching:3,listening:20,listeningStreak:20,sessions:['one-visit']})}}),profile=r.ns.LettersLearning.profile(target,{activity:'pop',strength:r.ns.LettersStrength});
  assert.equal(profile.tier,1);assert.equal(profile.choiceCount,2);assert.equal(profile.movement,'still');
});

test('one eligible option is guided matching and every option id is unique',()=>{
  const r=runtime(),only=r.ns.LettersLearning.planRounds({items:[letter('ب')],rounds:2,activity:'pop',strength:r.ns.LettersStrength,random:fixed});
  assert.ok(only.every(round=>round.promptMode==='match'&&round.options.length===1));
  const items=[letter('ب'),letter('ت'),letter('ث')],extras=[letter('ت'),letter('ج'),letter('ج')];
  const rounds=r.ns.LettersLearning.planRounds({items,extraItems:extras,rounds:6,activity:'pop',strength:r.ns.LettersStrength,random:fixed});
  for(const round of rounds){const ids=round.options.map(item=>item.id);assert.equal(new Set(ids).size,ids.length);assert.ok(ids.includes(round.target.id));}
});

test('future-prerequisite extras are filtered from otherwise eligible choices',()=>{
  const r=runtime(),future=letter('خ',{prerequisiteWorldIds:['future-world']}),current=letter('ت',{prerequisiteWorldIds:['current-world']});
  const rounds=r.ns.LettersLearning.planRounds({items:[letter('ب')],extraItems:[future,current,letter('ث')],rounds:4,activity:'pop',worldId:'current-world',completedWorldIds:[],strength:r.ns.LettersStrength,random:fixed});
  assert.ok(rounds.every(round=>round.options.every(option=>option.id!=='خ')));
  assert.ok(rounds.some(round=>round.options.some(option=>option.id==='ت'||option.id==='ث')));
});

test('skill-specific evidence survives reload and drawing does not postpone letter listening',()=>{
  const r=runtime(),strength=r.ns.LettersStrength;
  strength.recordOutcome({itemId:'ب',correct:true,evidence:'independent_listening',skill:'letter-name',activity:'pop',sessionId:'listen-a',affectsStrength:true});
  strength.recordOutcome({itemId:'ب',evidence:'motor_assembly_participation',skill:'drawing',activity:'trace',sessionId:'draw-a',affectsStrength:false});
  const reloaded=r.reload(),letterProfile=reloaded.ns.LettersStrength.skillProfile('ب','letter-name'),drawingProfile=reloaded.ns.LettersStrength.skillProfile('ب','drawing');
  assert.equal(letterProfile.listening.r,1);assert.deepEqual(plain(letterProfile.listening.sessions),['listen-a']);assert.equal(letterProfile.attempts,1);
  assert.equal(drawingProfile.motor.participation,1);assert.equal(drawingProfile.attempts,0);
  const profile=reloaded.ns.LettersLearning.profile(letter('ب'),{activity:'pop',strength:reloaded.ns.LettersStrength});
  assert.equal(profile.promptMode,'match');assert.equal(profile.tier,0);
});

test('wrong selectedId is retained as a skill-specific confusion after reload',()=>{
  const r=runtime();r.ns.LettersStrength.recordOutcome({itemId:'ب',correct:false,evidence:'independent_listening',skill:'letter-name',activity:'pop',selectedId:'ت',choiceIds:['ب','ت'],sessionId:'visit-a',affectsStrength:true});
  const profile=r.reload().ns.LettersStrength.skillProfile('ب','letter-name');
  assert.deepEqual(plain(profile.confusions),{'ت':1});assert.equal(profile.listening.w,1);
});

test('LearningSession accepts the independent-listening evidence enum and persists it',()=>{
  const r=runtime(),session=new r.ns.LettersLearning.LearningSession(r.ns.LettersStrength,()=>10);
  session.beginPrompt(letter('ب'),{skill:'letter-name',activity:'DotGarden'});
  const result=session.report({itemId:'ب',correct:true,evidence:'independent_listening',skill:'letter-name',activity:'DotGarden',selectedId:'ب',choiceIds:['ب','ت']});
  assert.ok(result);assert.equal(result.evidence,'independent_listening');assert.equal(r.ns.LettersStrength.skillProfile('ب','letter-name').listening.r,1);
});

test('new evidence preserves legacy right/wrong fields and mastery behavior',()=>{
  const legacy={r:3,w:1,streak:2,fast:3,slow:0,last:Date.now(),keepsake:7},r=runtime({[STRENGTH_KEY]:{'ب':legacy}}),before=r.ns.LettersStrength.mastery('ب');
  r.ns.LettersStrength.recordOutcome({itemId:'ب',correct:true,evidence:'supported_visible_matching',skill:'letter-name',activity:'pop',affectsStrength:false});
  const stored=JSON.parse(r.storage.get(STRENGTH_KEY))['ب'];
  assert.deepEqual({r:stored.r,w:stored.w,streak:stored.streak,fast:stored.fast,slow:stored.slow,keepsake:stored.keepsake},{r:3,w:1,streak:2,fast:3,slow:0,keepsake:7});
  assert.equal(r.ns.LettersStrength.mastery('ب'),before);
});

test('review planning is read-only while beginReview rotates and persists its cursor',()=>{
  const r=runtime(),pool=['ا','ب','ت','ث','ج'].map(letter),before=plain(Object.fromEntries(r.storage));
  const first=r.ns.LettersStrength.reviewItems(pool,2);assert.deepEqual(plain(Object.fromEntries(r.storage)),before);
  assert.equal(r.ns.LettersStrength.beginReview(first),true);
  const firstIds=plain(first.map(item=>item.id)),savedReview=JSON.parse(r.storage.get(REVIEW_KEY));assert.equal(savedReview.cursor,1);assert.deepEqual(savedReview.recent,firstIds);
  const reloaded=r.reload();assert.equal(reloaded.ns.LettersStrength.review.cursor,1);assert.deepEqual(plain(reloaded.ns.LettersStrength.review.recent),firstIds);
  const second=reloaded.ns.LettersStrength.reviewItems(pool,2);assert.ok(second.every(item=>!first.some(previous=>previous.id===item.id)));
  const snapshot=reloaded.storage.get(REVIEW_KEY);reloaded.ns.LettersStrength.reviewItems(pool,2);assert.equal(reloaded.storage.get(REVIEW_KEY),snapshot);
});
