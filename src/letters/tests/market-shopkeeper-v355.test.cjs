const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classList() {
  const s = new Set();
  return { add: (...xs) => xs.forEach(x => s.add(x)), remove: (...xs) => xs.forEach(x => s.delete(x)),
    contains: x => s.has(x), toggle: (x, force) => { const on = force === undefined ? !s.has(x) : force; on ? s.add(x) : s.delete(x); return on; } };
}
function element(dataset = {}, rect = {left:0,top:0,right:100,bottom:100,width:100,height:100}) {
  const listeners = new Map();
  return { dataset, classList:classList(), style:{setProperty(k,v){this[k]=String(v);}}, hidden:false, isConnected:true,
    offsetWidth:100, addEventListener(n,fn){listeners.set(n,[...(listeners.get(n)||[]),fn]);},
    dispatch(n,event={}){for(const fn of listeners.get(n)||[])fn(event);}, getBoundingClientRect(){return rect;},
    matches(s){return s===':focus-visible'&&this.focusVisible===true;}, focus(){this.focused=true;}, setAttribute(){},
    animate(){const flight={cancelled:false,cancel(){this.cancelled=true;}};(this.flights||=[]).push(flight);return flight;}, querySelector(){return null;}, querySelectorAll(){return [];},
  };
}

function rig({level=1, reduced=false, draggable=true}={}) {
  const timers=[], spoken=[], sfx=[], cues=[], outcomes=[]; let done=0, free=0;
  const chars=['ب','ت','ث'], pictures=chars.flatMap((char,ci)=>Array.from({length:4},(_,j)=>({id:`${char}${j}`,char,en:`picture-${ci}-${j}`})));
  const ns={LetterFriends:{FRIENDS:Object.fromEntries(chars.map(c=>[c,true])),art:()=>'<svg class="lf"/>',look:()=>"plain",get:c=>({call:`call-${c}`})},
    PictureWords:{byChar:c=>pictures.filter(p=>p.char===c),item:p=>p,art:()=>'<svg/>',get:()=>null},
    PracticeLearning:{level:()=>level,orderChars:(_ctx,cs,_skill,n)=>cs.slice(0,n)}, LETTERS_DATA:{packs:[]}};
  const root=element(); let goods=[],places=[],lens,finish,bag,packed=[],more=[];
  function renderRoot(html) {
    goods=[...html.matchAll(/<button type="button" class="bk-good" data-i="(\d+)"/g)].map(m=>element({i:m[1]}, {left:300,top:100,right:400,bottom:200,width:100,height:100}));
    places=[...html.matchAll(/<span class="bk-market-place" data-slot="(\d+)"/g)].map(m=>element({slot:m[1]}, {left:100+Number(m[1])*110,top:300,right:190+Number(m[1])*110,bottom:390,width:90,height:90}));
    lens=html.includes('class="bk-lens"')?element():null; finish=html.includes('class="bk-market-finish"')?element():null;
    bag=html.includes('class="bk-bag"')?element():null;
    if(finish)finish.hidden=/class="bk-market-finish" hidden/.test(html);
    if(lens)lens.hidden=false;
    if(bag)Object.defineProperty(bag,'innerHTML',{configurable:true,get(){return this._html||'';},set(v){this._html=v;
      packed=[...v.matchAll(/<button type="button" class="bk-packed" data-i="(\d+)"/g)].map(m=>element({i:m[1]}));
      more=v.includes('class="bk-bag-more"')?[element()]:[];
      bag.querySelector=s=>s==='.bk-bag-more'?(more[0]||null):s==='.bk-packed'?(packed[0]||null):null;
      bag.querySelectorAll=s=>s==='.bk-packed'?packed:[];
    }});
    root.querySelector=s=>({'.bk-lens':lens,'.bk-market-finish':finish,'.bk-bag':bag}[s]||null);
    root.querySelectorAll=s=>s==='.bk-good'?goods:s==='.bk-market-place'?places:s==='.bk-good.is-hint'?goods.filter(b=>b.classList.contains('is-hint')):[];
  }
  Object.defineProperty(root,'innerHTML',{get(){return this._html||'';},set(v){this._html=v;renderRoot(v);}});
  const stage={innerHTML:'',get firstElementChild(){return root;}};
  if(draggable)ns.GardenPractice={draggable:(b,opts)=>{b.drag=opts;return ()=>{b.resetCalled=true;};}};
  const fixedMath=Object.create(Math);fixedMath.random=()=>0.31;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','BookGames.js'),'utf8'),{window:{MiftahGame:ns},Math:fixedMath,
    setTimeout:(fn,ms)=>{const t={fn,ms,fired:false};timers.push(t);return t;},clearTimeout:t=>{if(t)t.cleared=true;},document:{}},{filename:'BookGames.js'});
  const game=new ns.GardenPractice.BusyMarket({stage,items:chars.map(display=>({display,taught:true})),reducedMotion:()=>reduced,
    say:x=>{spoken.push(x);return true;},sfx:x=>sfx.push(x),reportOutcome:x=>outcomes.push(x),done:()=>done++,onFreePlay:()=>free++,setupActionCue:o=>{const c={options:o,destroy(){this.destroyed=true;}};cues.push(c);return c;},cancel(){}});
  function fire(ms) { const t=timers.find(x=>!x.fired&&!x.cleared&&x.ms===ms);assert.ok(t,`pending ${ms}ms callback`);t.fired=true;t.fn();return t; }
  function tapGood(i) { const b=goods[i];assert.ok(b);b.dispatch('click');return b; }
  function collectLens() { const c=game.lenses[game.lens]; const ids=game.goods.map((p,i)=>p.char===c&&!game.found.has(p.id)?i:-1).filter(i=>i>=0);
    for(const i of ids){tapGood(i);fire(reduced?0:320);}return ids; }
  function enterExploring() { let guard=0;while(game.phase==='finding'&&guard++<8){collectLens();if(game.phase==='finding'&&game.lenses.some(c=>game.left(c)))game.nextLens(true);}
    let timerGuard=0;while(game.phase==='finding'&&timerGuard++<12&&timers.some(t=>!t.fired&&!t.cleared&&t.ms===1400))fire(1400);
    if(game.phase==='finding'&&game.pending.size)while(game.pending.size)fire(reduced?0:320); assert.equal(game.phase,'exploring'); }
  return {game,root,timers,spoken,sfx,cues,outcomes,goods:()=>goods,places:()=>places,bag:()=>bag,packed:()=>packed,more:()=>more,fire,tapGood,collectLens,enterExploring,
    get done(){return done;},get free(){return free;},get lens(){return lens;},get finish(){return finish;}};
}

test('market is capped at six pictures for new learners and twelve for experienced learners',()=>{
  const a=rig({level:0}),b=rig({level:2});assert.equal(a.game.goods.length,6);assert.equal(a.game.lenses.length,3);assert.equal(b.game.goods.length,12);assert.equal(b.game.lenses.length,3);a.game.destroy();b.game.destroy();
});

test('finding taps collect a matching picture and replaying it has no learning outcome',()=>{
  const r=rig();const i=r.game.goods.findIndex(p=>p.char===r.game.lenses[r.game.lens]);const button=r.tapGood(i);assert.equal(r.game.found.size,1);assert.equal(r.game.packed.size,1);
  const voice=r.spoken.length, found=r.game.found.size, packed=r.game.packed.size;button.dispatch('click');assert.equal(r.game.found.size,found);assert.equal(r.game.packed.size,packed);assert.equal(r.spoken.length,voice);
  r.fire(320);const packedButton=r.packed()[0];assert.ok(packedButton);packedButton.dispatch('click');assert.equal(r.spoken.length,voice+1);assert.equal(r.spoken.at(-1).id,r.game.goods[i].id);
  assert.equal(r.outcomes.length,0);r.game.destroy();
});

test('all found pictures remain in free play until Finish, which completes once',()=>{
  const r=rig();r.enterExploring();assert.equal(r.free,1);assert.equal(r.game.phase,'exploring');assert.equal(r.done,0);r.finish.dispatch('click');r.finish.dispatch('click');assert.equal(r.game.phase,'finished');assert.equal(r.done,1);r.game.destroy();
});

test('bag pages show three pictures and More advances to the next page',()=>{
  const r=rig({level:2});r.enterExploring();assert.equal(r.packed().length,3);assert.equal(r.more().length,1);const first=r.packed().map(b=>b.dataset.i);r.more()[0].dispatch('click');assert.equal(r.game.bagPage,1);assert.equal(r.packed().length,3);assert.ok(r.packed().every(b=>!first.includes(b.dataset.i)));for(let page=0;page<3;page++)r.more()[0].dispatch('click');assert.equal(r.game.bagPage,0);assert.deepEqual(r.packed().map(b=>b.dataset.i),first);r.game.destroy();
});

test('packed pictures restock only into a valid empty slot and a drag swaps stock once',()=>{
  const r=rig();r.enterExploring();const source=r.packed()[0], i=Number(source.dataset.i), empty=r.game.stock.indexOf(null);assert.ok(empty>=0);
  assert.equal(source.drag.drop(999,999),false);assert.equal(source.drag.drop(100+empty*110+45,345),true);assert.equal(r.game.packed.has(r.game.goods[i].id),false);assert.equal(r.game.stock[empty],r.game.goods[i].id);
  assert.equal(source.drag.drop(100+empty*110+45,345),false);const occupied=empty;assert.ok(r.game.stock[occupied]);const packed=r.packed()[0];assert.equal(packed.drag.drop(100+occupied*110+45,345),false);r.game.destroy();
});

test('tap restocks the first empty slot; shelf click and drag repack without changing found pictures',()=>{
  const r=rig();r.enterExploring();const initialFound=new Set(r.game.found), first=r.packed()[0], i=Number(first.dataset.i), empty=r.game.stock.indexOf(null);
  first.dispatch('click');assert.equal(r.game.stock[empty],r.game.goods[i].id);assert.equal(r.game.packed.has(r.game.goods[i].id),false);
  const shelf=r.goods().find(b=>Number(b.dataset.i)===i);assert.equal(shelf.drag.drop(50,50),true);assert.equal(r.game.packed.has(r.game.goods[i].id),true);r.fire(320);
  let packedAgain=r.packed().find(b=>Number(b.dataset.i)===i), pages=0;while(!packedAgain&&r.more().length&&pages++<4){r.more()[0].dispatch('click');packedAgain=r.packed().find(b=>Number(b.dataset.i)===i);}assert.ok(packedAgain);packedAgain.dispatch('click');const shelfAgain=r.goods().find(b=>Number(b.dataset.i)===i);shelfAgain.dispatch('click');
  assert.equal(r.game.packed.has(r.game.goods[i].id),true);assert.deepEqual([...r.game.found],[...initialFound]);assert.equal(r.game.finishedLenses.size,3);r.game.destroy();
});

test('stale bag callbacks cannot act after the bag is rebuilt or the game is destroyed',()=>{
  const r=rig({level:2});r.enterExploring();const stale=r.more()[0], page=r.game.bagPage, oldButton=r.packed()[0];r.game.renderBag();stale.dispatch('click');oldButton.dispatch('click');assert.equal(r.game.bagPage,page);assert.equal(r.game.packed.size,r.game.goods.length);const current=r.packed()[0];r.game.destroy();current.dispatch('click');assert.equal(r.game.packed.size,r.game.goods.length);
});

test('destroyed captured arrival callback has no game or DOM effects',()=>{
  const r=rig();const i=r.game.goods.findIndex(p=>p.char===r.game.lenses[r.game.lens]);r.tapGood(i);const arrival=r.timers.find(t=>t.ms===320);assert.ok(arrival);const html=r.root.innerHTML, packed=r.game.packed.size, voice=r.spoken.length;r.game.destroy();arrival.fn();assert.equal(r.root.innerHTML,html);assert.equal(r.game.packed.size,packed);assert.equal(r.spoken.length,voice);
});


test('unpacking another picture cannot cancel a picture already flying to the bag',()=>{
  const r=rig();r.enterExploring();const first=r.packed()[0],i=Number(first.dataset.i);first.dispatch('click');r.tapGood(i);
  const flight=r.goods()[i].flights.at(-1);assert.ok(flight&&!flight.cancelled);const other=r.packed()[0];assert.notEqual(Number(other.dataset.i),i);other.dispatch('click');
  assert.equal(flight.cancelled,false);assert.ok(r.game.pending.has(r.game.goods[i].id));r.fire(320);assert.equal(flight.cancelled,true);assert.equal(r.game.pending.size,0);assert.equal(r.game.flights.size,0);assert.equal(r.outcomes.length,0);r.game.destroy();
});

test('reduced motion skips flights and keyboard unpacking returns focus to the picture',()=>{
  const r=rig({reduced:true});r.enterExploring();assert.ok(r.goods().every(b=>!b.flights));const source=r.packed()[0],i=Number(source.dataset.i);source.focusVisible=true;source.dispatch('click');assert.equal(r.goods()[i].focused,true);
  r.goods()[i].focusVisible=true;r.tapGood(i);r.fire(0);assert.equal(r.packed()[0].focused,true);assert.equal(r.outcomes.length,0);r.game.destroy();
});


test('Help reverses toward the bag when every picture is on a shelf',()=>{
  const r=rig();r.enterExploring();while(r.packed().length)r.packed()[0].dispatch('click');assert.equal(r.game.packed.size,0);
  const cue=r.cues.at(-1).options;assert.ok(r.goods().includes(cue.source));assert.equal(cue.destination,r.bag());assert.equal(cue.type,'drag');cue.onShow();assert.equal(r.outcomes.length,0);r.game.destroy();
});
