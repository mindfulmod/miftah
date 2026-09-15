const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
function runtime(extra={}) {
  const store=new Map();
  const context={window:{MiftahGame:{}},setTimeout,clearTimeout,AbortController,
    localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},...extra};
  for(const file of ['LettersBoot.js','LettersState.js','LettersWorlds.js','MiniGames.js','LettersGame.js'])vm.runInNewContext(source(file),context);
  return {ns:context.window.MiftahGame,context,store};
}
const plain=x=>JSON.parse(JSON.stringify(x));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject};};
test('startup wait handles success, rejection, timeout and late completion once',async()=>{
  const {ns}=runtime(),wait=ns.LettersBoot.settle;
  assert.equal(await wait(Promise.resolve(7),10),7);
  assert.equal(await wait(Promise.reject(new Error('font unavailable')),10),undefined);
  const late=deferred();let aborts=0,completions=0;
  const result=wait(late.promise,5,()=>aborts++).then(x=>{completions++;return x;});
  assert.equal(await result,undefined);late.resolve(9);await Promise.resolve();
  assert.equal(aborts,1);assert.equal(completions,1);
});
test('word loading keeps valid partial results, skips malformed entries and is idempotent',async()=>{
  const requests=[];
  const {ns}=runtime({fetch:async(url,options)=>{
    requests.push(options);
    if(url==='data/surah-105.json')throw new Error('offline');
    if(url!=='data/surah-1.json')return {ok:true,json:async()=>({ayahs:{}})};
    return {ok:true,json:async()=>({ayahs:[null,{words:null},{number:1,words:[null,{arabic:8},{arabic:'ب'},{arabic:'بَتَ',position:1},{arabic:'بت',position:2},{arabic:'تث',position:3}]}]})};
  }});
  const worlds=Object.create(ns.LettersWorlds.prototype);worlds.examplePool=[{id:'old',skel:'قديم'}];
  await worlds.loadWords();await worlds.loadWords();
  assert.deepEqual(plain(worlds.examplePool.map(w=>w.skel)),['قديم','بت','تث']);
  assert.equal(requests.length,22);assert.ok(requests.every(x=>x.signal&&!('cache' in x)));
});
test('save routes report denial and do not fabricate wallet rewards from invalid amounts',()=>{
  const {ns,context}=runtime();context.localStorage.setItem=()=>{throw new Error('quota');};
  const game=Object.create(ns.LettersGame.prototype);game.wallet={earned:8,spent:2};game.progress={done:['pack-boat']};game.stars={'pack-boat':2};game.stamps={dates:[]};
  for(const n of [-1,0,NaN,Infinity,'2',1.5]){assert.equal(game.earnStars(n),false);assert.equal(game.spendStars(n),false);}
  assert.deepEqual(game.wallet,{earned:8,spent:2});
  assert.equal(game.saveProgress(),false);assert.equal(game.saveStars(),false);assert.equal(game.saveFailed,true);
  game.earnStars(1);assert.equal(game.wallet.earned,9);assert.equal(game.spendStars(2),true);assert.equal(game.wallet.spent,4);
});
test('empty lesson and unknown practice route out before creating a game or awarding',()=>{
  const {ns}=runtime();const game=Object.create(ns.LettersGame.prototype);let retries=0,backs=0;
  game.session={world:{games:['pop']},items:[],gameIndex:0};game.renderMissingItems=()=>retries++;
  game.screen=()=>{throw new Error('must not start game');};game.earnStars=()=>{throw new Error('must not award');};
  game.startGame();assert.equal(retries,1);
  game.startPractice('unknown',()=>backs++);game.startPractice('DotGarden',()=>backs++);assert.equal(backs,2);
});
test('filtered-empty game inputs route to retry before constructing or rewarding',()=>{
  const {ns}=runtime();
  const invalid=[
    {game:'build',items:[{id:'a',display:'a'}],extraItems:[]},
    {game:'blend',items:[{id:'a',display:'a',parts:[{display:'a'}]}],extraItems:[]},
    {game:'chain',items:[{id:'ab',display:'ab',join2:true,parts:[{display:'a'},{display:'b'}]}],extraItems:[{display:'a'}]},
    {game:'parade',items:[{id:'a',display:'a',parts:[]}],extraItems:[{display:'b',joins:false}]},
  ];
  for(const sample of invalid){
    const game=Object.create(ns.LettersGame.prototype);let retries=0;
    game.session={world:{games:[sample.game]},items:sample.items,extraItems:sample.extraItems,gameIndex:0};
    game.renderMissingItems=()=>retries++;game.screen=()=>{throw Error('must not create play UI')};game.finishGame=()=>{throw Error('must not reward')};
    game.startGame();assert.equal(retries,1,sample.game);
  }
});
function bootGame() {
  const words=deferred(),font=deferred(),warm=deferred(),counts={home:0,hatch:0,fit:0,loading:0};
  const art={warmInk:()=>warm.promise,fitGlyphs:()=>counts.fit++,watchGlyphs(){}};
  const {ns}=runtime({document:{fonts:{load:()=>font.promise}},window:{MiftahGame:{LettersArt:art}},performance:{now:()=>300}});
  ns.SoundSystem=class{play(){} };ns.LettersWorlds=class{letters=[];loadWords(){return words.promise;}};
  const p=ns.LettersGame.prototype;
  for(const name of ['applyPhase','initSparkles','initAmbient','initTouchFeedback'])p[name]=()=>{};
  p.showLoading=()=>counts.loading++;p.renderHome=()=>counts.home++;p.renderHatch=()=>counts.hatch++;
  const game=new ns.LettersGame({});return {game,ns,words,font,warm,counts};
}
test('initial loading appears synchronously and font rejection still opens hatch',async()=>{
  const b=bootGame();assert.equal(b.counts.loading,1);assert.equal(b.counts.hatch,0);
  b.font.reject(new Error('missing'));b.words.resolve();await b.game.ready;
  assert.equal(b.counts.hatch,1);
});
test('late startup work fits glyphs without replacing a newer screen',async()=>{
  const b=bootGame();b.game.screenRevision=1;b.font.resolve();b.warm.resolve();b.words.resolve();await b.game.ready;
  assert.equal(b.counts.fit,1);assert.equal(b.counts.hatch+b.counts.home,0);
});
