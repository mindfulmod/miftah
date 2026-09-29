const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');

function parse(html){
 const roots=[],stack=[];
 for(const m of html.matchAll(/<\/?([a-z]+)\b([^>]*)>/g)){
  const closing=m[0].startsWith('</'),tag=m[1].toLowerCase();
  if(closing){for(let i=stack.length-1;i>=0;i--)if(stack[i].tagName===tag){stack.length=i;break;}continue;}
  const attrs=m[2],classes=(attrs.match(/class="([^"]+)/)||[])[1]||'',n=node(classes,tag);
  n.hidden=/\bhidden(?:\s|$)/.test(attrs);
  for(const [,k,v] of attrs.matchAll(/(data-[\w-]+|aria-[\w-]+)="([^"]*)"/g)){if(k.startsWith('data-'))n.dataset[k.slice(5).replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=v;else n.attrs[k]=v;}
  if(stack.length)stack[stack.length-1].children.push(n);else roots.push(n);
  if(!/\/$/.test(attrs)&&!['path','rect','br','img','input'].includes(tag))stack.push(n);
 }
 return roots;
}
function node(cls='',tagName='div'){
 const classes=new Set(cls.split(/\s+/).filter(Boolean)),listeners={},children=[];let inner='';
 const allChildren=()=>{const out=[];const visit=a=>a.forEach(x=>{out.push(x);visit(x.children)});visit(children);return out};
 const n={tagName,children,attrs:{},dataset:{},style:{setProperty(){}},disabled:false,hidden:false,isConnected:true,offsetWidth:0,offsetHeight:0,
  classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},
  set innerHTML(v){inner=v;children.splice(0,children.length,...parse(v))},get innerHTML(){return inner},
  setAttribute(k,v){this.attrs[k]=v},
  addEventListener(k,f){listeners[k]=f},dispatch(k,e={}){listeners[k]?.(e)},click(){this.onclick?.();listeners.click?.()},
  querySelector(s){return allChildren().find(x=>s.startsWith('.')&&x.classList.contains(s.slice(1)))||null},
  querySelectorAll(s){return allChildren().filter(x=>x.classList.contains(s.startsWith('.')?s.slice(1):s))},
  getBoundingClientRect(){return {left:0,top:0,width:120,height:80}},setPointerCapture(id){this.capture=id},hasPointerCapture(id){return this.capture===id},releasePointerCapture(){this.capture=null},focus(){}};
 return n;
}
function stage(){let nodes=[],html='';const all=()=>{const out=[];const visit=a=>a.forEach(n=>{out.push(n);visit(n.children)});visit(nodes);return out};return {get html(){return html},set innerHTML(v){html=v;nodes=parse(v)},querySelector(s){return all().find(n=>s.startsWith('.')&&n.classList.contains(s.slice(1)))||null},querySelectorAll(s){const c=s.startsWith('.')?s.slice(1):s;return all().filter(n=>n.classList.contains(c))},contains(n){return all().includes(n)}}}
function runtime(){const timers=[],ns={LettersArt:{icon:()=>'<svg/>',inkShift:()=>({dx:0,dy:0})}},box={window:{MiftahGame:ns,addEventListener(){},removeEventListener(){}},document:{createElement:()=>node()},setTimeout:(f,ms)=>{timers.push({f,ms});return timers.length},clearTimeout(){},setInterval:()=>1,clearInterval(){},performance:{now:()=>0}};for(const f of ['GardenPractice','MiniGames'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',f+'.js'),'utf8'),box);return {ns,timers}}
const item=(id,display,speak,parts)=>({id,display,speak,parts});
function harness(kind,{rounds=2}={}){
 const {ns,timers}=runtime(),s=stage(),outcomes=[],spoken=[],prompts=[];let done=0;
 const parts=[{id:'b',display:'ب',speak:'بَاءْ'},{id:'t',display:'ت',speak:'تَاءْ'}];
 const target=item('bt','بت','بَاءْ، تَاءْ',parts),other=item('jm','جم','جِيمْ، مِيمْ',[{id:'j',display:'ج',speak:'جِيمْ'},{id:'m',display:'م',speak:'مِيمْ'}]);
 const letters=[{id:'b',display:'ب',speak:'بَاءْ',joins:true},{id:'t',display:'ت',speak:'تَاءْ',joins:true},{id:'m',display:'م',speak:'مِيمْ',joins:true}];
 const ctx={items:[target,other],extraItems:letters,rounds,stage:s,setPrompt:(...x)=>prompts.push(x),say:x=>spoken.push(x),reportOutcome:e=>outcomes.push(e),sfx(){},confettiAt(){},onDone(){done++},reducedMotion:()=>true};
 const game=kind==='unfuse'?new ns.LettersMiniGames.unfuse(ctx):new ns.LettersMiniGames.parade(ctx);
 return {game,ctx,s,timers,outcomes,spoken,prompts,get done(){return done},target,other,letters};
}

test('Unfuse separates into unscored exploration, then requires the explicit find action before its quiz',()=>{
 const t=harness('unfuse');assert.equal(t.game.targets.length,2);assert.equal(t.game.phase,'pull');
 t.s.querySelector('.unfuse-open').onclick({detail:2});assert.equal(t.game.phase,'pull');assert.equal(t.outcomes.length,0);
 t.s.querySelector('.unfuse-open').click();assert.equal(t.game.phase,'explore');assert.equal(t.outcomes.length,1);assert.equal(t.outcomes[0].correct,undefined);assert.equal(t.game.roundIndex,0);assert.equal(t.done,0);
 const halves=t.s.querySelectorAll('.unfuse-half'),parts=t.game.targets[0].parts;assert.equal(halves.length,2);halves.forEach(b=>b.click());
 assert.ok(parts.every(p=>t.spoken.some(x=>x?.speak===p.speak)));assert.equal(t.outcomes.length,1);
 assert.equal(t.s.querySelector('.unfuse-found'),null);t.s.querySelector('.unfuse-find').click();assert.equal(t.game.phase,'quiz');assert.equal(t.game.roundIndex,0);assert.equal(t.outcomes.length,1);
});

test('Unfuse correct quiz shows a replay result and advances only once on Next',()=>{
 const t=harness('unfuse',{rounds:1});t.game.split();t.game.quiz();assert.equal(t.game.phase,'quiz');
 const prompt=t.prompts.at(-1)[0],oldChoices=t.s.querySelectorAll('.unfuse-pick');assert.ok(oldChoices.length>=2);assert.equal(t.game.roundIndex,0);assert.equal(t.done,0);
 const correct=oldChoices.find(b=>b.attrs['aria-label']===prompt.display);assert.ok(correct);correct.click();assert.equal(t.game.phase,'result');assert.equal(t.outcomes.length,2);assert.equal(t.done,0);
 const oldNext=t.s.querySelector('.unfuse-next'),oldFound=t.s.querySelector('.unfuse-found'),heard=t.spoken.length;oldFound.click();assert.equal(t.spoken.length,heard+1);assert.equal(t.outcomes.length,2);
 oldNext.click();oldNext.click();assert.equal(t.done,1);assert.equal(t.game.roundIndex,1);correct.click();oldNext.click();assert.equal(t.done,1);assert.equal(t.outcomes.length,2);
});

test('Parade reveals three contextual forms without paying; repeat reveals replay only',()=>{
 const t=harness('parade');assert.equal(t.game.letters.length,3);assert.equal(t.game.phase,'explore');const initial=t.outcomes.length,letter=t.game.letters[0];
 const spots=t.s.querySelectorAll('.parade-spot');assert.equal(spots.length,3);spots[0].click();const count=t.spoken.length;spots[0].click();assert.equal(t.spoken.length,count+1);assert.equal(t.outcomes.length,initial);assert.equal(t.game.dressed,1);
 assert.ok(t.s.querySelector('.parade-star').innerHTML.includes('ـ'));
 const heard=t.spoken.length;t.s.querySelector('.parade-star').click();t.s.querySelector('.parade-reference').click();assert.equal(t.spoken.length,heard+2);assert.ok(t.spoken.slice(-2).every(x=>x?.speak===letter.speak));assert.equal(t.outcomes.length,initial);
 spots[1].click();spots[2].click();assert.equal(t.game.dressed,3);assert.equal(t.outcomes.length,initial+1);assert.equal(t.game.roundIndex,0);assert.equal(t.done,0);
 assert.equal(t.outcomes.at(-1).skill,'contextual_forms');assert.equal(t.outcomes.at(-1).activity,'parade');assert.equal(t.outcomes.at(-1).correct,undefined);assert.equal(t.outcomes.at(-1).affectsStrength,false);
 assert.ok(t.s.querySelector('.parade-continue'));
});

test('Parade drag reveals only when released over the display and cancelled gestures stay unscored',()=>{
 const t=harness('parade'),display=t.s.querySelector('.parade-display');
 display.getBoundingClientRect=()=>({left:100,top:100,width:120,height:80});
 const [cancelled,outside,accepted]=t.s.querySelectorAll('.parade-spot');
 const drag=(spot,id,end)=>{
  spot.dispatch('pointerdown',{pointerId:id,isPrimary:true,pointerType:'touch',clientX:20,clientY:20});
  spot.dispatch('pointermove',{pointerId:id,isPrimary:true,clientX:end.x,clientY:end.y});
  if(end.cancel)spot.dispatch('pointercancel',{pointerId:id});
  else spot.dispatch('pointerup',{pointerId:id,isPrimary:true,clientX:end.x,clientY:end.y});
 };

 drag(cancelled,1,{x:150,y:140,cancel:true});
 assert.equal(cancelled.querySelector('.parade-form').hidden,true);
 assert.equal(t.game.dressed,0);assert.equal(t.outcomes.length,0);
 assert.equal(display.classList.contains('is-near'),false);

 drag(outside,2,{x:250,y:140});
 assert.equal(outside.querySelector('.parade-form').hidden,true);
 assert.equal(t.game.dressed,0);assert.equal(t.outcomes.length,0);

 drag(accepted,3,{x:150,y:140});
 assert.equal(accepted.querySelector('.parade-form').hidden,false);
 assert.equal(t.game.dressed,1);assert.equal(t.outcomes.length,0);
 accepted.dispatch('click');
 assert.equal(t.game.dressed,1,'the synthesized post-drag click can replay but cannot dress twice');
 assert.equal(t.outcomes.length,0);
});

test('Parade transfer is explicit, correct choice reports once, and stale controls cannot replay or advance later rounds',()=>{
 const t=harness('parade'),letter=t.game.letters[0];t.s.querySelectorAll('.parade-spot').forEach(b=>b.click());const oldSpots=t.s.querySelectorAll('.parade-spot');
 assert.equal(t.game.roundIndex,0);assert.equal(t.done,0);t.s.querySelector('.parade-continue').click();assert.equal(t.game.phase,'quiz');
 const oldChoices=t.s.querySelectorAll('.parade-choice'),current=t.game.letters[0],correct=oldChoices.find(b=>b.attrs['aria-label']===current.display);assert.ok(correct);correct.click();assert.equal(t.game.phase,'result');assert.equal(t.outcomes.length,2);
 const oldNext=t.s.querySelector('.parade-next'),heard=t.spoken.length;correct.click();assert.equal(t.spoken.length,heard+1);assert.equal(t.spoken.at(-1).speak,letter.speak);assert.equal(t.outcomes.length,2);oldNext.click();assert.equal(t.game.roundIndex,1);assert.equal(t.done,0);
 oldSpots[0].click();correct.click();oldNext.click();assert.equal(t.game.roundIndex,1);assert.equal(t.outcomes.length,2);
 t.game.destroy();oldNext.click();correct.click();assert.equal(t.done,0);assert.equal(t.outcomes.length,2);
});

test('Parade requires all three reveals and completes the three-round recall exactly once',()=>{
 const t=harness('parade');
 assert.equal(t.game.letters.length,3);
 for(let round=0;round<3;round++){
  const staleSpots=t.s.querySelectorAll('.parade-spot');
  const nextExplore=t.s.querySelector('.parade-continue');
  assert.equal(nextExplore.hidden,true);
  staleSpots[0].click();staleSpots[0].click();
  assert.equal(t.game.dressed,1,'repeating one form does not satisfy the other reveal slots');
  assert.equal(nextExplore.hidden,true);
  staleSpots[1].click();staleSpots[2].click();
  assert.equal(t.game.dressed,3);
  assert.equal(nextExplore.hidden,false);
  const participation=t.outcomes.filter(outcome=>outcome.correct===undefined).length;
  assert.equal(participation,round+1);
  nextExplore.click();nextExplore.click();
  assert.equal(t.game.roundIndex,round,'exploration continue is consumed once');
  const choices=t.s.querySelectorAll('.parade-choice');
  const correct=choices.find(button=>button.attrs['aria-label']===t.game.letters[round].display);
  assert.ok(correct);
  correct.click();
  assert.equal(t.outcomes.filter(outcome=>outcome.correct===true).length,round+1);
  const nextRecall=t.s.querySelector('.parade-next');
  nextRecall.click();nextRecall.click();
  assert.equal(t.game.roundIndex,round+1);
  staleSpots[0].click();
 }
 assert.equal(t.game.alive,false);
 assert.equal(t.done,1);
 assert.equal(t.outcomes.filter(outcome=>outcome.correct===true).length,3);
});
