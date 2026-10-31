// Living Books: familiar friends, shared reading and child-operated endings.
// Reading and exploration are presentation, never evidence of independent recall.
(function (ns) {
  const F = () => ns.LetterFriends;
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bare = (w) => String(w || "").replace(/[؟?.!،]/g, "");
  const isFem = char => (F()?.get(char)?.word || '').endsWith('ة') || char === 'ش';
  const thisIs = char => `${isFem(char) ? 'هٰذِهِ' : 'هٰذَا'} ${F().get(char).word}`;
  function castFor(ctx) {
    const rows = [...(ctx.known || []), ...(ctx.items || [])].filter(Boolean);
    const eligible = i => i.id != null && F()?.FRIENDS?.[i.display]
      && i.taught !== false && i.isTaught !== false && i.locked !== true && i.unlocked !== false
      && (!ctx.completedWorldIds || !(i.prerequisiteWorldIds || []).some(id => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));
    const blocked = new Set(rows.filter(i => !eligible(i)).map(i => i.display)), ids = new Set(), glyphs = new Set();
    return rows.filter(i => { if(!eligible(i)||blocked.has(i.display)||ids.has(String(i.id))||glyphs.has(i.display))return false;ids.add(String(i.id));glyphs.add(i.display);return true; }).map(i=>i.display);
  }
  const pick = (known, n, avoid = []) => known.filter(c => !avoid.includes(c)).slice(0,n);
  const seeker = known => known.includes('ب') ? 'ب' : known[0];
  const whereTitle = known => known.length ? `أَيْنَ ${F().get(seeker(known)).word}؟` : '';
  const BOOKS = [
    { id:'where', cover:'ب', title:'أَيْنَ بَطَّة؟', kind:'flap', pages(known) {
      if(!known.length)return [];
      const target=seeker(known),text=whereTitle(known);
      return [...pick(known,3,[target]),target].map(c=>({text,complete:[1,target],art:{flap:c},reveal:`${thisIs(c)}${c===target?'!':'.'}`}));
    }},
    { id:'what', cover:'ف', title:'مَا هٰذَا؟', kind:'guess', pages(known) {
      return pick(known,4).map(c=>({text:'مَا هٰذَا؟',art:{bodiless:c},reveal:`${thisIs(c)}.`}));
    }},
    { id:'morning', cover:'ش', title:'صَبَاحُ الْخَيْر', kind:'morning', pages(known) {
      if(!known.length)return [];
      return [{text:'صَبَاحُ الْخَيْرِ يَا شَمْس.',art:{sun:true,friend:known.includes('ش')?'ش':null}},
        ...pick(known,4,['ش']).map(c=>({text:`صَبَاحُ الْخَيْرِ يَا ${F().get(c).word}.`,complete:[3,c],art:{sun:true,friend:c}}))];
    }},
    { id:'night', cover:'د', title:'لَيْلَة سَعِيدَة', kind:'night', bedtime:true, pages(known) {
      if(!known.length)return [];
      return [...pick(known,4).map(c=>({text:`لَيْلَة سَعِيدَة يَا ${F().get(c).word}.`,complete:[3,c],art:{night:true,friend:c}})),
        {text:'لَيْلَة سَعِيدَة يَا قَمَر.',art:{night:true,moon:true}}];
    }},
  ];
  function catalog(ctx) {
    const known=castFor(ctx);
    return known.length ? BOOKS.map(b=>({...b,cover:known.includes(b.cover)?b.cover:known[0],...(b.id==='where'?{cover:seeker(known),title:whereTitle(known)}:{})})) : [];
  }
  const MOON = () => ns.LettersArt?.stickerMotif?.("moon", 120) || "";
  // 2026-10-18 (construction detail): the page backdrops are little scenes,
  // not a flat sky and one hill — far hills, puffy clouds, a near meadow with
  // tufts and flowers, a side tree; night gets twinkles and a dark tree.
  const PUFF = (x, y, k, c = "#fffaf0", b = "#ccfbef") => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-40 14Q-50 14 -46 2Q-46 -10 -30 -10Q-26 -26 -8 -26Q8 -32 18 -18Q36 -22 40 -6Q52 -4 48 8Q48 16 38 16H-36Q-40 16 -40 14Z" fill="${c}"/><path d="M-38 12Q0 20 42 12Q44 16 36 16H-34Q-40 16 -38 12Z" fill="${b}"/></g>`;
  const TUFTS = (c) => [[40, 178], [120, 186], [210, 180], [262, 188]].map(([x, y]) => `<path d="M${x - 6} ${y}Q${x - 6} ${y - 9} ${x - 2} ${y - 11}M${x} ${y}Q${x} ${y - 11} ${x + 3} ${y - 14}M${x + 6} ${y}Q${x + 7} ${y - 8} ${x + 10} ${y - 9}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`).join("");
  const SIDE_TREE = (leaf, dark) => ns.DetailKit ? `<g transform="translate(272 176) scale(.5)">${ns.DetailKit.tree({ kind: leaf === "#7fce54" ? "apple" : "round", seed: 6, leaf: leaf === "#7fce54" ? ["#b7e779", "#7fce54", "#4e9677"] : ["#4e9677", "#2f5c46", "#23253f"] })}</g>` : `<g transform="translate(272 150)"><rect x="-5" y="-10" width="10" height="34" rx="5" fill="#c69434" stroke="#4a3620" stroke-width="2.4"/>${[[0, -30, 20], [-14, -20, 14], [14, -18, 14], [0, -46, 14]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 2.4}" fill="#4a3620"/>`).join("")}${[[0, -30, 20], [-14, -20, 14], [14, -18, 14], [0, -46, 14]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${leaf}"/>`).join("")}<path d="M-8 -26q3 -4 7 -3M6 -40q3 -4 7 -3M8 -16q3 -4 7 -3" fill="none" stroke="${dark}" stroke-width="2.4" stroke-linecap="round"/></g>`;
  const SUN_SKY = `<svg class="lb-sky" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H300V200H0Z" fill="#ccfbef"/>${PUFF(60, 34, 0.6)}${PUFF(200, 24, 0.45)}<path d="M0 132Q60 104 130 122Q210 140 300 110V200H0Z" fill="#c4d39b" opacity=".7"/><path d="M0 150Q80 124 160 142Q240 160 300 132V200H0Z" fill="#b7e779"/><path d="M0 172Q100 160 180 170Q250 178 300 166V200H0Z" fill="#7fce54"/>${TUFTS("#4e9677")}${[[86, 168, "#ffa798"], [160, 176, "#ffe49a"], [236, 170, "#e6d6f0"]].map(([x, y, c]) => `${[0, 72, 144, 216, 288].map((r) => `<circle cx="${x}" cy="${y - 3}" r="3" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`).join("")}<circle cx="${x}" cy="${y}" r="2" fill="#f3c955"/>`).join("")}${SIDE_TREE("#7fce54", "#4e9677")}</svg>`;
  const NIGHT_SKY = `<svg class="lb-sky" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H300V200H0Z" fill="#4a4d84"/>${[[30, 30, 1], [80, 50, 0.7], [140, 22, 0.9], [220, 40, 0.6], [270, 70, 0.8], [190, 80, 0.5], [110, 90, 0.6]].map(([x, y, k]) => `<path transform="translate(${x} ${y}) scale(${k})" d="M0 -6Q1 -1 6 0Q1 1 0 6Q-1 1 -6 0Q-1 -1 0 -6Z" fill="#ffe49a"/>`).join("")}<path d="M0 132Q60 104 130 122Q210 140 300 110V200H0Z" fill="#34375f"/><path d="M0 150Q80 124 160 142Q240 160 300 132V200H0Z" fill="#2f5c46"/><path d="M0 172Q100 160 180 170Q250 178 300 166V200H0Z" fill="#23253f" opacity=".6"/>${TUFTS("#4e9677")}${SIDE_TREE("#2f5c46", "#23253f")}</svg>`;
  // v218: night pages without their own moon get a small crescent with a shine, like the village sky.
  const NIGHT_MOON = `<svg class="lb-sky" viewBox="0 0 300 200" preserveAspectRatio="xMinYMin meet" aria-hidden="true"><path d="M62 18A16 16 0 1 0 68 48A12 12 0 1 1 62 18Z" fill="#ffe49a" stroke="#f3c955" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="50" cy="30" rx="2" ry="4.5" transform="rotate(25 50 30)" fill="#fffdf7" opacity=".8"/></svg>`;
  const BUSH = `<svg viewBox="0 0 160 130" aria-hidden="true"><path d="M10 124Q0 80 30 70Q24 30 64 32Q80 4 108 26Q150 24 144 66Q166 92 148 124Z" fill="#7fce54" stroke="#4a3620" stroke-width="4" stroke-linejoin="round"/><path d="M40 90Q50 76 64 86M86 60Q98 48 112 58M100 100Q110 88 124 96" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/></svg>`;

  function classicArt(page) {
      const a = page.art || {};
      if (page.cover) return `${SUN_SKY}<svg class="lb-sky lb-cover-frame" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true"><rect x="6" y="6" width="288" height="188" rx="14" fill="none" stroke="#c69434" stroke-width="4"/><rect x="12" y="12" width="276" height="176" rx="10" fill="none" stroke="#ffe49a" stroke-width="2.4" stroke-dasharray="2 7" stroke-linecap="round"/>${[[16, 16, 1, 1], [284, 16, -1, 1], [16, 184, 1, -1], [284, 184, -1, -1]].map(([x, y, sx, sy]) => `<g transform="translate(${x} ${y}) scale(${sx} ${sy})"><path d="M0 0Q14 2 22 14" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/><path d="M10 2Q18 -4 22 4Q14 8 10 2Z" fill="#7fce54" stroke="#4a3620" stroke-width="1.6"/><circle cx="4" cy="4" r="4" fill="#ffa798" stroke="#4a3620" stroke-width="1.6"/></g>`).join("")}</svg><span class="lb-cover">${F().art(this.book.cover, { size: 200 })}</span>`;
      if (a.flap) return `<button type="button" class="lb-flap" aria-label="Look behind the bush"><span class="lb-behind">${F().art(a.flap, { size: 150 })}</span><span class="lb-bush">${BUSH}</span></button>`;
      if (a.bodiless) return `<button type="button" class="lb-guess" aria-label="Who is it?">${F().art(a.bodiless, { size: 190 }).replace('class="lf"', 'class="lf is-bodiless"')}</button>`;
      if (a.moon) return `${NIGHT_SKY}<span class="lb-moon">${MOON()}</span>`;
      return `${a.night ? NIGHT_SKY + NIGHT_MOON : SUN_SKY}${a.sun ? `<span class="lb-sun">${ns.LettersArt?.stickerMotif?.("sun", 90) || ""}</span>` : ""}<span class="lb-friend${a.night ? " is-asleep" : ""}">${F().art(a.friend, { size: 160 })}</span>${a.night ? '<span class="lb-zz" aria-hidden="true">z z</span>' : ""}`;
    }


  function coverArt(book) {
    const A=ns.LivingBookArt,night=!!book.bedtime;
    const scene=(A?.scene(night)||'').replace('<svg ','<svg width="300" height="200" ');
    const character=F().art(book.cover,{size:156,mode:book.kind==='guess'?'bodiless':'full'}).replace('<svg ','<svg x="72" y="24" ');
    const bush=(A?.bush()||BUSH).replace('<svg ','<svg x="66" y="68" width="168" height="136" ');
    const sky=ns.LettersArt?.stickerMotif?.(night?'moon':'sun',130)||'';
    const picture=book.kind==='morning'||night?`<g transform="translate(85 35)">${sky}</g>`:character+(book.kind==='flap'?bush:'');
    return `<svg class="lb-cover-picture" viewBox="0 0 300 200" aria-hidden="true" focusable="false">${scene}${picture}</svg>`;
  }
  class LivingBook {
    constructor(ctx) {
      this.ctx=ctx;this.alive=true;this.noReplay=true;this.token=0;this.pending=new Set();this.opened=new Set();this.filled=new Map();this.claimed=false;
      this.cast=castFor(ctx);this.book=catalog(ctx).find(b=>b.id===ctx.bookId)||catalog(ctx)[0];
      if(!this.book){this.alive=false;Promise.resolve().then(()=>ctx.cancel?.());return;}
      this.pages=[{cover:true,text:this.book.title},...this.book.pages(this.cast)];this.at=0;
      const icon=(name,size=30)=>ns.LettersArt?.icon?.(name,size)||'';
      ctx.stage.innerHTML=`<div class="lb lb-bound lb-book-${this.book.kind}" dir="rtl" role="group" aria-label="${esc(this.book.title)}">
        <div class="lb-page">${ns.FriendBookArt?.page?.()||''}<div class="lb-page-content"><div class="lb-art"></div><div class="lb-text" dir="rtl"></div></div></div>
        <div class="lb-progress" aria-hidden="true">${this.pages.map((_,i)=>`<i data-page="${i}"></i>`).join('')}</div>
        <div class="lb-nav">
          <button type="button" class="lb-next" aria-label="Next page">${icon('next')}</button>
          <button type="button" class="lb-finish" aria-label="Finish the book" hidden>${icon('check')}</button>
          <button type="button" class="lb-again" aria-label="Read this page again">${icon('speaker')}</button>
          <button type="button" class="lb-prev" aria-label="Previous page">${icon('next')}</button>
        </div><span class="lb-status" role="status" aria-live="polite"></span></div>`;
      this.root=ctx.stage.querySelector('.lb-bound');const $=s=>this.root.querySelector(s);
      this.artEl=$('.lb-art');this.textEl=$('.lb-text');this.next=$('.lb-next');this.prev=$('.lb-prev');this.finish=$('.lb-finish');this.again=$('.lb-again');this.status=$('.lb-status');
      this.next.onclick=e=>this.turn(1,e.detail===0);this.prev.onclick=e=>this.turn(-1,e.detail===0);this.finish.onclick=()=>this.end();this.again.onclick=()=>this.read();
      ctx.prompt?.(null);this.show();
    }
    art(page) {
      const a=page.art||{},night=!!a.night||page.cover&&this.book.bedtime,A=ns.LivingBookArt;
      const scene=`${A?.scene(night)|| (night?NIGHT_SKY:SUN_SKY)}${A?.props(night)||''}`;
      if(page.cover)return `${scene}<span class="lb-cover lb-hero">${F().art(this.book.cover,{size:260})}</span>`;
      if(a.flap)return `${scene}<button type="button" class="lb-flap is-hint" aria-label="Look behind the bush" aria-expanded="false"><span class="lb-behind">${F().art(a.flap,{size:220})}</span><span class="lb-bush">${A?.bush()||BUSH}</span></button>`;
      if(a.bodiless)return `${scene}<button type="button" class="lb-guess is-hint" aria-label="Reveal the friend" aria-expanded="false">${F().art(a.bodiless,{size:240}).replace('class="lf"','class="lf is-bodiless"')}</button>`;
      if(a.moon)return `${scene}<span class="lb-moon lb-hero">${MOON()}</span>`;
      const sun=a.sun&&a.friend!=='ش'?`<span class="lb-sun${a.friend?'':' is-hero'}">${ns.LettersArt?.stickerMotif?.('sun',120)||''}</span>`:'';
      return `${scene}${sun}${night?NIGHT_MOON:''}${a.friend?`<span class="lb-friend lb-hero">${F().art(a.friend,{size:240})}</span>`:''}`;
    }
    words(text,complete,reveal=false) {
      return text.split(' ').filter(Boolean).map((w,i)=>{
        const key=`${reveal?'r':'q'}${i}`,filled=this.filled.get(this.at)?.has(key);
        const blank=!!complete&&complete[0]===i&&this.at>=3;
        const decodable=this.ctx.decodable?.(bare(w));
        return `<button type="button" class="lb-word${decodable?' is-decodable':''}${blank?' lb-blank':''}${blank&&filled?' is-filled':''}" data-w="${key}" data-word="${esc(w)}" aria-label="${blank&&!filled?'Say the friend’s name':esc(w)}">${blank&&!filled?F().art(complete[1],{size:56}):esc(w)}</button>`;
      }).join(' ');
    }
    show() {
      if(!this.alive||this.claimed)return;
      this.stop();const page=this.pages[this.at];this.revealed=!page.reveal||this.opened.has(this.at);
      this.artEl.innerHTML=this.art(page);this.artEl.className=`lb-art${page.cover?' is-cover':''}`;
      this.textEl.innerHTML=`<div class="lb-line">${this.words(page.text,page.complete)}</div>`;
      const opener=this.artEl.querySelector('.lb-flap, .lb-guess');
      if(opener){opener.onclick=()=>this.open(opener);if(this.revealed)this.revealArt(opener);}
      if(page.reveal&&this.revealed)this.renderReveal();
      this.textEl.querySelectorAll('.lb-word').forEach(b=>b.onclick=()=>this.tapWord(b));
      this.groundFriends();this.updateNav();this.status.textContent=`Page ${this.at+1} of ${this.pages.length}`;
      this.root.querySelectorAll('[data-page]').forEach((el,i)=>el.classList.toggle('is-current',i===this.at));
      this.read();
    }
    groundFriends() {
      // These friends have different silhouettes. Put their paper shadow at
      // the actual lower ink, rather than assuming they all share a foot line.
      this.artEl.querySelectorAll('svg.lf').forEach(svg=>{
        try {
          const box=svg.getBBox();if(!box.width||!box.height)return;
          const shadow=document.createElementNS('http://www.w3.org/2000/svg','ellipse');
          for(const [key,value] of Object.entries({cx:box.x+box.width/2,cy:Math.min(101,box.y+box.height),rx:Math.min(38,box.width*.42),ry:3,fill:'#2f5c46',opacity:'.2'}))shadow.setAttribute(key,String(value));
          svg.insertBefore(shadow,svg.firstChild);
        } catch { /* The illustration remains usable before layout is available. */ }
      });
    }
    updateNav() {
      const last=this.at===this.pages.length-1;this.next.hidden=last;this.next.disabled=last;this.prev.disabled=this.at===0;
      this.finish.hidden=!last;this.finish.disabled=!this.revealed||this.claimed;this.root.dataset.last=String(last);
    }
    stop() {
      this.token++;for(const cancel of [...this.pending])cancel();this.pending.clear();this.waiting=null;this.reading=false;
      this.ctx.stopSpeech?.();this.again?.setAttribute('aria-busy','false');
      this.textEl?.querySelectorAll('.is-said, .is-trying, .is-waiting').forEach(b=>b.classList.remove('is-said','is-trying','is-waiting'));
    }
    pause(ms) {
      return new Promise(resolve=>{let timer;const finish=ok=>{clearTimeout(timer);this.pending.delete(cancel);resolve(ok);};const cancel=()=>finish(false);this.pending.add(cancel);timer=setTimeout(()=>finish(true),ms);});
    }
    speak(b) {
      return new Promise(resolve=>{
        let settled=false,timer;const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);this.pending.delete(cancel);resolve(ok);};const cancel=()=>finish(false);this.pending.add(cancel);
        timer=setTimeout(()=>{if(settled)return;this.ctx.stopSpeech?.();finish(false);},6000);
        try{if(typeof this.ctx.say!=='function')return finish(false);Promise.resolve(this.ctx.say({id:b.dataset.word,display:b.dataset.word,speak:bare(b.dataset.word)})).then(ok=>finish(ok!==false),()=>finish(false));}catch{finish(false);}
      });
    }
    async readButtons(buttons,token) {
      const live=()=>this.alive&&!this.claimed&&this.token===token;
      this.reading=true;this.again.setAttribute('aria-busy','true');
      try{
        for(let i=0;i<buttons.length;i++){
          if(!live())return;
          const b=buttons[i];
          if(b.classList.contains('lb-blank')&&!b.classList.contains('is-filled')){
            b.classList.add('is-waiting');this.waiting={button:b,remaining:buttons.slice(i)};return;
          }
          b.classList.add('is-said');const heard=await this.speak(b);if(!live())return;
          b.classList.remove('is-said');if(!heard)return;b.classList.add('is-read');
          if(!await this.pause(90)||!live())return;
        }
      }finally{if(live()){this.reading=false;this.again.setAttribute('aria-busy','false');}}
    }
    read() {
      if(!this.alive||this.claimed||this.reading)return;
      this.stop();return this.readButtons([...this.textEl.querySelectorAll('.lb-word')],this.token);
    }
    fillBlank(b) {
      if(b.classList.contains('is-filled'))return;
      const keys=this.filled.get(this.at)||new Set();keys.add(b.dataset.w);this.filled.set(this.at,keys);
      b.classList.add('is-filled');b.classList.remove('is-waiting');b.textContent=b.dataset.word;b.setAttribute('aria-label',b.dataset.word);
    }
    async tapWord(b) {
      if(!this.alive||this.claimed)return;
      const remaining=this.waiting?.button===b?this.waiting.remaining:[b];
      this.stop();const token=this.token;
      if(b.classList.contains('lb-blank')&&!b.classList.contains('is-filled')){this.fillBlank(b);this.ctx.sfx?.('chime');this.ctx.pet?.cheer?.();return this.readButtons(remaining,token);}
      if(b.classList.contains('is-decodable')){
        b.classList.add('is-trying');if(!await this.pause(1000)||!this.alive||this.token!==token)return;b.classList.remove('is-trying');
      }
      return this.readButtons([b],token);
    }
    revealArt(el) {
      el.classList.add('is-open');el.classList.remove('is-hint');el.setAttribute('aria-expanded','true');el.setAttribute('aria-label','Hear the revealed friend');
      this.artEl.querySelector('.lf.is-bodiless')?.classList.replace('is-bodiless','is-whole');
    }
    renderReveal() {
      const page=this.pages[this.at];if(!page.reveal||this.textEl.querySelector('.lb-reveal'))return;
      this.textEl.insertAdjacentHTML('beforeend',`<div class="lb-line lb-reveal">${this.words(page.reveal,null,true)}</div>`);
      this.textEl.querySelectorAll('.lb-reveal .lb-word').forEach(b=>b.onclick=()=>this.tapWord(b));
    }
    async open(el) {
      if(!this.alive||this.claimed)return;
      if(this.revealed)return this.readReveal();
      this.stop();const token=this.token,page=this.pages[this.at];this.revealed=true;this.opened.add(this.at);this.revealArt(el);this.renderReveal();this.updateNav();
      this.ctx.sfx?.(page.art.flap?'rustle':'pop');
      if(!await this.pause(280)||!this.alive||this.token!==token)return;
      this.ctx.sfx?.(F().get(page.art.flap||page.art.bodiless).call);
      return this.readButtons([...this.textEl.querySelectorAll('.lb-reveal .lb-word')],token);
    }
    readReveal() {
      if(!this.alive||this.claimed||!this.revealed||!this.pages[this.at].reveal)return;
      this.stop();this.renderReveal();return this.readButtons([...this.textEl.querySelectorAll('.lb-reveal .lb-word')],this.token);
    }
    turn(dir,keyboard=false) {
      const to=this.at+dir;if(!this.alive||this.claimed||!Number.isInteger(to)||to<0||to>=this.pages.length)return;
      this.stop();this.pageMotion?.cancel?.();this.at=to;this.ctx.sfx?.('page');this.show();
      // Animate ink inside the fixed page, never the child's touch targets.
      const picture=this.artEl.querySelector('.lb-hero, .lb-behind, .lb-guess > svg');
      if(!this.ctx.reducedMotion?.())this.pageMotion=picture?.animate?.([{opacity:.55,transform:`translateX(${dir*-10}px)`},{opacity:1,transform:'none'}],{duration:240,easing:'ease-out'});
      if(keyboard&&(dir>0?this.next:this.prev).disabled)(this.artEl.querySelector('button')||this.again).focus?.({preventScroll:true});
    }
    end() {
      if(!this.alive||this.claimed||this.at!==this.pages.length-1||!this.revealed)return;
      this.claimed=true;this.stop();this.finish.disabled=true;this.ctx.onRead?.(this.book.id);this.ctx.pet?.cheer?.();this.ctx.done?.();
    }
    replayPrompt(){return this.read();}
    destroy(){if(!this.alive)return;this.alive=false;this.stop();this.pageMotion?.cancel?.();this.root?.querySelectorAll('*').forEach(el=>el.getAnimations?.().forEach(a=>a.cancel()));}
  }
  LivingBook.BOOKS=BOOKS;LivingBook.castFor=castFor;
  ns.LivingBooks={BOOKS,isFem,thisIs,castFor,catalog,coverArt,classic:{art:classicArt}};
  ns.GardenPractice=ns.GardenPractice||{};ns.GardenPractice.LivingBook=LivingBook;
})(window.MiftahGame||(window.MiftahGame={}));
