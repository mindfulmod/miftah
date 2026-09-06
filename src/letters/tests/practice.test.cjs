const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
function runtime(){const timers=[];const window={MiftahGame:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','GardenPractice.js'),'utf8'),{window,performance:{now:()=>100},setTimeout:f=>timers.push(f)});return {api:window.MiftahGame.GardenPractice,timers};}
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
test('leaving optional dot practice invalidates delayed completion',()=>{const {api,timers}=runtime();let done=0;const game=Object.create(api.DotGarden.prototype);Object.assign(game,{alive:true,busy:false,index:5,targets:[{},{},{}],ctx:{correct(){},say(){},done(){done++;}}});game.advance();game.advance();assert.equal(timers.length,1);game.destroy();timers[0]();assert.equal(done,0);});

test('dot answers require exact number and side, including no surplus dots',()=>{const {api}=runtime();assert.ok(api.validDots('ب',0,1));assert.ok(api.validDots('ت',2,0));assert.ok(api.validDots('ث',3,0));for(const [letter,a,b] of [['ب',1,0],['ت',0,2],['ث',2,0],['ث',3,1],['ا',0,0]])assert.equal(api.validDots(letter,a,b),false);});
