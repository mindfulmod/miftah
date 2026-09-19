const {test}=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../../../docs/letter-garden/reviews/audio-confirmation/review-core.js');
const item={id:'lg-123456789abc',signature:'a'.repeat(64),parts:[{file:'clip.wav'}]};
const time='2026-09-18T12:00:00.000Z';

test('audio approval requires a complete listen and never approves an uncut item',()=>{
  assert.throws(()=>Core.update(Core.empty(),item,{verdict:'correct'},time),/Listen/);
  let state=Core.update(Core.empty(),item,{heard:true},time);
  state=Core.update(state,item,{verdict:'correct',note:'Clear name'},time);
  assert.equal(Core.current(item,state).verdict,'correct');
  for(const verdict of ['correct','fix','unsure'])assert.throws(()=>Core.update(state,{...item,parts:[]},{verdict},time),/no isolated clip/);
  const pending=Core.update(Core.empty(),{...item,parts:[]},{note:'Listen near 7 seconds'},time);
  assert.equal(Core.current(item,pending).verdict,'');
});
test('changed cuts invalidate approval and heard state while preserving the correction note',()=>{
  const approved=Core.update(Core.empty(),item,{heard:true,verdict:'correct',note:'Original note'},time);
  const changed={...item,signature:'b'.repeat(64)};
  const current=Core.current(changed,approved);
  assert.equal(current.stale,true);assert.equal(current.verdict,'');assert.equal(current.heardSignature,'');
  assert.equal(current.note,'Original note');assert.equal(current.previous,'correct');
  assert.throws(()=>Core.update(approved,changed,{verdict:'correct'},time),/Listen/);
  assert.equal(Core.counts([changed],approved).correct,0);
});
test('export round trip and merge retain independent reviews and newer corrections',()=>{
  const second={...item,id:'lg-abcdef012345'};
  let old=Core.update(Core.empty(),item,{heard:true,verdict:'correct'},time);
  let next=Core.update(Core.empty(),item,{verdict:'fix',note:'Ending cut off'},'2026-09-18T12:01:00.000Z');
  next=Core.update(next,second,{verdict:'unsure'},time);
  const merged=Core.merge(next,JSON.parse(JSON.stringify(old)));
  assert.equal(Core.current(item,merged).verdict,'fix');
  assert.equal(Core.current(second,merged).verdict,'unsure');
  assert.deepEqual(Core.counts([item,second],merged),{correct:0,fix:1,unsure:1,unreviewed:0,stale:0,ready:2});
});
test('clearing a decision retains notes and listening, malformed records are ignored',()=>{
  let state=Core.update(Core.empty(),item,{heard:true,verdict:'correct',note:'My note'},time);
  state=Core.update(state,item,{verdict:''},time);
  assert.equal(Core.current(item,state).note,'My note');assert.equal(Core.current(item,state).heardSignature,item.signature);
  assert.deepEqual(Core.clean({schemaVersion:2,decisions:state.decisions}),Core.empty());
  assert.deepEqual(Core.clean({schemaVersion:1,decisions:{'__proto__':{},'not-an-item':{},[item.id]:{signature:'bad'}}}),Core.empty());
  const safe=Core.update(state,item,{note:'<script>never execute me</script>'},time);
  assert.equal(Core.current(item,safe).note,'<script>never execute me</script>');
});
