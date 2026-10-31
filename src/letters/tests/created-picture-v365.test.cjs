const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const png=n=>'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg'+Buffer.from(n).toString('base64');
function fixture({kind='LetterStudio',onDone=null,options={},full=false}={}){
 let ctx,payouts=0,returns=0,finished=null;const gardens=[],nodes=new Map();
 const node=()=>({isConnected:true,dataset:{},classList:{add(){}},querySelector:s=>nodes.get(s)});
 for(const key of ['.practice-stage','.practice-heading','.practice-replay'])nodes.set(key,node());
 const el=node(),ns={LettersArt:{icon:()=>''}},window={MiftahGame:ns};
 for(const file of ['LettersState','LettersGame'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file+'.js'),'utf8'),{window,console,setTimeout:()=>1,clearTimeout(){}});
 const item={id:'ب',display:'ب'};const Toy=class{constructor(c){ctx=c;c.prompt(item)}};
 ns.GardenPractice={LetterStudio:Toy,ColourFriend:Toy};ns.ToyBoxGames={KINDS:['ColourFriend']};
 const game=Object.create(ns.LettersGame.prototype);
 Object.assign(game,{session:{world:{id:'test'},items:[item]},worlds:{worlds:[]},progress:{done:[]},sound:{play(){}},savedDrawings:{art1:png('old'),...(full?{art2:png('two'),art3:png('three')}:{})},gardenLayout:{slots:[null,null,null,null]},
 loadJSON:()=>[],saveJSON:()=>true,knownItems:()=>[item],screen:()=>el,topBar:()=>'',wireTopBar(){},petSVG:()=>'',fitStage(){},keepFocus(){},petLife:()=>null,
 payPractice(){payouts++;return true},finishBloom(_el,go,_friend,paid,replay,creation){finished={go,paid,replay,creation}},renderDecoratingGarden(key){gardens.push(key)},chooseDrawingSlot:async()=>null});
 game.startPractice(kind,()=>returns++,onDone,options);
 return{game,ctx,el,gardens,payouts:()=>payouts,returns:()=>returns,finish:()=>finished,ns};
}
for(const kind of ['LetterStudio','ColourFriend'])test(kind+': a successful save offers that exact picture, with one reward and no automatic placement',async()=>{
 const f=fixture({kind});const image=png('new');assert.equal(await f.ctx.saveDrawing(image,'ب'),true);
 f.ctx.done();f.ctx.done();assert.equal(f.payouts(),1);assert.deepEqual(f.gardens,[]);
 assert.equal(f.finish().creation.picture,image);f.finish().creation.open();assert.deepEqual(f.gardens,['art2']);
 assert.equal(f.game.gardenLayout.slots.every(value=>value===null),true);assert.equal(f.returns(),0);
});
test('existing art alone, failed saves and cancelled choices do not offer a creation',async()=>{
 for(const mode of ['none','failed','cancelled']){
  const f=fixture({full:mode==='cancelled'});if(mode==='failed')f.game.saveJSON=()=>false;
  if(mode!=='none')assert.equal(await f.ctx.saveDrawing(png('new')),mode==='failed'?false:null);
  f.ctx.done();assert.equal(f.finish().creation,null);f.finish().go();assert.equal(f.returns(),1);
 }
});
test('adventure and direct-return completions retain their route without a decorating detour',async()=>{
 const adventure=fixture({onDone(){}});await adventure.ctx.saveDrawing(png('new'));adventure.ctx.done();assert.equal(adventure.finish().creation,null);
 const direct=fixture({options:{directDone:true}});await direct.ctx.saveDrawing(png('new'));direct.ctx.done();assert.equal(direct.finish(),null);assert.equal(direct.returns(),1);
});
test('a completed picture invitation is inert after leaving its screen',async()=>{
 const f=fixture();await f.ctx.saveDrawing(png('new'));f.ctx.done();f.el.isConnected=false;f.finish().creation.open();assert.deepEqual(f.gardens,[]);
});
test('picture finish art embeds only bounded local thumbnails and retains earned-star art',()=>{
 const window={MiftahGame:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','PracticeFinishArt.js'),'utf8'),{window});const art=window.MiftahGame.PracticeFinishArt;
 const own=art.scene({picture:png('new'),paid:true});assert.ok(own.includes(png('new')));assert.match(own,/x="315" y="12"/);
 for(const picture of ['https://example.test/photo.png','data:image/png;base64," onload="bad'])assert.doesNotMatch(art.scene({picture}),/<image/);
 assert.doesNotMatch(art.scene(),/<image/);
});
