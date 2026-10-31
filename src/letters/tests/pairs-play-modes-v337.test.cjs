const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function runtime() {
  const outcomes = [], timers = [], resets = [];
  const classes = () => { const s = new Set(); return { add: x => s.add(x), remove: x => s.delete(x), contains: x => s.has(x), toggle: (x, on) => on ? s.add(x) : s.delete(x) }; };
  const node = (dataset = {}) => ({ dataset, disabled: false, hidden: false, attrs: {}, classList: classes(), children: [], setAttribute(k,v){this.attrs[k]=v;}, querySelector(){return this.slot;}, focus(){}, });
  const ns = {
    LettersArt: { icon: () => '<svg/>' },
    LetterFriends: { FRIENDS: { 'ب': {}, 'ت': {}, 'ث': {} }, art: () => '<svg/>', item: c => ({id:c,display:c}), get: c => ({en:c,call:c}) },
    GardenPractice: { draggable: (_el, opts) => { const reset=()=>resets.push('reset'); reset.options=opts; return reset; }, inside: (el,x,y) => el.rect && x>=el.rect.left&&x<=el.rect.right&&y>=el.rect.top&&y<=el.rect.bottom },
  };
  const context = { window:{MiftahGame:ns}, Math, Date, performance:{now:()=>0}, setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;}, clearTimeout(){} };
  for (const f of ['PracticeLearning.js','ToyBoxGames.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),context);
  const game=Object.create(ns.GardenPractice.FriendPairs.prototype);
  const root={contains:()=>true, innerHTML:'', querySelectorAll(sel){return sel.includes('letter')?letters:homes;}, querySelector(sel){
    if(sel==='.tb-visible-pairs') return board;
    if(sel==='.tb-pair-next') return next;
    const m=sel.match(/data-home="(\d+)"/); if(m)return homes[+m[1]];
    const l=sel.match(/data-letter="(\d+)"/); if(l)return letters[+l[1]];
    if(sel==='.tb-pair-letter:not(:disabled)')return letters.find(x=>!x.disabled);
    return null;
  }};
  const homes=[node({home:'0'}),node({home:'1'})], letters=[node({letter:'0'}),node({letter:'1'})], next=node(), board=node(); next.hidden=true;
  homes.forEach((h,i)=>{h.dataset.home=String(i);h.slot={innerHTML:''};}); letters.forEach((l,i)=>l.dataset.letter=String(i));
  Object.assign(game,{ctx:{items:[{id:'real-b',display:'ب'},{id:'real-t',display:'ت'}],beginRound:(i,s)=>begins.push([i.id,s]),reportOutcome:o=>outcomes.push(o),say(){},sfx(){},reducedMotion:()=>reduced},root,alive:true,busy:false,timers:[],pool:['ب','ت'],pairCount:2,playMode:'match',board:0,boards:1,boardToken:7,still:()=>reduced,cheer(){},wobble(){},say(){}});
  const begins=[]; let reduced=false;
  return {ns,game,root,homes,letters,next,board,outcomes,begins,timers,resets,setReduced:v=>reduced=v};
}
function deal(f, chars=['ب','ت'], token=7) { f.game.dealVisible(chars,token); }

test('standalone chooser has two pictured modes; direct and adventure launches retain memory default',()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','LettersGame.js'),'utf8');
  assert.match(source,/choosePairMode:kind==='FriendPairs'&&!onDone&&!options\.context\?\.adventure/);
  const f=runtime(), proto=f.ns.GardenPractice.FriendPairs.prototype, oldChoose=proto.choosePlayMode, oldDeal=proto.deal;
  const starts=[];
  proto.choosePlayMode=function(){starts.push('chooser');}; proto.deal=function(){starts.push('deal');};
  const make=choosePairMode=>new f.ns.GardenPractice.FriendPairs({items:[{id:'ب',display:'ب'},{id:'ت',display:'ت'}],stage:{innerHTML:'',firstElementChild:{innerHTML:''}},choosePairMode});
  try { make(true); assert.deepEqual(starts,['chooser']); starts.length=0; make(false); assert.deepEqual(starts,['deal']); }
  finally { proto.choosePlayMode=oldChoose; proto.deal=oldDeal; }
  const buttons=[{dataset:{mode:'match'}},{dataset:{mode:'memory'}}], chooser=Object.create(proto), root={innerHTML:'',contains:()=>true,querySelectorAll:()=>buttons};
  Object.assign(chooser,{pool:['ب','ت'],alive:true,busy:true,root,deal(){starts.push(this.playMode);}});
  chooser.choosePlayMode(); assert.match(root.innerHTML,/data-mode="match"/); assert.match(root.innerHTML,/data-mode="memory"/);
  starts.length=0; buttons[0].onclick(); buttons[1].onclick(); assert.deepEqual(starts,['match'],'the first choice locks the chooser');
  chooser.playMode=null; chooser.alive=false; buttons[1].onclick(); assert.deepEqual(starts,['match'],'a stale chooser cannot start a mode');
});

test('visible match reports form recognition only and uses real item identity',()=>{
  const f=runtime(); deal(f); assert.equal(f.game.selectVisible(0,7),true); assert.equal(f.game.placeVisible(0,0,7),true);
  assert.equal(f.begins[0][1],'letter-form'); assert.equal(f.outcomes[0].itemId,'real-b');
  assert.equal(f.outcomes[0].skill,'letter-form'); assert.equal(f.outcomes[0].evidence,'supported_visible_matching');
  assert.equal(f.outcomes[0].affectsStrength,false); assert.equal(f.outcomes[0].correct,true);
  assert.equal(f.outcomes.some(o=>o.skill==='matching-memory'||o.skill==='letter-name'),false);
});

test('wrong drop records a miss and corrected source is assisted',()=>{
  const f=runtime(); deal(f);
  assert.equal(f.game.placeVisible(0,1,7),false); assert.equal(f.game.matchMisses.has(0),true);
  assert.equal(f.outcomes[0].correct,false); assert.equal(f.outcomes[0].assisted,false);
  assert.equal(f.game.placeVisible(0,0,7),true); assert.equal(f.outcomes[1].correct,true); assert.equal(f.outcomes[1].assisted,true);
});

test('duplicate, invalid and stale placements are rejected without evidence',()=>{
  const f=runtime(); deal(f); f.game.placeVisible(0,0,7); f.timers.at(-1).fn(); const count=f.outcomes.length;
  assert.equal(f.game.placeVisible(0,0,7),false); assert.equal(f.game.placeVisible(-1,1,7),false);
  assert.equal(f.game.placeVisible(1,1,6),false); f.game.alive=false; assert.equal(f.game.placeVisible(1,1,7),false); assert.equal(f.outcomes.length,count);
});

test('visible drag uses generous inside hit testing and resets when a new board is dealt',()=>{
  const f=runtime(); deal(f); const opts=f.resets; assert.equal(opts.length,0);
  // draggable hooks are installed as reset closures and retain the configured drop callback.
  const reset=f.game.dragResets; assert.equal(reset.length,2);
  const options=reset[0].options; assert.equal(options.enabled(),true);
  options.onDragStart(); assert.equal(f.game.selected,0);
  assert.equal(options.drop(120,40),false,'homes are not inside until their bounds are supplied');
  f.homes[0].rect={left:100,right:160,top:20,bottom:80};
  assert.equal(options.drop(120,40),true); assert.equal(f.outcomes[0].correct,true);
  f.game.deal(); assert.equal(f.resets.length,2,'re-dealing clears both prior drag bindings');
});

test('next stays gated until all pairs are matched, then advances once',()=>{
  const f=runtime(); f.game.boards=2; f.game.board=0; deal(f);
  f.next.hidden=true; const advance=f.next.onclick; advance(); assert.equal(f.game.board,0);
  f.game.placeVisible(0,0,7); assert.equal(f.next.hidden,true); assert.equal(f.board.classList.contains('is-complete'),false); f.timers.at(-1).fn();
  f.game.placeVisible(1,1,7); assert.equal(f.next.hidden,true); assert.equal(f.board.classList.contains('is-complete'),false); f.timers.at(-1).fn();
  assert.equal(f.board.classList.contains('is-complete'),true); assert.equal(f.next.hidden,false); advance(); assert.equal(f.game.board,1); assert.equal(f.next.disabled,true);
  const board=f.game.board; advance(); assert.equal(f.game.board,board,'an old next callback cannot advance again');
});

test('reduced motion shortens success feedback delay',()=>{
  const f=runtime(); f.setReduced(true); deal(f); f.game.placeVisible(0,0,7);
  assert.equal(f.timers.at(-1).ms,120);
  const normal=runtime(); deal(normal); normal.game.placeVisible(0,0,7); assert.equal(normal.timers.at(-1).ms,480);
});
