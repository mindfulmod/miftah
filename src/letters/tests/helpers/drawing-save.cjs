const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const window={MiftahGame:{LettersArt:{}}};
for(const file of ['LettersState.js','LettersDecorations.js','LettersGame.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','..',file),'utf8'),{window});
const ns=window.MiftahGame;
const saveDrawing=function(url,pageId,slots=new Map(),el={isConnected:true}){return ns.LettersGame.prototype.saveStudioDrawing.call(this,url,pageId,slots,el);};
const png=suffix=>`data:image/png;base64,iVBORw0KGgoAAAANSUhEUg${Buffer.from(suffix).toString('base64')}`;
module.exports={ns,saveDrawing,png};
