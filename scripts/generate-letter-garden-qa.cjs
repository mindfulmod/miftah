// Generate disposable live-code fixtures on the isolated 127.0.0.1 preview origin.
const fs=require('fs');let html=fs.readFileSync('letters.html','utf8').replace('<head>','<head><base href="/">');
fs.mkdirSync('.qa',{recursive:true});
const fixture=`
if(location.hostname!=='127.0.0.1')throw new Error('QA fixtures require the isolated 127.0.0.1 origin');
const query=new URLSearchParams(location.search);
let seed=7101;Math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
const ns=window.MiftahGame;const phase=query.get('phase')||'day',draw=ns.LettersArt.backdrop;ns.LettersArt.dayPhase=()=>phase;ns.LettersArt.backdrop=()=>draw(phase);
const game=new ns.LettersGame(document.getElementById('letters-app'));
game.sound.enabled=false;game.say=()=>{};game.reduceMotion=query.get('motion')!=='full';
game.pet={species:query.get('pet')||'blob',hue:200,worn:[],accessories:['scarf','cape'],bodies:['blob','mina','lumi','rafi']};
game.wallet={earned:20,spent:0};game.stickers={owned:['star','palm','dove','fish','boat','lantern']};game.bests={};game.stars={};
const index=Number(query.get('index')||2);game.progress={done:game.worlds.worlds.slice(0,index).map(w=>w.id),skipped:false};game.progress.done.forEach(id=>{game.stars[id]=3;const w=game.worlds.worlds.find(w=>w.id===id);w.games.forEach(kind=>game.bests[id+':'+kind]=3);});
function scene(){const which=query.get('scene')||'home';if(which==='home'){game.session=null;game.renderHome();return;}if(which==='pet'){game.renderPet();return;}if(which==='album'){game.renderAlbum();return;}if(which==='garden'){game.renderDecoratingGarden();return;}if(which==='daily'){game.startDaily();return;}const chosen=game.worlds.worlds.find(w=>w.id===query.get('world'))||game.worlds.worlds.find(w=>w.games.includes(which))||game.worlds.worlds[0];game.session={world:chosen,gameIndex:Math.max(0,chosen.games.indexOf(which)),meetIndex:0,starTotal:0,lastStars:0,items:chosen.items(),extraItems:chosen.extraItems?.()||[]};if(query.has('fresh'))delete game.bests[chosen.id+':'+which];if(which==='meet')game.renderMeet();else if(which==='party')game.renderParty(3,false);else game.startGame();}
const home=game.renderHome.bind(game);game.renderHome=()=>{game.renderHome=home;scene();};
const report=document.createElement('output');report.id='qa-report';report.style.cssText='position:fixed;bottom:0;left:0;z-index:9999;font:9px monospace;background:#fffaf0;color:#4a3620;pointer-events:none';document.body.appendChild(report);
setInterval(()=>report.textContent='Stars '+game.starBalance()+' · chapters '+game.progress.done.length,500);
window.addEventListener('error',e=>{report.dataset.error=e.error?.stack||e.message;});
`;
if(!html.includes('new window.MiftahGame.LettersGame(document.getElementById("letters-app"));'))throw new Error('Update the QA bootstrap for the new entry point');
html=html.replace('new window.MiftahGame.LettersGame(document.getElementById("letters-app"));',fixture);fs.writeFileSync('.qa/stages.html',html);
for(const [name,width,height]of[['stages-phone',320,568],['stages-tablet',768,1024],['stages-landscape',568,320]])fs.writeFileSync('.qa/'+name+'.html','<!doctype html><html><head><style>body{margin:0}iframe{border:0;width:'+width+'px;height:'+height+'px;transform:scale(2);transform-origin:top left}</style></head><body><iframe title="Game"></iframe><script>document.querySelector("iframe").src="stages.html"+location.search</script></body></html>');
