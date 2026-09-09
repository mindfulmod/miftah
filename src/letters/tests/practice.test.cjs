const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
function runtime(){const timers=[];const window={MiftahGame:{LettersArt:{icon:()=>"",inkShift:()=>({dx:0,dy:0})}}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','GardenPractice.js'),'utf8'),{window,performance:{now:()=>100},setTimeout:f=>timers.push(f)});return {api:window.MiftahGame.GardenPractice,timers};}
function source(){const handlers={},classes=new Set();let captured=null;return {handlers,style:{},classList:{add:s=>classes.add(s),remove:s=>classes.delete(s)},addEventListener:(name,f)=>handlers[name]=f,setPointerCapture:id=>captured=id,hasPointerCapture:id=>captured===id,releasePointerCapture:()=>captured=null};}
test('drag cancellation and missed movement never deliver; successful drag delivers only once',()=>{
 const {api}=runtime();const el=source();let drops=0;api.draggable(el,{drop:()=>drops++});
 const down={pointerId:1,clientX:10,clientY:10,pointerType:'touch',button:0};
 el.handlers.pointerdown(down);el.handlers.pointermove({...down,clientX:60});el.handlers.pointercancel();el.handlers.pointerup(down);assert.equal(drops,0);assert.equal(el.style.transform,'');
 el.handlers.pointerdown(down);el.handlers.pointerup(down);assert.equal(drops,0);
 el.handlers.pointerdown(down);el.handlers.pointermove({...down,clientX:60});el.handlers.pointerup({...down,clientX:60});el.handlers.pointerup(down);assert.equal(drops,1);
 let stopped=false;el.handlers.click({preventDefault(){},stopImmediatePropagation(){stopped=true;}});assert.ok(stopped);
});
test('teardown releases the pointer and suppresses a late delivery',()=>{const {api}=runtime();const el=source();let drops=0;const reset=api.draggable(el,{drop:()=>drops++});el.handlers.pointerdown({pointerId:2,clientX:0,clientY:0,button:0});reset();el.handlers.pointerup({pointerId:2});assert.equal(drops,0);assert.ok(!el.hasPointerCapture(2));});
test('leaving optional dot practice invalidates delayed completion',()=>{const {api,timers}=runtime();let done=0;const game=Object.create(api.DotGarden.prototype);Object.assign(game,{alive:true,busy:false,index:5,targets:[{},{},{}],ctx:{stage:{querySelectorAll:()=>[]},correct(){},say(){},done(){done++;}}});game.advance();game.advance();assert.equal(timers.length,1);game.destroy();timers[0]();assert.equal(done,0);});

test('dot answers require exact number and side, including no surplus dots',()=>{const {api}=runtime();assert.ok(api.validDots('ب',0,1));assert.ok(api.validDots('ت',2,0));assert.ok(api.validDots('ث',3,0));for(const [letter,a,b] of [['ب',1,0],['ت',0,2],['ث',2,0],['ث',3,1],['ا',0,0]])assert.equal(api.validDots(letter,a,b),false);});


test('Garden Paths clear releases the stroke and retired controls cannot advance',()=>{
 const {api}=runtime();let captured=null,marks=0,rewards=0;
 const ctx2d={clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){marks++}};
 const canvas={getContext:()=>ctx2d,getBoundingClientRect:()=>({left:0,top:0,width:800,height:500}),setPointerCapture:id=>captured=id,hasPointerCapture:id=>captured===id,releasePointerCapture:()=>captured=null};
 const guide={},next={},clear={},toggle={setAttribute(){}};
 const stage={querySelector:s=>({'canvas':canvas,'.path-guide':guide,'.path-next':next,'.path-clear':clear,'.path-guide-toggle':toggle}[s])};
 const game=new api.GardenPaths({stage,items:[{display:'ا'}],prompt(){},say(){},correct(){rewards++},done(){}});
 canvas.onpointerdown({pointerId:1,button:0,clientX:10,clientY:10});assert.equal(captured,1);
 clear.onclick();assert.equal(captured,null);assert.equal(game.hasInk,false);assert.equal(next.disabled,true);
 canvas.onpointermove({pointerId:1,clientX:30,clientY:30});assert.equal(marks,1);
 canvas.onpointerdown({pointerId:2,button:0,clientX:10,clientY:10});canvas.onpointerup();
 const oldNext=next.onclick;oldNext();assert.equal(rewards,1);game.hasInk=true;oldNext();assert.equal(rewards,1);
 const currentNext=next.onclick;game.destroy();currentNext();assert.equal(rewards,1);
});


test('Dot success locks every activity tool before the delayed transition',()=>{
 const {api}=runtime();const buttons=[{disabled:false},{disabled:false}];
 const game=Object.create(api.DotGarden.prototype);Object.assign(game,{alive:true,busy:false,ctx:{stage:{querySelectorAll:()=>buttons},correct(){},say(){}}});
 game.advance();assert.equal(buttons.every(b=>b.disabled),true);
});

test('Garden Paths clamps strokes, rejects invalid geometry and secondary pointers, and finishes once',()=>{
 const {api}=runtime();let rect={left:0,top:0,width:800,height:500},done=0;const points=[];
 const g={clearRect(){},beginPath(){},moveTo:(...p)=>points.push(p),lineTo:(...p)=>points.push(p),stroke(){}};
 const canvas={getContext:()=>g,getBoundingClientRect:()=>rect,setPointerCapture(){},hasPointerCapture:()=>false};
 const guide={},next={},clear={},toggle={setAttribute(){}};
 const stage={querySelector:s=>({'canvas':canvas,'.path-guide':guide,'.path-next':next,'.path-clear':clear,'.path-guide-toggle':toggle}[s])};
 const game=new api.GardenPaths({stage,items:[{display:'ا'}],prompt(){},say(){},correct(){},done(){done++}});
 assert.equal(clear.disabled,true);
 canvas.onpointerdown({pointerId:1,button:0,isPrimary:false,clientX:0,clientY:0});assert.equal(points.length,0);
 rect.width=0;canvas.onpointerdown({pointerId:1,button:0,clientX:0,clientY:0});assert.equal(points.length,0);rect.width=800;
 canvas.onpointerdown({pointerId:1,button:0,clientX:-50,clientY:-20});assert.deepEqual(points[0],[0,0]);assert.equal(clear.disabled,false);
 canvas.onpointermove({pointerId:1,clientX:900,clientY:600});assert.deepEqual(points.at(-1),[800,500]);canvas.onpointerup();next.onclick();
 canvas.onpointerdown({pointerId:2,button:0,clientX:20,clientY:20});canvas.onpointerup();const finish=next.onclick;finish();finish();assert.equal(done,1);assert.equal(game.alive,false);
});

test('Dot final transition completes once even if callback is delivered again',()=>{
 const {api,timers}=runtime();let done=0;const game=Object.create(api.DotGarden.prototype);
 Object.assign(game,{alive:true,busy:false,index:1,targets:[{}],ctx:{stage:{querySelectorAll:()=>[]},correct(){},say(){},done(){done++}}});
 game.advance();game.advance();timers[0]();timers[0]();assert.equal(done,1);assert.equal(game.alive,false);
});

test('Dot controls reject old views, cap dots, reset seed selection and deduplicate recall',()=>{
 const {api}=runtime();const elements={};let recalls=[];
 const element=()=>{const el=source(),classes=new Set();el.classList={add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle:c=>classes.has(c)?classes.delete(c):classes.add(c)};el.attrs={};el.setAttribute=(k,v)=>el.attrs[k]=v;el.querySelector=()=>({innerHTML:''});return el;};
 const stage={set innerHTML(value){this.html=value;for(const key of ['.dot-seed','.dot-above','.dot-below','.dot-undo','.dot-check','.practice-status','.dot-base'])elements[key]=element();recalls=Array.from(value.matchAll(/class="practice-button /g),()=>element());},querySelector:s=>elements[s],querySelectorAll:()=>recalls};
 const game=new api.DotGarden({stage,items:[{id:'ba',display:'ب'}],prompt(){},say(){},correct(){},done(){}});
 const stale=elements['.dot-above'].onclick;elements['.dot-seed'].onclick();assert.equal(elements['.dot-seed'].attrs['aria-pressed'],'true');
 elements['.dot-above'].onclick();assert.equal(elements['.dot-seed'].attrs['aria-pressed'],'false');elements['.dot-above'].onclick();elements['.dot-above'].onclick();elements['.dot-above'].onclick();assert.equal(game.above,3);assert.equal(elements['.dot-below'].disabled,true);
 elements['.dot-undo'].onclick();assert.equal(elements['.dot-below'].disabled,false);
 game.show();stale();assert.equal(game.above,0);game.index=1;game.show();assert.equal(recalls.length,1);game.destroy();recalls[0].onclick();assert.equal(game.busy,false);
});
