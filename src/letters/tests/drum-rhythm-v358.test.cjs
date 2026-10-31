const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function node(classes='',attrs={}){
  const names=new Set(classes.split(' ').filter(Boolean));
  return {attrs,dataset:{i:attrs['data-i']},disabled:false,hidden:attrs.hidden!==undefined,children:[],listeners:{},style:{setProperty(k,v){this[k]=v;}},
    classList:{add:x=>names.add(x),remove:x=>names.delete(x),contains:x=>names.has(x),toggle:(x,on)=>on?names.add(x):names.delete(x)},
    setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},append(x){this.children.push(x);},addEventListener(k,fn){this.listeners[k]=fn;},
    querySelector(sel){if(sel==='.ea-pattern-dots')return this.dots||(this.dots=node());if(sel==='.ea-strike')return this.impact||(this.impact=node());if(sel==='svg')return this.svg||(this.svg=node());return null;},
    querySelectorAll(){return [];},getBoundingClientRect(){return {left:10,top:20,width:100,height:100};},animate(){this.animated=(this.animated||0)+1;return{cancel(){}};}};
}
function harness(word='تَمْر',reduced=true){
  let now=0,id=0;const timers=new Map(),events=[],outcomes=[],sfx=[];
  const root={isConnected:true,nodes:[],classList:node().classList,focus(){},contains(el){return this.nodes.includes(el);},set innerHTML(html){this.html=html;this.nodes=[];
    for(const m of html.matchAll(/<(button|div|i)\b([^>]*)>/g)){const attrs={};for(const a of m[2].matchAll(/([\w-]+)="([^"]*)"/g))attrs[a[1]]=a[2];if(/\bhidden\b/.test(m[2]))attrs.hidden='';this.nodes.push(node(attrs.class||'',attrs));}
    const n=Number(html.match(/aria-label="(\d+) beats"/)?.[1]||0);this.beats=Array.from({length:n},()=>node());},get innerHTML(){return this.html;},
    querySelectorAll(sel){if(sel==='.ea-beats i')return this.beats;const names=sel.split(',').map(s=>s.trim().slice(1));return this.nodes.filter(x=>names.some(c=>x.classList.contains(c)));},querySelector(sel){return this.querySelectorAll(sel)[0]||null;}};
  const stage={firstElementChild:root,contains:x=>x===root};const pictures=(Array.isArray(word)?word:[word]).map((w,i)=>({id:'p'+i,word:w,en:'word',char:'ت'}));
  const ns={LettersArt:{stickerMotif:()=>''},PracticeLearning:{plan:(_c,p)=>p,level:()=>1}};
  const scope=vm.createContext({window:{MiftahGame:ns},console,performance:{now:()=>now},document:{createElement:()=>node()},
    setTimeout:(fn,ms)=>{const key=++id;timers.set(key,{fn,at:now+ms});return key;},clearTimeout:key=>timers.delete(key)});
  for(const file of ['PictureWords','EarsGames'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file+'.js'),'utf8'),scope);
  const ctx={stage,pictures,random:()=>0,beginner:false,say:()=>Promise.resolve(true),sfx:x=>sfx.push({x,at:now}),reportOutcome:x=>outcomes.push(x),reducedMotion:()=>reduced};
  async function advance(ms){const end=now+ms;await tick();for(let i=0;i<200;i++){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);events.push({at:now,fn:next[1].fn});next[1].fn();await tick();}now=end;await tick();}
  return{ns,ctx,root,timers,outcomes,sfx,events,now:()=>now,advance};
}
function pointer(drum,x=60,y=60){drum.onpointerdown({button:0,clientX:x,clientY:y});}
const start=async f=>{const g=new f.ns.GardenPractice.BeatDrum(f.ctx);await tick();await f.advance(0);assert.equal(g.busy,false);return g;};

test('pointerdown records immediately and its follow-up click cannot duplicate the strike',async()=>{
  const f=harness(),g=await start(f);
  const drum=f.root.querySelector('.ea-drum-btn');pointer(drum,30,50);assert.equal(g.hits,1);assert.equal(f.sfx.length,1);
  drum.onclick({detail:1});assert.equal(g.hits,1);assert.equal(f.sfx.length,1);g.destroy();
});
test('keyboard click remains a valid strike and initial heard evidence stays distinct from free rhythm',async()=>{
  const f=harness(),g=await start(f),drum=f.root.querySelector('.ea-drum-btn');
  drum.onclick({detail:0});assert.equal(g.hits,1);assert.equal(f.sfx.length,1);
  pointer(drum);pointer(drum);await f.advance(220);assert.equal(f.outcomes.length,1);assert.equal(f.outcomes[0].evidence,'motor_assembly_participation');assert.equal(f.outcomes[0].affectsStrength,false);
  const prior=f.outcomes.length;await f.advance(10);pointer(drum);assert.equal(f.outcomes.length,prior);assert.equal(g.pattern.length,1);g.destroy();
});
test('captures bounded beat positions and clamped gaps, then replays exactly the captured rhythm',async()=>{
  const f=harness('سَمَكَة',true),g=await start(f),drum=f.root.querySelector('.ea-drum-btn');
  pointer(drum,0,0);await f.advance(10);pointer(drum,110,130);await f.advance(2000);pointer(drum,60,60);await f.advance(220);
  assert.deepEqual(Array.from(g.pattern,x=>x.gap),[0,120,1200]);assert.deepEqual(Array.from(g.pattern,x=>[x.x,x.y]),[[.12,.14],[.88,.82],[.5,.4]]);
  const before=f.sfx.length,when=f.now();g.playPattern();await f.advance(119);assert.equal(f.sfx.length,before+1);assert.equal(drum.querySelector('.ea-strike').style['--hit-x'],'12%');await f.advance(1);assert.equal(drum.querySelector('.ea-strike').style['--hit-x'],'88%');await f.advance(120);await f.advance(1200);
  assert.deepEqual(f.sfx.slice(before).map(x=>x.at),[when,when+120,when+1320]);g.destroy();
});
test('a new free-play strike interrupts playback and remains usable',async()=>{
  const f=harness('سَمَكَة'),g=await start(f),drum=f.root.querySelector('.ea-drum-btn');pointer(drum);await f.advance(130);pointer(drum);await f.advance(130);pointer(drum);await f.advance(220);
  g.playPattern();await f.advance(50);const count=f.sfx.length;pointer(drum);assert.equal(g.pattern.length,1);await f.advance(1500);assert.equal(f.sfx.length,count+1);assert.equal(g.pattern.length,1);g.destroy();
});
test('actual Next cancels old playback, old controls and pending callbacks',async()=>{
  const f=harness(['سَمَكَة','بَيْضَة']),g=await start(f),drum=f.root.querySelector('.ea-drum-btn');
  pointer(drum);pointer(drum);pointer(drum);await f.advance(220);g.playPattern();
  const callbacks=[...g.patternTimers].map(key=>f.timers.get(key).fn);assert.equal(callbacks.length,4);
  const next=f.root.querySelector('.ea-next');assert.equal(next.hidden,false);next.onclick({detail:0});await f.advance(0);
  assert.equal(g.card.id,'p1');assert.equal(g.hits,0);assert.equal(g.assisted,false);assert.equal(f.outcomes.length,1);
  for(const callback of callbacks)callback();pointer(drum);drum.onclick({detail:0});
  assert.equal(f.sfx.length,3);assert.equal(g.hits,0);assert.equal(f.outcomes.length,1);
  const current=f.root.querySelector('.ea-drum-btn');pointer(current);pointer(current);await f.advance(220);g.playPattern();
  const afterExit=[...g.patternTimers].map(key=>f.timers.get(key).fn);assert.equal(afterExit.length,3);g.destroy();
  const count=f.sfx.length;for(const callback of afterExit)callback();assert.equal(f.sfx.length,count);assert.equal(f.outcomes.length,2);
});
test('word replay cancels beats, and repeated exploration stays bounded without new evidence',async()=>{
  const f=harness('سَمَكَة'),g=await start(f),drum=f.root.querySelector('.ea-drum-btn');
  pointer(drum);pointer(drum);pointer(drum);await f.advance(220);g.playPattern();await f.advance(0);
  const count=f.sfx.length;f.root.querySelector('.ea-replay-all').onclick({currentTarget:f.root.querySelector('.ea-replay-all')});
  await f.advance(2000);assert.equal(f.sfx.length,count);assert.equal(g.awaitingContinue,true);
  for(let i=0;i<20;i++){pointer(drum);await f.advance(130);assert.ok(g.pattern.length>=1&&g.pattern.length<=3);}
  assert.equal(g.pattern.length,2);assert.equal(f.root.querySelector('.ea-pattern').disabled,true);assert.equal(f.root.querySelector('.ea-next').hidden,false);assert.equal(f.outcomes.length,1);g.destroy();
});
test('reduced motion skips animation while preserving sound and learning outcome',async()=>{
  const f=harness('سَمَكَة',true),g=await start(f),drum=f.root.querySelector('.ea-drum-btn');pointer(drum);pointer(drum);pointer(drum);assert.equal(drum.querySelector('svg').animated||0,0);assert.equal(f.sfx.length,3);await f.advance(220);assert.equal(f.outcomes.length,1);g.destroy();
});
