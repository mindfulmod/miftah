const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');

test('rapid feedback stays local and cannot stack particle showers',()=>{
  const live=[],timers=[];
  const node=()=>({getContext:()=>null,children:[],style:{setProperty(k,v){this[k]=v}},classList:{add(){}},appendChild(n){this.children.push(n)},remove(){live.splice(live.indexOf(this),1)}});
  const document={querySelectorAll:()=>live,createElement:node,body:{appendChild:n=>live.push(n)}};
  const window={MiftahGame:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','LettersArt.js'),'utf8'),{window,document,setTimeout:fn=>timers.push(fn)});
  const burst=window.MiftahGame.LettersArt.confetti;
  burst(100,200,true);for(let i=0;i<20;i++)burst(100,200,true);
  assert.equal(live.length,1);assert.equal(live[0].children.length,14);
  for(const p of live[0].children){assert.ok(Math.abs(parseFloat(p.style['--dx']))<=90);assert.ok(Math.abs(parseFloat(p.style['--rot']))<=60)}
  timers.shift()();assert.equal(live.length,0);
  burst(80,90,false,'water');assert.ok(live[0].children.filter(n=>n.style['--dx']).length<=8);
  timers.shift()();assert.equal(live.length,0);
});

test('small trees simplify fine marks without losing roots, branches or fruit',()=>{
  const window={MiftahGame:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','DetailKit.js'),'utf8'),{window});
  const kit=window.MiftahGame.DetailKit;
  const full=kit.tree(),small=kit.tree({detail:'small'});
  assert.ok(small.length<full.length*.85,'small art has materially fewer fine details');
  assert.ok(small.includes('<path'));assert.ok(small.includes('<circle'));
  assert.doesNotMatch(small,/undefined|NaN/);
});
