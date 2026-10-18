// The Story of the Garden (v30, 2026-10-02): a reason to cross the map.
//
// Teach Your Monster's lesson: a short story, told once and woven through,
// turns a list of lessons into a journey. Ours, wordless:
//   A big wind blew through the garden one night. It lifted every friend's
//   letter and scattered them across the lands, and the friends — who are
//   their letters — were carried off with them. The pet is left alone. But
//   every letter learned brings its friend home, and the colour comes back.
//
// What it adds, none of it a gate:
//   • the wind story, once, on the first visit to the map (replayable);
//   • each land on the map returns from pale to full colour as its chapters
//     are finished — restoration, never a lock; the palest is still gentle;
//   • the Friends' Garden: every friend who has come home lives there; the
//     ones still on their way are a little empty burrow, never a grey ghost;
//   • a homecoming parade on the map the first time a land is finished;
//   • the Bismillah graduation (owner-approved 2026-10-02): when every chapter
//     is done, all the friends gather, Mishary Alafasy recites بِسْمِ ٱللَّهِ
//     ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ word by word, the child reads it after him, and the
//     garden celebrates. Reverent first, joyful after — no confetti over the
//     recitation. A golden Bismillah keepsake stays in the Friends' Garden.
(function (ns) {
  const F = () => ns.LetterFriends;
  const STORY_KEY = "quran-trainer:letters:story-seen";
  const HOME_KEY = "quran-trainer:letters:lands-home";
  const GRAD_KEY = "quran-trainer:letters:graduated";
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const BISMILLAH = ["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَـٰنِ", "ٱلرَّحِيمِ"].map((arabic, i) => ({ display: arabic, speak: arabic, audioPath: `wbw/001_001_00${i + 1}.mp3` }));

  const HOUSE = `<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true"><path d="M8 22L24 8L40 22V40H8Z" fill="#ffa798" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><path d="M19 40V29H29V40" fill="#c25a49" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><path d="M4 24L24 6L44 24" fill="none" stroke="#c25a49" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  // v58: an empty plot was a dark hole — a bed of 28 holes told a new child
  // "you have nothing". It is now a little mound with a sprout waiting: a
  // friend is on the way, and the garden is already growing.
  const BURROW = `<svg viewBox="0 0 100 70" aria-hidden="true"><path d="M6 64Q10 30 50 28Q90 30 94 64Z" fill="#b7e779"/><path d="M26 64Q30 46 50 45Q70 46 74 64Z" fill="#c9bda4" stroke="#a89478" stroke-width="2.4" stroke-linejoin="round"/><path d="M50 50Q50 40 51 32" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/><path d="M51 36Q40 34 37 25Q48 24 51 34Z" fill="#7fce54" stroke="#2f5c46" stroke-width="1.6" stroke-linejoin="round"/><path d="M51 33Q60 27 66 30Q61 39 51 36Z" fill="#7fce54" stroke="#2f5c46" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  // v58: a friend who is home stands on its own little mound of soil and
  // grass (the ones on the way already have a sprout mound) — the bed reads
  // as a garden with residents, not a grid of icons.
  const MOUND = `<svg viewBox="0 0 100 30" aria-hidden="true"><ellipse cx="50" cy="22" rx="44" ry="7" fill="#70501b" opacity=".25"/><path d="M8 22Q14 8 50 8Q86 8 92 22Q50 30 8 22Z" fill="#a89478" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><path d="M14 14Q30 6 50 6Q70 6 86 14Q70 11 50 11Q30 11 14 14Z" fill="#7fce54"/><path d="M22 10L20 4M26 9L27 3M74 9L76 3M78 10L81 5" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/></svg>`;
  // A wooden plant label on a stake, with the letter whose plot this is.
  const plotLabel = (c) => `<svg viewBox="0 0 30 40" aria-hidden="true"><path d="M15 28V39" stroke="#70501b" stroke-width="3" stroke-linecap="round"/><rect x="2" y="2" width="26" height="27" rx="5" fill="#fffaf0" stroke="#70501b" stroke-width="2.4"/><text x="15" y="18" text-anchor="middle" font-family="'Amiri Quran', serif" font-size="15" fill="#a89478" direction="rtl">${c}</text></svg>`;
  const SCROLL = `<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M18 14H102V76H18Z" fill="#ffe49a" stroke="#70501b" stroke-width="3"/><path d="M12 10Q18 4 24 10V80Q18 86 12 80Z M96 10Q102 4 108 10V80Q102 86 96 80Z" fill="#f3c955" stroke="#70501b" stroke-width="3" stroke-linejoin="round"/><path d="M34 46Q46 34 60 46T86 46" fill="none" stroke="#c69434" stroke-width="4" stroke-linecap="round"/></svg>`;
  const WIND = `<svg class="sg-wind" viewBox="0 0 300 200" aria-hidden="true"><g fill="none" stroke="#fffdf7" stroke-width="6" stroke-linecap="round" opacity=".85"><path d="M-20 60Q60 30 120 60T260 50Q300 40 290 20"/><path d="M-30 110Q70 80 150 110T320 100"/><path d="M-10 160Q80 140 160 160T310 150Q330 140 320 120"/></g></svg>`;

  const methods = {
    // Letters in finished packs: their friends are home.
    homeFriends() {
      const known = new Set((this.petKnowledge?.() || []).map((l) => l.char));
      return (F()?.CHARS || []).filter((c) => known.has(c));
    },

    // How restored each land is, 0..1: the share of its chapters finished.
    landRestoration() {
      const out = {};
      const by = {};
      for (const w of this.worlds?.worlds || []) { const land = w.biome || "meadow"; (by[land] ||= []).push(w); }
      const done = this.progress?.done || [];
      for (const [land, list] of Object.entries(by)) out[land] = list.filter((w) => done.includes(w.id)).length / list.length;
      return out;
    },

    // Called at the end of renderHome with the map's own geometry.
    storyOnMap(el, { worlds, yOf, gap, welcome }) {
      if (!el?.isConnected && el?.isConnected !== undefined) return;
      const places = el.querySelector?.(".map-play-places");
      if (places && typeof places.insertAdjacentHTML === "function" && !places.querySelector(".map-friends-garden")) {
        places.insertAdjacentHTML("beforeend", `<button type="button" class="map-friends-garden" aria-label="The friends' garden">${HOUSE}${this.homeFriends().length ? `<span class="sg-count" aria-hidden="true">${this.homeFriends().length}</span>` : ""}</button>`);
        places.querySelector(".map-friends-garden").onclick = () => { this.sound.play("page"); this.renderFriendsGarden(); };
      }
      // The pale wash over lands still waiting for their friends.
      const path = el.querySelector?.(".map-path");
      const scape = path?.querySelector(".map-landscape");
      if (path && scape && typeof scape.insertAdjacentHTML === "function") {
        const restored = this.landRestoration();
        const runs = [];
        worlds.forEach((w, i) => { const land = w.biome || "meadow"; const last = runs[runs.length - 1]; if (last && last.land === land) last.to = i; else runs.push({ land, from: i, to: i }); });
        path.querySelectorAll(".sg-wash").forEach((n) => n.remove());
        scape.insertAdjacentHTML("afterend", runs.map((r) => {
          const top = yOf(r.to) - gap / 2, bottom = yOf(r.from) + gap / 2;
          const pale = (1 - (restored[r.land] || 0)) * 0.42;
          return pale > 0.01 ? `<div class="sg-wash" data-land="${r.land}" style="top:${top}px;height:${bottom - top}px;opacity:${pale.toFixed(3)}" aria-hidden="true"></div>` : "";
        }).join(""));
      }
      // One story moment per visit, in order of importance.
      const allDone = (this.progress?.done || []).length && worlds.every((w) => (this.progress.done || []).includes(w.id));
      const later = (fn, ms) => setTimeout(() => { if (el.isConnected && this.root?.contains?.(el)) fn(); }, ms);
      if (allDone && !this.loadJSON(GRAD_KEY, null)) return later(() => this.renderGraduation(), welcome ? 4200 : 900);
      const restored = this.landRestoration();
      const home = this.loadJSON(HOME_KEY, []);
      const fresh = Object.keys(restored).find((land) => restored[land] >= 1 && !home.includes(land));
      if (fresh) return later(() => this.playHomecoming(el, fresh), welcome ? 4200 : 700);
      if (!this.loadJSON(STORY_KEY, false)) later(() => this.renderWindStory(() => this.renderHome()), welcome ? 4200 : 600);
    },

    // ---------- the wind story ----------
    renderWindStory(onDone) {
      this.saveJSON(STORY_KEY, true);
      const friends = (F()?.CHARS || []).slice(1, 7); // starting with the duck, ب
      const el = this.screen("lg-meet lg-story", `${this.topBar()}<div class="sg-story">
        <div class="sg-scene is-page-0">
          <div class="sg-sky"></div>
          ${WIND}
          <div class="sg-friends">${friends.map((c, i) => `<span class="sg-friend" style="--i:${i}">${F().art(c, { size: 60 })}</span>`).join("")}</div>
          <span class="sg-pet">${this.petSVG(96)}</span>
        </div>
        <button type="button" class="lg-big-btn sg-next" aria-label="Next">${ns.LettersArt.icon("next", 34)}</button>
      </div>`);
      this.wireTopBar(el, onDone);
      const scene = el.querySelector(".sg-scene");
      let page = 0;
      const pages = [
        () => { this.sound.play("chime"); },
        () => { this.sound.play("rustle"); this.sound.play("pour"); },
        () => { this.sound.play("creak"); },
        () => { this.sound.play("glow"); this.say(F().item("ب")); },
      ];
      const go = () => {
        if (!el.isConnected) return;
        if (page >= pages.length - 1) { this.sound.play("cheer2"); return onDone?.(); }
        page += 1;
        scene.className = `sg-scene is-page-${page}`;
        pages[page]();
      };
      pages[0]();
      el.querySelector(".sg-next").onclick = go;
      return el;
    },

    // ---------- a land's friends come home ----------
    playHomecoming(el, land) {
      if (!el.isConnected) return;
      this.saveJSON(HOME_KEY, [...new Set([...this.loadJSON(HOME_KEY, []), land])]);
      const packs = (this.worlds?.worlds || []).filter((w) => (w.biome || "meadow") === land && w.kind === "letters");
      let chars = packs.flatMap((w) => (w.meet || []).map((m) => m.display)).filter((c) => F()?.FRIENDS?.[c]);
      if (!chars.length) chars = this.homeFriends().slice(-5);
      const wash = el.querySelector(`.sg-wash[data-land="${land}"]`);
      if (wash) wash.style.opacity = "0";
      el.insertAdjacentHTML("beforeend", `<div class="sg-parade" aria-hidden="true">${chars.slice(0, 7).map((c, i) => `<span style="--i:${i}">${F().art(c, { size: 84 })}</span>`).join("")}</div>`);
      const parade = el.querySelector(".sg-parade");
      this.sound.play("cheer2");
      chars.slice(0, 7).forEach((c, i) => setTimeout(() => el.isConnected && this.sound.play(F().get(c).call), 500 + i * 380));
      this.confettiAt(parade);
      setTimeout(() => parade.remove(), this.prefersReducedMotion() ? 2200 : 4600);
    },

    // ---------- the Friends' Garden ----------
    renderFriendsGarden() {
      const home = new Set(this.homeFriends());
      const graduated = this.loadJSON(GRAD_KEY, null);
      const el = this.screen("lg-meet lg-friends-garden", `${this.topBar()}<div class="sg-garden">
        <div class="sg-garden-tools">
          <button type="button" class="lg-round-btn sg-replay-story" aria-label="Tell the wind story again">${WIND}</button>
          ${graduated ? `<button type="button" class="sg-keepsake" aria-label="The Bismillah keepsake">${SCROLL}</button>` : ""}
        </div>
        ${home.size ? `<div class="sg-meadow" aria-label="Your friends at play">${this.meadowFriends([...home]).map((c, i) => `<button type="button" class="sg-roamer" data-c="${c}" style="left:${14 + i * (72 / Math.max(1, Math.min(6, home.size) - 1 || 1))}%" aria-label="${F().get(c).en}">${F().art(c, { size: 70 })}</button>`).join("")}</div>` : ""}
        <div class="sg-fence" aria-hidden="true"></div>
        <div class="sg-plots">${(F()?.CHARS || []).map((c) => home.has(c)
          ? `<button type="button" class="sg-plot is-home" data-char="${c}" aria-label="${F().get(c).en}"><span class="sg-mound" aria-hidden="true">${MOUND}</span>${F().art(c, { size: 84 })}</button>`
          : `<button type="button" class="sg-plot" data-char="${c}" aria-label="On the way home">${BURROW}<span class="sg-label" aria-hidden="true">${plotLabel(c)}</span></button>`).join("")}</div>
      </div>`);
      this.wireTopBar(el, () => (ns.VillageArt ? this.renderVillage() : this.renderHome()));
      el.querySelector(".sg-replay-story").onclick = () => this.renderWindStory(() => this.renderFriendsGarden());
      el.querySelector(".sg-keepsake")?.addEventListener("click", () => this.renderGraduation({ replay: true }));
      this.wireMeadow(el);
      el.querySelectorAll(".sg-plot").forEach((b) => b.addEventListener("click", () => {
        const c = b.dataset.char;
        if (!b.classList.contains("is-home")) { if (!this.prefersReducedMotion()) b.animate?.([{ transform: "none" }, { transform: "translateY(-4px)" }, { transform: "none" }], { duration: 300 }); this.sound.play("rustle"); return; }
        this.sound.play(F().get(c).call);
        setTimeout(() => el.isConnected && this.say(F().item(c)), 420);
      }));
      return el;
    },

    // ---------- the living meadow (v60, 2026-10-16) ----------
    // The friends a child has brought home used to stand still in a grid.
    // Now up to six of them (a different group each day) play in a meadow
    // above the plots: they stroll about, and when two meet they dance —
    // letter siblings that share a shape (ب ت ث) share a heart, which quietly
    // teaches that they are family. Tap one: its move, its name.
    meadowFriends(home) {
      if (home.length <= 6) return home;
      const day = Math.floor(Date.now() / 86400000), out = [];
      for (let k = 0; out.length < 6 && k < home.length; k += 1) out.push(home[(day * 5 + k * 7) % home.length]);
      return [...new Set(out)].concat(home.filter((c) => !out.includes(c))).slice(0, 6);
    },
    wireMeadow(el) {
      const meadow = el.querySelector(".sg-meadow");
      if (!meadow) return;
      const P = ns.PuzzleGames, Fr = F();
      const kin = (a, b) => !!P?.bodyKey && P.bodyKey(a) && P.bodyKey(a) === P.bodyKey(b);
      const still = () => this.prefersReducedMotion();
      const dance = (b) => { const svg = b.querySelector("svg.lf"); if (!svg || still()) return; svg.classList.remove("is-wiggle"); void svg.getBoundingClientRect(); svg.classList.add("is-wiggle"); setTimeout(() => svg.classList.remove("is-wiggle"), 950); };
      const pop = (b, kind) => {
        const m = document.createElement("span");
        m.className = `sg-meet sg-meet-${kind}`; m.setAttribute("aria-hidden", "true");
        m.innerHTML = kind === "heart"
          ? `<svg viewBox="0 0 24 22"><path d="M12 20Q2 13 2 7Q2 2 7 2Q10 2 12 5Q14 2 17 2Q22 2 22 7Q22 13 12 20Z" fill="#ee806f" stroke="#4a3620" stroke-width="1.6"/></svg>`
          : `<svg viewBox="0 0 24 24"><path d="M9 18V5L19 3V16" fill="none" stroke="#4a3620" stroke-width="2.4"/><ellipse cx="6.5" cy="18" rx="3.5" ry="3" fill="#b49fcf" stroke="#4a3620" stroke-width="1.6"/><ellipse cx="16.5" cy="16" rx="3.5" ry="3" fill="#b49fcf" stroke="#4a3620" stroke-width="1.6"/></svg>`;
        m.style.left = b.style.left;
        meadow.appendChild(m);
        setTimeout(() => m.remove(), 1400);
      };
      // Only the friends shown at this size play (phones show four); they
      // start spread evenly across the meadow.
      const roamers = [...meadow.querySelectorAll(".sg-roamer")].filter((b) => getComputedStyle(b).display !== "none");
      roamers.forEach((b, k) => { b.style.left = `${(roamers.length === 1 ? 50 : 12 + (k * 76) / (roamers.length - 1)).toFixed(1)}%`; });
      roamers.forEach((b) => b.addEventListener("click", () => {
        if (!el.isConnected) return;
        dance(b);
        this.sound.play(Fr.get(b.dataset.c).call);
        setTimeout(() => el.isConnected && this.say(Fr.item(b.dataset.c)), 420);
      }));
      if (still() || roamers.length < 1) return;
      const at = (b) => parseFloat(b.style.left) || 50;
      const step = () => {
        if (!el.isConnected) return;
        const b = roamers[Math.floor(Math.random() * roamers.length)];
        const from = at(b), to = Math.max(8, Math.min(92, from + (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 26)));
        b.style.setProperty("--face", to < from ? "-1" : "1");
        b.classList.add("is-walking");
        b.style.left = `${to.toFixed(1)}%`;
        setTimeout(() => {
          if (!el.isConnected) return;
          b.classList.remove("is-walking");
          // Two friends side by side meet: a dance, and a heart for family.
          const mate = roamers.find((o) => o !== b && Math.abs(at(o) - to) < 11);
          if (mate) { dance(b); dance(mate); pop(b, kin(b.dataset.c, mate.dataset.c) ? "heart" : "note"); }
        }, 1700);
        meadow._t = setTimeout(step, 1600 + Math.random() * 1600);
      };
      meadow._t = setTimeout(step, 1200);
    },

    // ---------- the Bismillah graduation ----------
    renderGraduation({ replay = false } = {}) {
      const friends = this.homeFriends();
      const el = this.screen("lg-meet lg-graduation", `${this.topBar()}<div class="sg-grad">
        <div class="sg-grad-friends" aria-hidden="true">${friends.map((c, i) => `<span style="--i:${i}">${F().art(c, { size: 46 })}</span>`).join("")}</div>
        <div class="sg-rehal">
          <div class="sg-bismillah" dir="rtl" lang="ar">${BISMILLAH.map((w, i) => `<button type="button" class="sg-bword" data-i="${i}" aria-label="Hear ${w.display}">${w.display}</button>`).join(" ")}</div>
        </div>
        <span class="sg-grad-pet">${this.petSVG(110)}</span>
        <div class="sg-grad-end" hidden>
          <span class="sg-scroll">${SCROLL}</span>
          <button type="button" class="lg-big-btn sg-grad-done" aria-label="Back to the garden">${ns.LettersArt.icon("check", 34)}</button>
        </div>
      </div>`);
      this.wireTopBar(el, () => this.renderHome());
      const words = [...el.querySelectorAll(".sg-bword")];
      const light = (i, cls) => words.forEach((w, k) => { w.classList.toggle(cls, k === i); });
      const sayWord = (w) => new Promise((ok) => { const t = setTimeout(ok, 6000); this.say(w, () => { clearTimeout(t); ok(); }); });
      words.forEach((b, i) => b.addEventListener("click", () => { if (this._gradBusy) return; light(i, "is-reading"); this.say(BISMILLAH[i]); }));
      const run = async () => {
        this._gradBusy = true;
        await wait(1200);
        // 1. Listen: the reciter, word by word.
        for (let i = 0; i < BISMILLAH.length; i += 1) {
          if (!el.isConnected) return;
          light(i, "is-reading");
          await sayWord(BISMILLAH[i]);
          words[i].classList.add("is-read");
          await wait(200);
        }
        light(-1, "is-reading");
        await wait(1400);
        // 2. The child's turn: each word glows in its own time to read aloud.
        el.querySelector(".sg-grad").classList.add("is-your-turn");
        for (let i = 0; i < BISMILLAH.length; i += 1) {
          if (!el.isConnected) return;
          light(i, "is-yours");
          await wait(2200);
        }
        light(-1, "is-yours");
        this._gradBusy = false;
        if (!el.isConnected) return;
        // 3. Then, and only then, the celebration.
        el.querySelector(".sg-grad").classList.add("is-celebrating");
        el.querySelector(".sg-grad-end").hidden = false;
        el.querySelector(".sg-grad-end").scrollIntoView?.({ block: "nearest", behavior: this.prefersReducedMotion() ? "auto" : "smooth" });
        this.sound.play("fanfare");
        this.confettiAt(el.querySelector(".sg-rehal"), true);
        if (!replay) {
          this.saveJSON(GRAD_KEY, { at: new Date().toISOString().slice(0, 10) });
          ns.LettersAnalytics?.graduated();
        }
      };
      el.querySelector(".sg-grad-done").onclick = () => this.renderFriendsGarden();
      run();
      return el;
    },
  };

  if (ns.LettersGame) Object.assign(ns.LettersGame.prototype, methods);
  ns.StoryGarden = { BISMILLAH, STORY_KEY, HOME_KEY, GRAD_KEY, methods };
})(window.MiftahGame || (window.MiftahGame = {}));
