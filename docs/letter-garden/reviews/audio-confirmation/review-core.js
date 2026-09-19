(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AudioReview=api;})(typeof window==='undefined'?this:window,function(){
  'use strict';
  const VERDICTS=['correct','fix','unsure'];
  function empty(){return {schemaVersion:1,decisions:{}};}
  function clean(data){
    const result=empty();
    if(data?.schemaVersion!==1||!data.decisions||typeof data.decisions!=='object')return result;
    for(const [id,d] of Object.entries(data.decisions)){
      if(!/^lg-[a-f0-9]{12}$/.test(id)||!d||typeof d.signature!=='string'||!/^[a-f0-9]{64}$/.test(d.signature))continue;
      result.decisions[id]={signature:d.signature,verdict:VERDICTS.includes(d.verdict)?d.verdict:'',note:typeof d.note==='string'?d.note.slice(0,4000):'',heardSignature:d.heardSignature===d.signature?d.signature:'',updatedAt:typeof d.updatedAt==='string'&&Number.isFinite(Date.parse(d.updatedAt))?d.updatedAt:'1970-01-01T00:00:00.000Z'};
    }
    return result;
  }
  function merge(a,b){const out=clean(a);for(const [id,d] of Object.entries(clean(b).decisions)){if(!out.decisions[id]||Date.parse(d.updatedAt)>=Date.parse(out.decisions[id].updatedAt))out.decisions[id]=d;}return out;}
  function current(item,state){const d=state.decisions[item.id];if(!d)return {verdict:'',note:'',heardSignature:'',stale:false};if(d.signature!==item.signature)return {verdict:'',note:d.note,heardSignature:'',stale:true,previous:d.verdict};return {...d,stale:false};}
  function update(state,item,patch,now=new Date().toISOString()){
    const next=clean(state),old=current(item,next);
    const d={signature:item.signature,verdict:old.verdict,note:old.note,heardSignature:old.heardSignature,updatedAt:now};
    if(patch.note!==undefined)d.note=String(patch.note).slice(0,4000);
    if(patch.heard===true&&item.parts?.length)d.heardSignature=item.signature;
    if(patch.verdict!==undefined){
      if(patch.verdict!==''&&!VERDICTS.includes(patch.verdict))throw Error('Unknown review decision.');
      if(patch.verdict&&!item.parts?.length)throw Error('This item has no isolated clip to review yet.');
      if(patch.verdict==='correct'&&d.heardSignature!==item.signature)throw Error('Listen to the complete item before marking it correct.');
      d.verdict=patch.verdict;
    }
    next.decisions[item.id]=d;return next;
  }
  function counts(items,state){const out={correct:0,fix:0,unsure:0,unreviewed:0,stale:0,ready:0};for(const item of items){if(!item.parts?.length)continue;out.ready++;const d=current(item,state);if(d.stale)out.stale++;if(d.verdict)out[d.verdict]++;else out.unreviewed++;}return out;}
  return {empty,clean,merge,current,update,counts};
});
