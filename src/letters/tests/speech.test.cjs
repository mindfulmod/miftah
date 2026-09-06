const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function setup() {
  const spoken = [];
  let cancelled = 0;
  const speechSynthesis = {
    getVoices: () => [{name:'English Natural',lang:'en-US'}, {name:'Majed',lang:'ar-SA'}, {name:'Arabic Enhanced',lang:'ar-EG'}],
    cancel: () => cancelled++, speak: u => spoken.push(u),
  };
  const window = {speechSynthesis, MiftahGame:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../LettersGame.js'),'utf8'), {
    window, speechSynthesis, SpeechSynthesisUtterance: class {constructor(text){this.text=text;}},
  });
  const game = Object.create(window.MiftahGame.LettersGame.prototype);
  game.sound = {enabled:true};
  return {game,spoken,speechSynthesis,cancelled:()=>cancelled};
}
test('recording-backed items use their curriculum text and an Arabic voice',()=>{
  const {game,spoken} = setup();
  game.say({display:'ب',speak:'بَاءْ',audioPath:'must-not-play.mp3'});
  assert.equal(spoken[0].text,'بَاءْ');
  assert.equal(spoken[0].voice.name,'Arabic Enhanced');
  assert.equal(spoken[0].lang,'ar-EG');
  assert.equal(spoken[0].pitch,1);
});
test('replay replaces the utterance and suppresses the old completion callback',()=>{
  const {game,spoken,cancelled} = setup(); let first=0,second=0;
  game.say({display:'ا'},()=>first++);
  game.say({display:'ب'},()=>second++);
  spoken[0].onend(); spoken[1].onend();
  assert.equal(first,0); assert.equal(second,1); assert.equal(cancelled(),2);
});
test('stop or mute invalidates pending speech without starting another utterance',()=>{
  const {game,spoken} = setup(); let ended=0;
  game.say({display:'ت'},()=>ended++); game.stopSpeech(); spoken[0].onend();
  assert.equal(ended,0);
  game.sound.enabled=false; game.say({display:'ث'});
  assert.equal(spoken.length,1);
});
test('word display fallback and a voice list that loads later both work',()=>{
  const {game,spoken,speechSynthesis} = setup();
  speechSynthesis.getVoices=()=>[];
  game.say({display:'بِسْمِ',speak:'',audioPath:'ignored'});
  assert.equal(spoken[0].text,'بِسْمِ'); assert.equal(spoken[0].lang,'ar-SA');
  speechSynthesis.getVoices=()=>[{name:'Majed Enhanced',lang:'ar-SA'}];
  game.say({display:'ا'}); assert.equal(spoken[1].voice.name,'Majed Enhanced');
});
