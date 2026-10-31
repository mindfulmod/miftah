// The Picture-Book Games (v27, 2026-10-02). Five games, each one a thing
// picture books do that the garden didn't:
//
//   PeekFlaps    lift-the-flap (Where's Spot?): hear a word, lift the flap
//                wearing the letter it starts with — a surprise every time.
//   SoundSort    the classic phonics sort: pictures go in the basket of the
//                letter their name starts with.
//   HoopoeTrip   a cumulative tale (The House That Jack Built): the hoopoe
//                gathers a friend on every page and the refrain grows.
//   FriendShapes the friend is missing its body — which letter is it?
//   BusyMarket   a busy page (Richard Scarry): a letter lens finds every
//                thing on the stalls whose name starts with it. Free play.
//
// Honesty is the same everywhere in the garden: a word that was HEARD and
// answered with a plain letter is independent listening; anything with a
// picture or friend that shows the letter is supported matching; any round
// after a miss is assisted. Exploring (Busy Market, flap peeks) reports
// nothing. All association evidence is the "friend" skill (letter ↔ picture
// ↔ sound), which the Brain reads. Nothing fails; a miss only wobbles.
(function (ns) {
  const INK = "#4a3620";
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // Smart Choices (v50): the Garden Brain picks the wrong answers.
  const smart = (target, pool, n, skill) => (ns.gardenBrain?.others ? ns.gardenBrain.others(target, pool, n, { skill }) : shuffle(pool.filter((c) => c !== target)).slice(0, n));
  const F = () => ns.LetterFriends;
  const P = () => ns.PictureWords;
  const letterItems = (ctx) => {
    const declared = [...(ctx.items || []), ...(ctx.known || [])];
    const eligible = (i) => i && i.taught !== false && i.isTaught !== false && i.locked !== true && i.unlocked !== false
      && (!ctx.completedWorldIds || !(i.prerequisiteWorldIds || []).some((id) => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));
    const forbidden = new Set(declared.filter((i) => !eligible(i)).map((i) => i?.display));
    return [...new Map(declared.filter((i) => i?.display && !forbidden.has(i.display) && F()?.FRIENDS?.[i.display]).map((i) => [i.display, i])).values()];
  };
  const learning = () => ns.PracticeLearning;
  const profile = (ctx, item, skill) => {
    try { return learning()?.profile?.(ctx, item, skill) || { choiceCount: 2, promptMode: "match" }; }
    catch { return { choiceCount: 2, promptMode: "match" }; }
  };
  const countFor = (ctx, item, skill, max) => Math.max(2, Math.min(max, Number(profile(ctx, item, skill).choiceCount) || 2));
  const planItems = (ctx, items, skill, count) => {
    let planned;
    try { planned = learning()?.plan?.(ctx, items, skill, count); } catch { planned = null; }
    if (!Array.isArray(planned)) return items.slice(0, count);
    const byKey = new Map(items.map((item) => [item.id || item.display, item]));
    return [...new Set(planned.map((item) => byKey.get(typeof item === "string" ? item : item?.id || item?.display)).filter(Boolean))].slice(0, count);
  };
  const orderedChars = (ctx, pool, skill, count) => {
    let ordered;
    try { ordered = learning()?.orderChars?.(ctx, pool, skill, count); } catch { ordered = null; }
    const valid = new Set(pool);
    return [...new Set([...(Array.isArray(ordered) ? ordered : []), ...shuffle(pool)].map((item) => typeof item === "string" ? item : item?.display).filter((char) => valid.has(char)))].slice(0, count);
  };
  const level = (ctx, items, skill) => {
    try { return Math.max(0, Math.min(2, Number(learning()?.level?.(ctx, items, skill)) || 0)); }
    catch { return 0; }
  };

  // Shared plumbing: timers that die with the game, speech that remembers
  // whether it was heard, progress dots, and the one honest report.
  class Base {
    constructor(ctx, cls, label) {
      this.ctx = ctx; this.alive = true; this.timers = [];
      ctx.stage.innerHTML = `<div class="bk ${cls}" role="group" aria-label="${label}"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
    }
    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); return t; }
    setPrompt(item) {
      this.promptToken = (this.promptToken || 0) + 1;
      this.promptItemKey = item && (item.id || item.display);
      this.heard = false;
    }
    say(item) {
      const token = this.promptToken;
      const key = item && (item.id || item.display);
      const isCurrentPrompt = token != null && key === this.promptItemKey;
      const record = (heard) => {
        if (this.alive && token === this.promptToken && isCurrentPrompt) this.heard = heard === true;
      };
      let r;
      try { r = this.ctx.say?.(item); } catch { r = false; }
      if (r?.then) r.then(record, () => record(false));
      else record(r);
      return r;
    }
    dots(n, at) { return `<div class="bk-progress" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < at ? "is-done" : i === at ? "is-on" : ""}"></i>`).join("")}</div>`; }
    // Each new question is a new learning round, even when the answer is the
    // same letter as last time (two pictures for one basket).
    begin(target) { this.setPrompt({ id: target, display: target }); this.ctx.beginRound?.({ id: target, display: target }); }
    report(target, chosen, offered, { listening = false } = {}) {
      const correct = chosen === target;
      const independent = listening && !this.missed && this.heard === true;
      this.ctx.reportOutcome?.({ item: { id: target, display: target }, itemId: target, activity: this.constructor.name, skill: "friend", correct,
        evidence: independent ? "independent_listening" : "supported_visible_matching", assisted: !!this.missed,
        selectedId: chosen, choiceIds: offered, affectsStrength: true });
      return correct;
    }
    wobble(el) { if (!this.ctx.reducedMotion?.()) el?.animate?.([{ opacity: 1 }, { opacity: .84 }, { opacity: 1 }], { duration: 360 }); }
    cheer(el) { this.ctx.correct?.(); this.ctx.confettiAt?.(el); this.ctx.pet?.cheer?.(); }
    replayPrompt() {}
    destroy() { this.alive = false; this.timers.forEach(clearTimeout); }
  }

  // ---------- Peekaboo Flaps ----------
  // v58: doors alternate two light greens. The third door was dark #4e9677, the
  // same colour as the leaf marks, so it looked blank and different: an odd one
  // out a child could pick by sight when it happened to hide the answer.
  const FLAP = (i) => `<svg class="bk-flap-door" viewBox="0 0 100 110" aria-hidden="true"><path d="M8 104V30Q8 6 50 6Q92 6 92 30V104Z" fill="${["#7fce54", "#b7e779"][i % 2]}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M22 34Q30 22 40 30M58 24Q68 18 76 28M30 62Q38 52 48 60M60 70Q70 62 78 72" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/></svg>`;
  const playArt = () => ns.BookPlayArt || {};
  const flapArt = (i) => playArt().door?.(i) || FLAP(i);

  class PeekFlaps extends Base {
    constructor(ctx) {
      super(ctx, "bk-flaps", "Peekaboo flaps");
      this.letters = letterItems(ctx);
      this.plan = planItems(ctx, this.letters, "friend", 4);
      this.rounds = this.plan.length; this.round = 0;
      if (this.letters.length < 2) { ctx.cancel?.(); return; }
      this.next();
    }
    // What hides behind a letter: one of its pictures, or else its friend.
    hider(char) {
      const pics = P()?.byChar(char) || [];
      if (pics.length) { const p = pics[Math.floor(Math.random() * pics.length)]; return { item: P().item(p), art: P().art(p, 84) }; }
      return { item: F().item(char), art: F().art(char, { size: 84 }) };
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      this.clearFlaps();
      const page = this.pageToken = (this.pageToken || 0) + 1;
      this.phase = "finding"; this.opened = new Set(); this.attempted = new Set();
      this.busy = false; this.missed = false; this.heard = false;
      const planned = this.plan[this.round] || this.letters[this.round % this.letters.length];
      const target = planned.display ? planned : this.letters.find((item) => item.display === planned) || this.letters[0];
      const n = Math.min(countFor(this.ctx, target, "friend", this.letters.length), this.letters.length);
      const choices = orderedChars(this.ctx, this.letters.map((l) => l.display), "friend", n);
      const picked = ns.gardenBrain?.others ? ns.gardenBrain.others(target.display, choices, n - 1, { skill: "friend" }) : null;
      this.offered = shuffle([target, ...(picked?.length ? picked.map((c) => this.letters.find((l) => l.display === c)).filter(Boolean) : shuffle(this.letters.filter((l) => l.display !== target.display)).slice(0, n - 1))]);
      this.target = target.display;
      this.hidden = this.offered.map((l) => this.hider(l.display));
      this.word = this.hidden[this.offered.indexOf(target)].item;
      this.begin(this.target);
      this.setPrompt(this.word);
      this.listening = profile(this.ctx, target, "friend").promptMode === "listen" && this.ctx.canListen?.() !== false;
      this.root.innerHTML = `
        <div class="bk-ask"${this.listening ? " hidden" : ""}><span class="bk-pic">${this.hidden[this.offered.indexOf(target)].art}</span></div>
        <div class="bk-hedge" style="--flap-count:${this.offered.length}">${this.offered.map((l, i) => `<div class="bk-window"><button type="button" class="bk-flap" data-i="${i}" aria-label="Flap ${l.display}" aria-expanded="false"><span class="bk-behind" aria-hidden="true">${this.hidden[i].art}</span><span class="bk-door">${flapArt(i)}<span class="bk-door-letter">${F().art(l.display, { size: 64, mode: "plain" })}</span></span></button><span class="bk-discovery-letter" aria-hidden="true">${F().art(l.display, {size:40,mode:"plain"})}</span></div>`).join("")}</div>
        <div class="bk-peek-actions"><button type="button" class="bk-close-doors" hidden aria-label="Close the doors">${playArt().closeDoors?.() || '<span aria-hidden="true">↶</span>'}</button><button type="button" class="bk-peek-next" hidden aria-label="${this.round + 1 < this.rounds ? "Next discovery page" : "Finish discoveries"}"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 20h24M22 10l10 10-10 10" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
        ${this.dots(this.rounds, this.round)}`;
      this.root.querySelectorAll(".bk-flap").forEach((b) => this.bindFlap(b, Number(b.dataset.i), page));
      this.root.querySelector(".bk-close-doors")?.addEventListener("click", () => this.closeDoors(page));
      this.root.querySelector(".bk-peek-next")?.addEventListener("click", () => this.nextPage(page));
      this.actionCue = this.ctx.setupActionCue?.({source:this.root.querySelector(".bk-flap"),type:"tap",automatic:this.ctx.firstActionDemo === true && this.round === 0});
      const round = this.round, word = this.word, token = this.promptToken;
      this.later(() => this.speakPrompt(word, round, token), 300);
    }
    clearFlaps() {
      this.actionCue?.destroy(); this.actionCue = null;
      this.flapResets?.forEach(reset => reset()); this.flapResets = []; this.pullCancels = [];
      this.activeFlapPointer = null;
    }
    doorPose(flap, amount) { flap?.style?.setProperty?.("--door-angle", `${-105 * Math.max(0,Math.min(1,amount))}deg`); }
    bindFlap(flap, i, page) {
      let drag = null, suppressUntil = 0;
      const live = () => this.alive && page === this.pageToken && ["finding","exploring"].includes(this.phase);
      const reset = () => {
        const old = drag; drag = null;
        if (this.activeFlapPointer === flap) this.activeFlapPointer = null;
        flap.classList.remove("is-pulling","is-touching");
        this.doorPose(flap,this.opened.has(i)?1:0);
        if (old && flap.hasPointerCapture?.(old.id)) flap.releasePointerCapture(old.id);
      };
      const handlers = {
        pointerdown:e => {
          if (!live() || e.isPrimary === false || (e.pointerType === "mouse" && e.button !== 0) || this.activeFlapPointer) return;
          suppressUntil=0; // A fresh press is intentional; only the drag's synthetic click is suppressed.
          let amount = this.opened.has(i)?1:0;
          // Re-grabbing a settling hinge begins at its displayed angle.
          try {
            const door=flap.querySelector(".bk-door"),Matrix=window.DOMMatrixReadOnly;
            if (door && Matrix && typeof getComputedStyle === "function") {
              const m=new Matrix(getComputedStyle(door).transform);
              amount=Math.max(0,Math.min(1,Math.atan2(m.m13,m.m11)*180/Math.PI/105));
            }
          } catch {}
          drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:amount,amount,moved:false,travel:Math.min(80,flap.getBoundingClientRect().width*.6)};
          this.activeFlapPointer=flap; flap.classList.add("is-touching");
        },
        pointermove:e => {
          if (!drag || e.pointerId !== drag.id || e.isPrimary === false) return;
          if (!live()) return reset();
          const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
          if (!drag.moved && Math.abs(dy)>12 && Math.abs(dy)>Math.abs(dx)) { suppressUntil=Date.now()+500; return reset(); }
          if (!drag.moved && Math.abs(dx)>8) {
            drag.moved=true; flap.classList.add("is-pulling"); this.actionCue?.stop?.();
            flap.setPointerCapture?.(drag.id);
          }
          if (!drag.moved) return;
          e.preventDefault?.();
          drag.amount=Math.max(0,Math.min(1,drag.start-dx/Math.max(1,drag.travel)));
          this.doorPose(flap,drag.amount);
          // Peeking gives visual information, never an unaided listening claim.
          if (drag.amount>.12 && this.phase === "finding") this.revealReference();
        },
        pointerup:e => {
          if (!drag || e.pointerId !== drag.id) return;
          const {moved,amount}=drag;
          reset();
          if (!moved || !live()) return;
          suppressUntil=Date.now()+500;
          if (amount>=.5) this.lift(i,flap,page); else this.setOpen(i,false);
        },
        pointercancel:e => { if (drag && e.pointerId===drag.id) { suppressUntil=Date.now()+500; reset(); } },
        lostpointercapture:e => { if (drag && e.pointerId===drag.id) { suppressUntil=Date.now()+500; reset(); } },
        click:e => {
          if (e.detail>0 && Date.now()<suppressUntil) {e.preventDefault?.();e.stopImmediatePropagation?.();return;}
          if (live()) this.lift(i,flap,page);
        },
      };
      Object.entries(handlers).forEach(([type,fn])=>flap.addEventListener(type,fn));
      this.pullCancels.push(reset);
      this.flapResets.push(()=>{reset();Object.entries(handlers).forEach(([type,fn])=>flap.removeEventListener?.(type,fn));});
    }
    setOpen(i, open) {
      open ? this.opened.add(i) : this.opened.delete(i);
      const flap=this.root.querySelectorAll(".bk-flap")[i],windowEl=this.root.querySelectorAll(".bk-window")[i];
      flap?.classList.toggle("is-open",open); windowEl?.classList.toggle("is-discovered",open);
      flap?.setAttribute?.("aria-expanded",String(open));
      flap?.setAttribute?.("aria-label",open?`Hear the picture behind ${this.offered[i].display}`:`Flap ${this.offered[i].display}`);
      this.doorPose(flap,open?1:0);
      const close=this.root.querySelector(".bk-close-doors"); if(close)close.hidden=!this.opened.size;
    }
    closeDoors(page=this.pageToken) {
      if (!this.alive || page!==this.pageToken || !["finding","exploring"].includes(this.phase)) return false;
      this.pullCancels.forEach(reset=>reset());
      this.offered.forEach((_,i)=>this.setOpen(i,false));
      this.root.querySelector(".bk-flap")?.focus?.({preventScroll:true});
      return true;
    }
    speakPrompt(word, round = this.round, token = this.promptToken) {
      if (!this.alive || round !== this.round || token !== this.promptToken || word !== this.word) return;
      const result = this.say(word);
      if (result?.then) result.then((heard) => { if (heard !== true) this.revealReference(round, token); }, () => this.revealReference(round, token));
      else if (result !== true) this.revealReference(round, token);
    }
    revealReference(round = this.round, token = this.promptToken) {
      if (!this.alive || round !== this.round || token !== this.promptToken) return;
      this.missed = true;
      const reference = this.root.querySelector(".bk-ask");
      if (reference) { reference.hidden = false; reference.classList.remove("is-hidden"); }
    }
    replayPrompt() { if (!this.alive || !this.word) return; if(this.phase==="finding")this.revealReference(this.round, this.promptToken); this.say(this.word); }
    lift(i, flap, page=this.pageToken) {
      if (!this.alive || page!==this.pageToken || !["finding","exploring"].includes(this.phase) || !this.offered[i]) return;
      if (this.opened.has(i)) { this.say(this.hidden[i].item); return; }
      const chosen = this.offered[i].display;
      const answering=this.phase==="finding"&&!this.attempted.has(i);
      const right = answering && this.report(this.target, chosen, this.offered.map((o) => o.display), { listening: this.listening });
      if (answering) this.attempted.add(i);
      this.setOpen(i,true);
      this.ctx.sfx?.("creak");
      const round = this.round, token = this.promptToken, revealed = this.hidden[i].item;
      this.later(() => { if (page===this.pageToken && token === this.promptToken && this.opened.has(i)) this.say(revealed); }, 300);
      if (right) {
        const keyboard=flap.matches?.(":focus-visible");
        this.busy = true; this.phase="exploring";
        this.actionCue?.destroy();this.actionCue=null;
        const ask=this.root.querySelector(".bk-ask");if(ask)ask.hidden=false;
        this.root.querySelectorAll(".bk-flap").forEach(b=>b.classList.remove("is-hint"));
        this.root.querySelectorAll(".bk-window")[i]?.classList.add("is-found");
        const next=this.root.querySelector(".bk-peek-next");if(next)next.hidden=false;
        this.cheer(flap);
        if(keyboard)next?.focus?.({preventScroll:true});
        return;
      }
      if (!answering) return;
      // The unexpected discovery stays available; only the child closes it.
      this.revealReference(round,token);
      this.root.querySelectorAll(".bk-flap").forEach((b, k) => b.classList.toggle("is-hint", this.offered[k].display === this.target));
    }
    nextPage(page=this.pageToken) {
      if (!this.alive || page!==this.pageToken || this.phase!=="exploring") return false;
      const keyboard=this.root.querySelector(".bk-peek-next")?.matches?.(":focus-visible");
      this.phase="turning";this.round++;this.next();
      if(keyboard&&this.phase==="finding")this.root.querySelector(".bk-flap")?.focus?.({preventScroll:true});
      return true;
    }
    finish() { if(!this.alive||this.phase==="finished")return;this.phase="finished";this.busy=true;this.clearFlaps();this.ctx.sfx?.("cheer2");this.ctx.done?.(); }
    destroy() { this.clearFlaps();super.destroy(); }
  }

  // ---------- Sound Sort ----------
  const BASKET = `<svg class="bk-basket-art" viewBox="0 0 120 70" aria-hidden="true"><path d="M8 18H112L100 66H20Z" fill="#c69434" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M14 32H106M18 48H102M40 18L44 66M80 18L76 66" stroke="#70501b" stroke-width="2.4"/><path d="M4 18H116" stroke="${INK}" stroke-width="6" stroke-linecap="round"/></svg>`;
  const basketArt = () => playArt().basket?.() || BASKET;

  class SoundSort extends Base {
    constructor(ctx) {
      super(ctx, "bk-sort", "Sort the pictures");
      const known = letterItems(ctx).map((l) => l.display);
      const withPics = known.filter((c) => (P()?.byChar(c) || []).length);
      // Prefer the walk's letters, then any letter that has pictures.
      const want = (ctx.items || []).map((i) => i.display).filter((c) => withPics.includes(c));
      const policy = profile(ctx, { id: want[0] || withPics[0], display: want[0] || withPics[0] }, "friend");
      const n = Math.min(countFor(ctx, { id: want[0] || withPics[0], display: want[0] || withPics[0] }, "friend", withPics.length), withPics.length);
      this.baskets = orderedChars(ctx, [...new Set([...want, ...withPics])], "friend", n);
      // At first the baskets wear their friends (support); later, plain letters.
      this.plain = level(ctx, this.baskets.map((display) => ({ id: display, display })), "friend") >= 2;
      const friendWords = new Set(this.baskets.map((c) => F().get(c).word));
      this.cards = shuffle(this.baskets.flatMap((c) => {
        const pictures = P().byChar(c) || [];
        if (this.plain) return shuffle(pictures).slice(0, 2);
        const distinctPictures = pictures.filter((p) => !friendWords.has(p.word));
        const eligiblePictures = distinctPictures.length ? distinctPictures : pictures.filter((p) => p.word === F().get(c).word);
        return shuffle(eligiblePictures).slice(0, 2);
      }));
      if (this.cards.length < 2 || this.baskets.length < 2) { ctx.cancel?.(); return; }
      this.at = 0; this.roundToken = 0; this.dragResets = [];
      this.cardStates = new Map(this.cards.map(card=>[card,{missed:false,wrong:new Set()}]));
      this.queue = this.cards.slice(2); this.trayCards = this.cards.slice(0,2);
      this.root.innerHTML = `<div class="bk-card-slot bk-sort-tray" role="group" aria-label="Pictures to carry"></div><div class="bk-baskets">${this.baskets.map((c, i) => `<button type="button" class="bk-basket" data-i="${i}" aria-label="Basket ${c}"><span class="bk-basket-label">${F().art(c, { size: 74, mode: this.plain ? "plain" : "full" })}</span>${basketArt()}<span class="bk-basket-in" aria-hidden="true"></span></button>`).join("")}</div><button type="button" class="bk-sort-finish" hidden aria-label="Finish sorting"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 20h24M22 10l10 10-10 10" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="bk-dots-slot"></div>`;
      this.slot = this.root.querySelector(".bk-card-slot");
      this.root.querySelectorAll(".bk-basket").forEach((b) => b.addEventListener("click", () => {
        const i=Number(b.dataset.i);
        if(this.alive&&this.phase==="complete"){this.say(F().item(this.baskets[i]));return;}
        this.drop(i,b);
      }));
      this.root.querySelector(".bk-sort-finish")?.addEventListener("click",()=>this.finish());
      this.deal({announce:true});
    }
    deal({preferred=0,announce=false,focus=false}={}) {
      this.deliveryFlight?.cancel(); this.deliveryFlight=null;
      this.actionCue?.destroy();this.actionCue=null;
      this.dragResets.forEach(reset=>reset());this.dragResets=[];
      const round=++this.roundToken;
      this.card=null;this.selectedSlot=-1;this.busy=false;this.phase="sorting";
      this.root.querySelector(".bk-dots-slot").innerHTML=this.dots(this.cards.length,this.at);
      if(!this.trayCards.some(Boolean)) {
        this.phase="complete";this.busy=true;this.noReplay=true;this.ctx.onFreePlay?.();
        this.slot.innerHTML=`<span class="bk-sort-complete-mark" aria-hidden="true"><svg viewBox="0 0 60 50"><path d="M12 25L25 38L48 11" fill="none" stroke="#4e9677" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
        this.root.querySelectorAll(".bk-basket").forEach(b=>b.classList.remove("is-hint","is-receiving"));
        const button=this.root.querySelector(".bk-sort-finish");if(button)button.hidden=false;
        if(focus)button?.focus?.({preventScroll:true});
        return;
      }
      this.slot.innerHTML=this.trayCards.map((card,i)=>`<div class="bk-tray-place">${card?`<button type="button" class="bk-card" data-card-slot="${i}" aria-label="Picture ${card.en||card.word}" aria-pressed="false">${P().art(card,110)}</button>`:''}</div>`).join("");
      this.slot.querySelectorAll(".bk-card").forEach(picture=>{
        const index=Number(picture.dataset.cardSlot),snapshot=this.trayCards[index];
        const live=()=>this.alive&&this.phase==="sorting"&&!this.busy&&this.roundToken===round&&this.trayCards[index]===snapshot;
        picture.onclick=()=>{if(live())this.selectCard(index,true);};
        if(ns.GardenPractice?.draggable)this.dragResets.push(ns.GardenPractice.draggable(picture,{
          enabled:live,
          onDragStart:()=>{if(live())this.selectCard(index,true);},
          onDragMove:(x,y)=>this.showReceiving(this.nearestBasket(x,y)),
          onDragEnd:()=>this.showReceiving(null),
          drop:(x,y,released)=>{
            if(!live())return false;
            const basket=this.nearestBasket(x,y);if(!basket)return false;
            this.selectCard(index,false);
            return this.drop(Number(basket.dataset.i),basket,snapshot,round,released);
          },
        }));
      });
      const index=this.trayCards[preferred]?preferred:this.trayCards.findIndex(Boolean);
      this.selectCard(index,false);
      const snapshot=this.card;
      if(announce)this.later(()=>{if(this.alive&&this.card===snapshot&&this.roundToken===round&&this.phase==="sorting")this.say(P().item(snapshot));},250);
      if(focus)this.picture?.focus?.({preventScroll:true});
    }
    selectCard(index,speak=true) {
      const card=this.trayCards[index];
      if(!this.alive||this.phase!=="sorting"||this.busy||!card)return false;
      const changed=this.card!==card;
      this.card=card;this.selectedSlot=index;this.missed=this.cardStates.get(card).missed;
      if(changed){this.begin(card.char);this.setPrompt(P().item(card));}
      this.slot.querySelectorAll(".bk-card").forEach(b=>{
        const selected=Number(b.dataset.cardSlot)===index;
        b.classList.toggle("is-selected",selected);b.setAttribute("aria-pressed",String(selected));
        if(selected)this.picture=b;
      });
      this.root.querySelectorAll(".bk-basket").forEach((b,k)=>b.classList.toggle("is-hint",this.missed&&this.baskets[k]===card.char));
      if(changed)this.teachCard();
      if(speak)this.say(P().item(card));
      return true;
    }
    teachCard() {
      this.actionCue?.destroy();this.actionCue=null;
      const card=this.card,round=this.roundToken;
      const destination=[...this.root.querySelectorAll(".bk-basket")].find(b=>this.baskets[Number(b.dataset.i)]===card.char);
      this.actionCue=this.ctx.setupActionCue?.({source:this.picture,destination,type:"drag",
        automatic:this.ctx.firstActionDemo===true&&!this.demonstrated,
        onShow:()=>{if(this.alive&&this.card===card&&this.roundToken===round&&this.phase==="sorting"){this.cardStates.get(card).missed=true;this.missed=true;}},
      });
      this.demonstrated=true;
    }
    replayPrompt() { if(this.alive&&!this.busy&&this.card)this.say(P().item(this.card)); }
    nearestBasket(x,y) {
      let best=null,distance=Infinity;
      this.root.querySelectorAll(".bk-basket").forEach(basket=>{
        const r=basket.getBoundingClientRect?.();
        if(!r||r.width<=0||r.height<=0||x<r.left-24||x>r.right+24||y<r.top-24||y>r.bottom+24)return;
        const d=Math.hypot(x-(r.left+r.width/2),y-(r.top+r.height/2));
        if(d<distance){best=basket;distance=d;}
      });
      return best;
    }
    showReceiving(basket) { this.root.querySelectorAll(".bk-basket.is-receiving").forEach(b=>b.classList.remove("is-receiving"));basket?.classList.add("is-receiving"); }
    drop(i,basket,cardSnapshot=this.card,round=this.roundToken,released=null) {
      if(!this.alive||this.phase!=="sorting"||this.busy||!cardSnapshot||this.card!==cardSnapshot||this.roundToken!==round||!this.baskets[i])return false;
      const chosen=this.baskets[i],state=this.cardStates.get(cardSnapshot);
      if(state.wrong.has(chosen))return false;
      const right=this.report(cardSnapshot.char,chosen,this.baskets);
      if(!right){
        state.missed=true;state.wrong.add(chosen);this.missed=true;
        this.ctx.sfx?.("softwrong");this.wobble(basket);
        this.root.querySelectorAll(".bk-basket").forEach((b,k)=>b.classList.toggle("is-hint",this.baskets[k]===cardSnapshot.char));
        this.later(()=>{if(this.alive&&this.card===cardSnapshot&&this.roundToken===round&&this.phase==="sorting")this.say(P().item(cardSnapshot));},450);
        return false;
      }
      const card=this.picture,placedSlot=this.selectedSlot;
      const keyboard=basket.matches?.(":focus-visible")||card?.matches?.(":focus-visible");
      this.busy=true;this.phase="delivering";this.actionCue?.destroy();this.actionCue=null;
      card?.classList.add("is-delivering");
      const a=card?.getBoundingClientRect?.(),b=basket.querySelector(".bk-basket-in").getBoundingClientRect?.();
      const scale=a?.width&&card.offsetWidth?a.width/card.offsetWidth:1;
      if(a&&b&&!this.ctx.reducedMotion?.()){
        const start=released?`translate(${(released.left-a.left)/scale}px, ${(released.top-a.top)/scale}px)`:"none";
        this.deliveryFlight=card.animate?.([{transform:start,opacity:1},{transform:`translate(${(b.left+b.width/2-a.left-a.width/2)/scale}px, ${(b.top+b.height/2-a.top-a.height/2)/scale}px) scale(.28)`,opacity:.4}],{duration:420,easing:"ease-out",fill:"forwards"});
      }
      this.at++;
      this.later(()=>{
        if(!this.alive||this.card!==cardSnapshot||this.roundToken!==round||this.phase!=="delivering")return;
        card?.classList.add("is-landed");
        basket.querySelector(".bk-basket-in").insertAdjacentHTML("beforeend",`<i>${P().art(cardSnapshot,34)}</i>`);
        this.cheer(basket);this.ctx.sfx?.("drop");this.say(P().item(cardSnapshot));
        this.trayCards[placedSlot]=this.queue.shift()||null;
        // Refill the used place; the other picture stays in its original place.
        // No automatic naming of the refill can interrupt the arrived picture.
        this.deal({preferred:1-placedSlot,focus:keyboard});
      },this.ctx.reducedMotion?.()?0:420);
      return true;
    }
    finish() {
      if(!this.alive||this.phase!=="complete")return false;
      this.phase="finished";this.busy=true;this.ctx.sfx?.("cheer2");this.ctx.done?.();return true;
    }
    destroy() { this.actionCue?.destroy();this.deliveryFlight?.cancel();this.dragResets?.forEach(reset=>reset());super.destroy(); }
  }

  // ---------- The Hoopoe's Trip ----------
  class HoopoeTrip extends Base {
    constructor(ctx) {
      super(ctx, "bk-trip", "The hoopoe's trip");
      const known = letterItems(ctx).filter((l) => l.display !== "ه");
      const firsts = (ctx.items || []).map((i) => i.display).filter((c) => c !== "ه" && known.some((k) => k.display === c));
      this.stops = orderedChars(ctx, [...new Set([...firsts, ...known.map((k) => k.display)])], "friend", 4);
      this.parade = ["ه"]; this.page = 0; this.roundToken = 0; this.voiceToken = 0; this.dragResets = [];
      if (this.stops.length < 1 || known.length < 2) { ctx.cancel?.(); return; }
      this.known = known.map((k) => k.display);
      this.show();
    }
    paradeHTML(invite = false) {
      return `<div class="bk-parade" role="group" aria-label="Friends on the trip">${this.parade.map((c, i) => `<button type="button" class="bk-walker" data-friend="${c}" aria-label="Hear ${F().get(c).en}" style="--i:${i}">${F().art(c, { size: i ? 64 : 76 })}</button>`).join("")}${invite ? '<span class="bk-trip-place" aria-hidden="true"><svg viewBox="0 0 50 60"><ellipse cx="16" cy="22" rx="7" ry="12" transform="rotate(-20 16 22)" fill="#a89478"/><ellipse cx="34" cy="40" rx="7" ry="12" transform="rotate(20 34 40)" fill="#a89478"/></svg></span>' : ''}</div>`;
    }
    actionsHTML(home = false) {
      return `<div class="bk-trip-actions"${home ? '' : ' hidden'}><button type="button" class="bk-trip-chorus" aria-label="Hear our friends" aria-pressed="false"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 19h8l10-9v28L16 29H8Z" fill="#4a3620"/><path d="M32 16q10 8 0 16M37 10q16 14 0 28" fill="none" stroke="#4a3620" stroke-width="3" stroke-linecap="round"/></svg></button><button type="button" class="bk-trip-next" aria-label="${home ? 'Finish trip' : 'Walk together'}"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 24h28M26 12l12 12-12 12" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>`;
    }
    clearRound() {
      this.actionCue?.destroy(); this.actionCue = null;
      this.deliveryFlight?.cancel(); this.deliveryFlight = null;
      this.dragResets.forEach(reset => reset()); this.dragResets = [];
      this.stopRefrain();
    }
    stopRefrain() {
      this.voiceToken += 1; this.singing = false; this.ctx.stopSpeech?.();
      this.root.querySelectorAll('.bk-walker').forEach(b => b.classList.remove('is-saying'));
      this.root.querySelector('.bk-trip-chorus')?.setAttribute('aria-pressed', 'false');
    }
    wireParade() {
      const round = this.roundToken;
      this.root.querySelectorAll('.bk-walker').forEach(b => b.addEventListener('click', () => {
        if (!this.alive || this.roundToken !== round || !['finding', 'gathered', 'home'].includes(this.phase)) return;
        this.stopRefrain(); const token = this.voiceToken;
        b.classList.add('is-saying'); this.say(F().item(b.dataset.friend));
        this.later(() => { if (this.voiceToken === token) b.classList.remove('is-saying'); }, 600);
      }));
    }
    wireActions() {
      const round = this.roundToken;
      this.root.querySelector('.bk-trip-chorus')?.addEventListener('click', () => {
        if (!this.alive || this.roundToken !== round || !['gathered', 'home'].includes(this.phase)) return;
        if (this.singing) this.stopRefrain(); else this.refrain([...this.parade].reverse());
      });
      this.root.querySelector('.bk-trip-next')?.addEventListener('click', () => {
        if (this.roundToken !== round) return;
        this.phase === 'home' ? this.finish() : this.walk();
      });
    }
    show() {
      this.clearRound(); ++this.roundToken;
      if (this.page >= this.stops.length) return this.home();
      this.busy = false; this.missed = false; this.phase = 'finding'; this.wrong = new Set();
      this.root.classList.remove('is-walking', 'is-gathered');
      const target = this.stops[this.page], round = this.roundToken;
      const n = Math.min(countFor(this.ctx, { id: target, display: target }, "friend", this.known.length), this.known.length);
      const alternatives = this.known.filter((c) => c !== target);
      const ranked = orderedChars(this.ctx, alternatives, "friend", Math.max(1, n - 1));
      const picked = smart(target, ranked.length ? ranked : alternatives, Math.max(1, n - 1), "friend").filter((c) => c !== target && alternatives.includes(c));
      const fallback = alternatives.filter((c) => !picked.includes(c));
      this.offered = shuffle([...new Set([target, ...picked, ...fallback])].slice(0, Math.min(this.known.length, Math.max(2, n))));
      this.begin(target);
      this.root.innerHTML = `${playArt().tripBackdrop?.() || '<div class="bk-trip-backdrop" aria-hidden="true"></div>'}${this.paradeHTML(true)}
        <div class="bk-sign">${playArt().sign?.() || ''}<span>${F().art(target, { size: 62, mode: "plain" })}</span></div>
        <div class="bk-waiting">${this.offered.map((c, i) => `<button type="button" class="bk-friend" data-i="${i}" aria-label="${F().get(c).en}">${F().art(c, { size: 96 })}</button>`).join("")}</div>
        ${this.actionsHTML()}${this.dots(this.stops.length, this.page)}`;
      this.wireParade();
      this.root.querySelectorAll('.bk-friend').forEach(b => {
        const live = () => this.alive && this.phase === 'finding' && !this.busy && this.roundToken === round;
        b.addEventListener('click', () => { if (live()) this.pick(Number(b.dataset.i), b, round); });
        if (ns.GardenPractice?.draggable) this.dragResets.push(ns.GardenPractice.draggable(b, {
          enabled: live,
          onDragMove: (x, y) => this.root.querySelector('.bk-parade')?.classList.toggle('is-receiving', !!this.paradeTarget(x, y)),
          onDragEnd: () => this.root.querySelector('.bk-parade')?.classList.remove('is-receiving'),
          drop: (x, y, released) => live() && this.paradeTarget(x, y) ? this.pick(Number(b.dataset.i), b, round, released) : false,
        }));
      });
      this.wireActions();
      const source = [...this.root.querySelectorAll('.bk-friend')].find(b => this.offered[Number(b.dataset.i)] === target);
      this.actionCue = this.ctx.setupActionCue?.({ source, destination: this.root.querySelector('.bk-trip-place'), type: 'drag',
        automatic: this.ctx.firstActionDemo === true && !this.demonstrated,
        onShow: () => { if (this.alive && this.phase === 'finding' && this.roundToken === round) this.missed = true; },
      });
      this.demonstrated = true; this.replayPrompt();
    }
    paradeTarget(x, y) {
      const el = this.root.querySelector('.bk-parade'), r = el?.getBoundingClientRect?.();
      return r && r.width > 0 && r.height > 0 && x >= r.left - 24 && x <= r.right + 24 && y >= r.top - 24 && y <= r.bottom + 24 ? el : null;
    }
    pick(i, btn, round = this.roundToken, released = null) {
      if (!this.alive || this.busy || this.phase !== 'finding' || round !== this.roundToken) return false;
      const target = this.stops[this.page], chosen = this.offered[i];
      if (!chosen || this.wrong.has(chosen)) return false;
      if (!this.report(target, chosen, this.offered)) {
        this.wrong.add(chosen); this.missed = true; this.ctx.sfx?.('softwrong'); this.wobble(btn);
        this.root.querySelectorAll('.bk-friend').forEach((b, k) => b.classList.toggle('is-hint', this.offered[k] === target));
        return false;
      }
      this.busy = true; this.phase = 'joining'; this.stopRefrain(); this.actionCue?.destroy(); this.actionCue = null;
      const keyboard = btn.matches?.(':focus-visible');
      btn.classList.add('is-joining');
      const a = btn.getBoundingClientRect?.(), b = this.root.querySelector('.bk-trip-place')?.getBoundingClientRect?.();
      if (a && b && !this.ctx.reducedMotion?.()) {
        const scale = a.width && btn.offsetWidth ? a.width / btn.offsetWidth : 1;
        const start = released ? `translate(${(released.left-a.left)/scale}px, ${(released.top-a.top)/scale}px)` : 'none';
        this.deliveryFlight = btn.animate?.([{ transform: start, opacity: 1 }, { transform: `translate(${(b.left+b.width/2-a.left-a.width/2)/scale}px, ${(b.top+b.height/2-a.top-a.height/2)/scale}px) scale(.6)`, opacity: .6 }], { duration: 420, easing: 'ease-out', fill: 'forwards' });
      }
      this.later(() => {
        if (!this.alive || this.phase !== 'joining' || this.roundToken !== round) return;
        this.parade.push(target); this.page += 1; this.phase = 'gathered';
        this.root.querySelector('.bk-parade').outerHTML = this.paradeHTML();
        this.root.querySelector('.bk-waiting').hidden = true;
        this.root.querySelector('.bk-trip-actions').hidden = false;
        this.root.classList.add('is-gathered');
        const progress = this.root.querySelector('.bk-progress'); if (progress) progress.outerHTML = this.dots(this.stops.length, this.page);
        this.wireParade(); this.cheer(this.root.querySelector('.bk-walker:last-child') || btn); this.ctx.sfx?.(F().get(target).call); this.say(F().item(target));
        this.root.querySelector('.bk-walker:last-child')?.classList.add('is-new');
        if (keyboard) this.root.querySelector('.bk-trip-next')?.focus?.({ preventScroll: true });
      }, this.ctx.reducedMotion?.() ? 0 : 420);
      return true;
    }
    async refrain(chars) {
      if (!this.alive || !['gathered', 'home'].includes(this.phase)) return false;
      this.stopRefrain(); const token = this.voiceToken, round = this.roundToken;
      this.singing = true; this.root.querySelector('.bk-trip-chorus')?.setAttribute('aria-pressed', 'true');
      const current = () => this.alive && this.voiceToken === token && this.roundToken === round;
      for (const c of chars.slice(0, 5)) {
        if (!current()) return false;
        const el = [...this.root.querySelectorAll('.bk-walker')].find(b => b.dataset.friend === c);
        el?.classList.add('is-saying');
        try {
          await Promise.race([this.ctx.say?.(F().item(c)), new Promise((ok) => this.later(ok, 2000))]);
        } catch { /* Silent or missing speech does not block the walk control. */ }
        if (!current()) return false;
        el?.classList.remove('is-saying');
      }
      this.singing = false; this.root.querySelector('.bk-trip-chorus')?.setAttribute('aria-pressed', 'false');
      return true;
    }
    walk() {
      if (!this.alive || this.phase !== 'gathered') return false;
      this.stopRefrain(); this.phase = 'walking'; this.root.classList.add('is-walking');
      const round = this.roundToken, keyboard = this.root.querySelector('.bk-trip-next')?.matches?.(':focus-visible');
      this.later(() => {
        if (!this.alive || this.phase !== 'walking' || this.roundToken !== round) return;
        this.show();
        if (keyboard) (this.root.querySelector('.bk-friend') || this.root.querySelector('.bk-trip-next'))?.focus?.({ preventScroll: true });
      }, this.ctx.reducedMotion?.() ? 0 : 420);
      return true;
    }
    replayPrompt() {
      if (!this.alive) return;
      if (['gathered', 'home'].includes(this.phase)) { this.refrain([...this.parade].reverse()); return; }
      if (this.phase !== 'finding') return;
      const c = this.stops[this.page];
      this.say({ id: c, display: c, speak: ns.LETTERS_DATA?.packs?.flatMap(p => p.letters).find(l => l.char === c)?.arName || c });
    }
    home() {
      this.busy = true; this.phase = 'home'; this.noReplay = true; this.ctx.onFreePlay?.();
      this.root.classList.remove('is-walking', 'is-gathered'); this.root.classList.add('is-home');
      this.root.innerHTML = `${playArt().tripBackdrop?.() || ''}${this.paradeHTML()}<div class="bk-home" aria-hidden="true">${playArt().home?.() || ''}</div>${this.actionsHTML(true)}`;
      this.wireParade(); this.wireActions(); this.ctx.sfx?.('cheer2'); this.ctx.pet?.cheer?.();
    }
    finish() {
      if (!this.alive || this.phase !== 'home') return false;
      this.phase = 'finished'; this.stopRefrain(); this.ctx.done?.(); return true;
    }
    destroy() { this.clearRound(); super.destroy(); }
  }

  // ---------- Friend Shapes ----------
  class FriendShapes extends Base {
    constructor(ctx) {
      super(ctx, 'bk-shapes', 'Friend shapes');
      this.letters = letterItems(ctx).map(l => l.display);
      this.order = orderedChars(ctx, [...new Set([...(ctx.items || []).map(i => i.display).filter(c => this.letters.includes(c)), ...this.letters])], 'shape', 4);
      this.rounds = Math.min(4, this.order.length); this.round = 0; this.roundToken = 0; this.dragResets = [];
      if (this.letters.length < 2) { ctx.cancel?.(); return; }
      this.next();
    }
    clearRound() {
      this.actionCue?.destroy(); this.actionCue = null;
      this.assemblyFlight?.cancel(); this.assemblyFlight = null;
      this.dragResets.forEach(reset => reset()); this.dragResets = [];
    }
    next() {
      this.clearRound(); const round = ++this.roundToken;
      if (this.round >= this.rounds) return this.finish();
      this.busy = false; this.missed = false; this.assembled = false; this.phase = 'matching'; this.wrong = new Set(); this.root.classList.remove('is-apart');
      const target = this.target = this.order[this.round];
      const n = Math.min(countFor(this.ctx, { id: target, display: target }, 'shape', this.letters.length), this.letters.length);
      const others = smart(target, orderedChars(this.ctx, this.letters, 'shape', n), n - 1, 'shape');
      this.offered = shuffle([...new Set([target, ...others.filter(c => this.letters.includes(c)), ...this.letters])].slice(0, n));
      this.begin(target);
      this.root.innerHTML = `<div class="bk-missing"><span class="bk-missing-friend">${F().art(target, { size: 190 }).replace('class="lf"', 'class="lf is-bodiless"')}</span><button type="button" class="bk-shape-lift" hidden aria-label="Hear the friend, or drag its letter out">${F().art(target, { size: 190, mode: 'plain' })}</button></div>
        <div class="bk-pieces">${this.offered.map((c, i) => `<button type="button" class="bk-piece" data-i="${i}" aria-label="${c}">${F().art(c, { size: 96, mode: 'plain' })}</button>`).join('')}</div>
        <div class="bk-shape-toys" hidden><div class="bk-shape-tray"><button type="button" class="bk-shape-unbuild" aria-label="Lift the letter out"><svg viewBox="0 0 60 60" aria-hidden="true"><path d="M30 6v28M20 24l10 10 10-10" fill="none" stroke="#4a3620" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 39v12h42V39" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button type="button" class="bk-shape-rebuild" hidden aria-label="Put the letter back">${F().art(target, { size: 96, mode: 'plain' })}</button></div><button type="button" class="bk-shape-next" aria-label="${this.round + 1 >= this.rounds ? 'Finish friend shapes' : 'Next friend'}"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 24h28M26 12l12 12-12 12" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
        ${this.dots(this.rounds, this.round)}`;
      this.root.querySelectorAll('.bk-piece').forEach(b => {
        const live = () => this.alive && this.phase === 'matching' && !this.busy && this.roundToken === round;
        b.addEventListener('click', () => { if (live()) this.pick(Number(b.dataset.i), b, round); });
        this.bindCarry(b, live, (released) => this.pick(Number(b.dataset.i), b, round, released));
      });
      const lift = this.root.querySelector('.bk-shape-lift'), rebuild = this.root.querySelector('.bk-shape-rebuild');
      const playing = () => this.alive && this.roundToken === round && this.phase === 'playing';
      lift?.addEventListener('click', () => { if (playing() && this.assembled) { this.say(F().item(target)); this.ctx.sfx?.(F().get(target).call); this.wobble(this.root.querySelector('.bk-missing-friend')); } });
      if (lift && ns.GardenPractice?.draggable) this.dragResets.push(ns.GardenPractice.draggable(lift, {
        enabled: () => playing() && this.assembled,
        drop: (x, y) => playing() && !this.shapeTarget(x, y) ? this.takeApart() : false,
      }));
      this.root.querySelector('.bk-shape-unbuild')?.addEventListener('click', () => { if (playing()) this.takeApart(); });
      rebuild?.addEventListener('click', () => { if (playing() && !this.assembled) this.assemble(rebuild, round, null, false); });
      if (rebuild) this.bindCarry(rebuild, () => playing() && !this.assembled, released => this.assemble(rebuild, round, released, false));
      this.root.querySelector('.bk-shape-next')?.addEventListener('click', () => {
        if (!playing()) return;
        const keyboard = this.root.querySelector('.bk-shape-next')?.matches?.(':focus-visible');
        this.round += 1; this.next();
        if (keyboard && this.phase === 'matching') this.root.querySelector('.bk-piece')?.focus?.({ preventScroll: true });
      });
      this.teachShape(); this.ctx.sfx?.(F().get(target).call);
    }
    bindCarry(button, enabled, onFit) {
      if (!ns.GardenPractice?.draggable) return;
      this.dragResets.push(ns.GardenPractice.draggable(button, {
        enabled,
        onDragMove: (x, y) => { if (enabled()) this.showShapeReceiving(this.shapeTarget(x, y)); },
        onDragEnd: () => this.showShapeReceiving(null),
        drop: (x, y, released) => enabled() && this.shapeTarget(x, y) ? onFit(released) : false,
      }));
    }
    teachShape() {
      this.actionCue?.destroy(); this.actionCue = null;
      const round = this.roundToken, matching = this.phase === 'matching';
      const source = matching ? [...this.root.querySelectorAll('.bk-piece')].find(b => this.offered[Number(b.dataset.i)] === this.target)
        : this.root.querySelector(this.assembled ? '.bk-shape-lift' : '.bk-shape-rebuild');
      this.actionCue = this.ctx.setupActionCue?.({ source, destination: this.root.querySelector(!matching && this.assembled ? '.bk-shape-tray' : '.bk-missing'), type: 'drag',
        automatic: matching && this.ctx.firstActionDemo === true && !this.demonstrated,
        onShow: () => { if (this.alive && this.roundToken === round && this.phase === 'matching') this.missed = true; },
      });
      if (matching) this.demonstrated = true;
    }
    shapeTarget(x, y) {
      const hole = this.root.querySelector('.bk-missing'), r = hole?.getBoundingClientRect?.();
      return r && r.width > 0 && r.height > 0 && x >= r.left - 24 && x <= r.right + 24 && y >= r.top - 24 && y <= r.bottom + 24 ? hole : null;
    }
    showShapeReceiving(hole) { this.root.querySelector('.bk-missing')?.classList.toggle('is-receiving', !!hole); }
    pick(i, btn, round = this.roundToken, released = null) {
      if (!this.alive || this.busy || this.phase !== 'matching' || round !== this.roundToken) return false;
      const chosen = this.offered[i];
      if (!chosen || this.wrong.has(chosen)) return false;
      if (!this.report(this.target, chosen, this.offered)) {
        this.wrong.add(chosen); this.missed = true; this.ctx.sfx?.('softwrong'); this.wobble(btn);
        this.root.querySelectorAll('.bk-piece').forEach((b, k) => b.classList.toggle('is-hint', this.offered[k] === this.target));
        return false;
      }
      return this.assemble(btn, round, released, true);
    }
    assemble(btn, round, released, learning) {
      if (!this.alive || round !== this.roundToken || !['matching', 'playing'].includes(this.phase) || this.assembled) return false;
      this.phase = 'assembling'; this.busy = true; this.actionCue?.destroy(); this.actionCue = null;
      const target = this.target, keyboard = btn.matches?.(':focus-visible');
      btn.classList.add('is-fitting');
      const a = btn.getBoundingClientRect?.(), b = this.root.querySelector('.bk-missing-friend > svg')?.getBoundingClientRect?.() || this.root.querySelector('.bk-missing')?.getBoundingClientRect?.();
      if (a && b && !this.ctx.reducedMotion?.()) {
        const scale = a.width && btn.offsetWidth ? a.width / btn.offsetWidth : 1;
        const start = released ? `translate(${(released.left-a.left)/scale}px, ${(released.top-a.top)/scale}px)` : 'none';
        this.assemblyFlight = btn.animate?.([{ transform: start, opacity: 1 }, { transform: `translate(${(b.left+b.width/2-a.left-a.width/2)/scale}px, ${(b.top+b.height/2-a.top-a.height/2)/scale}px) scale(${b.width/a.width})`, opacity: .25 }], { duration: 340, easing: 'ease-out', fill: 'forwards' });
      }
      this.later(() => {
        if (!this.alive || this.roundToken !== round || this.phase !== 'assembling' || this.target !== target) return;
        this.assemblyFlight?.cancel(); this.assemblyFlight = null; btn.classList.remove('is-fitting');
        this.assembled = true; this.phase = 'playing'; this.busy = false;
        this.root.querySelector('.bk-pieces').hidden = true; this.root.querySelector('.bk-shape-toys').hidden = false;
        this.setAssembly();
        if (learning) { this.cheer(this.root.querySelector('.bk-missing')); this.say(F().item(target)); }
        this.ctx.sfx?.(learning ? F().get(target).call : 'drop');
        const dots = this.root.querySelector('.bk-progress'); if (dots) dots.outerHTML = this.dots(this.rounds, this.round + 1);
        this.teachShape();
        if (keyboard) this.root.querySelector(learning ? '.bk-shape-next' : '.bk-shape-lift')?.focus?.({ preventScroll: true });
      }, this.ctx.reducedMotion?.() ? 0 : 340);
      return true;
    }
    setAssembly() {
      const friend = this.root.querySelector('.bk-missing-friend > .lf');
      friend?.classList.toggle('is-bodiless', !this.assembled); friend?.classList.toggle('is-whole', this.assembled);
      const lift = this.root.querySelector('.bk-shape-lift'), rebuild = this.root.querySelector('.bk-shape-rebuild'), unbuild = this.root.querySelector('.bk-shape-unbuild');
      if (lift) lift.hidden = !this.assembled; if (rebuild) rebuild.hidden = this.assembled; if (unbuild) unbuild.hidden = !this.assembled;
      this.root.classList.toggle('is-apart', !this.assembled);
    }
    takeApart() {
      if (!this.alive || this.phase !== 'playing' || !this.assembled) return false;
      const keyboard = this.root.querySelector('.bk-shape-unbuild')?.matches?.(':focus-visible') || this.root.querySelector('.bk-shape-lift')?.matches?.(':focus-visible');
      this.assembled = false; this.setAssembly(); this.teachShape(); this.ctx.sfx?.('clink');
      if (keyboard) this.root.querySelector('.bk-shape-rebuild')?.focus?.({ preventScroll: true });
      return true;
    }
    replayPrompt() { if (this.alive && ['matching', 'playing'].includes(this.phase) && this.target) this.ctx.sfx?.(F().get(this.target).call); }
    finish() { if (!this.alive || this.phase === 'finished') return false; this.phase = 'finished'; this.busy = true; this.clearRound(); this.ctx.sfx?.('cheer2'); this.ctx.done?.(); return true; }
    destroy() { this.clearRound(); super.destroy(); }
  }

  // ---------- Busy Market (free play) ----------
  const stallArt = (i) => playArt().marketStall?.(i) || `<svg viewBox="0 0 160 70" aria-hidden="true"><path d="M8 62V34Q8 8 80 8Q152 8 152 34V62Z" fill="${["#ee806f", "#62cdf4", "#7fce54"][i]}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M24 36V62M52 32V62M80 30V62M108 32V62M136 36V62" stroke="#fffaf0" stroke-width="4"/></svg>`;

  class BusyMarket extends Base {
    constructor(ctx) {
      super(ctx, "bk-market", "Busy market");
      const known = letterItems(ctx).map((l) => l.display);
      // Every item on the page belongs to a taught letter, and each lens gets
      // at least one picture before the remaining spaces are filled.
      const eligible = known.filter((c) => (P()?.byChar(c) || []).length);
      const maxGoods = level(ctx, letterItems(ctx), "friend") >= 2 ? 12 : 6;
      this.lenses = orderedChars(ctx, eligible, "friend", Math.min(3, maxGoods));
      if (!this.lenses.length) { ctx.cancel?.(); return; }
      const goods = new Map();
      for (const c of this.lenses) {
        const picture = shuffle(P().byChar(c) || []).find((p) => !goods.has(p.id));
        if (picture) goods.set(picture.id, picture);
      }
      const limit = maxGoods;
      const eligibleSet = new Set(known);
      const remaining = shuffle(this.lenses.flatMap((c) => P().byChar(c) || []).filter((p) => eligibleSet.has(p.char) && !goods.has(p.id)));
      for (const p of remaining) { if (goods.size >= limit) break; goods.set(p.id, p); }
      this.goods = shuffle([...goods.values()]);
      this.lens = 0; this.phase = 'finding'; this.found = new Set(); this.packed = new Set(); this.pending = new Set();
      this.finishedLenses = new Set(); this.lensToken = 0; this.finished = false;
      this.slotCount = Math.ceil(this.goods.length / 3) * 3;
      this.stock = Array.from({ length: this.slotCount }, (_, i) => this.goods[i]?.id || null);
      this.bagPage = 0; this.bagToken = 0; this.bagDrags = []; this.shelfDrags = []; this.flights = new Map();
      this.root.innerHTML = `<div class="bk-lens-row"><button type="button" class="bk-lens" aria-label="Change the letter lens"></button><button type="button" class="bk-market-finish" hidden aria-label="Finish market"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 24h28M26 12l12 12-12 12" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="bk-bag" role="group" aria-label="Collected pictures"></div></div>
        <div class="bk-scene" style="--market-rows:${Math.ceil(this.goods.length / 3)}"><div class="bk-stalls" aria-hidden="true">${[0, 1, 2].map(i => `<span class="bk-stall">${stallArt(i)}${Array.from({ length: Math.ceil(this.goods.length / 3) }, (_, row) => `<i class="bk-market-shelf" style="--shelf-row:${row}"></i>`).join('')}</span>`).join('')}</div>${Array.from({ length: this.slotCount }, (_, i) => `<span class="bk-market-place" data-slot="${i}" style="--good-col:${i % 3};--good-row:${Math.floor(i / 3)}" hidden aria-hidden="true"></span>`).join('')}${this.goods.map((p, i) => `<button type="button" class="bk-good" data-i="${i}" style="--good-col:${i % 3};--good-row:${Math.floor(i / 3)}" aria-label="${p.en}">${P().art(p, 58)}</button>`).join('')}</div>`;
      this.lensBtn = this.root.querySelector('.bk-lens'); this.bag = this.root.querySelector('.bk-bag');
      this.lensBtn.onclick = () => this.nextLens(true);
      this.root.querySelector('.bk-market-finish')?.addEventListener('click', () => this.finish());
      this.root.querySelectorAll('.bk-good').forEach(b => {
        const i = Number(b.dataset.i), p = this.goods[i];
        b.addEventListener('click', () => this.tap(i, b));
        if (ns.GardenPractice?.draggable) this.shelfDrags.push(ns.GardenPractice.draggable(b, {
          enabled: () => this.alive && this.phase === 'exploring' && !this.packed.has(p.id) && !this.pending.has(p.id),
          onDragMove: (x,y) => this.bag.classList.toggle('is-receiving', this.inside(this.bag,x,y)),
          onDragEnd: () => this.bag.classList.remove('is-receiving'),
          drop: (x,y,released) => this.phase === 'exploring' && this.inside(this.bag,x,y) ? this.pack(i,b,released) : false,
        }));
      });
      this.showLens();
    }
    inside(el,x,y) { const r=el?.getBoundingClientRect?.();return !!r&&r.width>0&&r.height>0&&x>=r.left-24&&x<=r.right+24&&y>=r.top-24&&y<=r.bottom+24; }
    showLens() {
      this.lensToken += 1;
      const c = this.lenses[this.lens];
      this.misses = 0;
      this.root.querySelectorAll('.bk-good.is-hint').forEach(b => b.classList.remove('is-hint'));
      this.lensBtn.innerHTML = `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="52" cy="52" r="40" fill="#ccfbef" stroke="${INK}" stroke-width="6"/><path d="M82 82L110 110" stroke="#70501b" stroke-width="12" stroke-linecap="round" data-ribbon/></svg><span>${F().art(c, { size: 56, mode: F().look(ns.gardenBrain?.skills(c).friend) })}</span>`;
      this.renderBag(); this.replayPrompt(); this.teachMarket();
    }
    replayPrompt() { const c = this.lenses?.[this.lens]; if (this.alive && c && this.phase === 'finding') this.say({ id: c, display: c, speak: ns.LETTERS_DATA?.packs?.flatMap(p => p.letters).find(l => l.char === c)?.arName || c }); }
    left(c) { return this.goods.filter((g) => g.char === c && !this.found.has(g.id)).length; }
    nextLens(manual) {
      if (this.finished || !this.alive || this.phase !== 'finding') return;
      const n = this.lenses.length; let k = this.lens;
      for (let step = 1; step <= n; step += 1) { const candidate = (this.lens + step) % n; if (this.left(this.lenses[candidate])) { k = candidate; break; } }
      if (!this.left(this.lenses[k])) return this.complete();
      this.lens = k; this.ctx.sfx?.('click'); this.showLens();
    }
    tap(i, btn) {
      if (!this.alive || this.finished) return false;
      const p = this.goods[i]; if (!p || this.packed.has(p.id) || this.pending.has(p.id)) return false;
      if (this.phase === 'exploring') return this.pack(i,btn);
      const c = this.lenses[this.lens]; this.say(P().item(p));
      if (p.char !== c) {
        this.wobble(btn);
        if (p.char !== c && ++this.misses >= 3) {
          const k = this.goods.findIndex(g => g.char === c && !this.found.has(g.id));
          this.root.querySelectorAll('.bk-good').forEach((b,j) => b.classList.toggle('is-hint',j===k));
        }
        return false;
      }
      this.misses = 0; this.root.querySelectorAll('.bk-good.is-hint').forEach(b => b.classList.remove('is-hint'));
      this.found.add(p.id); this.pack(i,btn);
      if (!this.left(c)) {
        this.finishedLenses.add(c); this.ctx.pet?.cheer?.();
        if (this.lenses.every((l) => !this.left(l))) { this.later(() => this.complete(),1400); return true; }
        const token=this.lensToken,lens=c;
        this.later(()=>{if(this.alive&&!this.finished&&this.phase==='finding'&&this.lensToken===token&&this.lenses[this.lens]===lens)this.nextLens(false);},1400);
      }
      return true;
    }
    pack(i,btn,released=null) {
      const p=this.goods[i];
      if(!this.alive||this.finished||!p||this.packed.has(p.id)||this.pending.has(p.id))return false;
      this.packed.add(p.id);this.pending.add(p.id);
      const slot=this.stock.indexOf(p.id);if(slot>=0)this.stock[slot]=null;
      const keyboard=btn.matches?.(':focus-visible');
      this.actionCue?.destroy();this.actionCue=null;btn.classList.add('is-packing');
      const a=btn.getBoundingClientRect?.(),b=this.bag.getBoundingClientRect?.();
      if(a&&b&&!this.ctx.reducedMotion?.()) {
        const scale=a.width&&btn.offsetWidth?a.width/btn.offsetWidth:1;
        const start=released?`translate(${(released.left-a.left)/scale}px, ${(released.top-a.top)/scale}px)`:'none';
        const flight=btn.animate?.([{transform:start,opacity:1},{transform:`translate(${(b.left+b.width/2-a.left-a.width/2)/scale}px, ${(b.top+b.height/2-a.top-a.height/2)/scale}px) scale(.5)`,opacity:.2}],{duration:320,easing:'ease-out',fill:'forwards'});
        if(flight)this.flights.set(p.id,flight);
      }
      this.later(()=>{
        if(!this.alive||this.finished||!this.packed.has(p.id))return;
        this.pending.delete(p.id);btn.classList.remove('is-packing');
        this.renderStock();this.flights.get(p.id)?.cancel();this.flights.delete(p.id);
        this.renderBag();this.ctx.sfx?.('pop');
        if(this.phase==='exploring')this.say(P().item(p));
        this.teachMarket();
        if(keyboard)(this.phase==='exploring'?this.bag.querySelector('.bk-packed'):this.lensBtn)?.focus?.({preventScroll:true});
      },this.ctx.reducedMotion?.()?0:320);
      return true;
    }
    renderStock() {
      this.root.querySelectorAll('.bk-good').forEach(b=>{
        const p=this.goods[Number(b.dataset.i)],slot=this.stock.indexOf(p.id);
        b.classList.toggle('is-found',slot<0&&!this.pending.has(p.id));
        if(slot>=0){b.style.setProperty('--good-col',slot%3);b.style.setProperty('--good-row',Math.floor(slot/3));}
      });
      this.root.querySelectorAll('.bk-market-place').forEach(b=>{b.hidden=this.phase!=='exploring'||this.stock[Number(b.dataset.slot)]!==null;});
    }
    renderBag() {
      this.bagDrags.forEach(reset=>reset());this.bagDrags=[];const token=++this.bagToken;
      const all=[...this.packed].filter(id=>!this.pending.has(id));
      const pages=Math.max(1,Math.ceil(all.length/3));this.bagPage=Math.min(this.bagPage,pages-1);
      const shown=all.slice(this.bagPage*3,this.bagPage*3+3);
      this.bag.innerHTML=shown.length?`<div class="bk-packed-items">${shown.map(id=>{const i=this.goods.findIndex(p=>p.id===id),p=this.goods[i];return `<button type="button" class="bk-packed" data-i="${i}" aria-label="${this.phase==='exploring'?'Put on a shelf':'Hear collected'} ${p.en}">${P().art(p,44)}</button>`;}).join('')}</div>${pages>1?'<button type="button" class="bk-bag-more" aria-label="More collected pictures"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="9" cy="20" r="3"/><circle cx="20" cy="20" r="3"/><circle cx="31" cy="20" r="3"/></svg></button>':''}`:'';
      this.bag.querySelector('.bk-bag-more')?.addEventListener('click',()=>{if(!this.alive||this.finished||this.bagToken!==token)return;this.bagPage=(this.bagPage+1)%pages;this.renderBag();this.teachMarket();this.bag.querySelector('.bk-bag-more')?.focus?.({preventScroll:true});});
      this.bag.querySelectorAll('.bk-packed').forEach(b=>{
        const i=Number(b.dataset.i),p=this.goods[i];
        const live=()=>this.alive&&!this.finished&&this.bagToken===token&&this.packed.has(p.id)&&!this.pending.has(p.id);
        b.addEventListener('click',()=>{if(!live())return;if(this.phase==='exploring')this.restock(i,this.stock.indexOf(null),b);else{this.say(P().item(p));this.wobble(b);}});
        if(ns.GardenPractice?.draggable)this.bagDrags.push(ns.GardenPractice.draggable(b,{
          enabled:()=>live()&&this.phase==='exploring',
          onDragMove:(x,y)=>{const slot=this.emptySlotAt(x,y);this.root.querySelectorAll('.bk-market-place').forEach(el=>el.classList.toggle('is-receiving',Number(el.dataset.slot)===slot));},
          onDragEnd:()=>this.root.querySelectorAll('.bk-market-place').forEach(el=>el.classList.remove('is-receiving')),
          drop:(x,y,released)=>live()&&this.phase==='exploring'?this.restock(i,this.emptySlotAt(x,y),b,released):false,
        }));
      });
    }
    emptySlotAt(x,y) {
      let best=-1,distance=Infinity;
      this.root.querySelectorAll('.bk-market-place').forEach(b=>{
        const slot=Number(b.dataset.slot);if(this.stock[slot]!==null||!this.inside(b,x,y))return;
        const r=b.getBoundingClientRect(),d=Math.hypot(x-r.left-r.width/2,y-r.top-r.height/2);
        if(d<distance){best=slot;distance=d;}
      });return best;
    }
    restock(i,slot,source,released=null) {
      const p=this.goods[i];if(!this.alive||this.phase!=='exploring'||!p||!this.packed.has(p.id)||this.pending.has(p.id)||slot<0||slot>=this.stock.length||this.stock[slot]!==null)return false;
      const keyboard=source?.matches?.(':focus-visible');this.packed.delete(p.id);this.stock[slot]=p.id;
      this.renderStock();this.renderBag();this.say(P().item(p));this.ctx.sfx?.('drop');this.teachMarket();
      const placed=[...this.root.querySelectorAll('.bk-good')].find(b=>Number(b.dataset.i)===i);
      if(keyboard)placed?.focus?.({preventScroll:true});return true;
    }
    teachMarket() {
      this.actionCue?.destroy();this.actionCue=null;if(this.finished)return;
      const exploring=this.phase==='exploring';
      const packed=exploring?this.bag.querySelector('.bk-packed'):null;
      const source=exploring?(packed||[...this.root.querySelectorAll('.bk-good')].find(b=>this.stock.includes(this.goods[Number(b.dataset.i)].id))):[...this.root.querySelectorAll('.bk-good')].find(b=>this.goods[Number(b.dataset.i)].char===this.lenses[this.lens]&&!this.found.has(this.goods[Number(b.dataset.i)].id));
      const destination=exploring?(packed?[...this.root.querySelectorAll('.bk-market-place')].find(b=>!b.hidden):this.bag):source;
      if(!source||!destination)return;
      this.actionCue=this.ctx.setupActionCue?.({source,destination,type:exploring?'drag':'tap',automatic:this.ctx.firstActionDemo===true&&!(exploring?this.exploreDemo:this.findDemo),onShow:()=>{}});
      if(exploring)this.exploreDemo=true;else this.findDemo=true;
    }
    complete() {
      if(!this.alive||this.finished||this.phase!=='finding'||this.lenses.some(c=>this.left(c)))return false;
      if(this.pending.size){this.later(()=>this.complete(),340);return false;}
      this.phase='exploring';this.lensToken+=1;this.noReplay=true;this.ctx.onFreePlay?.();this.lensBtn.hidden=true;
      this.root.querySelector('.bk-market-finish').hidden=false;this.root.classList.add('is-shopkeeper');
      this.renderStock();this.renderBag();this.teachMarket();this.ctx.sfx?.('cheer2');this.ctx.pet?.cheer?.();return true;
    }
    finish() {if(!this.alive||this.finished||this.phase!=='exploring')return false;this.finished=true;this.phase='finished';this.actionCue?.destroy();this.ctx.done?.();return true;}
    destroy(){this.actionCue?.destroy();this.bagDrags.forEach(reset=>reset());this.shelfDrags.forEach(reset=>reset());this.flights.forEach(f=>f.cancel());super.destroy();}
  }

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { PeekFlaps, SoundSort, HoopoeTrip, FriendShapes, BusyMarket });
  ns.BookGames = { KINDS: ["PeekFlaps", "SoundSort", "HoopoeTrip", "FriendShapes", "BusyMarket"] };
})(window.MiftahGame || (window.MiftahGame = {}));
