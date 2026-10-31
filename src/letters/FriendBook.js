// A child-operated field guide. Reading and picture exploration are presentation,
// never evidence of independent recall. Familiar letters keep their curriculum order.
(function (ns) {
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function pagesFor(ctx) {
    const rows = [...(ctx.items || []), ...(ctx.known || [])].filter(Boolean);
    const eligible = i => i.id != null && ns.LetterFriends?.FRIENDS?.[i.display]
      && i.taught !== false && i.isTaught !== false && i.locked !== true && i.unlocked !== false
      && (!ctx.completedWorldIds || !(i.prerequisiteWorldIds || []).some(id => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));
    const blocked = new Set(rows.filter(i => !eligible(i)).map(i => i.display)), ids = new Set(), glyphs = new Set();
    return rows.filter(i => { if(!eligible(i)||blocked.has(i.display)||ids.has(String(i.id))||glyphs.has(i.display))return false;ids.add(String(i.id));glyphs.add(i.display);return true; });
  }
  const ink = (char, word = false) => `<svg viewBox="0 0 ${word?'180 112':'100 112'}" aria-hidden="true">${word?'<rect class="fb-word-mark" rx="12" fill="#ffe49a" visibility="hidden"/>':''}<text class="${word?'fb-word-text':'fb-letter-ink'}" x="${word?90:50}" y="74" text-anchor="middle" direction="rtl" font-family="'Amiri Quran',serif" font-size="68" fill="#4a3620" data-fit-box="${word?'90,56,156,82,68':'50,56,72,82,68'}">${esc(char)}</text></svg>`;
  class FriendBook {
    constructor(ctx) {
      this.ctx=ctx;this.alive=true;this.noReplay=true;this.token=0;this.pending=new Set();this.turns=0;this.claimed=false;
      this.pages=pagesFor(ctx);
      if(!this.pages.length){this.alive=false;Promise.resolve().then(()=>ctx.cancel?.());return;}
      const start=Number.isFinite(ctx.startAt)?Math.trunc(ctx.startAt):0;
      this.at=Math.max(0,Math.min(this.pages.length-1,start));
      const icon=(name,size=32)=>ns.LettersArt?.icon?.(name,size)||'';
      ctx.stage.innerHTML=`<div class="fb fb-book" dir="rtl" role="group" aria-label="The Letter Friends book">
        <div class="fb-spread">${ns.FriendBookArt?.page?.()||''}<div class="fb-page-content">
          <button type="button" class="fb-friend" aria-label="Read this page"><span class="fb-habitat" aria-hidden="true">${ns.FriendBookArt?.habitat?.()||''}</span><span class="fb-character"></span><span class="fb-listen is-hint" aria-hidden="true">${icon('speaker',24)}</span></button>
          <div class="fb-caption"><button type="button" class="fb-letter-button" aria-label="Hear the letter and see its shape"></button><button type="button" class="fb-word-button" aria-label="Hear the friend's name"><span class="fb-word-ink"></span><span class="fb-name-speaker" aria-hidden="true">${icon('speaker',20)}</span></button></div>
        </div></div>
        <div class="fb-nav"><button type="button" class="fb-next" aria-label="Next page">${icon('next')}</button><button type="button" class="fb-close" aria-label="Close the book">${icon('check')}</button><button type="button" class="fb-prev" aria-label="Previous page">${icon('next')}</button></div>
        <span class="fb-status" role="status" aria-live="polite"></span>
      </div>`;
      this.root=ctx.stage.querySelector('.fb-book');const $=s=>this.root.querySelector(s);
      this.spread=$('.fb-spread');this.friendBtn=$('.fb-friend');this.character=$('.fb-character');this.letterBtn=$('.fb-letter-button');this.wordBtn=$('.fb-word-button');this.wordInk=$('.fb-word-ink');
      this.next=$('.fb-next');this.prev=$('.fb-prev');this.close=$('.fb-close');this.status=$('.fb-status');
      this.friendBtn.onclick=()=>this.tell();this.letterBtn.onclick=()=>this.narrate('letter');this.wordBtn.onclick=()=>this.narrate('word');
      this.next.onclick=e=>this.turn(1,e.detail===0);this.prev.onclick=e=>this.turn(-1,e.detail===0);
      this.close.onclick=()=>{if(!this.alive||this.claimed)return;this.claimed=true;this.stop();this.close.disabled=true;ctx.sfx?.('page');ctx.done?.();};
      ctx.prompt?.(null);this.show();
      this.observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(()=>this.fit());this.observer?.observe(ctx.stage);
      if(typeof document!=='undefined')document.fonts?.ready?.then(()=>{if(this.alive)this.fit();});
    }
    show(){
      if(!this.alive)return;
      const page=this.pages[this.at],F=ns.LetterFriends,friend=F.get(page.display);
      this.character.innerHTML=F.art(page.display,{size:300,mode:'full'});
      this.friendBtn.setAttribute('aria-label',`${page.display}: ${friend.en}. Read this page`);
      this.letterBtn.innerHTML=ink(page.display);this.letterBtn.setAttribute('aria-label',`${page.display}: hear the letter and see its shape`);
      this.wordInk.innerHTML=ink(friend.word,true);this.wordBtn.setAttribute('aria-label',`${friend.word}: hear the friend's name`);
      this.wordEl=this.wordInk.querySelector('.fb-word-text');this.mark=this.wordInk.querySelector('.fb-word-mark');this.markOn=false;
      this.next.disabled=this.at>=this.pages.length-1;this.prev.disabled=this.at<=0;
      this.root.setAttribute('data-last',String(this.next.disabled));
      this.status.textContent=`Page ${this.at+1} of ${this.pages.length}: ${friend.en}`;
      this.fit();this.tell();
    }
    fit(){if(!this.alive)return;ns.LettersArt?.fitGlyphs?.(this.root);if(this.markOn)this.markFirst();}
    // Keep the word joined. The first-letter marker is measured in the same
    // SVG coordinate system as the fitted ink, so rotation cannot offset it.
    markFirst(){
      this.markOn=true;
      try{
        const word=this.wordEl.textContent;let end=1;while(end<word.length&&/[ًٌٍَُِّْٰ]/.test(word[end]))end++;
        const g=(this.canvas||=document.createElement('canvas')).getContext('2d');
        g.font=`${this.wordEl.getAttribute('font-size')}px ${this.wordEl.getAttribute('font-family')}`;g.direction='rtl';g.textAlign='center';g.textBaseline='alphabetic';
        const full=g.measureText(word),rest=g.measureText(word.slice(end));
        const width=full.actualBoundingBoxLeft+full.actualBoundingBoxRight;if(!width)return;
        const w=Math.min(width,Math.max(full.width-rest.width,width*.18));
        const right=Number(this.wordEl.getAttribute('x'))+full.actualBoundingBoxRight;
        const y=Number(this.wordEl.getAttribute('y'));
        for(const [key,value] of Object.entries({x:right-w-3,y:y-full.actualBoundingBoxAscent-3,width:w+6,height:full.actualBoundingBoxAscent+full.actualBoundingBoxDescent+6,visibility:'visible'}))this.mark.setAttribute(key,String(value));
      }catch{/* The joined word remains readable if font metrics are unavailable. */}
    }
    setPlain(plain){
      const svg=this.character.querySelector('svg.lf');svg?.classList.toggle('is-plain',!!plain);
      this.letterBtn.setAttribute('aria-pressed',String(!!plain));
    }
    stop(){
      this.token++;for(const cancel of [...this.pending])cancel();this.pending.clear();this.telling=false;
      this.friendBtn?.setAttribute('aria-busy','false');this.letterBtn?.classList.remove('is-speaking');this.wordBtn?.classList.remove('is-speaking');
    }
    pause(ms){return new Promise(resolve=>{let timer;const finish=ok=>{clearTimeout(timer);this.pending.delete(cancel);resolve(ok);};const cancel=()=>finish(false);this.pending.add(cancel);timer=setTimeout(()=>finish(true),ms);});}
    speak(item){
      return new Promise(resolve=>{
        let settled=false,timer;const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);this.pending.delete(cancel);resolve(ok);};const cancel=()=>finish(false);this.pending.add(cancel);
        timer=setTimeout(()=>finish(false),6000);
        try{if(typeof this.ctx.say!=='function')return finish(false);Promise.resolve(this.ctx.say(item)).then(ok=>finish(ok!==false),()=>finish(false));}catch{finish(false);}
      });
    }
    async narrate(part='story'){
      if(!this.alive||this.claimed||(part==='story'&&this.telling))return;
      this.stop();const token=this.token,live=()=>this.alive&&!this.claimed&&this.token===token;
      const page=this.pages[this.at],F=ns.LetterFriends;this.telling=true;this.friendBtn.setAttribute('aria-busy','true');
      this.markOn=false;this.mark?.setAttribute('visibility','hidden');this.setPlain(part==='letter');
      try{
        if(part!=='word'){
          this.letterBtn.classList.add('is-speaking');const heard=await this.speak(page);if(!live())return;
          this.letterBtn.classList.remove('is-speaking');if(part==='letter'||!heard)return;
          if(!await this.pause(180)||!live())return;
          this.ctx.sfx?.(F.get(page.display).call);if(!await this.pause(420)||!live())return;
        }
        this.markFirst();this.wordBtn.classList.add('is-speaking');await this.speak(F.item(page.display));
      }finally{if(live()){this.telling=false;this.friendBtn.setAttribute('aria-busy','false');this.letterBtn.classList.remove('is-speaking');this.wordBtn.classList.remove('is-speaking');}}
    }
    tell(){return this.narrate('story');}
    turn(dir,keyboard=false){
      const to=this.at+dir;if(!this.alive||this.claimed||!Number.isInteger(to)||to<0||to>=this.pages.length)return;
      this.stop();this.pageMotion?.cancel?.();this.at=to;this.turns++;this.ctx.sfx?.('page');this.show();
      // Animate the illustration, never the child's tappable page regions.
      if(!this.ctx.reducedMotion?.())this.pageMotion=this.character.animate?.([{transform:`translateX(${dir*-12}px)`,opacity:.6},{transform:'none',opacity:1}],{duration:240,easing:'ease-out'});
      if(keyboard&&(dir>0?this.next:this.prev).disabled)this.friendBtn.focus?.({preventScroll:true});
    }
    replayPrompt(){return this.tell();}
    destroy(){if(!this.alive)return;this.alive=false;this.stop();this.observer?.disconnect();this.pageMotion?.cancel?.();this.root?.querySelectorAll('*').forEach(el=>el.getAnimations?.().forEach(a=>a.cancel()));}
  }
  FriendBook.pagesFor=pagesFor;
  ns.GardenPractice=ns.GardenPractice||{};ns.GardenPractice.FriendBook=FriendBook;
})(window.MiftahGame||(window.MiftahGame={}));
