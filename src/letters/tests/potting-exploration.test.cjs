const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function element(){
  const values=new Set();let captured=null;
  return {style:{},attrs:{},handlers:{},disabled:false,innerHTML:'',
    classList:{add:x=>values.add(x),remove:x=>values.delete(x),contains:x=>values.has(x),toggle(x,on){if(on===undefined)on=!values.has(x);on?values.add(x):values.delete(x);return on;}},
    setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,v){this.handlers[k]=v;},focus(){this.focused=true;},
    setPointerCapture(id){captured=id;},hasPointerCapture:id=>captured===id,releasePointerCapture(){captured=null;},
    getBoundingClientRect:()=>({left:100,right:300,top:100,bottom:300,width:200,height:200}),querySelector:()=>element()};
}
function setup(displays=['ب','ت','ث']){
  const window={MiftahGame:{LettersArt:{icon:()=>'',inkShift:()=>({dx:0,dy:0}),fitGlyphs(){}}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../GardenPractice.js'),'utf8'),{window,performance:{now:()=>100},setTimeout(){}});
  const stage={nodes:{},choices:[],buds:[],addEventListener(){},
    set innerHTML(html){this.html=html;this.nodes={};for(const key of ['.dot-discovery-card','.dot-explore-undo','.dot-explore-next','.dot-seed','.dot-above','.dot-below','.dot-undo','.dot-check','.practice-status','.dot-base'])this.nodes[key]=element();this.choices=Array.from(html.matchAll(/aria-label="Try ([^"]+)"/g),()=>element());this.buds=this.choices.map(()=>element());},
    querySelector(s){return this.nodes[s];},querySelectorAll(s){return s==='.dot-pattern-choice'?this.choices:s==='[data-discovery]'?this.buds:[];}};
  const calls={prompts:[],spoken:[],outcomes:[],correct:0,done:0};
  const api=window.MiftahGame.GardenPractice;
  const ctx={stage,items:displays.map(display=>({id:display,display,speak:display})),canListen:()=>true,prompt:item=>calls.prompts.push(item),say:item=>calls.spoken.push(item),correct:()=>calls.correct++,done:()=>calls.done++,reportOutcome:o=>calls.outcomes.push(o)};
  return {api,stage,calls,ctx};
}
test('exploration admits only taught isolated letters in one verified body family',()=>{
  const {api,ctx}=setup(['ب','ث','ب','ج','بَ']);
  assert.deepEqual(Array.from(api.explorationItems(ctx.items,api.repairFamilies[0]),i=>i.display),['ب','ث']);
  assert.equal(api.explorationItems(ctx.items,undefined).length,0);
  const single=setup(['ب']);const game=new single.api.DotGarden(single.ctx);
  assert.equal(game.exploring,false);assert.ok(single.stage.html.includes('dot-bed'));
});
test('trying and undoing dot patterns never awards evidence or progress and continuation is optional',()=>{
  const {api,ctx,stage,calls}=setup();const game=new api.DotGarden(ctx);
  assert.equal(game.exploring,true);assert.equal(stage.nodes['.dot-explore-undo'].disabled,true);
  stage.choices[1].onclick();assert.equal(calls.prompts.at(-1).display,'ت');assert.equal(stage.choices[1].attrs['aria-pressed'],'true');
  stage.nodes['.dot-explore-undo'].onclick();assert.equal(calls.prompts.at(-1).display,'ب');
  assert.equal(calls.outcomes.length,0);assert.equal(calls.correct,0);assert.equal(calls.done,0);assert.equal(game.index,0);
  const stale=stage.choices[2].onclick;
  stage.nodes['.dot-explore-next'].onclick();assert.equal(game.exploring,false);assert.equal(game.round.kind,'repair');
  const count=calls.prompts.length;stale();assert.equal(calls.prompts.length,count);assert.equal(game.index,0);
});
test('dot-pattern drags require a valid release, ignore secondary pointers, and do not auto-answer',()=>{
  const {api,ctx,stage,calls}=setup();const game=new api.DotGarden(ctx),choice=stage.choices[1];
  const down={pointerId:1,isPrimary:true,button:0,clientX:10,clientY:10};
  choice.handlers.pointerdown({...down,isPrimary:false});choice.handlers.pointermove({...down,clientX:150,clientY:150});choice.handlers.pointerup({...down,clientX:150,clientY:150});assert.equal(game.exploreIndex,0);
  choice.handlers.pointerdown(down);choice.handlers.pointermove({...down,clientX:150,clientY:150});choice.handlers.pointercancel(down);choice.handlers.pointerup({...down,clientX:150,clientY:150});assert.equal(game.exploreIndex,0);
  choice.handlers.pointerdown(down);choice.handlers.pointermove({...down,clientX:400});choice.handlers.pointerup({...down,clientX:400});assert.equal(game.exploreIndex,0);
  choice.handlers.pointerdown(down);choice.handlers.pointermove({...down,clientX:150,clientY:150});choice.handlers.pointerup({...down,clientX:150,clientY:150});choice.handlers.pointerup({...down,clientX:150,clientY:150});
  assert.equal(game.exploreIndex,1);assert.equal(game.exploreHistory.length,1);assert.equal(calls.outcomes.length,0);
});
test('muted exploration remains visual and leaving invalidates replay, undo and dragged seeds',()=>{
  const {api,ctx,stage,calls}=setup(['ح','خ']);ctx.canListen=()=>false;const game=new api.DotGarden(ctx);
  const card=stage.nodes['.dot-discovery-card'],undo=stage.nodes['.dot-explore-undo'],next=stage.nodes['.dot-explore-next'],choice=stage.choices[1];
  choice.onclick();card.onclick();assert.equal(calls.spoken.length,0);assert.equal(calls.prompts.at(-1).display,'خ');
  game.destroy();const count=calls.prompts.length;undo.onclick();next.onclick();choice.onclick();card.onclick();
  assert.equal(calls.prompts.length,count);assert.equal(calls.done,0);assert.equal(calls.outcomes.length,0);
});
