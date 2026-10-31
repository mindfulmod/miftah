const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function activate(el){if(!el)return;const event={currentTarget:el,stopPropagation(){}};if(el.onclick)el.onclick(event);else el.listeners?.click?.(event);}
function node(classes='',attrs={}) {
  const names=new Set(classes.split(' '));
  return {attrs,dataset:{i:attrs['data-i']},disabled:false,hidden:attrs.hidden!==undefined,children:[],listeners:{},
    classList:{add:x=>names.add(x),remove:x=>names.delete(x),contains:x=>names.has(x),toggle:(x,on)=>on?names.add(x):names.delete(x)},
    setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},append(x){this.children.push(x);},
    addEventListener(k,fn){this.listeners[k]=fn;},querySelector(){return null;},animate(){return{cancel(){}};}};
}
function harness(pictures) {
  let now=0,id=0,plans=0,level=0;
  const timers=new Map(),outcomes=[],begins=[],spoken=[];
  const root={isConnected:true,nodes:[],classList:node().classList,focus(){this.focused=true;},contains(el){return this.nodes.includes(el);},
    set innerHTML(html){this.html=html;this.nodes=[];
      for(const m of html.matchAll(/<(button|div|i)\b([^>]*)>/g)) {
        const attrs={};for(const a of m[2].matchAll(/([\w-]+)="([^"]*)"/g))attrs[a[1]]=a[2];
        if(/\bhidden\b/.test(m[2]))attrs.hidden='';
        this.nodes.push(node(attrs.class||'',attrs));
      }
      this.beats=Array.from({length:Number(html.match(/aria-label="(\d+) beats"/)?.[1]||0)},()=>node());
    },
    get innerHTML(){return this.html;},
    querySelectorAll(selector){if(selector==='.ea-beats i')return this.beats;
      const list=selector.split(',').map(s=>s.trim().slice(1));return this.nodes.filter(x=>list.some(c=>x.classList.contains(c)));},
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}};
  const stage={firstElementChild:root,contains:x=>x===root};
  const ns={LettersArt:{stickerMotif:()=>'<svg></svg>'},PracticeLearning:{plan:(_ctx,items)=>{plans++;return items;},level:()=>level}};
  const scope=vm.createContext({window:{MiftahGame:ns},console,document:{createElement:()=>node()},
    setTimeout:(fn,ms)=>{timers.set(++id,{fn,at:now+ms});return id;},clearTimeout:key=>timers.delete(key)});
  for(const name of ['PictureWords','EarsGames'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name+'.js'),'utf8'),scope);
  let cancelled=0,done=0;
  const ctx={stage,pictures,random:()=>.7,beginner:false,say:item=>{spoken.push(item);return Promise.resolve(true);},
    cancel:()=>cancelled++,done:()=>done++,beginRound:(...args)=>begins.push(args),reportOutcome:x=>outcomes.push(x),reducedMotion:()=>true};
  return{ns,ctx,root,timers,outcomes,begins,spoken,setLevel:n=>level=n,plans:()=>plans,cancelled:()=>cancelled,done:()=>done,
    async advance(ms=0){const until=now+ms;await tick();for(let count=0;count<100;count++){
      const next=[...timers].filter(([,t])=>t.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];
      if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].fn();await tick();
    }now=until;await tick();}};
}
const pictures=[
  {id:'fig',word:'تِين',char:'ت',en:'fig',sticker:'fig'},
  {id:'dates',word:'تَمْر',char:'ت',en:'dates',sticker:'dates'},
  {id:'camel',word:'جَمَل',char:'ج',en:'camel',sticker:'camel'},
  {id:'mountain',word:'جَبَل',char:'ج',en:'mountain',sticker:'mountain'},
  {id:'flower',word:'زَهْرَة',char:'ز',en:'flower',sticker:'flower'},
  {id:'olive',word:'زَيْتُون',char:'ز',en:'olive',sticker:'olive'}
];
test('empty and unusable picture plans cancel after construction, never award a completion',async()=>{
  for(const kind of ['BeatDrum','SameStart','OddSound']){
    const f=harness([]),g=new f.ns.GardenPractice[kind](f.ctx);
    assert.equal(f.cancelled(),0);await f.advance();assert.equal(f.cancelled(),1);assert.equal(f.done(),0);g.destroy();
    const stopped=harness([]),old=new stopped.ns.GardenPractice[kind](stopped.ctx);old.destroy();await stopped.advance();assert.equal(stopped.cancelled(),0);
  }
  for(const kind of ['SameStart','OddSound']){
    const f=harness(pictures.slice(0,2)),g=new f.ns.GardenPractice[kind](f.ctx);
    assert.equal(f.cancelled(),0);await f.advance();assert.equal(f.cancelled(),1);assert.equal(f.done(),0);g.destroy();
  }
});
test('SameStart hears the target AND each answer before selection, then clears speech cues',async()=>{
  const f=harness(pictures),pending=[];f.ctx.say=item=>new Promise(resolve=>pending.push({item,resolve}));
  const g=new f.ns.GardenPractice.SameStart(f.ctx);
  assert.equal(g.choices.length,2);assert.equal(g.rounds,3);assert.equal(f.plans(),1);
  assert.equal(f.begins[0][1],'first-sound');
  for(let i=0;i<3;i++){
    assert.equal(pending.length,i+1);assert.equal(g.answerReady,false);
    assert.ok(f.root.querySelectorAll('.ea-choice').every(x=>x.disabled));
    pending[i].resolve(true);await f.advance(i<2?180:0);
  }
  assert.deepEqual(pending.map(x=>x.item.id),[g.target.id,...Array.from(g.choices,x=>x.id)]);
  assert.equal(g.answerReady,true);assert.ok(f.root.querySelectorAll('.ea-choice').every(x=>!x.disabled&&!x.classList.contains('is-saying')));
  f.setLevel(2);g.round++;g.next();assert.equal(g.choices.length,2);assert.equal(f.plans(),1);g.destroy();await f.advance();
});
test('replaced answer and replay controls cannot act for the current round',async()=>{
  const f=harness(pictures),g=new f.ns.GardenPractice.SameStart(f.ctx);await f.advance(360);
  const i=g.choices.findIndex(p=>p.id===g.match.id),old=f.root.querySelectorAll('.ea-choice')[i],oldReplay=f.root.querySelectorAll('.ea-choice-replay')[i];
  f.root.nodes=f.root.nodes.filter(x=>x!==old&&x!==oldReplay);
  const calls=f.spoken.length;await g.pick(i,old);await g.replayChoice(i,oldReplay,g.roundToken,f.root);
  assert.equal(f.outcomes.length,0);assert.equal(f.spoken.length,calls);g.destroy();
});
test('the target picture replays only its own name without submitting an answer',async()=>{
  const f=harness(pictures),g=new f.ns.GardenPractice.SameStart(f.ctx);await f.advance(360);
  const before=f.spoken.length,target=f.root.querySelector('.ea-target');
  await g.replayTarget(g.roundToken,f.root,target);
  assert.equal(f.spoken.length,before+1);assert.equal(f.spoken.at(-1).id,g.target.id);
  assert.equal(g.assisted,true);assert.equal(f.outcomes.length,0);assert.equal(g.round,0);g.destroy();
});
test('one hung word bounds the whole sequence and gives supported play without a false heard result',async()=>{
  const f=harness(pictures);f.ctx.say=item=>{f.spoken.push(item);return new Promise(()=>{});};
  const g=new f.ns.GardenPractice.OddSound(f.ctx);await f.advance(11999);assert.equal(g.answerReady,false);
  await f.advance(1);assert.equal(g.answerReady,true);assert.equal(g.initialVerified,false);assert.equal(g.assisted,true);
  assert.equal(f.spoken.length,1);assert.ok(f.root.querySelectorAll('.ea-choice').some(x=>x.classList.contains('is-hint')));
  assert.equal(f.outcomes.length,0);g.destroy();assert.equal(f.timers.size,0);
});
test('BeatDrum ignores replaced controls, reports once, and cancels pending completion on exit',async()=>{
  const f=harness(pictures),g=new f.ns.GardenPractice.BeatDrum(f.ctx);await f.advance();
  assert.equal(g.rounds,3);assert.ok(g.cards.every(p=>f.ns.EarsGames.beats(p.word)<=2));
  const original=f.root.querySelector('.ea-drum-btn');f.root.nodes=f.root.nodes.filter(x=>x!==original);
  await g.hit(original);assert.equal(g.hits,0);f.root.nodes.push(original);
  const pending=g.hit(original);await f.advance(220);
  assert.equal(f.outcomes.length,1);assert.equal(f.outcomes[0].evidence,'motor_assembly_participation');assert.equal(f.outcomes[0].affectsStrength,false);
  await g.hit(original);assert.equal(f.outcomes.length,1);
  g.destroy();await pending;await f.advance(10000);assert.equal(f.done(),0);assert.equal(g.round,1);assert.equal(g.awaitingContinue,false);
});
async function winRound(kind,f,g){
  if(kind==='BeatDrum'){
    await f.advance();const pending=g.hit(f.root.querySelector('.ea-drum-btn'));await f.advance(3000);await pending;
  }else{
    await f.advance(360);const i=g.choices.findIndex(p=>g.correctChoice(p));
    const pending=g.pick(i,f.root.querySelectorAll('.ea-choice')[i]);await f.advance(700);await pending;
  }
}
test('all listening games hold each result for the child, then start a fresh unassisted prompt and finish once',async()=>{
  for(const kind of ['BeatDrum','SameStart','OddSound']){
    const f=harness(pictures);f.ctx.rounds=2;const g=new f.ns.GardenPractice[kind](f.ctx);
    await winRound(kind,f,g);
    assert.equal(g.round,1,kind+' advances the round counter after feedback');
    assert.equal(g.awaitingContinue,true,kind+' holds the successful result');
    assert.ok(f.root.querySelector('.ea-next'),kind+' shows the next picture control');
    assert.equal(f.outcomes.length,1);
    const oldToken=g.roundToken;await f.advance(20000);
    assert.equal(g.roundToken,oldToken,kind+' does not auto-advance after timers');
    assert.equal(f.outcomes.length,1,kind+' does not repeat the held result');
    activate(f.root.querySelector('.ea-next'));
    assert.equal(g.roundToken,oldToken+1,kind+' continues only after the child action');
    assert.equal(g.assisted,false,kind+' starts the next prompt unassisted');
    await winRound(kind,f,g);
    assert.equal(g.awaitingContinue,true,kind+' also holds the final result');
    assert.equal(f.done(),0,kind+' does not finish until the final action');
    activate(f.root.querySelector('.ea-next'));
    assert.equal(f.done(),1,kind+' finishes on the final child action');
    await f.advance(5000);assert.equal(f.done(),1,kind+' cannot finish twice');
    assert.equal(f.outcomes.length,2,kind+' reports each successful target once');
    g.destroy();
  }
});
test('completed picture replay changes no learning result and an old speech completion cannot affect the next round',async()=>{
  for(const kind of ['BeatDrum','SameStart','OddSound']){
    const f=harness(pictures);f.ctx.rounds=2;const g=new f.ns.GardenPractice[kind](f.ctx);
    await winRound(kind,f,g);const count=f.outcomes.length,token=g.roundToken;
    let release;f.ctx.say=()=>new Promise(resolve=>{release=resolve;});
    const completed=kind==='BeatDrum'?[g.card]:kind==='SameStart'?[g.target,...g.choices]:g.choices;
    const replay=g.replayCompleted(completed,token,f.root);await tick();
    assert.equal(typeof release,'function',kind+' starts completed picture speech');
    assert.equal(f.outcomes.length,count,kind+' replay adds no learning result');
    f.ctx.say=()=>Promise.resolve(true);
    g.continueRound(token,f.root,{});assert.equal(g.roundToken,token+1);
    release(true);await replay;await tick();
    assert.equal(f.outcomes.length,count,kind+' ignores completion from replaced speech');
    assert.equal(g.round,1,kind+' keeps the next round intact');g.destroy();
  }
});
test('the next picture interrupts pending success playback without accepting its stale completion',async()=>{
  for(const kind of ['SameStart','OddSound']){
    const f=harness(pictures);f.ctx.rounds=2;const g=new f.ns.GardenPractice[kind](f.ctx);
    await f.advance(360);let release;f.ctx.say=()=>new Promise(resolve=>{release=resolve;});
    const i=g.choices.findIndex(p=>g.correctChoice(p));const pending=g.pick(i,f.root.querySelectorAll('.ea-choice')[i]);await tick();
    assert.equal(g.awaitingContinue,true,kind+' exposes continuation during success speech');
    const oldToken=g.roundToken;f.ctx.say=()=>Promise.resolve(true);activate(f.root.querySelector('.ea-next'));
    assert.equal(g.roundToken,oldToken+1,kind+' starts the next prompt immediately');
    release(true);await pending;await tick();
    assert.equal(f.outcomes.length,1,kind+' does not duplicate learning after interruption');
    assert.equal(g.round,1);assert.equal(g.assisted,false,kind+' keeps the fresh prompt unassisted');g.destroy();
  }
});
test('teardown cancels outstanding speech and completion waiters for every listening game',async()=>{
  for(const kind of ['BeatDrum','SameStart','OddSound']){
    const f=harness(pictures),pending=[];f.ctx.say=()=>new Promise(resolve=>pending.push(resolve));
    const g=new f.ns.GardenPractice[kind](f.ctx);await tick();assert.ok(pending.length,kind+' begins voice playback');
    g.destroy();for(const resolve of pending)resolve(true);await tick();await f.advance(20000);
    assert.equal(f.outcomes.length,0,kind+' cannot award after teardown');
    assert.equal(f.done(),0,kind+' cannot finish after teardown');
    assert.equal(f.timers.size,0,kind+' clears timers on teardown');
  }
});
