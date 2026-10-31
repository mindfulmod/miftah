const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function setup(){
  const evidence={};
  const ns={LettersStrength:{skillProfile:(id,skill)=>evidence[id]?.[skill]||{}}};
  const scope=vm.createContext({window:{MiftahGame:ns},Math,Date,Map,Set});
  for(const file of ['LettersLearning.js','GardenLearning.js','PracticeLearning.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),scope);
  return {rules:ns.PracticeLearning,evidence};
}
const item=id=>({id,display:id});
const practiced=(r=3,visits=2,last=100)=>({r,streak:r,last,sessions:Array.from({length:visits},(_,i)=>`visit-${i}`)});
test('optional visual toys add one choice only after successful practice across visits',()=>{
  const {rules,evidence}=setup(),b=item('ب');
  assert.equal(rules.profile({},b,'letter-form').choiceCount,2);
  evidence['ب']={'letter-form':{matching:practiced(20,1)}};
  assert.equal(rules.profile({},b,'letter-form').choiceCount,2);
  evidence['ب']['letter-form'].matching=practiced();
  assert.equal(rules.profile({},b,'letter-form').choiceCount,3);
  assert.equal(rules.profile({},b,'letter-form').promptMode,'match');
  assert.equal(rules.profile({beginner:true},b,'letter-form').choiceCount,2);
});
test('current-visit help holds two choices even if later matching succeeds',()=>{
  const {rules,evidence}=setup(),b=item('ب');
  evidence['ب']={'letter-form':{matching:practiced(12,4,300),assisted:{last:200}}};
  assert.equal(rules.profile({supportedItemIds:['ب']},b,'letter-form').choiceCount,2);
  evidence['ب']['letter-form'].assisted.last=400;
  assert.equal(rules.level({},[b],'letter-form'),0);
});
test('motor and matching achievements cannot grant letter-name recall',()=>{
  const {rules,evidence}=setup(),b=item('ب');
  evidence['ب']={construction:{motor:practiced(20,4)},'letter-form':{matching:practiced(20,4)}};
  assert.equal(rules.profile({},b,'letter-name').promptMode,'match');
  evidence['ب']['letter-name']={matching:practiced()};
  assert.equal(rules.profile({},b,'letter-name').promptMode,'listen');
  assert.equal(rules.profile({canListen:()=>false},b,'letter-name').promptMode,'match');
});
test('mixed puzzles retain support for the least-established target',()=>{
  const {rules,evidence}=setup();
  evidence['ب']={construction:{motor:practiced(9,3)}};
  assert.equal(rules.level({},[item('ب')],'construction'),2);
  assert.equal(rules.level({},[item('ب'),item('ت')],'construction'),0);
  evidence['ت']={construction:{motor:{...practiced(0,4),participation:100}}};
  assert.equal(rules.level({},[item('ت')],'construction'),0);
});
test('toy plans start familiar, include due practice and never resurrect forbidden materials',()=>{
  const {rules,evidence}=setup();
  evidence['ب']={'letter-form':{matching:practiced(3,2,Date.now())}};
  const ctx={random:()=>.5,worldId:'boat',completedWorldIds:['boat']};
  const result=rules.plan(ctx,[item('ت'),item('ب'),{...item('ث'),taught:false},{...item('ج'),prerequisiteWorldIds:['future']}],'letter-form',4);
  assert.deepEqual(Array.from(result,x=>x.id),['ب','ت']);
  assert.deepEqual(Array.from(rules.orderChars({...ctx,known:[{...item('ث'),locked:true}]},['ب','ث','ت'],'letter-form')),['ب','ت']);
});
test('a newer helped answer is due review and cannot be the confident opener',()=>{
  const {rules,evidence}=setup();
  evidence['ب']={'letter-form':{matching:practiced(12,3,100),assisted:{last:200}}};
  evidence['ت']={'letter-form':{matching:practiced(3,2,Date.now())}};
  assert.deepEqual(Array.from(rules.plan({random:()=>.9},[item('ب'),item('ت'),item('ج')],'letter-form',3),x=>x.id),['ت','ب','ج']);
});
test('the hat shop hub offers taught syllables without inventing bare sukūn or shadda',()=>{
  const {rules}=setup();
  const worlds=[{id:'fatha',catalogue:[item('بَ'),item('تَ'),item('ثَ')]},{id:'kasra-damma',catalogue:[item('بُ')]}];
  const ctx={items:[item('ب'),item('ت'),item('بْ'),item('بَدَّ')],known:[],completedWorldIds:['fatha'],worldId:'boat'};
  assert.deepEqual(Array.from(rules.hatItems(ctx,worlds),i=>i.id),['بَ','تَ']);
  assert.deepEqual(Array.from(rules.hatItems({...ctx,completedWorldIds:[]},worlds)),[]);
  assert.deepEqual(Array.from(rules.hatItems({...ctx,items:[item('بِ')],completedWorldIds:[]},worlds),i=>i.id),['بِ']);
});
test('first-sound choices grow from verified listening, not pictures matched after help',()=>{
  const {rules,evidence}=setup(),picture=item('pic:fig');
  evidence[picture.id]={'first-sound':{matching:practiced(20,4),assisted:{...practiced(20,4),last:100}}};
  assert.equal(rules.level({},[picture],'first-sound'),0);
  evidence[picture.id]['first-sound'].listening=practiced(3,2,200);
  assert.equal(rules.level({},[picture],'first-sound'),1);
  assert.equal(rules.level({beginner:true},[picture],'first-sound'),0);
  evidence[picture.id]['first-sound'].assisted.last=300;
  assert.equal(rules.level({},[picture],'first-sound'),0);
});
test('guided beat practice uses its motor history without granting independent listening',()=>{
  const {rules,evidence}=setup(),picture=item('pic:fig');
  evidence[picture.id]={'syllable-beats':{motor:practiced(6,3)}};
  assert.equal(rules.level({},[picture],'syllable-beats'),2);
  assert.equal(rules.level({},[picture],'first-sound'),0);
  assert.equal(rules.level({},[picture],'letter-form'),0);
});
