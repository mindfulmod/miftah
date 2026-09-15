// Disposable local fixtures. All seeded progress stays on 127.0.0.1.
require('./generate-letter-garden-qa.cjs');
const fs=require('fs');
let html=fs.readFileSync('.qa/stages.html','utf8');
html=html.replace('function scene(){', `
const tier=Number(query.get('tier')||0);
if(tier>0){
  for(const letter of ns.LETTERS_DATA.packs.flatMap(p=>p.letters)){
    ns.LettersStrength.map[letter.char]={r:8,w:0,streak:8,last:Date.now(),fast:0,slow:8,
      skills:{'letter-name':{matching:{r:4,w:0,streak:4,last:Date.now()},
        listening:{r:tier>=3?8:tier>=2?4:0,w:0,streak:tier>=3?4:2,last:Date.now(),sessions:tier>=3?['one','two','three']:['one','two']}}}};
  }
}
function scene(){`);
html=html.replace("if(which==='meet')game.renderMeet();", "if(['DotGarden','GardenPaths'].includes(which)){game.startPractice(which,()=>game.renderPracticeGarden());return;}if(which==='meet')game.renderMeet();");
html=html.replace('chosen.extraItems?.()','chosen.extraItems?.(game.progress.done)');
fs.writeFileSync('.qa/learning.html',html);
