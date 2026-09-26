(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const key='letter-garden.audio-intake.batch4.v1'+(new URLSearchParams(location.search).has('qa')?'.qa':'');
  let manifest,state={submittedText:'',notes:{}};
  const message=text=>{$('status').textContent=text;};
  const clean=data=>({submittedText:typeof data?.submittedText==='string'?data.submittedText.slice(0,6000):'',notes:Object.fromEntries(Object.entries(data?.notes||{}).filter(([id,n])=>/^batch4-\d{2}$/.test(id)&&typeof n==='string').map(([id,n])=>[id,n.slice(0,4000)]))});
  function save(){try{localStorage.setItem(key,JSON.stringify({...state,sourceSha256:manifest.source.sha256}));message('Saved locally. Download your notes and attach them when ready.');}catch{message('Browser saving is unavailable. Download your notes before closing this page.');}}
  function output(){return JSON.stringify({kind:'letter-garden-audio-identification',schemaVersion:1,testOnly:key.endsWith('.qa'),exportedAt:new Date().toISOString(),source:manifest.source,submittedText:state.submittedText,items:manifest.items.map(item=>({...item,heard:state.notes[item.id]||''}))},null,2);}
  const player=$('player');let playingButton=null,run=0;
  function resetButton(){if(playingButton){playingButton.textContent=playingButton.dataset.label;playingButton=null;}}
  async function play(file,label,button){const token=++run;player.pause();resetButton();playingButton=button;button.textContent='Playing…';$('now-playing').textContent=label;player.src=file;player.hidden=false;player.playbackRate=1;try{await player.play();}catch{if(token===run){resetButton();message('Playback could not start. Press the play button again.');}}}
  player.addEventListener('ended',()=>{resetButton();$('now-playing').textContent+=' · Finished';});
  player.addEventListener('error',()=>{resetButton();message('This audio could not load. Reload the page and try again.');});
  fetch('./manifest.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Clip list could not load');return r.json();}).then(data=>{
    if(data.id!=='batch4-intake'||data.items.length!==16)throw Error('Unexpected intake manifest');manifest=data;
    try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved?.sourceSha256===data.source.sha256)state=clean(saved);}catch{}
    $('submitted').value=state.submittedText;
    $('submitted').addEventListener('input',event=>{state.submittedText=event.target.value;save();});
    for(const item of data.items){
      const card=document.createElement('article');card.className='item';card.id=item.id;
      const title=document.createElement('h2');title.textContent=`Clip ${item.position}`;
      const time=document.createElement('p');time.className='clip-time';time.textContent=`${item.start.toFixed(3)}–${item.end.toFixed(3)} seconds in the original`;
      const button=document.createElement('button');button.type='button';button.className='play-clip';button.dataset.label=`Play clip ${item.position}`;button.textContent=button.dataset.label;button.onclick=()=>play(item.file,`Clip ${item.position}`,button);
      const label=document.createElement('label');label.htmlFor=`heard-${item.id}`;label.textContent='What do you hear? (optional)';
      const note=document.createElement('textarea');note.id=label.htmlFor;note.dir='auto';note.maxLength=4000;note.value=state.notes[item.id]||'';note.placeholder='Arabic, transliteration, or “unclear”';note.addEventListener('input',()=>{state.notes[item.id]=note.value;save();});
      card.append(title,time,button,label,note);$('notes').append(card);
    }
    $('download').disabled=$('show').disabled=$('play-source').disabled=false;message('Ready. Start by pasting the exact text you used, if you have it.');
    $('play-source').dataset.label='Play complete recording';$('play-source').onclick=()=>play(data.source.file,'Complete recording',$('play-source'));
    $('download').onclick=()=>{const url=URL.createObjectURL(new Blob([output()],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='letter-garden-batch4-identification.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    $('show').onclick=()=>{$('export-text').hidden=false;$('export-text').value=output();};
  }).catch(error=>message(error.message+' · Open this page through the local preview server.'));
})();
