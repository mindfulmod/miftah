const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const KEY='quran-trainer:letters:resume';
const plain=value=>JSON.parse(JSON.stringify(value));
function runtime(seed={}){
  const storage=new Map(Object.entries(seed)), writes=[];
  let fail=false;
  const window={MiftahGame:{LettersArt:{icon:()=>'<svg></svg>'}}};
  const localStorage={getItem:k=>storage.get(k)??null,setItem(k,v){if(fail)throw Error('full');writes.push([k,v]);storage.set(k,String(v));}};
  const context={window,localStorage,Date,console,setTimeout,clearTimeout};
  for(const file of ['LettersState','LettersGame'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',`${file}.js`),'utf8'),context);
  const game=Object.create(window.MiftahGame.LettersGame.prototype);
  Object.assign(game,{root:{style:{setProperty(){}}},sound:{play(){}},progress:{done:[]},stars:{},startGame(){},renderMeet(){},chapterBonus:()=>null,stampToday(){},renderParty(){},earnStars(){throw Error('resume must not repay rewards');}});
  return {game,storage,writes,fail(){fail=true;}};
}
function chapter(id){const catalogue=['لَمْ','مِنْ','هُوَ','قُلْ'].map(id=>({id,display:id}));return {id,games:['feed','build','pop'],meet:[],catalogue,items:()=>catalogue};}
const word=chapter('words-2'),early=chapter('pack-smile');
const old={world:word.id,gameIndex:1,starTotal:3,at:Date.now()-86400000,wordItemIds:['هُوَ','لَمْ','قُلْ','مِنْ']};

test('saving a detour preserves the legacy place and each chapter resumes after reload',()=>{
  const r=runtime({[KEY]:JSON.stringify(old)});
  r.game.rememberPlace({world:early,gameIndex:0,starTotal:2},1);
  assert.equal(r.writes.filter(([key])=>key===KEY).length,1);
  assert.deepEqual(plain(r.game.chapterPlace(word)),old);
  assert.equal(r.game.partwayOf(word),1/3);
  assert.equal(r.game.partwayOf(early),1/3);
  const again=runtime(Object.fromEntries(r.storage));
  again.game.startWorld(word);
  assert.equal(again.game.session.gameIndex,1);
  assert.equal(again.game.session.starTotal,3);
  assert.deepEqual(Array.from(again.game.session.items,i=>i.id),old.wordItemIds);
  again.game.startWorld(early);
  assert.equal(again.game.session.gameIndex,1);
  assert.equal(again.game.session.starTotal,2);
  assert.equal(again.writes.length,0,'reading valid bookmarks does not change saves');
});

test('updating and completing an archived chapter preserves the active detour',()=>{
  const r=runtime({[KEY]:JSON.stringify(old)});
  r.game.rememberPlace({world:early,gameIndex:0,starTotal:2},1);
  const earlyPlace=plain(r.game.chapterPlace(early));
  r.game.startWorld(word);r.game.session.gameIndex=1;r.game.session.starTotal=6;
  r.game.rememberPlace(r.game.session,1);
  assert.equal(r.game.chapterPlace(word).gameIndex,2);
  assert.deepEqual(plain(r.game.chapterPlace(early)),earlyPlace);
  r.game.session.gameIndex=2;r.game.session.starTotal=9;r.game.rememberPlace(r.game.session,1);
  // Make the finished word checkpoint the archived one before returning to it.
  r.game.saveChapterPlace(earlyPlace);
  r.game.startWorld(word);
  assert.equal(r.game.chapterPlace(word),null);
  assert.deepEqual(plain(r.game.chapterPlace(early)),earlyPlace);
  assert.ok(r.game.progress.done.includes(word.id));
  assert.equal(r.game.stars[word.id],3);
  assert.equal(r.game.loadJSON(KEY,null).others,undefined);
});

test('completing the current checkpoint promotes another and unrelated clearing is a no-op',()=>{
  const r=runtime({[KEY]:JSON.stringify(old)});
  r.game.saveChapterPlace({world:early.id,gameIndex:3,starTotal:9,at:Date.now()});
  const before=r.writes.length;r.game.clearChapterPlace({id:'not-there'});assert.equal(r.writes.length,before);
  r.game.startWorld(early);
  assert.deepEqual(plain(r.game.loadJSON(KEY,null)),old);
  assert.equal(r.game.chapterPlace(early),null);
  assert.equal(r.game.partwayOf(word),1/3);
  assert.ok(r.game.progress.done.includes(early.id));
});

test('failed single-record writes leave all prior places intact and special sessions do not overwrite them',()=>{
  const r=runtime({[KEY]:JSON.stringify(old)}),before=r.storage.get(KEY);
  for(const mode of ['daily','checkup','plan','chapterBonus'])r.game.rememberPlace({world:early,gameIndex:0,starTotal:3,[mode]:true},1);
  assert.equal(r.writes.length,0);
  r.fail();r.game.rememberPlace({world:early,gameIndex:0,starTotal:2},1);
  assert.equal(r.game.saveFailed,true);
  assert.equal(r.storage.get(KEY),before);
  assert.deepEqual(plain(r.game.chapterPlace(word)),old);
});
