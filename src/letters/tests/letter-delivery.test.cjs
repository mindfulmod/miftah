const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

function classes(){const set=new Set();return {add:(...xs)=>xs.forEach(x=>set.add(x)),remove:(...xs)=>xs.forEach(x=>set.delete(x)),toggle:(x,on)=>on?set.add(x):set.delete(x),contains:x=>set.has(x)};}
function element(dataset={}){
  const handlers={};let captured=null;
  return {dataset,handlers,style:{},classList:classes(),attrs:{},disabled:false,innerHTML:'',
    setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,fn){handlers[k]=fn;},removeEventListener(){},dispatch(k,e={}){handlers[k]?.(e);},
    setPointerCapture(id){captured=id;},hasPointerCapture(id){return captured===id;},releasePointerCapture(){captured=null;},
    getBoundingClientRect(){return {left:100,right:240,top:50,bottom:190,width:140,height:140};},focus(){this.focused=true;}
  };
}
function runtime({reduced=false,canListen=true,items=[{id:'alif',display:'ا'},{id:'ba',display:'ب'},{id:'ta',display:'ت'}]}={}){
  const timers=[];let html='';let packets=[];const removed=[];
  const nodes={};
  const stage={events:{},
    set innerHTML(value){html=value;packets=[...value.matchAll(/class="delivery-packet" data-item="([^"]+)"/g)].map(match=>element({item:match[1]}));nodes.destination=element();nodes.listen=element();nodes.help=element();nodes.status=element();nodes.pet=element();},
    get innerHTML(){return html;},
    querySelector(selector){return ({'.delivery-destination':nodes.destination,'.delivery-listen':nodes.listen,'.delivery-help':nodes.help,'.delivery-status':nodes.status,'.delivery-pet':nodes.pet})[selector];},
    querySelectorAll(selector){return selector==='.delivery-packet'?packets:[];},
    addEventListener(k,fn){this.events[k]=fn;},removeEventListener(k,fn){if(this.events[k]===fn)delete this.events[k];}
  };
  const window={MiftahGame:{LettersArt:{inkShift:()=>({dx:0,dy:0}),icon:name=>`<${name}>`}}};
  const context={window,performance:{now:()=>100},setTimeout(fn,delay){const timer={fn,delay,cleared:false};timers.push(timer);return timer;},clearTimeout(timer){timer.cleared=true;}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','GardenPractice.js'),'utf8'),context);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','LetterDelivery.js'),'utf8'),context);
  const calls={said:[],prompted:[],outcomes:[],correct:0,done:0};
  const ctx={stage,items,reducedMotion:()=>reduced,canListen:()=>canListen,petArt:'<pet/>',say:item=>calls.said.push(item.id),prompt:item=>calls.prompted.push(item&&item.id),correct:()=>calls.correct++,reportOutcome:o=>calls.outcomes.push(o),done:()=>calls.done++};
  const game=new window.MiftahGame.LetterDelivery(ctx);
  const flush=()=>{const timer=timers.find(t=>!t.cleared&&!t.ran);if(timer){timer.ran=true;timer.fn();}return timer;};
  return {game,stage,nodes,calls,timers,flush,LetterDelivery:window.MiftahGame.LetterDelivery,ctx,get packets(){return packets;}};
}

test('tap delivery supports replay and reports four independent untimed rounds',()=>{
  const r=runtime({reduced:true});
  assert.deepEqual(r.calls.prompted,[null]);assert.deepEqual(r.calls.said,['alif']);
  r.nodes.listen.onclick();assert.deepEqual(r.calls.said,['alif','alif']);
  for(let round=0;round<4;round++){
    const target=r.game.target.id,choice=r.packets.find(button=>button.dataset.item===target);
    choice.onclick();assert.equal(choice.attrs['aria-pressed'],'true');r.nodes.destination.onclick();
    const outcomes=r.calls.outcomes.length;r.nodes.destination.onclick();assert.equal(r.calls.outcomes.length,outcomes);
    assert.equal(r.timers.at(-1).delay,0);r.flush();
  }
  assert.equal(r.calls.correct,4);assert.equal(r.calls.done,1);assert.equal(r.calls.outcomes.length,4);
  assert.ok(r.calls.outcomes.every(outcome=>outcome.independent&&!outcome.assisted));assert.equal(r.game.alive,false);
  assert.deepEqual(r.stage.events,{});
});

test('choice pools stay distinct and expand gently after the first success',()=>{
  for(const size of [1,2,3,5]){
    const items=Array.from({length:size},(_,i)=>({id:`letter-${i}`,display:String(i)})),r=runtime({reduced:true,items});
    const counts=[];
    for(let round=0;round<4;round++){
      const ids=r.packets.map(button=>button.dataset.item);counts.push(ids.length);
      assert.equal(new Set(ids).size,ids.length,`pool ${size}, round ${round+1} should not duplicate choices`);
      assert.ok(ids.includes(r.game.target.id));
      const correct=r.packets.find(button=>button.dataset.item===r.game.target.id);correct.onclick();r.nodes.destination.onclick();r.flush();
    }
    assert.deepEqual(counts,[Math.min(size,2),Math.min(size,3),Math.min(size,3),Math.min(size,3)]);
    assert.equal(r.calls.done,1);assert.equal(r.calls.outcomes.length,4);
  }
});

test('successive sessions rotate their practiced four-letter window',()=>{
  const items=Array.from({length:5},(_,i)=>({id:`rotate-${i}`,display:String(i)})),r=runtime({items});
  const first=Array.from(r.game.rounds,item=>item.id);r.game.destroy();
  const next=new r.LetterDelivery(r.ctx),second=Array.from(next.rounds,item=>item.id);next.destroy();
  assert.deepEqual(first,['rotate-0','rotate-1','rotate-2','rotate-3']);
  assert.deepEqual(second,['rotate-4','rotate-0','rotate-1','rotate-2']);
});

test('hub icon is native SVG and gives each rendered gradient unique ids',()=>{
  const r=runtime(),one=r.LetterDelivery.icon(100),two=r.LetterDelivery.icon(100);
  assert.match(one,/class="letter-delivery-icon" width="100" height="70"/);assert.match(one,/packet|garden|<path/);
  const id1=one.match(/id="([^"]+)-paper"/)[1],id2=two.match(/id="([^"]+)-paper"/)[1];assert.notEqual(id1,id2);
  r.game.destroy();
});

test('wrong packet reveals help, reduces choices, and records assisted success',()=>{
  const r=runtime();const wrong=r.packets.find(button=>button.dataset.item!==r.game.target.id),target=r.packets.find(button=>button.dataset.item===r.game.target.id);
  wrong.onclick();r.nodes.destination.onclick();
  assert.equal(wrong.disabled,true);assert.equal(wrong.classList.contains('is-removed'),true);assert.equal(target.classList.contains('is-help'),true);
  assert.equal(r.calls.prompted.at(-1),'alif');assert.equal(r.calls.correct,0);
  target.onclick();r.nodes.destination.onclick();
  assert.equal(r.calls.outcomes[0].assisted,true);assert.equal(r.calls.outcomes[0].independent,false);
});

test('explicit help reveals the answer without requiring a wrong response',()=>{
  const r=runtime();r.nodes.help.onclick();
  assert.equal(r.game.assisted,true);assert.equal(r.calls.prompted.at(-1),'alif');assert.deepEqual(r.calls.said,['alif','alif']);
  const target=r.packets.find(button=>button.dataset.item===r.game.target.id);assert.equal(target.classList.contains('is-help'),true);
  target.onclick();r.nodes.destination.onclick();assert.equal(r.calls.outcomes[0].assisted,true);
});

test('unavailable listening starts with visible support and a single choice is assisted',()=>{
  const silent=runtime({canListen:false});
  assert.deepEqual(silent.calls.said,[]);assert.deepEqual(silent.calls.prompted,['alif']);assert.equal(silent.game.assisted,true);assert.match(silent.stage.innerHTML,/delivery-listen[^>]*disabled/);
  assert.equal(silent.packets.find(button=>button.dataset.item===silent.game.target.id).classList.contains('is-help'),true);silent.game.destroy();
  const only=runtime({items:[{id:'only',display:'ا'}]});only.packets[0].onclick();only.nodes.destination.onclick();
  assert.equal(only.calls.outcomes[0].assisted,true);assert.equal(only.calls.outcomes[0].independent,false);
});

test('drag cancellation and exit clean up; a later drag can deliver once',()=>{
  const r=runtime(),target=r.packets.find(button=>button.dataset.item===r.game.target.id);
  const down={pointerId:7,isPrimary:true,pointerType:'touch',button:0,clientX:0,clientY:0};
  target.dispatch('pointerdown',down);target.dispatch('pointermove',{...down,clientX:40});target.dispatch('pointercancel',{...down,clientX:140,clientY:100});
  assert.equal(r.calls.correct,0);assert.equal(target.style.transform,'');
  target.dispatch('pointerdown',{...down,pointerId:8});target.dispatch('pointermove',{...down,pointerId:8,clientX:40});target.dispatch('pointerup',{...down,pointerId:8,clientX:140,clientY:100});
  assert.equal(r.calls.correct,1);target.dispatch('pointerup',{...down,pointerId:8,clientX:140,clientY:100});assert.equal(r.calls.correct,1);
  r.game.destroy();r.flush();assert.equal(r.calls.done,0);assert.deepEqual(r.stage.events,{});
});
