// A shared picnic: two friends take turns finding familiar letters. This is
// cooperative matching/memory play, never listening evidence or a competition.
(function (ns) {
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function poolFor(ctx) {
    const rows = (ctx.items || []).filter(Boolean);
    const eligible = i => i.id != null && /^[ابتثجحخدذرزسشصضطظعغفقكلمنهوي]$/u.test(i.display || '')
      && i.taught !== false && i.isTaught !== false && i.locked !== true && i.unlocked !== false
      && (!ctx.completedWorldIds || !(i.prerequisiteWorldIds || []).some(id => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));
    const blocked = new Set(rows.filter(i => !eligible(i)).map(i => i.display)), ids = new Set(), glyphs = new Set();
    return rows.filter(i => { if(!eligible(i)||blocked.has(i.display)||ids.has(String(i.id))||glyphs.has(i.display))return false;ids.add(String(i.id));glyphs.add(i.display);return true; });
  }
  function planFor(ctx) {
    const pool = poolFor(ctx);
    const candidates = ns.PracticeLearning?.plan?.(ctx,pool,'letter-form',3) || pool.slice(0,3);
    const tier = ctx.beginner ? 0 : Math.max(0,Math.min(2,ns.PracticeLearning?.level?.(ctx,candidates,'letter-form') || 0));
    // One demand changes at a time: two visible pairs, two hidden pairs,
    // then three hidden pairs. The support level stays fixed for this visit.
    return { tier, letters:candidates.slice(0,tier===2?3:2) };
  }
  function shuffled(rows, random = Math.random) {
    const copy = rows.slice();
    for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
    return copy;
  }
  const ink = char => `<svg viewBox="0 0 100 120" aria-hidden="true"><text x="50" y="75" data-fit-box="50,60,76,82,64" text-anchor="middle" direction="rtl" font-family="'Amiri Quran',serif" font-size="64" fill="#4a3620">${esc(char)}</text></svg>`;
  const eye = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 32Q32 6 56 32Q32 58 8 32Z" fill="#fffaf0" stroke="#4a3620" stroke-width="4" stroke-linejoin="round"/><circle cx="32" cy="32" r="10" fill="#62cdf4" stroke="#4a3620" stroke-width="3"/><circle cx="32" cy="32" r="4" fill="#4a3620"/></svg>`;

  class GardenTogether {
    constructor(ctx) {
      this.ctx=ctx;this.alive=true;this.noReplay=true;this.turn=0;this.open=[];this.found=0;this.phase='choose';this.claimed=false;
      const plan=planFor(ctx);this.tier=plan.tier;this.helped=this.tier===0;this.pairs=plan.letters.length;
      if(this.pairs<2){this.alive=false;Promise.resolve().then(()=>ctx.cancel?.());return;}
      this.cards=shuffled(plan.letters.flatMap((letter,pair)=>[{...letter,pair},{...letter,pair}]),ctx.random);
      const A=ns.TogetherPlayArt, icon=(name,size=32)=>ns.LettersArt?.icon?.(name,size)||'';
      ctx.stage.innerHTML=`<div class="together together-picnic" data-pairs="${this.pairs}" data-support="${this.tier===0?'guided':'memory'}" role="group" aria-label="A picnic for two friends">
        <div class="together-pets">
          <div class="together-seat is-turn" data-player="0"><span class="together-pet">${ctx.petA || ns.LettersArt?.pet?.({hue:200,species:'blob',stage:1,size:96}) || ''}</span><span class="together-turn-chip" aria-hidden="true">${icon('paw',24)}</span></div>
          <div class="together-basket" role="img" aria-label="No pairs in the basket yet">${A?.basket?.()||''}<div class="together-found"></div></div>
          <div class="together-seat" data-player="1"><span class="together-pet">${ctx.petB || ns.LettersArt?.pet?.({ hue: 320, species: "blob", stage: 1, size: 96 }) || ''}</span><span class="together-turn-chip" aria-hidden="true">${icon('paw',24)}</span></div>
        </div>
        <div class="together-playmat">${A?.mat?.()||''}<div class="together-board" role="group" aria-label="Find two matching letters">${this.cards.map((card,i)=>`<button type="button" class="together-card" data-card="${i}" aria-label="Card ${i+1}"><span class="together-back" aria-hidden="true">${A?.cardBack?.()||''}</span><span class="together-face" aria-hidden="true">${ink(card.display)}</span><span class="together-match" aria-hidden="true">${icon('check',20)}</span></button>`).join('')}</div></div>
        <div class="together-tools"><button type="button" class="together-help" aria-label="Show the unmatched letters" aria-pressed="false" ${this.tier===0?'hidden':''}>${eye}</button><span class="together-picks" aria-hidden="true"><i></i><i></i></span><button type="button" class="together-next" aria-label="Pass to the other friend" disabled>${icon('next',36)}</button></div>
        <span class="together-status" role="status" aria-live="polite"></span>
      </div>`;
      this.root=ctx.stage.querySelector('.together-picnic');this.buttons=[...this.root.querySelectorAll('.together-card')];
      this.seats=[...this.root.querySelectorAll('.together-seat')];this.pets=[...this.root.querySelectorAll('.together-pet')];
      this.basket=this.root.querySelector('.together-basket');this.tokens=this.root.querySelector('.together-found');
      this.next=this.root.querySelector('.together-next');this.help=this.root.querySelector('.together-help');this.status=this.root.querySelector('.together-status');
      this.buttons.forEach((button,i)=>button.onclick=e=>this.flip(i,e.detail===0));
      this.next.onclick=e=>this.advance(e.detail===0);
      this.help.onclick=()=>{if(!this.alive||this.phase==='finished')return;this.helped=!this.helped;this.sync();this.ctx.sfx?.('page');};
      this.sync();ctx.prompt?.(null);this.fit();
      this.observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(()=>this.fit());this.observer?.observe(ctx.stage);
    }
    fit(){if(this.alive)ns.LettersArt?.fitGlyphs?.(this.root);}
    safeSay(item){try{Promise.resolve(this.ctx.say?.(item)).catch(()=>{});}catch{/* Matching remains available without speech. */}}
    sync(){
      if(!this.alive)return;
      const comparing=this.phase==='compare'||this.phase==='finished';
      this.buttons.forEach((button,i)=>{
        const card=this.cards[i],picked=this.open.includes(i),shown=!!(this.helped||picked||card.matched);
        button.classList.toggle('is-up',shown);button.classList.toggle('is-picked',picked);button.classList.toggle('is-matched',!!card.matched);
        button.disabled=comparing||picked||!!card.matched;
        button.setAttribute('aria-label',shown?`${card.display}${card.matched?', matched':picked?', chosen':''}`:`Card ${i+1}`);
      });
      this.seats.forEach((seat,i)=>{seat.classList.toggle('is-turn',this.phase!=='finished'&&i===this.turn);seat.setAttribute('aria-label',this.phase==='finished'?'Both friends finished':i===this.turn?`Player ${i+1}'s turn`:`Player ${i+1}`);});
      this.root.querySelectorAll('.together-picks i').forEach((pip,i)=>pip.classList.toggle('is-on',i<this.open.length));
      this.help.setAttribute('aria-pressed',String(this.helped));this.help.setAttribute('aria-label',this.helped?'Hide the unmatched letters':'Show the unmatched letters');
      this.help.disabled=this.phase==='finished';this.next.disabled=this.phase==='choose';
      this.next.setAttribute('aria-label',this.phase==='finished'?'Finish together':'Pass to the other friend');
      this.status.textContent=this.phase==='finished'?'All pairs found together':comparing?`Pass to player ${2-this.turn}`:`Player ${this.turn+1}: choose ${this.open.length?'one more letter':'two letters'}`;
      this.fit();
    }
    flip(index,keyboard=false){
      const card=this.cards[index];if(!this.alive||this.phase!=='choose'||!card||card.matched||this.open.includes(index))return;
      this.open.push(index);this.ctx.sfx?.('page');this.safeSay(card);
      if(this.open.length===2){
        const [a,b]=this.open;this.phase='compare';
        if(this.cards[a].pair===this.cards[b].pair){
          this.cards[a].matched=this.cards[b].matched=true;this.found++;
          this.tokens.insertAdjacentHTML('beforeend',`<span class="together-token" aria-hidden="true">${ink(card.display)}</span>`);
          this.basket.setAttribute('aria-label',`${this.found} of ${this.pairs} pairs found together`);
          this.ctx.sfx?.('chime');this.cheer(this.turn);
          if(this.found===this.pairs){this.phase='finished';this.next.innerHTML=ns.LettersArt?.icon?.('check',36)||'';this.cheer(1-this.turn);this.ctx.sfx?.('cheer2');}
        }else this.ctx.sfx?.('rustle');
      }
      this.sync();
      if(keyboard){const target=this.phase==='choose'?this.buttons.find((b,i)=>!this.cards[i].matched&&!this.open.includes(i)):this.next;target?.focus?.({preventScroll:true});}
    }
    advance(keyboard=false){
      if(!this.alive||this.phase==='choose'||this.claimed)return;
      if(this.phase==='finished'){this.claimed=true;this.next.disabled=true;this.ctx.done?.();return;}
      this.turn = 1 - this.turn;
      this.open=[];this.phase='choose';this.ctx.sfx?.('page');this.sync();
      if(keyboard)this.buttons.find(b=>!b.disabled)?.focus?.({preventScroll:true});
    }
    cheer(player){
      if(!this.alive)return;const pet=this.pets[player];
      if(pet&&!this.ctx.reducedMotion?.())pet.animate?.([{transform:'translateY(0)'},{transform:'translateY(-3px)'},{transform:'translateY(0)'}],{duration:300,easing:'ease-out'});
      this.ctx.voice?.(player);
    }
    replayPrompt(){if(this.alive&&this.open.length)this.safeSay(this.cards[this.open[this.open.length-1]]);}
    destroy(){if(!this.alive)return;this.alive=false;this.observer?.disconnect();this.root?.querySelectorAll('*').forEach(el=>el.getAnimations?.().forEach(a=>a.cancel()));}
  }
  GardenTogether.poolFor=poolFor;GardenTogether.planFor=planFor;
  ns.GardenPractice=ns.GardenPractice||{};ns.GardenPractice.GardenTogether=GardenTogether;
})(window.MiftahGame||(window.MiftahGame={}));
