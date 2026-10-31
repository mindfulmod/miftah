// The Toy Box (v42–v47, 2026-10-08): six classic toddler toys, each rebuilt
// around the Letter Friends so playing with the toy IS meeting the letters.
//
//   FriendPairs   (v42) the memory card game: every friend has a twin card —
//                 its own letter. Turn two over; a friend and its letter make
//                 a pair. A quick peek at the start keeps it kind for 2–3s.
//   DotNests      (v43) nests hold dots like eggs. How many dots has this
//                 letter? Pop it into the nest with that many. Older children
//                 then sort by WHERE the dots sit: up in the tree or down on
//                 the ground. The dots are the whole difference between
//                 ب ت ث, so counting and placing them is the core skill.
//   FriendJigsaw  (v44) a friend in two, three or four pieces; a glowing gap
//                 suggests a start. Every piece fits its own gap in any order.
//   BathTime      (v45) a friend hiding under bubble foam in the tub (was
//                 mud until 2026-10-13). Scrub, and the suds pop away; halfway, "who is in the bath?" — a brave
//                 early guess from part of the letter.
//   LetterFishing (v46) fish swim by carrying letters; hear a letter, catch
//                 its fish. A wrong fish wriggles free and says its own name.
//   ColourFriend  (v47) a colouring page of a friend. Colour its letter body
//                 and it says its name; hang the finished page in the garden.
//
// The house rules hold: nothing is timed, a miss is a soft sound and a hint,
// evidence is honest (memory and puzzle games never claim letter knowledge),
// reduced motion is respected, and Little Sprout gets the gentlest version.
(function (ns) {
  const INK = "#4a3620";
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // Smart Choices (v50): the Garden Brain picks the wrong answers.
  const smart = (target, pool, n, skill, beginner) => (ns.gardenBrain?.others ? ns.gardenBrain.others(target, pool, n, { skill, beginner }) : shuffle(pool.filter((c) => c !== target)).slice(0, n));
  const F = () => ns.LetterFriends;
  const S = () => ns.LettersStrokes;
  const strengthOf = (ctx) => ctx?.strength || ns.LettersStrength;
  const nameOf = (c) => (ns.LETTERS_DATA?.packs || []).flatMap((p) => p.letters).find((l) => l.char === c)?.arName || c;
  const item = (c) => ({ id: c, display: c, speak: nameOf(c) });
  const normalized = (value) => typeof value === "string" ? value.normalize("NFC") : "";
  const eligibleItem = (i, ctx) => i && i.id != null && normalized(i.display) && i.taught !== false && i.isTaught !== false
    && i.locked !== true && i.unlocked !== false
    && (!ctx.completedWorldIds || !(i.prerequisiteWorldIds || []).some(id => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));
  const knownItems = (ctx) => {
    const declared = [...(ctx.items || []), ...(ctx.known || []), ...(ctx.extraItems || [])].map(v => typeof v === "string" ? { id: v, display: v } : v).filter(Boolean);
    const blocked = new Set(declared.filter(i => !eligibleItem(i, ctx)).map(i => normalized(i.display)).filter(Boolean));
    const seen = new Set(), result = [];
    for (const i of declared) {
      const display = normalized(i.display);
      if (!eligibleItem(i, ctx) || blocked.has(display) || seen.has(display) || !F()?.FRIENDS?.[display]) continue;
      seen.add(display); result.push({ ...i, display });
    }
    return result;
  };
  const knownChars = (ctx) => knownItems(ctx).map(i => i.display);
  const realItem = (ctx, c) => knownItems(ctx).find(i => i.display === normalized(c)) || item(c);
  const inRoot = (root, node) => !root?.contains || root.contains(node);
  const firstsOf = (ctx, pool) => (ctx.items || []).map((i) => i?.display).filter((c) => pool.includes(c));
  const practiceProfile = (ctx, c, skill) => {
    const p = ns.PracticeLearning?.profile?.(ctx, realItem(ctx, c), skill);
    return p && typeof p === "object" ? p : { choices: 2, choiceCount: 2, promptMode: "match", level: 0 };
  };
  const practiceItems = (ctx, pool, skill, count) => {
    const valid = knownItems(ctx).filter(i => pool.includes(i.display));
    let planned = ns.PracticeLearning?.plan?.(ctx, valid.slice(), skill, count);
    if (Array.isArray(planned)) {
      const byId = new Map(valid.map(i => [String(i.id), i])), byDisplay = new Map(valid.map(i => [i.display, i]));
      return [...new Set(planned.map(v => {
        if (v && typeof v === "object") return v.id != null ? byId.get(String(v.id)) : byDisplay.get(normalized(v.display));
        return byId.get(String(v)) || byDisplay.get(normalized(v));
      }).filter(Boolean))].slice(0, Math.max(0, count));
    }
    const chars = ns.PracticeLearning?.orderChars?.(ctx, valid.map(i => i.display), skill, count);
    if (Array.isArray(chars)) return [...new Set(chars.map(c => c && typeof c === "object" && c.id != null
      ? valid.find(i => String(i.id) === String(c.id))
      : valid.find(i => i.display === normalized(typeof c === "string" ? c : c?.display))).filter(Boolean))].slice(0, Math.max(0, count));
    return shuffle(valid).slice(0, Math.max(0, count));
  };
  const practiceOrder = (ctx, pool, skill, count) => practiceItems(ctx, pool, skill, count).map(i => i.display);
  const practiceLevel = (ctx, chars, skill) => {
    const eligible = knownItems(ctx), entries = chars.map(c => eligible.find(i => i.display === normalized(c))).filter(Boolean);
    if (!entries.length) return 0;
    const level = ns.PracticeLearning?.level?.(ctx, entries, skill);
    return Number.isFinite(level) ? Math.max(0, Math.min(2, level)) : 0;
  };
  const profileChoices = (profile, max = 3) => Math.max(2, Math.min(max, Number(profile?.choiceCount || profile?.choices) || 2));
  const pairsAt = (level, distinctVisits) => level <= 0 ? 2 : level === 1 ? 3 : distinctVisits >= 4 ? 4 : 3;
  const dotsOf = (c) => (S()?.LETTERS?.[c] || []).filter((s) => s && s.dot).map((s) => s.dot);
  // Where a letter's dots sit: clearly above its body, clearly below, or
  // neither (ج keeps its dot inside the bowl, so it never plays "where").
  const sideOf = (c) => {
    const d = dotsOf(c);
    if (!d.length) return null;
    if (d.every(([, y]) => y < 36)) return "above";
    if (d.every(([, y]) => y > 78)) return "below";
    return null;
  };
  const whereChars = (planned) => {
    const ups = planned.filter(c => sideOf(c) === "above"), downs = planned.filter(c => sideOf(c) === "below");
    return ups.length && downs.length ? [shuffle(ups)[0], shuffle(downs)[0]] : [];
  };
  let uid = 0;

  class Base {
    constructor(ctx, cls, label) {
      this.ctx = ctx; this.alive = true; this.timers = [];
      ctx.stage.innerHTML = `<div class="tb ${cls}" role="group" aria-label="${label}"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
    }
    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); return t; }
    dots(n, at) { return `<div class="tb-progress" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < at ? "is-done" : i === at ? "is-on" : ""}"></i>`).join("")}</div>`; }
    still() { return !!this.ctx.reducedMotion?.(); }
    wobble(el) { if (!this.still()) el?.animate?.([{ opacity: 1 }, { opacity: .84 }, { opacity: 1 }], { duration: 360 }); }
    cheer(el) { this.ctx.correct?.(); this.ctx.confettiAt?.(el); this.ctx.pet?.cheer?.(); }
    say(it) {
      try {
        const result = this.ctx.say?.(it);
        return result?.then ? result.catch(() => false) : result;
      } catch { return false; }
    }
    report(target, chosen, offered, { skill = "letter-name", listening = false, affects = true } = {}) {
      const correct = chosen === target;
      const independent = listening && !this.missed && this.heard !== false;
      const targetItem = realItem(this.ctx, target);
      this.ctx.reportOutcome?.({ item: targetItem, itemId: targetItem.id, activity: this.constructor.name, skill, correct,
        evidence: independent ? "independent_listening" : "supported_visible_matching", assisted: !!this.missed,
        selectedId: realItem(this.ctx, chosen).id, choiceIds: offered.map(c => realItem(this.ctx, c).id), affectsStrength: affects });
      return correct;
    }
    // A game that is played, not answered: one honest participation record.
    played(c, skill = "friend") {
      const target = realItem(this.ctx, c);
      this.ctx.beginRound?.(target, skill);
      this.ctx.reportOutcome?.({ item: target, itemId: target.id, activity: this.constructor.name, skill, correct: true,
        evidence: "supported_visible_matching", assisted: !!this.missed, affectsStrength: false });
    }
    // Free motor play is recorded without a right/wrong verdict or answer skill.
    participated(c, skill) {
      const target = realItem(this.ctx, c);
      this.ctx.beginRound?.(target, skill);
      this.ctx.reportOutcome?.({ item: target, itemId: target.id, activity: this.constructor.name, skill,
        evidence: "motor_assembly_participation", affectsStrength: false });
    }
    finish(ms = 800) { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), ms); }
    unavailable() { this.busy = true; this.later(() => this.ctx.cancel?.(), 300); }
    replayPrompt() {}
    destroy() { this.alive = false; this.timers.forEach(clearTimeout); this.dragResets?.forEach((reset) => reset()); this.dragResets = []; }
  }

  // ---------- v42 Friend Pairs ----------
  const CARD_BACK_FALLBACK = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 18Q78 30 74 62Q62 84 50 86Q38 84 26 62Q22 30 50 18Z" fill="#7fce54" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M50 26V82M50 46L64 38M50 58L36 50M50 70L62 64" fill="none" stroke="#2f5c46" stroke-width="3" stroke-linecap="round"/></svg>`;

  class FriendPairs extends Base {
    constructor(ctx) {
      super(ctx, "tb-pairs", "Friend pairs");
      this.noReplay = true;
      const known = knownChars(ctx);
      this.itemsByChar = new Map(knownItems(ctx).map(i => [i.display, i]));
      this.pool = practiceOrder(ctx, known, "matching-memory", known.length);
      this.level = practiceLevel(ctx, this.pool, "matching-memory");
      const evidence = this.pool.map(c => strengthOf(ctx)?.skillProfile?.(this.itemsByChar.get(c)?.id, "matching-memory")?.matching?.sessions || []);
      this.visitCount = evidence.length ? Math.min(...evidence.map(s => new Set(s.filter(Boolean)).size)) : 0;
      this.pairCount = pairsAt(this.level, this.visitCount);
      this.boards = this.level >= 2 ? 2 : 1; this.board = 0;
      if (this.pool.length < 2) { this.unavailable(); return; }
      this.playMode='memory';
      if(ctx.choosePairMode)this.choosePlayMode();else this.deal();
    }
    choosePlayMode() {
      this.playMode = null; this.busy = true;
      const chars=this.pool.slice(0,2), back=ns.ToyStudioArt?.pairLeaf?.()||CARD_BACK_FALLBACK;
      const tile=(c,face)=>`<span class="tb-mode-tile is-${face}">${face==='back'?back:F().art(c,{size:76,mode:face==='friend'?'full':'plain'})}</span>`;
      this.root.innerHTML=`<div class="tb-pair-modes" role="group" aria-label="Choose how to play with your friends"><button type="button" class="tb-pair-mode" data-mode="match" aria-label="Match visible letters to their friends"><span class="tb-mode-sample is-match" aria-hidden="true">${chars.map(c=>tile(c,'friend')).join('')}<span class="tb-mode-arrow">${ns.LettersArt.icon('next',30)}</span>${chars.map(c=>tile(c,'letter')).join('')}</span></button><button type="button" class="tb-pair-mode" data-mode="memory" aria-label="Play hide-and-seek pairs"><span class="tb-mode-sample is-memory" aria-hidden="true">${tile(chars[0],'friend')}${tile(chars[1],'back')}${tile(chars[0],'back')}${tile(chars[1],'letter')}</span></button></div>`;
      this.root.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{
        if(!this.alive||this.playMode||!inRoot(this.root,button))return;
        this.playMode=button.dataset.mode;this.deal();
      });
    }
    dealVisible(chars, token) {
      this.matchChars=chars;this.matched=new Set();this.matchMisses=new Set();this.selected=null;this.busy=false;
      const letters=shuffle(chars), cols=chars.length>3?2:chars.length;
      this.root.innerHTML=`<div class="tb-visible-pairs" data-pairs="${chars.length}" style="--pair-cols:${cols}" role="group" aria-label="Bring each letter to its friend"><div class="tb-pair-homes" role="group" aria-label="Friends waiting for their letters">${chars.map((c,i)=>`<button type="button" class="tb-pair-home" data-home="${i}" aria-label="Give a letter to ${F().get(c).en}"><span class="tb-pair-friend" aria-hidden="true">${F().art(c,{size:126})}</span><span class="tb-pair-slot" aria-hidden="true"></span></button>`).join('')}</div><div class="tb-pair-direction" aria-hidden="true">${ns.LettersArt.icon('next',30)}</div><div class="tb-pair-letters" role="group" aria-label="Letter pieces">${letters.map(c=>`<button type="button" class="tb-pair-letter" data-letter="${chars.indexOf(c)}" aria-label="Pick up ${c}" aria-pressed="false">${F().art(c,{size:84,mode:'plain'})}</button>`).join('')}</div></div>${this.dots(this.boards,this.board)}<button type="button" class="tb-pair-next" hidden aria-label="${this.board+1<this.boards?'Match more friends':'Finish matching friends'}">${ns.LettersArt.icon('next',38)}</button>`;
      this.boardRoot=this.root.querySelector('.tb-visible-pairs');
      const homes=[...this.root.querySelectorAll('.tb-pair-home')];
      homes.forEach(home=>home.onclick=()=>{
        if(!this.alive||this.busy||token!==this.boardToken||home.disabled||!inRoot(this.root,home))return;
        if(this.selected!==null)this.placeVisible(this.selected,Number(home.dataset.home),token);
        else {this.say(F().item(chars[Number(home.dataset.home)]));this.wobble(home);}
      });
      this.dragResets=[];
      this.root.querySelectorAll('.tb-pair-letter').forEach(letter=>{
        const i=Number(letter.dataset.letter),active=()=>this.alive&&!this.busy&&token===this.boardToken&&!letter.disabled&&inRoot(this.root,letter);
        letter.onclick=()=>{if(active())this.selectVisible(this.selected===i?null:i,token);};
        this.dragResets.push(ns.GardenPractice.draggable(letter,{
          enabled:active,onDragStart:()=>this.selectVisible(i,token),
          drop:(x,y)=>{const home=homes.find(h=>!h.disabled&&ns.GardenPractice.inside(h,x,y));return home?this.placeVisible(i,Number(home.dataset.home),token):false;},
        }));
      });
      const next=this.root.querySelector('.tb-pair-next');
      next.onclick=()=>{if(!this.alive||this.busy||token!==this.boardToken||this.matched.size!==chars.length||!inRoot(this.root,next))return;this.busy=true;next.disabled=true;this.board++;this.deal();};
    }
    selectVisible(index, token=this.boardToken) {
      if(!this.alive||this.busy||token!==this.boardToken||!inRoot(this.root,this.boardRoot)||index!==null&&(!Number.isInteger(index)||!this.matchChars[index]||this.matched.has(index)))return false;
      this.selected=index;
      this.root.querySelectorAll('.tb-pair-letter').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.letter)===index)));
      this.root.querySelectorAll('.tb-pair-home').forEach(el=>el.classList.toggle('is-ready',index!==null&&!el.disabled));
      if(index!==null)this.say(item(this.matchChars[index]));
      return true;
    }
    placeVisible(from, to, token=this.boardToken) {
      if(!this.alive||this.busy||token!==this.boardToken||!inRoot(this.root,this.boardRoot)||![from,to].every(i=>Number.isInteger(i)&&this.matchChars[i]&&!this.matched.has(i)))return false;
      const c=this.matchChars[from],target=realItem(this.ctx,c),correct=from===to;
      this.ctx.beginRound?.(target,'letter-form');
      this.ctx.reportOutcome?.({item:target,itemId:target.id,activity:'FriendPairs',skill:'letter-form',correct,evidence:'supported_visible_matching',assisted:this.matchMisses.has(from),affectsStrength:false,selectedId:realItem(this.ctx,this.matchChars[to]).id,choiceIds:this.matchChars.map(char=>realItem(this.ctx,char).id)});
      const home=this.root.querySelector(`.tb-pair-home[data-home="${to}"]`);
      this.selectVisible(null,token);
      if(!correct){this.matchMisses.add(from);this.ctx.sfx?.('turn');this.wobble(home);return false;}
      this.matched.add(from);this.busy=true;
      const letter=this.root.querySelector(`.tb-pair-letter[data-letter="${from}"]`);
      letter.disabled=true;letter.classList.add('is-placed');home.disabled=true;home.classList.add('is-paired');
      home.querySelector('.tb-pair-slot').innerHTML=F().art(c,{size:56,mode:'plain'});
      this.cheer(home);this.ctx.sfx?.(F().get(c).call);
      this.later(()=>{
        if(token!==this.boardToken||!inRoot(this.root,this.boardRoot))return;
        this.busy=false;
        if(this.matched.size===this.matchChars.length){this.boardRoot.classList.add('is-complete');const next=this.root.querySelector('.tb-pair-next');next.hidden=false;next.focus?.({preventScroll:true});}
        else this.root.querySelector('.tb-pair-letter:not(:disabled)')?.focus?.({preventScroll:true});
      },this.still()?120:480);
      return true;
    }
    deal() {
      this.dragResets?.forEach(reset=>reset());this.dragResets=[];
      if (this.board >= this.boards) return this.finish();
      const boardToken = this.boardToken = (this.boardToken || 0) + 1;
      const n = Math.min(this.pairCount, this.pool.length);
      // The second board turns the pool on, so it brings new friends.
      const start = (this.board * 3) % this.pool.length;
      const chars = Array.from({ length: n }, (_, i) => this.pool[(start + i) % this.pool.length]);
      if(this.playMode==='match')return this.dealVisible(chars,boardToken);
      this.cards = shuffle(chars.flatMap((c) => [{ c, face: "friend" }, { c, face: "letter" }]));
      this.open = []; this.pairs = 0; this.missed = false;
      const cols = this.cards.length <= 4 ? 2 : this.cards.length <= 6 ? 3 : 4;
      const cardBack = ns.ToyStudioArt?.pairLeaf?.() || CARD_BACK_FALLBACK;
      this.root.innerHTML = `<div class="tb-cards" style="--cols:${cols}">${this.cards.map((k, i) => `<button type="button" class="tb-card" data-i="${i}" aria-label="A card, face down"><span class="tb-card-back" aria-hidden="true">${cardBack}</span><span class="tb-card-face is-${k.face}" aria-hidden="true">${F().art(k.c, { size: 96, mode: k.face === "friend" ? "full" : "plain" })}</span></button>`).join("")}</div>${this.dots(this.boards, this.board)}`;
      this.boardRoot = this.root.querySelector(".tb-cards");
      this.root.querySelectorAll(".tb-card").forEach((b) => b.addEventListener("click", () => this.flip(Number(b.dataset.i), b, boardToken)));
      // A peek first: every card shows itself, then turns over.
      this.busy = true;
      this.later(() => { if (this.boardToken === boardToken && inRoot(this.root, this.boardRoot)) this.showAll(true); }, 300);
      this.later(() => { if (this.boardToken !== boardToken || !inRoot(this.root, this.boardRoot)) return; this.showAll(false); this.busy = false; }, this.level === 0 ? 2800 : 2100);
    }
    showAll(up) {
      this.root.querySelectorAll(".tb-card:not(.is-matched)").forEach((b) => {
        b.classList.toggle("is-up", up);
        const card = this.cards[Number(b.dataset.i)];
        b.setAttribute("aria-label", up && card ? (card.face === "friend" ? F().get(card.c).en : card.c) : "A card, face down");
      });
    }
    card(i) { return this.root.querySelector(`.tb-card[data-i="${i}"]`); }
    flip(i, b, token = this.boardToken) {
      if (!this.alive || token !== this.boardToken || !Number.isInteger(i) || i < 0 || i >= this.cards.length || this.card(i) !== b || !inRoot(this.root, b) || this.busy || b.disabled || b.classList.contains("is-up")) return false;
      const k = this.cards[i];
      b.classList.add("is-up");
      b.setAttribute("aria-label", k.face === "friend" ? F().get(k.c).en : k.c);
      this.ctx.sfx?.("turn");
      // Every card says who it is: a friend its name, a letter its name.
      this.say(k.face === "friend" ? F().item(k.c) : item(k.c));
      this.open.push(i);
      if (this.open.length < 2) return;
      const [a, z] = this.open; this.open = [];
      const A = this.cards[a], Z = this.cards[z];
      this.busy = true;
      if (A.c === Z.c) {
        this.later(() => {
          if (token !== this.boardToken || !inRoot(this.root, this.boardRoot)) return;
          [a, z].forEach((j) => { const card = this.card(j); if (card) { card.classList.add("is-matched"); card.disabled = true; card.setAttribute("aria-label", "Matched pair"); } });
          this.cheer(this.card(z));
          this.ctx.sfx?.(F().get(A.c).call);
          this.played(A.c, "matching-memory");
        }, 450);
        this.pairs += 1;
        this.later(() => { if (token !== this.boardToken || !inRoot(this.root, this.boardRoot)) return; this.busy = false; if (this.pairs * 2 >= this.cards.length) this.cleared(token); }, 1300);
        return;
      }
      this.missed = true;
      // A mismatch is how memory is played, not a mistake: no "hm?", the
      // cards just turn back with a page-flip.
      // Encouragement pass (v57): after three mismatches the cards peek again,
      // so memory never turns into guessing until a child gives up.
      this.mismatches = (this.mismatches || 0) + 1;
      const peek = this.mismatches >= 3;
      if (peek) this.mismatches = 0;
      this.later(() => {
        if (token !== this.boardToken || !inRoot(this.root, this.boardRoot)) return;
        [a, z].forEach((j) => { const el = this.card(j); el?.classList.remove("is-up"); el?.setAttribute("aria-label", "A card, face down"); });
        this.ctx.sfx?.("turn");
        if (!peek) { this.busy = false; return; }
        this.later(() => { if (token === this.boardToken && inRoot(this.root, this.boardRoot)) this.showAll(true); }, 250);
        this.later(() => { if (token === this.boardToken && inRoot(this.root, this.boardRoot)) { this.showAll(false); this.busy = false; } }, 1900);
      }, 1400);
    }
    cleared(token = this.boardToken) {
      if (token !== this.boardToken || !inRoot(this.root, this.boardRoot)) return;
      this.busy = true;
      this.root.querySelector(".tb-cards")?.classList.add("is-cleared");
      this.ctx.sfx?.("chime");
      this.board += 1;
      this.later(() => { if (token === this.boardToken) this.deal(); }, 1700);
    }
  }

  // ---------- v43 Dot Nests ----------
  // A nest holding n dots (round, ink-dark, like a letter's own dots).
  const NEST_FALLBACK = (n) => {
    const at = { 0: [], 1: [[50, 30]], 2: [[37, 32], [63, 32]], 3: [[33, 34], [67, 34], [50, 21]] }[n] || [];
    const feather = n ? "" : `<path d="M44 44Q52 26 64 30Q56 40 44 44Z" fill="#ffa798" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
    return `<svg viewBox="0 0 100 70" aria-hidden="true">${feather}${at.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9.5" fill="${INK}"/><circle cx="${x - 3}" cy="${y - 3}" r="2.4" fill="#a89478"/>`).join("")}<path d="M10 44Q50 40 90 44Q86 66 50 66Q14 66 10 44Z" fill="#c69434" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M18 50Q50 56 82 50M24 58Q50 62 76 58" fill="none" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/></svg>`;
  };
  const TREE_FALLBACK = `<svg class="tb-tree" viewBox="0 0 300 220" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><path d="M138 220V96Q150 70 168 92V220Z" fill="#c69434" stroke="${INK}" stroke-width="3"/><path d="M160 110Q200 92 236 96" fill="none" stroke="#c69434" stroke-width="8" stroke-linecap="round"/>${[[150, 50, 56], [100, 70, 40], [204, 64, 44], [150, 18, 34]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#7fce54"/>`).join("")}<path d="M0 206Q150 192 300 206V220H0Z" fill="#b7e779"/></svg>`;

  class DotNests extends Base {
    constructor(ctx) {
      super(ctx, "tb-nests", "Dot nests");
      this.noReplay = true;
      const known = knownChars(ctx);
      const counts = new Set(known.map((c) => dotsOf(c).length));
      if (counts.size < 2) { this.unavailable(); return; }
      this.level = practiceLevel(ctx, known, "letter-form");
      this.choiceCeiling = this.level > 0 ? 3 : 2;
      const order = practiceOrder(ctx, known, "letter-form", known.length);
      if (!order.length) { this.unavailable(); return; }
      // Make sure a dotless letter and a dotted one both visit.
      const pick = order.slice(0, this.level === 0 ? 2 : 3);
      if (pick.every((c) => dotsOf(c).length) || pick.every((c) => !dotsOf(c).length)) {
        const other = order.find((c) => !!dotsOf(c).length !== !!dotsOf(pick[0]).length);
        if (other) pick[pick.length - 1] = other;
      }
      const evidenceVisits = known.map(c => {
        const i = realItem(ctx, c), profile = strengthOf(ctx)?.skillProfile?.(i.id, "letter-form") || {};
        return new Set((profile.matching?.sessions || []).filter(Boolean)).size;
      });
      const laterWhere = whereChars(order);
      // The where-game is a whole later visit, never a surprise mode change mid-session.
      this.visitMode = this.level >= 2 && evidenceVisits.length && Math.min(...evidenceVisits) >= 4 && laterWhere.length ? "where" : "count";
      const visitChars = this.visitMode === "where" ? laterWhere : shuffle(pick);
      this.queue = visitChars.map((c) => ({ c, mode: this.visitMode }));
      this.round = 0;
      this.dragResets = [];
      this.root.addEventListener?.('pointerdown', () => this.clearNestHelp());
      this.root.addEventListener?.('keydown', () => this.clearNestHelp());
      this.next();
    }
    next() {
      this.actionCue?.destroy(); this.actionCue = null;
      this.clearNestHelp();
      if (this.round >= this.queue.length) return this.finish();
      const q = this.queue[this.round];
      const token = this.roundToken = (this.roundToken || 0) + 1;
      this.q = q; this.missed = false; this.busy = false;
      const want = q.mode === "count" ? dotsOf(q.c).length : sideOf(q.c);
      this.want = want;
      if (q.mode === "count") {
        const count = Math.min(this.choiceCeiling, profileChoices(practiceProfile(this.ctx, q.c, "letter-form"), this.choiceCeiling));
        const possible = [...new Set(knownChars(this.ctx).map(c => dotsOf(c).length))];
        const others = shuffle(possible.filter(n => n !== want)).slice(0, count - 1);
        this.offered = [want, ...others].sort((x, y) => x - y);
      } else this.offered = ["above", "below"];
      const letter = `<span class="tb-letter" aria-label="${q.c}">${F().art(q.c, { size: 150, mode: "plain" })}</span>`;
      const tree = ns.ToyStudioArt?.dotTree?.() || TREE_FALLBACK;
      this.root.innerHTML = q.mode === "count"
        ? `<div class="tb-branch"><span class="ts-perch-art" aria-hidden="true">${ns.ToyStudioArt?.countPerch?.() || ""}</span>${letter}</div>
           <div class="tb-nest-row">${this.offered.map((n, i) => `<button type="button" class="tb-nest" data-i="${i}" aria-label="A nest with ${n} dots">${ns.ToyStudioArt?.nest?.(n) || NEST_FALLBACK(n)}</button>`).join("")}</div>
           ${this.dots(this.queue.length, this.round)}`
        : `<div class="tb-where">${tree}
             <button type="button" class="tb-nest is-high" data-i="0" aria-label="The nest up in the tree">${ns.ToyStudioArt?.nest?.(0) || NEST_FALLBACK(0)}</button>
             <button type="button" class="tb-nest is-low" data-i="1" aria-label="The nest down on the ground">${ns.ToyStudioArt?.nest?.(0) || NEST_FALLBACK(0)}</button>
             ${letter}</div>
           ${this.dots(this.queue.length, this.round)}`;
      this.currentNodes = this.root.querySelectorAll(".tb-nest");
      this.currentNodes.forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b, token)));
      const source = this.root.querySelector(".tb-letter");
      source?.querySelectorAll('.lf-fill-dot').forEach((dot, i) => dot.style.setProperty('--dot-step', i));
      this.actionCue = this.ctx.setupActionCue?.({ source, destination: this.currentNodes[this.offered.indexOf(want)],
        destinationY: .65, type: 'drag', automatic: this.ctx.firstVisit === true && this.level === 0 && this.round === 0,
        onShow: () => { if (token === this.roundToken) this.explainNest(); },
      });
      const reset = ns.GardenPractice?.draggable?.(source, {
        enabled: () => this.alive && !this.busy && token === this.roundToken && inRoot(this.root, source),
        onDragMove: (x, y) => this.showReceivingNest(this.receivingNest(x, y, token)),
        onDragEnd: () => this.showReceivingNest(null),
        drop: (x, y) => { const receiver = this.receivingNest(x, y, token); return receiver ? this.pick(Number(receiver.dataset.i), receiver, token, true) : false; },
      });
      if (reset) this.dragResets.push(reset);
      this.ctx.beginRound?.(realItem(this.ctx, q.c), "letter-form");
      this.later(() => { if (token === this.roundToken && inRoot(this.root, source)) this.say(realItem(this.ctx, q.c)); }, 300);
    }
    clearNestHelp() {
      this.root?.querySelector?.('.tb-letter')?.classList.remove('is-dot-guide');
      this.currentNodes?.forEach(nest => nest.classList.remove('is-dot-guide'));
    }
    explainNest() {
      if (!this.alive || this.busy) return false;
      this.missed = true;
      this.clearNestHelp();
      const letter = this.root.querySelector?.('.tb-letter');
      // Restart one short comparison; the actual letter dots and corresponding
      // nest dots pulse together. No extra dots, numerals, or synthetic answer.
      if (letter) { void letter.offsetWidth; letter.classList.add('is-dot-guide'); }
      this.currentNodes?.[this.offered.indexOf(this.want)]?.classList.add('is-dot-guide');
      return true;
    }
    receivingNest(x, y, token = this.roundToken) {
      if (!this.alive || this.busy || token !== this.roundToken) return null;
      const nests = [...(this.currentNodes || [])].map(el => ({ el, r: el.getBoundingClientRect?.() })).filter(v => v.r?.width && v.r?.height);
      const inside = nests.filter(({ r }) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
      const candidates = inside.length ? inside : nests.filter(({ r }) => x >= r.left - 28 && x <= r.right + 28 && y >= r.top - 28 && y <= r.bottom + 28);
      return candidates.sort((a, b) => Math.hypot(x - (a.r.left + a.r.width / 2), y - (a.r.top + a.r.height / 2)) - Math.hypot(x - (b.r.left + b.r.width / 2), y - (b.r.top + b.r.height / 2)))[0]?.el || null;
    }
    showReceivingNest(el) { (this.currentNodes || []).forEach(nest => nest.classList.toggle("is-near", nest === el)); }
    pick(i, btn, token = this.roundToken, handledDrop = false) {
      if (!this.alive || token !== this.roundToken || !inRoot(this.root, btn) || this.currentNodes?.[i] !== btn || this.busy || !this.q || !Number.isInteger(i) || i < 0 || i >= (this.offered?.length || 0)) return false;
      this.actionCue?.stop(); this.clearNestHelp();
      const choice = this.offered[i];
      const right = choice === this.want;
      const target = realItem(this.ctx, this.q.c);
      this.ctx.reportOutcome?.({ item: target, itemId: target.id, activity: "DotNests", skill: "letter-form", correct: right,
        evidence: "supported_visible_matching", assisted: !!this.missed,
        selectedId: String(choice), choiceIds: this.offered.map(String), affectsStrength: true });
      if (!right) {
        this.missed = true;
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        this.root.querySelectorAll(".tb-nest").forEach((b, k) => b.classList.toggle("is-hint", this.offered[k] === this.want));
        if (!this.actionCue?.show()) this.explainNest();
        return handledDrop;
      }
      this.busy = true;
      this.actionCue?.destroy(); this.actionCue = null;
      this.clearNestHelp();
      this.dragResets?.forEach(reset => reset()); this.dragResets = [];
      // The letter hops into its nest and its friend pops up to say hello.
      const letter = this.root.querySelector(".tb-letter");
      if (letter && !this.still()) {
        const a = letter.getBoundingClientRect(), z = btn.getBoundingClientRect();
        letter.animate?.([{ transform: "none" }, { transform: `translate(${z.left + z.width / 2 - a.left - a.width / 2}px, ${z.top - a.top - a.height / 2}px) scale(.5)`, opacity: 0.2 }], { duration: 520, easing: "ease-in", fill: "forwards" });
      }
      this.later(() => { if (token !== this.roundToken || !inRoot(this.root, btn)) return; btn.classList.add("is-home"); btn.insertAdjacentHTML("beforeend", `<span class="tb-nest-friend">${F().art(this.q.c, { size: 78 })}</span>`); this.ctx.sfx?.(F().get(this.q.c).call); }, 480);
      this.cheer(btn);
      this.ctx.sfx?.("chick");
      this.round += 1;
      this.later(() => { if (token === this.roundToken) this.next(); }, 2300);
      return true;
    }
    destroy() { this.actionCue?.destroy(); this.clearNestHelp(); super.destroy(); this.dragResets?.forEach(reset => reset()); this.dragResets = []; }
  }

  // ---------- v44 Friend Jigsaw ----------
  // Regions of the friend's -6…106 picture box: halves, or quarters.
  const REGIONS = {
    2: [[-6, -6, 56, 112], [50, -6, 56, 112]],
    3: [[-6, -6, 39, 112], [33, -6, 40, 112], [73, -6, 33, 112]],
    4: [[-6, -6, 56, 56], [50, -6, 56, 56], [-6, 50, 56, 56], [50, 50, 56, 56]],
  };
  class FriendJigsaw extends Base {
    constructor(ctx) {
      super(ctx, "tb-jigsaw", "Friend jigsaw");
      this.noReplay = true;
      this.known = knownChars(ctx);
      this.level = practiceLevel(ctx, this.known, "construction");
      this.order = practiceOrder(ctx, this.known, "construction", this.level === 0 ? 2 : 3);
      this.n = this.level === 0 ? 2 : this.level === 1 ? 3 : 4;
      this.itemsByChar = new Map(knownItems(ctx).map(i => [i.display, i]));
      this.round = 0;
      this.dragResets = [];
      if (!this.order.length) { this.unavailable(); return; }
      this.originalOrder=this.order.slice();
      this.pictureItems=practiceItems(ctx,this.known,'construction',4);
      if(ctx.chooseJigsawPicture&&ns.JigsawPicture)this.choosePictureMode();else this.next();
    }
    choosePictureMode(){
      this.busy=true;this.customPicture=null;this.editor?.destroy();
      this.root.classList.remove('is-picture-puzzle');
      const a=this.pictureItems[0],b=this.pictureItems[1]||null;
      this.root.innerHTML=`<div class="jp-modes" role="group" aria-label="Choose your puzzle"><button type="button" class="jp-mode" data-mode="friend" aria-label="Build a friend puzzle"><span>${this.scene(this.originalOrder[0],180)}</span><span class="jp-cuts" aria-hidden="true"></span></button><button type="button" class="jp-mode" data-mode="make" aria-label="Make your own picture puzzle"><span>${ns.JigsawPicture.picture([a,b],180)}</span><span class="jp-make-icon" aria-hidden="true">${ns.LettersArt.icon('paw',30)}</span></button></div>`;
      this.root.querySelectorAll('.jp-mode').forEach(button=>button.onclick=()=>{if(!this.alive||!this.root.contains(button))return;if(button.dataset.mode==='make')this.editPicture();else{this.order=this.originalOrder.slice();this.round=0;this.next();}});
    }
    editPicture(){
      this.busy=true;this.roundToken=(this.roundToken||0)+1;this.dragResets.forEach(reset=>reset());this.dragResets=[];
      this.root.classList.add('is-picture-puzzle');
      this.editor=new ns.JigsawPicture(this.ctx,this.root,this.pictureItems,this.customPicture||[],layout=>{
        if(!this.alive)return;this.customPicture=layout;this.order=[layout.find(Boolean).display];this.round=0;this.next();
      },()=>{if(this.alive)this.choosePictureMode();});
    }
    pictureComplete(){
      if(!this.customRecorded){this.participated(this.c,'construction');this.customRecorded=true;}
      const token=this.roundToken;
      this.root.querySelector('.tb-tray').innerHTML=`<div class="jp-actions"><button type="button" class="jp-edit" aria-label="Change your puzzle picture">${ns.LettersArt.icon('paw',34)}</button><button type="button" class="jp-done" aria-label="Finish your picture puzzle">${ns.LettersArt.icon('check',38)}</button></div>`;
      const edit=this.root.querySelector('.jp-edit'),done=this.root.querySelector('.jp-done');
      const active=()=>this.alive&&token===this.roundToken&&this.root.contains(done)&&!done.disabled;
      edit.onclick=()=>{if(active())this.editPicture();};
      done.onclick=()=>{if(!active())return;done.disabled=true;edit.disabled=true;this.finish(0);};
      done.focus?.({preventScroll:true});
    }
    // The friend on a little sky-and-grass picture, so every piece — even a
    // corner of slim alif — carries something to match by.
    scene(c, size) {
      if(this.customPicture)return ns.JigsawPicture.picture(this.customPicture,size);
      const sky = `<g class="tb-scene"><path d="M-6 -6H106V106H-6Z" fill="#ccfbef"/><path d="M-6 78Q24 68 50 76T106 72V106H-6Z" fill="#b7e779"/><path d="M-6 90Q40 82 106 92V106H-6Z" fill="#7fce54"/><circle cx="88" cy="10" r="10" fill="#f3c955"/><path d="M4 18q6-6 12 0q6-4 10 2H4Z" fill="#fffdf7"/>${[[14, 96], [66, 98], [92, 88]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#ffa798"/>`).join("")}</g>`;
      return F().art(c, { size }).replace(/(<svg[^>]*>)/, `$1${sky}`);
    }
    piece(c, r, size) {
      const [x, y, w, h] = REGIONS[this.n][r];
      return this.scene(c, size).replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${w} ${h}"`).replace(/width="\d+" height="\d+"/, `width="${Math.round((size * w) / 112)}" height="${Math.round((size * h) / 112)}"`);
    }
    next() {
      if (this.round >= this.order.length) return this.finish();
      const token = this.roundToken = (this.roundToken || 0) + 1;
      const c = this.order[this.round];
      this.c = c; this.missed = false; this.busy = false;
      this.todo = shuffle(Array.from({ length: this.n }, (_, i) => i));
      this.root.innerHTML = `
        <div class="ts-puzzle"><span class="ts-puzzle-art" aria-hidden="true">${ns.ToyStudioArt?.puzzleFrame?.() || ""}</span><div class="tb-board is-${this.n}"><span class="tb-ghost">${this.customPicture?this.scene(c,240):F().art(c, { size: 240, mode: "plain" })}</span>
          ${REGIONS[this.n].map((_, r) => `<span class="tb-slot" data-r="${r}"></span>`).join("")}</div></div>
        <div class="tb-tray"></div>
        ${this.dots(this.order.length, this.round)}`;
      this.roundRoot = this.root.querySelector(".ts-puzzle");
      this.ask();
    }
    ask() {
      const slot = this.todo[0];
      const stepToken = this.stepToken = (this.stepToken || 0) + 1;
      this.root.querySelectorAll(".tb-slot").forEach((s) => s.classList.toggle("is-wanted", Number(s.dataset.r) === slot));
      this.dragResets.forEach((reset) => reset()); this.dragResets = [];
      this.root.querySelector(`.tb-slot[data-r="${slot}"]`)?.classList.add("is-next");
      // Keep the puzzle a pure matching task while the number of pieces grows.
      const pieces = this.todo.map((r) => ({ c: this.c, r }));
      this.pieces = shuffle(pieces);
      const size = this.n === 2 ? 170 : 200;
      this.root.querySelector(".tb-tray").innerHTML = this.pieces.map((p, i) => `<button type="button" class="tb-piece" data-i="${i}" aria-label="A puzzle piece">${this.piece(p.c, p.r, size)}</button>`).join("");
      this.root.querySelectorAll(".tb-piece").forEach((b) => {
        const piece = this.pieces[Number(b.dataset.i)];
        b.addEventListener("click", () => this.pick(Number(b.dataset.i), b, stepToken));
        const reset = ns.GardenPractice?.draggable?.(b, {
          enabled: () => this.alive && !this.busy && stepToken === this.stepToken && this.todo?.includes(piece.r) && this.root?.contains?.(b),
          onDragMove: (x, y) => this.showReceivingSlot(this.receivingSlot(x, y, piece.r, stepToken)),
          onDragEnd: () => this.showReceivingSlot(null),
          drop: (x, y) => this.receivingSlot(x, y, piece.r, stepToken) ? this.pick(Number(b.dataset.i), b, stepToken) : false,
        });
        if (reset) this.dragResets.push(reset);
      });
    }
    receivingSlot(x, y, slot = this.todo?.[0], token = this.stepToken) {
      if (!this.alive || this.busy || token !== this.stepToken || slot == null || !this.todo?.includes(slot)) return null;
      const el = this.root.querySelector(`.tb-slot[data-r="${slot}"]`), r = el?.getBoundingClientRect?.();
      return r?.width && r?.height && x >= r.left - 28 && x <= r.right + 28 && y >= r.top - 28 && y <= r.bottom + 28 ? el : null;
    }
    showReceivingSlot(el) { this.root.querySelectorAll(".tb-slot").forEach((slot) => slot.classList.toggle("is-near", slot === el)); }
    pick(i, btn, token = this.stepToken) {
      if (!this.alive || token !== this.stepToken || !Number.isInteger(i) || i < 0 || i >= (this.pieces?.length || 0) || this.root.querySelectorAll(".tb-piece")[i] !== btn || !inRoot(this.root, btn) || this.busy || !this.todo?.length) return false;
      const p = this.pieces?.[i];
      if (!p || !this.todo.includes(p.r)) return false;
      // The lit gap suggests a starting place, not a compulsory order. A
      // physical puzzle accepts any piece in its own still-empty space.
      const slot = p.r;
      if (p.c !== this.c) {
        this.missed = true;
        this.wobble(btn);
        this.say(F().item(p.c)); // "that's someone else"
        // Encouragement pass (v57): the piece that fits glows.
        this.root.querySelectorAll(".tb-piece").forEach((b, k) => b.classList.toggle("is-hint", this.pieces[k].c === this.c && this.todo.includes(this.pieces[k].r)));
        this.ctx.sfx?.("softwrong");
        return false;
      }
      this.ctx.sfx?.("click");
      this.dragResets.forEach((reset) => reset()); this.dragResets = [];
      const el = this.root.querySelector(`.tb-slot[data-r="${slot}"]`);
      el.classList.remove("is-wanted", "is-next", "is-near"); el.classList.add("is-placed");
      el.innerHTML = this.piece(this.c, slot, 240);
      this.todo.splice(this.todo.indexOf(slot), 1);
      if (this.todo.length) { this.ask(); return true; }
      // Whole again: the friend comes alive and says hello.
      this.busy = true;
      this.root.querySelector(".tb-tray").innerHTML = "";
      const board = this.root.querySelector(".tb-board");
      board.classList.add("is-whole");
      board.insertAdjacentHTML("beforeend", `<span class="tb-whole">${this.scene(this.c, 240)}</span>`);
      this.cheer(board);
      if(this.customPicture){this.pictureComplete();return true;}
      this.participated(this.c, "construction");
      const completionRound = this.roundToken, completionRoot = this.roundRoot, completedChar = this.c;
      this.later(() => { if (completionRound === this.roundToken && inRoot(this.root, completionRoot)) this.ctx.sfx?.(F().get(completedChar).call); }, 300);
      this.later(() => { if (completionRound === this.roundToken && inRoot(this.root, completionRoot)) this.say(F().item(completedChar)); }, 800);
      this.later(() => { if (completionRound === this.roundToken && inRoot(this.root, completionRoot)) this.say(realItem(this.ctx, completedChar)); }, 2000);
      this.round += 1;
      this.later(() => { if (completionRound === this.roundToken && inRoot(this.root, completionRoot)) this.next(); }, 3400);
      return true;
    }
    destroy() { super.destroy(); this.editor?.destroy(); this.dragResets.forEach((reset) => reset()); this.dragResets = []; }
  }

  // ---------- v45 Bath Time ----------
  // 2026-10-18 (construction detail): a clawfoot tub — a rolled rim, side
  // panel lines, a tap with two handles and a spout, ball-and-claw feet, and
  // a shine. Same footprint, so the bubbles and the friend still fit.
  const TUB = `<g transform="translate(100 82)"><rect x="-4" y="-2" width="8" height="14" rx="3" fill="#c9bda4" stroke="${INK}" stroke-width="2.4"/><path d="M0 0Q0 -12 -12 -12H-16" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M0 0Q0 -12 -12 -12H-16" fill="none" stroke="#c9bda4" stroke-width="3" stroke-linecap="round"/><circle cx="-7" cy="-2" r="3.5" fill="#ee806f" stroke="${INK}" stroke-width="1.6"/><circle cx="7" cy="-2" r="3.5" fill="#62cdf4" stroke="${INK}" stroke-width="1.6"/></g>
    <path d="M-4 98H104Q102 120 84 122H16Q-2 120 -4 98Z" fill="#96ecff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M8 106Q50 112 92 106" fill="none" stroke="#62cdf4" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="14" cy="108" rx="5" ry="2.4" fill="#fffdf7" opacity=".6"/>
    <rect x="-10" y="92" width="120" height="8" rx="4" fill="#fffdf7" stroke="${INK}" stroke-width="3"/>
    ${[[12, 122], [88, 122]].map(([x, y]) => `<path d="M${x} ${y}L${x + (x < 50 ? -4 : 4)} ${y + 6}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><circle cx="${x + (x < 50 ? -5 : 5)}" cy="${y + 8}" r="3.5" fill="#f3c955" stroke="${INK}" stroke-width="1.6"/>`).join("")}`;
  class BathTime extends Base {
    constructor(ctx) {
      super(ctx, "tb-bath", "Bath time");
      this.known = knownChars(ctx);
      this.level = practiceLevel(ctx, this.known, "friend");
      this.order = practiceOrder(ctx, this.known, "friend", this.level === 0 ? 2 : 3);
      this.ask = this.level >= 1 && this.known.length >= 2;
      this.round = 0;
      if (!this.order.length) { this.unavailable(); return; }
      this.next();
    }
    next() {
      this.endScrub();
      if (this.round >= this.order.length) return this.finish();
      const token=this.roundToken=(this.roundToken||0)+1;
      const c = this.order[this.round];
      this.c = c; this.missed = false; this.busy = false; this.clean = false; this.answered = !this.ask;
      this.guessing=false;this.offered=[];this.referenceShown=false;this.completionReady=false;this.tool=this.tool||'sponge';
      this.root.classList.remove('is-washed');
      // Bubbles (2026-10-13; was mud): overlapping suds on a grid over the
      // friend's picture box. Brown mud read as dirty — even as something
      // worse — at a glance; a tub of foam is the fun of bath time.
      // The class names stay "mud" so the scrub logic is unchanged.
      const blobs = [];
      // v58: a rounded cloud of mud, not a square block — a square read as a
      // brown wall in the tub. The oval still covers every friend's shape (the
      // picture box's corners are empty); dark spots are scattered at random,
      // because a fixed every-fifth pattern lined up into stripes.
      for (let row = 0; row < 7; row += 1) for (let col = 0; col < 7; col += 1) {
        const y = 2 + row * 15, x = col * 16 + (row % 2) * 7;
        if (x < 4 || x > 96) continue;
        if (((x - 50) / 56) ** 2 + ((y - 51) / 56) ** 2 > 1) continue;
        blobs.push([x + Math.random() * 6 - 3, y + Math.random() * 6 - 3, 10 + Math.random() ** 2 * 4, FOAM[Math.floor(Math.random() * FOAM.length)]]);
      }
      // v257: bubble sizes vary more (mostly small, a few big — the minimum is unchanged so the friend stays covered), so the foam reads as foam, not a grid.
      this.total = blobs.length;
      const friend = F().art(c, { size: 112 }).replace(/^<svg/, '<svg x="-6" y="-6"');
      this.root.innerHTML = `
        <div class="tb-bath-room">${ns.WatersideArt?.bathBackdrop?.() || ""}<span class="tb-bath-plant" aria-hidden="true">${ns.WatersideArt?.bathPlant?.() || ""}</span><span class="tb-bath-towels" aria-hidden="true">${ns.WatersideArt?.bathTowels?.() || ""}</span><div class="tb-tub-wrap"><svg class="tb-tub" viewBox="-12 -12 124 144" aria-label="A friend hiding in the bubbles">
          <g class="tb-bath-friend">${friend}</g>
          <g class="tb-mud">${blobs.map(([x, y, r, tint]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${tint}" stroke="#96ecff" stroke-width="1.6"/>`).join("")}</g>
          <g class="tb-foam-shine" aria-hidden="true">${blobs.filter((b, k) => k % 3 === 0).map(([x, y, r]) => `<path data-at="${x.toFixed(1)},${y.toFixed(1)}" d="M${(x - r * 0.5).toFixed(1)} ${(y - r * 0.15).toFixed(1)}Q${(x - r * 0.45).toFixed(1)} ${(y - r * 0.55).toFixed(1)} ${(x - r * 0.05).toFixed(1)} ${(y - r * 0.6).toFixed(1)}" fill="none" stroke="#fffdf7" stroke-width="1.6" stroke-linecap="round"/>`).join("")}</g>
          ${TUB}<g class="tb-bubbles"></g>
        </svg><span class="tb-sponge-cursor" aria-hidden="true">${ns.WatersideArt?.sponge?.() || SPONGE}</span></div><div class="tb-wash-meter" aria-hidden="true">${[0,1,2].map(() => '<i></i>').join('')}</div></div>
        <div class="tb-bath-tools"><div class="tb-wash-tools"><button type="button" class="tb-sponge" data-tool="sponge" aria-label="Scrub" aria-pressed="${this.tool==='sponge'}">${ns.WatersideArt?.sponge?.() || SPONGE}</button><button type="button" class="tb-rinse" data-tool="rinse" aria-label="Rinse" aria-pressed="${this.tool==='rinse'}">${ns.WatersideArt?.shower?.() || ''}</button></div><div class="tb-guess" hidden></div><button type="button" class="tb-bath-next" aria-label="${this.round===this.order.length-1?'Finish bath time':'Next bath friend'}" hidden>${ns.LettersArt.icon(this.round===this.order.length-1?'check':'next',36)}</button></div>
        ${this.dots(this.order.length, this.round)}`;
      this.svg = this.root.querySelector(".tb-tub");
      this.mud = this.root.querySelector(".tb-mud");
      this.bubbles = this.root.querySelector(".tb-bubbles");
      this.cursor = this.root.querySelector(".tb-sponge-cursor");
      this.root.querySelector('.tb-bath-room').insertAdjacentHTML('beforeend',`<span class="tb-bath-reference" role="img" aria-label="The matching letter: ${c}" hidden>${F().art(c,{size:70,mode:'plain'})}</span>`);
      this.updateTool();
      this.wireScrub();
      // The sponge button scrubs a patch too — for a keyboard, a switch, or a
      // child who prefers tapping.
      this.root.querySelectorAll('[data-tool]').forEach(button=>button.addEventListener('click',()=>{if(this.alive&&token===this.roundToken&&inRoot(this.root,button))this.useTool(button.dataset.tool);}));
      this.root.querySelector('.tb-bath-next').onclick=()=>this.continueBath(token);
      this.ctx.beginRound?.(realItem(this.ctx, c), this.ask ? "friend" : "scrubbing");
      this.ctx.sfx?.("splash");
    }
    wireScrub() {
      const svg = this.svg;
      const token=this.roundToken,active=()=>this.alive&&svg===this.svg&&token===this.roundToken;
      svg.addEventListener("pointerdown", (e) => {
        if (!active() || this.clean || this.scrubPointer != null || e.button > 0 || e.isPrimary === false) return;
        this.scrubPointer = e.pointerId;
        this.lastScrub = null;
        try { svg.setPointerCapture(e.pointerId); } catch {}
        e.preventDefault(); this.scrubMove(e);
      });
      svg.addEventListener("pointermove", (e) => { if (active()&&e.pointerId === this.scrubPointer) this.scrubMove(e); });
      for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) svg.addEventListener(type, (e) => { if (active()&&e.pointerId === this.scrubPointer) this.endScrub(); });
    }
    updateTool(){
      this.root.querySelectorAll('[data-tool]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tool===this.tool)));
      if(this.cursor)this.cursor.innerHTML=this.tool==='rinse'?(ns.WatersideArt?.shower?.()||SPONGE):(ns.WatersideArt?.sponge?.()||SPONGE);
    }
    useTool(tool){
      if(!this.alive||this.clean||!['sponge','rinse'].includes(tool)||!this.mud?.children.length)return false;
      this.tool=tool;this.updateTool();const left=[...this.mud.children],b=left[Math.floor(Math.random()*left.length)];
      this.scrubAt(Number(b.getAttribute('cx')),Number(b.getAttribute('cy')),tool==='rinse'?34:22);return true;
    }
    showReference(){
      if(this.referenceShown)return;this.referenceShown=true;this.missed=true;
      const reference=this.root.querySelector('.tb-bath-reference');if(reference)reference.hidden=false;
    }
    laterForBath(fn,ms){
      const token=this.roundToken,svg=this.svg;
      return this.later(()=>{if(token===this.roundToken&&svg===this.svg&&inRoot(this.root,svg))fn();},ms);
    }
    continueBath(token=this.roundToken){
      if(!this.alive||token!==this.roundToken||!this.completionReady)return false;
      this.completionReady=false;this.roundToken+=1;this.root.querySelector('.tb-bath-next').disabled=true;
      this.round+=1;this.next();return true;
    }
    scrubMove(e) {
      if (!this.alive || this.clean) return;
      const p = this.toBox(e);
      if (!p || p.x < -12 || p.x > 112 || p.y < -12 || p.y > 132) { this.lastScrub = null; this.cursor?.classList.remove("is-scrubbing"); return; }
      this.follow(e);
      // A fast swipe cleans its whole path, rather than disconnected event dots.
      const from = this.lastScrub || p, distance = Math.hypot(p.x - from.x, p.y - from.y);
      const steps = Math.max(1, Math.ceil(distance / 7));
      for (let i = 1; i <= steps && !this.clean; i += 1) this.scrubAt(from.x + (p.x - from.x) * i / steps, from.y + (p.y - from.y) * i / steps, this.tool==='rinse'?26:16);
      this.lastScrub = p;
    }
    endScrub() {
      const pointer = this.scrubPointer;
      this.scrubPointer = null; this.lastScrub = null;
      if (pointer != null) { try { if (this.svg?.hasPointerCapture?.(pointer)) this.svg.releasePointerCapture(pointer); } catch {} }
      if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; }
      this.pos = null; this.cursor?.classList.remove("is-scrubbing");
    }
    // "Who is in the bath?" — the replay button plays the friend's own call.
    replayPrompt() { if (this.alive && this.c && !this.clean) this.ctx.sfx?.(F().get(this.c).call); }
    // Feel pass (v56): the sponge is in the child's hand. It trails the finger
    // a little (lag reads as weight and friction — the oldest pseudo-haptic
    // trick) and tilts the way it is being dragged. Reduced motion: it simply
    // sits under the finger.
    follow(e) {
      if (!this.alive) return;
      const wrap = this.cursor?.parentElement;
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      // On big screens the game is zoomed (v53): screen pixels → layout pixels.
      const k = wrap.offsetWidth ? r.width / wrap.offsetWidth : 1;
      this.aim = [(e.clientX - r.left) / k, (e.clientY - r.top) / k];
      this.cursor.classList.add("is-scrubbing");
      if (this.still() || !this.pos) { this.pos = this.aim.slice(); this.place(0); }
      if (this.still() || this.raf) return;
      const step = () => {
        this.raf = 0;
        if (!this.alive || !this.cursor?.isConnected) return;
        const [ax, ay] = this.aim, [px, py] = this.pos;
        const nx = px + (ax - px) * 0.28, ny = py + (ay - py) * 0.28;
        this.pos = [nx, ny];
        this.place(Math.max(-18, Math.min(18, (nx - px) * 1.6)));
        if (Math.hypot(ax - nx, ay - ny) > 0.5) this.raf = requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    }
    place(tilt) {
      const [x, y] = this.pos;
      this.cursor.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) rotate(${tilt.toFixed(1)}deg)`;
    }
    toBox(e) {
      const m = this.svg.getScreenCTM?.();
      if (!m) return null;
      const pt = this.svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(m.inverse());
    }
    scrubAt(x, y, r) {
      if (!this.alive || this.clean) return;
      let gone = 0;
      for (const b of [...this.mud.children]) {
        if (Math.hypot(Number(b.getAttribute("cx")) - x, Number(b.getAttribute("cy")) - y) <= r) { b.remove(); gone += 1; }
      }
      if (!gone) return;
      const now = performance.now();
      if (!this.lastSound || now - this.lastSound > 140) { this.ctx.sfx?.("pop"); this.lastSound = now; }
      // Their shine goes with them.
      this.root.querySelectorAll(".tb-foam-shine path").forEach((sh) => { const [sx, sy] = sh.dataset.at.split(",").map(Number); if (Math.hypot(sx - x, sy - y) <= r) sh.remove(); });
      // Little suds fly off where the foam comes away.
      if (!this.still() && this.bubbles.children.length < 22) {
        for (let k = 0; k < 2; k += 1) {
          const a = Math.random() * Math.PI * 2, d = 10 + Math.random() * 10;
          this.bubbles.insertAdjacentHTML("beforeend", `<circle class="tb-fleck" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.6 + Math.random() * 1.6).toFixed(1)}" fill="#fffaf0" stroke="#96ecff" stroke-width="1.6" style="--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d - 6).toFixed(1)}px"/>`);
          const fleck = this.bubbles.lastElementChild;
          this.later(() => fleck.remove(), 500);
        }
      }
      if (this.bubbles.children.length < 14) {
        this.bubbles.insertAdjacentHTML("beforeend", `<circle class="tb-bubble" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(3 + Math.random() * 4).toFixed(1)}" fill="#ccfbef" stroke="${INK}" stroke-width="1.6"/>`);
        const bub = this.bubbles.lastElementChild;
        this.later(() => bub.remove(), 900);
      }
      const done = 1 - this.mud.children.length / this.total;
      this.root.querySelectorAll(".tb-wash-meter i").forEach((step, i) => step.classList.toggle("is-washed", done >= [0.24, 0.48, 0.72][i]));
      if (!this.answered && !this.guessing && done >= 0.35) this.offerGuess();
      if(!this.answered&&done>0.8)this.showReference();
      if(!this.mud.children.length){this.root.querySelectorAll('[data-tool]').forEach(button=>button.disabled=true);this.svg.setAttribute?.('aria-label','Your uncovered letter friend');}
      if (done >= 0.72 && this.answered) this.washAll();
    }
    offerGuess() {
      this.guessing = true;
      const profile = practiceProfile(this.ctx, this.c, "friend");
      const others = smart(this.c, this.known, profileChoices(profile, 3) - 1, "friend", this.level === 0);
      this.offered = shuffle([this.c, ...others]);
      const box = this.root.querySelector(".tb-guess");
      box.hidden = false;
      box.innerHTML = this.offered.map((o, i) => `<button type="button" class="tb-guess-letter" data-i="${i}" aria-label="${o}">${F().art(o, { size: 64, mode: "plain" })}</button>`).join("");
      const token=this.roundToken;
      box.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => this.guess(Number(b.dataset.i), b,token)));
      this.ctx.sfx?.("chime");
    }
    guess(i, btn,token=this.roundToken) {
      if (!this.alive || token!==this.roundToken || this.clean || !this.guessing || this.answered || !Number.isInteger(i) || !this.offered?.[i] || this.root.querySelectorAll('.tb-guess-letter')[i]!==btn || !inRoot(this.root,btn)) return false;
      const chosen = this.offered[i];
      // Most of the friend may still be muddy: an early right answer is real
      // recognition; once it is nearly clean, it is seeing, so it is assisted.
      if (1 - this.mud.children.length / this.total > 0.8) this.missed = true;
      const right = this.report(this.c, chosen, this.offered, { skill: "friend" });
      this.say(item(chosen));
      if (!right) {
        this.missed = true;
        this.showReference();
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        // Encouragement pass (v57): the right letter glows after a miss.
        this.root.querySelectorAll(".tb-guess-letter").forEach((b, k) => b.classList.toggle("is-hint", this.offered[k] === this.c));
        return false;
      }
      this.answered = true;
      btn.classList.add("is-right");
      this.washAll();
      return true;
    }
    washAll() {
      if (!this.alive || this.clean) return;
      this.clean = true; this.busy = true;
      this.completionReady=true;
      this.endScrub();
      this.root.classList.add("is-washed");
      this.root.querySelectorAll(".tb-wash-meter i").forEach((step) => step.classList.add("is-washed"));
      this.root.querySelector(".tb-guess").hidden = true;
      this.root.querySelector('.tb-wash-tools').hidden=true;
      const nextButton=this.root.querySelector('.tb-bath-next');nextButton.hidden=false;nextButton.focus?.({preventScroll:true});
      this.svg.setAttribute?.('aria-label','Your clean letter friend');
      if (!this.ask) this.participated(this.c, "scrubbing");
      const blobs = [...this.mud.children];
      this.root.querySelector(".tb-foam-shine")?.replaceChildren();
      if (this.still()) blobs.forEach((b) => b.remove());
      else blobs.forEach((b, k) => this.later(() => b.remove(), Math.min(600, k * 8)));
      this.ctx.sfx?.("splash");
      this.laterForBath(() => {
        this.root.querySelector(".tb-bath-friend")?.classList.add("is-clean");
        this.cheer(this.svg);
        this.ctx.sfx?.(F().get(this.c).call);
      }, 650);
      this.laterForBath(() => this.say(F().item(this.c)), 1200);
      this.laterForBath(() => this.say(item(this.c)), 2300);
    }
    destroy() { this.endScrub(); super.destroy(); }
  }
  const FOAM = ["#fffdf7", "#fffaf0", "#ccfbef", "#fffaf0"];
  const SPONGE = `<svg viewBox="0 0 100 80" aria-hidden="true"><path d="M14 30Q12 16 28 16H74Q90 16 88 30V54Q90 68 74 68H28Q12 68 14 54Z" fill="#f3c955" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>${[[32, 32], [52, 44], [70, 30], [38, 54], [68, 54]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.4" fill="#c69434"/>`).join("")}<circle cx="86" cy="14" r="7" fill="#ccfbef" stroke="${INK}" stroke-width="2.4"/><circle cx="74" cy="6" r="4" fill="#ccfbef" stroke="${INK}" stroke-width="2.4"/></svg>`;

  // ---------- v46 Letter Fishing ----------
  const FISH = (color) => `<svg viewBox="0 0 120 70" aria-hidden="true"><path d="M8 35L26 18V52Z" fill="${color}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M24 35Q40 6 76 8Q112 12 114 35Q112 58 76 62Q40 64 24 35Z" fill="${color}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="98" cy="28" r="4" fill="${INK}"/><path d="M104 42q-4 3-8 1" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M60 10Q66 2 76 8" fill="${color}" stroke="${INK}" stroke-width="2.4"/></svg>`;
  const FISH_COLORS = ["#ffa798", "#f3c955", "#96ecff", "#b7e779", "#b49fcf", "#ee806f"];
  // 2026-10-18 (construction detail): a real pail in coral, so it stands out
  // from the blue water — rounded body, a rim, two bands, rivets, a wire
  // handle with a grip, and water showing inside.
  const BUCKET = `<svg viewBox="0 0 100 90" aria-hidden="true"><path d="M16 24Q50 -14 84 24" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M16 24Q50 -14 84 24" fill="none" stroke="#c9bda4" stroke-width="3" stroke-linecap="round"/><rect x="40" y="2" width="20" height="9" rx="4.5" fill="#c69434" stroke="${INK}" stroke-width="2.4"/><path d="M16 26H84Q82 84 72 86H28Q18 84 16 26Z" fill="#ee806f" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M19 44H81M21 66H79" stroke="#c25a49" stroke-width="3" stroke-linecap="round"/><ellipse cx="50" cy="26" rx="36" ry="7" fill="#62cdf4" stroke="${INK}" stroke-width="3"/><path d="M34 26Q42 23 50 26" fill="none" stroke="#ccfbef" stroke-width="2.4" stroke-linecap="round"/><circle cx="16" cy="26" r="4" fill="#c9bda4" stroke="${INK}" stroke-width="2.4"/><circle cx="84" cy="26" r="4" fill="#c9bda4" stroke="${INK}" stroke-width="2.4"/><ellipse cx="28" cy="54" rx="4" ry="9" fill="#fffdf7" opacity=".5"/></svg>`;

  class LetterFishing extends Base {
    constructor(ctx) {
      super(ctx, "tb-fishing", "Letter fishing");
      this.known = knownChars(ctx);
      this.level = practiceLevel(ctx, this.known, "letter-name");
      const count = this.level === 0 ? 2 : 4;
      const planned = ctx.adventure && Array.isArray(ctx.targets)
        ? ctx.targets.map(id=>knownItems(ctx).find(i=>i.id===id)?.display).filter(c=>this.known.includes(c)) : [];
      this.asks = planned.length ? planned.slice(0,count) : practiceOrder(ctx, this.known, "letter-name", count);
      this.round = 0; this.caught = []; this.flights = new Set();
      if (this.known.length < 2 || !this.asks.length) { this.unavailable(); return; }
      this.next();
    }
    next() {
      this.actionCue?.destroy(); this.actionCue = null;
      if (this.round >= this.asks.length) return this.finish();
      const target = this.asks[this.round];
      this.target = target; this.missed = false; this.heard = false; this.busy = false;
      const profile = practiceProfile(this.ctx, target, "letter-name");
      this.listenPrompt = profile.promptMode === "listen" && this.ctx.allowRecall !== false && this.ctx.canListen?.() !== false;
      const promptVersion = this.promptVersion = (this.promptVersion || 0) + 1;
      const n = Math.min(profileChoices(profile, 4), this.ctx.adventure ? (this.ctx.choiceCount || 2) : 4);
      const others = [...new Set(smart(target, this.known, this.known.length, "name", this.level === 0).filter((c) => c && c !== target))];
      this.fish = shuffle([target, ...others.slice(0, n - 1)]);
      if (this.fish.length < 2) { this.unavailable(); return; }
      this.root.innerHTML = `
        <div class="tb-pond${this.listenPrompt ? "" : " is-still"}" style="--n:${this.fish.length}">
          ${ns.WatersideArt?.pond?.() || '<svg class="tb-water" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true"><path d="M0 18Q75 8 150 18T300 18V200H0Z" fill="#62cdf4"/></svg>'}
          <span class="tb-pond-reeds" aria-hidden="true">${ns.WatersideArt?.reeds?.() || ""}</span><span class="tb-pond-stones" aria-hidden="true">${ns.WatersideArt?.stones?.() || ""}</span>
          ${this.fish.map((c, i) => `<button type="button" class="tb-fish" data-i="${i}" style="--row:${i};--dur:${(34 + Math.random() * 8).toFixed(1)}s;--delay:${(-Math.random() * 30).toFixed(1)}s;--x:${(20 + (i % 2) * 25).toFixed(0)}%" aria-label="A fish carrying ${c}"><span class="tb-fish-body">${ns.WatersideArt?.fish?.(i) || FISH(FISH_COLORS[i % FISH_COLORS.length])}</span><span class="tb-fish-letter">${F().art(c, { size: 50, mode: "plain" })}</span></button>`).join("")}
          <span class="tb-line" aria-hidden="true"></span>
          <span class="tb-landing" aria-hidden="true">${ns.WatersideArt?.dock?.() || ""}</span>
          <span class="tb-bucket" aria-label="Fish caught">${BUCKET}</span>
        </div>
        <div class="tb-catch-tray" role="group" aria-label="Letters caught">${this.asks.map((_,i)=>`<span class="tb-catch-slot${this.caught[i] ? ' is-filled' : ''}">${this.caught[i] ? F().art(this.caught[i],{size:44,mode:'plain'}) : '<i aria-hidden="true"></i>'}</span>`).join('')}</div>
        ${this.dots(this.asks.length, this.round)}`;
      this.root.querySelectorAll(".tb-fish").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
      this.root.querySelector('.tb-pond').addEventListener('pointerdown',(e)=>{ if (!e.target.closest?.('.tb-fish')) this.ripple(e.clientX,e.clientY); });
      this.ctx.beginRound?.(realItem(this.ctx, target), "letter-name");
      this.ctx.prompt?.(this.listenPrompt ? null : item(target));
      this.later(() => this.presentPrompt(target, promptVersion), 350);
      this.teachCatch();
    }
    teachCatch() {
      const source = this.root.querySelectorAll('.tb-fish')[this.fish.indexOf(this.target)];
      if (!source) return;
      this.actionCue = this.ctx.setupActionCue?.({ source, type: 'tap',
        automatic: this.ctx.firstVisit === true && this.level === 0 && this.round === 0,
        onShow: () => {
          if (!this.alive || this.busy) return;
          // Preserve swimming positions before revealing the matching target:
          // the hand must still point at the fish it was drawn over.
          this.root.querySelectorAll('.tb-fish').forEach(fish => { fish.style.left = getComputedStyle(fish).left; });
          this.showTarget();
        },
      });
    }
    presentPrompt(target, version) {
      if (!this.alive || this.busy || this.target !== target || this.promptVersion !== version) return false;
      this.heard = false;
      let result;
      try { result = this.ctx.say?.(item(target)); } catch { result = false; }
      const resolved = (heard) => {
        if (this.alive && !this.busy && this.target === target && this.promptVersion === version && this.listenPrompt) {
          if (heard === true) this.heard = true;
          else this.showTarget();
        }
        return heard === true;
      };
      if (result?.then) return result.then(resolved, () => resolved(false));
      resolved(result);
      return result === true;
    }
    showTarget() {
      this.listenPrompt = false; this.heard = false; this.missed = true;
      this.ctx.prompt?.(item(this.target));
      this.root?.querySelector('.tb-pond')?.classList.add('is-still');
    }
    ripple(x,y) {
      const pond = this.root.querySelector('.tb-pond');
      if (!this.alive || !pond || pond.querySelectorAll('.tb-ripple').length >= 4) return;
      const r = pond.getBoundingClientRect(), node = document.createElement('span');
      node.className = 'tb-ripple'; node.setAttribute('aria-hidden','true');
      node.style.left = `${(x-r.left)/r.width*100}%`; node.style.top = `${(y-r.top)/r.height*100}%`;
      pond.appendChild(node); this.later(()=>node.remove(), this.still() ? 120 : 620);
    }
    cast(b) {
      const pond = this.root.querySelector(".tb-pond"), line = this.root.querySelector(".tb-line");
      if (!pond || !line) return;
      const p = pond.getBoundingClientRect(), r = b.getBoundingClientRect();
      line.style.left = `${(r.left + r.width * 0.62 - p.left)/p.width*100}%`;
      line.style.height = `${(r.top + r.height * 0.4 - p.top)/p.height*100}%`;
      line.classList.remove("is-cast"); void line.offsetWidth; line.classList.add("is-cast");
      this.ripple(r.left+r.width/2,r.top+r.height/2);
    }
    pick(i, b) {
      if (!this.alive || this.busy || b.classList.contains("is-caught")) return false;
      const c = this.fish[i];
      if (!c) return false;
      this.actionCue?.stop();
      this.cast(b);
      const right = this.report(this.target, c, [...new Set(this.fish)], { listening: this.listenPrompt });
      this.say(item(c));
      if (!right) {
        // It wriggles off the hook and swims on, saying its own name.
        this.missed = true;
        this.showTarget();
        this.ctx.sfx?.("softwrong");
        b.classList.add("is-wriggle");
        this.later(() => b.classList.remove("is-wriggle"), 700);
        this.root.querySelectorAll(".tb-fish").forEach((f, k) => f.classList.toggle("is-hint", this.fish[k] === this.target));
        return false;
      }
      this.busy = true;
      this.actionCue?.destroy(); this.actionCue = null;
      this.promptVersion += 1;
      // The fish travels to the visible pail before its letter joins the catch.
      const left = getComputedStyle(b).left;
      b.style.left = left;
      b.classList.add("is-caught");
      this.ctx.sfx?.("splash");
      this.landFish(b, c);
      return true;
    }
    landFish(b, c) {
      const bucket = this.root.querySelector('.tb-bucket');
      const version = this.promptVersion, round = this.round;
      let settled = false, flight;
      const arrive = () => {
        if (settled || !this.alive || version !== this.promptVersion || round !== this.round) return;
        settled = true;
        b.classList.add('is-landed');
        if (flight) { this.flights.delete(flight); flight.cancel(); }
        this.caught.push(c);
        const slot = this.root.querySelectorAll('.tb-catch-slot')[round];
        if (slot) { slot.innerHTML = F().art(c,{size:44,mode:'plain'}); slot.classList.add('is-filled'); }
        bucket?.classList.add('is-full');
        this.cheer(bucket || b);
        this.round += 1;
        this.later(()=>this.next(), 1100);
      };
      if (this.still() || !bucket || !b.animate) { arrive(); return; }
      const from = b.getBoundingClientRect(), to = bucket.getBoundingClientRect();
      // Translate in the piece's own CSS pixels even when fitStage zooms it.
      const scale = b.offsetWidth ? from.width/b.offsetWidth : 1;
      const dx = (to.left + to.width/2 - from.left - from.width/2)/scale;
      const dy = (to.top + to.height*.38 - from.top - from.height/2)/scale;
      flight = b.animate([
        {transform:'translate(0,0) scale(1)',offset:0},
        {transform:`translate(${dx*.42}px,${dy*.42-10}px) scale(.68)`,offset:.42},
        {transform:`translate(${dx}px,${dy}px) scale(.24)`,opacity:0,offset:1}
      ],{duration:620,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'});
      this.flights.add(flight);
      flight.finished.then(arrive,()=>{});
      this.later(arrive,720);
    }
    replayPrompt() {
      if (this.alive && this.target && !this.busy) {
        this.showTarget(); this.promptVersion += 1;
        this.presentPrompt(this.target, this.promptVersion);
      }
    }
    destroy() {
      this.actionCue?.destroy(); this.actionCue = null;
      super.destroy(); this.promptVersion += 1;
      this.flights?.forEach((flight)=>flight.cancel()); this.flights?.clear();
    }
  }

  // ---------- v47 Colour a Friend ----------
  const CRAYONS = ["#ee806f", "#f3c955", "#7fce54", "#62cdf4", "#b49fcf", "#ffa798", "#c69434", "#fffdf7"];
  const NAMED_CRAYONS = ["Coral", "Sunshine", "Leaf green", "Sky blue", "Lavender", "Pink", "Honey gold", "Paper"];
  const fallbackCrayon = (color) => `<svg viewBox="0 0 40 80" aria-hidden="true"><path d="M8 22L20 2L32 22V76H8Z" fill="${color}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M8 34H32M8 64H32" stroke="${INK}" stroke-width="2.4"/></svg>`;
  const PAPER = "#fffdf7";
  class ColourFriend extends Base {
    constructor(ctx) {
      super(ctx, "tb-colour", "Colour a friend");
      this.noReplay = true;
      const known = knownChars(ctx);
      this.chars = [...new Set([...firstsOf(ctx, known), ...shuffle(known)])].slice(0, 3);
      if (!this.chars.length) { this.unavailable(); return; }
      this.crayon = ns.DrawingPalette?.startForPet?.(ctx.petHue) || CRAYONS[0];
      this.crayons = [...(ns.DrawingPalette?.colors || []).map(c => ({ value: c.value, name: c.name })), { value: PAPER, name: "Paper" }];
      if (!ns.DrawingPalette?.colors?.length) this.crayons = CRAYONS.map((value, i) => ({ value, name: NAMED_CRAYONS[i] }));
      this.pagesDone = new Set();
      this.drafts = new Map();
      this.studio = ctx.chooseColourStudio === true;
      this.history = new Map(); this.savedPaint = new Map(); this.pagePictures = new Map(); this.pageSignatures = new Map();
      this.finished = false;
      this.root.classList.toggle('is-studio',this.studio);
      this.visitChars = this.chars.slice();
      this.page(this.chars[0]);
    }
    page(c) {
      if (!this.alive || this.finished || (this.busy && this.saving) || !this.chars.includes(c)) return false;
      if (this.svg && this.c && this.c !== c) this.saveDraft(this.c);
      this.c = c; this.named = this.pagesDone.has(c); this.coloured = new Set();
      const token = this.pageToken = (this.pageToken || 0) + 1;
      this.ctx.beginRound?.(realItem(this.ctx, c), "drawing");
      this.root.innerHTML = `
        ${this.studio?'<div class="cf-pages" role="group" aria-label="Choose a familiar friend to colour"></div>':''}
        <div class="ts-easel"><span class="ts-easel-art" aria-hidden="true">${ns.ToyStudioArt?.drawingEasel?.() || ""}</span><div class="tb-paper">${F().art(c, { size: 280 })}</div></div>
        <div class="tb-crayons" role="group" aria-label="Choose a crayon">${this.crayons.map(({ value: col, name }) => `<button type="button" class="tb-crayon${col === this.crayon ? " is-on" : ""}" data-c="${col}" style="--crayon:${col}" aria-label="${name} crayon" aria-pressed="${col === this.crayon}">${ns.ToyStudioArt?.crayon?.(col) || fallbackCrayon(col)}</button>`).join("")}</div>
        <div class="tb-colour-tools">${!this.studio&&this.chars.length > 1 ? `<button type="button" class="tb-next-page" aria-label="Another friend">${F().art(this.chars[(this.chars.indexOf(c) + 1) % this.chars.length], { size: 54 })}</button>` : ""}${this.studio?`<button type="button" class="cf-undo" aria-label="Undo the last colour" disabled>${ns.LettersArt.icon('undo',32)}</button>`:''}<button type="button" class="tb-hang" aria-label="Hang it in the garden" hidden><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8L50 22" stroke="${INK}" stroke-width="4"/><path d="M18 22H82V88H18Z" fill="#fffaf0" stroke="#c69434" stroke-width="8"/><path d="M34 56l12 12 22-24" fill="none" stroke="#4e9677" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>${this.studio?`<button type="button" class="cf-finish" aria-label="Finish colouring" disabled>${ns.LettersArt.icon('check',36)}</button>`:''}</div>`;
      // Make a colouring page: every painted part turns to paper, the ink stays.
      const svg = this.root.querySelector(".tb-paper svg");
      this.svg = svg;
      let n = 0;
      svg.querySelectorAll(".lf-dress [fill], .lf-fill-dot").forEach((el) => {
        const f = (el.getAttribute("fill") || "").toLowerCase();
        if (!f || f === "none" || f === INK || el.classList.contains("lf-eye")) return;
        el.setAttribute("fill", PAPER); el.dataset.part = String(n++);
      });
      svg.querySelectorAll(".lf-fill").forEach((el) => { el.setAttribute("stroke", PAPER); el.dataset.part = String(n++); el.dataset.body = "1"; });
      // The thick ink edge of the body colours the body too (a bigger target).
      svg.querySelectorAll(".lf-ink").forEach((el, k) => { el.dataset.bodyEdge = String(k); });
      // Shine, eyes and detail strokes sit above the paper regions. Let a tap
      // through them reach the region beneath instead of silently doing nothing.
      svg.querySelectorAll('path, circle, ellipse, rect, polygon, polyline, line').forEach(el => {
        if (el.dataset.part == null && el.dataset.bodyEdge == null) el.style.pointerEvents = 'none';
      });
      this.parts = n;
      const saved = this.drafts.get(c);
      if (saved) {
        saved.colors.forEach(({ index, fill, stroke }) => {
          const el = svg.querySelector(`[data-part="${index}"]`);
          if (el) { if (fill != null) el.setAttribute("fill", fill); if (stroke != null) el.setAttribute("stroke", stroke); }
        });
        this.coloured = new Set(saved.coloured);
        this.named = saved.named;
      }
      svg.addEventListener("click", (e) => { if (token === this.pageToken && inRoot(this.root, svg)) this.paint(e.target, token); });
      // Keyboard and switch access (v54): every part can be reached with Tab
      // and coloured with Enter or Space.
      svg.removeAttribute("aria-hidden");
      svg.setAttribute("role", "group");
      svg.setAttribute("aria-label", "Colouring page");
      svg.querySelectorAll("[data-part]").forEach((el, k) => {
        el.setAttribute("tabindex", "0"); el.setAttribute("role", "button");
        el.setAttribute("aria-label", el.dataset.body ? "The letter" : `Part ${k + 1}`);
        el.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && token === this.pageToken && inRoot(this.root, svg)) { e.preventDefault(); this.paint(el, token); } });
      });
      this.root.querySelectorAll(".tb-crayon").forEach((b) => b.addEventListener("click", () => {
        if (token !== this.pageToken || !inRoot(this.root, b) || this.saving) return;
        this.crayon = b.dataset.c;
        this.root.querySelectorAll(".tb-crayon").forEach((o) => { o.classList.toggle("is-on", o === b); o.setAttribute("aria-pressed", String(o === b)); });
        this.ctx.sfx?.("click");
      }));
      this.root.querySelector(".tb-next-page")?.addEventListener("click", () => { if (token !== this.pageToken || this.saving) return; this.ctx.sfx?.("page"); this.page(this.chars[(this.chars.indexOf(this.c) + 1) % this.chars.length]); });
      this.root.querySelector(".tb-hang").addEventListener("click", () => { if (token === this.pageToken) this.hang(); });
      if (this.named || this.coloured.size >= Math.min(3, this.parts)) this.root.querySelector(".tb-hang").hidden = false;
      if(this.studio){
        this.root.querySelector('.cf-undo').onclick=()=>{if(token===this.pageToken)this.undoPaint();};
        this.root.querySelector('.cf-finish').onclick=()=>this.finishStudio(token);
        this.syncStudio();
      }
      this.ctx.sfx?.("page");
      return true;
    }
    saveDraft(c) {
      if (!this.svg) return;
      const colors = [...this.svg.querySelectorAll("[data-part]")].map(el => ({ index: el.dataset.part, fill: el.getAttribute("fill"), stroke: el.getAttribute("stroke") }));
      this.drafts.set(c, { colors, coloured: [...(this.coloured || [])], named: !!this.named });
      if(this.studio){this.pagePictures.set(c,this.picture());this.pageSignatures.set(c,this.paintSignature());}
    }
    picture() {
      // A thumbnail is a drawing, never a second set of keyboard controls.
      return this.svg.outerHTML.replace(/\s(?:tabindex|role|aria-label)="[^"]*"/g,'').replace(/class="([^"]*)"/g,(_,v)=>`class="${v.replace(/\bis-wiggle\b/g,'')}"`);
    }
    paintSignature() { return JSON.stringify([...this.svg.querySelectorAll('[data-part]')].map(el=>[el.dataset.part,el.getAttribute('fill'),el.getAttribute('stroke')])); }
    syncStudio() {
      if(!this.studio||!this.alive)return;
      const locked=this.saving||this.finished,strip=this.root.querySelector('.cf-pages');
      this.pagePictures.set(this.c,this.picture());
      this.pageSignatures.set(this.c,this.paintSignature());
      strip.innerHTML=this.chars.map(c=>`<button type="button" class="cf-page" data-page="${c}" aria-label="Colour friend ${c}" aria-pressed="${c===this.c}" ${locked?'disabled':''}><span aria-hidden="true">${this.pagePictures.get(c)||F().art(c,{size:58})}</span>${this.savedPaint.has(c)&&this.savedPaint.get(c)===this.pageSignatures.get(c)?`<i aria-hidden="true">${ns.LettersArt.icon('check',18)}</i>`:''}</button>`).join('');
      strip.querySelectorAll('.cf-page').forEach(button=>button.onclick=()=>{if(this.alive&&!this.saving&&!this.finished&&inRoot(this.root,button)&&button.dataset.page!==this.c)this.page(button.dataset.page);});
      const hang=this.root.querySelector('.tb-hang');
      hang.disabled=locked||this.savedPaint.get(this.c)===this.paintSignature();
      hang.setAttribute('aria-label',this.savedPaint.has(this.c)?'Save changes to this garden picture':'Hang it in the garden');
      this.root.querySelector('.cf-undo').disabled=locked||!(this.history.get(this.c)?.length);
      this.root.querySelector('.cf-finish').disabled=locked||!this.savedPaint.size;
    }
    undoPaint() {
      if(!this.alive||this.saving||this.finished)return;
      const previous=this.history.get(this.c)?.pop();if(!previous)return;
      previous.colors.forEach(([index,fill,stroke])=>{const el=this.svg.querySelector(`[data-part="${index}"]`);if(el){if(fill!=null)el.setAttribute('fill',fill);if(stroke!=null)el.setAttribute('stroke',stroke);}});
      this.coloured=new Set(previous.coloured);
      this.root.querySelector('.tb-paper')?.classList.remove('is-hung');
      // Undo changes ink, not the already recorded motor participation.
      this.ctx.sfx?.('page');this.syncStudio();
    }
    finishStudio(token=this.pageToken) {
      if(!this.studio||!this.alive||this.saving||this.finished||!this.savedPaint.size||token!==this.pageToken)return false;
      this.finished=true;this.syncStudio();this.finish(0);return true;
    }
    paint(target, token = this.pageToken) {
      if (!this.alive || this.finished || token !== this.pageToken || !inRoot(this.root, this.svg) || this.saving) return;
      let el = target?.closest?.("[data-part], [data-body-edge]");
      if (!el) return;
      if (el.dataset.bodyEdge != null) el = this.svg.querySelectorAll(".lf-fill")[Number(el.dataset.bodyEdge)] || null;
      if (!el) return;
      this.root.querySelector('.tb-paper')?.classList.remove('is-hung');
      if(this.studio){
        const affected=el.dataset.body?[...this.svg.querySelectorAll('.lf-fill')]:[el],attr=el.dataset.body?'stroke':'fill';
        if(affected.some(part=>part.getAttribute(attr)!==this.crayon)){
          const history=this.history.get(this.c)||[];
          history.push({colors:JSON.parse(this.paintSignature()),coloured:[...this.coloured]});
          this.history.set(this.c,history.slice(-24));
        }
      }
      if (el.dataset.body) this.svg.querySelectorAll(".lf-fill").forEach((p) => { p.setAttribute("stroke", this.crayon); this.coloured.add(p.dataset.part); });
      else { el.setAttribute("fill", this.crayon); this.coloured.add(el.dataset.part); }
      this.ctx.sfx?.("blob");
      // Colouring the letter body: the friend says its name, then its letter.
      if (el.dataset.body && !this.named) {
        this.named = true;
        const svg = this.svg;
        svg.classList.add("is-wiggle");
        this.later(() => { if (token === this.pageToken && inRoot(this.root, svg)) svg.classList.remove("is-wiggle"); }, 600);
        this.pagesDone.add(this.c);
        this.say(F().item(this.c));
        this.later(() => { if (token === this.pageToken && inRoot(this.root, this.svg)) this.say(realItem(this.ctx, this.c)); }, 1200);
        this.participated(this.c, "drawing");
      }
      // v58: colouring the letter itself is enough to hang the picture. Three
      // parts were needed, and on a phone 14 of 28 friends (م, ر, ع…) only had
      // a third part under 20px — a nose or a dot a toddler can't hit.
      if (this.named || this.coloured.size >= Math.min(3, this.parts)) this.root.querySelector(".tb-hang").hidden = false;
      this.syncStudio();
    }
    async hang() {
      if (!this.alive || this.busy || this.finished || !this.svg || !inRoot(this.root, this.svg)) return false;
      const signature=this.studio?this.paintSignature():null;
      if(this.studio&&this.savedPaint.get(this.c)===signature)return false;
      this.busy = true; this.saving = true;
      this.syncStudio();
      const token = this.pageToken, svg = this.svg;
      this.root.querySelectorAll(".tb-next-page, .tb-hang").forEach(button => { button.disabled = true; button.setAttribute("aria-busy", "true"); });
      // Snapshot the current page before awaiting image decoding.
      const src = svg.outerHTML.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/width="\d+" height="\d+"/, 'width="160" height="160"');
      // Draw the page onto a small canvas so the garden can hang it as a sign.
      let url = null;
      try {
        const c = document.createElement("canvas"); c.width = 160; c.height = 160;
        const g = c.getContext("2d");
        if (!g) throw new Error("Canvas unavailable");
        g.fillStyle = PAPER; g.fillRect(0, 0, 160, 160);
        const img = new Image();
        await new Promise((ok, fail) => { img.onload = ok; img.onerror = () => fail(new Error("Page could not be rendered")); img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(src)}`; });
        if (token !== this.pageToken || !this.alive || !inRoot(this.root, svg)) return false;
        if (!img.width || !img.height) throw new Error("Page rendered blank");
        g.drawImage(img, 0, 0, 160, 160);
        url = c.toDataURL("image/png");
        if (!url || !this.ctx.saveDrawing) throw new Error("Drawing could not be saved");
        const saved = await this.ctx.saveDrawing(url,this.studio?this.c:undefined);
        if (saved === null) {
          if (this.alive && token === this.pageToken) {
            this.saving = false; this.busy = false;
            this.root.querySelectorAll(".tb-next-page, .tb-hang").forEach(button => { button.disabled = false; button.removeAttribute?.("aria-busy"); });
            this.syncStudio();
          }
          return false;
        }
        if (saved === false) throw new Error("Drawing could not be saved");
      } catch {
        if (this.alive && token === this.pageToken) {
          this.saving = false; this.busy = false;
          this.root.querySelectorAll(".tb-next-page, .tb-hang").forEach(button => { button.disabled = false; button.removeAttribute?.("aria-busy"); });
          this.syncStudio();
        }
        return false;
      }
      if (!this.alive || token !== this.pageToken || !inRoot(this.root, svg)) return false;
      this.saving = false;
      this.root.querySelector(".tb-paper")?.classList.add("is-hung");
      this.cheer(svg);
      if(this.studio){
        this.savedPaint.set(this.c,signature);this.saveDraft(this.c);this.busy=false;
        this.root.querySelector('.tb-hang').removeAttribute('aria-busy');this.syncStudio();
        this.root.querySelector('.cf-finish').focus?.({preventScroll:true});
      }else this.finish(1400);
      return true;
    }
    destroy() { this.pageToken = (this.pageToken || 0) + 1; super.destroy(); }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { FriendPairs, DotNests, FriendJigsaw, BathTime, LetterFishing, ColourFriend });
  ns.ToyBoxGames = { KINDS: ["FriendPairs", "DotNests", "FriendJigsaw", "BathTime", "LetterFishing", "ColourFriend"], sideOf, dotsOf, whereChars, knownItems, practiceItems, practiceProfile, practiceOrder, practiceLevel, pairsAt };
})(window.MiftahGame || (window.MiftahGame = {}));
