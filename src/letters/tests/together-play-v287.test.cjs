const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load() {
  const window={MiftahGame:{PracticeLearning:{plan:(ctx,pool,_kind,count)=>pool.slice(0,count),level:ctx=>ctx.supportLevel||0}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../GardenTogether.js'),'utf8'),{
    window,
    setTimeout(){throw new Error('Garden Together state must not depend on timers');},
    clearTimeout(){throw new Error('Garden Together state must not depend on timers');}
  });
  return window.MiftahGame.GardenPractice.GardenTogether;
}
function el() {
  const classes=new Set();
  return {attrs:{},disabled:false,hidden:false,textContent:'',innerHTML:'',isConnected:true,
    classList:{add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n)),contains:n=>classes.has(n),toggle:(n,on)=>{const enabled=on===undefined?!classes.has(n):!!on;if(enabled)classes.add(n);else classes.delete(n);return enabled;}},
    setAttribute(k,v){this.attrs[k]=String(v);},getAttribute(k){return this.attrs[k];},focus(options){this.focused=true;this.focusOptions=options;},
    insertAdjacentHTML(_where,html){this.inserted=(this.inserted||'')+html;},querySelectorAll(){return[];},getAnimations(){return[];}};
}
function fakeDOM() {
  const stage=el(),root=el(),help=el(),next=el(),basket=el(),tokens=el(),status=el(),
    seats=[el(),el()],pets=[el(),el()],pips=[el(),el()];
  let buttons=[];
  root.querySelectorAll=selector=>{
    if(selector==='.together-card')return buttons;
    if(selector==='.together-seat')return seats;
    if(selector==='.together-pet')return pets;
    if(selector==='.together-picks i')return pips;
    return[];
  };
  root.querySelector=selector=>({'.together-basket':basket,'.together-found':tokens,'.together-next':next,'.together-help':help,'.together-status':status}[selector]||null);
  stage.querySelector=selector=>selector==='.together-picnic'?root:null;
  stage.makeButtons=count=>{buttons=Array.from({length:count},()=>el());return buttons;};
  return{stage,root,help,next,basket,tokens,status,seats,pets,pips,get buttons(){return buttons;}};
}
function setup({rows,beginner=false,supportLevel=0,say,done,reportOutcome,random=()=>0}={}) {
  const dom=fakeDOM(),cancelled=[],prompts=[],voices=[],sounds=[];
  const ctx={stage:dom.stage,items:rows||[
    {id:'b',display:'ب'},{id:'t',display:'ت'},{id:'th',display:'ث'}
  ],beginner,supportLevel,random,cancel:()=>cancelled.push('cancel'),prompt:x=>prompts.push(x),
    say:say||(()=>{}),done:done||(()=>{}),reportOutcome,voice:p=>voices.push(p),sfx:s=>sounds.push(s),reducedMotion:()=>true};
  // The runtime writes its markup before querying the playmat. The stub creates
  // exactly the interactive card nodes represented by that markup.
  const query=dom.stage.querySelector;
  dom.stage.querySelector=selector=>{const root=query(selector);if(root){const match=dom.stage.innerHTML.match(/class="together-card"/g)||[];dom.stage.makeButtons(match.length);}return root;};
  const Lab=load();
  const game=new Lab(ctx);
  game.ctx.reportOutcome=reportOutcome||(()=>assert.fail('Garden Together must never report learning evidence'));
  return{game,dom,cancelled,prompts,voices,sounds,ctx};
}
function pairAt(game,pair) { return game.cards.map((card,index)=>card.pair===pair?index:-1).filter(index=>index>=0); }
function distinctPairIndices(game) { const a=game.cards.findIndex(card=>card.pair===0);const b=game.cards.findIndex(card=>card.pair===1);return[a,b]; }

test('support stays at two guided visible pairs, two hidden pairs, then three hidden pairs',()=>{
  for(const [opts,tier,pairs,visible] of [
    [{beginner:true,supportLevel:2},0,2,true],
    [{supportLevel:1},1,2,false],
    [{supportLevel:2},2,3,false]
  ]){
    const f=setup(opts);
    assert.equal(f.game.tier,tier);assert.equal(f.game.pairs,pairs);assert.equal(f.game.cards.length,pairs*2);
    assert.deepEqual(Array.from(f.game.buttons,button=>button.classList.contains('is-up')),Array(pairs*2).fill(visible));
    assert.equal(f.game.helped,visible);
    f.game.sync();f.game.sync();
    assert.deepEqual(Array.from(f.game.buttons,button=>button.classList.contains('is-up')),Array(pairs*2).fill(visible),'refreshing a turn must not toggle concealed cards');
  }
});

test('eligibility deduplicates taught glyphs, and an insufficient pool cancels without completion',async()=>{
  const Lab=load(), rows=[
    {id:'b',display:'ب'},{id:'b-copy',display:'ب'},{id:'t',display:'ت',taught:false},
    {id:'alif',display:'ا'},{id:'j',display:'ج',prerequisiteWorldIds:['prior']},{id:'j-copy',display:'ج'}
  ];
  assert.deepEqual(Array.from(Lab.poolFor({items:rows,completedWorldIds:[]}),item=>item.id),['b','alif']);
  assert.deepEqual(Array.from(Lab.poolFor({items:rows,completedWorldIds:[],worldId:'prior'}),item=>item.id),['b','alif','j']);
  let completed=0;
  const f=setup({rows:[{id:'b',display:'ب'},{id:'b2',display:'ب'},{id:'t',display:'ت',locked:true}],done:()=>completed++});
  await Promise.resolve();
  assert.equal(f.game.alive,false);assert.deepEqual(f.cancelled,['cancel']);assert.equal(completed,0);
});

test('a mismatch stays visible for compare until Next passes play and focus to the other friend',()=>{
  const f=setup({supportLevel:1}),g=f.game,[a,b]=distinctPairIndices(g);
  g.flip(a,true);
  const nextPick=g.buttons.find((button,i)=>!g.cards[i].matched&&!g.open.includes(i));
  assert.equal(nextPick.focused,true,'keyboard selection moves to the next available card');
  g.flip(b,true);
  assert.equal(g.phase,'compare');assert.deepEqual(Array.from(g.open),[a,b]);assert.equal(g.turn,0);
  assert.equal(g.buttons[a].classList.contains('is-up'),true);assert.equal(g.buttons[b].classList.contains('is-up'),true);
  assert.equal(f.dom.next.disabled,false);assert.equal(f.dom.status.textContent,'Pass to player 2');
  g.advance(true);
  assert.equal(g.phase,'choose');assert.equal(g.turn,1);assert.equal(g.open.length,0);
  assert.equal(g.buttons[a].classList.contains('is-up'),false);assert.equal(g.buttons[b].classList.contains('is-up'),false);
  assert.equal(g.buttons.find(button=>!button.disabled).focused,true);
});

test('duplicate taps cannot choose one card twice, and a match waits for Next to alternate turns',()=>{
  const f=setup({beginner:true}),g=f.game,[a,b]=pairAt(g,0);
  g.flip(a);g.flip(a);assert.deepEqual(Array.from(g.open),[a]);assert.equal(g.found,0);
  g.flip(b);
  assert.equal(g.phase,'compare');assert.equal(g.found,1);assert.equal(g.turn,0);
  assert.equal(g.cards[a].matched,true);assert.equal(g.cards[b].matched,true);
  assert.equal(f.dom.basket.getAttribute('aria-label'),'1 of 2 pairs found together');
  assert.ok(f.dom.tokens.inserted);assert.equal(f.dom.next.disabled,false);
  g.advance();assert.equal(g.turn,1);assert.equal(g.phase,'choose');
});

test('the help reveal persists across Next and can be hidden again without affecting matched cards',()=>{
  const f=setup({supportLevel:1}),g=f.game;
  f.dom.help.onclick();assert.equal(g.helped,true);
  assert.ok(g.buttons.every(button=>button.classList.contains('is-up')));
  const [a,b]=distinctPairIndices(g);g.flip(a);g.flip(b);g.advance();
  assert.equal(g.helped,true);assert.ok(g.buttons.every(button=>button.classList.contains('is-up')));
  f.dom.help.onclick();assert.equal(g.helped,false);
  assert.equal(g.buttons.some((button,i)=>!g.cards[i].matched&&button.classList.contains('is-up')),false);
});

test('finish is explicit and can be claimed only once after all pairs are found',()=>{
  let completed=0;
  const f=setup({beginner:true,done:()=>completed++}),g=f.game;
  for(const pair of [0,1]){const[a,b]=pairAt(g,pair);g.flip(a);g.flip(b);if(pair===0)g.advance();}
  assert.equal(g.phase,'finished');assert.equal(completed,0);assert.equal(f.dom.next.disabled,false);
  assert.equal(f.dom.next.getAttribute('aria-label'),'Finish together');
  g.advance();g.advance();f.dom.next.onclick({detail:0});
  assert.equal(completed,1);assert.equal(g.claimed,true);assert.equal(f.dom.next.disabled,true);
});

test('speech rejection leaves matching state active, and destroy makes remaining callbacks inert',async()=>{
  const f=setup({say:()=>Promise.reject(new Error('speech unavailable'))}),g=f.game;
  const [a]=pairAt(g,0);
  assert.doesNotThrow(()=>g.flip(a));
  await Promise.resolve();
  assert.deepEqual(Array.from(g.open),[a]);assert.equal(g.phase,'choose');
  g.destroy();g.flip(a);g.advance();
  assert.equal(g.open.length,1);assert.equal(g.turn,0);assert.equal(g.alive,false);
});
