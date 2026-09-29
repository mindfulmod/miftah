const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function fixture(){
 const ns={LettersArt:{icon:()=>'<svg/>'}},spoken=[],outcomes=[];
 const window={MiftahGame:ns};
 const context={window,performance:{now:()=>0},clearTimeout(){}};
 for(const file of ['GardenPractice.js','MiniGames.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
 function card(id,x){
  const flags=new Set(),events={},attrs={};let captured=null;
  const el={style:{},classList:{add:c=>flags.add(c),remove:c=>flags.delete(c),contains:c=>flags.has(c),toggle:(c,on)=>on?flags.add(c):flags.delete(c)},
   setAttribute:(k,v)=>attrs[k]=v,insertAdjacentHTML(){},addEventListener:(k,fn)=>events[k]=fn,
   setPointerCapture:id=>captured=id,hasPointerCapture:id=>captured===id,releasePointerCapture:()=>captured=null,
   getBoundingClientRect:()=>({left:x,right:x+60,top:20,bottom:80,width:60,height:60})};
  return {id,display:id,el,events,attrs,flags};
 }
 const a=card('ب',0),b=card('ب',100),wrong=card('ت',200);
 const game=Object.create(ns.LettersMiniGames.pairs.prototype);
 Object.assign(game,{alive:true,complete:false,selected:null,cards:[a,b,wrong],pairCount:1,matched:0,slips:0,boardIndex:0,boards:1,pots:[{classList:{add(){}}}],next:{hidden:true,focus(){}},ctx:{stage:{classList:{add(){}}},say:item=>spoken.push(item.id),reportOutcome:o=>outcomes.push(o),sfx(){},confettiAt(){},onDone(){}}});
 game.dragResets=game.cards.map(c=>game.wireDrag(c));
 return {game,a,b,wrong,spoken,outcomes};
}
const point=(x,y=50)=>({pointerId:1,pointerType:'touch',button:0,isPrimary:true,clientX:x,clientY:y});
test('Pairs drag matches once; synthesized click is suppressed and matched cards still replay',()=>{
 const {game,a,b,outcomes,spoken}=fixture();
 a.events.pointerdown(point(30));a.events.pointermove(point(120));assert.equal(b.flags.has('is-near'),true);
 a.events.pointerup(point(130));assert.equal(game.matched,1);assert.equal(game.complete,true);assert.equal(game.next.hidden,false);assert.equal(b.flags.has('is-near'),false);
 let suppressed=0;a.events.click({preventDefault(){suppressed++},stopImmediatePropagation(){suppressed++}});assert.equal(suppressed,2);
 a.events.pointerup(point(130));assert.equal(outcomes.length,1);
 game.pick(b,b.el);assert.equal(outcomes.length,1);assert.equal(spoken.at(-1),'ب');
});
test('Pairs wrong drop retains reference; empty space and cancelled drags are not wrong answers',()=>{
 const {game,a,b,wrong,outcomes}=fixture();
 a.events.pointerdown(point(30));a.events.pointermove(point(230));a.events.pointerup(point(230));
 assert.equal(game.slips,1);assert.equal(game.selected.card,a);assert.equal(wrong.flags.has('is-near'),false);
 a.events.pointerdown(point(30));a.events.pointermove(point(400));a.events.pointerup(point(400));assert.equal(game.slips,1);
 a.events.pointerdown(point(30));a.events.pointermove(point(130));a.events.pointercancel(point(130));
 assert.equal(game.matched,0);assert.equal(game.slips,1);assert.equal(b.flags.has('is-near'),false);assert.equal(a.el.style.transform,'');
 game.dropPair(a,130,50);assert.equal(game.matched,1);assert.equal(outcomes.length,2);
});
test('Pairs receiving tolerance is bounded, nearest-first and never picks matched or old cards',()=>{
 const {game,a,b,wrong}=fixture();
 assert.equal(game.dropPartner(a,85,50),b);assert.equal(game.dropPartner(a,83,50),null);
 assert.equal(game.dropPartner(a,190,50),wrong);b.flags.add('is-matched');assert.equal(game.dropPartner(a,130,50),null);
 game.cards=[b,wrong];game.dropPair(a,230,50);assert.equal(game.slips,0);assert.equal(game.selected,null);
});
test('Pairs leaving or losing pointer capture clears receiving feedback without reporting an answer',()=>{
 const {game,a,b,outcomes}=fixture();
 a.events.pointerdown({...point(30),button:2,pointerType:'mouse'});a.events.pointermove(point(130));assert.equal(game.selected,null);
 a.events.pointerdown(point(30));a.events.pointermove(point(130));a.events.lostpointercapture(point(130));
 assert.equal(b.flags.has('is-near'),false);assert.equal(outcomes.length,0);
 a.events.pointerdown(point(30));a.events.pointermove(point(130));game.destroy();a.events.pointerup(point(130));
 assert.equal(b.flags.has('is-near'),false);assert.equal(game.matched,0);assert.equal(outcomes.length,0);
});
