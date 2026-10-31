const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const flush=()=>new Promise(resolve=>setImmediate(resolve));

function runtime(){
  const nodes=new Map(),outcomes=[],pending=[];
  const node=()=>({isConnected:true,hidden:false,inert:false,dataset:{},style:{},handlers:{},
    classList:{values:new Set(),add(...names){names.forEach(n=>this.values.add(n));},remove(...names){names.forEach(n=>this.values.delete(n));},contains(n){return this.values.has(n);},toggle(n,on){on??=!this.values.has(n);on?this.values.add(n):this.values.delete(n);}},
    addEventListener(name,fn){this.handlers[name]=fn;},setAttribute(){},querySelector:s=>nodes.get(s),querySelectorAll:()=>[],
    contains:()=>true,replaceChildren(){},append(){}});
  for(const selector of ['.play-stage','.play-bubble','.play-bubble-glyph','.learning-help','.learning-hint','.play-pet'])nodes.set(selector,node());
  const screen=node(),ns={LettersArt:{icon:()=>'',keyMascot:()=>'',fitInlineGlyphs(){}},LettersStrength:{recordOutcome:o=>(outcomes.push(o),true)}};
  const window={MiftahGame:ns,addEventListener(){},removeEventListener(){}};
  const context={window,performance:{now:()=>100},setTimeout:()=>1,clearTimeout(){},console};
  for(const file of ['LettersLearning.js','LettersGame.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
  let ctx;
  ns.LettersMiniGames={pop:class{constructor(value){ctx=value;}}};
  const game=Object.create(ns.LettersGame.prototype);
  Object.assign(game,{session:{world:{id:'test',kind:'letters',hue:140,games:['pop']},items:[{id:'b',display:'ب'}],extraItems:[],gameIndex:0},
    progress:{done:[]},bests:{'test:pop':3},sound:{enabled:true},isBoatAdventure:()=>false,showsRoundProgress:()=>false,
    screen:()=>screen,topBar:()=>'',petSVG:()=>'',wireTopBar(){},canSpeak:()=>true,
    sayForLearning:()=>new Promise((resolve,reject)=>pending.push({resolve,reject})),
    renderMissingItems(){throw new Error('Unexpected missing content');}});
  game.startGame();
  const b={id:'b',display:'ب'},t={id:'t',display:'ت'};
  const present=(item=b)=>{ctx.setPrompt(item,{promptMode:'listen',skill:'letter-name',choiceIds:['b','t'],activity:'pop'});return ctx.say(item);};
  const answer=(item=b)=>ctx.reportOutcome({itemId:item.id,correct:true,evidence:'supported_visible_matching',selectedId:item.id,choiceIds:['b','t']});
  return {game,ctx,screen,nodes,outcomes,pending,b,t,present,answer,
    replay:()=>nodes.get('.play-bubble').handlers.click(),help:()=>nodes.get('.learning-help').onclick()};
}

test('unreplayed confirmed hidden prompts still earn independent listening',async()=>{
  const r=runtime();r.present();r.pending[0].resolve(true);await flush();r.answer();
  assert.equal(r.outcomes[0].evidence,'independent_listening');
  assert.equal(r.outcomes[0].assisted,false);
});

test('Replay reveals support immediately without manufacturing an answer',async()=>{
  const r=runtime();r.present();r.pending[0].resolve(true);await flush();r.replay();
  assert.equal(r.nodes.get('.play-bubble-glyph').hidden,false);
  assert.equal(r.nodes.get('.play-stage').inert,false);
  assert.deepEqual(Array.from(r.ctx.supportedItemIds),['b']);
  assert.equal(r.outcomes.length,0);
  r.pending[1].resolve(true);await flush();r.answer();
  assert.equal(r.outcomes[0].evidence,'assisted_response');
  assert.equal(r.outcomes[0].assisted,true);
});

test('Help retains support before an answer and repeated Replay does not duplicate evidence',async()=>{
  const r=runtime();r.present();r.help();r.replay();
  assert.deepEqual(Array.from(r.ctx.supportedItemIds),['b']);
  assert.equal(r.outcomes.length,0);
  r.pending.forEach(p=>p.resolve(true));await flush();r.answer();r.answer();
  assert.equal(r.outcomes.length,1);
  assert.equal(r.outcomes[0].evidence,'assisted_response');
});

test('a completed letter replay cannot mark the next letter assisted',async()=>{
  const r=runtime();r.present();r.pending[0].resolve(true);await flush();r.answer();r.replay();
  assert.equal(r.ctx.supportedItemIds.length,0);
  r.present(r.t);r.pending[1].resolve(false);await flush();
  assert.equal(r.nodes.get('.play-bubble-glyph').hidden,true,'old failure did not reveal a newer target');
  r.pending[2].resolve(true);await flush();r.answer(r.t);
  assert.equal(r.outcomes[1].evidence,'independent_listening');
});

test('a late original reply cannot replace a newer replay result or its support',async()=>{
  const r=runtime();r.present();r.replay();r.pending[1].resolve(false);await flush();
  r.pending[0].resolve(true);await flush();r.answer();
  assert.equal(r.outcomes[0].evidence,'assisted_response');
  assert.equal(r.nodes.get('.play-bubble-glyph').hidden,false);
});

test('failed, rejected and throwing playback each release supported matching',async()=>{
  for(const mode of ['false','reject','throw']){
    const r=runtime();
    if(mode==='throw')r.game.sayForLearning=()=>{throw new Error('provider');};
    const result=r.present();
    if(mode==='false')r.pending[0].resolve(false);
    if(mode==='reject')r.pending[0].reject(new Error('provider'));
    assert.equal(await result,false);
    assert.equal(r.nodes.get('.play-stage').inert,false);
    assert.equal(r.nodes.get('.play-bubble-glyph').hidden,false);
    assert.deepEqual(Array.from(r.ctx.supportedItemIds),['b']);
    r.answer();assert.equal(r.outcomes[0].evidence,'assisted_response');
  }
});

test('exit prevents stale playback and detached Replay from changing support',async()=>{
  const r=runtime();const result=r.present();r.screen.isConnected=false;r.replay();r.help();
  assert.equal(r.pending.length,1);
  r.pending[0].resolve(false);assert.equal(await result,false);
  assert.equal(r.ctx.supportedItemIds.length,0);
  assert.equal(r.outcomes.length,0);
});
