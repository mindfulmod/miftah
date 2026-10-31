const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = (...files) => files.map(file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8'));

function picnicRuntime(deliveries=[{item:{id:'b',display:'ب'},destination:'basket'},{item:{id:'t',display:'ت'},destination:'friend'}]) {
  const resets = [], motions = [];
  const cls = () => ({ add(){}, remove(){}, toggle(){}, contains(){return false;} });
  class El {
    constructor(selector='') { this.selector=selector; this.children=[]; this.dataset={}; this.classList=cls(); this.style={}; this.attrs={}; this.isConnected=true; this.disabled=false; this.onclick=null; this.innerHTML=''; }
    setAttribute(k,v){this.attrs[k]=v;} focus(){} animate(){const m={cancel(){m.cancelled=true;}};motions.push(m);return m;}
    querySelector(sel){ if(sel==='.fp-finish')return this.finish; if(sel==='.fp-plate')return this.plate; if(sel==='.fp-portrait')return this.portrait; if(sel==='.fp-snack:not(:disabled)')return this.snacks.find(x=>!x.disabled)||null; const m=sel.match(/\.fp-snack\[data-snack="(\d+)"\]/);return m?this.snacks[+m[1]]||null:null; }
    querySelectorAll(sel){if(sel==='.fp-friend')return this.receivers||[];if(sel==='.fp-snack')return this.snacks||[];return [];}
  }
  const stage={innerHTML:'',querySelector(){return root;}}; const root=new El('.feed-picnic');
  const friend=(i)=>{const b=new El('.fp-friend');b.dataset.friend=String(i);b.plate=new El('.fp-plate');b.portrait=new El('.fp-portrait');return b;};
  const snack=(i)=>{const b=new El('.fp-snack');b.dataset.snack=String(i);return b;};
  const snackCount=deliveries.filter(d=>d.destination==='basket').length;
  root.receivers=[friend(0),...deliveries.filter(d=>d.destination==='friend').slice(0,2).map((_,i)=>friend(i+1))];root.snacks=Array.from({length:snackCount},(_,i)=>snack(i));root.finish=new El('.fp-finish');
  const ns={LettersArt:{inkShift:()=>({}),creature:()=>'<svg/>',icon:()=>'<svg/>',fitGlyphs(){}},LettersGardenArt:{seedPacket:()=>'<svg/>'},LetterFriends:{FRIENDS:{'ب':{}},get:()=>({en:'Baa'}),art:()=>'<svg/>'},GardenPractice:{draggable:()=>{const reset=()=>resets.push('reset');return reset;},inside:()=>false}};
  const context={window:{MiftahGame:ns}};vm.runInNewContext(source('FeedPicnic.js')[0],context);
  const calls=[];const ctx={stage,petArt:()=>'<svg/>',onFreePlay:()=>calls.push('free'),reportOutcome:()=>calls.push('outcome'),payPractice:()=>calls.push('pay'),onDone:()=>calls.push('onDone'),say(){},sfx(){},reducedMotion:()=>false};
  const game=new ns.FeedPicnic(ctx,deliveries,()=>calls.push('done'));
  return {game,calls,resets,motions,root};
}

test('picnic shares each basket snack once, accepts any receiver, and pays no outcome',()=>{
  const r=picnicRuntime(),g=r.game;
  assert.equal(g.select(0),true);assert.equal(g.share(0,1),true);
  assert.equal(g.share(0,0),false);assert.equal(g.share(-1,0),false);assert.equal(g.share(1,9),false);
  assert.deepEqual([...g.shared],[0]);assert.equal(g.plates[1][0].display,'ب');
  assert.deepEqual(r.calls,['free']);
});

test('empty picnic can finish exactly once and destroys drag handlers',()=>{
  const r=picnicRuntime([]);r.game.select(0);
  r.game.root.querySelector('.fp-finish').onclick();r.game.root.querySelector('.fp-finish').onclick();
  assert.deepEqual(r.calls,['free','done']);assert.deepEqual(r.resets,[]);
  assert.equal(r.game.active(),false);assert.equal(r.game.select(0),false);
});

test('dead or detached picnic ignores selections and shares',()=>{
  const r=picnicRuntime(),g=r.game;g.root.isConnected=false;
  assert.equal(g.select(0),false);assert.equal(g.share(0,0),false);
  g.root.isConnected=true;g.destroy();assert.equal(g.share(0,0),false);
});

test('reduced motion skips animation and destroy cancels active motion',()=>{
  const r=picnicRuntime();r.game.ctx.reducedMotion=()=>true;r.game.react(0);assert.equal(r.motions.length,0);
  r.game.ctx.reducedMotion=()=>false;r.game.react(0);r.game.destroy();assert.equal(r.motions[0].cancelled,true);
});

test('feed finale hands off only after the final completed delivery; disabled path calls onDone',()=>{
  const ns={LettersArt:{}};vm.runInNewContext(source('MiniGames.js')[0],{window:{MiftahGame:ns},Math,Date,setTimeout,clearTimeout});
  const Proto=ns.LettersMiniGames.feed.prototype, events=[];ns.FeedPicnic=function(){};
  const make=(sharePicnic)=>Object.assign(Object.create(Proto),{alive:true,completionReady:true,roundIndex:0,rounds:[{},{}],slips:2,ctx:{sharePicnic,onDone:n=>events.push(['done',n])},nextBtn:{disabled:false},replayBtn:{disabled:false},tray:{querySelector:()=>null},startRound(){events.push(['round',this.roundIndex]);},openPicnic(){events.push(['picnic',this.roundIndex]);}});
  const enabled=make(true);enabled.continueDelivery();assert.deepEqual(events,[['round',1]]);enabled.completionReady=true;enabled.roundIndex=1;enabled.continueDelivery();assert.deepEqual(events,[['round',1],['picnic',2]]);
  events.length=0;const disabled=make(false);disabled.continueDelivery();disabled.completionReady=true;disabled.roundIndex=1;disabled.destroy=()=>events.push(['destroy']);disabled.continueDelivery();assert.deepEqual(events,[['round',1],['destroy'],['done',2]]);
});

test('finale completion destroys FeedGame and invokes the original onDone once',()=>{
  const ns={LettersArt:{}};vm.runInNewContext(source('MiniGames.js')[0],{window:{MiftahGame:ns},Math,Date,setTimeout,clearTimeout});
  const events=[];class PicnicProbe{constructor(ctx,deliveries,done){this.done=done;events.push(['open',deliveries.length]);}destroy(){events.push(['picnic-destroy']);}}
  ns.FeedPicnic=PicnicProbe;const game=Object.assign(Object.create(ns.LettersMiniGames.feed.prototype),{ctx:{onDone:n=>events.push(['done',n])},deliveries:[{item:{id:'b'},destination:'basket'}],slips:3,alive:true,timers:new Set(),dragResets:[],destroy(){events.push(['game-destroy']);this.alive=false;}});
  game.openPicnic();game.picnic.done();game.picnic.done();assert.deepEqual(events,[['open',1],['game-destroy'],['done',3]]);
});

test('picnic sharing is gated to standalone Feed launches',()=>{
  const letters=source('LettersGame.js')[0];
  assert.match(letters,/sharePicnic:kind==='Feed'&&!onDone&&!options\.context\?\.adventure/);
});

test('feed pantry keeps only basket deliveries, and successful offers record destination before callbacks',()=>{
  const ns={LettersArt:{inkShift:()=>({dx:0,dy:0})},LettersGardenArt:{seedPacket:()=>'<packet/>'}};
  vm.runInNewContext(source('MiniGames.js')[0],{window:{MiftahGame:ns},Math,Date,setTimeout,clearTimeout});
  const game=Object.create(ns.LettersMiniGames.feed.prototype),kept={id:'basket',display:'ب'},fed={id:'friend',display:'ت'};
  const pantry={hidden:false,innerHTML:''},basket={classList:{toggle(_name,on){this.filled=on;}} ,querySelector:()=>pantry};
  Object.assign(game,{ctx:{sharePicnic:true},deliveries:[{item:fed,destination:'friend'},{item:kept,destination:'basket'}],delivered:{innerHTML:''},basket});
  game.renderPantry();assert.equal(pantry.hidden,false);assert.equal(pantry.innerHTML,'<i></i>');assert.equal(game.delivered.innerHTML,'<packet/>');
  const target={id:'correct',display:'ب'},round={target,options:[target],skill:'feed'};
  const food={disabled:false,style:{setProperty(){}},classList:{add(){},remove(){},contains(){return false;}},getBoundingClientRect:()=>({left:0,top:0,width:10,height:10}),setAttribute(){}};
  Object.assign(game,{rounds:[round],roundIndex:0,alive:true,feeding:false,completionReady:false,ctx:{sharePicnic:true,reportOutcome(){},clearLearningHint(){},sfx(){},say(){},reducedMotion:()=>false,confettiAt(){},petReact(){},pet:{cheer(){},inspect(){}}},tray:{contains:()=>true,querySelectorAll:()=>[]},creatureEl:{querySelector:()=>null,classList:{add(){},remove(){}},getBoundingClientRect:()=>({left:0,top:0,width:20,height:20})},scene:{classList:{add(){}}},finishEl:{hidden:true},nextBtn:{disabled:true,focus(){}},replayBtn:{disabled:true},basket:{classList:{remove(){},add(){},toggle(){}},setAttribute(){},getBoundingClientRect:()=>({left:20,top:0,width:10,height:10}),querySelector:()=>pantry},delivered:{innerHTML:''},setDeliveryNear(){},later(){}});
  assert.equal(game.offer(target,food,null,'friend'),true);assert.equal(game.deliveries.at(-1).item,target);assert.equal(game.deliveries.at(-1).destination,'friend');
  const wrong={id:'wrong',display:'ت'};const wrongFood={...food,classList:{...food.classList}};
  assert.equal(game.offer(wrong,wrongFood),false);assert.equal(game.deliveries.some(d=>d.item===wrong),false);
});
