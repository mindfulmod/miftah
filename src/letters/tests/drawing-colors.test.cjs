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
  let palette=[],captured=null;const stage={style:{setProperty(key,value){this[key]=value;}}};
  Object.defineProperty(stage,'innerHTML',{set(html){this.html=html;palette=[...html.matchAll(/class="drawing-color" data-color="([^"]+)"/g)].map(([,color])=>node({color}));},get(){return this.html;}});
  const g=context2d(),outer={classList:classes()},paper={classList:classes(),clientWidth:400,clientHeight:240,parentElement:outer,querySelectorAll:()=>[],appendChild(){}};
  const canvas=node();Object.assign(canvas,{width:800,height:500,parentElement:paper,getContext:()=>g,getBoundingClientRect:()=>({left:0,top:0,width:400,height:240}),setPointerCapture:id=>{captured=id;},hasPointerCapture:id=>captured===id,releasePointerCapture:()=>{captured=null;}});
  const fixed={'canvas':canvas,'.path-guide':node(),'.path-next':node(),'.path-continue':node(),'.path-clear':node(),'.path-guide-toggle':node(),'.trace-canvas':canvas,'.trace-clear':node(),'.trace-finish':node(),'.trace-next':node()};
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

test('shared palette is wordless, exposes seven named choices, and persists without storage',()=>{
  const ns=runtime(),html=ns.DrawingPalette.markup();
  assert.equal((html.match(/class="drawing-color"/g)||[]).length,7);
  for(const name of ['Green','Brown','Coral','Blue','Purple','Pink','Honey gold'])assert.match(html,new RegExp(`aria-label="Color ${name}"`));
  assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
  const root=stageFixture();root.stage.innerHTML=html;let active=true,releases=0;
  ns.DrawingPalette.wire(root.stage,{active:()=>active,release:()=>releases++});root.palette[3].onclick();
  assert.equal(ns.DrawingPalette.current(),'hsl(200 62% 54%)');assert.equal(releases,1);assert.equal(root.palette[3].attrs['aria-pressed'],'true');
  active=false;root.palette[4].onclick();assert.equal(ns.DrawingPalette.current(),'hsl(200 62% 54%)');assert.equal(releases,1);
  assert.ok(ns.DrawingPalette.markup().includes('data-color="hsl(200 62% 54%)" aria-label="Color Blue" aria-pressed="true"'));
});

test('both drawing activities start in each pet hue instead of the previous activity pencil',()=>{
  const ns=runtime();
  for(const [petHue,name] of [[200,'Blue'],[320,'Pink'],[95,'Green'],[268,'Purple'],[28,'Honey gold']]){
    for(const Activity of [ns.GardenPractice.GardenPaths,ns.LettersMiniGames.trace]){
      const previous=stageFixture();previous.stage.innerHTML=ns.DrawingPalette.markup();
      ns.DrawingPalette.wire(previous.stage);previous.palette[1].onclick();
      assert.equal(ns.DrawingPalette.current(),'#4a3620');
      const f=stageFixture(),game=new Activity({stage:f.stage,petHue,items:[{id:'ب',display:'ب'}],prompt(){},setPrompt(){},say(){}});
      const color=`hsl(${petHue} 62% 54%)`;
      assert.equal(game.inkColor,color,name);assert.equal(f.stage.style['--drawing-ink'],color);
      assert.equal(f.palette.filter(button=>button.attrs['aria-pressed']==='true').length,1);
      assert.equal(f.palette.find(button=>button.attrs['aria-pressed']==='true').dataset.color,color);
      game.destroy();
    }
  }
  assert.equal(ns.DrawingPalette.startForPet(undefined),'hsl(200 62% 54%)');
  assert.equal(ns.DrawingPalette.startForPet('320'),'hsl(320 62% 54%)');
  assert.equal(ns.DrawingPalette.startForPet(325),'hsl(320 62% 54%)');
  assert.equal(ns.DrawingPalette.startForPet(-40),'hsl(320 62% 54%)');
});

test('pink applies only to new Garden Paths ink and preserves the earlier colour',()=>{
  const ns=runtime(),f=stageFixture();
  const game=new ns.GardenPractice.GardenPaths({stage:f.stage,petHue:200,items:[{id:'ب',display:'ب'}],prompt(){},say(){}});
  f.canvas.onpointerdown({pointerId:1,button:0,clientX:20,clientY:20});
  f.palette.find(button=>button.dataset.color==='hsl(320 62% 54%)').onclick();
  assert.equal(f.capture(),null);
  f.canvas.onpointerdown({pointerId:2,button:0,clientX:30,clientY:30});f.canvas.onpointerup({pointerId:2});
  assert.deepEqual(Array.from(game.strokes,stroke=>stroke.color),['hsl(200 62% 54%)','hsl(320 62% 54%)']);
  assert.equal(f.stage.style['--drawing-ink'],'hsl(320 62% 54%)');
  game.destroy();
});

test('Garden Paths switches future strokes, releases mid-stroke, and keeps color through clear and rounds',()=>{
  const ns=runtime(),f=stageFixture(),ctx={stage:f.stage,petHue:95,items:[{id:'ا',display:'ا'}],prompt(){},say(){},correct(){},done(){}};
  const game=new ns.GardenPractice.GardenPaths(ctx);
  assert.match(f.stage.html,/<div class="path-guide"><svg class="path-guide-glyph"[^>]*viewBox="0 0 100 100"/);assert.match(f.stage.html,/data-fit-box="50,50,78,74,84"/);assert.doesNotMatch(f.stage.html,/<span class="path-guide/);
  assert.equal(f.fixed['.path-guide'].hidden,false);f.fixed['.path-guide-toggle'].onclick();assert.equal(f.fixed['.path-guide'].hidden,true);f.fixed['.path-guide-toggle'].onclick();assert.equal(f.fixed['.path-guide'].hidden,false);
  f.canvas.onpointerdown({pointerId:1,button:0,clientX:20,clientY:20});assert.equal(f.g.marks.at(-1)[1],'hsl(95 62% 54%)');assert.equal(f.capture(),1);
  const oldPalette=f.palette;oldPalette[2].onclick();assert.equal(game.pointer,null);assert.equal(f.capture(),null);assert.equal(game.inkColor,'#c25a49');
  f.canvas.onpointerdown({pointerId:2,button:0,clientX:30,clientY:30});assert.equal(f.g.marks.at(-1)[1],'#c25a49');f.canvas.onpointerup({pointerId:2});
  f.fixed['.path-clear'].onclick();assert.equal(game.inkColor,'#c25a49');
  f.canvas.onpointerdown({pointerId:3,button:0,clientX:40,clientY:40});f.canvas.onpointerup({pointerId:3});f.fixed['.path-next'].onclick();f.fixed['.path-continue'].onclick();
  assert.equal(game.inkColor,'#c25a49');assert.equal(f.palette[2].attrs['aria-pressed'],'true');
  game.destroy();oldPalette[4].onclick();assert.equal(game.inkColor,'#c25a49');
});

test('Trace color changes preserve existing ink and coverage while clear keeps the pencil',async()=>{
  const ns=runtime(),f=stageFixture(),ctx={stage:f.stage,petHue:95,items:[{id:'ب',display:'ب'}],rounds:1,setPrompt(){},say(){},sfx(){},confettiAt(){},onDone(){}};
  const trace=new ns.LettersMiniGames.trace(ctx);await Promise.resolve();await Promise.resolve();
  trace.g=f.g;trace.g.strokeStyle='hsl(95 62% 54%)';trace.brush=20;trace.guide=[];trace.paint=new Set();trace.canvas.width=400;trace.canvas.height=240;
  trace.penDown({pointerId:7,button:0,clientX:50,clientY:50});assert.equal(f.capture(),7);
  const painted=[...trace.paint],coverageBefore=trace.clusterCoverage(painted);assert.equal(f.g.marks.at(-1)[1],'hsl(95 62% 54%)');
  const oldPalette=f.palette;oldPalette[4].onclick();assert.equal(trace.drawing,false);assert.equal(f.capture(),null);assert.equal(trace.inkColor,'hsl(268 62% 54%)');assert.equal(trace.clusterCoverage(painted),coverageBefore);
  trace.penDown({pointerId:8,button:0,clientX:90,clientY:90});assert.equal(f.g.marks.at(-1)[1],'hsl(268 62% 54%)');trace.cancelStroke({pointerId:8});
  assert.deepEqual(f.g.marks.filter(mark=>mark[0]==='fill').map(mark=>mark[1]),['hsl(95 62% 54%)','hsl(268 62% 54%)']);
  trace.clearDrawing();assert.equal(trace.inkColor,'hsl(268 62% 54%)');assert.equal(trace.g.strokeStyle,'hsl(268 62% 54%)');
  trace.destroy();oldPalette[1].onclick();assert.equal(trace.inkColor,'hsl(268 62% 54%)');
});

test('drawing palette stylesheet keeps every target at least 44px and uses only approved colors',()=>{
  const css=fs.readFileSync(path.join(__dirname,'..','..','..','styles','letters-drawing.css'),'utf8');
  assert.match(css,/min-width:\s*44px/);assert.match(css,/min-height:\s*44px/);
  assert.match(css,/grid-template-columns:\s*repeat\(4, 44px\)/);assert.match(css,/\.trace-paper\s*\{\s*bottom:\s*110px/);
  assert.match(css,/orientation:\s*landscape/);assert.match(css,/lg-play\[data-activity="trace"\][\s\S]*min-height:\s*0/);
  assert.match(css,/lg-play:has\(\.garden-paths\)[\s\S]*grid-template-columns:\s*48px minmax\(0, 1fr\) 54px/);
  assert.match(css,/\.path-guide\[hidden\]\s*\{\s*display:\s*none/);assert.match(css,/\.path-guide > \.path-guide-glyph\s*\{[\s\S]*position:\s*absolute/);
  const hex=[...css.matchAll(/#[0-9a-f]{6}/gi)].map(match=>match[0].toLowerCase());
  const approved=new Set(['#4a3620','#fffaf0','#fffdf7','#c9bda4','#ffe49a','#e5dcc8','#2f5c46','#4e9677']);assert.ok(hex.every(color=>approved.has(color)));
});
