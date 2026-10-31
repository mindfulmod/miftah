const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../../..');
async function runtime(){
  const window={MiftahGame:{}},context={window,Date,AbortController,setTimeout,clearTimeout,
    localStorage:{getItem:()=>null,setItem(){}},
    fetch:async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,url),'utf8'))})};
  for(const file of ['src/data/letters.js',...['LettersBoot','LettersWorlds','GardenLearning','LettersLearning','LettersStrength'].map(n=>`src/letters/${n}.js`)])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context);
  const ns=window.MiftahGame,worlds=new ns.LettersWorlds();await worlds.loadWords();return {ns,worlds};
}
test('real daily word review preserves its targets and support while using taught same-band choices',async()=>{
  const {ns,worlds}=await runtime(),done=worlds.worlds.slice(0,worlds.worlds.findIndex(w=>w.id==='words-2')+1);
  const pool=[...new Map(done.flatMap(w=>w.catalogue).map(i=>[`${i.objective}:${i.id}`,i])).values()];
  ns.LettersStrength.review={cursor:pool.findIndex(i=>i.worldId==='words-2'),recent:[]};
  const daily=worlds.dailySession(done.map(w=>w.id));
  const ctx={items:daily.plan[0].items,extraItems:daily.extraItems(),rounds:2,worldId:'daily',completedWorldIds:done.map(w=>w.id),activity:'pop',random:()=>.25};
  const rounds=ns.LettersLearning.planRounds(ctx);
  assert.deepEqual(Array.from(rounds,r=>r.target.display),['إِنَّ','عَن']);
  for(const round of rounds){assert.equal(round.options.length,2);assert.equal(round.promptMode,'match');assert.equal(round.movement,'still');assert.equal(new Set(round.options.map(i=>i.id)).size,2);assert.ok(round.options.every(i=>i.worldId==='words-2'&&i.wordLength===2&&pool.includes(i)));}
  for(const override of [{worldId:'words-2'},{challenge:true}]){
    const unchanged=ns.LettersLearning.planRounds({...ctx,...override});
    assert.ok(unchanged[0].options.some(i=>i.display==='سٍ'),'ordinary/challenge comparison policy is unchanged');
  }
});

test('daily choices prefer the same skill when a same-chapter alternative is unavailable',async()=>{
  const {ns}=await runtime();
  const word={id:'word',display:'مِنْ',objective:'word-reading',worldId:'words-2'},other={id:'longer',display:'كَسَبَ',objective:'word-reading',worldId:'decode'},letter={id:'letter',display:'ب',objective:'letter-name',worldId:'pack-boat'},future={id:'future',display:'قُلْ',objective:'word-reading',worldId:'words-2',taught:false};
  const rounds=ns.LettersLearning.planRounds({items:[word],extraItems:[letter,other,future].map(i=>({...i,prerequisiteWorldIds:[i.worldId]})),completedWorldIds:['words-2','decode','pack-boat'],worldId:'daily',rounds:1,random:()=>.25});
  assert.deepEqual(new Set(rounds[0].options.map(i=>i.id)),new Set(['word','longer']));
  const single=ns.LettersLearning.planRounds({items:[word],extraItems:[future],worldId:'daily',rounds:1,random:()=>.25});
  assert.equal(single[0].options.length,1);assert.equal(single[0].promptMode,'match');
});

test('a mixed daily target list keeps each syllable or letter question in its own taught chapter',async()=>{
  const {ns}=await runtime(),items=[
    {id:'ba',display:'ب',worldId:'boat',objective:'letter-name'},
    {id:'baa',display:'بَ',worldId:'fatha',objective:'syllable'},
    {id:'baa-long',display:'بَا',worldId:'long',objective:'syllable'},
  ],extraItems=[
    {id:'ta',display:'ت',worldId:'boat',objective:'letter-name'},
    {id:'taa',display:'تَ',worldId:'fatha',objective:'syllable'},
    {id:'taa-long',display:'تَا',worldId:'long',objective:'syllable'},
  ].map(i=>({...i,taught:true}));
  const rounds=ns.LettersLearning.planRounds({items,extraItems,worldId:'daily',rounds:3,random:()=>.25});
  assert.equal(new Set(rounds.map(r=>r.target.id)).size,3);
  for(const r of rounds){assert.equal(r.options.length,2);assert.ok(r.options.every(i=>i.worldId===r.target.worldId));}
});

test('letter review retains cross-pack contrasts within the same recognition skill',async()=>{
  const {ns}=await runtime(),target={id:'ba',display:'ب',worldId:'boat',objective:'letter-name'};
  const extraItems=[{id:'ta',display:'ت',worldId:'boat',objective:'letter-name'},
    {id:'noon',display:'ن',worldId:'round',objective:'letter-name'}];
  const round=ns.LettersLearning.planRounds({items:[target],extraItems,worldId:'daily',rounds:1,random:()=>.25})[0];
  assert.deepEqual(new Set(round.options.map(i=>i.id)),new Set(['ba','noon']),'keep the existing early shape contrast rather than force a dot contrast from the same pack');
});
