const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function game(world){const window={MiftahGame:{LettersArt:{icon:()=>'<svg></svg>',keyMascot:()=>''}}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../LettersGame.js'),'utf8'),{window});const g=Object.create(window.MiftahGame.LettersGame.prototype);g.session={world};return g;}
test('chapter pictures follow the real game sequence and completion without mutating it',()=>{const world={id:'pack-smile',games:['pairs','trace','pop']};const g=game(world),route=g.journeyRoute(1);assert.ok(route.indexOf('Match letters, completed')<route.indexOf('Draw letters'));assert.ok(route.indexOf('Draw letters')<route.indexOf('Pond letters'));assert.equal((route.match(/class="journey-stop is-done"/g)||[]).length,1);assert.deepEqual(world.games,['pairs','trace','pop']);});
test('reference journey styling stays restricted to the first two chapters',()=>{for(const id of ['daily','checkup','fatha','pack-little']){const g=game({id,games:['pop']});assert.equal(g.isReferenceJourney(),false);assert.equal(g.journeyRoute(),'');}assert.equal(game({id:'pack-boat'}).isReferenceJourney(),true);});

test('gentle daily trail follows its activities through completion with distinct signs',()=>{
  const g=game({id:'daily',games:['pop','catch','build']});
  g.session.daily=true;
  for(let step=0;step<=3;step++){
    const route=g.journeyRoute(step);
    assert.match(route,/aria-label="Daily activities"/);
    assert.equal((route.match(/role="listitem"/g)||[]).length,3);
    assert.equal((route.match(/is-done/g)||[]).length,step);
    assert.equal((route.match(/aria-current="step"/g)||[]).length,step<3?1:0);
    assert.ok(route.indexOf('Pond letters')<route.indexOf('Catch fruit'));
    assert.ok(route.indexOf('Catch fruit')<route.indexOf('Build with letters'));
    if(step<3) assert.match(route,new RegExp(`aria-current="step" aria-label="${['Pond letters','Catch fruit','Build with letters'][step]}"`));
    const pictures=[...route.matchAll(/<svg viewBox="0 0 48 48".*?<\/svg>/g)].map(m=>m[0]);
    assert.equal(new Set(pictures).size,3,'each activity has its own picture');
  }
});

test('all available daily activities have names and pictures, without adding a challenge trail',()=>{
  const g=game({id:'daily',games:['pop','pairs','feed','trace','catch','build']});
  g.session.daily=true;
  const route=g.journeyRoute();
  for(const label of ['Pond letters','Match letters','Feed a friend','Draw letters','Catch fruit','Build with letters']) assert.ok(route.includes(`aria-label="${label}"`));
  assert.equal(new Set([...route.matchAll(/<svg viewBox="0 0 48 48".*?<\/svg>/g)].map(m=>m[0])).size,6);
  g.session.challenge=true;
  assert.equal(g.journeyRoute(),'');
});

test('actual play shell includes the daily trail only for gentle sessions',()=>{
  for(const [daily,challenge,expected] of [[true,false,true],[true,true,false],[false,false,false]]){
    const g=game({id:'daily',games:challenge?['burst']:['pop','catch','build']});
    Object.assign(g.session,{daily,challenge,gameIndex:0,items:[{id:'a'}]});
    g.topBar=()=>'';g.petSVG=()=>'';
    let markup;const rendered=Symbol('rendered');
    g.screen=(name,html)=>{assert.equal(name,'lg-play');markup=html;throw rendered;};
    assert.throws(()=>g.startGame(),e=>e===rendered);
    assert.equal(markup.includes('aria-label="Daily activities"'),expected);
  }
});


test('craft adventures show round progress without inheriting stationary beginner mechanics',()=>{
 const window={MiftahGame:{LettersArt:{icon:()=>'<svg></svg>'}}};
 for(const file of ['LettersJourney.js','LettersGame.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{window});
 const g=Object.create(window.MiftahGame.LettersGame.prototype);
 for(const [id,games] of [['join-1',['fuse','unfuse','parade']],['join-2',['fuse','chain','unfuse']]]){
  g.session={world:{id,games},gameIndex:0};
  assert.equal(g.showsRoundProgress(),true);
  assert.equal(g.isReferenceJourney(),false,'movement difficulty is unchanged');
  assert.match(g.journeyRoute(),/Lantern adventure/,'chapter trail stays visible');
 }
 g.session={world:{id:'join-1',games:['parade','fuse','unfuse']},gameIndex:0};
 assert.equal(g.showsRoundProgress(),false,'unknown activity order retains fallback chapter progress');
});
