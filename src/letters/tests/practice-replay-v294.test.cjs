const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture({fallback=false}={}){
  const nodes=new Map();
  const node=()=>({isConnected:true,dataset:{},classList:{add(){}},querySelector:s=>nodes.get(s)});
  for(const s of ['.practice-replay','.practice-heading','.practice-stage'])nodes.set(s,node());
  const screen=node(),outcomes=[];
  const ns={LettersArt:{icon:()=>''},LettersStrength:{recordOutcome:o=>(outcomes.push(o),true)}};
  const context={window:{MiftahGame:ns},console,performance:{now:()=>100},setTimeout:()=>1,clearTimeout(){}};
  for(const name of ['LettersLearning.js','LettersGame.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context);
  let ctx,replays=0,spoken=0,finishes=0,payments=0,returns=0;
  ns.GardenPractice={WaterGarden:class{constructor(c){ctx=c;if(!fallback)this.replayPrompt=()=>replays++;}}};
  const shell=Object.create(ns.LettersGame.prototype);
  Object.assign(shell,{session:{world:{id:'test'},items:[{id:'ب',display:'ب'}]},progress:{done:[]},worlds:{worlds:[]},sound:{},
    screen:()=>screen,topBar:()=>'',wireTopBar(){},petSVG:()=>'',fitStage(){},keepFocus(){},petLife:()=>null,
    sayForLearning:()=>{spoken++;return Promise.resolve(true);},finishBloom:()=>finishes++,payPractice:()=>{payments++;return true;}});
  shell.startPractice('WaterGarden',()=>returns++);
  return {shell,ctx,screen,outcomes,replay:()=>nodes.get('.practice-replay').onclick(),counts:()=>({replays,spoken,finishes,payments,returns})};
}
test('practice header only dispatches to the live game that owns it',()=>{
  const r=fixture();r.replay();assert.equal(r.counts().replays,1);
  let otherCalls=0;r.shell.game={replayPrompt:()=>otherCalls++};r.replay();assert.equal(otherCalls,0);
  assert.equal(r.counts().replays,1);
});
test('leaving practice disables the old header, even if its handler is retained',()=>{
  const r=fixture();r.screen.isConnected=false;r.replay();assert.equal(r.counts().replays,0);
});
test('finishing practice closes replay and pays once despite repeat input',()=>{
  const r=fixture();r.ctx.done();r.replay();r.ctx.done();
  assert.deepEqual(r.counts(),{replays:0,spoken:0,finishes:1,payments:1,returns:0});
});
test('cancelled practice cannot replay, report learning, or pay a reward',()=>{
  const r=fixture();r.ctx.prompt({id:'ب',display:'ب'});r.ctx.cancel();r.replay();r.ctx.done();
  r.ctx.reportOutcome({itemId:'ب',correct:true,evidence:'independent_listening'});
  assert.equal(r.outcomes.length,0);assert.deepEqual(r.counts(),{replays:0,spoken:0,finishes:0,payments:0,returns:1});
});
test('fallback replay remains gesture-driven and contains failed playback',async()=>{
  const r=fixture({fallback:true});r.ctx.prompt({id:'ب',display:'ب'});r.replay();
  assert.equal(r.counts().spoken,1,'playback starts in the click, before awaiting');
  r.shell.sayForLearning=()=>{throw new Error('unavailable');};assert.doesNotThrow(r.replay);
  r.shell.sayForLearning=()=>Promise.reject(new Error('unavailable'));r.replay();await flush();
  r.ctx.cancel();r.shell.sayForLearning=()=>assert.fail('cancelled header played');r.replay();
});
