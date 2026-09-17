const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

function runtime(){
  const window={MiftahGame:{LettersArt:{icon:()=>'',inkShift:()=>({dx:2,dy:-3})}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','GardenPractice.js'),'utf8'),{window,performance:{now:()=>100}});
  return window.MiftahGame.GardenPractice;
}
function draggableSource(){
  const handlers={},classes=new Set();let captured=null;
  return {handlers,style:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},addEventListener:(k,f)=>handlers[k]=f,setPointerCapture:id=>captured=id,hasPointerCapture:id=>captured===id,releasePointerCapture:()=>captured=null,getBoundingClientRect:()=>({left:0,top:0,width:20,height:20})};
}

test('practice100 pointer ownership, cancelled click suppression, and zero-size drops',()=>{
  const api=runtime(),el=draggableSource();let drops=0;api.draggable(el,{drop:()=>drops++});
  el.handlers.pointerdown({pointerId:1,isPrimary:true,clientX:0,clientY:0,button:0});
  el.handlers.pointermove({pointerId:1,isPrimary:true,clientX:20,clientY:0});
  el.handlers.pointerup({pointerId:2,isPrimary:true,clientX:20,clientY:0});
  assert.equal(drops,0);
  el.handlers.pointerup({pointerId:1,isPrimary:true,clientX:20,clientY:0});
  assert.equal(drops,1);
  el.handlers.pointerdown({pointerId:5,isPrimary:true,clientX:0,clientY:0,button:0});
  el.handlers.pointermove({pointerId:5,isPrimary:true,clientX:20,clientY:0});
  el.handlers.pointercancel({pointerId:5,isPrimary:true});
  let stopped=false;el.handlers.click({preventDefault(){},stopImmediatePropagation(){stopped=true;}});assert.equal(stopped,true);
  assert.equal(api.inside({getBoundingClientRect:()=>({left:0,top:0,right:0,bottom:20,width:0,height:20})},0,1),false);
});

test('practice100 disabled source resets an active drag',()=>{
  const api=runtime(),el=draggableSource();let enabled=true;api.draggable(el,{enabled:()=>enabled,drop(){}});
  el.handlers.pointerdown({pointerId:7,isPrimary:true,clientX:0,clientY:0,button:0});enabled=false;
  el.handlers.pointermove({pointerId:7,isPrimary:true,clientX:20,clientY:0});
  assert.equal(el.hasPointerCapture(7),false);
});

test('practice100 exposes shared eraser and validates exact dot counts',()=>{
  const api=runtime();assert.match(api.eraserIcon(),/<svg/);
  assert.equal(api.validDots('ب',0,1),true);assert.equal(api.validDots('ب',0,0),false);
});

test('practice100 path rejects stale pointer releases',()=>{
  const api=runtime();let capture=null,strokes=0;
  const g={beginPath(){},moveTo(){},lineTo(){},stroke(){strokes++}};
  const canvas={getContext:()=>g,getBoundingClientRect:()=>({left:0,top:0,width:800,height:500}),setPointerCapture:id=>capture=id,hasPointerCapture:id=>capture===id,releasePointerCapture:()=>capture=null};
  const els={canvas,'.path-guide':{hidden:false},'.path-next':{},'.path-clear':{},'.path-guide-toggle':{setAttribute(){},focus(){}}};
  const stage={innerHTML:'',querySelector:s=>els[s]};
  const game=new api.GardenPaths({stage,items:[{display:'ا'}],prompt(){},say(){},correct(){},done(){}});
  canvas.onpointerdown({pointerId:3,button:0,isPrimary:true,clientX:1,clientY:1});
  canvas.onpointerup({pointerId:4,isPrimary:true});assert.equal(game.pointer,3);
  canvas.onpointercancel({pointerId:3,isPrimary:true});assert.equal(game.pointer,null);assert.equal(strokes,1);
});
