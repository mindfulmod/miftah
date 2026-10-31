const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function classes(){const set=new Set();return{add:x=>set.add(x),remove:x=>set.delete(x),contains:x=>set.has(x),toggle:(x,on)=>on?set.add(x):set.delete(x)}}
function node(){return{classList:classes(),style:{setProperty(){}},dataset:{},listeners:{},offsetWidth:120,addEventListener(k,f){this.listeners[k]=f},querySelectorAll(){return[]},getBoundingClientRect(){return{left:100,top:100,width:120,height:90}},animate(){},insertAdjacentHTML(){}}}
function runtime({firstVisit=true,level=0}={}){
 const source=node(),buttons=[node(),node()];buttons.forEach((b,i)=>b.dataset.i=String(i));
 const root=node();root.querySelector=s=>s==='.tb-letter'?source:null;root.querySelectorAll=s=>s==='.tb-nest'?buttons:[];root.contains=n=>n===source||buttons.includes(n);
 const ns={PracticeLearning:{level:()=>level,profile:()=>({choiceCount:2}),plan:(_c,items)=>items},LettersStrength:{skillProfile:()=>({})},LetterFriends:{FRIENDS:{'ا':{},'ب':{}},art:()=>'<svg/>',get:()=>({call:'friend'})},LettersStrokes:{LETTERS:{'ا':['M1 1'], 'ب':['M1 1',{dot:[50,80]}]}}};
 for(const file of ['ToyStudioArt','ToyBoxGames'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../'+file+'.js'),'utf8'),{window:{MiftahGame:ns},setTimeout:()=>1,clearTimeout(){}});
 const cues=[],outcomes=[];const ctx={firstVisit,items:[{id:'alif',display:'ا'},{id:'ba',display:'ب'}],stage:{firstElementChild:root},sfx(){},reducedMotion:()=>true,reportOutcome:o=>outcomes.push(o),setupActionCue:o=>{const cue={options:o,stops:0,destroys:0,stop(){this.stops++},destroy(){this.destroys++},show(){o.onShow();return true}};cues.push(cue);return cue;}};
 const game=new ns.GardenPractice.DotNests(ctx);game.cheer=()=>{};game.wobble=()=>{};
 return{ns,game,ctx,source,buttons,root,cues,outcomes};
}
test('first beginner board demonstrates moving the real letter to its matching nest',()=>{
 const {game,cues,source,buttons,outcomes}=runtime();const cue=cues[0];
 assert.equal(cue.options.source,source);assert.equal(cue.options.destination,buttons[game.offered.indexOf(game.want)]);assert.equal(cue.options.type,'drag');assert.equal(cue.options.automatic,true);assert.equal(outcomes.length,0);
 game.round=1;game.next();assert.equal(cue.destroys,1);assert.equal(cues[1].options.automatic,false);
});
test('returning and more experienced children get optional help without forced coaching',()=>{
 for(const options of [{firstVisit:false},{level:1}])assert.equal(runtime(options).cues[0].options.automatic,false);
});
test('help highlights only the current letter and matching nest and marks the answer assisted',()=>{
 const {game,cues,source,buttons,outcomes}=runtime();cues[0].show();const right=game.offered.indexOf(game.want);
 assert.equal(source.classList.contains('is-dot-guide'),true);assert.deepEqual(buttons.map(b=>b.classList.contains('is-dot-guide')),buttons.map((_,i)=>i===right));
 game.pick(right,buttons[right]);assert.equal(outcomes.length,1);assert.equal(outcomes[0].correct,true);assert.equal(outcomes[0].assisted,true);assert.equal(outcomes[0].skill,'letter-form');assert.equal(cues[0].destroys,1);assert.equal(source.classList.contains('is-dot-guide'),false);
});
test('unused help preserves unassisted matching and never claims independent listening',()=>{
 const {game,buttons,outcomes}=runtime({firstVisit:false});const right=game.offered.indexOf(game.want);game.pick(right,buttons[right]);
 assert.equal(outcomes[0].assisted,false);assert.equal(outcomes[0].evidence,'supported_visible_matching');
});
test('a wrong placement explains the relationship and keeps the existing handled-drop contract',()=>{
 const {game,buttons,cues,outcomes}=runtime();const wrong=game.offered.findIndex(n=>n!==game.want),right=game.offered.indexOf(game.want);
 assert.equal(game.pick(wrong,buttons[wrong],game.roundToken,true),true);assert.equal(outcomes[0].correct,false);assert.equal(game.busy,false);assert.equal(cues[0].stops,1);assert.equal(game.round,0);assert.equal(buttons[right].classList.contains('is-dot-guide'),true);
 game.pick(right,buttons[right]);assert.equal(outcomes[1].assisted,true);assert.equal(game.round,1);
});
test('pointer or keyboard input cancels the comparison while preserving the ability to answer',()=>{
 const {game,cues,root,source}=runtime();for(const event of ['pointerdown','keydown']){cues[0].show();root.listeners[event]();assert.equal(source.classList.contains('is-dot-guide'),false);assert.equal(game.busy,false);}
});
test('old round help, completion and destruction cannot leave coaching on the next screen',()=>{
 const {game,cues,source}=runtime();game.round=1;game.next();cues[0].options.onShow();assert.equal(game.missed,false);assert.equal(source.classList.contains('is-dot-guide'),false);
 cues[1].show();game.round=game.queue.length;game.next();assert.equal(cues[1].destroys,1);assert.equal(source.classList.contains('is-dot-guide'),false);
 const other=runtime();other.cues[0].show();other.game.destroy();other.cues[0].options.onShow();assert.equal(other.source.classList.contains('is-dot-guide'),false);assert.equal(other.cues[0].destroys,1);
});
test('nest art keeps exactly zero to three countable dot groups and never invents a dot for zero',()=>{
 const {ns}=runtime();for(let n=0;n<=3;n++){const html=ns.ToyStudioArt.nest(n);assert.equal((html.match(/class="ts-nest-dot"/g)||[]).length,n);assert.equal((html.match(/fill="#e8743c"/g)||[]).length,n);}
});
