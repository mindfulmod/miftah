const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const key='quran-trainer:letters:keepsakes';
const png='data:image/png;base64,QUJD';
const plain=x=>JSON.parse(JSON.stringify(x));
function runtime(){
 const values=new Map();let deny=false;
 const ns={LettersArt:{icon:()=>'<svg></svg>'}};
 const context={window:{MiftahGame:ns},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(deny)throw Error('quota');values.set(k,v);}},console,setTimeout,clearTimeout};
 for(const file of ['LettersGardenArt','LettersJourney','LettersState','LettersGame'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../'+file+'.js'),'utf8'),context);
 const game=Object.create(ns.LettersGame.prototype);
 Object.assign(game,{keepsakes:{},progress:{done:[]},stars:{},chapterBonus:()=>null,clearChapterPlace(){},saveStars(){},saveProgress(){},stampToday(){},renderParty(){},saveJSON:ns.LettersState.write});
 return {J:ns.LettersJourney,S:ns.LettersState,game,values,deny:()=>{deny=true;}};
}
function session(id='join-2',items=['عم','عغ','كل']){
 const games=id==='pack-smile'?['pairs','trace','pop']:['fuse','chain','unfuse'];
 return {world:{id,games},items:items.map(display=>({display})),starTotal:9,bestStars:3};
}
const labels=html=>[...html.matchAll(/<text\b[^>]*>(.*?)<\/text>/g)].map(m=>m[1]);
test('completion keeps the actual party labels across map redraws and reload',()=>{
 const {J,S,game}=runtime();game.session=session();game.finishWorld();
 const record=game.keepsakes['join-2'],world={...game.session.world,items:()=>{throw Error('must not reshuffle');}};
 const party=J.scene({kind:'garland',completed:3,items:game.session.items});
 assert.deepEqual(labels(J.memento(game.progress,world,record)),labels(party));
 assert.deepEqual(labels(J.memento(game.progress,world,S.read(key,{})['join-2'])),labels(party));
 assert.deepEqual(game.progress.done,['join-2']);assert.equal(game.stars['join-2'],3);
});
test('later completed play replaces only its own creation; unfinished sessions leave it alone',()=>{
 const {game}=runtime();game.session=session();game.finishWorld();const saved=plain(game.keepsakes);
 game.session=session('join-2',['فق','غف','ظع']);assert.deepEqual(plain(game.keepsakes),saved);
 game.keepsakes.fatha={letters:['بَ'],drawings:{}};game.finishWorld();
 assert.deepEqual(plain(game.keepsakes['join-2'].letters),['فق','غف','ظع']);assert.deepEqual(plain(game.keepsakes.fatha.letters),['بَ']);assert.deepEqual(game.progress.done,['join-2']);
});
test('drawn signs remain identical after drawing history is replaced and the game reloads',()=>{
 const {J,S,game}=runtime();game.session=session('pack-smile',['ج','ح','خ','ب']);game.session.journeyDrawings={'خ':png};game.finishWorld();
 const record=S.read(key,{})['pack-smile'];game.session.journeyDrawings['خ']='data:image/png;base64,REVG';
 assert.deepEqual(plain(record.letters),['خ','ج','ح']);assert.equal(record.drawings['خ'],png);
 const map=J.memento(game.progress,game.session.world,record);assert.ok(map.includes(`href="${png}"`));assert.deepEqual(labels(map),['ج','ح']);
});
test('legacy completion uses stable authored catalogue and never calls its randomized picker',()=>{
 const {J}=runtime();const world={id:'words-2',catalogue:[{display:'مِنْ'},{display:'عَنْ'},{display:'هُمْ'}],items:()=>{throw Error('random subset');}};
 const first=J.memento({done:['words-2']},world);for(let i=0;i<4;i++)assert.equal(J.memento({done:['words-2']},world),first);
 assert.deepEqual(labels(first),['مِنْ','عَنْ','هُمْ']);assert.equal(J.memento({done:[]},world),'');
});
test('legacy narrow chapters use authored meeting order when no catalogue exists',()=>{
 const {J}=runtime();const world={id:'fatha',meet:[{display:'بَ'},{display:'تَ'}],items:()=>{throw Error('random');}};
 assert.deepEqual(labels(J.memento({done:['fatha']},world)),['بَ','تَ']);
});
test('keepsakes are isolated by child profile, including reload',()=>{
 const {S}=runtime();S.write(key,{'join-2':{letters:['عم']}});S.setActive('p2');assert.deepEqual(plain(S.read(key,{})),{});
 S.write(key,{'join-2':{letters:['فق']}});S.setActive('p1');assert.deepEqual(plain(S.read(key,{})['join-2'].letters),['عم']);assert.deepEqual(plain(S.readAs('p2',key,{})['join-2'].letters),['فق']);
});
test('invalid records cannot add arbitrary projects, images or unbounded labels',()=>{
 const {J,S}=runtime();const result=J.normalizeKeepsakes({rogue:{letters:['x']},'join-2':{letters:['عم','عم',null,'x'.repeat(41),'فق','كل','غف'],drawings:{'عم':png}},'pack-smile':{letters:['خ','ج','ح'],drawings:{'خ':'https://elsewhere/image.png','ج':png,'ح':'data:image/png;base64,'+'A'.repeat(60000)}},fatha:[],decode:{letters:null}});
 assert.deepEqual(Object.keys(result),['pack-smile','join-2']);assert.deepEqual(plain(result['join-2']),{letters:['عم','فق','كل'],drawings:{}});
 assert.deepEqual(plain(result['pack-smile'].drawings),{'ج':png});
 for(const bad of [null,[],false,'wrong'])assert.deepEqual(plain(S.normalize(key,bad,{})),{});
});
test('image storage is bounded to three signs in each of four drawing chapters',()=>{
 const {J}=runtime();const raw=Object.fromEntries(Object.keys(J.CHAPTERS).map(id=>[id,{letters:['ا','ب','ت'],drawings:{'ا':png,'ب':png,'ت':png}}]));
 const records=J.normalizeKeepsakes(raw);assert.equal(Object.keys(records).length,14);
 assert.equal(Object.values(records).flatMap(r=>Object.keys(r.drawings)).length,12);
});
test('a failed write retains the last saved creation while this visit shows its new one',()=>{
 const {S,game,deny}=runtime();game.session=session();game.finishWorld();deny();game.session=session('join-2',['فق']);game.finishWorld();
 assert.deepEqual(plain(S.read(key,{})['join-2'].letters),['عم','عغ','كل']);assert.deepEqual(plain(game.keepsakes['join-2'].letters),['فق']);assert.equal(S.hasWriteFailure(),true);
});
test('daily, checkup and unrelated practice cannot replace an earned creation',()=>{
 const {game}=runtime();game.session=session();game.finishWorld();const before=JSON.stringify(game.keepsakes);
 for(const flags of [{daily:true},{checkup:true},{plan:[]}]){game.session={...session('join-2',['فق']),...flags};game.rememberKeepsake();assert.equal(JSON.stringify(game.keepsakes),before);}
});
