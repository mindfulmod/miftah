const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture(kind='Feed',tried=[]){
 const nodes=new Map(),outcomes=[],cues=[];let ctx,html='',payouts=0;
 const node=()=>({isConnected:true,dataset:{},classList:{add(){}},querySelector:s=>nodes.get(s)});
 for(const s of ['.practice-replay','.practice-heading','.practice-stage','.lg-action-help','.feed-creature'])nodes.set(s,node());
 const screen=node(),target={id:'ba',display:'ب',parts:[{display:'ب'},{display:'ا'}]};
 const ns={LettersArt:{icon:()=>''},LettersStrength:{recordOutcome:o=>(outcomes.push(o),true)},LettersActionCue:{hand:'<svg/>',mount:options=>{const cue={options,destroyed:0,destroy(){this.destroyed++}};cues.push(cue);return cue;}}};
 const context={window:{MiftahGame:ns},console,performance:{now:()=>100},setTimeout:()=>1,clearTimeout(){}};
 for(const file of ['LettersLearning','LettersGame'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../'+file+'.js'),'utf8'),context);
 const Mini=class{constructor(c){ctx=c;c.setPrompt(target);c.setupActionCue({source:nodes.get('.practice-stage'),type:'drag',automatic:c.firstActionDemo});}};
 const Toy=class{constructor(c){ctx=c;c.prompt(target);}};
 ns.LettersMiniGames={feed:Mini,build:Mini};ns.ToyBoxGames={KINDS:['LetterFishing','DotNests']};ns.GardenPractice={LetterFishing:Toy,DotNests:Toy,WaterGarden:Toy,GardenPaths:Toy};
 const shell=Object.create(ns.LettersGame.prototype);
 Object.assign(shell,{session:{world:{id:'test'},items:[target]},progress:{done:[]},worlds:{worlds:[]},sound:{play(){}},loadJSON:()=>tried,knownItems:()=>[target],
 screen:(_kind,markup)=>(html=markup,screen),topBar:()=>'',wireTopBar(){},petSVG:()=>'',fitStage(){},keepFocus(){},petLife:()=>null,
 finishBloom(){},payPractice(){payouts++;return true;}});
 shell.startPractice(kind,()=>{});
 return{shell,ctx,screen,target,outcomes,cues,html,payouts:()=>payouts};
}
for(const kind of ['Feed','Workshop']){
 test(`${kind}: first standalone visit receives existing gesture help; repeat visit remains optional`,()=>{
  const first=fixture(kind);assert.equal(first.ctx.firstActionDemo,true);assert.equal(first.cues[0].options.automatic,true);assert.match(first.html,/class="lg-action-help"/);
  const repeat=fixture(kind,[kind]);assert.equal(repeat.ctx.firstActionDemo,false);assert.equal(repeat.cues[0].options.automatic,false);assert.equal(typeof repeat.ctx.setupActionCue,'function');
 });
 test(`${kind}: showing the answer marks learning assisted and a successful outcome retires help`,()=>{
  const r=fixture(kind);r.cues[0].options.onShow();r.ctx.reportOutcome({itemId:'ba',correct:true,evidence:kind==='Workshop'?'motor_assembly_participation':'supported_visible_matching'});
  assert.equal(r.outcomes.length,1);assert.equal(r.outcomes[0].assisted,true);assert.equal(r.outcomes[0].evidence,'assisted_response');assert.equal(r.cues[0].destroyed,1);assert.equal(r.shell.actionCue,null);
 });
 test(`${kind}: unused optional help preserves the original evidence and a new prompt clears assistance`,()=>{
  const r=fixture(kind,[kind]);const evidence=kind==='Workshop'?'motor_assembly_participation':'supported_visible_matching';
  r.ctx.reportOutcome({itemId:'ba',correct:true,evidence});assert.equal(r.outcomes[0].assisted,false);assert.equal(r.outcomes[0].evidence,evidence);
  r.ctx.setPrompt({id:'next',display:'ت'});r.ctx.setupActionCue({source:{},type:'drag'});r.cues.at(-1).options.onShow();r.ctx.reportOutcome({itemId:'next',correct:true,evidence});
  r.ctx.setPrompt({id:'last',display:'ث'});r.ctx.reportOutcome({itemId:'last',correct:true,evidence});assert.equal(r.outcomes.at(-1).assisted,false);
 });
}
test('own Fishing and Dot Nests assistance callbacks remain delegated, with stale screens gated',()=>{
 for(const kind of ['LetterFishing','DotNests']){const r=fixture(kind);let calls=0;r.ctx.setupActionCue({source:{},onShow:()=>calls++});r.cues[0].options.onShow();assert.equal(calls,1);r.screen.isConnected=false;r.cues[0].options.onShow();assert.equal(calls,1);}
});
test('finishing or cancelling prevents retained helpers from changing learning or paying twice',()=>{
 for(const finish of [true,false]){const r=fixture();const show=r.cues[0].options.onShow;if(finish)r.ctx.done();else r.ctx.cancel();show();r.ctx.reportOutcome({itemId:'ba',correct:true,evidence:'supported_visible_matching'});r.ctx.done();assert.equal(r.outcomes.length,0);assert.equal(r.payouts(),finish?1:0);}
});
test('unrelated practice does not gain another control or tutorial callback',()=>{
 const r=fixture('GardenPaths');assert.equal(r.ctx.setupActionCue,undefined);assert.doesNotMatch(r.html,/class="lg-action-help"/);
});

test('WaterGarden exposes the hand control for its new pull action',()=>{
 const r=fixture('WaterGarden');assert.equal(typeof r.ctx.setupActionCue,'function');assert.equal(r.ctx.firstActionDemo,true);assert.match(r.html,/Show me how to lift a water gate/);
});
