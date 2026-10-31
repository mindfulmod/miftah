const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');

function fixture(sprout=true){
  const callbacks=[],pending=new Map();let next=0,visits=0;
  function node(){const listeners=new Map(),flags=new Set();return {isConnected:true,classList:{add:x=>flags.add(x),remove:x=>flags.delete(x),toggle(){},contains:x=>flags.has(x)},setAttribute(){},
    addEventListener(k,f){if(!listeners.has(k))listeners.set(k,new Set());listeners.get(k).add(f)},removeEventListener(k,f){listeners.get(k)?.delete(f)},emit(k,e={}){for(const f of [...(listeners.get(k)||[])])f({button:0,pointerId:1,preventDefault(){},...e})}};}
  const home=node(),sound=node(),el={isConnected:true,className:'lg-play',querySelector:s=>s==='.lg-home-btn'?home:s==='.lg-sound'?sound:null};
  const window=node(),document=node();window.MiftahGame={LettersArt:{}};document.hidden=false;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','LettersGame.js'),'utf8'),{window,document,setTimeout(fn,ms){callbacks.push(fn);pending.set(++next,{fn,ms});return next},clearTimeout:id=>pending.delete(id)});
  const game=Object.create(window.MiftahGame.LettersGame.prototype);Object.assign(game,{sprout,root:{contains:e=>e===el&&el.isConnected},sound:{enabled:true,play(){}},renderVillage(){visits++}});game.wireTopBar(el);
  const fire=()=>{for(const [id,{fn}] of [...pending]){pending.delete(id);fn()}};
  return {home,el,game,window,document,pending,callbacks,fire,visits:()=>visits};
}

test('a detached screen cannot navigate when its old Home hold expires',()=>{
  const f=fixture();f.home.emit('pointerdown');f.el.isConnected=false;f.fire();assert.equal(f.visits(),0);
});
test('Home hold cancellation makes old callbacks inert, including after a new press',()=>{
  const f=fixture();f.home.emit('pointerdown');f.home.emit('pointerup');f.home.emit('pointerdown',{pointerId:2});
  f.callbacks[0]();assert.equal(f.visits(),0);f.fire();assert.equal(f.visits(),1);f.callbacks.at(-1)();assert.equal(f.visits(),1);
});
test('only the owning primary pointer can start or end a Home hold',()=>{
  const f=fixture();f.home.emit('pointerdown',{button:2});assert.equal(f.pending.size,0);
  f.home.emit('pointerdown',{isPrimary:false});assert.equal(f.pending.size,0);
  f.home.emit('pointerdown');f.home.emit('pointerdown',{pointerId:2});f.home.emit('pointerup',{pointerId:2});
  assert.equal(f.pending.size,1);f.fire();assert.equal(f.visits(),1);
});
test('blur, pointer cancellation and a hidden tab stop an in-progress Home hold',()=>{
  for(const cancel of [f=>f.home.emit('blur'),f=>f.home.emit('pointercancel'),f=>f.window.emit('blur'),f=>{f.document.hidden=true;f.document.emit('visibilitychange')},f=>f.game.cancelHomeHold()]){
    const f=fixture();f.home.emit('pointerdown');cancel(f);f.callbacks[0]();assert.equal(f.visits(),0);assert.equal(f.home.classList.contains('is-holding'),false);
  }
});
test('intentional hold, tap navigation and keyboard activation each leave once',()=>{
  const hold=fixture();hold.home.emit('pointerdown');assert.equal([...hold.pending.values()][0].ms,800);hold.fire();hold.fire();assert.equal(hold.visits(),1);
  const key=fixture();key.home.emit('keydown',{key:'Enter',repeat:true});assert.equal(key.visits(),0);key.home.emit('keydown',{key:'Enter'});key.home.emit('keydown',{key:'Enter'});assert.equal(key.visits(),1);
  const tap=fixture(false);tap.home.emit('click');tap.home.emit('click');assert.equal(tap.visits(),1);
  const old=fixture(false);old.el.isConnected=false;old.home.emit('click');assert.equal(old.visits(),0);
});
