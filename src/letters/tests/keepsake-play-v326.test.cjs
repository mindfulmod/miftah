const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function runtime(){const ns={LettersGardenArt:{seedBasket:()=>'<svg/>'}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../LettersJourney.js'),'utf8'),{window:{MiftahGame:ns}});return ns.LettersJourney;}
function button(kind){const classes=new Set(),attrs={'aria-pressed':'false'};return {dataset:{craft:kind},isConnected:true,offsetWidth:112,attrs,classes,getAttribute:k=>attrs[k],setAttribute:(k,v)=>attrs[k]=v,classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)}};}
const families=[['join-1','garland','Play with your lanterns'],['fatha','harvest','Bounce your fruit'],['long-sounds','jars','Shake your seed jars'],['words-2','raft','Rock your raft']];
test('earned craft toys appear only at completed chapters and keep the taught labels',()=>{
 const J=runtime();
 for(const [id,kind,label] of families){
  const world={id,items:()=>[{display:'بَ'},{display:'تُ'}]},progress={done:[]};
  assert.equal(J.memento(progress,world),'');progress.done.push(id);
  const before=JSON.stringify(progress),html=J.memento(progress,world);
  assert.match(html,/^<button type="button"/);assert.ok(html.includes(`data-craft="${kind}"`));
  assert.ok(html.includes(`aria-label="${label}"`));assert.match(html,/aria-pressed="false"/);
  assert.match(html,/بَ/);assert.match(html,/تُ/);assert.equal(JSON.stringify(progress),before);
 }
});
test('quick repeated keepsake taps remain responsive without queued callbacks or persisted rewards',()=>{
 const J=runtime();
 for(const [,kind] of families){
  const b=button(kind);assert.equal(J.playMemento(b),true);assert.equal(b.attrs['aria-pressed'],'true');assert.equal(b.classes.has('is-playing'),true);
  assert.equal(J.playMemento(b),true);assert.equal(b.attrs['aria-pressed'],'false');assert.equal(b.classes.has('is-playing'),true);
  assert.equal(J.playMemento(b),true);assert.equal(b.attrs['aria-pressed'],'true');
  assert.deepEqual(Object.keys(b.attrs),['aria-pressed'],'play adds only presentation state');
 }
});
test('reduced motion responds with static light and cancels the previous movement class',()=>{
 const J=runtime();
 for(const [,kind] of families){
  const b=button(kind);J.playMemento(b);J.playMemento(b,{reduced:true});
  assert.equal(b.classes.has('is-playing'),false);assert.equal(b.classes.has('is-awake'),false);
  J.playMemento(b,{reduced:true});assert.equal(b.classes.has('is-awake'),true);assert.equal(b.classes.has('is-playing'),false);
 }
});
test('retired or unrecognized map objects cannot react to stale taps',()=>{
 const J=runtime();const retired=button('garland');retired.isConnected=false;
 for(const b of [retired,button('unknown'),null])assert.equal(J.playMemento(b),false);
 assert.equal(retired.attrs['aria-pressed'],'false');assert.equal(retired.classes.size,0);
});
