const {test}=require('node:test');
const assert=require('node:assert/strict');
const {ns,saveDrawing,png}=require('./helpers/drawing-save.cjs');
const full=()=>({art1:png('first'),art2:png('second'),art3:png('third')});

test('a fourth picture waits for a choice; cancellation never writes',async()=>{
 const initial=full();let choose,writes=0;
 const target={savedDrawings:initial,chooseDrawingSlot:()=>new Promise(r=>{choose=r}),saveJSON(){writes++;return true}};
 const pending=saveDrawing.call(target,png('fourth'));
 assert.equal(target.savedDrawings,initial);assert.equal(writes,0);choose(null);
 assert.equal(await pending,null);assert.equal(target.savedDrawings,initial);assert.equal(writes,0);
});
test('only the explicitly chosen picture changes, with one persisted write',async()=>{
 const initial=full(),writes=[];
 const target={savedDrawings:initial,chooseDrawingSlot:async()=> 'art2',saveJSON(key,value){writes.push({key,value});return true}};
 assert.equal(await saveDrawing.call(target,png('fourth')),true);
 assert.equal(target.savedDrawings.art1,initial.art1);assert.equal(target.savedDrawings.art3,initial.art3);
 assert.equal(target.savedDrawings.art2,png('fourth'));assert.equal(writes.length,1);
 assert.equal(writes[0].key,'quran-trainer:letters:drawings');assert.equal(writes[0].value,target.savedDrawings);
});
test('uses a missing art place and preserves eight tracing keepsakes',async()=>{
 const initial=Object.fromEntries(Array.from({length:8},(_,i)=>['l'+i,png(String(i))]));initial.art2=png('older');initial.art3=png('newer');
 const target={savedDrawings:initial,saveJSON:()=>true};
 assert.equal(await saveDrawing.call(target,png('page')),true);
 for(const [key,value] of Object.entries(initial))assert.equal(target.savedDrawings[key],value);
 assert.equal(target.savedDrawings.art1,png('page'));assert.equal(Object.keys(target.savedDrawings).length,11);
});
test('invalid or reload-oversized pictures never reach storage',async()=>{
 for(const url of [null,'','https://example.test/image.png','data:image/jpeg;base64,AAAA','data:image/png;base64,not-base64',png('A'.repeat(60000))]){
  const initial=full();let writes=0;const target={savedDrawings:initial,saveJSON(){writes++;return true}};
  assert.equal(await saveDrawing.call(target,url),false);assert.equal(target.savedDrawings,initial);assert.equal(writes,0);
 }
});
test('storage refusal and exceptions preserve memory and page ownership',async()=>{
 for(const fail of [()=>false,()=>{throw new Error('quota')}]){
  const initial=full(),slots=new Map([['old','art2']]);const target={savedDrawings:initial,chooseDrawingSlot:async()=> 'art2',saveJSON:fail};
  assert.equal(await saveDrawing.call(target,png('page'),'new',slots),false);assert.equal(target.savedDrawings,initial);assert.deepEqual([...slots],[['old','art2']]);
 }
});
test('leaving or a concurrent save during selection cannot overwrite newer state',async()=>{
 for(const leave of [true,false]){
  const initial=full(),el={isConnected:true};let choose,writes=0;
  const target={savedDrawings:initial,chooseDrawingSlot:()=>new Promise(r=>{choose=r}),saveJSON(){writes++;return true}};
  const pending=saveDrawing.call(target,png('fourth'),undefined,new Map(),el);
  if(leave)el.isConnected=false;else target.savedDrawings={...initial,art3:png('newer')};
  const expected=target.savedDrawings;choose('art1');assert.equal(await pending,leave?null:false);assert.equal(writes,0);assert.equal(target.savedDrawings,expected);
 }
});
test('reusing a place revokes its previous page ownership',async()=>{
 const slots=new Map([['old','art2']]);let choices=0;
 const target={savedDrawings:full(),chooseDrawingSlot:async()=>{choices++;return 'art2'},saveJSON:()=>true};
 assert.equal(await saveDrawing.call(target,png('new'),'new',slots),true);assert.equal(slots.has('old'),false);assert.equal(slots.get('new'),'art2');
 assert.equal(await saveDrawing.call(target,png('edit'),'new',slots),true);assert.equal(choices,1);
});
test('repeated tracing protects art and displayed signs, including repeat traces',()=>{
 let drawings={...full(),...Object.fromEntries(Array.from({length:8},(_,i)=>['l'+i,png(String(i))]))};const layout={slots:['sign:l0','sign:l2']},initial=drawings;
 assert.equal(ns.LettersState.keepDrawing(drawings,'l0',png('changed'),layout),null);
 for(let i=8;i<28;i++)drawings=ns.LettersState.keepDrawing(drawings,'l'+i,png(String(i)),layout);
 for(const key of ['art1','art2','art3','l0','l2'])assert.equal(drawings[key],initial[key]);
 assert.equal(Object.keys(drawings).length,11);
 assert.equal(ns.LettersState.keepDrawing(initial,'new',png('new'),{slots:Array.from({length:8},(_,i)=>'sign:l'+i)}),null);
});
test('all saved pictures survive normalization and remain available as garden signs',()=>{
 const initial={...full(),...Object.fromEntries(Array.from({length:8},(_,i)=>['l'+i,png(String(i))]))};const drawings=ns.LettersState.normalize('quran-trainer:letters:drawings',initial,{});
 assert.deepEqual(JSON.parse(JSON.stringify(drawings)),initial);const catalog=ns.LettersDecorations.catalog({savedDrawings:drawings});
 assert.equal(catalog.filter(item=>item.kind==='sign').length,11);
 assert.deepEqual(Array.from(ns.LettersDecorations.visibleSlots({slots:['sign:art1','sign:l0']},catalog)).slice(0,2),['sign:art1','sign:l0']);
 const repaired=ns.LettersState.normalize('drawings',{...initial,newer:png('n'),invalid:'not png'},{});
 assert.equal(Object.keys(repaired).length,11);assert.equal(repaired.art1,initial.art1);assert.equal(repaired.invalid,undefined);
});
