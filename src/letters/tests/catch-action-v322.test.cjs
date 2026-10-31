const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function fixture() {
  const cues=[];let helped=0;
  const el=()=>({disabled:false,style:{},classList:{add(){},remove(){}},setAttribute(){},addEventListener(){},remove(){this.removed=true;}});
  const ns={LettersArt:{inkShift:()=>({dx:0,dy:0})}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','MiniGames.js'),'utf8'),{window:{MiftahGame:ns},document:{createElement:el}});
  const a={id:'بِ',display:'بِ'},b={id:'بُ',display:'بُ'};
  const game=Object.create(ns.LettersMiniGames.catch.prototype);
  Object.assign(game,{alive:true,still:true,settling:false,fallers:[],roundIndex:0,rounds:[{target:a,options:[b,a]},{target:b,options:[a,b]}],basket:el(),field:{appendChild(){}},ctx:{firstActionDemo:true,setupActionCue(options){const cue={options,dead:false,show(){if(!this.dead)helped++;},destroy(){this.dead=true;}};cues.push(cue);return cue;}}});
  return {game,cues,helped:()=>helped};
}
test('stationary choices teach the real target and basket mouth without selecting a fruit',()=>{
  const f=fixture();f.game.stationaryChoices(f.game.rounds[0]);const cue=f.cues[0];
  assert.equal(cue.options.source,f.game.fallers[1].el,'the second displayed fruit is the target');
  assert.equal(cue.options.destination,f.game.basket);assert.equal(cue.options.destinationY,52/112);assert.equal(cue.options.automatic,true);
  assert.equal(f.helped(),0);cue.show();assert.equal(f.helped(),1);
  assert.equal(f.game.settling,false);assert.equal(f.game.fallers.length,2);assert.ok(f.game.fallers.every(f=>!f.el.disabled));
});
test('round changes retire old cue, resolve current target and keep subsequent coaching optional',()=>{
  const f=fixture();f.game.stationaryChoices(f.game.rounds[0]);const old=f.cues.at(-1),oldFruit=f.game.fallers[1].el;
  f.game.roundIndex=1;f.game.stationaryChoices(f.game.rounds[1]);const current=f.cues.at(-1);
  assert.equal(old.dead,true);assert.equal(oldFruit.removed,true);old.show();assert.equal(f.helped(),0);
  assert.equal(current.options.source,f.game.fallers[1].el);assert.notEqual(current.options.source,oldFruit);assert.equal(current.options.automatic,false);
  f.game.clearFallers();assert.equal(current.dead,true);assert.equal(f.game.fallers.length,0);
});
test('moving, completed, disabled or destroyed targets never create a stationary instruction',()=>{
  for(const change of [g=>g.still=false,g=>g.settling=true,g=>g.alive=false,g=>g.fallers[1].el.disabled=true]){
    const f=fixture();f.game.stationaryChoices(f.game.rounds[0]);const old=f.cues.at(-1);change(f.game);f.game.setupCatchCue();
    assert.equal(old.dead,true);assert.equal(f.cues.length,1);assert.equal(f.helped(),0);
  }
  const f=fixture();f.game.ctx.firstActionDemo=false;f.game.stationaryChoices(f.game.rounds[0]);assert.equal(f.cues[0].options.automatic,false);
});
