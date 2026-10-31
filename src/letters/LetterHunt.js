// Letter Hunt: familiar letters live on playful objects in the child's land.
// Each visit fixes its support at entry, confirms speech before independent
// listening, and lets the child collect each find before choosing the next.
// The original six-land scene remains available as LetterHunt.classic.
(function (ns) {
  const INK = "#4a3620";
  const key = (item) => item?.id ?? item?.display;
  const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(([, v]) => v);

  // Each thing draws around (0,0); `label` is where its letter sits.
  const CL = [[0,-80,40],[-36,-60,30],[36,-58,30],[-20,-108,26],[22,-110,26],[0,-44,28],[-46,-88,20],[46,-88,20]];
  const THINGS = {
    cloud: { art: `<path d="M-62 18Q-70-8-44-10Q-36-34-8-26Q8-42 30-26Q58-30 60-4Q72 14 52 22Z" fill="#fffdf7" stroke="#c9bda4" stroke-width="3"/>`, label: [0, 0], size: 40 },
    kite: { art: `<path d="M0-48L34 0L0 52L-34 0Z" fill="#ffa798" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M0-48V52M-34 0H34" stroke="#fffaf0" stroke-width="2.4"/><path d="M0 52Q-14 76 6 92Q-8 108 4 126" fill="none" stroke="${INK}" stroke-width="1.6"/>`, label: [0, 0], size: 34, plate: true },
    // v258: a built tree (root flare, bark, forked limbs, clumped inked canopy with leaf curls) — was a lollipop circle on a stick.
    trunk: { art: `<path d="M-30 70Q-20 62 -18 46L-20 -20Q-22 -34 -8 -36H8Q22 -34 20 -20L18 46Q20 62 30 70Z" fill="#a89478" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M-10 -28L-26 -52M10 -28L24 -54" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M-10 -28L-26 -52M10 -28L24 -54" stroke="#a89478" stroke-width="5" stroke-linecap="round"/><path d="M-8 40V56M10 30V50M-12 -12V0" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/>${''+CL.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r+3}" fill="${INK}"/>`).join("")}${CL.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#4e9677"/>`).join("")}${CL.map(([x,y,r])=>`<circle cx="${x-r*.14}" cy="${y-r*.16}" r="${r*.84}" fill="#7fce54"/>`).join("")}${CL.filter(([,y])=>y<-80).map(([x,y,r])=>`<circle cx="${x-r*.3}" cy="${y-r*.32}" r="${r*.38}" fill="#b7e779"/>`).join("")}${CL.map(([x,y,r])=>`<path d="M${x+r*.2} ${y+r*.25}q3 -4 7 -3" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/>`).join("")}<ellipse cy="14" rx="15" ry="20" fill="#e5dcc8" stroke="#70501b" stroke-width="2.4"/>`, label: [0, 14], size: 30, snug: true },
    rock: { art: `<path d="M-56 30Q-60-6-30-20Q-6-34 24-24Q56-16 58 18Q58 34 40 36H-40Q-56 36-56 30Z" fill="#c9bda4" stroke="${INK}" stroke-width="3"/><path d="M-30-12Q-10-22 12-18" fill="none" stroke="#e5dcc8" stroke-width="4" stroke-linecap="round"/>`, label: [0, 8], size: 36 },
    crate: { art: `<path d="M-46-30H46V40H-46Z" fill="#c69434" stroke="${INK}" stroke-width="3"/><path d="M-46-8H46M-46 18H46" stroke="#70501b" stroke-width="2.4"/><circle cx="-24" cy="-38" r="12" fill="#ee806f" stroke="${INK}" stroke-width="2.4"/><circle cx="2" cy="-40" r="12" fill="#f3c955" stroke="${INK}" stroke-width="2.4"/><circle cx="26" cy="-36" r="12" fill="#ee806f" stroke="${INK}" stroke-width="2.4"/><rect x="-28" y="-8" width="56" height="40" rx="8" fill="#fffaf0" stroke="#70501b" stroke-width="2.4"/>`, label: [0, 11], size: 32 },
    lily: { art: `<ellipse cx="0" cy="10" rx="62" ry="22" fill="#4e9677" stroke="${INK}" stroke-width="3"/><path d="M0 10L40-4" stroke="#2f5c46" stroke-width="3"/><ellipse cx="0" cy="6" rx="50" ry="15" fill="#7fce54"/><circle cx="44" cy="-6" r="8" fill="#ffa798" stroke="${INK}" stroke-width="2.4"/>`, label: [-6, 6], size: 32 },
    sail: { art: `<path d="M-50 30H50L36 52H-36Z" fill="#c69434" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M0 30V-70" stroke="${INK}" stroke-width="4"/><path d="M4-66L50 22H4Z" fill="#fffaf0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`, label: [22, -4], size: 30 },
    lantern: { art: `<path d="M0-70V-46" stroke="${INK}" stroke-width="3"/><rect x="-24" y="-46" width="48" height="66" rx="12" fill="#ffe49a" stroke="${INK}" stroke-width="3"/><path d="M-30-46H30M-30 20H30" stroke="#70501b" stroke-width="4" stroke-linecap="round"/>`, label: [0, -13], size: 34 },
    flag: { art: `<path d="M-30 70V-60" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M-28-62H48L34-30L48 2H-28Z" fill="#62cdf4" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`, label: [4, -32], size: 34 },
    shell: { art: `<path d="M-44 24Q-48-24 0-34Q48-24 44 24Z" fill="#ffa798" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M0-30V22M-24-20L-14 22M24-20L14 22" stroke="#ee806f" stroke-width="2.4"/><rect x="-18" y="-6" width="36" height="26" rx="8" fill="#fffaf0" opacity=".9"/>`, label: [0, 7], size: 28, snug: true },
    pot: { art: `<path d="M-36-10H36L28 40H-28Z" fill="#c25a49" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M-40-20H40V-8H-40Z" fill="#ee806f" stroke="${INK}" stroke-width="3"/><path d="M-10-20Q-30-60-6-70M8-20Q20-56 34-62" fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/><circle cx="-6" cy="-72" r="9" fill="#f3c955" stroke="${INK}" stroke-width="2.4"/>`, label: [0, 16], size: 30 },
  };
  // Six places per land: x, y in an 800×600 picture, and which thing lives there.
  const LANDS = {
    meadow: { sky: "#96ecff", ground: "#7fce54", far: "#b7e779", spots: [[150, 120, "cloud"], [610, 110, "kite"], [140, 360, "trunk"], [400, 470, "rock"], [640, 450, "pot"], [400, 300, "flag"]] },
    orchard: { sky: "#ccfbef", ground: "#7fce54", far: "#b7e779", spots: [[150, 120, "cloud"], [620, 110, "kite"], [150, 360, "trunk"], [640, 380, "trunk"], [400, 480, "crate"], [400, 300, "flag"]] },
    lagoon: { sky: "#96ecff", ground: "#62cdf4", far: "#b7e779", spots: [[160, 110, "cloud"], [620, 250, "sail"], [190, 470, "lily"], [470, 520, "lily"], [400, 320, "flag"], [640, 470, "shell"]] },
    night: { sky: "#4a4d84", ground: "#2f5c46", far: "#4e9677", spots: [[160, 120, "cloud"], [620, 200, "lantern"], [150, 360, "trunk"], [400, 480, "rock"], [640, 460, "pot"], [400, 260, "lantern"]] },
    peaks: { sky: "#ccfbef", ground: "#b7e779", far: "#e5dcc8", spots: [[160, 110, "cloud"], [620, 120, "kite"], [190, 420, "rock"], [600, 460, "rock"], [400, 330, "flag"], [400, 500, "crate"]] },
    river: { sky: "#96ecff", ground: "#7fce54", far: "#b7e779", spots: [[160, 110, "cloud"], [620, 330, "sail"], [150, 380, "trunk"], [420, 500, "shell"], [640, 500, "lily"], [400, 290, "flag"]] },
  };

  // Upright phones get their own picture: the same six things in two columns,
  // sky things on top, drawn bigger so letters stay finger- and eye-sized.
  const PORTRAIT = [[160, 150], [440, 170], [150, 420], [450, 440], [160, 690], [440, 700]];
  // 2026-10-13: thin hiding places (a flag, a kite string) were 35–41px wide on
  // a small phone. An invisible pad round each letter widens the tap target
  // without changing the picture.
  const pad = (t) => `<circle class="hunt-pad" cx="${t.label[0]}" cy="${t.label[1]}" r="60" fill="#fffaf0" fill-opacity="0"/>`;
  function sceneClassic(land, letters, portrait = false) {
    const L = LANDS[land] || LANDS.meadow;
    if (portrait) {
      const order = L.spots.map((s, i) => [s, i]).sort((a, b) => a[0][1] - b[0][1]);
      const night = land === "night";
      const things = order.map(([[, , kind], i], k) => {
        const [x, y] = PORTRAIT[k], t = THINGS[kind], letter = letters[i];
        const glyph = letter ? `<text class="hunt-letter" x="${t.label[0]}" y="${t.label[1]}" text-anchor="middle" dominant-baseline="central" font-family="'Amiri Quran', serif" font-size="${Math.round(t.size * 1.3)}" fill="${INK}" direction="rtl">${letter.display}</text>` : "";
        return `<g class="hunt-spot" data-spot="${i}" data-kind="${kind}" transform="translate(${x} ${y}) scale(1.3)" role="button" tabindex="0" aria-label="${letter ? `Letter ${letter.display}` : "Garden thing"}">${pad(t)}<g class="hunt-thing">${t.art}${glyph}</g></g>`;
      }).join("");
      const water = land === "lagoon" || land === "river" ? `<path d="M-20 560Q150 530 300 550Q450 570 620 540V880H-20Z" fill="#62cdf4"/>` : "";
      return `<svg class="hunt-scene is-portrait" viewBox="0 0 600 860" preserveAspectRatio="xMidYMid meet" aria-label="Find the letter in the picture">
        <rect width="600" height="860" fill="${L.sky}"/>${night ? [[60, 50], [240, 30], [520, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fffaf0"/>`).join("") : ""}
        <path d="M-20 330Q150 290 300 315Q460 340 620 300V880H-20Z" fill="${L.far}"/>
        <path d="M-20 470Q200 420 380 460Q500 480 620 450V880H-20Z" fill="${L.ground}"/>${water}${things}</svg>`;
    }
    const night = land === "night";
    const peaks = land === "peaks" ? `<path d="M-20 360L150 150L270 300L400 170L560 330L660 190L820 360Z" fill="#e5dcc8"/><path d="M150 150L176 188L150 180L128 196ZM400 170L424 206L402 198L382 212ZM660 190L684 222L662 214L642 228Z" fill="#fffdf7"/>` : "";
    const water = land === "lagoon" || land === "river" ? `<path d="M-20 430Q200 400 400 420Q600 440 820 410V620H-20Z" fill="#62cdf4"/><path d="M60 470q30-8 60 0M520 500q30-8 60 0" fill="none" stroke="#ccfbef" stroke-width="4" stroke-linecap="round"/>` : "";
    const stars = night ? [[80, 60], [300, 40], [480, 90], [720, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fffaf0"/>`).join("") : "";
    // v58: on a landscape screen (an iPad held sideways) the letters were 14–27px
    // wide — small to recognise at 3. They grow 15% where the hiding place has
    // room; the tree hollow and shell plate (snug) keep their size.
    const spots = L.spots.map(([x, y, kind], i) => {
      const t = THINGS[kind], letter = letters[i];
      const glyph = letter ? `<text class="hunt-letter" x="${t.label[0]}" y="${t.label[1]}" text-anchor="middle" dominant-baseline="central" font-family="'Amiri Quran', serif" font-size="${Math.round(t.size * (t.snug ? 1 : 1.15))}" fill="${INK}" direction="rtl">${letter.display}</text>` : "";
      return `<g class="hunt-spot" data-spot="${i}" data-kind="${kind}" transform="translate(${x} ${y})" role="button" tabindex="0" aria-label="${letter ? `Letter ${letter.display}` : "Garden thing"}">${pad(t)}<g class="hunt-thing">${t.art}${glyph}</g></g>`;
    }).join("");
    return `<svg class="hunt-scene" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-label="Find the letter in the picture">
      <rect width="800" height="600" fill="${L.sky}"/>${stars}${peaks}
      <path d="M-20 360Q200 300 400 340Q620 380 820 320V620H-20Z" fill="${L.far}"/>
      <path d="M-20 420Q260 360 520 410Q680 440 820 400V620H-20Z" fill="${L.ground}"/>${water}
      ${spots}</svg>`;
  }

  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const eligible = (item, ctx) => item?.id && item.display && item.taught !== false && item.isTaught !== false && item.locked !== true && item.unlocked !== false
    && (!ctx.completedWorldIds || !(item.prerequisiteWorldIds || []).some(id => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));
  function taughtItems(rows, ctx) {
    const items = (rows || []).filter(Boolean), blocked = new Set(items.filter(item => !eligible(item, ctx)).map(item => item.display));
    const ids = new Set(), glyphs = new Set();
    return items.filter(item => { if (!eligible(item, ctx) || blocked.has(item.display) || ids.has(item.id) || glyphs.has(item.display)) return false; ids.add(item.id); glyphs.add(item.display); return true; });
  }
  const eye = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M7 32Q32 7 57 32Q32 57 7 32Z" fill="#fffaf0" stroke="#4a3620" stroke-width="4"/><circle cx="32" cy="32" r="12" fill="#7fce54" stroke="#4a3620" stroke-width="3"/><circle cx="28" cy="27" r="3" fill="#fffdf7"/></svg>';
  const LIVE_PORTRAIT = [[160,120],[440,140],[150,420],[450,440],[160,690],[440,700]];
  // Water objects live on water; dry props stay on the bank in either orientation.
  const WATER_POSITIONS = {
    lagoon: { portrait:[[160,100],[440,350],[440,560],[440,740],[150,350],[150,700]], landscape:[[160,110],[620,340],[450,500],[650,510],[160,300],[160,510]] },
    river: { portrait:[[160,100],[440,350],[150,330],[150,740],[440,740],[150,540]], landscape:[[160,110],[620,330],[150,360],[170,520],[610,510],[390,280]] }
  };
  function scene(land, letters, portrait = false) {
    const art = ns.HuntPlayArt;
    if (!art) return sceneClassic(land, letters, portrait);
    const L = LANDS[land] || LANDS.meadow;
    const order = portrait ? L.spots.map((s,i)=>[s,i]).sort((a,b)=>a[0][1]-b[0][1]) : L.spots.map((s,i)=>[s,i]);
    const objects = order.map(([[sx,sy,kind],i],k) => {
      const [x,y] = WATER_POSITIONS[land]?.[portrait?'portrait':'landscape']?.[i] || (portrait ? LIVE_PORTRAIT[k] : [sx,sy]), t = art.things[kind], letter = letters[i];
      const [w,h] = t.box;
      const glyph = letter ? `<g class="hunt-label" transform="translate(${t.label.join(' ')})"><text class="hunt-letter" text-anchor="middle" font-family="'Amiri Quran',serif" font-size="64" fill="${INK}" direction="rtl" data-fit-box="0,0,${w},${h},64">${esc(letter.display)}</text></g>` : '';
      const hanging = kind === 'lantern' && y < 300 ? `<path d="M${x} 0V${y-70*(portrait?1.3:1)}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"/>` : '';
      return `${hanging}<g class="hunt-spot${letter?' has-letter':''}" data-spot="${i}" data-kind="${kind}" transform="translate(${x} ${y})${portrait?' scale(1.3)':''}" role="button" tabindex="0" aria-label="${letter?`Letter ${esc(letter.display)}`:`Play with the ${kind}`}">${pad(t)}<g class="hunt-thing">${t.art}${glyph}</g><g class="hunt-reaction" aria-hidden="true" pointer-events="none">${art.reaction?.(kind)||''}</g></g>`;
    }).join('');
    return `<svg class="hunt-scene${portrait?' is-portrait':''}" viewBox="0 0 ${portrait?'600 860':'800 600'}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Find the letter in the picture">${art.background(land,portrait)}${objects}</svg>`;
  }

  class LetterHunt {
    constructor(ctx) {
      this.ctx = ctx; this.alive = true; this.finished = false; this.busy = false; this.waiting = false;
      this.land = ctx.land || 'meadow'; this.items = taughtItems(ctx.items, ctx);
      this.index = 0; this.helped = new Set(); this.found = new Set(); this.collected = []; this.letters = Array(6).fill(null);
      this.flight = null; this.roundToken = 0; this.renderToken = 0; this.speechAttempt = 0; this.missedSpots = new Set();
      const count = ctx.beginner ? 3 : 4;
      const declared = Array.isArray(ctx.targets);
      const plan = declared ? ctx.targets.map(id=>this.items.find(item=>String(item.id)===String(id))).filter(Boolean)
        : ns.PracticeLearning?.plan?.(ctx,this.items,'letter-name',count) || this.items;
      const valid = plan.filter(item=>this.items.some(known=>known.id===item?.id && known.display===item.display));
      this.targets = valid.length ? Array.from({length:count},(_,i)=>valid[i%valid.length]) : [];
      const profiles = valid.map(item=>ns.PracticeLearning?.profile?.(ctx,item,'letter-name') || {choiceCount:2,promptMode:'match'});
      this.choiceCount = Math.min(this.items.length, ctx.choiceCount===2?2:3, ...profiles.map(p=>p.choiceCount===3?3:2));
      this.allowRecall = ctx.allowRecall!==false && !ctx.beginner && profiles.length>0 && profiles.every(p=>p.promptMode==='listen');
      if (this.items.length<2 || !this.targets.length) { this.destroy(); Promise.resolve().then(()=>ctx.cancel?.()); return; }
      this.ask();
      if (typeof ResizeObserver!=='undefined') { this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(ctx.stage); }
    }
    get target() { return this.targets[this.index]; }
    portraitNow() { return (this.ctx.stage.clientHeight||0)>(this.ctx.stage.clientWidth||1)*1.05; }
    resize() { if (!this.alive) return; this.clearScenery();this.clearFlight();if(this.portrait!==this.portraitNow())this.render();else ns.LettersArt?.fitGlyphs?.(this.svg); }
    render() {
      if (!this.alive) return;
      this.clearScenery();this.clearFlight();
      const previousFocus = this.svg?.querySelector?.('.hunt-spot:focus')?.dataset?.spot;
      const previousTool = this.root?.querySelector?.('.hunt-next:focus') ? 'next' : this.root?.querySelector?.('.hunt-help:focus') ? 'helpButton' : null;
      const version = ++this.renderToken; this.portrait=this.portraitNow();
      this.ctx.stage.innerHTML=`<div class="hunt hunt-play${this.portrait?' is-portrait':''}"><div class="hunt-picture">${scene(this.land,this.letters,this.portrait)}</div><div class="hunt-tools"><button class="hunt-help" type="button" aria-label="Show the matching letter">${eye}</button><div class="hunt-basket" role="progressbar" aria-label="Letters found" aria-valuemin="0" aria-valuemax="${this.targets.length}" aria-valuenow="${this.collected.length}"><span class="hunt-basket-weave" aria-hidden="true"></span>${this.targets.map((_,i)=>`<span class="hunt-found${this.collected[i]?' is-filled':''}" aria-hidden="true">${this.collected[i]?`<svg viewBox="-30 -30 60 60"><text text-anchor="middle" font-family="'Amiri Quran',serif" font-size="48" direction="rtl" fill="${INK}" data-fit-box="0,0,38,38,48">${esc(this.collected[i].display)}</text></svg>`:''}</span>`).join('')}</div><button class="hunt-next" type="button" aria-label="${this.index===this.targets.length-1?'Finish finding letters':'Find another letter'}" ${this.busy?'':'hidden'}>${ns.LettersArt?.icon?.(this.index===this.targets.length-1?'check':'next',36)||''}</button></div></div>`;
      this.root=this.ctx.stage.querySelector('.hunt-play'); this.svg=this.root.querySelector('.hunt-scene');this.basket=this.root.querySelector('.hunt-basket');
      this.helpButton=this.root.querySelector('.hunt-help');this.next=this.root.querySelector('.hunt-next');
      this.helpButton.disabled=this.busy;
      this.helpButton.onclick=()=>{if(this.alive&&version===this.renderToken&&!this.busy)this.help(true);};
      this.next.onclick=()=>{if(version===this.renderToken)this.continue();};
      this.svg.querySelectorAll('.hunt-spot').forEach(spot=>{
        const i=Number(spot.dataset.spot);
        spot.classList.toggle('is-found',this.found.has(i));
        spot.classList.toggle('is-hint',this.hint===i);
        const disabled=!!this.letters[i]&&(this.busy||this.waiting||this.missedSpots.has(i));
        spot.setAttribute('aria-disabled',String(disabled));spot.setAttribute('tabindex',disabled?'-1':'0');
        const go=e=>{if(version!==this.renderToken)return;this.keyboard=e?.detail===0||e?.type==='keydown';this.tap(i);};
        spot.addEventListener('click',go);
        spot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go(e);}});
      });
      ns.LettersArt?.fitGlyphs?.(this.root);
      if(previousTool && !this[previousTool].disabled && !this[previousTool].hidden)this[previousTool].focus?.({preventScroll:true});
      else if(previousFocus!=null)this.svg.querySelector(`.hunt-spot[data-spot="${previousFocus}"]`)?.focus?.();
    }
    ask() {
      if (!this.alive || !this.target) return;
      this.roundToken++;this.cancelSpeech();this.busy=false;this.waiting=false;this.misses=0;this.missedSpots.clear();this.hint=null;
      const supported=this.helped.has(this.target.id)||this.ctx.supportedItemIds?.includes(this.target.id);
      this.heard=false;this.assisted=!!supported;this.modelVisible=!!supported||!this.allowRecall||this.ctx.canListen?.()===false;
      const choices=supported?2:this.choiceCount;
      const available=shuffle([0,1,2,3,4,5].filter(i=>!this.found.has(i)));
      const options=shuffle([this.target,...shuffle(this.items.filter(i=>i.id!==this.target.id)).slice(0,choices-1)]);
      this.letters=Array(6).fill(null);options.forEach((item,k)=>{this.letters[available[k]]=item;});
      this.ctx.prompt?.(this.modelVisible?this.target:null);this.ctx.beginRound?.(this.target,'letter-name');
      this.ctx.setRoundProgress?.(this.index+1,this.targets.length);
      this.render();this.speak();
      if(this.keyboard)this.svg.querySelector('.hunt-spot[tabindex="0"]')?.focus?.();
    }
    setWaiting(value) { const changed=this.waiting!==value;this.waiting=value;if(this.alive&&changed)this.render(); }
    cancelSpeech() { this.speechAttempt++;if(this.speechTimer){clearTimeout(this.speechTimer);this.speechTimer=null;} }
    speak() {
      if(!this.alive||this.busy||!this.target)return;
      this.cancelSpeech();const attempt=this.speechAttempt,round=this.roundToken,confirmed=this.heard,needs=!confirmed&&!this.modelVisible;
      if(needs)this.setWaiting(true);
      let result;try{result=this.ctx.say?.(this.target);}catch{result=false;}
      const settle=heard=>{
        if(!this.alive||this.busy||attempt!==this.speechAttempt||round!==this.roundToken)return;
        this.cancelSpeech();this.heard=confirmed||heard===true;
        if(!this.heard&&!this.modelVisible)this.help(true);else this.setWaiting(false);
      };
      if(result?.then){if(needs)this.speechTimer=setTimeout(()=>settle(false),6000);Promise.resolve(result).then(settle,()=>settle(false));}else settle(result===true);
    }
    replayPrompt() { if(!this.alive||!this.target)return;if(this.busy){try{Promise.resolve(this.ctx.say?.(this.target)).catch(()=>{});}catch{}return;}this.help(false);this.speak(); }
    onSoundChange() { if(this.alive&&!this.busy&&this.ctx.canListen?.()===false)this.help(false); }
    help(point=false) {
      if(!this.alive||this.busy)return;
      this.cancelSpeech();this.waiting=false;this.assisted=true;this.modelVisible=true;this.helped.add(this.target.id);this.ctx.prompt?.(this.target);
      if(point)this.hint=this.letters.findIndex(i=>i?.id===this.target.id);
      this.render();
    }
    clearScenery() {
      const play=this.scenery;if(!play)return;
      this.scenery=null;clearTimeout(play.timer);play.spot.removeAttribute?.('data-playing');
    }
    playScenery(spot) {
      if(!this.alive||!spot)return;
      this.clearScenery();
      if(!ns.HuntPlayArt?.reaction?.(spot.dataset.kind)){this.wiggle(spot);return;}
      spot.setAttribute('data-playing',this.ctx.reducedMotion?.()?'still':'motion');
      const play={spot,timer:null};this.scenery=play;
      play.timer=setTimeout(()=>{if(this.scenery===play)this.clearScenery();},1100);
    }
    wiggle(spot, retry = false) {
      if(!spot||this.ctx.reducedMotion?.())return;
      const thing=spot.querySelector('.hunt-thing');thing?.getAnimations?.().forEach(a=>a.cancel());
      const frames = retry ? [{opacity:1},{opacity:.84},{opacity:1}] : [{transform:'none'},{transform:'translateY(-2px)'},{transform:'none'}];
      thing?.animate?.(frames,{duration:420,easing:'ease-in-out'});
    }
    tap(i) {
      if(!this.alive||!Number.isInteger(i)||i<0||i>5)return;
      const spot=this.svg.querySelector(`.hunt-spot[data-spot="${i}"]`),letter=this.letters[i];
      if(!letter||this.found.has(i)){this.playScenery(spot);this.ctx.sfx?.('rustle');return;}
      if(this.busy||this.waiting||this.missedSpots.has(i))return;
      const correct=letter.id===this.target.id,independent=this.heard&&!this.assisted&&this.allowRecall&&!this.modelVisible;
      this.ctx.reportOutcome?.({item:this.target,itemId:this.target.id,activity:'LetterHunt',correct,evidence:independent?'independent_listening':'supported_visible_matching',skill:'letter-name',selectedId:letter.id,choiceIds:this.letters.filter(Boolean).map(key),assisted:this.assisted,independent,round:this.index+1,affectsStrength:true});
      if(!correct){this.missedSpots.add(i);this.misses++;this.help(this.misses>=2||this.choiceCount===2);this.wiggle(this.svg.querySelector(`.hunt-spot[data-spot="${i}"]`),true);this.ctx.sfx?.('softwrong');return;}
      const origin=spot.querySelector('.hunt-face')?.getBoundingClientRect?.();
      this.busy=true;this.waiting=false;this.cancelSpeech();this.hint=null;this.found.add(i);this.collected.push(letter);
      this.letters[i]=null;this.ctx.correct?.();this.ctx.pet?.cheer?.();this.render();
      const found=this.svg.querySelector(`.hunt-spot[data-spot="${i}"]`);this.playScenery(found);this.ctx.confettiAt?.(found);
      this.collectFlight(origin,letter);
      if(this.keyboard)this.next.focus?.({preventScroll:true});
    }
    clearFlight() { const flight=this.flight;if(!flight)return;this.flight=null;flight.animation?.cancel();flight.element.remove();flight.target.style.visibility=''; }
    collectFlight(origin,item) {
      if(this.ctx.reducedMotion?.()||!origin||!this.root?.getBoundingClientRect)return;
      const tags=[...this.basket.querySelectorAll('.hunt-found.is-filled')],target=tags.at(-1);if(!target)return;
      const box=this.root.getBoundingClientRect(),end=target.getBoundingClientRect(),element=document.createElement('span');
      element.className='hunt-flying-letter';element.setAttribute('aria-hidden','true');
      element.innerHTML=`<svg viewBox="-30 -30 60 60"><text text-anchor="middle" font-family="'Amiri Quran',serif" font-size="48" direction="rtl" fill="${INK}" data-fit-box="0,0,38,38,48">${esc(item.display)}</text></svg>`;
      const x=origin.left+origin.width/2,y=origin.top+origin.height/2;
      element.style.left=`${x-box.left-22}px`;element.style.top=`${y-box.top-22}px`;this.root.appendChild(element);ns.LettersArt?.fitGlyphs?.(element);
      target.style.visibility='hidden';
      const dx=end.left+end.width/2-x,dy=end.top+end.height/2-y;
      const animation=element.animate?.([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx*.45}px,${dy*.45-8}px) scale(.84)`,opacity:1},{transform:`translate(${dx}px,${dy}px) scale(.65)`,opacity:1}],{duration:540,easing:'cubic-bezier(.3,.7,.3,1)'});
      this.flight={element,target,animation};const current=this.flight;
      const finish=()=>{if(this.flight===current)this.clearFlight();};
      if(animation?.finished)animation.finished.then(finish,finish);else finish();
    }
    continue() {
      if(!this.alive||!this.busy)return;
      this.busy=false;this.index++;
      if(this.index>=this.targets.length){if(this.finished)return;this.finished=true;this.destroy();this.ctx.done?.();}else this.ask();
    }
    destroy() { if(!this.alive)return;this.alive=false;this.roundToken++;this.renderToken++;this.cancelSpeech();this.observer?.disconnect();this.clearScenery();this.clearFlight();this.root?.querySelectorAll('*').forEach(e=>e.getAnimations?.().forEach(a=>a.cancel())); }
  }

  LetterHunt.LANDS = LANDS;
  LetterHunt.THINGS = THINGS;
  LetterHunt.scene = scene;
  LetterHunt.classic = sceneClassic;
  ns.GardenPractice = ns.GardenPractice || {};
  ns.GardenPractice.LetterHunt = LetterHunt;
})(window.MiftahGame || (window.MiftahGame = {}));
