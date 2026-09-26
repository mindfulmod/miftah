(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const key='letter-garden.audio-intake.batch4.v1'+(new URLSearchParams(location.search).has('qa')?'.qa':'');
  let manifest, state={submittedText:'',notes:{},reviews:{},played:{}};
  const cards=new Map();
  const message=text=>{$('status').textContent=text;};
  function clean(data){
    const result={submittedText:typeof data?.submittedText==='string'?data.submittedText.slice(0,6000):'',notes:{},reviews:{},played:{}};
    for(const item of manifest.items){
      if(typeof data?.notes?.[item.id]==='string')result.notes[item.id]=data.notes[item.id].slice(0,4000);
      if(data?.played?.[item.id]?.sha256===item.sha256)result.played[item.id]=data.played[item.id];
      const review=data?.reviews?.[item.id];
      if(review?.sha256!==item.sha256)continue;
      const text=manifest.submittedItems.some(entry=>entry.text===review.text)?review.text:'';
      const decision=['correct','fix','unsure'].includes(review.decision)?review.decision:'';
      result.reviews[item.id]={text,decision:result.played[item.id]&&(decision!=='correct'||text)?decision:'',sha256:item.sha256,reviewedAt:review.reviewedAt||null};
    }
    return result;
  }
  function save(){
    try{localStorage.setItem(key,JSON.stringify({...state,sourceSha256:manifest.source.sha256}));message('Saved locally. When finished, tell me in our conversation or download the review.');}
    catch{message('Browser saving is unavailable. Download your review before closing this page.');}
    updateProgress();
  }
  function updateProgress(){
    const decisions=Object.values(state.reviews).filter(review=>review.decision);
    const count=kind=>decisions.filter(review=>review.decision===kind).length;
    $('progress').textContent=`${decisions.length} of ${manifest.items.length} reviewed · ${count('correct')} correct · ${count('fix')} need fixing · ${count('unsure')} unclear`;
  }
  function chosen(item){return state.reviews[item.id]?.text??item.suggestedText??'';}
  function output(){
    return JSON.stringify({kind:'letter-garden-audio-identification',schemaVersion:2,testOnly:key.endsWith('.qa'),exportedAt:new Date().toISOString(),source:manifest.source,submittedTextConfirmed:true,submittedText:manifest.submittedItems.map(item=>item.text).join('\n\n'),previousSubmittedTextNote:state.submittedText,items:manifest.items.map(item=>({id:item.id,position:item.position,start:item.start,end:item.end,file:item.file,sha256:item.sha256,suggestedText:item.suggestedText,selectedText:chosen(item),decision:state.reviews[item.id]?.decision||'pending',reviewedAt:state.reviews[item.id]?.reviewedAt||null,played:state.played[item.id]||null,heard:state.notes[item.id]||''}))},null,2);
  }
  const player=$('player');let playingButton=null,playingItem=null,run=0;
  function resetButton(){if(playingButton){playingButton.textContent=playingButton.dataset.label;playingButton=null;}}
  async function play(file,label,button,item=null){
    const token=++run;player.pause();resetButton();playingItem=item;playingButton=button;button.textContent='Playing…';$('now-playing').textContent=label;
    player.src=file;player.hidden=false;player.playbackRate=1;
    try{await player.play();}catch{if(token===run){playingItem=null;resetButton();message('Playback could not start. Press the play button again.');}}
  }
  function updateCard(item){
    const card=cards.get(item.id),review=state.reviews[item.id],played=!!state.played[item.id];
    card.correct.disabled=!played||!chosen(item);card.fix.disabled=card.unsure.disabled=!played;
    card.correct.setAttribute('aria-pressed',String(review?.decision==='correct'));
    card.fix.setAttribute('aria-pressed',String(review?.decision==='fix'));
    card.unsure.setAttribute('aria-pressed',String(review?.decision==='unsure'));
    card.result.textContent=review?.decision==='correct'?'Marked correct':review?.decision==='fix'?'Marked needs fixing':review?.decision==='unsure'?'Marked unclear':played?'Played · choose a decision':'Play the clip before marking it.';
  }
  player.addEventListener('ended',()=>{
    resetButton();$('now-playing').textContent+=' · Finished';
    if(playingItem){state.played[playingItem.id]={sha256:playingItem.sha256,playedAt:new Date().toISOString()};updateCard(playingItem);save();playingItem=null;}
  });
  player.addEventListener('error',()=>{playingItem=null;resetButton();message('This audio could not load. Reload the page and try again.');});
  fetch('./manifest.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Clip list could not load');return r.json();}).then(data=>{
    if(data.id!=='batch4-intake'||data.items.length!==16||!data.submittedTextConfirmed)throw Error('Unexpected intake manifest');manifest=data;
    try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved?.sourceSha256===data.source.sha256)state=clean(saved);}catch{}
    $('submitted').value=data.submittedItems.map(item=>item.text).join(' ');
    for(const item of data.items){
      const card=document.createElement('article');card.className='item';card.id=item.id;
      const title=document.createElement('h2');title.textContent=`Clip ${item.position}`;
      const suggestion=document.createElement('p');suggestion.className='suggestion';suggestion.textContent=item.suggestedText?`Suggested label: ${item.suggestedText}`:'Label uncertain — please identify this sound';
      const time=document.createElement('p');time.className='clip-time';time.textContent=`${item.start.toFixed(3)}–${item.end.toFixed(3)} seconds in the original`;
      const button=document.createElement('button');button.type='button';button.className='play-clip';button.dataset.label=`Play clip ${item.position}`;button.textContent=button.dataset.label;button.onclick=()=>play(item.file,`Clip ${item.position}`,button,item);
      const choiceLabel=document.createElement('label');choiceLabel.htmlFor=`label-${item.id}`;choiceLabel.textContent='Sound this clip should teach';
      const select=document.createElement('select');select.id=choiceLabel.htmlFor;
      const blank=document.createElement('option');blank.value='';blank.textContent='Choose a sound…';select.append(blank);
      for(const entry of data.submittedItems){const option=document.createElement('option');option.value=entry.text;option.textContent=entry.text;select.append(option);}
      select.value=chosen(item);
      select.addEventListener('change',()=>{state.reviews[item.id]={text:select.value,decision:'',sha256:item.sha256,reviewedAt:null};updateCard(item);save();});
      const actions=document.createElement('div');actions.className='actions decisions';
      const buttons={};
      for(const [decision,label] of [['correct','Correct'],['fix','Needs fixing'],['unsure','Unclear']]){
        const action=document.createElement('button');action.type='button';action.textContent=label;action.disabled=true;action.setAttribute('aria-pressed','false');
        action.onclick=()=>{if(!state.played[item.id]||(decision==='correct'&&!chosen(item)))return;state.reviews[item.id]={text:chosen(item),decision,sha256:item.sha256,reviewedAt:new Date().toISOString()};updateCard(item);save();};
        buttons[decision]=action;actions.append(action);
      }
      const result=document.createElement('p');result.className='clip-result';result.setAttribute('role','status');
      const label=document.createElement('label');label.htmlFor=`heard-${item.id}`;label.textContent='Notes (optional)';
      const note=document.createElement('textarea');note.id=label.htmlFor;note.dir='auto';note.maxLength=4000;note.value=state.notes[item.id]||'';note.placeholder='Different consonant, wrong vowel length, clipped sound…';note.addEventListener('input',()=>{state.notes[item.id]=note.value;save();});
      const clear=document.createElement('button');clear.type='button';clear.textContent='Clear decision';clear.onclick=()=>{state.reviews[item.id]={text:chosen(item),decision:'',sha256:item.sha256,reviewedAt:null};updateCard(item);save();};
      card.append(title,suggestion,time,button,choiceLabel,select,actions,result,label,note,clear);$('notes').append(card);cards.set(item.id,{...buttons,result});updateCard(item);
    }
    $('download').disabled=$('show').disabled=$('play-source').disabled=false;updateProgress();message('This batch is applied. The saved form below is retained as a review record; no repeat review is needed.');
    $('play-source').dataset.label='Play complete recording';$('play-source').onclick=()=>play(data.source.file,'Complete recording',$('play-source'));
    $('download').onclick=()=>{const url=URL.createObjectURL(new Blob([output()],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='letter-garden-batch4-identification.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    $('show').onclick=()=>{$('export-text').hidden=false;$('export-text').value=output();};
  }).catch(error=>message(error.message+' · Open this page through the local preview server.'));
})();
