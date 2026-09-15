const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function runtime(){
  const spoken=[],timers=new Map();let sequence=0;
  const speechSynthesis={getVoices:()=>[{lang:'ar-SA',name:'Arabic'}],speak:u=>spoken.push(u),cancel(){}};
  const window={MiftahGame:{},speechSynthesis};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../LettersGame.js'),'utf8'),{window,speechSynthesis,
    SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},
    setTimeout:f=>{timers.set(++sequence,f);return sequence;},clearTimeout:id=>timers.delete(id)});
  const game=Object.create(window.MiftahGame.LettersGame.prototype);game.sound={enabled:true,setSpeaking(){}};
  return {game,spoken,timers};
}
test('learning speech confirms completion, not API presence or utterance start',async()=>{
  const {game,spoken,timers}=runtime();let value='pending';
  const result=game.sayForLearning({display:'ب'}).then(v=>value=v);
  await Promise.resolve();assert.equal(value,'pending');
  spoken[0].onstart();await Promise.resolve();assert.equal(value,'pending');
  spoken[0].onend();await result;assert.equal(value,true);assert.equal(timers.size,0);
});
test('replay cancellation, error, mute and timeout resolve learning speech safely',async()=>{
  const {game,spoken,timers}=runtime();
  const first=game.sayForLearning({display:'ب'}),second=game.sayForLearning({display:'ت'});
  assert.equal(await first,false);spoken[0].onend();spoken[1].onerror();assert.equal(await second,false);
  const muted=game.sayForLearning({display:'ث'});game.sound.enabled=false;game.stopSpeech();assert.equal(await muted,false);
  assert.equal(await game.sayForLearning({display:'ج'}),false);
  game.sound.enabled=true;const timeout=game.sayForLearning({display:'ح'});[...timers.values()][0]();assert.equal(await timeout,false);
  spoken.at(-1).onend();assert.equal(timers.size,0);
});
test('rotating daily plans preserve existing activity best keys and checkup skill scores',()=>{
  const {game}=runtime(),paid=[];game.bests={'daily:pop':3};game.skills={identify:{score:2}};
  game.session={daily:true,world:{id:'daily',games:['pop','feed','trace']},plan:[{game:'pop',skill:'letter-name'}],gameIndex:0,starTotal:0};
  game.earnStars=n=>paid.push(n);game.saveJSON=()=>{};game.renderStars=()=>{};
  game.finishGame(0);assert.deepEqual(paid,[]);assert.deepEqual(game.bests,{'daily:pop':3});assert.deepEqual(game.skills,{identify:{score:2}});
});
test('chapter entry passes only actual completed IDs into its distractor supplier',()=>{
  const {game}=runtime(),done=['pack-boat'],calls=[];
  game.progress={done};game.root={style:{setProperty(){}}};game.renderMeet=()=>calls.push('meet');game.startGame=()=>calls.push('play');
  const item={id:'ج',display:'ج'},world={id:'pack-smile',hue:20,meet:[item],items:()=>[item],extraItems:ids=>{assert.equal(ids,done);return [{id:'ب',display:'ب'}];}};
  game.startWorld(world);assert.equal(game.session.items[0],item);assert.deepEqual(calls,['meet']);assert.equal(game.session.extraItems[0].id,'ب');
});
test('long assembly tasks add manual pieces gradually without reading old stars as mastery',()=>{
  const window={MiftahGame:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../LettersLearning.js'),'utf8'),{window});
  const api=window.MiftahGame.LettersLearning,item={id:'long'};
  let correct=0;const ctx={strength:{skillProfile:()=>({motor:{r:correct}})},level:999};
  assert.equal(api.assemblyProfile(item,ctx).pieceBudget,2);
  correct=4;assert.equal(api.assemblyProfile(item,ctx).pieceBudget,3);
  correct=8;assert.equal(api.assemblyProfile(item,ctx).pieceBudget,4);
  correct=12;assert.equal(api.assemblyProfile(item,ctx).pieceBudget,5);
  assert.equal(api.assemblyProfile(item,{...ctx,beginner:true}).pieceBudget,2);
});
