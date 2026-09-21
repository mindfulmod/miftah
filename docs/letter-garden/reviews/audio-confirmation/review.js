(()=>{
  'use strict';
  const $=selector=>document.querySelector(selector),Core=window.AudioReview;
  const repo=new URL('../../../../',location.href);
  const qa=new URLSearchParams(location.search).has('qa');
  const storageKey='letter-garden.audio-confirmation.v1'+(qa?'.qa':'');
  const labels={correct:'Correct',fix:'Needs fixing',unsure:'Unsure',stale:'Audio changed'};
  const headings={next100:'Your 100-item audio review',revised:'Revision history',installed:'1 · Confirm the installed clips',candidate:'2 · Check the proposed cuts',sequence:'3 · Check joined letter-name prompts',unmapped:'4 · Items still needing an isolated clip',policy:'5 · Teaching decisions before recording',all:'The complete audio catalogue'};
  const help={next100:'Listen to each complete item, then choose Correct, Needs fixing or Unsure. This queue contains 100 distinct items in ten batches; your progress saves automatically.',revised:'Earlier approved revisions and current candidates are preserved here. Use the latest recheck button for only the clips that need another listen.',installed:'The 28 alphabet names come first, followed by mark names and words. Installed means connected to the local game; it does not mean pronunciation-approved.',candidate:'These excerpts are not connected to the game. Check that each contains exactly the displayed item, with complete vowels and endings.',sequence:'These 149 prompts queue existing names in the game’s order, with its 90 ms gap. Review the name order and transitions after the individual alphabet clips.',unmapped:'These items have no reliable individual cut yet. They are not confirmed missing. No listening decision is required here; I still need to map them. Optional notes can identify something you noticed in the originals.',policy:'These 29 requests are standalone assembly pieces. Their pronunciation needs a teaching decision in context; no clip is offered. You can leave guidance in the notes.',all:'All 612 distinct curriculum requests, including playable clips, name sequences and items still needing work.'};
  let manifest,items=[],state=Core.empty(),page=0,run=0,active=null,partTimer=null,controller=null;
  const player=$('#player'),blobCache=new Map(),sourcePlayers=new Map();
  function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
  function button(text,callback,className){const el=node('button',text,className);el.type='button';el.onclick=callback;return el;}
  function message(text,error=false){$('#save-status').textContent=text;$('#save-status').classList.toggle('warning',error);}
  function read(){try{return Core.clean(JSON.parse(localStorage.getItem(storageKey)||'null'));}catch{return Core.empty();}}
  function save(item,patch){
    state=Core.update(Core.merge(state,read()),item,patch);
    try{localStorage.setItem(storageKey,JSON.stringify(state));message('Saved in this browser. Download your results when you finish or take a break.');}
    catch{message('Browser saving is unavailable. Your decisions are in this tab only—download the results before closing it.',true);}
    summary();refreshCard(item);
  }
  function selectedQueue(){return manifest?.reviewQueues?.find(q=>q.id===$('#section').value);}
  function queueItems(){const ids=selectedQueue()?.itemIds||[];const byId=new Map(items.map(item=>[item.id,item]));return ids.map(id=>byId.get(id)).filter(Boolean);}
  function queueSummary(){const c=Core.counts(queueItems(),state);$('#queue-progress').hidden=!selectedQueue();$('#queue-progress').textContent=`${c.correct+c.fix+c.unsure} of ${c.ready} in this queue reviewed · ${c.correct} correct · ${c.fix} need fixing · ${c.unsure} unsure`;const next=$('#queue-next-step');next.hidden=!selectedQueue();next.textContent=c.ready&&c.correct+c.fix+c.unsure===c.ready?'Next: download your review results and attach the JSON file in our conversation. This queue is complete.':'Next: play each clip, choose a decision, then continue with Next batch →. You can stop and resume anytime.'; }
  function summary(){queueSummary();const c=Core.counts(items,state);$('#progress').textContent=`${c.correct+c.fix+c.unsure} of ${c.ready} playable items reviewed · ${c.correct} correct · ${c.fix} need fixing · ${c.unsure} unsure${c.stale?` · ${c.stale} changed clips need another listen`:''}`;}
  function filtered(){const q=$('#search').value.trim().normalize('NFC').toLowerCase(),section=$('#section').value,family=$('#family').value,decision=$('#decision').value;return (selectedQueue()?queueItems():items).filter(item=>{
    const d=Core.current(item,state),hay=[item.text,item.id,...item.displays,item.family].join(' ').normalize('NFC').toLowerCase();
    return (selectedQueue()||section==='all'||item.status===section||(section==='revised'&&item.revision))&&(family==='all'||item.family===family)&&(!q||hay.includes(q))&&(decision==='all'||(decision==='unreviewed'?!d.verdict:item.parts.length&&(decision==='stale'?d.stale:d.verdict===decision)));
  });}
  function refreshCard(item){
    const card=document.getElementById(item.id);if(!card)return;
    const d=Core.current(item,state),badge=card.querySelector('.badge');
    const verdict=d.stale?'stale':d.verdict;
    badge.textContent=labels[verdict]||(item.parts.length?'Not reviewed':'No isolated clip');badge.dataset.verdict=verdict;
    card.querySelectorAll('[data-vote]').forEach(b=>{b.setAttribute('aria-pressed',String(d.verdict===b.dataset.vote));b.disabled=b.dataset.vote==='correct'&&d.heardSignature!==item.signature;});
    const hint=card.querySelector('.listen-hint');if(hint)hint.textContent=d.stale?'Audio changed since your previous decision. Listen again.':d.heardSignature===item.signature?'Played in full. Ready for your decision.':'Listen to the whole item to enable “Correct”.';
    const undo=card.querySelector('.undo');if(undo)undo.hidden=!d.verdict;
    card.classList.toggle('is-playing',active?.id===item.id);
  }
  function render(){
    const PAGE_SIZE=selectedQueue()?10:8;queueSummary();
    const list=filtered(),pages=Math.max(1,Math.ceil(list.length/PAGE_SIZE));page=Math.min(page,pages-1);
    $('#queue-title').textContent=selectedQueue()?.title||headings[$('#section').value];$('#queue-help').textContent=selectedQueue()?.description||help[$('#section').value];
    $('#page-status').textContent=list.length?`${page*PAGE_SIZE+1}–${Math.min((page+1)*PAGE_SIZE,list.length)} of ${list.length}${selectedQueue()?` · Batch ${page+1} of ${pages}`:''}`:'No matching items';
    $('#previous').disabled=page===0;$('#next').disabled=page>=pages-1;
    $('#previous-bottom').disabled=page===0;$('#next-bottom').disabled=page>=pages-1;$('#page-status-bottom').textContent=$('#page-status').textContent;
    $('#items').replaceChildren();
    for(const item of list.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE)){
      const d=Core.current(item,state),card=node('article',undefined,'item');card.id=item.id;card.setAttribute('aria-label',`Review ${item.text}`);
      const top=node('div',undefined,'item-top');top.append(node('span',item.family),node('span','','badge'));card.append(top);if(selectedQueue()){const kind=item.status==='sequence'?'NAME SEQUENCE · check order and gaps':['Letter names','Vowel and tanween names'].includes(item.family)?'NAME · check the complete spoken name':/vowel|Tanween|Leen|Sukun/.test(item.family)?'SYLLABLE · check the vowel, length and ending':'WORD · check consonants, vowels and ending';card.append(node('p',`${queueItems().findIndex(x=>x.id===item.id)+1} / ${queueItems().length} · ${kind}`,'hint'));}
      const arabic=node('div',item.text,'arabic');arabic.lang='ar';arabic.dir='rtl';card.append(arabic);
      const actions=node('div',undefined,'clip-actions');
      if(item.parts.length){const play=button(item.parts.length>1?'▶ Play full sequence':'▶ Play clip',()=>playItem(item),'play');play.setAttribute('aria-label',`Play ${item.text}`);actions.append(play);}
      else actions.append(node('span',item.status==='policy'?'Teaching guidance needed':'Awaiting a reliable cut','hint'));
      if(item.previousParts?.length){const b=button('Play previous cut',()=>playItem(item,true));b.setAttribute('aria-label',`Play previous cut for ${item.text}`);actions.append(b);}
      if(item.source){const b=button('Compare original',()=>compareSource(item));b.setAttribute('aria-label',`Compare original for ${item.text}`);actions.append(b);}
      card.append(actions);
      if(item.revision||(selectedQueue()?.individualOnly&&item.status==='candidate'))card.append(node('p',item.note,'item-note'));
      if(item.parts.length){
        const votes=node('div',undefined,'votes');votes.setAttribute('role','group');votes.setAttribute('aria-label',`Decision for ${item.text}`);
        for(const verdict of ['correct','fix','unsure']){const b=button(labels[verdict],()=>{try{save(item,{verdict});}catch(error){message(error.message,true);}});b.dataset.vote=verdict;b.setAttribute('aria-pressed','false');votes.append(b);}card.append(votes,node('p','','listen-hint'));
      }
      const label=node('label',item.parts.length?'Optional correction or pronunciation note':'Optional source timestamp or teaching guidance','note-label');
      const note=node('textarea');note.value=d.note;note.maxLength=4000;note.rows=2;note.placeholder=item.parts.length?'What sounded wrong? What should it say?':'No need to locate all clips yourself.';note.setAttribute('aria-label',`Note for ${item.text}`);
      note.oninput=()=>save(item,{note:note.value});label.append(note);card.append(label);
      if(item.parts.length){const undo=button('Clear decision',()=>save(item,{verdict:''}),'undo');card.append(undo);}
      const details=node('details'),context=node('div',undefined,'context');details.append(node('summary','Context and clip details'));
      context.append(node('p',item.note),node('p',`Item ID: ${item.id}`,'item-id'));
      if(item.status==='sequence')context.append(node('p',`Names in order: ${item.parts.map(p=>p.text).join(' ← ')}`));
      const contexts=[...new Set(item.uses.map(use=>`${use.world} · ${use.role}${use.parent?` · in ${use.parent}`:''}`))];
      context.append(node('p',contexts.join(' / ')));
      if(item.source)context.append(node('p',`Source cut: ${item.source.start.toFixed(2)}–${item.source.end.toFixed(2)} seconds.`));
      if(d.stale&&d.previous)context.append(node('p',`Previous version: ${labels[d.previous]}. The old decision is not applied to this clip.`));
      details.append(context);card.append(details);$('#items').append(card);refreshCard(item);
    }
    if(!list.length)$('#items').append(node('p','No items match these filters. Try another review section or clear the search.','empty'));
  }
  function clearSources(){for(const audio of sourcePlayers.values()){audio.pause();audio.ontimeupdate=null;}}
  function stop(){run++;clearTimeout(partTimer);partTimer=null;controller?.abort();controller=null;player.onended=null;player.onerror=null;player.pause();player.hidden=true;player.removeAttribute('src');player.load();const old=active;active=null;$('#stop').disabled=true;if(old)refreshCard(old);}
  function stopEverything(){stop();clearSources();$('#now-playing').textContent='Playback stopped';$('#play-state').textContent='Choose a clip when you are ready.';}
  async function checkedAudio(part,ticket,signal){
    const key=part.file+':'+part.sha256;if(blobCache.has(key))return blobCache.get(key);
    const response=await fetch(new URL(part.file,repo),{cache:'no-store',signal});if(!response.ok)throw Error(`Audio file could not load (${response.status}).`);
    const bytes=await response.arrayBuffer();
    const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
    if(hash!==part.sha256)throw Error('This audio file changed. Rebuild the review catalogue before approving it.');
    if(ticket!==run)return null;
    const url=URL.createObjectURL(new Blob([bytes],{type:part.file.endsWith('.mp3')?'audio/mpeg':'audio/wav'}));blobCache.set(key,url);return url;
  }
  async function playItem(item,comparison=false){
    const parts=comparison?item.previousParts:item.parts;
    stop();clearSources();const ticket=run;active=item;$('#stop').disabled=false;refreshCard(item);
    $('#now-playing').textContent=comparison?`Previous cut · ${item.text}`:item.text;$('#play-state').textContent='Loading verified audio…';
    let urls;
    try{controller=new AbortController();urls=await Promise.all(parts.map(part=>checkedAudio(part,ticket,controller.signal)));if(ticket!==run)return;}
    catch(error){if(ticket!==run)return;stop();$('#play-state').textContent=error.message;message('Could not load this item. No approval or listening confirmation was saved.',true);return;}
    const playPart=async index=>{
      if(ticket!==run)return;
      try{
        player.src=urls[index];player.hidden=false;player.volume=.9;player.playbackRate=1;
        player.onerror=()=>{if(ticket===run){stop();$('#play-state').textContent='Playback failed. No listening confirmation was saved.';}};
        player.onended=()=>{
          if(ticket!==run)return;
          if(index+1<parts.length){$('#play-state').textContent='Next name…';partTimer=setTimeout(()=>playPart(index+1),90);}
          else {player.onended=null;active=null;$('#stop').disabled=true;if(!comparison)save(item,{heard:true});$('#play-state').textContent=comparison?'Previous cut finished. Play the revised clip before deciding.':'Finished. Choose Correct, Needs fixing or Unsure.';refreshCard(item);}
        };
        await player.play();if(ticket===run)$('#play-state').textContent=parts.length>1?`Name ${index+1} of ${parts.length} · ${parts[index].text}`:(comparison?'Playing the previous cut for comparison':'Playing the complete clip at normal speed');
      }catch(error){if(ticket!==run)return;stop();$('#play-state').textContent=error.message;message('Could not play this item. No approval or listening confirmation was saved.',true);}
    };
    await playPart(0);
  }
  function compareSource(item){
    stop();clearSources();const ticket=run,audio=sourcePlayers.get(item.source.id);if(!audio)return;
    $('#now-playing').textContent=`Original context · ${item.text}`;$('#play-state').textContent=`${item.source.start.toFixed(2)}–${item.source.end.toFixed(2)} seconds. Play the isolated clip separately to review it.`;$('#stop').disabled=false;
    const start=()=>{if(ticket!==run)return;audio.currentTime=item.source.start;audio.ontimeupdate=()=>{if(audio.currentTime>=item.source.end){audio.pause();audio.ontimeupdate=null;$('#stop').disabled=true;}};audio.play().catch(()=>message('Source playback failed. Try the controls under Original recordings.',true));};
    if(audio.readyState>=1)start();else{audio.addEventListener('loadedmetadata',start,{once:true});audio.load();}
  }
  function renderSources(){
    for(const source of manifest.sources){
      const card=node('article',undefined,'source');card.append(node('h3',source.title),node('p',`${source.duration.toFixed(2)} seconds · unchanged original`,'hint'));
      const audio=node('audio');audio.controls=true;audio.preload='none';audio.src=new URL(source.file,repo);audio.setAttribute('aria-label',source.title);sourcePlayers.set(source.id,audio);
      audio.addEventListener('play',()=>{stop();for(const other of sourcePlayers.values())if(other!==audio){other.pause();other.ontimeupdate=null;}$('#stop').disabled=false;$('#now-playing').textContent=source.title;$('#play-state').textContent='Original source. This does not confirm an individual item.';});
      audio.addEventListener('ended',()=>{$('#stop').disabled=true;audio.ontimeupdate=null;});card.append(audio);
      if(source.transcriptText){const detail=node('details');detail.append(node('summary','Submitted Arabic text'));const text=node('p',source.transcriptText,'transcript');text.lang='ar';text.dir='rtl';detail.append(text);card.append(detail);}
      $('#sources').append(card);
    }
  }
  function exported(){return {schemaVersion:1,kind:'letter-garden-audio-review',testOnly:qa,exportedAt:new Date().toISOString(),coverage:manifest.summary,decisions:state.decisions,items:items.filter(item=>state.decisions[item.id]).map(item=>({id:item.id,text:item.text,status:item.status,signature:item.signature,parts:item.parts,source:item.source})),reviewSummary:Core.counts(items,state)};}
  $('#export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(exported(),null,2)],{type:'application/json'})),a=node('a');a.href=url;a.download=`letter-garden-audio-review${qa?'-QA-TEST':''}-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);message('Results downloaded. Attach the JSON file in our conversation when you are ready.');};
  $('#copy').onclick=async()=>{try{await navigator.clipboard.writeText(JSON.stringify(exported(),null,2));message('Results copied. Paste them in our conversation, or keep the downloaded file as your backup.');}catch{message('Clipboard access was unavailable. Use Download review results instead.',true);}};
  $('#export-bottom').onclick=()=>$('#export').click();
  $('#show-results').onclick=()=>{$('#results-text').value=JSON.stringify(exported(),null,2);$('#results-panel').hidden=false;$('#results-text').focus();$('#results-text').select();};
  $('#hide-results').onclick=()=>{$('#results-panel').hidden=true;};
  $('#import').onclick=()=>$('#import-file').click();
  $('#import-file').onchange=async event=>{
    const file=event.target.files[0];if(!file)return;
    try{
      if(file.size>4*1024*1024)throw Error('This is too large to be a review results file.');
      const data=JSON.parse(await file.text());if(data.kind!=='letter-garden-audio-review'||data.schemaVersion!==1)throw Error('Choose an exported Letter Garden audio review JSON file.');
      if(data.testOnly&&!qa)throw Error('QA test decisions cannot be restored into your real review.');
      const safe=Core.clean(data),known=new Set(items.map(item=>item.id));for(const id of Object.keys(safe.decisions))if(!known.has(id))delete safe.decisions[id];
      state=Core.merge(Core.merge(state,read()),safe);localStorage.setItem(storageKey,JSON.stringify(state));summary();render();message(`Restored ${Object.keys(safe.decisions).length} item records. Newer local decisions were kept; changed clips need another listen.`);
    }catch(error){message(`Could not restore results: ${error.message}`,true);}finally{event.target.value='';}
  };
  for(const id of ['section','family','decision','search'])$('#'+id).addEventListener(id==='search'?'input':'change',()=>{stopEverything();page=0;render();});
  for(const [id,delta] of [['previous',-1],['next',1],['previous-bottom',-1],['next-bottom',1]])$('#'+id).onclick=()=>{stopEverything();page+=delta;render();$('#queue-title').scrollIntoView({block:'start',behavior:'instant'});};
  $('#stop').onclick=stopEverything;
  $('#review-next100').onclick=()=>{stopEverything();$('#section').value=manifest.reviewQueues.at(-1).id;$('#family').value='all';$('#decision').value='all';$('#search').value='';const first=queueItems().findIndex(item=>!Core.current(item,state).verdict);page=first<0?0:Math.floor(first/10);render();$('#queue-title').scrollIntoView({block:'start',behavior:'instant'});};
  $('#review-revisions').onclick=()=>{stopEverything();$('#section').value='revised';$('#family').value='all';$('#decision').value='all';$('#search').value='';page=0;render();$('#queue-title').scrollIntoView({block:'start',behavior:'instant'});};
  $('#start-review').onclick=()=>$('#queue-title').scrollIntoView({block:'start',behavior:'instant'});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopEverything();});
  window.addEventListener('pagehide',stopEverything);
  window.addEventListener('storage',event=>{if(event.key!==storageKey)return;state=Core.merge(state,read());summary();if(document.activeElement?.tagName!=='TEXTAREA')render();});
  fetch('./manifest.json',{cache:'no-store'}).then(response=>{if(!response.ok)throw Error('Catalogue could not load.');return response.json();}).then(data=>{
    if(data.schemaVersion!==1||!Array.isArray(data.items))throw Error('Unrecognized review catalogue.');
    manifest=data;items=data.items;state=read();$('#totals').replaceChildren();
    for(const [count,label] of [[data.summary.installed,'installed clips'],[data.summary.candidate,'candidate cuts'],[data.summary.sequence,'name sequences'],[data.summary.unmapped,'awaiting cuts'],[data.summary.policy,'teaching decisions']]){const el=node('span',undefined,'total');el.append(node('strong',count),document.createTextNode(label));$('#totals').append(el);}
    for(const queue of data.reviewQueues||[]){if(queue.id==='next100')continue;const option=node('option',queue.title);option.value=queue.id;$('#section').prepend(option);}
    const latest=data.reviewQueues?.at(-1);if(latest)$('#review-next100').textContent=latest.revisionOnly?`Recheck ${latest.itemIds.length} revised clips ↓`:`Open ${latest.itemIds.length} ${latest.individualOnly?'listening items':'previous review items'} ↓`;
    for(const family of [...new Set(items.map(item=>item.family))]){const option=node('option',family);option.value=family;$('#family').append(option);}
    for(const id of ['section','family','search','decision','export','export-bottom','copy','import','start-review','show-results','review-revisions','review-next100'])$('#'+id).disabled=false;
    const requested=new URLSearchParams(location.search).get('section');$('#section').value=data.reviewQueues?.some(q=>q.id===requested)?requested:requested==='revised'?'revised':latest?.id||'installed';if(selectedQueue()){const first=queueItems().findIndex(item=>!Core.current(item,state).verdict);page=first<0?0:Math.floor(first/10);}
    renderSources();summary();render();
  }).catch(error=>{$('#totals').textContent='Catalogue unavailable';message(`${error.message} Open this page through the local preview server, not file://.`,true);});
})();
