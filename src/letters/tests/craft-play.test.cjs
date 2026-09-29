const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
function el(){const cls=new Set();return {attrs:{},style:{},classList:{add:(...xs)=>xs.forEach(x=>cls.add(x)),remove:(...xs)=>xs.forEach(x=>cls.delete(x)),contains:x=>cls.has(x),toggle:(x,on)=>on?cls.add(x):cls.delete(x)},setAttribute(k,v){this.attrs[k]=v},focus(){this.focused=true},addEventListener(){}};}
function runtime(){const timers=[];const ns={LettersArt:{icon:()=>'<svg/>',inkShift:()=>({dx:0,dy:0})}};const box={window:{MiftahGame:ns,addEventListener(){},removeEventListener(){}},document:{},setTimeout:f=>timers.push(f),performance:{now:()=>0}};for(const file of ['GardenPractice','MiniGames'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file+'.js'),'utf8'),box);return {ns,timers};}
function drawing(){const {ns}=runtime();let nodes={},pages=[],captured=null;const painted=[];const g={beginPath(){},moveTo(){},lineTo(){},stroke(){painted.push(this.strokeStyle)},clearRect(){painted.length=0}};
 const stage={set innerHTML(html){this.html=html;nodes={};for(const name of ['.garden-paths','.path-guide','.path-next','.path-clear','.path-guide-toggle','.path-undo','.path-edit','.path-continue','.path-made','.path-review-tools','.path-editing-tools','.drawing-palette','.path-close','.path-gallery-preview'])nodes[name]=el();nodes.canvas={...el(),getContext:()=>g,getBoundingClientRect:()=>({left:0,top:0,width:400,height:250}),setPointerCapture:id=>captured=id,hasPointerCapture:id=>captured===id,releasePointerCapture:()=>captured=null};pages=Array.from(html.matchAll(/class="path-page"/g),()=>el());},querySelector:s=>nodes[s],querySelectorAll:s=>s==='.path-page'?pages:[]};
 const reports=[];let done=0;const game=new ns.GardenPractice.GardenPaths({stage,items:[{id:'baa',display:'ب'}],prompt(){},say(){},reportOutcome:e=>reports.push(e),correct(){},done(){done++}});
 const stroke=(id=1)=>{nodes.canvas.onpointerdown({pointerId:id,button:0,clientX:50,clientY:70});nodes.canvas.onpointermove({pointerId:id,clientX:70,clientY:100});nodes.canvas.onpointerup({pointerId:id});};
 return {game,stage,reports,painted,stroke,get nodes(){return nodes},get done(){return done},get pages(){return pages},get captured(){return captured}};
}
test('undo restores earlier ink and colors; finish holds marks until an explicit page turn',()=>{
 const t=drawing();t.stroke();t.game.inkColor='#c25a49';t.stroke(2);assert.equal(t.game.strokes.length,2);t.nodes['.path-undo'].onclick();assert.equal(t.game.strokes.length,1);assert.deepEqual(t.painted,['hsl(200 62% 54%)']);
 t.nodes['.path-next'].onclick();assert.equal(t.game.index,0);assert.equal(t.game.reviewing,true);assert.equal(t.reports.length,0);const count=t.game.strokes.length;
 t.stroke(3);t.nodes['.path-clear'].onclick();t.nodes['.path-undo'].onclick();assert.equal(t.game.strokes.length,count);
 t.nodes['.path-edit'].onclick();assert.equal(t.game.reviewing,false);assert.equal(t.nodes['.path-guide'].hidden,false);t.stroke(4);
 t.nodes['.path-next'].onclick();const turn=t.nodes['.path-continue'].onclick;turn();turn();assert.equal(t.game.index,1);assert.equal(t.reports.length,1);assert.equal(t.reports[0].affectsStrength,false);assert.equal(t.reports[0].correct,undefined);
 assert.ok(t.game.drawings[0].picture.includes('hsl(200 62% 54%)'));assert.match(t.game.drawings[0].picture,/#c25a49/);assert.match(t.game.drawings[0].picture,/viewBox="0 0 400 250"/);
});
test('sketchbook preserves each actual drawing and closes exactly once without adding learning outcomes',()=>{
 const t=drawing();for(let i=0;i<2;i++){t.stroke(i+1);t.nodes['.path-next'].onclick();t.nodes['.path-continue'].onclick();}
 assert.equal(t.done,0);assert.equal(t.pages.length,2);assert.equal(t.reports.length,2);const images=t.game.drawings.map(d=>d.picture);
 t.pages[0].onclick();assert.equal(t.nodes['.path-gallery-preview'].innerHTML,images[0]);t.pages[1].onclick();assert.equal(t.nodes['.path-gallery-preview'].innerHTML,images[1]);assert.equal(t.reports.length,2);
 const close=t.nodes['.path-close'].onclick;close();close();assert.equal(t.done,1);
});
test('drawing clear, canceled input and retired controls cannot resurrect ink or advance',()=>{
 const t=drawing();t.stroke();const oldCanvas=t.nodes.canvas,oldTurn=t.nodes['.path-continue'].onclick;
 oldCanvas.onpointerdown({pointerId:2,button:0,clientX:1,clientY:1});t.nodes['.path-undo'].onclick();assert.equal(t.captured,null);assert.equal(t.game.strokes.length,1);
 t.nodes['.path-clear'].onclick();assert.equal(t.game.hasInk,false);assert.equal(t.nodes['.path-next'].disabled,true);oldCanvas.onpointermove({pointerId:2,clientX:100,clientY:100});assert.equal(t.game.strokes.length,0);
 t.stroke(3);t.nodes['.path-next'].onclick();oldTurn();t.nodes.canvas.onpointerdown({pointerId:4,button:0,clientX:1,clientY:1});oldCanvas.onpointercancel({pointerId:4});assert.equal(t.game.pointer,4);
 t.game.destroy();assert.equal(t.captured,null);oldTurn();assert.equal(t.reports.length,1);
});
function build(reduced=false){const {ns,timers}=runtime(),outcomes=[],heard=[];let done=0;const part=display=>({id:display,display}),parts=[part('ب'),part('ت')],target={id:'bt',display:'بت',parts};
 const buttons=parts.map((_,i)=>({...el(),dataset:{i:String(i)}})),slots=parts.map(()=>el()),scene=el(),finish=el(),whole=el(),next=el();finish.querySelector=s=>s==='.build-whole'?whole:next;
 const game=Object.create(ns.LettersMiniGames.build.prototype);Object.assign(game,{alive:true,roundIndex:0,slips:0,targets:[target],tray:parts,slots,placed:[],ctx:{stage:{contains:()=>true,querySelector:s=>s==='.build-scene'?scene:s==='.build-finish'?finish:el(),querySelectorAll:()=>buttons},say:item=>heard.push(item.display),sfx(){},confettiAt(){},reportOutcome:e=>outcomes.push(e),onDone(){done++},reducedMotion:()=>reduced}});
 return {game,buttons,timers,outcomes,heard,next,whole,get done(){return done}};
}
test('Build reveal never advances on a timer; replay and repeated Next preserve one completion',()=>{
 for(const reduced of [false,true]){const t=build(reduced);t.game.place(t.buttons[0]);t.game.place(t.buttons[1]);assert.equal(t.outcomes.length,1);t.timers.forEach(fn=>fn());assert.equal(t.game.ready,true);assert.equal(t.game.roundIndex,0);assert.equal(t.done,0);
 t.whole.onclick();t.whole.onclick();assert.equal(t.outcomes.length,1);t.next.onclick();t.next.onclick();assert.equal(t.done,1);assert.equal(t.game.roundIndex,1);assert.equal(t.outcomes.length,1);}
});
test('Build delayed reveal and retired replay/Next cannot act after exit',()=>{
 const t=build();t.game.place(t.buttons[0]);t.game.place(t.buttons[1]);t.game.destroy();t.timers.forEach(fn=>fn());assert.equal(t.done,0);assert.equal(t.game.roundIndex,0);assert.equal(t.heard.length,2);
 const r=build(true);r.game.place(r.buttons[0]);r.game.place(r.buttons[1]);const heard=r.heard.length;r.game.destroy();r.whole.onclick();r.next.onclick();assert.equal(r.heard.length,heard);assert.equal(r.done,0);
});
