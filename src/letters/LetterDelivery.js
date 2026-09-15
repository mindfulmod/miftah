// Optional, untimed listening practice. This activity owns no rewards or progress.
(function(ns){
  let sessionCursor=0,artSerial=0;
  const Art=()=>ns.LettersArt;
  const helpIcon='<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M7 32Q32 7 57 32Q32 57 7 32Z" fill="#fffaf0" stroke="#4a3620" stroke-width="4"/><circle cx="32" cy="32" r="12" fill="#7fce54" stroke="#4a3620" stroke-width="3"/><circle cx="28" cy="27" r="3" fill="#fffdf7"/></svg>';
  const glyph=(item,cls='')=>{
    const display=item?.display || '';
    const shift=Art().inkShift(display,72,false);
    return `<svg class="delivery-glyph ${cls}" x="-50" y="-50" width="100" height="100" viewBox="-50 -50 100 100" aria-hidden="true"><text data-fit-box="0,0,74,76,72" x="${shift.dx}" y="${shift.dy}" text-anchor="middle" font-family="'Amiri Quran',serif" font-size="72" fill="#4a3620" direction="rtl">${display}</text></svg>`;
  };
  const packet=(item)=>`<svg class="delivery-packet-art" viewBox="0 0 120 126" aria-hidden="true">
    <defs><linearGradient id="delivery-paper-${item.id}" x2="0" y2="1"><stop stop-color="#fffdf7"/><stop offset=".62" stop-color="#fffaf0"/><stop offset="1" stop-color="#e5dcc8"/></linearGradient></defs>
    <ellipse cx="60" cy="116" rx="42" ry="7" fill="#4a3620" opacity=".15"/>
    <path d="M18 18Q60 8 102 18V105Q61 116 18 105Z" fill="url(#delivery-paper-${item.id})" stroke="#4a3620" stroke-width="4" stroke-linejoin="round"/>
    <path d="M18 18L60 42 102 18M22 101Q60 108 98 101" fill="none" stroke="#c9bda4" stroke-width="3"/>
    <path d="M30 15Q60 5 90 15" fill="none" stroke="#ffe49a" stroke-width="6" stroke-linecap="round"/>
    <g transform="translate(60 72) scale(.85)">${glyph(item)}</g>
  </svg>`;
  const garden=(item,revealed,growth=0)=>`<svg class="delivery-garden-art" viewBox="0 0 310 250" aria-hidden="true">
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
  const icon=(size=86)=>{
    const id=`letter-delivery-icon-${artSerial++}`;
    return `<svg class="letter-delivery-icon" width="${size}" height="${Math.round(size*.7)}" viewBox="0 0 200 140" aria-hidden="true">
      <defs><linearGradient id="${id}-paper" x2="0" y2="1"><stop stop-color="#fffdf7"/><stop offset=".62" stop-color="#fffaf0"/><stop offset="1" stop-color="#e5dcc8"/></linearGradient><linearGradient id="${id}-garden" x2="0" y2="1"><stop stop-color="#b7e779"/><stop offset=".58" stop-color="#7fce54"/><stop offset="1" stop-color="#4e9677"/></linearGradient></defs>
      <ellipse cx="109" cy="122" rx="79" ry="9" fill="#2f5c46" opacity=".2"/>
      <path d="M75 88Q126 66 180 87L172 118Q128 136 84 119Z" fill="url(#${id}-garden)"/>
      <path d="M126 121V94M126 108Q110 109 112 97Q123 96 126 108M127 103Q140 102 139 91Q129 92 127 103" fill="#7fce54" stroke="#4e9677" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <g transform="translate(22 22) rotate(-8 32 43)"><path d="M3 3Q32 -3 61 3V82Q32 91 3 82Z" fill="url(#${id}-paper)" stroke="#4a3620" stroke-width="4" stroke-linejoin="round"/><path d="M3 3L32 21 61 3M9 73Q32 80 55 73" fill="none" stroke="#c9bda4" stroke-width="3"/><path d="M14 31H50M14 43H42" fill="none" stroke="#e8743c" stroke-width="4" stroke-linecap="round"/></g>
      <path d="M72 46Q104 47 119 68" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round" stroke-dasharray="3 8"/><path d="M111 56L121 70 105 72" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  };

  class LetterDelivery {
    constructor(ctx){
      this.ctx=ctx;this.alive=true;this.index=0;this.busy=false;this.selected=null;
      this.dragResets=[];this.timers=new Set();this.keyboardFocus=false;
      this.items=[...new Map((ctx.items||[]).filter(item=>item&&item.id&&item.display).map(item=>[item.id,item])).values()];
      const offset=this.items.length?sessionCursor%this.items.length:0;
      this.rounds=this.items.length?Array.from({length:4},(_,i)=>this.items[(offset+i)%this.items.length]):[];
      if(this.items.length)sessionCursor=(sessionCursor+4)%this.items.length;
      this.onStageKey=e=>{if(e.key==='Enter'||e.key===' '||e.key==='Spacebar')this.keyboardFocus=true;};
      this.onStagePointer=()=>{this.keyboardFocus=false;};
      ctx.stage.addEventListener?.('keydown',this.onStageKey);ctx.stage.addEventListener?.('pointerdown',this.onStagePointer);
      this.show();
    }
    later(fn,delay){const id=setTimeout(()=>{this.timers.delete(id);if(this.alive)fn();},delay);this.timers.add(id);return id;}
    petArt(){const art=typeof this.ctx.petArt==='function'?this.ctx.petArt('listening'):this.ctx.petArt;return art||'';}
    choices(){
      if(this.items.length<=1)return this.items.slice();
      const fallback=this.index===0?2:3;
      const target=this.target,wanted=Math.min(this.items.length,this.roundProfile?.choiceCount||fallback),list=[target];
      const distractors=this.items.filter(item=>item.id!==target.id),spin=this.index%distractors.length;
      for(let step=0;list.length<wanted;step++)list.push(distractors[(spin+step)%distractors.length]);
      return this.index%2?[list[1],target,...list.slice(2)]:list;
    }
    show(){
      if(!this.alive)return;
      this.dragResets.forEach(reset=>reset());this.dragResets=[];this.busy=false;this.selected=null;this.assisted=false;this.revealed=false;
      this.target=this.rounds[this.index];
      if(!this.target){this.finish();return;}
      this.promptGeneration=(this.promptGeneration||0)+1;this.speechAttempt=0;this.speechConfirmed=false;this.waitingForSpeech=false;
      this.roundProfile=ns.LettersLearning?.profile?.(this.target,{...this.ctx,activity:'LetterDelivery',skill:'letter-name'})||null;
      this.listening=this.ctx.canListen?.()!==false;
      const wantsListening=(this.roundProfile?.promptMode||'listen')==='listen';
      this.assisted=this.items.length===1||!this.listening;this.revealed=!this.listening||!wantsListening;
      const options=this.options=this.choices();
      this.ctx.prompt?.(this.revealed?this.target:null,this.promptContext());
      this.ctx.stage.innerHTML=`<div class="letter-delivery">
        <div class="delivery-top"><div class="delivery-progress" role="progressbar" aria-label="Letter delivery progress" aria-valuemin="0" aria-valuemax="4" aria-valuenow="${this.index}">${Array.from({length:4},(_,i)=>`<i class="${i<this.index?'is-done':i===this.index?'is-on':''}" aria-hidden="true"></i>`).join('')}</div><span class="delivery-support"><button type="button" class="delivery-help" aria-label="Show the matching letter">${helpIcon}</button><button type="button" class="delivery-listen" aria-label="Hear the letter again" ${this.listening?'':'disabled'}>${Art().icon('speaker',28)}</button></span></div>
        <div class="delivery-scene"><div class="delivery-pet" aria-hidden="true">${this.petArt()}</div><button type="button" class="delivery-destination" aria-label="Deliver the selected seed packet to the garden">${garden(this.target,this.revealed,this.index)}</button></div>
        <div class="delivery-packets" role="group" aria-label="Seed packets">${options.map(item=>`<button type="button" class="delivery-packet" data-item="${item.id}" aria-label="Seed packet ${item.display}" aria-pressed="false">${packet(item)}</button>`).join('')}</div>
        <div class="delivery-status" role="status" aria-live="polite"></div>
      </div>`;
      this.destination=this.ctx.stage.querySelector('.delivery-destination');
      this.listen=this.ctx.stage.querySelector('.delivery-listen');this.listen.onclick=()=>{if(this.alive&&!this.busy&&this.listening)this.requestSpeech(true);};
      this.helpButton=this.ctx.stage.querySelector('.delivery-help');this.helpButton.onclick=()=>{if(this.alive&&!this.busy)this.help();};
      this.status=this.ctx.stage.querySelector('.delivery-status');
      this.pet=this.ctx.stage.querySelector('.delivery-pet');
      this.packetButtons=[...this.ctx.stage.querySelectorAll('.delivery-packet')];
      this.destination.onclick=()=>{if(this.alive&&!this.busy&&this.selected)this.offer(this.selected);};
      this.packetButtons.forEach(button=>{
        const item=options.find(option=>option.id===button.dataset.item);
        button.onclick=()=>{if(!this.alive||this.busy||button.disabled)return;this.select(item,button);};
        this.dragResets.push(ns.GardenPractice.draggable(button,{enabled:()=>this.alive&&!this.busy&&!button.disabled,drop:(x,y)=>{if(ns.GardenPractice.inside(this.destination,x,y))this.offer(item);}}));
      });
      if(this.revealed){this.destination.classList.add('is-help');if(this.assisted)this.packetButtons.find(button=>button.dataset.item===this.target.id)?.classList.add('is-help');}
      if(this.listening)this.requestSpeech(false);
      if(this.keyboardFocus)this.packetButtons[0]?.focus?.();
    }
    promptContext(){return {promptMode:this.revealed?'match':(this.roundProfile?.promptMode||'listen'),skill:this.roundProfile?.skill||'letter-name',choiceIds:(this.options||[]).map(item=>item.id),activity:'LetterDelivery'};}
    setChoicesWaiting(waiting){
      this.waitingForSpeech=waiting;
      this.packetButtons?.forEach(button=>{
        if(waiting){button.__deliveryWaitingDisabled=!button.disabled;button.disabled=true;}
        else if(button.__deliveryWaitingDisabled){button.disabled=false;button.__deliveryWaitingDisabled=false;}
      });
      if(this.destination){
        if(waiting){this.destination.__deliveryWaitingDisabled=!this.destination.disabled;this.destination.disabled=true;}
        else if(this.destination.__deliveryWaitingDisabled){this.destination.disabled=false;this.destination.__deliveryWaitingDisabled=false;}
      }
      if(waiting&&this.status)this.status.innerHTML=Art().icon('speaker',30);
    }
    requestSpeech(replay=false){
      if(!this.alive||!this.listening)return;
      const generation=this.promptGeneration,attempt=++this.speechAttempt,alreadyConfirmed=this.speechConfirmed;
      const requiresSpeech=!alreadyConfirmed&&!this.revealed;
      if(requiresSpeech&&!this.waitingForSpeech)this.setChoicesWaiting(true);
      if(this.speechTimer){clearTimeout(this.speechTimer);this.timers.delete(this.speechTimer);}
      if(requiresSpeech){
        const timeout=setTimeout(()=>this.settleSpeech(generation,attempt,false,alreadyConfirmed),2500);
        this.timers.add(timeout);this.speechTimer=timeout;
      }else this.speechTimer=null;
      let result;
      try{result=this.ctx.say?.(this.target);}catch(_error){result=false;}
      // Only an explicit confirmation is usable. A legacy adapter returning
      // nothing (or Array#push's length) cannot establish that sound played.
      if(!result||typeof result.then!=='function'){
        this.settleSpeech(generation,attempt,result===true,alreadyConfirmed);
        return;
      }
      Promise.resolve(result).then(
        ok=>this.settleSpeech(generation,attempt,ok===true,alreadyConfirmed),
        ()=>this.settleSpeech(generation,attempt,false,alreadyConfirmed),
      );
    }
    settleSpeech(generation,attempt,played,alreadyConfirmed=false){
      if(!this.alive||generation!==this.promptGeneration||attempt!==this.speechAttempt)return;
      if(this.speechTimer){clearTimeout(this.speechTimer);this.timers.delete(this.speechTimer);this.speechTimer=null;}
      if(played){this.speechConfirmed=true;if(!alreadyConfirmed)this.setChoicesWaiting(false);return;}
      // A free replay cannot revoke evidence from the prompt that already
      // played. A failed initial attempt must become a visible supported round.
      if(alreadyConfirmed||this.revealed)return;
      this.revealForSpeechFailure();
    }
    revealForSpeechFailure(){
      if(!this.alive||this.busy)return;
      this.speechAttempt+=1;
      if(this.speechTimer){clearTimeout(this.speechTimer);this.timers.delete(this.speechTimer);this.speechTimer=null;}
      this.setChoicesWaiting(false);this.assisted=true;this.revealed=true;
      this.ctx.prompt?.(this.target,this.promptContext());
      if(this.destination){this.destination.innerHTML=garden(this.target,true,this.index);this.destination.classList.add('is-help');}
      this.packetButtons?.find(button=>button.dataset.item===this.target.id)?.classList.add('is-help');
      if(this.status)this.status.innerHTML=Art().icon('speaker',30);
    }
    onSoundChange(){
      if(this.alive&&!this.busy&&this.ctx.canListen?.()===false)this.revealForSpeechFailure();
    }
    select(item,button){
      this.selected=item;
      this.packetButtons.forEach(choice=>{const on=choice===button;choice.setAttribute('aria-pressed',String(on));choice.classList.toggle('is-selected',on);});
      this.destination.classList.add('is-ready');this.status.innerHTML=`<span class="delivery-route">${Art().icon('arrow',28)}</span>`;
    }
    offer(item){
      if(!this.alive||this.busy||this.waitingForSpeech||!item)return;
      if(item.id!==this.target.id){this.report(item,false);this.help(item);return;}
      this.busy=true;this.dragResets.forEach(reset=>reset());
      this.destination.innerHTML=garden(this.target,true,this.index+1);this.destination.classList.add('is-delivered');this.pet?.classList.add('is-delighted');this.status.innerHTML=Art().icon('check',32);
      this.packetButtons.forEach(button=>button.disabled=true);
      this.ctx.correct?.();
      this.report(item,true);
      this.later(()=>{this.index++;if(this.index>=this.rounds.length)this.finish();else this.show();},this.ctx.reducedMotion?.()?0:650);
    }
    help(item=null){
      this.assisted=true;this.revealed=true;this.selected=null;
      this.ctx.prompt?.(this.target,this.promptContext());if(this.listening)this.requestSpeech(true);
      this.destination.innerHTML=garden(this.target,true,this.index);this.destination.classList.remove('is-ready');this.destination.classList.add('is-help');
      this.status.innerHTML=Art().icon('speaker',30);
      this.packetButtons.forEach(button=>{
        const wrong=item&&button.dataset.item===item.id;const correct=button.dataset.item===this.target.id;
        button.setAttribute('aria-pressed','false');button.classList.remove('is-selected');
        if(wrong){button.disabled=true;button.classList.add('is-removed');}
        button.classList.toggle('is-help',correct);
      });
      this.packetButtons.find(button=>button.dataset.item===this.target.id)?.focus?.();
    }
    report(item,correct){
      this.ctx.reportOutcome?.({
        activity:'LetterDelivery',item:this.target,itemId:this.target.id,round:this.index+1,correct,
        assisted:this.assisted,independent:this.speechConfirmed&&!this.assisted&&!this.revealed,
        evidence:this.assisted?'assisted_response':this.speechConfirmed&&!this.revealed?'independent_listening':'supported_visible_matching',
        selectedId:item?.id,choiceIds:(this.options||[]).map(option=>option.id),
        skill:this.roundProfile?.skill||'letter-name',
      });
    }
    finish(){
      if(!this.alive)return;
      this.alive=false;this.cleanup();this.ctx.done?.();
    }
    cleanup(){
      this.promptGeneration=(this.promptGeneration||0)+1;this.speechAttempt=(this.speechAttempt||0)+1;
      this.timers.forEach(clearTimeout);this.timers.clear();this.dragResets.forEach(reset=>reset());this.dragResets=[];
      this.ctx.stage.removeEventListener?.('keydown',this.onStageKey);this.ctx.stage.removeEventListener?.('pointerdown',this.onStagePointer);
    }
    destroy(){if(!this.alive)return;this.alive=false;this.cleanup();}
  }
  ns.LetterDelivery=LetterDelivery;
  ns.LetterDelivery.icon=icon;
})(window.MiftahGame||(window.MiftahGame={}));
