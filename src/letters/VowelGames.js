// Vowel Hats (v33, 2026-10-03): the Letter Friends idea, carried into the
// vowel marks. Every mark becomes something a friend WEARS, and each is drawn
// along the mark's own handwriting stroke (LettersStrokes.MARKS), so the
// picture keeps teaching the real shape — the same embedded-mnemonic trick the
// friends use for letters:
//   fatha  ـَ  a feather tucked above the head   (a short slant above)
//   kasra  ـِ  a skateboard underneath           (a short slant below)
//   damma  ـُ  a curly snail-shell cap            (the little curl above)
//   sukoon ـْ  a round bubble resting on top      (the small circle)
//   shadda ـّ  a crown                            (the little "w")
//   tanween     two of the same — two feathers, two boards, two curls
// "بُ" is Batta in her snail cap; "بِ" is Batta on her skateboard.
//
// The Hat Shop game: a friend waits, a syllable is heard ("بُ"), and the child
// gives the friend the right thing to wear. When only one mark is taught yet
// (the fatha chapter), the question turns around: two friends wear the same
// feather — which one says "بَ"? Evidence is the syllable skill, honest as
// always: heard + unassisted = independent listening; a miss makes it
// assisted. Nothing is timed or scored.
(function (ns) {
  const INK = "#4a3620";
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const F = () => ns.LetterFriends;
  const S = () => ns.LettersStrokes;
  const MARK_IDS = { "َ": "fatha", "ِ": "kasra", "ُ": "damma", "ْ": "sukoon", "ّ": "shadda", "ً": "fathatan", "ٍ": "kasratan", "ٌ": "dammatan" };
  const MARKS = Object.keys(MARK_IDS);
  const HAT_MARKS = new Set(["َ", "ِ", "ُ", "ً", "ٍ", "ٌ"]);
  const baseOf = (text) => [...String(text || "")].find((c) => F()?.FRIENDS?.[c]) || null;
  const markOf = (text) => MARKS.find((m) => String(text || "").includes(m)) || null;
  const hatItem = (item) => {
    if (!item?.display) return false;
    const chars = [...String(item.display).normalize("NFC").normalize("NFD")];
    return chars.length === 2 && F()?.FRIENDS?.[chars[0]] && chars[0] !== "ا" && HAT_MARKS.has(chars[1]);
  };
  const eligible = (item, ctx) => item && item.id && item.display && item.taught !== false && item.isTaught !== false
    && item.locked !== true && item.unlocked !== false
    && (!ctx.completedWorldIds || !(item.prerequisiteWorldIds || []).some((id) => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));
  const eligibleSyllables = (ctx) => {
    const declared = (ctx.items || []).filter((item) => item?.display);
    const blocked = new Set(declared.filter((item) => !eligible(item, ctx)).map((item) => String(item.display).normalize("NFC")));
    const unique = new Map();
    for (const item of declared) {
      const display = String(item.display).normalize("NFC");
      if (blocked.has(display) || !eligible(item, ctx) || !hatItem({ ...item, display })) continue;
      if (!unique.has(display)) unique.set(display, item.display === display ? item : { ...item, display });
    }
    return [...unique.values()];
  };
  const pairableSyllables = (items) => items.filter((item) => {
    const display = item.display.normalize("NFC"), base = baseOf(display), mark = markOf(display);
    return items.some((other) => other !== item && other.display.normalize("NFC") !== display
      && (baseOf(other.display) === base || markOf(other.display) === mark));
  });
  const learning = () => ns.PracticeLearning;
  const profile = (ctx, item, skill = "syllable") => {
    try { return learning()?.profile?.(ctx, item, skill) || { choiceCount: 2, promptMode: "match" }; }
    catch { return { choiceCount: 2, promptMode: "match" }; }
  };
  const planItems = (ctx, items, skill = "syllable", count = 4) => {
    let planned;
    try { planned = learning()?.plan?.(ctx, items, skill, count); } catch { planned = null; }
    if (!Array.isArray(planned)) return items.slice(0, count);
    const byKey = new Map(items.flatMap((item) => [[item.id, item], [item.display, item]]));
    return [...new Set(planned.map((item) => byKey.get(typeof item === "string" ? item : item?.id || item?.display)).filter(Boolean))].slice(0, count);
  };
  const level = (ctx, items, skill = "syllable") => {
    try { return Math.max(0, Math.min(2, Number(learning()?.level?.(ctx, items, skill)) || 0)); }
    catch { return 0; }
  };

  // The accessory for a mark, in the friend's 0–100 handwriting box. The mark's
  // own stroke is drawn thick in the accessory's colour (with an ink edge), and
  // a few details make it a thing.
  function markArt(mark) {
    const strokes = (S()?.MARKS?.[mark] || []);
    const id = MARK_IDS[mark];
    const color = { fatha: "#ee806f", fathatan: "#ee806f", kasra: "#62cdf4", kasratan: "#62cdf4", damma: "#f3c955", dammatan: "#f3c955", sukoon: "#ccfbef", shadda: "#f3c955" }[id] || "#ee806f";
    const band = (d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" data-ribbon/><path d="${d}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" data-ribbon/>`;
    let extra = "";
    if (id === "fatha" || id === "fathatan") extra = strokes.map((d) => { const m = d.match(/M([\d.]+) ([\d.]+)/); return m ? `<circle cx="${m[1]}" cy="${m[2]}" r="3" fill="#ffe49a" stroke="${INK}" stroke-width="1.6"/>` : ""; }).join("");
    if (id === "kasra" || id === "kasratan") extra = strokes.map((d) => { const n = d.match(/[\d.]+/g).map(Number); const [x1, y1, x2, y2] = n; return `<circle cx="${(x1 + (x2 - x1) * 0.25).toFixed(1)}" cy="${(y1 + (y2 - y1) * 0.25 + 4).toFixed(1)}" r="2.4" fill="${INK}"/><circle cx="${(x1 + (x2 - x1) * 0.75).toFixed(1)}" cy="${(y1 + (y2 - y1) * 0.75 + 4).toFixed(1)}" r="2.4" fill="${INK}"/>`; }).join("");
    if (id === "sukoon") extra = `<circle cx="47" cy="6" r="1.6" fill="#fffdf7"/>`;
    if (id === "shadda") extra = `<circle cx="64" cy="10" r="1.6" fill="#ee806f"/><circle cx="52" cy="6" r="1.6" fill="#ee806f"/><circle cx="40" cy="10" r="1.6" fill="#ee806f"/>`;
    const shine = id === "fatha" ? `<path d="M51 8L47 10" fill="none" stroke="#fffdf7" stroke-width="1.6" stroke-linecap="round" opacity=".82"/>`
      : id === "fathatan" ? `<path d="M53 6L49 8M53 13L49 15" fill="none" stroke="#fffdf7" stroke-width="1.6" stroke-linecap="round" opacity=".82"/>`
      : id === "kasra" ? `<path d="M51 93L47 95" fill="none" stroke="#fffdf7" stroke-width="1.6" stroke-linecap="round" opacity=".82"/>`
      : id === "kasratan" ? `<path d="M53 89L49 91M53 96L49 98" fill="none" stroke="#fffdf7" stroke-width="1.6" stroke-linecap="round" opacity=".82"/>`
      : id === "damma" || id === "dammatan" ? `<path d="M51 6Q48 4 47 8" fill="none" stroke="#fffdf7" stroke-width="1.6" stroke-linecap="round" opacity=".82"/>` : "";
    // Worn 1.5× life size around the mark's own spot, so a small hand sees it.
    const [cx, cy] = ["kasra", "kasratan"].includes(id) ? [51, 94] : [51, 9];
    return `<g class="vh-acc" data-mark="${id}" transform="translate(${cx} ${cy}) scale(1.5) translate(${-cx} ${-cy})">${strokes.map(band).join("")}${shine}${extra}</g>`;
  }

  // A friend wearing a mark: the friend's own art with the accessory added.
  function wearing(char, mark, size = 140) {
    const svg = F()?.art(char, { size }) || "";
    return mark ? svg.replace(/<\/svg>$/, `<g class="vh-on">${markArt(mark)}</g></svg>`) : svg;
  }

  // An accessory on its own, framed so it fills a button.
  function accessory(mark, size = 84) {
    const above = !["ِ", "ٍ"].includes(mark);
    const box = above ? "18 -12 66 40" : "18 76 66 38";
    return `<svg class="vh-thing" viewBox="${box}" width="${size}" height="${size * 0.6}" aria-hidden="true">${markArt(mark)}</svg>`;
  }

  class HatShop {
    constructor(ctx) {
      this.ctx = ctx; this.alive = true; this.timers = []; this.dragResets = [];
      const syllables = eligibleSyllables(ctx);
      this.eligibleSyllables = syllables;
      const known = [...new Set(syllables.map((i) => baseOf(i.display)).filter(Boolean))];
      this.marks = [...new Set(syllables.map((i) => markOf(i.display)).filter(Boolean))];
      // Alif carries no vowel mark of its own (that needs a hamza: أَ), so it
      // never visits the hat shop — the curriculum leaves it out of syllables too.
      this.letters = known.filter((c) => c !== "ا");
      const playable = pairableSyllables(syllables);
      this.queue = planItems(ctx, playable, "syllable", 5);
      this.round = 0;
      ctx.stage.innerHTML = `<div class="vh" role="group" aria-label="The hat shop"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
      this.supportLevel = level(ctx, syllables, "syllable");
      this.choiceCeiling = this.supportLevel >= 1 && !ctx.beginner ? 3 : 2;
      this.visitPromptMode = ctx.canListen?.() === false || ctx.beginner
        || this.queue.some((item) => profile(ctx, item, "syllable").promptMode !== "listen") ? "match" : "listen";
      const hatsEverywhere = this.queue.length && this.queue.every((item) => this.pairsFor(item).hat.length > 1);
      const friendsEverywhere = this.queue.length && this.queue.every((item) => this.pairsFor(item).friend.length > 1);
      this.visitMode = hatsEverywhere ? "hat" : friendsEverywhere ? "friend" : null;
      if (!this.marks.length || !this.queue.length) { ctx.cancel?.(); return; }
      this.next();
    }
    later(fn, ms) { const round = this.roundToken; const t = setTimeout(() => { if (this.alive && (round == null || round === this.roundToken) && this.root?.isConnected !== false) fn(); }, ms); this.timers.push(t); }
    syllable(text) { return { id: text, display: text, speak: text }; }
    setPrompt(item) {
      this.promptToken = (this.promptToken || 0) + 1;
      this.roundToken = (this.roundToken || 0) + 1;
      this.promptItemKey = item && (item.id || item.display);
      this.heard = false;
      this.assisted = false;
      return { round: this.roundToken, prompt: this.promptToken };
    }
    isCurrent(round, prompt = this.promptToken) {
      return this.alive && !this.busy && round === this.roundToken && prompt === this.promptToken && this.root?.isConnected !== false;
    }
    revealReference(round = this.roundToken, prompt = this.promptToken) {
      if (!this.isCurrent(round, prompt)) return false;
      this.assisted = true; this.heard = false;
      const reference = this.root.querySelector(".vh-reference");
      if (reference) { reference.hidden = false; reference.classList.remove("is-hidden"); reference.setAttribute?.("aria-hidden", "false"); }
      return true;
    }
    sayPrompt(it, round = this.roundToken, prompt = this.promptToken) {
      const token = this.promptToken;
      const key = it && (it.id || it.display);
      const isCurrentPrompt = token === prompt && key === this.promptItemKey;
      const record = (heard) => {
        if (!this.isCurrent(round, prompt) || !isCurrentPrompt) return;
        this.heard = heard === true;
        if (heard !== true) this.revealReference(round, prompt);
      };
      let r; try { r = this.ctx.say?.(it); } catch { r = false; }
      if (r?.then) r.then(record, () => record(false));
      else record(r);
      return r;
    }
    say(it) { return this.sayPrompt(it); }
    sayFeedback(it) {
      try { const result = this.ctx.say?.(it); if (result?.then) Promise.resolve(result).catch(() => {}); } catch {}
    }
    pairsFor(item) {
      const char = baseOf(item.display), mark = markOf(item.display);
      const hat = this.eligibleSyllables.filter((entry) => baseOf(entry.display) === char);
      const friend = this.eligibleSyllables.filter((entry) => markOf(entry.display) === mark);
      return { hat, friend };
    }
    isActiveAnswer(token, button, offered) {
      return this.alive && !this.busy && token === this.roundToken && offered === this.offered
        && button?.isConnected !== false && Array.from(this.root.querySelectorAll(".vh-choice")).includes(button);
    }
    wireDrags() {
      this.dragResets.forEach((reset) => reset()); this.dragResets = [];
      const destination = this.root.querySelector("[data-drop-target]");
      if (!destination || !ns.GardenPractice?.draggable) return;
      destination.classList.add("is-drop-ready");
      const round = this.roundToken, offered = this.offered;
      this.root.querySelectorAll(".vh-choice").forEach((button) => {
        const i = Number(button.dataset.i);
        const cue = (event) => {
          if (!this.isActiveAnswer(round, button, offered)) return;
          const r = destination.getBoundingClientRect(), x = event.clientX, y = event.clientY;
          destination.classList.toggle("is-near", x >= r.left - 28 && x <= r.right + 28 && y >= r.top - 28 && y <= r.bottom + 28);
          destination.classList.toggle("is-drop-target", ns.GardenPractice.inside(destination, x, y));
        };
        const clearCue = () => destination.classList.remove("is-drop-target", "is-near");
        button.addEventListener("pointermove", cue);
        button.addEventListener("pointerup", clearCue);
        button.addEventListener("pointercancel", clearCue);
        const reset = ns.GardenPractice.draggable(button, {
          enabled: () => this.isActiveAnswer(round, button, offered),
          onDragMove: (x, y) => {
            const r = destination.getBoundingClientRect();
            destination.classList.toggle("is-near", x >= r.left - 28 && x <= r.right + 28 && y >= r.top - 28 && y <= r.bottom + 28);
            destination.classList.toggle("is-drop-target", ns.GardenPractice.inside(destination, x, y));
          },
          onDragEnd: () => destination.classList.remove("is-drop-target", "is-near"),
          drop: (x, y) => {
            if (!this.isActiveAnswer(round, button, offered)) return false;
            const r = destination.getBoundingClientRect();
            if (x < r.left - 28 || x > r.right + 28 || y < r.top - 28 || y > r.bottom + 28) return false;
            return this.pick(i, button, round, offered);
          },
        });
        if (reset) this.dragResets.push(reset);
      });
    }
    next() {
      if (this.round >= this.queue.length) return this.finish();
      const item = this.queue[this.round], target = item.display;
      this.target = target; this.targetItem = item; this.char = baseOf(target); this.mark = markOf(target);
      this.missed = false; this.assisted = false; this.heard = false; this.busy = false;
      const tokens = this.setPrompt(item), roundToken = tokens.round;
      this.roundProfile = profile(this.ctx, item, "syllable");
      this.promptMode = this.visitPromptMode;
      const pairs = this.pairsFor(item);
      const desired = this.visitMode || (this.mode && (this.mode === "hat" ? pairs.hat.length : pairs.friend.length) > 1 ? this.mode : pairs.hat.length > 1 ? "hat" : "friend");
      this.mode = desired;
      const sourceChoices = this.mode === "hat" ? pairs.hat : pairs.friend;
      const pairChoices = [...new Map(sourceChoices.map((entry) => [entry.display.normalize("NFC"), entry])).values()];
      const requested = Math.min(this.choiceCeiling, Math.max(2, Number(this.roundProfile.choiceCount) || 2));
      const n = Math.max(2, Math.min(pairChoices.length, requested));
      const targetChoice = pairChoices.find((entry) => entry.display.normalize("NFC") === target.normalize("NFC"));
      const others = shuffle(pairChoices.filter((entry) => entry !== targetChoice)).slice(0, n - 1);
      this.offeredItems = shuffle([targetChoice, ...others].filter(Boolean));
      this.offered = this.offeredItems.map((entry) => this.mode === "hat" ? markOf(entry.display) : baseOf(entry.display));
      if (this.mode === "hat") {
        this.root.innerHTML = `
          <div class="vh-reference${this.promptMode === "listen" ? " is-hidden" : ""}"${this.promptMode === "listen" ? " hidden aria-hidden=\"true\"" : ""} dir="rtl" lang="ar">${target}</div>
          <div class="vh-nook"><span class="vh-nook-art" aria-hidden="true">${ns.WordWardrobeArt?.dressingNook?.() || ""}</span><div class="vh-stage"><span class="vh-friend" data-drop-target>${wearing(this.char, null, 170)}</span></div></div>
          <div class="vh-shelf">${this.offered.map((m, i) => `<button type="button" class="vh-choice" data-i="${i}" aria-label="${MARK_IDS[m]}">${accessory(m)}</button>`).join("")}</div>
          ${this.dots()}`;
      } else {
        this.root.innerHTML = `
          <div class="vh-reference${this.promptMode === "listen" ? " is-hidden" : ""}"${this.promptMode === "listen" ? " hidden aria-hidden=\"true\"" : ""} dir="rtl" lang="ar">${target}</div>
          <div class="vh-nook"><span class="vh-nook-art" aria-hidden="true">${ns.WordWardrobeArt?.dressingNook?.() || ""}</span><div class="vh-target-slot" data-drop-target aria-label="Waiting friend"></div></div>
          <div class="vh-shelf is-friends">${this.offeredItems.map((entry, i) => `<button type="button" class="vh-choice is-friend" data-i="${i}" aria-label="${entry.display}">${wearing(this.charForMode(entry), this.markForMode(entry), 120)}</button>`).join("")}</div>
          ${this.dots()}`;
      }
      this.root.querySelectorAll(".vh-choice").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b, roundToken, this.offered)));
      this.wireDrags();
      this.ctx.beginRound?.(item, "syllable");
      this.ctx.prompt?.(this.promptMode === "match" ? item : null);
      this.later(() => this.sayPrompt(item, roundToken, tokens.prompt), 350);
      this.later(() => { if (!this.heard) this.revealReference(roundToken, tokens.prompt); }, 5000);
    }
    charForMode(item) { return this.mode === "hat" ? this.char : baseOf(item.display); }
    markForMode(item) { return this.mode === "hat" ? markOf(item.display) : this.mark; }
    dots() { return `<div class="pz-progress" aria-hidden="true">${this.queue.map((_, i) => `<i class="${i < this.round ? "is-done" : i === this.round ? "is-on" : ""}"></i>`).join("")}</div>`; }
    replayPrompt() {
      if (!this.alive || !this.targetItem) return;
      this.revealReference(this.roundToken, this.promptToken);
      this.ctx.prompt?.(this.targetItem);
      this.sayPrompt(this.targetItem, this.roundToken, this.promptToken);
    }
    pick(i, btn, token = this.roundToken, offered = this.offered) {
      if (!this.isActiveAnswer(token, btn, offered) || !Number.isInteger(i) || i < 0 || i >= this.offeredItems.length) return false;
      const choiceItem = this.offeredItems[i];
      const chosenText = choiceItem.display;
      const correct = chosenText.normalize("NFC") === this.target.normalize("NFC");
      const independent = this.promptMode === "listen" && !this.missed && !this.assisted && this.heard === true;
      const promptSupported = this.promptMode === "match" || this.assisted || this.heard === true;
      this.ctx.reportOutcome?.({ item: this.targetItem, itemId: this.targetItem.id, activity: "HatShop", skill: "syllable", correct,
        evidence: independent ? "independent_listening" : "supported_visible_matching", assisted: !independent,
        selectedId: choiceItem.id, choiceIds: this.offeredItems.map((entry) => entry.id), affectsStrength: promptSupported });
      // Feedback speech is deliberately isolated from prompt confidence.
      this.sayFeedback(choiceItem);
      if (!correct) {
        this.missed = true;
        this.ctx.sfx?.("softwrong");
        if (!this.ctx.reducedMotion?.()) btn.animate?.([{ rotate: "0deg" }, { rotate: "-8deg" }, { rotate: "8deg" }, { rotate: "0deg" }], { duration: 360 });
        this.root.querySelectorAll(".vh-choice").forEach((b, k) => b.classList.toggle("is-hint", (this.mode === "hat" ? this.offered[k] === this.mark : this.offered[k] === this.char)));
        this.later(() => this.sayPrompt(this.targetItem, token, this.promptToken), 900);
        return true;
      }
      this.busy = true;
      if (this.mode === "hat") {
        // The hat flies onto the friend.
        const friend = this.root.querySelector(".vh-friend");
        if (!friend || friend.isConnected === false) return false;
        friend.innerHTML = wearing(this.char, this.mark, 170);
        friend.classList.add("is-dressed");
        btn.classList.add("is-taken");
      } else {
        const slot = this.root.querySelector(".vh-target-slot");
        if (!slot) return false;
        slot.innerHTML = wearing(this.char, this.mark, 140);
        slot.classList.add("is-arrived", "is-arriving");
        this.later(() => slot.classList.remove("is-arriving"), 620);
        btn.classList.add("is-right");
      }
      this.ctx.tryon?.();
      this.ctx.sfx?.("tryon");
      this.ctx.correct?.();
      this.ctx.confettiAt?.(btn);
      this.ctx.pet?.cheer?.();
      this.later(() => this.ctx.sfx?.(F().get(this.char).call), 500);
      this.later(() => this.sayPrompt(this.targetItem, token, this.promptToken), 1100);
      this.round += 1;
      this.later(() => this.next(), 2700);
      return true;
    }
    finish() { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 800); }
    destroy() { this.alive = false; this.roundToken = (this.roundToken || 0) + 1; this.promptToken = (this.promptToken || 0) + 1; this.timers.forEach(clearTimeout); this.dragResets.forEach((reset) => reset()); this.dragResets = []; }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  ns.GardenPractice.HatShop = HatShop;
  ns.VowelGames = { MARK_IDS, markArt, wearing, accessory, baseOf, markOf, hatItem, eligibleSyllables, KINDS: ["HatShop"] };
})(window.MiftahGame || (window.MiftahGame = {}));
