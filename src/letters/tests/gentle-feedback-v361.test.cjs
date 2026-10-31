const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=n=>fs.readFileSync(path.join(__dirname,'..',n),'utf8');
function fixture(){
  let now=1000,still=false;const timers=[],created=[],motions=[],events={};
  function node(){const classes=new Set();return {isConnected:true,style:{},dataset:{},children:[],offsetWidth:80,listeners:{},
    classList:{add(...s){s.forEach(x=>classes.add(x))},remove(...s){s.forEach(x=>classes.delete(x))},contains:s=>classes.has(s),toggle(s,v){v?classes.add(s):classes.delete(s)}},
    appendChild(n){this.children.push(n);n.parentElement=this},setAttribute(){},getAttribute(){return null},
    querySelector(){return null},querySelectorAll(){return []},getBoundingClientRect(){return {left:20,top:50,width:80,height:80}},
    addEventListener(k,f){(this.listeners[k]??=[]).push(f)},removeEventListener(){},contains(n){return n===this},
    closest(){return null},matches(){return true},animate(frames,options){motions.push({node:this,frames,options});return {cancel(){}}},remove(){this.isConnected=false}};}
  const document={createElement(){const n=node();created.push(n);return n},querySelectorAll:()=>[]};
  const window={MiftahGame:{Haptics:{pulse(){}}},addEventListener:(k,f)=>events[k]=f};
  const ctx={window,document,performance:{now:()=>now},Date,getComputedStyle:el=>({animationName:el.motion||'none'}),setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length},clearTimeout(){}};
  vm.runInNewContext(read('LettersGame.js'),ctx);
  const g=Object.create(window.MiftahGame.LettersGame.prototype),root=node(),stage=node(),button=node(),neighbor=node();
  root.dataset.attention='learn';stage.appendChild(button);stage.appendChild(neighbor);
  button.closest=s=>s==='button, [role=button], .pop-bubble, .catch-faller, .map-stop, .meet-bud, .meet-piece, [data-tap]'?button:s==='.practice-stage, .play-stage'?stage:null;
  Object.assign(g,{root,initFriendLife(){},unlockSpeech(){},prefersReducedMotion:()=>still,sound:{enabled:true,press(){},unlock(){},play(){}}});g.initTouchFeedback();
  const press=()=>root.listeners.pointerdown[0]({target:button,clientX:60,clientY:90,button:0,isPrimary:true});
  return {g,button,neighbor,stage,created,motions,timers,press,release:()=>events.pointerup(),still:v=>still=v,time:v=>now=v};
}
test('a correct touch acknowledges only the touched piece, with no flash, rays, board or neighbour motion',()=>{
  const f=fixture();f.press();assert.ok(f.button.classList.contains('is-pressed'));f.release();f.g.feel.hit();
  assert.ok(f.button.classList.contains('is-hit'));assert.equal(f.created.length,1,'only the persistent touch layer exists');
  assert.equal(f.created[0].children.length,0,'no ripple, flash or impact decoration during a learning task');
  assert.equal(f.motions.length,0,'the board and neighbouring choices never recoil');
  assert.equal(f.button.disabled,undefined,'visual acknowledgement cannot lock input');
  f.press();assert.ok(!f.button.classList.contains('is-hit'),'next touch interrupts feedback immediately');
});
test('retry assistance and easing survive removal of the combat feedback',()=>{
  const f=fixture();let hints=0;f.g.feel.guide=()=>hints++;f.press();
  for(let i=0;i<6;i++)f.g.feel.miss();
  assert.equal(f.g.easeUp,true);assert.equal(f.g._missStreak,6);
  f.timers.filter(t=>t.ms===30).forEach(t=>t.fn());assert.ok(hints>0);
  for(let i=0;i<5;i++)f.g.feel.hit();
  assert.equal(f.g.easeUp,false);assert.equal(f.g._missStreak,0);
  assert.equal(f.motions.length,0);assert.equal(f.created[0].children.length,0,'comebacks and streaks do not escalate visually');
});
test('reduced motion retains a still success state; stale input never creates feedback',()=>{
  const f=fixture();f.still(true);f.press();f.g.feel.hit();
  assert.ok(f.button.classList.contains('is-won-still'));assert.equal(f.motions.length,0);
  f.timers.filter(t=>t.ms===900).forEach(t=>t.fn());assert.ok(!f.button.classList.contains('is-won-still'));
  f.still(false);f.time(3000);f.g.feel.hit();assert.ok(!f.button.classList.contains('is-hit'));
});
