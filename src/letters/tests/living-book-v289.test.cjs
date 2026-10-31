const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
function load() {
  const window={MiftahGame:{}},timers=new Map();let serial=0;
  const context={window,setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)};
  vm.runInNewContext(read('LetterFriends.js'),context);
  vm.runInNewContext(read('LivingBooks.js'),context);
  return{LivingBook:window.MiftahGame.GardenPractice.LivingBook,LivingBooks:window.MiftahGame.LivingBooks,ns:window.MiftahGame,timers};
}
function classList() {
  const values=new Set();
  return {add:(...tokens)=>tokens.forEach(x=>values.add(x)),remove:(...tokens)=>tokens.forEach(x=>values.delete(x)),contains:x=>values.has(x),
    toggle(token,force){const on=arguments.length>1?!!force:!values.has(token);on?values.add(token):values.delete(token);return on;},replace(from,to){if(!values.has(from))return false;values.delete(from);values.add(to);return true;}};
}
function parseButtons(html) {
  return [...String(html).matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(([,attrs,body])=>{
    const button=el();button.className=(attrs.match(/class="([^"]*)"/)||[])[1]||'';
    for(const name of button.className.split(/\s+/).filter(Boolean))button.classList.add(name);
    button.dataset.w=(attrs.match(/data-w="([^"]*)"/)||[])[1];button.dataset.word=(attrs.match(/data-word="([^"]*)"/)||[])[1];
    button.textContent=body.replace(/<[^>]*>/g,'');return button;
  });
}
function el() {
  let html='';
  const node={attrs:{},dataset:{},style:{},classList:classList(),disabled:false,hidden:false,innerHTML:'',textContent:'',isConnected:true,onclick:null,
    setAttribute(k,v){this.attrs[k]=String(v);},getAttribute(k){return this.attrs[k];},focus(options){this.focused=true;this.focusOptions=options;},
    insertAdjacentHTML(_where,more){this.innerHTML+=more;},querySelector(){return null;},querySelectorAll(){return[];},getAnimations(){return[];}};
  Object.defineProperty(node,'innerHTML',{get(){return html;},set(value){html=String(value);}});
  return node;
}
function fakeDOM() {
  const stage=el(),root=el(),art=el(),text=el(),next=el(),prev=el(),finish=el(),again=el(),status=el(),indicators=[el(),el(),el(),el(),el(),el()];
  const map={'.lb-art':art,'.lb-text':text,'.lb-next':next,'.lb-prev':prev,'.lb-finish':finish,'.lb-again':again,'.lb-status':status};
  root.dataset={};root.querySelector=s=>map[s]||null;
  root.querySelectorAll=s=>s==='[data-page]'?indicators:[];
  stage.querySelector=s=>s==='.lb-bound'?root:null;
  art.querySelector=s=>(s==='.lb-flap, .lb-guess'||s==='.lb-flap'||s==='.lb-guess')&&(art.innerHTML.includes('class="lb-flap')||art.innerHTML.includes('class="lb-guess'))?art.opener:null;
  Object.defineProperty(art,'innerHTML',{get(){return art._html||'';},set(value){art._html=String(value);art.opener=null;if(art._html.includes('class="lb-flap')||art._html.includes('class="lb-guess'))art.opener=el();}});
  Object.defineProperty(text,'innerHTML',{get(){return text._html||'';},set(value){text._html=String(value);text.buttons=parseButtons(text._html);}});
  text.insertAdjacentHTML=(_where,more)=>{const added=parseButtons(more);text._html=(text._html||'')+more;text.buttons=[...(text.buttons||[]),...added];};
  text.querySelectorAll=selector=>{
    const all=text.buttons||[];
    if(selector.includes('.lb-reveal'))return text._html?.includes('class="lb-line lb-reveal"')?all.filter(b=>b.closestReveal):[];
    if(selector==='.lb-word')return all;
    if(selector.includes('.is-said')||selector.includes('.is-trying')||selector.includes('.is-waiting'))return all.filter(b=>['is-said','is-trying','is-waiting'].some(c=>b.classList.contains(c)));
    return[];
  };
  text.querySelector=selector=>selector==='.lb-reveal'&&text._html?.includes('class="lb-line lb-reveal"')?{classList:classList()}:null;
  // Mark generated answer buttons as reveal descendants after insertion.
  const insert=text.insertAdjacentHTML;
  text.insertAdjacentHTML=(_where,more)=>{const before=(text.buttons||[]).length;insert(_where,more);if(more.includes('lb-reveal'))text.buttons.slice(before).forEach(b=>b.closestReveal=true);};
  return{stage,root,art,text,next,prev,finish,again,status,indicators};
}
function setup({bookId='where',known,items,completedWorldIds,worldId,reducedMotion=false,say,done,onRead,stopSpeech,testPages}={}) {
  const loaded=load(),dom=fakeDOM(),cancelled=[],doneCalls=[],readCalls=[],speeches=[],sounds=[],stopCalls=[];
  if(testPages)loaded.LivingBooks.BOOKS.push({id:'test-pages',cover:'ب',title:'مَا هٰذَا؟',kind:'guess',pages:()=>testPages});
  const friends=loaded.ns.LetterFriends;
  const knownRows=known||[{id:'b',display:'ب'}];
  const ctx={stage:dom.stage,bookId:testPages?'test-pages':bookId,known:knownRows,items:items||[],completedWorldIds,worldId,
    say:item=>{speeches.push(item);return say?say(item):Promise.resolve(false);},
    cancel:()=>cancelled.push(true),done:()=>{doneCalls.push(true);done?.();},onRead:id=>{readCalls.push(id);onRead?.(id);},
    stopSpeech:()=>{stopCalls.push(true);stopSpeech?.();},sfx:s=>sounds.push(s),reducedMotion:()=>reducedMotion};
  ctx.reportOutcome=()=>assert.fail('Living Books must not award assessment credit');
  const book=new loaded.LivingBook(ctx);
  // Constructor starts the cover narration; cancel it so each behavior test
  // begins from a quiet page with no leftover fake deadlines.
  if(book.alive)book.stop();speeches.length=0;sounds.length=0;stopCalls.length=0;
  return{...loaded,book,dom,ctx,cancelled,doneCalls,readCalls,speeches,sounds,stopCalls,friends};
}
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function timerFor(timers,ms){return[...timers.entries()].find(([,timer])=>timer.ms===ms);}
function runTimer(timers,id){const timer=timers.get(id);assert.ok(timer,`timer ${id} remains pending`);timers.delete(id);timer.fn();}
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};}
async function drainRead(book,timers,limit=40){
  for(let i=0;i<limit;i++){
    await flush();if(!book.reading)return;
    const entry=[...timers.entries()].find(([,timer])=>timer.ms!==6000);
    if(entry)runTimer(timers,entry[0]);else await flush();
  }
  assert.fail('read did not settle within the controlled speech and pause sequence');
}

test('castFor keeps only eligible known/current friends, de-duplicated by ID and glyph without padding',()=>{
  const {LivingBooks}=load(),rows=[
    {id:'b',display:'ب'},{id:'b',display:'ت'},{id:'b-copy',display:'ب'},{id:'t',display:'ت'},
    {id:'locked',display:'ث',locked:true},{id:'blocked-copy',display:'ث'},
    {id:'untaught',display:'ج',taught:false},{id:'prereq',display:'ح',prerequisiteWorldIds:['later']}
  ];
  assert.deepEqual(Array.from(LivingBooks.castFor({known:rows.slice(0,3),items:rows.slice(3),completedWorldIds:[]}),x=>x),['ب','ت']);
  assert.deepEqual(Array.from(LivingBooks.castFor({known:[rows[7]],completedWorldIds:[],worldId:'elsewhere'})),[]);
  assert.deepEqual(Array.from(LivingBooks.castFor({known:[rows[7]],completedWorldIds:[],worldId:'later'})),['ح']);
});

test('one known friend supplies all four story choices without inventing a larger cast',()=>{
  const f=setup({bookId:'what'}),catalog=f.LivingBooks.catalog(f.ctx);
  assert.deepEqual(Array.from(f.book.cast),['ب']);
  assert.deepEqual(Array.from(catalog,b=>b.id),['where','what','morning','night']);
  assert.deepEqual(Array.from(catalog,b=>b.pages(['ب']).length),[1,1,2,2]);
  assert.equal(f.book.pages.length,2,'the selected story keeps its cover and one known-friend page');
});

test('an empty eligible cast cancels and never calls done',async()=>{
  const f=setup({known:[{id:'locked',display:'ب',locked:true}],items:[]});await Promise.resolve();
  assert.equal(f.book.alive,false);assert.deepEqual(f.cancelled,[true]);assert.equal(f.doneCalls.length,0);
});

test('a flap opens once, while replay reads the visible question and answer together',async()=>{
  const f=setup({say:()=>Promise.resolve(false)}),g=f.book;g.turn(1);
  const opener=f.dom.art.opener;assert.ok(opener);const opening=g.open(opener),pause=timerFor(f.timers,280);assert.ok(pause);
  runTimer(f.timers,pause[0]);await opening;await flush();
  assert.equal(g.opened.has(g.at),true);assert.equal(g.revealed,true);
  assert.equal((f.dom.text.innerHTML.match(/class="lb-line lb-reveal"/g)||[]).length,1);
  f.speeches.length=0;g.ctx.say=item=>{f.speeches.push(item);return Promise.resolve(true);};
  const replay=g.replayPrompt();await drainRead(g,f.timers);await replay;
  assert.ok(f.speeches.some(item=>item.display.startsWith('أَيْنَ')),'the question is replayed');
  assert.ok(f.speeches.some(item=>item.display==='هٰذِهِ')&&f.speeches.some(item=>item.display==='بَطَّة!'),'the revealed answer is replayed');
});

test('page turns cancel pending narration and obsolete delays cannot continue the old page',async()=>{
  const known=[{id:'b',display:'ب'},{id:'t',display:'ت'},{id:'th',display:'ث'}];
  const first=deferred(),f=setup({bookId:'what',known,say:()=>first.promise}),g=f.book;
  const reading=g.read(),old=timerFor(f.timers,6000);assert.ok(old);
  const stale=old[1].fn,newPageWords=[];g.ctx.say=item=>{newPageWords.push(item.display);return Promise.resolve(false);};
  g.turn(1);first.resolve(true);stale();await reading;await flush();
  assert.equal(g.at,1);assert.equal(g.reading,false);assert.equal(g.pending.size,0);
  assert.equal(newPageWords.length,1,'late speech from the retired page cannot advance it');

  const f2=setup({bookId:'what',known}),g2=f2.book;let count=0;
  g2.ctx.say=()=>++count===1?Promise.resolve(true):Promise.resolve(false);
  const delayed=g2.read();await flush();const pause=timerFor(f2.timers,90);assert.ok(pause);
  const obsolete=pause[1].fn;g2.turn(1);obsolete();await delayed;await flush();
  assert.equal(count,2,'the canceled pause cannot start another old-page word');assert.equal(g2.at,1);
});

test('rejected and hung speech release read controls; the hung deadline stays six seconds in reduced motion',async()=>{
  const rejected=setup({say:()=>Promise.reject(new Error('unavailable'))}),g=rejected.book;g.turn(1);
  await flush();assert.equal(g.reading,false);assert.equal(rejected.dom.again.getAttribute('aria-busy'),'false');
  const hung=setup({reducedMotion:true,say:()=>new Promise(()=>{})}),book=hung.book;book.turn(1);
  const reading=book.read(),deadline=timerFor(hung.timers,6000);assert.ok(deadline);
  runTimer(hung.timers,deadline[0]);await reading;await flush();
  assert.equal(book.reading,false);assert.equal(hung.dom.again.getAttribute('aria-busy'),'false');
});

test('the last page never finishes by itself; explicit Finish records one read and one completion',async()=>{
  const f=setup({bookId:'night',say:()=>Promise.resolve(false)}),g=f.book;g.turn(1);g.turn(1);
  await flush();
  assert.equal(g.at,g.pages.length-1);assert.equal(g.claimed,false);assert.equal(f.readCalls.length,0);assert.equal(f.doneCalls.length,0);
  assert.equal(f.timers.size,0,'the final page schedules no automatic completion');
  assert.equal(f.dom.finish.hidden,false);assert.equal(f.dom.finish.disabled,false);
  f.dom.finish.onclick();f.dom.finish.onclick();g.end();
  assert.equal(g.claimed,true);assert.deepEqual(f.readCalls,['night']);assert.equal(f.doneCalls.length,1);
});

function blankPages(){return Array.from({length:4},(_,i)=>({text:`مَا هٰذَا؟ بَطَّة بَعْدُ ${i}`,complete:[1,'ب'],art:{bodiless:'ب'},reveal:'هٰذِهِ بَطَّة!'}));}

test('the picture blank waits without finishing; tapping it resumes the blank and following words',async()=>{
  const f=setup({testPages:blankPages(),say:()=>Promise.resolve(true)}),g=f.book;
  for(let i=0;i<4;i++)g.turn(1);
  await drainRead(g,f.timers);
  const blank=g.waiting?.button;assert.ok(blank);assert.equal(blank.classList.contains('lb-blank'),true);
  assert.equal(f.doneCalls.length,0);
  f.speeches.length=0;
  const resumed=g.tapWord(blank);await drainRead(g,f.timers);await resumed;
  assert.equal(blank.classList.contains('is-filled'),true);
  assert.ok(f.speeches.some(item=>item.display==='بَطَّة'),"the child's picture choice completes the blank");
  assert.ok(f.speeches.some(item=>item.display==='بَعْدُ'),'reading continues through the remaining words');
  assert.equal(f.doneCalls.length,0);
});

test('going away from an opened page and back preserves its reveal and filled blank',async()=>{
  const f=setup({testPages:blankPages(),say:()=>Promise.resolve(false)}),g=f.book;
  for(let i=0;i<4;i++)g.turn(1);
  const questionBefore=(g.textEl.buttons||[]).find(button=>button.classList.contains('lb-blank'));
  assert.ok(questionBefore);
  const opener=f.dom.art.opener,opening=g.open(opener),pause=timerFor(f.timers,280);assert.ok(pause);
  runTimer(f.timers,pause[0]);await opening;await flush();
  const blank=(g.textEl.buttons||[]).find(button=>button.classList.contains('lb-blank'));
  assert.equal(blank,questionBefore,'appending the reveal keeps the live question button node');
  await g.tapWord(blank);assert.equal(blank.classList.contains('is-filled'),true);
  assert.equal(g.opened.has(g.at),true);
  g.turn(-1);g.turn(1);
  const restored=(g.textEl.buttons||[]).find(button=>button.classList.contains('lb-blank'));
  assert.equal(g.opened.has(g.at),true);assert.equal(g.revealed,true);
  assert.equal(restored.classList.contains('is-filled'),true);
  assert.equal((f.dom.text.innerHTML.match(/class="lb-line lb-reveal"/g)||[]).length,1);
});

test('early end is ignored and the final hidden friend cannot be recorded before reveal',async()=>{
  const f=setup({say:()=>Promise.resolve(false)}),g=f.book;
  g.end();assert.equal(f.readCalls.length,0);assert.equal(f.doneCalls.length,0);
  g.turn(1);assert.equal(g.at,g.pages.length-1);assert.equal(g.revealed,false);
  g.end();assert.equal(f.readCalls.length,0);assert.equal(f.doneCalls.length,0);assert.equal(f.dom.finish.disabled,true);
  const opening=g.open(f.dom.art.opener),pause=timerFor(f.timers,280);assert.ok(pause);runTimer(f.timers,pause[0]);await opening;
  assert.equal(g.revealed,true);assert.equal(f.dom.finish.disabled,false);
  g.end();g.end();assert.deepEqual(f.readCalls,['where']);assert.equal(f.doneCalls.length,1);
});

test('destroy cancels the delayed friend cue and makes a late speech result inert',async()=>{
  const cue=setup({say:()=>Promise.resolve(false)}),g=cue.book;g.turn(1);
  const opening=g.open(cue.dom.art.opener),delay=timerFor(cue.timers,280);assert.ok(delay);const staleCue=delay[1].fn;
  g.destroy();staleCue();await opening;await flush();
  assert.equal(cue.sounds.includes('friend-duck'),false);assert.equal(cue.timers.size,0);

  const late=deferred(),f=setup({bookId:'what',say:()=>late.promise}),book=f.book,reading=book.read();
  const deadline=timerFor(f.timers,6000);assert.ok(deadline);const staleSpeech=deadline[1].fn;
  book.destroy();late.resolve(true);staleSpeech();await reading;await flush();
  assert.equal(f.timers.size,0);assert.equal(f.speeches.length,1,'a resolved utterance cannot speak the next stale word');
  assert.equal(book.reading,false);assert.equal(f.doneCalls.length,0);
});
