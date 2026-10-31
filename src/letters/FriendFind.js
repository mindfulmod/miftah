// Find My Friend: a small, child-led puppet show. The friend's body remains
// the taught letter; supported matching and hearing its name are distinct evidence.
(function (ns) {
  const shuffle = list => { const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; };
  const eligible = (item,ctx) => item?.id && ns.LetterFriends?.get?.(item.display)
    && item.taught!==false && item.isTaught!==false && item.locked!==true && item.unlocked!==false
    && (!ctx.completedWorldIds || !(item.prerequisiteWorldIds||[]).some(id=>id!==ctx.worldId&&!ctx.completedWorldIds.includes(id)));
  function taughtItems(rows,ctx) {
    const items=(rows||[]).filter(Boolean),blocked=new Set(items.filter(i=>!eligible(i,ctx)).map(i=>i.display)),ids=new Set(),chars=new Set();
    return items.filter(i=>{if(!eligible(i,ctx)||blocked.has(i.display)||ids.has(i.id)||chars.has(i.display))return false;ids.add(i.id);chars.add(i.display);return true;});
  }

  class FriendFind {
    constructor(ctx) {
      this.ctx=ctx;this.alive=true;this.finished=false;this.round=0;this.busy=false;this.waiting=false;
      this.roundToken=0;this.speechAttempt=0;this.speechTimer=null;this.revealTimer=null;this.helped=new Set();
      this.pool=taughtItems([...(ctx.items||[]),...(ctx.known||[])],ctx);
      this.items=this.pool.filter(i=>(ctx.items||[]).some(target=>target.id===i.id&&target.display===i.display));
      this.rounds=Number.isFinite(ctx.rounds)?Math.max(2,Math.min(6,Math.floor(ctx.rounds))):ctx.beginner?3:4;
      const planned=Array.isArray(ctx.targets)?ctx.targets.map(id=>this.items.find(i=>i.id===id)).filter(Boolean)
        :ns.PracticeLearning?.plan?.(ctx,this.items,'friend',this.rounds)||this.items;
      const valid=planned.filter(item=>this.items.some(i=>i.id===item?.id&&i.display===item.display));
      this.targets=valid.length?Array.from({length:this.rounds},(_,i)=>valid[i%valid.length]):[];
      const policies=valid.map(item=>ns.PracticeLearning?.profile?.(ctx,item,'friend')||{choiceCount:2,promptMode:'match'});
      this.choiceCount=Math.min(this.pool.length,ctx.choiceCount===2?2:3,...policies.map(p=>p.choiceCount===3?3:2));
      this.allowRecall=!ctx.beginner&&ctx.allowRecall!==false&&policies.length>0&&policies.every(p=>p.promptMode==='listen');
      if(this.pool.length<2||!this.targets.length){this.destroy();Promise.resolve().then(()=>ctx.cancel?.());return;}
      this.next();
    }

    next() {
      if(!this.alive)return;
      const F=ns.LetterFriends;
      this.cancelSpeech();this.cancelReveal();this.roundToken++;
      this.target=this.targets[this.round];this.busy=false;this.waiting=false;this.heard=false;this.assisted=false;this.missed=false;this.misses=new Set();this.hint=false;
      const supported=this.helped.has(this.target.id)||this.ctx.supportedItemIds?.includes(this.target.id);
      this.assisted=!!supported;
      this.mode=this.allowRecall&&this.ctx.canListen?.()!==false&&!supported?'listen':'match';
      this.modelVisible=this.mode==='match';
      const choices=supported?2:this.choiceCount;
      const recommended=ns.gardenBrain?.others?.(this.target.display,this.pool.map(i=>i.display),choices-1,{skill:'friend',beginner:this.ctx.beginner})||[];
      const candidates=[...recommended.map(c=>this.pool.find(i=>i.display===c)),...shuffle(this.pool)].filter(Boolean);
      const seen=new Set([this.target.id]);const others=candidates.filter(i=>{if(seen.has(i.id))return false;seen.add(i.id);return true;}).slice(0,choices-1);
      this.offered=shuffle([this.target,...others]);
      this.ctx.prompt?.(null);this.ctx.beginRound?.(this.target,'friend');this.ctx.setRoundProgress?.(this.round+1,this.rounds);
      const art=ns.FriendPlayArt,version=this.roundToken;
      this.ctx.stage.innerHTML=`<div class="ff ff-play" role="group" aria-label="Find my friend">
        <div class="ff-top"><button type="button" class="ff-theatre${this.modelVisible?' is-open':''}" aria-label="${this.mode==='match'?'Hear the letter':'Hear my friend’s name'}">${art?.booth?.()||''}<span class="ff-performer">${F.art(this.target.display,{size:120,mode:'plain'})}</span><span class="ff-listen-symbol" aria-hidden="true">${ns.LettersArt?.icon?.('speaker',40)||''}</span></button></div>
        <div class="ff-choices" data-count="${this.offered.length}">${this.offered.map((item,i)=>`<button type="button" class="ff-card" data-i="${i}" aria-label="${this.modelVisible?F.get(item.display).en:`Letter ${item.display}`}">${art?.perch?.()||''}<span class="ff-choice-friend">${F.art(item.display,{size:120,mode:this.modelVisible?'full':'plain'})}</span></button>`).join('')}</div>
        <div class="ff-tools"><button class="ff-help" type="button" aria-label="Show my friend">${art?.eye?.()||''}</button><div class="ff-progress" role="progressbar" aria-label="Friends found" aria-valuemin="0" aria-valuemax="${this.rounds}" aria-valuenow="${this.round}">${this.targets.map(()=>'<i aria-hidden="true"></i>').join('')}</div><button class="ff-next" type="button" aria-label="${this.round===this.rounds-1?'Finish finding friends':'Find another friend'}" hidden>${ns.LettersArt?.icon?.(this.round===this.rounds-1?'check':'next',36)||''}</button></div>
      </div>`;
      this.root=this.ctx.stage.querySelector('.ff-play');this.theatre=this.root.querySelector('.ff-theatre');this.board=this.root.querySelector('.ff-choices');
      this.cards=[...this.board.querySelectorAll('.ff-card')];this.helpButton=this.root.querySelector('.ff-help');this.nextButton=this.root.querySelector('.ff-next');this.progress=this.root.querySelector('.ff-progress');
      this.theatre.onclick=()=>{if(this.alive&&version===this.roundToken)this.replayPrompt();};
      this.helpButton.onclick=()=>{if(this.alive&&version===this.roundToken&&!this.busy)this.help(true);};
      this.nextButton.onclick=e=>{if(version===this.roundToken){this.keyboard=e?.detail===0;this.continue();}};
      this.cards.forEach((button,i)=>button.addEventListener('click',e=>{if(version!==this.roundToken)return;this.keyboard=e?.detail===0;this.pick(i);}));
      this.refresh();this.speak();
      if(this.keyboard)(this.cards.find(b=>!b.disabled)||this.theatre)?.focus?.({preventScroll:true});
    }

    refresh() {
      if(!this.alive||!this.root)return;
      const open=this.modelVisible||this.busy;
      this.theatre.setAttribute('aria-label',this.busy||this.mode==='listen'?'Hear my friend’s name':'Hear the letter');
      this.theatre.classList.toggle('is-open',open);this.theatre.classList.toggle('is-found',this.busy);
      const performer=this.theatre.querySelector('.lf');
      performer?.classList.toggle('is-plain',!this.busy&&!this.assisted);performer?.classList.toggle('is-growing',this.busy);
      this.cards.forEach((button,i)=>{
        const correct=this.offered[i].id===this.target.id;
        button.disabled=this.busy||this.waiting||this.misses.has(i);
        button.classList.toggle('is-right',this.busy&&correct);button.classList.toggle('is-away',this.busy&&!correct);
        button.classList.toggle('is-hint',!this.busy&&this.hint&&correct);
        const svg=button.querySelector('.lf');
        svg?.classList.toggle('is-plain',!this.modelVisible&&!(this.busy&&correct));svg?.classList.toggle('is-growing',this.busy&&correct);
      });
      this.helpButton.disabled=this.busy;this.nextButton.hidden=!this.busy;
      const found=this.round+(this.busy?1:0);this.progress.setAttribute('aria-valuenow',String(found));
      this.progress.querySelectorAll('i').forEach((dot,i)=>{dot.className=i<found?'is-done':i===this.round?'is-on':'';});
    }

    cancelSpeech() { this.speechAttempt++;if(this.speechTimer!==null)clearTimeout(this.speechTimer);this.speechTimer=null; }
    cancelReveal() { if(this.revealTimer!==null)clearTimeout(this.revealTimer);this.revealTimer=null; }
    safeSay(item) { try{return this.ctx.say?.(item);}catch{return false;} }
    sayWithoutEvidence(item) { Promise.resolve(this.safeSay(item)).catch(()=>{}); }
    speak() {
      if(!this.alive||!this.target)return;
      if(this.busy){this.cancelReveal();this.sayWithoutEvidence(ns.LetterFriends.item(this.target.display));return;}
      this.cancelSpeech();const attempt=this.speechAttempt,round=this.roundToken,confirmed=this.heard,needs=!confirmed&&!this.modelVisible;
      if(needs){this.waiting=true;this.refresh();}
      const item=this.mode==='listen'?ns.LetterFriends.item(this.target.display):this.target,result=this.safeSay(item);
      const settle=heard=>{if(!this.alive||this.busy||attempt!==this.speechAttempt||round!==this.roundToken)return;this.cancelSpeech();this.heard=confirmed||heard===true;this.waiting=false;if(!this.heard&&!this.modelVisible)this.help(true);else this.refresh();};
      if(result?.then){if(needs)this.speechTimer=setTimeout(()=>settle(false),6000);Promise.resolve(result).then(settle,()=>settle(false));}else settle(result===true);
    }
    replayPrompt() { if(this.alive&&!this.busy)this.help(false);this.speak(); }
    onSoundChange() { if(this.alive&&!this.busy&&this.ctx.canListen?.()===false)this.help(true); }
    help(point=false) {
      if(!this.alive||this.busy)return;
      this.cancelSpeech();this.waiting=false;this.assisted=true;this.modelVisible=true;this.helped.add(this.target.id);this.hint=this.hint||point;this.refresh();
    }
    pick(i) {
      if(!this.alive||this.busy||this.waiting||!Number.isInteger(i)||!this.offered[i]||this.misses.has(i))return;
      const chosen=this.offered[i],correct=chosen.id===this.target.id,button=this.cards[i];
      const independent=this.mode==='listen'&&this.heard&&!this.modelVisible&&!this.assisted;
      this.ctx.reportOutcome?.({item:this.target,itemId:this.target.id,activity:'FriendFind',skill:'friend',correct,evidence:independent?'independent_listening':'supported_visible_matching',assisted:this.assisted,independent,selectedId:chosen.id,choiceIds:this.offered.map(o=>o.id),round:this.round+1,affectsStrength:true});
      if(!correct){this.missed=true;this.misses.add(i);this.help(this.choiceCount===2||this.misses.size>=2);this.ctx.sfx?.('softwrong');if(!this.ctx.reducedMotion?.())button.animate?.([{opacity:1},{opacity:.84},{opacity:1}],{duration:300,easing:'ease-in-out'});return;}
      this.busy=true;this.waiting=false;this.hint=false;this.cancelSpeech();this.refresh();this.ctx.correct?.();this.ctx.confettiAt?.(button);this.ctx.pet?.cheer?.();
      const round=this.roundToken;
      this.revealTimer=setTimeout(()=>{this.revealTimer=null;if(!this.alive||!this.busy||round!==this.roundToken)return;this.ctx.sfx?.(ns.LetterFriends.get(this.target.display).call);this.sayWithoutEvidence(ns.LetterFriends.item(this.target.display));},this.ctx.reducedMotion?.()?0:400);
      if(this.keyboard)this.nextButton.focus?.({preventScroll:true});
    }
    continue() {
      if(!this.alive||!this.busy)return;
      this.cancelReveal();this.round++;
      if(this.round>=this.rounds){if(this.finished)return;this.finished=true;this.destroy();this.ctx.done?.();}else this.next();
    }
    destroy() {
      if(!this.alive)return;this.alive=false;this.roundToken++;this.cancelSpeech();this.cancelReveal();
      this.root?.querySelectorAll('*').forEach(el=>el.getAnimations?.().forEach(a=>a.cancel()));
    }
  }
  FriendFind.taughtItems=taughtItems;
  ns.GardenPractice=ns.GardenPractice||{};ns.GardenPractice.FriendFind=FriendFind;
})(window.MiftahGame||(window.MiftahGame={}));
