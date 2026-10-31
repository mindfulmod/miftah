const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
function load() {
  const window={MiftahGame:{}},timers=new Map();let serial=0;
  const context={window,setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)};
  vm.runInNewContext(read('LetterFriends.js'),context);
  vm.runInNewContext(read('FriendBook.js'),context);
  return{Book:window.MiftahGame.GardenPractice.FriendBook,ns:window.MiftahGame,timers};
}
function classes() {
  const set=new Set();
  return {add:(...names)=>names.forEach(n=>set.add(n)),remove:(...names)=>names.forEach(n=>set.delete(n)),contains:n=>set.has(n),
    toggle(token,force){const on=arguments.length>1?!!force:!set.has(token);on?set.add(token):set.delete(token);return on;}};
}
function el() {
  return{attrs:{},style:{},disabled:false,innerHTML:'',textContent:'',isConnected:true,classList:classes(),
    setAttribute(k,v){this.attrs[k]=String(v);},getAttribute(k){return this.attrs[k];},focus(options){this.focused=true;this.focusOptions=options;},
    querySelector(){return null;},querySelectorAll(){return[];},getAnimations(){return[];}};
}
function fakeDOM() {
  const stage=el(),root=el(),spread=el(),friendBtn=el(),character=el(),letterBtn=el(),wordBtn=el(),wordInk=el(),wordText=el(),mark=el(),next=el(),prev=el(),close=el(),status=el();
  const friendSvg=el();
  character.querySelector=selector=>selector==='svg.lf'?friendSvg:null;
  wordInk.querySelector=selector=>selector==='.fb-word-text'?wordText:selector==='.fb-word-mark'?mark:null;
  const map={'.fb-spread':spread,'.fb-friend':friendBtn,'.fb-character':character,'.fb-letter-button':letterBtn,'.fb-word-button':wordBtn,'.fb-word-ink':wordInk,'.fb-next':next,'.fb-prev':prev,'.fb-close':close,'.fb-status':status};
  root.querySelector=selector=>map[selector]||null;
  root.querySelectorAll=()=>[spread,friendBtn,character,letterBtn,wordBtn,wordInk,next,prev,close,status];
  stage.querySelector=selector=>selector==='.fb-book'?root:null;
  return{stage,root,spread,friendBtn,character,friendSvg,letterBtn,wordBtn,wordInk,wordText,mark,next,prev,close,status};
}
function deferred() {let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};}
function setup(options={}) {
  const loaded=load(),dom=fakeDOM(),cancelled=[],done=[],prompts=[],sounds=[],spoken=[],animations=[];
  const ctx={stage:dom.stage,items:options.items||[{id:'b',display:'ب'},{id:'t',display:'ت'},{id:'th',display:'ث'}],known:options.known||[],
    completedWorldIds:options.completedWorldIds,worldId:options.worldId,startAt:options.startAt,random:()=>0,
    say:item=>{spoken.push(item);return options.say?options.say(item):Promise.resolve(false);},
    cancel:()=>cancelled.push(true),done:()=>done.push(true),prompt:item=>prompts.push(item),sfx:sound=>sounds.push(sound),reducedMotion:()=>!!options.reducedMotion};
  ctx.reportOutcome=()=>assert.fail('Friend Book reading must not report learning evidence');
  const book=new loaded.Book(ctx);
  // Initial page narration is part of the product behavior. Stop it immediately
  // unless a test intentionally drives the narration sequence itself.
  if(!options.keepInitialNarration){book.stop();spoken.length=0;sounds.length=0;}
  dom.spread.animate=()=>assert.fail('Page turning must not move tappable controls');
  dom.character.animate=frames=>{const animation={frames,cancelled:false,cancel(){this.cancelled=true;}};animations.push(animation);return animation;};
  return{...loaded,book,dom,ctx,cancelled,done,prompts,sounds,spoken,animations};
}
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function pendingWith(timers,ms){return[...timers.entries()].find(([,timer])=>timer.ms===ms);}

test('pagesFor combines known and current letters, filters locked/prerequisite rows and deduplicates IDs and glyphs',()=>{
  const {Book}=load(),rows=[
    {id:'b',display:'ب'},{id:'b',display:'ت'},{id:'b-again',display:'ب'},{id:'t',display:'ت'},
    {id:'locked',display:'ث',locked:true},{id:'blocked-copy',display:'ث'},
    {id:'unlearned',display:'ج',taught:false},{id:'prereq',display:'ح',prerequisiteWorldIds:['later']},
    {id:'unknown',display:'X'}
  ];
  const pages=Book.pagesFor({items:rows.slice(0,3),known:rows.slice(3),completedWorldIds:[]});
  assert.deepEqual(Array.from(pages,page=>page.id),['b','t']);
  assert.deepEqual(Array.from(Book.pagesFor({items:[rows[7]],worldId:'later',completedWorldIds:[]}),page=>page.id),['prereq']);
  assert.deepEqual(Array.from(Book.pagesFor({items:[rows[7]],worldId:'elsewhere',completedWorldIds:[]}),page=>page.id),[]);
});

test('startAt truncates and clamps to an integer page index; no pages cancel without completion',async()=>{
  for(const [startAt,expected] of [[1.8,1],[-10,0],[99,2],[Infinity,0]]){
    const f=setup({startAt});assert.equal(f.book.at,expected);f.book.stop();
  }
  const f=setup({items:[{id:'b',display:'ب',locked:true}]});await Promise.resolve();
  assert.equal(f.book.alive,false);assert.deepEqual(f.cancelled,[true]);assert.equal(f.done.length,0);
});

test('the letter button speaks the plain letter; the word button speaks the whole joined friend name',async()=>{
  const f=setup(),g=f.book;g.ctx.say=item=>{f.spoken.push(item);return Promise.resolve(true);};
  await g.narrate('letter');
  assert.equal(f.dom.friendSvg.classList.contains('is-plain'),true);
  assert.equal(f.dom.letterBtn.getAttribute('aria-pressed'),'true');
  assert.equal(f.spoken.at(-1).display,'ب');
  const before=f.spoken.length;await g.narrate('word');
  assert.equal(f.dom.friendSvg.classList.contains('is-plain'),false);
  assert.equal(f.dom.letterBtn.getAttribute('aria-pressed'),'false');
  assert.equal(f.spoken.length,before+1);assert.equal(f.spoken.at(-1).display,f.ns.LetterFriends.get('ب').word);
  assert.equal(f.spoken.at(-1).display,'بَطَّة');
});

test('story narration sequences the letter, friend call and word only after each step completes',async()=>{
  const f=setup(),g=f.book,first=deferred(),word=deferred();
  g.ctx.say=item=>{f.spoken.push(item);return f.spoken.length===1?first.promise:word.promise;};
  const reading=g.narrate('story');
  assert.deepEqual(f.spoken.map(item=>item.display),['ب']);
  first.resolve(true);await flush();
  const pause=pendingWith(f.timers,180);assert.ok(pause,'the story pause follows successful letter speech');
  pause[1].fn();await flush();
  assert.deepEqual(f.sounds,['friend-duck']);
  const callPause=pendingWith(f.timers,420);assert.ok(callPause,'the friend call has its own pause');
  callPause[1].fn();await flush();
  assert.deepEqual(f.spoken.map(item=>item.display),['ب','بَطَّة']);
  word.resolve(true);await reading;
  assert.equal(g.telling,false);assert.equal(f.dom.friendBtn.getAttribute('aria-busy'),'false');
});

test('duplicate story taps do not overlap, while explicit letter or word taps interrupt the story',async()=>{
  for(const part of ['letter','word']){
    const f=setup(),g=f.book,first=deferred(),second=deferred();let count=0;
    g.ctx.say=()=>{count++;return count===1?first.promise:second.promise;};
    const story=g.narrate('story');const same=g.narrate('story');
    assert.equal(count,1);assert.equal(g.pending.size,1);
    const direct=g.narrate(part);assert.equal(count,2);assert.equal(g.telling,true);
    first.resolve(true);second.resolve(true);await Promise.all([story,same,direct]);
    assert.equal(count,2);assert.equal(f.dom.friendSvg.classList.contains('is-plain'),part==='letter');
  }
});

test('turning pages cancels old speech and pauses even when old speech settles late',async()=>{
  for(const settle of ['resolve','reject']){
    const f=setup(),g=f.book,old=deferred();let calls=[];
    g.ctx.say=item=>{calls.push(item);return calls.length===1?old.promise:Promise.resolve(false);};
    const narration=g.narrate('story');
    const deadline=pendingWith(f.timers,6000);assert.ok(deadline);
    g.turn(1);
    if(settle==='resolve')old.resolve(true);else old.reject(new Error('late playback failure'));
    await narration;await flush();
    assert.equal(g.at,1);assert.equal(calls.filter(item=>item.display===f.ns.LetterFriends.get('ب').word).length,0);
    assert.equal(g.telling,false);
  }
  const f=setup(),g=f.book,letter=deferred();let count=0;g.ctx.say=()=>++count===1?letter.promise:Promise.resolve(false);
  const narration=g.narrate('story');
  // Finish the first letter so that the story is waiting on its independent pause.
  letter.resolve(true);await flush();
  const pause=pendingWith(f.timers,180);assert.ok(pause);
  const late=pause[1].fn;g.turn(1);late();await narration;await flush();
  assert.deepEqual(f.sounds,['page']);
});

test('a hung utterance has a six-second deadline even with reduced motion enabled',async()=>{
  const f=setup({reducedMotion:true}),g=f.book;g.ctx.say=()=>new Promise(()=>{});
  const narration=g.narrate('letter');
  const deadline=pendingWith(f.timers,6000);assert.ok(deadline,'speech timeout is fixed independently of motion preference');
  deadline[1].fn();await narration;
  assert.equal(g.telling,false);assert.equal(g.pending.size,0);
});

test('close and destroy clear outstanding timers, ignore stale speech and cannot finish twice',async()=>{
  const f=setup(),g=f.book,utterance=deferred();g.ctx.say=()=>utterance.promise;
  const narration=g.narrate('story');const stale=[...f.timers.values()].map(timer=>timer.fn);
  f.dom.close.onclick();f.dom.close.onclick();
  assert.equal(f.done.length,1);assert.equal(f.timers.size,0);assert.equal(g.claimed,true);
  utterance.resolve(true);for(const run of stale)run();await narration;await flush();
  assert.equal(f.spoken.length,0);assert.equal(f.done.length,1);

  const second=setup(),book=second.book,never=deferred();book.ctx.say=()=>never.promise;
  const pending=book.narrate('word');const oldTimers=[...second.timers.values()].map(timer=>timer.fn);book.destroy();
  assert.equal(second.timers.size,0);never.reject(new Error('late'));for(const run of oldTimers)run();await pending;await flush();
  assert.equal(book.alive,false);assert.equal(second.spoken.length,0);assert.equal(second.done.length,0);
});

test('keyboard navigation focuses the hero when the next-page control becomes unavailable',()=>{
  const f=setup();f.book.turn(1,true);
  assert.equal(f.book.at,1);assert.equal(f.dom.next.disabled,false);
  f.book.turn(1,true);
  assert.equal(f.book.at,2);assert.equal(f.dom.next.disabled,true);
  assert.equal(f.dom.friendBtn.focused,true);assert.equal(f.dom.friendBtn.focusOptions.preventScroll,true);
});

test('page motion only moves the illustration, is retargetable and respects reduced motion',()=>{
  const f=setup();f.book.turn(1);assert.equal(f.animations.length,1);
  f.book.turn(1);assert.equal(f.animations[0].cancelled,true);assert.equal(f.animations.length,2);
  f.book.destroy();assert.equal(f.animations[1].cancelled,true);
  const still=setup({reducedMotion:true});still.book.turn(1);assert.equal(still.animations.length,0);
});

test('classList.toggle follows browser semantics when its force argument is omitted',()=>{
  const f=setup(),g=f.book;
  const svg=f.dom.friendSvg.classList;
  svg.add('is-plain');g.setPlain();
  assert.equal(svg.contains('is-plain'),false);
  g.setPlain(true);assert.equal(svg.contains('is-plain'),true);
});
