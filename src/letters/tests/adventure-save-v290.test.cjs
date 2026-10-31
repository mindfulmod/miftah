const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const plain=x=>JSON.parse(JSON.stringify(x));
function fixture(){
 const ns={GardenPractice:{},LettersArt:{icon:()=>'<svg/>'},LetterDelivery:{icon:()=>'<svg/>'},LettersGardenArt:{practicePicture:()=>'<svg/>'}},window={MiftahGame:ns};
 for(const file of ['WaterGarden.js','GardenAdventure.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../'+file),'utf8'),{window,Date,Math});
 let saved=ns.GardenAdventureState.begin(null,'bird',[{id:'ا'},{id:'ب'}],'route'),failing=false,screen;
 const payments=[];let stamps=0;
 const g={loadJSON:()=>plain(saved),saveJSON:(_,value)=>{if(failing)return false;saved=plain(value);return true;},payPractice:kind=>payments.push(kind),stampToday:()=>stamps++,petSVG:()=>'<svg/>'};
 const a=new ns.GardenAdventure(g);a.render=()=>{a.rendered=true;};
 a.shell=()=>{if(screen)screen.isConnected=false;const button={disabled:false,focus(){}};screen={isConnected:true,querySelector:()=>button};return screen;};
 return {a,g,ns,payments,get saved(){return saved;},get stamps(){return stamps;},get screen(){return screen;},fail(value){failing=value;}};
}
test('failed adventure completion pays nothing, keeps the route unchanged, and retries once',()=>{
 const f=fixture();f.fail(true);
 assert.equal(f.a.complete('route',0,true),false);
 assert.equal(f.saved.active.step,0);assert.equal(f.payments.length,0);
 const stale=f.screen.querySelector();stale.onclick();assert.equal(f.payments.length,0);
 f.fail(false);assert.equal(f.a.complete('route',0,true),false,'a duplicate completion cannot bypass the pending save retry');stale.onclick();stale.onclick();
 assert.equal(f.saved.active.step,1);assert.deepEqual(f.payments,['LetterDelivery']);assert.equal(f.a.rendered,true);
});
test('failed project writes preserve the drawing and channels for the next successful completion',()=>{
 const f=fixture();f.fail(true);
 const drawing={letter:'ب',strokes:[{color:'hsl(320 62% 54%)',points:[[10,20],[60,80]]}]};
 assert.equal(f.a.patchProject('bird',{drawing}),false);
 assert.equal(f.a.patchProject('bird',{water:{bloomed:[true,true,false]}}),false);
 assert.equal(f.saved.projects.bird.drawing,null);
 assert.deepEqual(plain(f.a.read().projects.bird.drawing),drawing);
 f.fail(false);f.a.complete('route',0,false);
 assert.deepEqual(f.saved.projects.bird.drawing,drawing);assert.deepEqual(f.saved.projects.bird.water.bloomed,[true,true,false]);
 assert.equal(f.a.draft,null);
});
test('leaving free play waits for its pending water save before returning',()=>{
 const f=fixture();f.fail(true);f.a.patchProject('bird',{water:{open:[true,false,true]}});f.a.returnToGarden();
 assert.equal(f.a.rendered,undefined);assert.equal(f.payments.length,0);
 f.fail(false);f.screen.querySelector().onclick();
 assert.deepEqual(f.saved.projects.bird.water.open,[true,false,true]);assert.equal(f.a.rendered,true);assert.equal(f.payments.length,0);
});
test('only a persisted final step stamps the day, and detached retry controls are inert',()=>{
 const f=fixture();f.a.complete('route',0,false);f.a.complete('route',1,false);f.fail(true);
 f.a.complete('route',2,false);const detached=f.screen;
 assert.equal(f.stamps,0);assert.equal(f.saved.projects.bird.complete,false);
 detached.isConnected=false;f.fail(false);detached.querySelector().onclick();assert.equal(f.stamps,0);
 f.a.retrySave(f.a.pendingCommit);f.screen.querySelector().onclick();
 assert.equal(f.stamps,1);assert.equal(f.saved.active.stamped,true);assert.equal(f.saved.projects.bird.complete,true);
 assert.equal(f.a.complete('route',2,false),false);assert.equal(f.stamps,1);
});
test('throwing or unknown storage results do not claim a saved adventure',()=>{
 const f=fixture();f.g.saveJSON=()=>{throw Error('quota');};assert.equal(f.a.save(f.saved),false);
 f.g.saveJSON=()=>undefined;assert.equal(f.a.save(f.saved),false);
});
test('the game keeps its pending adventure draft when the child returns from the village',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../LettersGame.js'),'utf8'),ns={LettersArt:{},GardenAdventure:class{constructor(){this.visits=0;}returnToGarden(){return ++this.visits;}}};
 vm.runInNewContext(source,{window:{MiftahGame:ns}});const g=Object.create(ns.LettersGame.prototype);
 assert.equal(g.renderWalk(),1);assert.equal(g.renderWalk(),2);
});
test('adventure art uses distinct completed habitats, retains water, and bounds the childs sign',()=>{
 const ns={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../GardenAdventurePlayArt.js'),'utf8'),{window:{MiftahGame:ns}});
 const art=ns.GardenAdventurePlayArt;
 const bird=art.scene('bird',3),butterfly=art.scene('butterfly',3);
 assert.notEqual(bird,butterfly);assert.match(bird,/ga-scene-visitor/);assert.match(bird,/#62cdf4/);
 assert.doesNotMatch(art.scene('bird',1),/ga-scene-visitor/);
 const hostile=art.scene('bird',2,{strokes:[{color:'url(javascript:evil)',points:[[0,0],[9999,-20]]}]});
 assert.doesNotMatch(hostile,/javascript|9999|-20/);assert.match(hostile,/0,0L800,0/);
 assert.equal(art.visitorPlacement('bird').y,140);
});
