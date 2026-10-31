const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function rig() {
  const frames = new Map(); let frameId = 0, now = 1000;
  class El {
    constructor() { this.dataset = {}; this.style = { values: {}, setProperty(k,v) { this.values[k]=v; } }; this.hidden = false; this.disabled = false; this.classes = new Set(); this.listeners = {}; this.attrs = {}; this.classList = { add: x=>this.classes.add(x), remove:x=>this.classes.delete(x), contains:x=>this.classes.has(x), toggle:(x,on)=>on===undefined?(this.classes.has(x)?this.classes.delete(x):this.classes.add(x)):on?this.classes.add(x):this.classes.delete(x) }; }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    emit(type, event={}) { for (const fn of this.listeners[type] || []) fn({ pointerId: 1, isPrimary:true, clientX:0, clientY:0, pointerType:"touch", button:0, ...event }); }
    setPointerCapture(id) { this.captured=id; } hasPointerCapture(id) { return this.captured===id; } releasePointerCapture(id) { if(this.captured===id)this.captured=null; }
    getBoundingClientRect() { return {height:56}; } setAttribute(k,v) { this.attrs[k]=String(v); }
    querySelector(s) { return this.map?.[s] || null; } querySelectorAll(s) { return this.lists?.[s] || []; }
    click(detail=1) { this.onclick?.({detail,currentTarget:this}); }
  }
  const stage=new El(), root=new El(), svg=new El(), gates=Array.from({length:3},()=>new El()), bends=Array.from({length:3},()=>new El()), boards=Array.from({length:3},()=>new El()), labels=Array.from({length:3},()=>new El());
  const progress=new El(), next=new El(), help=new El(), done=new El(), targets=Array.from({length:3},()=>new El());
  svg.querySelector=s=>{const i=Number(s.match(/data-lane="(\d+)"/)?.[1]);return boards[i]||null;}; svg.querySelectorAll=()=>[];
  gates.forEach((g,i)=>{ g.offsetHeight=56; labels[i].dataset.lane=String(i); });
  root.querySelector=s=>s===".wg-scene"?svg:s===".wg-next"?next:s===".wg-help"?help:s===".wg-done"?done:s===".wg-progress"?progress:s.includes("wg-pull-target")?targets[Number(s.match(/data-lane="(\d+)"/)?.[1])]:null;
  root.querySelectorAll=s=>s===".wg-gate-tag"?gates:s===".wg-bend"?bends:[];
  stage.querySelector=()=>root;
  const ns={GardenPractice:{},LettersArt:{icon:()=>"",fitGlyphs(){}}};
  const sandbox={window:{MiftahGame:ns},localStorage:{getItem:()=>null,setItem(){}},Math,Date,performance:{now:()=>now},requestAnimationFrame(fn){const id=++frameId;frames.set(id,fn);return id;},cancelAnimationFrame(id){frames.delete(id);},setTimeout,clearTimeout};
  for(const file of ["LettersLearning.js","GardenLearning.js","PracticeLearning.js","LettersStrength.js","WaterGarden.js"]) vm.runInNewContext(fs.readFileSync(path.join(__dirname,"..",file),"utf8"),sandbox);
  const outcomes=[], saves=[];
  function game(opts={}) { return new ns.GardenPractice.WaterGarden({stage,items:["ب","ت","ث","ج"].map(id=>({id,display:id,speak:id})),targets:["ب"],rounds:1,say:()=>true, reducedMotion:()=>false, reportOutcome:o=>outcomes.push(o),saveWaterState:s=>saves.push(s), ...opts}); }
  function tick(ms=90) { now+=ms; const batch=[...frames.values()]; frames.clear(); batch.forEach(fn=>fn(now)); }
  return {game,gates,boards,outcomes,saves,frames,tick};
}
function drag(gate, pointer, startY, endY, extra={}) { gate.emit("pointerdown",{pointerId:pointer,clientY:startY,...extra}); gate.emit("pointermove",{pointerId:pointer,clientY:endY,...extra}); }

test("vertical pull tracks lift continuously and a full upward release answers once",()=>{
  const f=rig(), g=f.game(); const lane=g.targetLane, gate=f.gates[lane];
  drag(gate,1,100,45); assert.ok(g.gateLifts[lane]>.9); assert.equal(gate.classes.has("is-pulling"),true);
  gate.emit("pointerup",{pointerId:1,clientY:45}); assert.equal(f.outcomes.length,1); assert.equal(f.outcomes[0].correct,true);
  gate.click(1); assert.equal(f.outcomes.length,1,"the post-drag synthetic click is suppressed"); g.destroy();
});

test("short, sideways, cancelled and lost-capture pulls report nothing",()=>{
  const f=rig(), g=f.game(), gate=f.gates[g.targetLane];
  for (const [type, end] of [["pointerup",90],["pointerup",30],["pointercancel",40],["lostpointercapture",40]]) {
    gate.emit("pointerdown",{pointerId:1,clientX:0,clientY:100}); gate.emit("pointermove",{pointerId:1,clientX:type==="pointerup"&&end===30?150:0,clientY:end}); gate.emit(type,{pointerId:1});
    assert.equal(f.outcomes.length,0);
  }
  g.destroy();
});

test("only the initiating pointer can move or release an active pull",()=>{
  const f=rig(), g=f.game(), lane=g.targetLane, gate=f.gates[lane];
  gate.emit("pointerdown",{pointerId:7,clientY:100}); gate.emit("pointerdown",{pointerId:8,clientY:100});
  gate.emit("pointermove",{pointerId:8,clientY:30}); assert.equal(g.gateLifts[lane],0);
  gate.emit("pointermove",{pointerId:7,clientY:35}); gate.emit("pointerup",{pointerId:8}); assert.ok(g.activePull);
  gate.emit("pointerup",{pointerId:7}); assert.equal(f.outcomes.length,1); g.destroy();
});

test("full pull on a wrong gate records one assisted correction",()=>{
  const f=rig(), g=f.game(), lane=g.offered.findIndex((item,i)=>item&&i!==g.targetLane), gate=f.gates[lane];
  drag(gate,1,100,35); gate.emit("pointerup",{pointerId:1});
  assert.equal(f.outcomes.length,1); assert.equal(f.outcomes[0].correct,false); assert.equal(g.assisted,true); g.destroy();
});

test("free-play pulls save open and closed state without reporting learning",()=>{
  const f=rig(), g=f.game({freePlay:true}), gate=f.gates[0];
  drag(gate,1,100,35); gate.emit("pointerup",{pointerId:1}); assert.equal(g.open[0],true);
  gate.click(1);assert.equal(g.open[0],true);assert.equal(f.saves.length,1,"synthetic click cannot close a free gate");
  drag(gate,2,35,100); gate.emit("pointerup",{pointerId:2}); assert.equal(g.open[0],false);
  assert.equal(f.outcomes.length,0); assert.equal(f.saves.length,2); g.destroy();
});

test("settling can be grabbed from its displayed lift and destroy cancels its frame",()=>{
  const f=rig(), g=f.game(), lane=g.targetLane, gate=f.gates[lane];
  drag(gate,1,100,90); gate.emit("pointerup",{pointerId:1}); assert.ok(f.frames.size>0);
  f.tick(60);f.tick(60); const displayed=g.gateLifts[lane]; assert.ok(displayed>0&&displayed<1);
  gate.emit("pointerdown",{pointerId:2,clientY:200}); assert.equal(g.activePull.start,displayed); assert.equal(f.frames.size,0);
  gate.emit("pointercancel",{pointerId:2}); assert.ok(f.frames.size>0); const late=[...f.frames.values()][0], before=g.gateLifts[lane];assert.equal(typeof late,"function");g.destroy(); assert.equal(f.frames.size,0);late(9999);assert.equal(f.frames.size,0);assert.equal(g.gateLifts[lane],before);
});


test("keyboard can toggle after a drag and reduced motion settles immediately",()=>{
  const f=rig(),g=f.game({freePlay:true,reducedMotion:()=>true}),gate=f.gates[0];
  drag(gate,1,100,75);gate.emit('pointerup',{pointerId:1});assert.equal(g.open[0],true);assert.equal(g.gateLifts[0],1);assert.equal(f.frames.size,0);
  gate.click(0);assert.equal(g.open[0],false);assert.equal(g.gateLifts[0],0);gate.click(0);assert.equal(g.open[0],true);assert.equal(f.outcomes.length,0);g.destroy();
});

test("hand guidance is stable across speech completion and marks support without an answer",()=>{
  const f=rig(),cues=[];const g=f.game({firstActionDemo:true,setupActionCue:o=>{cues.push(o);return{destroy(){}};}});
  assert.equal(cues.length,1);assert.equal(cues[0].source,f.gates[g.targetLane]);assert.equal(cues[0].automatic,true);assert.equal(cues[0].type,'drag');assert.equal(g.assisted,false);
  cues[0].onShow();assert.equal(g.assisted,true);assert.equal(f.outcomes.length,0);g.startRound();assert.equal(cues.length,2);assert.equal(cues[1].automatic,false);const before=g.helped.size;g.destroy();cues[1].onShow();assert.equal(g.helped.size,before);
});
