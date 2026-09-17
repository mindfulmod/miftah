const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function classes(){const set=new Set();return {add:x=>set.add(x),remove:x=>set.delete(x),toggle:(x,on)=>on?set.add(x):set.delete(x),contains:x=>set.has(x)};}
function node(dataset={}){return {dataset,style:{},classList:classes(),attrs:{},disabled:false,hidden:false,innerHTML:'',setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,fn){this[k]=fn;},focus(){}};}
function context2d(){
  const marks=[];
  return {marks,clearRect(){},beginPath(){},moveTo(){},lineTo(){},arc(){},fill(){marks.push(['fill',this.fillStyle]);},stroke(){marks.push(['stroke',this.strokeStyle]);},fillText(){},strokeText(){},getImageData(){return {data:new Uint8ClampedArray(400*240*4)};}};
}
function stageFixture(){
  let palette=[],captured=null;const stage={};
  Object.defineProperty(stage,'innerHTML',{set(html){this.html=html;palette=[['green','#4e9677'],['ink','#4a3620'],['coral','#c25a49'],['blue','#3a8fc4'],['purple','#6064a0']].map(([,color])=>node({color}));},get(){return this.html;}});
  const g=context2d(),outer={classList:classes()},paper={classList:classes(),clientWidth:400,clientHeight:240,parentElement:outer,querySelectorAll:()=>[],appendChild(){}};
  const canvas=node();Object.assign(canvas,{width:800,height:500,parentElement:paper,getContext:()=>g,getBoundingClientRect:()=>({left:0,top:0,width:400,height:240}),setPointerCapture:id=>{captured=id;},hasPointerCapture:id=>captured===id,releasePointerCapture:()=>{captured=null;}});
  const fixed={'canvas':canvas,'.path-guide':node(),'.path-next':node(),'.path-clear':node(),'.path-guide-toggle':node(),'.trace-canvas':canvas,'.trace-clear':node(),'.trace-finish':node(),'.trace-next':node()};
  stage.querySelector=selector=>fixed[selector];stage.querySelectorAll=selector=>selector==='.drawing-color'?palette:selector==='button'?[]:[];
  return {stage,g,canvas,fixed,get palette(){return palette;},capture:()=>captured};
}
function runtime(){
  const window={MiftahGame:{LettersArt:{icon:()=>'',inkShift:()=>({dx:0,dy:0})}},addEventListener(){},removeEventListener(){}};
  const document={fonts:{load:()=>Promise.resolve()},createElement:()=>node()};
  const sandbox={window,document,performance:{now:()=>0},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},requestAnimationFrame(){},Uint8ClampedArray};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','GardenPractice.js'),'utf8'),sandbox);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','MiniGames.js'),'utf8'),sandbox);
  return window.MiftahGame;
}

test('shared palette is wordless, exposes five named choices, and persists without storage',()=>{
  const ns=runtime(),html=ns.DrawingPalette.markup();
  assert.equal((html.match(/class="drawing-color"/g)||[]).length,5);
  for(const name of ['Green','Brown','Coral','Blue','Purple'])assert.match(html,new RegExp(`aria-label="Color ${name}"`));
  assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
  const root=stageFixture();root.stage.innerHTML=html;let active=true,releases=0;
  ns.DrawingPalette.wire(root.stage,{active:()=>active,release:()=>releases++});root.palette[3].onclick();
  assert.equal(ns.DrawingPalette.current(),'#3a8fc4');assert.equal(releases,1);assert.equal(root.palette[3].attrs['aria-pressed'],'true');
  active=false;root.palette[4].onclick();assert.equal(ns.DrawingPalette.current(),'#3a8fc4');assert.equal(releases,1);
  assert.match(ns.DrawingPalette.markup(),/data-color="#3a8fc4"[^>]*aria-label="Color Blue"[^>]*aria-pressed="true"/);
});

test('Garden Paths switches future strokes, releases mid-stroke, and keeps color through clear and rounds',()=>{
  const ns=runtime(),f=stageFixture(),ctx={stage:f.stage,items:[{id:'ا',display:'ا'}],prompt(){},say(){},correct(){},done(){}};
  const game=new ns.GardenPractice.GardenPaths(ctx);
  assert.match(f.stage.html,/<div class="path-guide"><svg class="path-guide-glyph"[^>]*viewBox="0 0 100 100"/);assert.match(f.stage.html,/data-fit-box="50,50,78,74,84"/);assert.doesNotMatch(f.stage.html,/<span class="path-guide/);
  assert.equal(f.fixed['.path-guide'].hidden,false);f.fixed['.path-guide-toggle'].onclick();assert.equal(f.fixed['.path-guide'].hidden,true);f.fixed['.path-guide-toggle'].onclick();assert.equal(f.fixed['.path-guide'].hidden,false);
  f.canvas.onpointerdown({pointerId:1,button:0,clientX:20,clientY:20});assert.equal(f.g.marks.at(-1)[1],'#4e9677');assert.equal(f.capture(),1);
  const oldPalette=f.palette;oldPalette[2].onclick();assert.equal(game.pointer,null);assert.equal(f.capture(),null);assert.equal(game.inkColor,'#c25a49');
  f.canvas.onpointerdown({pointerId:2,button:0,clientX:30,clientY:30});assert.equal(f.g.marks.at(-1)[1],'#c25a49');f.canvas.onpointerup({pointerId:2});
  f.fixed['.path-clear'].onclick();assert.equal(game.inkColor,'#c25a49');
  f.canvas.onpointerdown({pointerId:3,button:0,clientX:40,clientY:40});f.canvas.onpointerup({pointerId:3});f.fixed['.path-next'].onclick();
  assert.equal(game.inkColor,'#c25a49');assert.equal(f.palette[2].attrs['aria-pressed'],'true');
  game.destroy();oldPalette[4].onclick();assert.equal(game.inkColor,'#c25a49');
});

test('Trace color changes preserve existing ink and coverage while clear keeps the pencil',async()=>{
  const ns=runtime(),f=stageFixture(),ctx={stage:f.stage,items:[{id:'ب',display:'ب'}],rounds:1,setPrompt(){},say(){},sfx(){},confettiAt(){},onDone(){}};
  const trace=new ns.LettersMiniGames.trace(ctx);await Promise.resolve();await Promise.resolve();
  trace.g=f.g;trace.g.strokeStyle='#4e9677';trace.brush=20;trace.guide=[];trace.paint=new Set();trace.canvas.width=400;trace.canvas.height=240;
  trace.penDown({pointerId:7,button:0,clientX:50,clientY:50});assert.equal(f.capture(),7);
  const painted=[...trace.paint],coverageBefore=trace.clusterCoverage(painted);assert.equal(f.g.marks.at(-1)[1],'#4e9677');
  const oldPalette=f.palette;oldPalette[4].onclick();assert.equal(trace.drawing,false);assert.equal(f.capture(),null);assert.equal(trace.inkColor,'#6064a0');assert.equal(trace.clusterCoverage(painted),coverageBefore);
  trace.penDown({pointerId:8,button:0,clientX:90,clientY:90});assert.equal(f.g.marks.at(-1)[1],'#6064a0');trace.cancelStroke({pointerId:8});
  assert.deepEqual(f.g.marks.filter(mark=>mark[0]==='fill').map(mark=>mark[1]),['#4e9677','#6064a0']);
  trace.clearDrawing();assert.equal(trace.inkColor,'#6064a0');assert.equal(trace.g.strokeStyle,'#6064a0');
  trace.destroy();oldPalette[1].onclick();assert.equal(trace.inkColor,'#6064a0');
});

test('drawing palette stylesheet keeps every target at least 44px and uses only approved colors',()=>{
  const css=fs.readFileSync(path.join(__dirname,'..','..','..','styles','letters-drawing.css'),'utf8');
  assert.match(css,/min-width:\s*44px/);assert.match(css,/min-height:\s*44px/);
  assert.match(css,/grid-template-columns:\s*repeat\(3, 44px\)/);assert.match(css,/\.trace-paper\s*\{\s*bottom:\s*110px/);
  assert.match(css,/orientation:\s*landscape/);assert.match(css,/lg-play\[data-activity="trace"\][\s\S]*min-height:\s*0/);
  assert.match(css,/lg-play:has\(\.garden-paths\)[\s\S]*grid-template-columns:\s*48px minmax\(0, 1fr\) 54px/);
  assert.match(css,/\.path-guide\[hidden\]\s*\{\s*display:\s*none/);assert.match(css,/\.path-guide > \.path-guide-glyph\s*\{[\s\S]*position:\s*absolute/);
  const hex=[...css.matchAll(/#[0-9a-f]{6}/gi)].map(match=>match[0].toLowerCase());
  const approved=new Set(['#4a3620','#fffaf0','#fffdf7','#c9bda4','#ffe49a','#e5dcc8','#2f5c46','#4e9677']);assert.ok(hex.every(color=>approved.has(color)));
});
