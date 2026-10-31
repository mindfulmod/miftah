const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function classes(){const set=new Set();return{add:x=>set.add(x),remove:x=>set.delete(x),contains:x=>set.has(x),toggle:(x,on)=>on?set.add(x):set.delete(x)}}
function runtime({firstVisit=true,level=0}={}){
 const buttons=[0,1].map(i=>({dataset:{i:String(i)},style:{},classList:classes(),addEventListener(){},position:90+i*40}));
 const pond={classList:classes(),addEventListener(){}};
 const root={innerHTML:'',querySelector:s=>s==='.tb-pond'?pond:null,querySelectorAll:s=>s==='.tb-fish'?buttons:[]};
 const ns={PracticeLearning:{profile:()=>({choiceCount:2,promptMode:'listen',level}),level:()=>level,plan:(_ctx,items)=>items},LettersStrength:{},LetterFriends:{FRIENDS:{'ب':{},'ت':{}},art:()=>'<svg/>'}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../ToyBoxGames.js'),'utf8'),{window:{MiftahGame:ns},console,setTimeout:()=>1,clearTimeout(){},getComputedStyle:b=>({left:b.position+'px'})});
 const cues=[],outcomes=[],prompts=[];
 const ctx={firstVisit,items:[{id:'ب',display:'ب'},{id:'ت',display:'ت'}],stage:{firstElementChild:root},canListen:()=>true,prompt:i=>prompts.push(i),say:()=>true,sfx(){},reportOutcome:o=>outcomes.push(o),setupActionCue:options=>{const cue={options,stops:0,destroys:0,stop(){this.stops++},destroy(){this.destroys++}};cues.push(cue);return cue;}};
 const game=new ns.GardenPractice.LetterFishing(ctx);
 game.cast=()=>{};game.landFish=()=>{};
 return{game,cues,outcomes,prompts,buttons,pond};
}
test('first beginner visit teaches the actual target once, without making an answer',()=>{
 const {game,cues,outcomes,buttons}=runtime();assert.equal(cues.length,1);
 assert.equal(cues[0].options.type,'tap');assert.equal(cues[0].options.source,buttons[game.fish.indexOf(game.target)]);
 assert.equal(cues[0].options.automatic,true);assert.equal(outcomes.length,0);assert.equal(game.round,0);
 game.round=1;game.next();assert.equal(cues[0].destroys,1);assert.equal(cues[1].options.automatic,false);
});
test('returning or practiced children keep optional help without another automatic demo',()=>{
 for(const options of [{firstVisit:false},{level:2}]){
  const {cues}=runtime(options);assert.equal(cues[0].options.automatic,false);assert.equal(typeof cues[0].options.onShow,'function');
 }
});
test('showing how to catch freezes fish in place and honestly records an assisted choice',()=>{
 const {game,cues,buttons,pond,outcomes,prompts}=runtime({firstVisit:false});game.heard=true;
 cues[0].options.onShow();assert.equal(game.listenPrompt,false);assert.equal(game.missed,true);assert.equal(game.heard,false);
 assert.deepEqual(buttons.map(b=>b.style.left),['90px','130px']);assert.equal(pond.classList.contains('is-still'),true);assert.equal(prompts.at(-1).display,game.target);
 game.pick(game.fish.indexOf(game.target),buttons[game.fish.indexOf(game.target)]);
 assert.equal(outcomes.length,1);assert.equal(outcomes[0].assisted,true);assert.equal(outcomes[0].evidence,'supported_visible_matching');assert.equal(cues[0].stops,1);assert.equal(cues[0].destroys,1);
});
test('offering unused help does not downgrade a heard independent answer',()=>{
 const {game,outcomes,buttons}=runtime({firstVisit:false});game.heard=true;
 game.pick(game.fish.indexOf(game.target),buttons[game.fish.indexOf(game.target)]);
 assert.equal(outcomes[0].assisted,false);assert.equal(outcomes[0].evidence,'independent_listening');
});
test('a miss cancels the demonstration but retains optional help until the round ends',()=>{
 const {game,cues,buttons,outcomes}=runtime();const wrong=game.fish.findIndex(c=>c!==game.target);
 assert.equal(game.pick(wrong,buttons[wrong]),false);assert.equal(cues[0].stops,1);assert.equal(cues[0].destroys,0);assert.equal(outcomes[0].correct,false);
 cues[0].options.onShow();assert.equal(game.missed,true);
});
test('catching, completion and leaving retire the cue, and late help cannot alter a finished game',()=>{
 const {game,cues,buttons,outcomes}=runtime();const index=game.fish.indexOf(game.target);game.heard=true;
 game.pick(index,buttons[index]);game.pick(index,buttons[index]);assert.equal(outcomes.length,1);assert.equal(cues[0].destroys,1);
 const missed=game.missed;cues[0].options.onShow();assert.equal(game.missed,missed);
 const other=runtime();other.game.destroy();assert.equal(other.cues[0].destroys,1);other.cues[0].options.onShow();assert.equal(other.game.missed,false);
 const done=runtime();done.game.round=done.game.asks.length;done.game.next();assert.equal(done.cues[0].destroys,1);assert.equal(done.game.actionCue,null);
});
