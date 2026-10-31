const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load() {
  const window = {MiftahGame:{}}, timers = new Map(); let id = 0;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../SoundLab.js'),'utf8'), {
    window,
    setTimeout: (fn,delay) => { timers.set(++id,{fn,delay}); return id; },
    clearTimeout: key => timers.delete(key)
  });
  return {Lab:window.MiftahGame.GardenPractice.SoundLab,timers};
}
function node() {
  const classes = new Set();
  return {innerHTML:'',disabled:false,isConnected:true,attrs:{},classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},
    setAttribute(k,v){this.attrs[k]=v;},querySelectorAll:()=>[],querySelector:()=>null,focus(){this.focused=true;}};
}
function makeLab(Lab, timers, letters, marks) {
  const spoken=[],prompts=[],sounds=[], letterSlot=node(),markSlot=node(),mix=node(),out=node(),press=node(),strip=node();
  const pickers={letters:node(),marks:node()};
  const lab=Object.assign(Object.create(Lab.prototype),{alive:true,busy:false,letters,marks,letter:letters[0],mark:null,current:null,made:[],pages:{letters:0,marks:0},makeToken:0,makeTimer:null,
    ctx:{say:item=>{spoken.push(item);},prompt:item=>prompts.push(item),sfx:s=>sounds.push(s),reducedMotion:()=>true},
    slotLetter:letterSlot,slotMark:markSlot,mix,out,press,strip,pickers});
  lab.renderHistory=()=>{}; lab.refresh=()=>{};
  return {lab,spoken,prompts,sounds,letterSlot,markSlot,mix,out,press,strip,pickers,timers};
}
function finishOne(lab,timers) { lab.tryMake(); const timer=[...timers.entries()].at(-1); assert.ok(timer,'mix schedules its completion'); timers.delete(timer[0]); timer[1].fn(); }

function constructorDOM() {
  const root=node(),stage=node(),parts={
    '.lab-ingredient.is-letter':node(),'.lab-ingredient.is-mark':node(),'.lab-out':node(),'.lab-console':node(),'.lab-strip':node(),'.lab-mix':node()
  };
  const picker=()=>{const p=node(),tray=node(),prev=node(),next=node();p.querySelector=selector=>selector==='.lab-tray'?tray:selector==='.lab-prev'?prev:selector==='.lab-next'?next:null;return p;};
  const pickers={marks:picker(),letters:picker()};
  root.querySelector=selector=>parts[selector]||(/^\[data-kind="(marks|letters)"\]$/.test(selector)?pickers[selector.match(/"(.*?)"/)[1]]:null);
  stage.querySelector=selector=>selector==='.lab-workshop'?root:null;
  return {stage,root,parts,pickers};
}
function construct(Lab,items,marks,extra={}) {
  const dom=constructorDOM(),cancelled=[];
  const ctx={stage:dom.stage,items,marks,cancel:()=>cancelled.push('cancel'),prompt(){},say(){},...extra};
  const lab=new Lab(ctx);
  return {lab,dom,cancelled};
}

test('ingredient catalog admits taught consonants and allowed marks, while blocking alif and duplicates',()=>{
  const {Lab}=load();
  const rows=[
    {id:'b',display:'ب'}, {id:'b-copy',display:'ب'}, {id:'t',display:'ت',taught:false},
    {id:'alif',display:'ا'}, {id:'locked',display:'ث',locked:true}, {id:'waw',display:'و'},
    {id:'jeem',display:'ج',prerequisiteWorldIds:['prior']}, {id:'jeem-2',display:'ج'}
  ];
  assert.deepEqual(Array.from(Lab.taughtLetters(rows,{completedWorldIds:[]}),x=>x.id),['b','waw']);
  assert.deepEqual(Array.from(Lab.taughtLetters(rows,{completedWorldIds:[],worldId:'prior'}),x=>x.id),['b','waw','jeem']);
  assert.deepEqual(Array.from(Lab.taughtLetters([{id:'blocked',display:'د',taught:false},{id:'open',display:'د'}],{})),[],'a blocked duplicate glyph stays blocked');
  assert.deepEqual(Object.keys(Lab.MARK_NAMES).sort(),[...Array.from('ًٌٍَُِّْ'),'ِّ','ُّ'].sort());
});

test('constructor keeps only unique supported marks and cancels when either ingredient pool is empty',async()=>{
  const {Lab}=load(),items=[{id:'b',display:'ب'},{id:'b-again',display:'ب'},{id:'alif',display:'ا'}];
  const built=construct(Lab,items,['َ','x','َ','ّ',' ']);
  assert.deepEqual(Array.from(built.lab.marks),['َ','ّ']);
  assert.equal(built.lab.alive,true);
  const noLetters=construct(Lab,[{id:'alif',display:'ا'}],['َ']);
  const noMarks=construct(Lab,items,['unknown']);
  await Promise.resolve();
  assert.equal(noLetters.lab.alive,false); assert.deepEqual(noLetters.cancelled,['cancel']);
  assert.equal(noMarks.lab.alive,false); assert.deepEqual(noMarks.cancelled,['cancel']);
});

test('busy state keeps Mix keyboard-focusable while marking it unavailable to assistive technology',()=>{
  const {Lab}=load(),f=construct(Lab,[{id:'b',display:'ب'}],['َ']);
  f.lab.mark='َ'; f.lab.busy=true; f.lab.refresh();
  assert.equal(f.dom.parts['.lab-mix'].disabled,false);
  assert.equal(f.dom.parts['.lab-mix'].attrs['aria-disabled'],'true');
  assert.equal(f.dom.parts['.lab-mix'].attrs['aria-busy'],'true');
});

test('changing ingredients cancels a pending generation so a stale callback cannot play',()=>{
  const {Lab,timers}=load(), letters=[{id:'b',display:'ب'}],marks=['ْ','ّ'];
  const f=makeLab(Lab,timers,letters,marks),{lab,spoken}=f;
  lab.mark='ْ'; lab.tryMake(); const stale=[...timers.values()][0].fn;
  lab.pickMark('ّ');
  assert.equal(lab.busy,false); assert.equal(timers.size,0);
  stale();
  assert.equal(lab.current,null); assert.equal(spoken.length,0);
});

test('unknown marks and repeated activation cannot queue extra mixes',()=>{
  const {Lab,timers}=load(),f=makeLab(Lab,timers,[{id:'b',display:'ب'}],['َ']);
  f.lab.mark='?'; f.lab.tryMake(); assert.equal(timers.size,0);
  f.lab.mark='َ'; f.lab.tryMake(); f.lab.tryMake();
  assert.equal(timers.size,1); assert.equal(f.lab.busy,true);
});

test('mix delay follows reduced-motion preference',()=>{
  const {Lab,timers}=load(),normal=makeLab(Lab,timers,[{id:'b',display:'ب'}],['َ']);
  normal.lab.mark='َ'; normal.lab.ctx.reducedMotion=()=>false; normal.lab.tryMake();
  assert.equal([...timers.values()][0].delay,320);
  normal.lab.destroy();
  const quick=makeLab(Lab,timers,[{id:'t',display:'ت'}],['َ']);
  quick.lab.mark='َ'; quick.lab.tryMake();
  assert.equal([...timers.values()].at(-1).delay,0);
});

test('destroy cancels pending work and makes even a delivered callback inert',()=>{
  const {Lab,timers}=load(), f=makeLab(Lab,timers,[{id:'b',display:'ب'}],['َ']);
  let disconnected=0,animationsCancelled=0;
  f.lab.mark='َ'; f.lab.tryMake(); const stale=[...timers.values()][0].fn;
  f.lab.observer={disconnect(){disconnected++;}};
  f.lab.root={querySelectorAll:()=>[{getAnimations:()=>[{cancel(){animationsCancelled++;}},{cancel(){animationsCancelled++;}}]}]};
  f.lab.destroy(); stale();
  assert.equal(f.lab.alive,false); assert.equal(timers.size,0); assert.equal(disconnected,1); assert.equal(animationsCancelled,2);
  assert.equal(f.lab.current,null); assert.equal(f.spoken.length,0); assert.equal(f.prompts.length,0);
});

test('an old delivered callback cannot discard the handle of a newer mix',()=>{
  const {Lab,timers}=load(),{lab,spoken}=makeLab(Lab,timers,[{id:'b',display:'ب'}],['َ','ِ']);
  lab.mark='َ'; lab.tryMake(); const stale=[...timers.values()][0].fn;
  lab.pickMark('ِ'); lab.tryMake(); const currentHandle=lab.makeTimer;
  stale();
  assert.equal(lab.makeTimer,currentHandle);
  assert.equal(spoken.length,0);
  lab.destroy();
  assert.equal(timers.size,0,'leaving still clears the current timer');
});

test('history deduplicates by sound, moves a replayed sound to front, and stays bounded at eight',()=>{
  const {Lab,timers}=load(), letters=[{id:'b',display:'ب'},{id:'t',display:'ت'},{id:'j',display:'ج'}],marks=['َ','ِ','ُ','ْ'];
  const {lab}=makeLab(Lab,timers,letters,marks);
  for(let i=0;i<10;i++) { lab.letter=letters[Math.floor(i/4)%3]; lab.mark=marks[i%4]; lab.current=null; finishOne(lab,timers); }
  assert.equal(lab.made.length,8);
  const repeated=lab.made[3]; lab.letter=letters.find(x=>x.id===repeated.letterId); lab.mark=repeated.mark; lab.current=null; finishOne(lab,timers);
  assert.equal(lab.made.length,8); assert.equal(lab.made[0].item.display,repeated.item.display);
  assert.equal(lab.made.filter(entry=>entry.item.display===repeated.item.display).length,1);
});

test('history replay restores both ingredients and their pages before replaying the sound',()=>{
  const {Lab,timers}=load(), letters=Array.from({length:8},(_,i)=>({id:`l${i}`,display:'بتثجحخدذ'[i]})),marks=['َ','ِ','ُ','ْ','ً','ٍ','ٌ','ّ'];
  const {lab,spoken}=makeLab(Lab,timers,letters,marks);
  const item=Lab.soundItem('ذ','ّ'),entry={item,letterId:'l7',mark:'ّ'}; lab.made=[entry];
  const rendered=[]; lab.renderTray=kind=>rendered.push(kind); lab.refresh=()=>{};
  lab.revisit(entry);
  assert.equal(lab.letter.id,'l7'); assert.equal(lab.mark,'ّ');
  assert.deepEqual(lab.pages,{letters:2,marks:2}); assert.equal(lab.current,item);
  assert.deepEqual(rendered,['letters','marks']); assert.equal(spoken.at(-1),item);
});

test('exploration never reports an outcome and unavailable speech leaves the toy usable',()=>{
  const {Lab,timers}=load(),f=makeLab(Lab,timers,[{id:'b',display:'ب'}],['َ']);
  f.lab.mark='َ'; f.lab.ctx.reportOutcome=()=>assert.fail('Sound Lab must not award or report learning evidence');
  finishOne(f.lab,timers);
  assert.equal(f.lab.made.length,1); assert.equal(f.spoken.length,1);
  f.lab.ctx.say=()=>Promise.reject(new Error('speech unavailable'));
  assert.doesNotThrow(()=>f.lab.safeSay(f.lab.current));
  f.lab.ctx.say=()=>{throw new Error('speech unavailable');};
  assert.doesNotThrow(()=>f.lab.safeSay(f.lab.current));
});

test('keyboard paging is clamped, advances the page and focuses a newly visible tile',()=>{
  const {Lab,timers}=load(),f=makeLab(Lab,timers,Array.from({length:8},(_,i)=>({id:`l${i}`,display:'بتثجحخدذ'[i]})),['َ']);
  const tile=node(),picker={querySelector:selector=>selector==='.lab-tile'?tile:null}; f.lab.pickers.letters=picker;
  f.lab.renderTray=()=>{}; f.lab.page=Lab.prototype.page;
  f.lab.page('letters',1,true);
  assert.equal(f.lab.pages.letters,1); assert.equal(tile.focused,true); assert.deepEqual(f.sounds,['page']);
  f.lab.page('letters',99,true); assert.equal(f.lab.pages.letters,2);
  f.lab.page('letters',1,true); assert.equal(f.lab.pages.letters,2);
  f.lab.page('letters',-1,false); assert.equal(f.lab.pages.letters,1);
});
