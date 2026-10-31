const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const KEY='quran-trainer:letters:strength';
const item={id:'ج',display:'ج'};
function runtime(seed={}){
  let now=10000;
  const storage=new Map([[KEY,JSON.stringify(seed)]]);
  const window={MiftahGame:{}};
  const context={window,performance:{now:()=>now},Date:class extends Date {static now(){return now;}},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))}};
  for(const name of ['LettersLearning','LettersStrength'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',`${name}.js`),'utf8'),context);
  const ns=window.MiftahGame;
  return {ns,storage,tick(){now++;},count:opts=>ns.LettersLearning.matchingProfile(item,opts).pairCount};
}
const seed=(matching,assisted)=>({[item.id]:{r:80,w:0,streak:80,last:1,skills:{'matching-memory':{matching,assisted}}}});

test('matching size follows recent matching success, not lifetime totals alone',()=>{
  for(const [matching,assisted,expected] of [
    [undefined,undefined,2],
    [{r:2,streak:2,last:10},undefined,2],
    [{r:3,streak:2,last:10},undefined,3],
    [{r:80,streak:0,last:10},undefined,2],
    [{r:80,streak:1,last:10},undefined,2],
    [{r:80,streak:8,last:10},{r:1,last:11},2],
    [{r:80,streak:2,last:12},{r:1,last:11},3],
  ]){
    const r=runtime(seed(matching,assisted)),before=r.storage.get(KEY);
    assert.equal(r.count(),expected);
    assert.equal(r.count({beginner:true}),2,'first visits retain support');
    assert.equal(r.storage.get(KEY),before,'policy never rewrites saved progress');
  }
});

test('listening and other skills cannot qualify a larger matching board',()=>{
  const r=runtime({[item.id]:{r:99,streak:99,skills:{
    'letter-name':{matching:{r:99,streak:99,last:20}},
    'matching-memory':{listening:{r:99,streak:99,last:20}},
  }}});
  assert.equal(r.count(),2);
});

test('a real miss and assisted correction restore support; subsequent matching can recover it',()=>{
  const r=runtime(seed({r:3,w:0,streak:3,last:1})),strength=r.ns.LettersStrength;
  const session=new r.ns.LettersLearning.LearningSession(strength,()=>0);
  const attempt=(correct)=>session.report({itemId:item.id,correct,evidence:'supported_visible_matching',affectsStrength:false});
  assert.equal(r.count(),3);
  session.beginPrompt(item,{skill:'matching-memory',activity:'pairs'});
  r.tick();attempt(false);r.tick();attempt(true);
  assert.equal(r.count(),2);
  assert.equal(strength.skillProfile(item.id,'matching-memory').matching.streak,0);
  assert.equal(strength.skillProfile(item.id,'matching-memory').assisted.r,1);
  for(const expected of [2,3]){
    session.beginPrompt(item,{skill:'matching-memory',activity:'pairs'});r.tick();attempt(true);
    assert.equal(r.count(),expected);
  }
  const saved=JSON.parse(r.storage.get(KEY));
  assert.equal(saved[item.id].r,80,'matching cannot rewrite legacy listening/answer totals');
  assert.equal(saved[item.id].skills['matching-memory'].matching.r,5);
  assert.equal(saved[item.id].skills['matching-memory'].matching.w,1);
  assert.equal(runtime(saved).count(),3,'recovered support survives reload');
});
