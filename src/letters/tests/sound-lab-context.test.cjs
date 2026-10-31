const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup() {
  const window = { MiftahGame: {} }, timers = new Map(); let serial = 0;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../SoundLab.js'), 'utf8'), {
    window,
    setTimeout: fn => { timers.set(++serial,fn); return serial; },
    clearTimeout: id => timers.delete(id)
  });
  return { Lab:window.MiftahGame.GardenPractice.SoundLab, timers };
}

test('Sound Lab builds a complete practice chunk for marks that need vowel context', () => {
  const {Lab} = setup();
  const sukun = Lab.soundItem('ب', 'ْ'), shadda = Lab.soundItem('ت', 'ّ');
  assert.equal(sukun.display, 'أَبْ'); assert.equal(sukun.speak, sukun.display); assert.equal(sukun.focus, 'بْ');
  assert.equal(shadda.display, 'أَتَّ'); assert.equal(shadda.speak, shadda.display); assert.equal(shadda.focus, 'تَّ');
  assert.equal(Lab.soundItem('ب', 'ِ').speak, 'بِ');
  assert.equal(Lab.soundItem('ا', 'ْ').display, 'اْ', 'alif does not receive an invented support vowel');
});

test('mark selection only changes the ingredient; the child starts mixing explicitly', () => {
  const {Lab,timers} = setup(), spoken = [], prompts = [];
  const node = () => ({ classList: { add(){}, remove(){}, toggle(){} }, setAttribute(){}, innerHTML: '', disabled: false });
  const lab = Object.assign(Object.create(Lab.prototype), {
    alive:true, busy:false, makeToken:0, makeTimer:null, letter:{id:'b',display:'ب'}, mark:null, marks:['َ'], letters:[{id:'b',display:'ب'}], made:[], current:null,
    pages:{letters:0,marks:0}, ctx:{say:item=>spoken.push(item),prompt:item=>prompts.push(item),sfx(){},reducedMotion:()=>false},
    slotLetter:node(),slotMark:node(),mix:node(),out:node(),press:node(),strip:node(),
    pickers:{letters:{querySelectorAll:()=>[]},marks:{querySelectorAll:()=>[]}}
  });
  lab.renderHistory = () => {};
  lab.mark = null; lab.refresh = () => {};
  lab.makeTimer = null;
  lab.pickMark('َ');
  assert.equal(lab.mark,'َ');
  assert.equal(timers.size,0,'choosing an ingredient does not schedule a mix');
  lab.makeTimer = null;
  lab.tryMake();
  assert.equal(timers.size,1,'the explicit mix action starts the machine');
  [...timers.values()][0]();
  assert.equal(spoken.at(-1).display,'بَ');
  assert.equal(prompts.at(-1).display,'بَ');
});

test('doubled kasra and damma show exactly the complete example they speak',()=>{
 const {Lab}=setup();for(const mark of ['ِّ','ُّ']){const item=Lab.soundItem('ب',mark);assert.equal(item.display,'أَب'+mark);assert.equal(item.speak,item.display);assert.equal(item.prefix,'أَ');assert.equal(item.focus,'ب'+mark);}
});
