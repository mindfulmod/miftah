const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function fixture() {
  const cues=[],outcomes=[],timers=[];let finishes=0;
  const node=()=>{const flags=new Set();return {disabled:false,dataset:{},style:{},attrs:{},innerHTML:'',classList:{add:(...xs)=>xs.forEach(x=>flags.add(x)),remove:(...xs)=>xs.forEach(x=>flags.delete(x)),contains:x=>flags.has(x),toggle:(x,on)=>on?flags.add(x):flags.delete(x)},setAttribute(k,v){this.attrs[k]=v;},focus(){}};};
  const ns={LettersArt:{icon:()=>'<svg/>',inkShift:()=>({dx:0,dy:0})}};
  const context={window:{MiftahGame:ns},setTimeout:fn=>timers.push(fn),clearTimeout(){}};
  for(const f of ['LettersLearning.js','MiniGames.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),context);
  const session=new ns.LettersLearning.LearningSession({recordOutcome:o=>(outcomes.push(o),true)},()=>10);
  const parts=['ب','ت','ث'].map(display=>({id:display,display})),target={id:'بتث',display:'بتث',parts};
  session.beginPrompt(target,{skill:'construction',activity:'build'});
  const slots=parts.map(node),tiles=parts.map((_,i)=>Object.assign(node(),{dataset:{i:String(i)}}));
  const next=node(),whole=node(),scene=node(),finish={...node(),querySelector:s=>s==='.build-next'?next:whole};
  const stage={contains:n=>tiles.includes(n)||slots.includes(n),querySelectorAll:s=>s==='.build-tile'?tiles:slots,querySelector:s=>s==='.build-scene'?scene:s==='.build-finish'?finish:null};
  const ctx={stage,reducedMotion:()=>true,say(){},sfx(){},confettiAt(){},clearLearningHint(){},showLearningHint(){session.assist();},onDone(){finishes++;},reportOutcome:o=>session.report(o),setupActionCue(options){const cue={options,destroyed:false,show(){if(!this.destroyed)session.assist();},destroy(){this.destroyed=true;}};cues.push(cue);return cue;}};
  const game=Object.create(ns.LettersMiniGames.build.prototype);
  Object.assign(game,{ctx,alive:true,ready:false,roundIndex:0,targets:[target],tray:parts,placed:[],slots,slips:0});
  return {game,cues,outcomes,timers,slots,tiles,next,finishes:()=>finishes};
}

test('construction help demonstrates only the next placement and never creates ink, outcomes or rewards',()=>{
  const f=fixture();f.game.markNextSlot(true);const first=f.cues.at(-1);
  assert.equal(first.options.type,'drag');assert.equal(first.options.source,f.tiles[0]);assert.equal(first.options.destination,f.slots[0]);assert.equal(first.options.destinationY,.5);assert.equal(first.options.automatic,true);
  first.show();assert.equal(f.game.placed.length,0);assert.equal(f.outcomes.length,0);assert.equal(f.finishes(),0);
  f.game.place(f.tiles[0]);assert.equal(first.destroyed,true);assert.equal(f.cues.at(-1).options.source,f.tiles[1]);assert.equal(f.cues.at(-1).options.destination,f.slots[1]);assert.equal(f.cues.at(-1).options.automatic,false);
  f.game.place(f.tiles[1]);f.game.place(f.tiles[2]);
  assert.equal(f.game.ready,true);assert.equal(f.cues.at(-1).destroyed,true);assert.equal(f.outcomes.length,1);assert.equal(f.outcomes[0].evidence,'assisted_response');assert.equal(f.finishes(),0);
  f.next.onclick();f.next.onclick();assert.equal(f.finishes(),1);
});

test('wrong partial construction help shows undo before another piece, then follows the restored slot',()=>{
  const f=fixture();f.game.markNextSlot(true);f.game.place(f.tiles[1]);const undo=f.cues.at(-1);
  assert.equal(undo.options.type,'tap');assert.equal(undo.options.source,f.slots[0]);assert.equal(undo.options.automatic,false);
  assert.equal(f.game.slips,0);assert.equal(f.outcomes.length,0);
  f.game.returnFrom(0);assert.equal(undo.destroyed,true);assert.equal(f.game.placed.length,0);
  assert.equal(f.cues.at(-1).options.source,f.tiles[0]);assert.equal(f.cues.at(-1).options.destination,f.slots[0]);assert.equal(f.game.slips,0);
});

test('a completed wrong build removes help while resetting and restores only the current step afterward',()=>{
  const f=fixture();f.game.markNextSlot(true);f.game.place(f.tiles[1]);f.game.place(f.tiles[0]);f.game.place(f.tiles[2]);
  assert.equal(f.game.slips,1);assert.equal(f.outcomes.length,1);assert.equal(f.cues.at(-1).destroyed,true);
  f.timers.shift()();assert.equal(f.game.placed.length,0);assert.equal(f.cues.at(-1).options.source,f.tiles[0]);assert.equal(f.cues.at(-1).options.automatic,false);
});

test('prepared pieces are retained, canceled unseen help leaves motor evidence unchanged, and destroy retires guidance',()=>{
  const f=fixture();f.game.placed=[{part:f.game.tray[0],slot:f.slots[0],btn:null,fixed:true}];
  f.game.markNextSlot();assert.equal(f.cues.at(-1).options.source,f.tiles[1]);
  f.game.returnFrom(0);assert.equal(f.game.placed.length,1);
  f.game.place(f.tiles[1]);f.game.place(f.tiles[2]);assert.equal(f.outcomes[0].evidence,'motor_assembly_participation');
  const other=fixture();other.game.markNextSlot(true);const pending=other.cues.at(-1);other.game.destroy();pending.show();
  assert.equal(pending.destroyed,true);assert.equal(other.outcomes.length,0);assert.equal(other.finishes(),0);
});
