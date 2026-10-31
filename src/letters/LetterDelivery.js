// Optional, untimed listening practice. This activity owns no rewards or progress.
(function(ns){
  let sessionCursor=0,artSerial=0;
  const Art=()=>ns.LettersArt;
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const helpIcon='<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M7 32Q32 7 57 32Q32 57 7 32Z" fill="#fffaf0" stroke="#4a3620" stroke-width="4"/><circle cx="32" cy="32" r="12" fill="#7fce54" stroke="#4a3620" stroke-width="3"/><circle cx="28" cy="27" r="3" fill="#fffdf7"/></svg>';
  const glyph=(item,cls='')=>{
    const display=item?.display || '';
    const shift=Art().inkShift(display,72,false);
    return `<svg class="delivery-glyph ${cls}" x="-50" y="-50" width="100" height="100" viewBox="-50 -50 100 100" aria-hidden="true"><text data-fit-box="0,0,74,76,72" x="${shift.dx}" y="${shift.dy}" text-anchor="middle" font-family="'Amiri Quran',serif" font-size="72" fill="#4a3620" direction="rtl">${escape(display)}</text></svg>`;
  };
  const classicPacket=(item)=>`<svg class="delivery-packet-art" viewBox="0 0 120 126" aria-hidden="true">
    <defs><linearGradient id="delivery-paper-${item.id}" x2="0" y2="1"><stop stop-color="#fffdf7"/><stop offset=".62" stop-color="#fffaf0"/><stop offset="1" stop-color="#e5dcc8"/></linearGradient></defs>
    <ellipse cx="60" cy="116" rx="42" ry="7" fill="#4a3620" opacity=".15"/>
    <path d="M18 18Q60 8 102 18V105Q61 116 18 105Z" fill="url(#delivery-paper-${item.id})" stroke="#4a3620" stroke-width="4" stroke-linejoin="round"/>
    <path d="M18 18L60 42 102 18M22 101Q60 108 98 101" fill="none" stroke="#c9bda4" stroke-width="3"/>
    <path d="M30 15Q60 5 90 15" fill="none" stroke="#ffe49a" stroke-width="6" stroke-linecap="round"/>
    <g transform="translate(60 72) scale(.85)">${glyph(item)}</g>
  </svg>`;
  const classicGarden=(item,revealed,growth=0)=>`<svg class="delivery-garden-art" viewBox="0 0 310 250" aria-hidden="true">
    <ellipse cx="165" cy="223" rx="130" ry="16" fill="#2f5c46" opacity=".18"/>
    <path d="M24 168Q117 116 290 158L275 214Q162 253 34 213Z" fill="#e5dcc8"/>
    <path d="M29 164Q119 122 286 160L272 204Q166 241 38 205Z" fill="#b7e779"/>
    <path d="M38 192Q165 224 278 190L272 204Q165 241 38 205Z" fill="#4e9677"/>
    <path d="M100 159Q175 138 248 163L239 197Q170 216 98 193Z" fill="#a89478"/>
    <path d="M102 159Q174 142 248 163L240 182Q174 199 100 178Z" fill="#c9bda4"/>
    <path d="M126 173Q181 159 222 174" fill="none" stroke="#4a3620" stroke-width="3" stroke-linecap="round" opacity=".3"/>
    <path d="M158 155V94M174 155V94" stroke="#a89478" stroke-width="8"/>
    <g class="delivery-destination-mark" transform="translate(168 76)">
      <rect x="-55" y="-61" width="110" height="120" rx="24" fill="#a89478"/>
      <rect x="-55" y="-67" width="110" height="120" rx="24" fill="#fffaf0" stroke="#4a3620" stroke-width="4"/>
      <path d="M-36-51H36" stroke="#fffdf7" stroke-width="6" stroke-linecap="round"/>
      ${revealed?glyph(item,'is-help'): '<path d="M-23-11H-12L5-26V20L-12 5H-23Z" fill="#a89478"/><path d="M14-14Q25-2 14 10M24-24Q42-2 24 21" fill="none" stroke="#a89478" stroke-width="4" stroke-linecap="round"/>'}
    </g>
    ${Array.from({length:4},(_,i)=>{const x=113+i*36,y=199+(i%2?0:-5);return `<g transform="translate(${x} ${y})"><path d="M0 0V-17M0-7Q-15-6-11-16Q0-16 0-7M0-10Q14-12 12-21Q2-22 0-10" fill="#7fce54" stroke="#4e9677" stroke-width="2.4"/>${i<growth?'<path d="M0-22Q-15-16-14-27Q-13-36-5-31Q-5-44 3-40Q9-38 7-30Q19-34 17-24Q14-18 5-21Z" fill="#ee806f" stroke="#4a3620" stroke-width="1.6"/><circle cy="-27" cx="2" r="5" fill="#f3c955"/>':''}</g>`;}).join('')}
  </svg>`;
  const classicIcon=(size=86)=>{
    const id=`letter-delivery-icon-${artSerial++}`;
    return `<svg class="letter-delivery-icon" width="${size}" height="${Math.round(size*.7)}" viewBox="0 0 200 140" aria-hidden="true">
      <defs><linearGradient id="${id}-paper" x2="0" y2="1"><stop stop-color="#fffdf7"/><stop offset=".62" stop-color="#fffaf0"/><stop offset="1" stop-color="#e5dcc8"/></linearGradient><linearGradient id="${id}-garden" x2="0" y2="1"><stop stop-color="#b7e779"/><stop offset=".58" stop-color="#7fce54"/><stop offset="1" stop-color="#4e9677"/></linearGradient></defs>
      <ellipse cx="109" cy="122" rx="79" ry="9" fill="#2f5c46" opacity=".2"/>
      <path d="M75 88Q126 66 180 87L172 118Q128 136 84 119Z" fill="url(#${id}-garden)"/>
      <path d="M126 121V94M126 108Q110 109 112 97Q123 96 126 108M127 103Q140 102 139 91Q129 92 127 103" fill="#7fce54" stroke="#4e9677" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${/* v187: delivery looks like delivery: an envelope flying on a dotted arc into a garden mailbox on its post, flag up. */''}
      <rect x="150" y="66" width="10" height="52" rx="4" fill="#70501b" stroke="#4a3620" stroke-width="3"/>
      <path d="M118 70V50Q118 32 141 32H164Q186 32 186 50V70Z" fill="#ee806f" stroke="#4a3620" stroke-width="4" stroke-linejoin="round"/><path d="M124 46Q126 38 136 37" fill="none" stroke="#ffa798" stroke-width="3" stroke-linecap="round"/>
      <path d="M118 70V50Q118 36 130 34Q120 42 120 54V70Z" fill="#c25a49"/><ellipse cx="121" cy="52" rx="6" ry="16" fill="#4a3620"/><path d="M118 48L128 44V58L118 56Z" fill="#fffdf7" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M176 56V16" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/><circle cx="176" cy="56" r="3" fill="#f3c955" stroke="#4a3620" stroke-width="1.6"/><path d="M176 14H190Q193 14 193 17V23Q193 26 190 26H176Z" fill="#f3c955" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M78 52Q98 34 114 46" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 9"/>
      <g transform="translate(20 46) rotate(-10 30 20)"><rect x="0" y="0" width="60" height="40" rx="7" fill="url(#${id}-paper)" stroke="#4a3620" stroke-width="4"/><path d="M4 5L30 24L56 5" fill="none" stroke="#c9bda4" stroke-width="3" stroke-linejoin="round"/><path d="M30 18Q26 13 23 16Q21 20 30 26Q39 20 37 16Q34 13 30 18Z" fill="#ee806f" stroke="#4a3620" stroke-width="1.6" stroke-linejoin="round"/></g>
    </svg>`;
  };

  const packet=item=>ns.DeliveryPlayArt?.packet(item,glyph(item))||classicPacket(item);
  const garden=(item,revealed,growth)=>ns.DeliveryPlayArt?.garden(item,revealed,growth,glyph(item,'is-help'))||classicGarden(item,revealed,growth);
  const icon=size=>ns.DeliveryPlayArt?.icon(size)||classicIcon(size);
  const eligible=(item,ctx)=>item?.id&&item.display&&item.taught!==false&&item.isTaught!==false&&item.locked!==true&&item.unlocked!==false
    &&!(item.prerequisiteWorldIds||[]).some(id=>id!==ctx.worldId&&!(ctx.completedWorldIds||[]).includes(id));

  class LetterDelivery {
    constructor(ctx){
      this.ctx=ctx;this.alive=true;this.index=0;this.busy=false;this.selected=null;
      this.dragResets=[];this.timers=new Set();this.keyboardFocus=false;this.supported=false;
      const ids=new Set(),marks=new Set();
      this.items=(ctx.items||[]).filter(item=>{
        if(!eligible(item,ctx))return false;
        const mark=String(item.display).normalize('NFC');
        if(ids.has(item.id)||marks.has(mark))return false;
        ids.add(item.id);marks.add(mark);return true;
      });
      const offset=this.items.length?sessionCursor%this.items.length:0;
      const requested=Array.isArray(ctx.targets);
      const planned=requested?ctx.targets.map(id=>this.items.find(item=>item.id===id)).filter(Boolean)
        :ns.PracticeLearning?.plan?.(ctx,this.items,'letter-name',4)||this.items.map((_,i)=>this.items[(offset+i)%this.items.length]).slice(0,4);
      const safe=planned.filter(item=>this.items.includes(item));
      this.rounds=safe.length?Array.from({length:4},(_,i)=>safe[i%safe.length]):[];
      if(this.items.length)sessionCursor=(sessionCursor+4)%this.items.length;
      this.profiles=new Map(this.rounds.map(item=>[item.id,this.profileFor(item)]));
      // Stay at the least-established target's level for this whole visit.
      this.visitChoices=Math.min(3,ctx.choiceCount||3,...[...this.profiles.values()].map(p=>p.choiceCount));
      this.onStageKey=e=>{if(e.key==='Enter'||e.key===' '||e.key==='Spacebar')this.keyboardFocus=true;};
      this.onStagePointer=()=>{this.keyboardFocus=false;};
      ctx.stage.addEventListener?.('keydown',this.onStageKey);ctx.stage.addEventListener?.('pointerdown',this.onStagePointer);
      this.show();
    }
    profileFor(item){
      const ctx={...this.ctx,activity:'LetterDelivery',skill:'letter-name'};
      const p=ns.PracticeLearning?.profile?.(ctx,item,'letter-name')||ns.LettersLearning?.profile?.(item,ctx)||{promptMode:'match',choiceCount:2};
      const visible=ctx.beginner||ctx.allowRecall===false;
      return {...p,skill:'letter-name',promptMode:visible?'match':p.promptMode||'match',choiceCount:visible?2:Math.max(2,Math.min(3,Number(p.choiceCount)||2))};
    }
    later(fn,delay){const generation=this.promptGeneration,id=setTimeout(()=>{this.timers.delete(id);if(this.alive&&generation===this.promptGeneration)fn();},delay);this.timers.add(id);return id;}
    petArt(){const art=typeof this.ctx.petArt==='function'?this.ctx.petArt('listening'):this.ctx.petArt;return art||'';}
    choices(){
      const target=this.target,wanted=Math.min(this.items.length,this.visitChoices,this.supported?2:3),list=[target];
      const distractors=this.items.filter(item=>item.id!==target.id),spin=distractors.length?this.index%distractors.length:0;
      for(let step=0;list.length<wanted;step++)list.push(distractors[(spin+step)%distractors.length]);
      return this.index%2&&list.length>1?[list[1],target,...list.slice(2)]:list;
    }
    resetRound(){
      this.invalidateSpeech();this.timers.forEach(clearTimeout);this.timers.clear();
      this.dragResets.forEach(reset=>reset());this.dragResets=[];
    }
    show(){
      if(!this.alive)return;
      this.resetRound();this.promptGeneration=(this.promptGeneration||0)+1;
      this.phase='answer';this.busy=false;this.selected=null;this.speechConfirmed=false;this.waitingForSpeech=false;
      this.target=this.rounds[this.index];
      if(!this.target){this.alive=false;this.cleanup();this.ctx.cancel?.();return;}
      this.roundProfile={...this.profiles.get(this.target.id)};
      if(this.supported){this.roundProfile.promptMode='match';this.roundProfile.choiceCount=2;}
      this.listening=this.ctx.canListen?.()!==false;
      this.assisted=this.items.length===1||!this.listening||this.supported;
      this.revealed=!this.listening||this.roundProfile.promptMode!=='listen';
      const options=this.options=this.choices();
      this.ctx.prompt?.(this.revealed?this.target:null,this.promptContext());this.ctx.beginRound?.(this.target,'letter-name');
      this.ctx.stage.innerHTML=`<div class="letter-delivery">
        <div class="delivery-top"><div class="delivery-progress" role="progressbar" aria-label="Letter delivery progress" aria-valuemin="0" aria-valuemax="4" aria-valuenow="${this.index}">${Array.from({length:4},(_,i)=>`<i class="${i<this.index?'is-done':i===this.index?'is-on':''}" aria-hidden="true"></i>`).join('')}</div><span class="delivery-support"><button type="button" class="delivery-help" aria-label="Show the matching letter">${helpIcon}</button><button type="button" class="delivery-listen" aria-label="Hear the letter again" ${this.listening?'':'disabled'}>${Art().icon('speaker',28)}</button></span></div>
        <div class="delivery-scene"><div class="delivery-pet" aria-hidden="true">${this.petArt()}</div><button type="button" class="delivery-destination" aria-label="Plant the selected seed packet">${garden(this.target,this.revealed,this.index)}</button></div>
        <div class="delivery-packets is-hint" role="group" aria-label="Seed packets">${options.map(item=>`<button type="button" class="delivery-packet" data-item="${escape(item.id)}" aria-label="Seed packet ${escape(item.display)}" aria-pressed="false">${packet(item)}</button>`).join('')}</div>
        <div class="delivery-footer"><div class="delivery-status" role="status" aria-live="polite"></div><button type="button" class="delivery-next is-hint" aria-label="${this.index===3?'Finish planting':'Next seed packet'}" hidden>${Art().icon(this.index===3?'check':'next',32)}</button></div>
      </div>`;
      const stage=this.ctx.stage,generation=this.promptGeneration,current=()=>this.alive&&generation===this.promptGeneration;
      this.root=stage.querySelector('.letter-delivery');this.destination=stage.querySelector('.delivery-destination');
      this.listen=stage.querySelector('.delivery-listen');this.listen.onclick=()=>{if(current()&&!this.busy&&this.listening)this.requestSpeech(true);};
      this.helpButton=stage.querySelector('.delivery-help');this.helpButton.onclick=()=>{if(current()&&!this.busy)this.help();};
      this.next=stage.querySelector('.delivery-next');if(this.next)this.next.onclick=()=>{if(current())this.continue();};
      this.packetTray=stage.querySelector('.delivery-packets');
      this.status=stage.querySelector('.delivery-status');this.pet=stage.querySelector('.delivery-pet');
      this.packetButtons=[...stage.querySelectorAll('.delivery-packet')];
      this.destination.onclick=()=>{
        if(!current()||this.busy||this.waitingForSpeech)return;
        if(this.selected)return this.offer(this.selected);
        this.packetButtons.filter(b=>!b.disabled).forEach((b,k)=>{b.classList.remove('is-soon');this.later(()=>b.classList.add('is-soon'),k*90);});
      };
      this.packetButtons.forEach(button=>{
        const item=options.find(option=>String(option.id)===button.dataset.item);
        button.onclick=()=>{if(current()&&!this.busy&&!button.disabled)this.select(item,button);};
        this.dragResets.push(ns.GardenPractice.draggable(button,{
          enabled:()=>current()&&!this.busy&&!button.disabled,
          onDragMove:(x,y)=>{if(current())this.destination.classList.toggle('is-near',this.nearGarden(x,y));},
          onDragEnd:()=>{if(current())this.destination.classList.remove('is-near');},
          drop:(x,y)=>current()&&this.nearGarden(x,y)?this.offer(item):false
        }));
      });
      if(this.revealed)this.destination.classList.add('is-help');
      if(this.assisted)this.packetButtons.find(button=>button.dataset.item===String(this.target.id))?.classList.add('is-help');
      Art().fitGlyphs?.(stage);
      if(this.listening)this.requestSpeech();
      if(this.keyboardFocus)this.packetButtons[0]?.focus?.();
    }
    nearGarden(x,y){
      const r=this.destination?.getBoundingClientRect?.();
      return !!r&&r.width>0&&r.height>0&&x>=r.left-24&&x<=(r.right??r.left+r.width)+24&&y>=r.top-24&&y<=(r.bottom??r.top+r.height)+24;
    }
    promptContext(){return {promptMode:this.revealed?'match':'listen',skill:'letter-name',choiceIds:(this.options||[]).map(item=>item.id),activity:'LetterDelivery'};}
    invalidateSpeech(){
      this.speechAttempt=(this.speechAttempt||0)+1;
      if(this.speechTimer){clearTimeout(this.speechTimer);this.timers.delete(this.speechTimer);this.speechTimer=null;}
    }
    setChoicesWaiting(waiting){
      this.waitingForSpeech=waiting;
      [...(this.packetButtons||[]),this.destination].filter(Boolean).forEach(button=>{
        if(waiting){button.__deliveryWaitingDisabled=!button.disabled;button.disabled=true;}
        else if(button.__deliveryWaitingDisabled){button.disabled=false;button.__deliveryWaitingDisabled=false;}
      });
      if(this.status)this.status.innerHTML=waiting?Art().icon('speaker',30):'';
    }
    requestSpeech(){
      if(!this.alive||this.busy||!this.listening)return;
      this.invalidateSpeech();
      const generation=this.promptGeneration,attempt=this.speechAttempt,alreadyConfirmed=this.speechConfirmed;
      const requiresSpeech=!alreadyConfirmed&&!this.revealed;
      if(requiresSpeech&&!this.waitingForSpeech)this.setChoicesWaiting(true);
      if(requiresSpeech)this.speechTimer=this.later(()=>this.settleSpeech(generation,attempt,false,alreadyConfirmed),2500);
      let result;try{result=this.ctx.say?.(this.target);}catch(_error){result=false;}
      if(!result||typeof result.then!=='function'){this.settleSpeech(generation,attempt,result===true,alreadyConfirmed);return;}
      Promise.resolve(result).then(ok=>this.settleSpeech(generation,attempt,ok===true,alreadyConfirmed),()=>this.settleSpeech(generation,attempt,false,alreadyConfirmed));
    }
    settleSpeech(generation,attempt,played,alreadyConfirmed=false){
      if(!this.alive||this.busy||generation!==this.promptGeneration||attempt!==this.speechAttempt)return;
      if(this.speechTimer){clearTimeout(this.speechTimer);this.timers.delete(this.speechTimer);this.speechTimer=null;}
      if(played){this.speechConfirmed=true;if(this.waitingForSpeech)this.setChoicesWaiting(false);return;}
      if(alreadyConfirmed||this.revealed)return;
      this.revealForSpeechFailure();
    }
    revealForSpeechFailure(){this.help(null,false);}
    onSoundChange(){
      if(!this.alive||this.busy)return;
      this.listening=this.ctx.canListen?.()!==false;this.listen.disabled=!this.listening;
      if(!this.listening)this.revealForSpeechFailure();
    }
    select(item,button){
      if(!this.alive||this.busy||this.waitingForSpeech||!item||!this.options.includes(item))return;
      this.selected=item;
      this.packetButtons.forEach(choice=>{const on=choice===button;choice.setAttribute('aria-pressed',String(on));choice.classList.toggle('is-selected',on);});
      this.packetTray?.classList.remove('is-hint');this.destination.classList.add('is-ready','is-hint');this.status.innerHTML=`<span class="delivery-route" aria-hidden="true">${Art().icon('arrow',28)}</span>`;
    }
    offer(item){
      if(!this.alive||this.busy||this.waitingForSpeech||!item||!this.options.includes(item))return false;
      const choice=this.packetButtons.find(button=>button.dataset.item===String(item.id));
      if(choice?.disabled)return false;
      if(item.id!==this.target.id){this.report(item,false);this.help(item);return false;}
      this.busy=true;this.phase='landed';this.report(item,true);this.invalidateSpeech();
      this.dragResets.forEach(reset=>reset());
      this.root?.classList.add('is-landed');this.destination.innerHTML=garden(this.target,true,this.index+1);
      this.packetTray?.classList.remove('is-hint');this.destination.classList.remove('is-ready','is-near','is-hint');this.destination.classList.add('is-delivered');this.destination.disabled=true;
      this.pet?.classList.add('is-delighted');this.status.innerHTML=Art().icon('check',32);
      this.packetButtons.forEach(button=>{button.disabled=true;button.__deliveryWaitingDisabled=false;});
      choice?.classList.add('is-planted');this.helpButton.disabled=true;this.listen.disabled=true;
      this.ctx.stage.querySelector('.delivery-progress')?.setAttribute('aria-valuenow',String(this.index+1));
      this.ctx.stage.querySelectorAll('.delivery-progress i')?.forEach((dot,i)=>{dot.classList.toggle('is-done',i<=this.index);dot.classList.remove('is-on');});
      Art().fitGlyphs?.(this.destination);if(this.next){this.next.hidden=false;if(this.keyboardFocus)this.next.focus?.();}
      this.ctx.correct?.();return true;
    }
    continue(){
      if(!this.alive||this.phase!=='landed')return false;
      this.phase='leaving';this.ctx.stopSpeech?.();this.index++;
      if(this.index>=this.rounds.length)this.finish();else this.show();return true;
    }
    help(item=null,replay=true){
      if(!this.alive||this.busy)return;
      this.invalidateSpeech();this.setChoicesWaiting(false);
      this.supported=true;this.assisted=true;this.revealed=true;this.selected=null;
      this.ctx.prompt?.(this.target,this.promptContext());
      this.destination.innerHTML=garden(this.target,true,this.index);this.destination.classList.remove('is-ready','is-hint');this.packetTray?.classList.add('is-hint');this.destination.classList.add('is-help');
      this.packetButtons.forEach(button=>{
        const wrong=item&&button.dataset.item===String(item.id),correct=button.dataset.item===String(this.target.id);
        button.setAttribute('aria-pressed','false');button.classList.remove('is-selected');
        if(wrong){button.disabled=true;button.classList.add('is-removed');}button.classList.toggle('is-help',correct);
      });
      Art().fitGlyphs?.(this.destination);
      if(this.keyboardFocus)this.packetButtons.find(button=>button.dataset.item===String(this.target.id))?.focus?.();
      if(replay&&this.listening)this.requestSpeech();
    }
    report(item,correct){
      this.ctx.reportOutcome?.({activity:'LetterDelivery',item:this.target,itemId:this.target.id,round:this.index+1,correct,
        assisted:this.assisted,independent:this.speechConfirmed&&!this.assisted&&!this.revealed,
        evidence:this.assisted?'assisted_response':this.speechConfirmed&&!this.revealed?'independent_listening':'supported_visible_matching',
        selectedId:item?.id,choiceIds:(this.options||[]).map(option=>option.id),skill:'letter-name'});
    }
    finish(){if(!this.alive)return;this.alive=false;this.cleanup();this.ctx.done?.();}
    cleanup(){
      this.resetRound();this.promptGeneration=(this.promptGeneration||0)+1;this.ctx.stopSpeech?.();
      this.ctx.stage.removeEventListener?.('keydown',this.onStageKey);this.ctx.stage.removeEventListener?.('pointerdown',this.onStagePointer);
    }
    destroy(){if(!this.alive)return;this.alive=false;this.cleanup();}
  }
  ns.LetterDelivery=LetterDelivery;
  ns.LetterDelivery.icon=icon;
  ns.LetterDelivery.classic={packet:classicPacket,garden:classicGarden,icon:classicIcon};
})(window.MiftahGame||(window.MiftahGame={}));
