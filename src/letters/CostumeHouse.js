// The Costume House (v62, 2026-10-16) — the positional-forms land.
// A letter changes shape with its place in a word: at the start it reaches
// forward (بـ), in the middle it holds hands both ways (ـبـ), at the end it
// lets go (ـب). Reading real words needs this, and until now the garden only
// joined letters in its joining chapters. Here the letter friends "wear a
// costume" for each place:
//
//   Disguise     a friend, a picture and its word — tap where the friend is
//                hiding inside the word, in its costume.
//   CostumeRail  a word with one letter missing; which costume of that SAME
//                letter fits the gap (start, middle or end shape)?
//   ShapeTrain   a letter's costumes ride a train whose couplings match their
//                joining tails: the front car couples only behind, middle cars
//                both ways, the last car only in front.
//
// Words are drawn letter by letter, each piece forced into its joined shape
// with zero-width joiners, laid side by side right-to-left — they read as one
// connected word but every letter is its own tappable, highlightable piece.
(function (ns) {
  const ZWJ = "‍", TATWEEL = "ـ";
  // Letters that never join to the letter after them.
  const RIGHT_ONLY = new Set([..."اأإآٱدذرزوؤةء"]);
  const MARK = /[ؐ-ًؚ-ٰٟۖ-ۭ]/;
  const P = () => ns.PictureWords;
  const F = () => ns.LetterFriends;
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const norm = (s) => typeof s === "string" ? s.normalize("NFC") : "";
  const eligible = (i, ctx) => i && i.id != null && norm(i.display || i.word) && i.taught !== false && i.isTaught !== false && i.locked !== true && i.unlocked !== false
    && (!ctx.completedWorldIds || !(i.prerequisiteWorldIds || []).some((id) => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));
  const allItems = (ctx) => [...(ctx.items || []), ...(ctx.known || []), ...(ctx.extraItems || [])].map((v) => typeof v === "string" ? { id:v, display:v } : v).filter(Boolean);
  function knownItems(ctx) {
    const all=allItems(ctx), blocked=new Set(all.filter(i=>!eligible(i,ctx)).map(i=>norm(i.display)).filter(Boolean)), seen=new Set(), out=[];
    for(const i of all){const display=norm(i.display);if(!eligible(i,ctx)||blocked.has(display)||seen.has(display)||!F()?.FRIENDS?.[display])continue;seen.add(display);out.push({...i,display});}
    return out;
  }
  function planItems(ctx,candidates,count,skill="letter-form"){
    const pool=knownItems(ctx).filter(i=>candidates.some(c=>c.display===i.display));
    const planned=ns.PracticeLearning?.plan?.(ctx,pool.slice(),skill,count), ids=new Map(pool.map(i=>[String(i.id),i])), displays=new Map(pool.map(i=>[i.display,i]));
    const resolve=x=>x&&typeof x==="object"?(x.id!=null?ids.get(String(x.id)):displays.get(norm(x.display))):ids.get(String(x))||displays.get(norm(x));
    if(Array.isArray(planned))return [...new Set(planned.map(resolve).filter(Boolean))].slice(0,count);
    const ordered=ns.PracticeLearning?.orderChars?.(ctx,pool.map(i=>i.display),skill,count);
    if(Array.isArray(ordered))return [...new Set(ordered.map(resolve).filter(Boolean))].slice(0,count);
    return shuffle(pool).slice(0,count);
  }

  // A word as letter clusters (a letter with its marks).
  function clusters(word) { const out = []; for (const ch of String(word)) { if ((MARK.test(ch) || ch === TATWEEL) && out.length) out[out.length - 1] += ch; else out.push(ch); } return out; }
  // Each letter's place: how it joins its neighbours.
  function forms(word) {
    const cl = clusters(word);
    return cl.map((c, i) => {
      const base = c[0], prev = cl[i - 1]?.[0], next = cl[i + 1];
      const joinPrev = !!prev && !RIGHT_ONLY.has(prev), joinNext = !!next && !RIGHT_ONLY.has(base);
      const form = joinPrev && joinNext ? "middle" : joinPrev ? "end" : joinNext ? "start" : "alone";
      return { cluster: c, base, form, text: (joinPrev ? ZWJ : "") + c + (joinNext ? ZWJ : "") };
    });
  }
  // A letter shown alone in one costume, with a visible joining tail.
  function costume(letter, form) {
    if (form === "start") return letter + TATWEEL;
    if (form === "middle") return TATWEEL + letter + TATWEEL;
    if (form === "end") return TATWEEL + letter;
    return letter;
  }
  const canStart = (letter) => !RIGHT_ONLY.has(letter);
  const wordHTML = (pieces, cls = "") => `<div class="ch-word ${cls}" dir="rtl" lang="ar">${pieces.map((p, i) => `<span class="ch-piece" data-i="${i}">${p.text}</span>`).join("")}</div>`;

  class Base {
    constructor(ctx, cls, label) {
      this.ctx = ctx; this.alive = true; this.timers = []; this.roundToken = 0; this.dragResets = []; this.noReplay = true;
      ctx.stage.innerHTML = `<div class="ch ${cls}" role="group" aria-label="${label}"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
      this.visitLevel = ctx.beginner ? 0 : Math.max(0, Math.min(2, Number(ns.PracticeLearning?.level?.(ctx, knownItems(ctx), "letter-form")) || 0));
      this.choiceCeiling = this.visitLevel ? 3 : 2;
      this.rounds = this.visitLevel ? 4 : 3; this.round = 0;
      this.known = planItems(ctx, knownItems(ctx), knownItems(ctx).length, "letter-form");
    }
    current(token = this.roundToken, root = this.root) { return this.alive && token === this.roundToken && this.root === root && root?.isConnected !== false && (!this.ctx.stage?.contains || this.ctx.stage.contains(root)); }
    later(fn, ms, token = this.roundToken, root = this.root) { const t = setTimeout(() => { if (this.current(token, root)) fn(); }, ms); this.timers.push(t); return t; }
    sayWord(p) { try { const r = this.ctx.say?.(P().item(p)); return r?.then ? r.catch(() => false) : r; } catch { return false; } }
    sayLetter(c) { try { const r = this.ctx.say?.(F().item(c)); return r?.then ? r.catch(() => false) : r; } catch { return false; } }
    dots() { return `<div class="bk-progress" aria-hidden="true">${Array.from({ length: this.rounds }, (_, i) => `<i class="${i < this.round ? "is-done" : i === this.round ? "is-on" : ""}"></i>`).join("")}</div>`; }
    wobble(el) { if (!this.ctx.reducedMotion?.()) el?.animate?.([{ opacity: 1 }, { opacity: .84 }, { opacity: 1 }], { duration: 360 }); }
    cheer(el) { this.ctx.correct?.(); this.ctx.confettiAt?.(el); this.ctx.pet?.cheer?.(); }
    report(target, correct, chosen, offered) {
      const item = this.known.find((i) => i.display === target) || { id: target, display: target };
      this.ctx.reportOutcome?.({ item, itemId: item.id, activity: this.constructor.name, skill: "letter-form", correct,
        evidence: "supported_visible_matching", assisted: !!this.missed, selectedId: chosen, choiceIds: offered, affectsStrength: false });
    }
    finish() { if (this.finished || !this.current()) return; this.finished = true; this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 900); }
    cancel() { this.busy = true; this.ctx.cancel?.(); }
    destroy() { this.alive = false; this.roundToken += 1; this.timers.forEach(clearTimeout); this.dragResets.forEach((reset) => { try { reset(); } catch {} }); }
  }

  // Picture words containing a known letter somewhere (not only first),
  // with the letter's place in the word.
  function hides(known, words = P()?.LIST || []) {
    const chars = new Set(known.map((i) => norm(typeof i === "string" ? i : i.display))), out = [];
    for (const p of words) {
      const word = norm(p?.word || p?.display); if (!word) continue;
      const pieces = forms(word);
      if (!pieces.length || pieces.some((f) => !chars.has(norm(f.base)))) continue;
      pieces.forEach((f, i) => out.push({ p: { ...p, word }, i, letter: norm(f.base), form: f.form }));
    }
    return out;
  }
  function questionWords(ctx, known) {
    const source = Object.prototype.hasOwnProperty.call(ctx, "words") && ctx.words !== undefined ? (ctx.words || []) : (P()?.LIST || []);
    const blocked = new Set(source.filter((w) => !eligible(w, ctx)).map((w) => norm(w.word || w.display)).filter(Boolean));
    const valid = source.filter((w) => eligible(w, ctx) && !blocked.has(norm(w.word || w.display))
      && forms(norm(w.word || w.display)).every((f) => known.some((i) => i.display === norm(f.base))));
    const planningItems=valid.map(w=>({...w,display:norm(w.word||w.display)}));
    const planned = ns.PracticeLearning?.plan?.(ctx, planningItems.slice(), "letter-form", planningItems.length);
    if (Array.isArray(planned)) {
      const byId = new Map(valid.map((w) => [String(w.id), w]));
      return [...new Set(planned.map((w) => w && typeof w === "object" ? byId.get(String(w.id)) : byId.get(String(w))).filter(Boolean))];
    }
    return valid;
  }
  function questions(ctx, known, nonAlone = false) {
    const all = shuffle(hides(known, questionWords(ctx, known)).filter((h) => !nonAlone || h.form !== "alone"));
    const seen = new Set(); return all.filter((h) => { const k = norm(h.p.word); if (seen.has(k)) return false; seen.add(k); return true; });
  }

  // ---------- Friend in Disguise ----------
  class Disguise extends Base {
    constructor(ctx) {
      super(ctx, "ch-disguise", "Find the friend in the word");
      // Prefer letters hiding in the middle or end — the costumes worth learning.
      const all = shuffle(questions(ctx, this.known));
      const pool = [...all.filter((h) => h.form !== "start"), ...all.filter((h) => h.form === "start")];
      this.qs = (this.visitLevel ? pool : pool.slice().sort((a,b) => forms(a.p.word).length - forms(b.p.word).length)).slice(0, this.rounds);
      if (this.qs.length < 2) { this.later(() => this.cancel(), 300); return; }
      this.rounds = this.qs.length;
      this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      this.dragResets.forEach((reset) => { try { reset(); } catch {} }); this.dragResets = [];
      const token = ++this.roundToken, root = this.root;
      const q = this.q = this.qs[this.round]; this.busy = false; this.missed = false; this.misses = 0;
      this.pieces = forms(q.p.word);
      const regions=this.pieces.map((p,i)=>({p,i})), target=regions.find(x=>x.i===q.i)||regions.find(x=>x.p.base===q.letter);
      const distinct = [...new Map(regions.filter(x=>x.p.base!==q.letter).map(x=>[`${x.p.base}:${x.p.form}`,x])).values()];
      this.choices=shuffle([target,...shuffle(distinct)].filter(Boolean).slice(0,this.choiceCeiling)).map(({p,i},k)=>({id:`${q.p.id}:region:${i}`,i,base:p.base,form:p.form,text:costume(p.base,p.form),label:`Letter ${k+1}, ${p.form} shape`}));
      this.root.innerHTML = `<div class="ch-top"><button type="button" class="ch-friend" aria-label="Hear the letter ${F().get(q.letter).en}">${F().art(q.letter, { size: 84 })}</button>
          <button type="button" class="ch-pic" aria-label="Hear the word">${P().art(q.p, 84)}</button></div>
        <div class="ch-lesson-prop">${ns.FormPlayArt?.wordStand?.() || ""}${wordHTML(this.pieces)}</div>
        <div class="ch-choice-tray" role="group" aria-label="Choose the matching letter region">${this.choices.map((c,k)=>`<button type="button" class="ch-piece" data-k="${k}" aria-label="${c.label}" dir="rtl" lang="ar">${c.text}</button>`).join("")}</div>${this.dots()}`;
      const friendButton = root.querySelector(".ch-friend");
      friendButton.onclick = () => { if(this.current(token,root)&&!this.busy&&root.querySelector(".ch-friend")===friendButton)this.sayLetter(q.letter); };
      const pictureButton = root.querySelector(".ch-pic");
      pictureButton.onclick = () => { if(this.current(token,root)&&!this.busy&&root.querySelector(".ch-pic")===pictureButton)this.sayWord(q.p); };
      this.root.querySelectorAll(".ch-choice-tray .ch-piece").forEach((s) => s.addEventListener("click", () => this.pick(Number(s.dataset.k), s, token, root)));
      this.ctx.beginRound?.(this.known.find(i=>i.display===q.letter),"letter-form");
      this.later(() => this.sayLetter(q.letter), 300, token, root);
      this.later(() => this.sayWord(q.p), 1400, token, root);
    }
    replayPrompt() { if (this.current() && this.q && !this.busy) this.sayLetter(this.q.letter); }
    pick(i, el, token=this.roundToken, root=this.root) {
      if (!this.current(token,root)||el!==this.root.querySelectorAll(".ch-choice-tray .ch-piece")[i]||this.busy||!this.choices[i]) return false;
      const choice=this.choices[i], right = choice.base === this.q.letter;
      this.report(this.q.letter, right, choice.id, this.choices.map(c=>c.id));
      if (!right) {
        this.busy=true;this.missed = true; this.misses += 1; this.ctx.sfx?.("softwrong"); this.wobble(el);el.disabled=true;
        if (this.misses >= 2) this.root.querySelectorAll(".ch-choice-tray .ch-piece").forEach((s, j) => s.classList.toggle("is-hint", this.choices[j].base === this.q.letter));
        this.later(()=>{this.busy=false;el.disabled=false;},650,token,root);return true;
      }
      this.busy = true;
      el.classList.add("is-found");el.disabled=true;
      this.root.querySelectorAll(".ch-word .ch-piece").forEach((part,index)=>part.classList.toggle("is-found",this.pieces[index]?.base===this.q.letter));
      const svg = this.root.querySelector(".ch-friend svg.lf");
      if (svg && !this.ctx.reducedMotion?.()) { svg.classList.add("is-wiggle"); this.later(() => svg.classList.remove("is-wiggle"), 950,token,root); }
      this.cheer(el);
      this.later(() => this.sayWord(this.q.p), 500,token,root);
      this.round += 1;
      this.later(() => this.next(), 1100,token,root);return true;
    }
  }

  // ---------- Costume Rail ----------
  class CostumeRail extends Base {
    constructor(ctx) {
      super(ctx, "ch-rail", "Pick the right costume");
      const pool = questions(ctx, this.known, true);
      this.qs = (this.visitLevel ? pool : pool.slice().sort((a,b) => forms(a.p.word).length - forms(b.p.word).length)).slice(0, this.rounds);
      if (this.qs.length < 2) { this.later(() => this.cancel(), 300); return; }
      this.rounds = this.qs.length; this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      this.dragResets.forEach(reset=>reset()); this.dragResets=[];
      const token = ++this.roundToken, root = this.root;
      const q = this.q = this.qs[this.round]; this.busy = false; this.missed = false; this.misses = 0;
      this.pieces = forms(q.p.word);
      const allForms = canStart(q.letter) ? ["start", "middle", "end"] : ["alone", "end"];
      this.options = shuffle([q.form, ...shuffle(allForms.filter(f => f !== q.form)).slice(0, this.choiceCeiling - 1)]);
      const art = ns.FormPlayArt?.costumeRail?.() || "";
      this.root.innerHTML = `<button type="button" class="ch-pic ch-pic-big" aria-label="Hear the word">${P().art(q.p, 96)}</button>
        <div class="ch-lesson-prop">${ns.FormPlayArt?.wordStand?.() || ""}
        <div class="ch-word is-gapped" dir="rtl" lang="ar">${this.pieces.map((p, i) => i === q.i ? `<span class="ch-piece ch-gap" data-i="${i}" aria-label="Missing letter shape"><span class="ch-gap-ghost">${p.text}</span></span>` : `<span class="ch-piece" data-i="${i}">${p.text}</span>`).join("")}</div></div>
        <div class="ch-choice-tray" role="group" aria-label="Choose the letter shape"><span class="ch-rail-art" aria-hidden="true">${art}</span><div class="ch-costumes">${this.options.map((f, k) => `<button type="button" class="ch-costume" data-k="${k}" aria-label="${f} shape" dir="rtl" lang="ar">${costume(q.letter, f)}</button>`).join("")}</div></div>${this.dots()}`;
      const pictureButton = root.querySelector(".ch-pic");
      pictureButton.onclick = () => { if(this.current(token,root)&&!this.busy&&root.querySelector(".ch-pic")===pictureButton)this.sayWord(q.p); };
      this.ctx.beginRound?.(this.known.find(i=>i.display===q.letter),"letter-form");
      this.root.querySelectorAll(".ch-costume").forEach((btn) => {
        btn.addEventListener("click", () => this.pick(Number(btn.dataset.k), btn, token, root));
        const reset = ns.GardenPractice?.draggable?.(btn, {
          enabled: () => this.current(token,root) && !this.busy && !btn.disabled,
          drop: (x,y) => { const gap=root.querySelector(".ch-gap"),r=gap?.getBoundingClientRect?.(); if(!r?.width||!r?.height)return false; const inside=x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom; const near=x>=r.left-28&&x<=r.right+28&&y>=r.top-28&&y<=r.bottom+28; return (inside||near)?this.pick(Number(btn.dataset.k),btn,token,root,true):false; }
        }); if(typeof reset === "function") this.dragResets.push(reset);
      });
      this.later(() => this.sayWord(q.p), 300, token, root);
    }
    replayPrompt() { if (this.current() && this.q && !this.busy) this.sayWord(this.q.p); }
    pick(k, btn, token=this.roundToken, root=this.root, handledDrop=false) {
      if (!this.current(token,root) || btn !== this.root.querySelectorAll(".ch-costume")[k] || this.busy || !this.options[k]) return false;
      const q=this.q, selected=this.options[k], right = selected === q.form;
      this.report(q.letter, right, selected, this.options);
      if (!right) {
        this.busy=true;this.missed = true; this.misses += 1; this.ctx.sfx?.("softwrong"); this.wobble(btn); btn.disabled=true;
        if (this.misses >= 2) this.root.querySelectorAll(".ch-costume").forEach((b, j) => b.classList.toggle("is-hint", this.options[j] === q.form));
        this.later(()=>{this.busy=false;btn.disabled=false;},650,token,root);return handledDrop;
      }
      this.busy = true; btn.disabled=true;btn.classList.add("is-right");
      const gap = this.root.querySelector(".ch-gap");
      gap.classList.add("is-filled");gap.innerHTML=this.pieces[q.i].text;gap.setAttribute?.("aria-label",`${q.form} shape, word complete`);
      this.cheer(gap);
      this.later(() => this.sayWord(q.p), 450,token,root);
      this.round += 1;
      this.later(() => this.next(), 1100,token,root);return true;
    }
  }

  // ---------- Shape Train ----------
  // A car with couplers on the side(s) it joins — matching the costume's tails.
  const CAR = (left, right) => `<svg viewBox="0 0 120 80" aria-hidden="true"><rect x="10" y="10" width="100" height="50" rx="10" fill="#fffaf0" stroke="#4a3620" stroke-width="3"/>${right ? `<rect x="110" y="30" width="10" height="10" rx="3" fill="#c69434" stroke="#4a3620" stroke-width="2.4"/>` : ""}${left ? `<rect x="0" y="30" width="10" height="10" rx="3" fill="#c69434" stroke="#4a3620" stroke-width="2.4"/>` : ""}<circle cx="34" cy="66" r="10" fill="#70501b" stroke="#4a3620" stroke-width="3"/><circle cx="86" cy="66" r="10" fill="#70501b" stroke="#4a3620" stroke-width="3"/></svg>`;
  class ShapeTrain extends Base {
    constructor(ctx) {
      super(ctx, "ch-train", "Shape train");
      const candidates=this.known.filter(i=>canStart(i.display));
      this.letters=planItems(ctx,candidates,candidates.length,"letter-form");
      if(this.letters.length<1){this.later(()=>this.cancel(),300);return;}
      this.rounds=Math.min(this.rounds,this.letters.length);this.letters=this.letters.slice(0,this.rounds);this.next();
    }
    next() {
      if(this.round>=this.rounds)return this.finish();
      this.dragResets.forEach((reset) => { try { reset(); } catch {} }); this.dragResets = [];
      const token=++this.roundToken,root=this.root, item=this.letterItem=this.letters[this.round], letter=this.letter=item.display;
      this.busy=false;this.placed=0;this.missed=false;this.selected=null;
      this.forms=this.visitLevel? ["start","middle","end"]:["start","end"];
      this.cards=shuffle(this.forms.slice());
      const cars=this.forms.map(f=>[f,f!=="end",f!=="start"]);
      const engine=ns.FormPlayArt?.trainEngine?.()||`<svg viewBox="0 0 70 80" aria-hidden="true"><rect x="6" y="18" width="50" height="42" rx="8" fill="#ee806f" stroke="#4a3620" stroke-width="3"/><rect x="34" y="4" width="14" height="18" rx="4" fill="#4a3620"/><circle cx="20" cy="66" r="10" fill="#70501b" stroke="#4a3620" stroke-width="3"/><circle cx="46" cy="66" r="10" fill="#70501b" stroke="#4a3620" stroke-width="3"/></svg>`;
      this.root.innerHTML=`<button type="button" class="ch-friend" aria-label="Hear the letter ${F().get(letter).en}">${F().art(letter,{size:76})}</button>
        <div class="ch-train-prop"><div class="ch-cars" dir="rtl"><span class="ch-engine" aria-hidden="true">${engine}</span>${cars.map(([f,left,right])=>`<button type="button" class="ch-car" data-form="${f}" aria-label="${f} car"><span class="ch-car-body">${ns.FormPlayArt?.trainCar?.(left,right)||CAR(left,right)}</span><span class="ch-car-seat" dir="rtl" lang="ar">${this.visitLevel?"":`<span class="ch-car-guide">${costume(letter,f)}</span>`}</span></button>`).join("")}</div></div>
        <div class="ch-choice-tray" role="group" aria-label="Choose a matching car"><div class="ch-costumes">${this.cards.map((f,k)=>`<button type="button" class="ch-costume" data-k="${k}" aria-label="${f} shape" dir="rtl" lang="ar">${costume(letter,f)}</button>`).join("")}</div></div>${this.dots()}`;
      const friendButton=root.querySelector(".ch-friend");
      friendButton.onclick=()=>{if(this.current(token,root)&&!this.busy&&root.querySelector(".ch-friend")===friendButton)this.sayLetter(letter);};
      this.ctx.beginRound?.(item,"letter-form");
      this.root.querySelectorAll(".ch-costume").forEach(btn=>{
        btn.addEventListener("click",()=>{if(!this.current(token,root)||this.busy||btn.disabled||root.querySelectorAll(".ch-costume")[Number(btn.dataset.k)]!==btn)return;this.root.querySelectorAll(".ch-costume").forEach(o=>o.classList.toggle("is-picked",o===btn));this.selected=Number(btn.dataset.k);this.ctx.sfx?.("click");});
        const reset=ns.GardenPractice?.draggable?.(btn,{enabled:()=>this.current(token,root)&&!this.busy&&!btn.disabled&&root.querySelectorAll(".ch-costume")[Number(btn.dataset.k)]===btn,
          onDragMove:(x,y)=>{const receiver=this.receivingCar(x,y,token,root);this.root.querySelectorAll(".ch-car").forEach(c=>c.classList.toggle("is-near",c===receiver));},
          onDragEnd:()=>{if(this.current(token,root))this.root.querySelectorAll(".ch-car").forEach(c=>c.classList.remove("is-near"));},
          drop:(x,y)=>{if(root.querySelectorAll(".ch-costume")[Number(btn.dataset.k)]!==btn)return false;const car=this.receivingCar(x,y,token,root);if(!car)return false;this.selected=Number(btn.dataset.k);return this.drop(car,token,root,true);}});
        if(typeof reset==="function")this.dragResets.push(reset);
      });
      this.root.querySelectorAll(".ch-car").forEach(car=>car.addEventListener("click",()=>this.drop(car,token,root,false)));
      this.later(()=>this.sayLetter(letter),300,token,root);
    }
    replayPrompt(){if(this.current()&&this.letter&&!this.busy)this.sayLetter(this.letter);}
    receivingCar(x,y,token=this.roundToken,root=this.root){if(!this.current(token,root)||this.busy)return null;const cars=[...this.root.querySelectorAll(".ch-car")].map(el=>({el,r:el.getBoundingClientRect?.()})).filter(v=>v.r?.width&&v.r?.height);const inside=cars.filter(({r})=>x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom),near=inside.length?inside:cars.filter(({r})=>x>=r.left-28&&x<=r.right+28&&y>=r.top-28&&y<=r.bottom+28);return near.sort((a,b)=>Math.hypot(x-(a.r.left+a.r.width/2),y-(a.r.top+a.r.height/2))-Math.hypot(x-(b.r.left+b.r.width/2),y-(b.r.top+b.r.height/2)))[0]?.el||null;}
    drop(car,token=this.roundToken,root=this.root,handledDrop=false){
      const cars=[...this.root.querySelectorAll(".ch-car")];
      if(!this.current(token,root)||!cars.includes(car)||this.busy||this.selected==null||car.classList.contains("is-full"))return false;
      const idx=this.selected,f=this.cards[idx],btn=this.root.querySelector(`.ch-costume[data-k="${idx}"]`);if(!btn||btn.disabled)return false;
      const right=car.dataset.form===f;
      if(!right)this.report(this.letter,false,f,this.cards);
      if(!right){this.busy=true;this.missed=true;this.ctx.sfx?.("softwrong");this.wobble(car);this.root.querySelectorAll(".ch-car").forEach(c=>c.classList.toggle("is-hint",c.dataset.form===f));btn.disabled=true;this.later(()=>{this.busy=false;btn.disabled=false;},650,token,root);return handledDrop;}
      car.classList.remove("is-hint");car.classList.add("is-full");car.querySelector(".ch-car-seat").textContent=costume(this.letter,f);btn.classList.add("is-used");btn.disabled=true;btn.classList.remove("is-picked");this.selected=null;this.placed+=1;this.ctx.sfx?.("drop");
      if(this.placed<this.forms.length)return true;
      this.report(this.letter,true,f,this.cards);
      this.busy=true;this.ctx.sfx?.("chime");const train=this.root.querySelector(".ch-cars");if(!this.ctx.reducedMotion?.())train.animate?.([{transform:"none"},{transform:"translateX(12px)"},{transform:"none"}],{duration:700,easing:"ease-in-out"});this.cheer(train);this.later(()=>this.sayLetter(this.letter),400,token,root);this.round+=1;this.later(()=>this.next(),1000,token,root);return true;
    }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { Disguise, CostumeRail, ShapeTrain });
  ns.CostumeHouse = { KINDS: ["Disguise", "CostumeRail", "ShapeTrain"], forms, costume, clusters, hides, canStart };
})(window.MiftahGame || (window.MiftahGame = {}));
