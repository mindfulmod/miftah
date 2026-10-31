const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classes() {
  const set = new Set();
  return { add: (...xs) => xs.forEach((x) => set.add(x)), remove: (...xs) => xs.forEach((x) => set.delete(x)),
    contains: (x) => set.has(x), toggle: (x, force) => { const on = force === undefined ? !set.has(x) : force; on ? set.add(x) : set.delete(x); return on; } };
}
function el(dataset = {}, rect = { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 }) {
  const listeners = new Map(), attrs = {};
  return { dataset, classList: classes(), style: {}, hidden: false, isConnected: true, innerHTML: '', offsetWidth: 100,
    addEventListener(n, fn) { listeners.set(n, [...(listeners.get(n) || []), fn]); }, dispatch(n, e = {}) { (listeners.get(n) || []).forEach((fn) => fn(e)); if(n==='click')this.onclick?.(e); },
    setAttribute(k, v) { attrs[k] = v; }, getAttribute(k) { return attrs[k]; }, matches() { return false; }, focus() {},
    getBoundingClientRect() { return rect; },
    animate(frames, options) { this.animations ||= []; this.animations.push({frames,options}); return { cancel() {} }; }, querySelector() { return null; }, querySelectorAll() { return []; }, insertAdjacentHTML(_where, html) { this.innerHTML += html; } };
}
function rig({level=0, count=2, reducedMotion=true}={}) {
  const timers=[], reports=[], spoken=[], cues=[], animations=[]; let done=0, game;
  const letters=['ب','ت','ث'];
  const pictures=letters.flatMap((c)=>[1,2].map((n)=>({id:`${c}${n}`,char:c,word:`${c}-word-${n}`,en:`${c} ${n}`})));
  const friends={FRIENDS:Object.fromEntries(letters.map(c=>[c,true])), art:()=>'<svg/>', item:c=>({id:c,display:c}), get:c=>({word:`friend-${c}`,en:c})};
  const ns={LetterFriends:friends, PictureWords:{byChar:c=>pictures.filter(p=>p.char===c),item:p=>p,art:()=>'<svg/>'}, PracticeLearning:{profile:()=>({choiceCount:count}),level:()=>level,orderChars:(_ctx,cs,_skill,n)=>cs.slice(0,n)}};
  const root=el(), slot=el(), dots=el(), finish=el();
  let baskets=[];
  function refreshCards(){
    const found=[...slot.innerHTML.matchAll(/<button type="button" class="bk-card" data-card-slot="(\d+)"[^>]*aria-label="([^"]+)"[^>]*>/g)];
    slot.cards=found.map(m=>{const b=el({cardSlot:m[1]}); b.label=m[2]; if(m[0].includes('is-selected'))b.classList.add('is-selected'); b.setAttribute('aria-pressed',m[0].includes('aria-pressed="true"')?'true':'false'); return b;});
  }
  Object.defineProperty(slot,'innerHTML',{get(){return this._html||'';},set(v){this._html=v;refreshCards();if(game)for(const b of slot.cards)b.model=game.trayCards[Number(b.dataset.cardSlot)];}});
  slot.querySelectorAll=(s)=>s==='.bk-card'?slot.cards||[]:[];
  Object.defineProperty(root,'innerHTML',{get(){return this._html||'';},set(v){this._html=v;
    const count=[...v.matchAll(/class="bk-basket" data-i="(\d+)"/g)].length;
    baskets=Array.from({length:count},(_,i)=>{const b=el({i:String(i)},{left:i*160,top:200,right:i*160+100,bottom:300,width:100,height:100}),inside=el();b.querySelector=s=>s==='.bk-basket-in'?inside:null;return b;});
    finish.hidden=/class="bk-sort-finish" hidden/.test(v);
  }});
  root.querySelector=(s)=>s==='.bk-card-slot'?slot:s==='.bk-dots-slot'?dots:s==='.bk-sort-finish'?finish:null;
  root.querySelectorAll=(s)=>s==='.bk-basket'?baskets:s==='.bk-card'?slot.cards||[]:[];
  const stage={innerHTML:'',get firstElementChild(){return root;}};
  ns.GardenPractice={draggable:(button,opts)=>{button.drag=opts;return ()=>{button.reset=true;};}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','BookGames.js'),'utf8'),{window:{MiftahGame:ns},Math,setTimeout:(fn,ms)=>{const t={fn,ms,cleared:false};timers.push(t);return t;},clearTimeout:t=>{if(t)t.cleared=true;},document:{}},{filename:'BookGames.js'});
  game=new ns.GardenPractice.SoundSort({stage,items:letters.map(display=>({id:display,display})),reducedMotion:()=>reducedMotion,say:x=>{spoken.push(x);return true;},reportOutcome:x=>reports.push(x),done:()=>done++,setupActionCue:o=>{const c={options:o,destroy(){this.destroyed=true;}};cues.push(c);return c;},cancel(){}});
  for(const b of slot.cards)b.model=game.trayCards[Number(b.dataset.cardSlot)];
  function advance(ms=0){const t=timers.find(x=>!x.cleared&&x.ms===ms);assert.ok(t,`expected pending ${ms}ms callback`);t.cleared=true;t.fn();}
  function select(slotIndex){const b=slot.cards.find(x=>Number(x.dataset.cardSlot)===slotIndex);assert.ok(b);b.dispatch('click');return b;}
  function basketIndex(char){return game.baskets.indexOf(char);}
  function dragDrop(cardIndex,basket){const b=slot.cards.find(x=>Number(x.dataset.cardSlot)===cardIndex);const i=baskets.indexOf(basket);return b.drag.drop(i*160+50,250,{left:160,top:200});}
  return {game,ns,slot,baskets,finish,reports,spoken,cues,timers,advance,select,basketIndex,dragDrop,get done(){return done;}};
}

test('SoundSort card selection owns its prompt and wrong-answer assistance',()=>{
  const r=rig(); const {game,slot,reports,baskets}=r;
  const first=game.card, firstSlot=game.selectedSlot, firstCard=slot.cards.find(x=>Number(x.dataset.cardSlot)===firstSlot);
  const second=game.trayCards[1-firstSlot]; r.select(1-firstSlot);
  assert.equal(game.card,second); assert.equal(slot.cards.find(x=>Number(x.dataset.cardSlot)===1-firstSlot).classList.contains('is-selected'),true);
  assert.equal(r.spoken.at(-1),second); assert.equal(game.promptItemKey,second.id);
  const wrong=r.basketIndex(game.baskets.find(c=>c!==second.char)); game.drop(wrong,baskets[wrong]);
  assert.equal(game.cardStates.get(second).missed,true); assert.equal(game.cardStates.get(first).missed,false);
  r.select(firstSlot); assert.equal(game.missed,false); r.select(1-firstSlot); assert.equal(game.missed,true);
  const before=reports.length; game.drop(wrong,baskets[wrong]); assert.equal(reports.length,before,'same wrong basket is reported once per card');
  assert.ok(firstCard); game.destroy();
});

test('SoundSort outside drops do nothing; correct flight refills the used slot and old handlers expire',()=>{
  const r=rig({reducedMotion:false}); const {game,slot,baskets}=r; const used=game.selectedSlot, other=1-used, otherCard=game.trayCards[other], refill=game.queue[0], old=slot.cards.find(x=>Number(x.dataset.cardSlot)===used), untouched=slot.cards.find(x=>Number(x.dataset.cardSlot)===other), stale=old.drag, oldClick=old.onclick;
  assert.equal(stale.drop(500,500,true),false); assert.equal(r.reports.length,0);
  const target=r.basketIndex(game.card.char); assert.equal(stale.drop(target*160+50,250,{left:160,top:200}),true);
  assert.equal(game.busy,true); assert.equal(game.phase,'delivering'); assert.equal(stale.drop(50,50,true),false);
  assert.equal(old.animations.length,1,'a correct drop starts the 420ms picture flight');
  assert.equal(old.animations[0].options.duration,420);
  assert.ok(!JSON.stringify(old.animations[0]).includes("NaN"), "flight coordinates remain finite");
  r.advance(420);
  assert.equal(slot.cards.some(c=>Number(c.dataset.cardSlot)===other),true);
  assert.equal(game.trayCards[other],otherCard,'the untouched slot keeps the same card');
  assert.equal(slot.cards.find(c=>Number(c.dataset.cardSlot)===other).model,untouched.model,'the other rendered picture retains its model');
  assert.equal(game.trayCards[used],refill,'the used slot receives the exact next queued card');
  assert.equal(stale.drop(50,250,{left:160,top:200}),false);oldClick?.();assert.equal(game.card,otherCard,'a detached old click handler is inert');
  game.destroy();
});

test('SoundSort completes by arrivals, remains free play until Finish, and destroy cancels flight arrival',()=>{
  const r=rig(); const {game,slot,baskets}=r; let safety=0;
  while(game.phase==='sorting'&&safety++<20){const chosen=game.card, index=game.selectedSlot, target=r.basketIndex(chosen.char);assert.equal(r.dragDrop(index,baskets[target]),true);r.advance(0);}
  assert.equal(game.phase,'complete'); assert.equal(game.noReplay,true); assert.equal(game.busy,true); assert.equal(r.done,0);
  const reportCount=r.reports.length, spokenBefore=r.spoken.length; baskets[0].dispatch('click'); assert.equal(r.reports.length,reportCount);
  assert.equal(r.spoken.length,spokenBefore+1,'basket click replays the letter during free play');
  r.finish.dispatch('click'); assert.equal(r.done,1); r.finish.dispatch('click'); assert.equal(r.done,1,'Finish click completes exactly once');
  game.destroy();
  const q=rig(), g=q.game, dest=q.baskets[q.basketIndex(g.card.char)];
  const artBefore=dest.querySelector('.bk-basket-in').innerHTML, cheerBefore=q.spoken.length;
  g.drop(q.basketIndex(g.card.char),dest); const reportsBefore=q.reports.length, arrival=q.timers.find(t=>t.ms===0&&!t.cleared);assert.ok(arrival);
  g.destroy(); arrival.fn();
  assert.equal(dest.querySelector('.bk-basket-in').innerHTML,artBefore);assert.equal(q.spoken.length,cheerBefore,'destroyed arrival does not speak');assert.equal(q.reports.length,reportsBefore,'destroyed arrival does not report');assert.equal(q.done,0,'destroyed arrival does not finish');
});

test('SoundSort assistance cue marks only its card assisted and preserves basket counts',()=>{
  const early=rig({level:0}), late=rig({level:2,count:3});
  assert.equal(early.game.baskets.length,2); assert.equal(late.game.baskets.length,3);
  const card=early.game.card; early.cues.at(-1).options.onShow(); assert.equal(early.game.cardStates.get(card).missed,true);
  early.game.selectCard(1-early.game.selectedSlot); assert.equal(early.game.missed,false);
  early.game.selectCard(early.game.trayCards.indexOf(card)); assert.equal(early.game.missed,true);
  early.game.destroy();late.game.destroy();
});

test('a wrong-answer reminder does not speak after its card enters the delivery flight',()=>{
  const r=rig(), g=r.game, wrong=r.basketIndex(g.baskets.find(c=>c!==g.card.char));
  g.drop(wrong,r.baskets[wrong]);
  const reminder=r.timers.find(t=>t.ms===450&&!t.cleared);assert.ok(reminder);
  const correct=r.basketIndex(g.card.char);g.drop(correct,r.baskets[correct]);assert.equal(g.phase,'delivering');
  const before=r.spoken.length;reminder.fn();
  assert.equal(r.spoken.length,before,'the delayed wrong-answer reminder is stale during delivery');
  g.destroy();
});
